const cfg=window.TI_CONFIG||{};const sb=window.supabase?.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);let settings={},products=[],categories=[],orders=[],banners=[],editingProductId=null; let savingProduct=false; let savingBanner=false;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));const money=n=>`৳${Number(n||0).toLocaleString('en-BD')}`;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function openModal(h){$('#modalBox').innerHTML=h;$('#modal').classList.add('show')}function closeModal(){$('#modal').classList.remove('show')}
async function login(){const email=$('#loginEmail').value.trim(),password=$('#loginPassword').value;$('#loginMsg').textContent='Logging in...';const {error}=await sb.auth.signInWithPassword({email,password});if(error){$('#loginMsg').textContent=error.message;return}await boot()}
async function boot(){if(!sb){$('#loginMsg').textContent='config.js পূরণ করুন';return}const {data:{session}}=await sb.auth.getSession();if(!session){$('#login').classList.remove('hidden');return}const {data:isAdmin,error}=await sb.rpc('is_admin');if(error||!isAdmin){await sb.auth.signOut();$('#loginMsg').textContent='এই account admin নয়।';return}$('#login').classList.add('hidden');$('#app').classList.remove('hidden');await loadAll()}
async function loadAll(){
  if(!sb){toast('Supabase config পাওয়া যায়নি');return}
  const results=await Promise.allSettled([
    sb.from('settings').select('*').eq('id',true).maybeSingle(),
    sb.from('categories').select('*').order('name'),
    sb.from('products').select('*, product_variants(*)').order('created_at',{ascending:false}),
    sb.from('orders').select('*, order_items(*)').order('created_at',{ascending:false}),
    sb.from('banners').select('*').order('sort_order').order('created_at',{ascending:false})
  ]);
  const [sr,cr,pr,orr,br]=results;
  const errors=[];
  if(sr.status==='fulfilled' && !sr.value.error) settings=sr.value.data||settings; else errors.push('settings');
  if(cr.status==='fulfilled' && !cr.value.error) categories=cr.value.data||[]; else errors.push('categories');
  if(pr.status==='fulfilled' && !pr.value.error) products=pr.value.data||[]; else errors.push('products');
  if(orr.status==='fulfilled' && !orr.value.error) orders=orr.value.data||[]; else errors.push('orders');
  if(br.status==='fulfilled' && !br.value.error) banners=br.value.data||[]; else errors.push('banners');
  fillSettings();renderStats();renderProducts();renderOrders();renderRecent();renderBanners();renderCategories();
  if(errors.length) toast('ডাটাবেসের কিছু অংশ লোড হয়নি: '+errors.join(', ')+'. Supabase/SETUP_DATABASE.sql একবার Run করুন।');
}
function showPage(p){document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));$('#page-'+p).classList.remove('hidden');document.querySelectorAll('.sideitem[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('#pageTitle').textContent={overview:'Overview',products:'Products',orders:'Orders',banners:'Slider',settings:'Settings'}[p]||p;if(p==='orders')loadOrders();if(p==='banners')renderBanners()}
function renderStats(){
const activeOrders=orders.filter(o=>!['cancelled','returned'].includes(o.status));
const revenue=activeOrders.reduce((a,o)=>a+Number(o.subtotal||0),0);
const profit=activeOrders.reduce((sum,o)=>sum+(o.order_items||[]).reduce((x,i)=>{
const cost=Number(i.purchase_price??0);
const total=Number(i.total_price??(Number(i.unit_price||0)*Number(i.quantity||0)));
return x+(total-(cost*Number(i.quantity||0)));
},0),0);
const pending=orders.filter(o=>o.status==='pending').length;
const stock=products.reduce((a,p)=>a+Number(p.stock||0)+(p.product_variants||[]).reduce((x,v)=>x+Number(v.stock||0),0),0);
$('#stats').innerHTML=[['Revenue',money(revenue)],['Order',orders.length],['Pending',pending],['Current Stock',stock],['Gross Profit',money(profit)],['Products',products.length]].map(x=>`<div class="stat"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join('')
}
function renderRecent(){const arr=orders.slice(0,8);$('#recentOrders').innerHTML=orderTable(arr)}
function renderOrders(){const el=$('#orderTable');if(el)el.innerHTML=orderTable(orders)}
function areaLabel(a){return ({dhaka_city:'ঢাকা সিটির মধ্যে',dhaka_suburban:'ঢাকা সাব-আরবান',outside:'ঢাকার বাইরে',dhaka:'ঢাকা সিটির মধ্যে'})[a]||a||''}
function statusLabel(s){return ({pending:'Pending',confirmed:'Confirmed',processing:'Processing',shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',returned:'Returned'})[s]||s||'Unknown'}
function orderTable(arr){if(!arr.length)return '<div class="empty">কোনো অর্ডার নেই।</div>';return `<table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Details</th><th>Date</th></tr></thead><tbody>${arr.map(o=>`<tr><td><b>${esc(o.order_number||o.id)}</b></td><td>${esc(o.customer_name||'')}<br><span class="mini">${esc(o.phone||o.customer_phone||'')} · ${esc(o.thana||'')} · ${esc(o.district||'')}</span></td><td>${money(o.total||o.total_amount)}</td><td>${esc(o.payment_method||'')}${(o.delivery_area||o.area_type)?`<br><span class="mini">${esc(areaLabel(o.delivery_area||o.area_type))}</span>`:''}${o.payment_sender_phone?`<br><span class="mini">Send Money: ${esc(o.payment_sender_phone)}</span>`:''}${o.payment_txn_id?`<br><span class="mini">Txn: ${esc(o.payment_txn_id)}</span>`:''}</td><td><select class="statusSelect" onchange="changeOrderStatus('${o.id}',this.value)">${['pending','confirmed','processing','shipped','delivered','cancelled','returned'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}</select><div class="mini" style="margin-top:5px">বর্তমান: ${esc(statusLabel(o.status))}</div></td><td><button class="btn secondary" onclick="viewOrderDetails('${o.id}')">সম্পূর্ণ তথ্য</button>${o.status==='cancelled'?`<button class="btn danger" style="margin-top:6px" onclick="removeCancelledOrder('${o.id}')">রিমুভ</button>`:''}</td><td>${new Date(o.created_at).toLocaleString('bn-BD')}</td></tr>`).join('')}</tbody></table>`}
async function loadOrders(){const {data,error}=await sb.from('orders').select('*, order_items(*)').order('created_at',{ascending:false});if(!error){orders=data||[];renderOrders();renderRecent();renderStats()}}
async function changeOrderStatus(id,status){const {error}=await sb.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)toast(error.message);else{toast('Status updated');await loadOrders()}}
async function removeCancelledOrder(id){
const o=orders.find(x=>x.id===id);
if(!o||o.status!=='cancelled'){toast('শুধু Cancelled order রিমুভ করা যাবে');return}
if(!confirm(`Cancelled order ${o.order_number||''} স্থায়ীভাবে রিমুভ করবেন?`))return;
const {error}=await sb.from('orders').delete().eq('id',id);
if(error)toast('Order remove হয়নি: '+error.message);else{toast('Cancelled order রিমুভ হয়েছে');await loadOrders()}
}
function viewOrderDetails(id){const o=orders.find(x=>x.id===id);if(!o)return;const items=o.order_items||[];const status=statusLabel(o.status);openModal(`<div class="sectionhead"><h2>অর্ডার ${esc(o.order_number||'')}</h2><button class="btn secondary" onclick="closeModal()">বন্ধ করুন</button></div><div class="adminsection"><h3>Customer Details</h3><div class="formgrid"><div><b>নাম</b><div>${esc(o.customer_name||'')}</div></div><div><b>মোবাইল</b><div>${esc(o.phone||o.customer_phone||'')}</div></div><div><b>Division</b><div>${esc(o.division||'')}</div></div><div><b>District</b><div>${esc(o.district||'')}</div></div><div><b>Thana</b><div>${esc(o.thana||'')}</div></div><div style="grid-column:1/-1"><b>সম্পূর্ণ ঠিকানা</b><div>${esc(o.full_address||o.address||'')}</div></div></div><hr><h3>Order Details</h3><div class="tablewrap"><table class="table"><thead><tr><th>Product</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(i.product_name||'')}</td><td>${esc(i.color_name||'')}</td><td>${i.quantity||0}</td><td>${money(i.unit_price)}</td><td>${money(i.discount)}</td><td>${money(i.total_price)}</td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:14px"><span>Subtotal</span><b>${money(o.subtotal)}</b></div><div class="row"><span>Discount</span><b>${money(o.discount)}</b></div><div class="row"><span>Delivery Charge</span><b>${money(o.delivery_charge)}</b></div><div class="row" style="font-size:18px"><span>Total</span><b>${money(o.total||o.total_amount)}</b></div><hr><h3>Payment</h3><div>Method: <b>${esc(o.payment_method||'')}</b></div><div>Send Money Number: <b>${esc(o.payment_sender_phone||'')}</b></div><div>Delivery Area: <b>${esc(areaLabel(o.delivery_area||o.area_type))}</b></div><div>Payment Status: <b>${esc(o.payment_status||'')}</b></div><div>Transaction ID: <b>${esc(o.payment_txn_id||o.transaction_id||'')}</b></div><hr><div class="row"><span>Order Status</span><b>${esc(status)}</b></div><div>Note: ${esc(o.note||o.customer_note||'')}</div></div>`)}
function renderProducts(){const el=$('#productTable');if(!products.length){el.innerHTML='<div class="empty">কোনো product নেই।</div>';return}el.innerHTML=`<table class="table"><thead><tr><th>Product</th><th>Price</th><th>Purchase</th><th>Stock</th><th>Variants</th><th>Action</th></tr></thead><tbody>${products.map(p=>`<tr><td><div style="display:flex;gap:8px;align-items:center"><img src="${esc(p.main_image_url||'assets/logo.png')}" style="width:45px;height:45px;object-fit:cover;border-radius:8px"><span>${esc(p.name)}</span></div></td><td>${money(p.selling_price)}</td><td>${money(p.purchase_price)}</td><td>${p.stock}</td><td>${(p.product_variants||[]).length}</td><td class="adminactions"><button class="btn secondary" onclick="openProductForm('${p.id}')">Edit</button><button class="btn danger" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`}
async function uploadFile(file,bucket){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('শুধু JPG, PNG, WEBP বা GIF ছবি দিন।');
  if(file.size>8*1024*1024) throw new Error('ছবির সাইজ 8MB-এর বেশি হতে পারবে না।');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
  const path=`${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
  if(error) throw new Error(`ছবি upload হয়নি: ${error.message}`);
  const publicUrl=sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  if(!publicUrl) throw new Error('ছবির public URL তৈরি হয়নি।');
  return publicUrl;
}
let editingMainImageUrl=null;
let editingGalleryUrls=[];

function removeExistingMainImage(){
  editingMainImageUrl=null;
  const box=document.querySelector('#existingMainImage');
  if(box) box.innerHTML='<div class="mini">Main image সরানো হয়েছে। নতুন ছবি দিলে সেটি Main image হবে।</div>';
}
function removeExistingGalleryImage(index){
  editingGalleryUrls.splice(index,1);
  const box=document.querySelector('#existingGalleryImages');
  if(!box){return}
  box.innerHTML=editingGalleryUrls.length
    ? editingGalleryUrls.map((x,i)=>`<div class="gallery-admin-item"><img src="${esc(x)}"><button type="button" class="btn danger gallery-remove" onclick="removeExistingGalleryImage(${i})">✕ Remove</button></div>`).join('')
    : '<div class="mini">কোনো অতিরিক্ত ছবি নেই।</div>';
}

function productFormHtml(p){
  editingMainImageUrl=p?.main_image_url||null;
  editingGalleryUrls=[...(p?.gallery_urls||[])];
  const vars=p?.product_variants||[];
  return `<div class="row"><h2>${p?'Edit':'Add'} Product</h2><button class="btn secondary" onclick="closeModal()">✕</button></div>
  <div class="formgrid">
    <div class="field full"><label>Product name *</label><input id="pName" value="${esc(p?.name||'')}" placeholder="যেমন P9 Pro Max"></div>
    <div class="field full"><label>Product main image *</label><input id="pImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><div class="mini">নতুন ছবি দিলে আগের Main image replace হবে।</div></div>
    <div class="field full"><div id="existingMainImage">${p?.main_image_url?`<div class="mini">বর্তমান Main image</div><div class="gallery-admin-item"><img src="${esc(p.main_image_url)}"><button type="button" class="btn danger gallery-remove" onclick="removeExistingMainImage()">✕ Remove</button></div>`:'<div class="mini">কোনো Main image নেই।</div>'}</div></div>
    <div class="field full"><label>আরও Product Images (একসাথে একাধিক)</label><input id="pGalleryFiles" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"><div class="mini">একসাথে একাধিক নতুন ছবি নির্বাচন করতে পারবেন।</div></div>
    <div class="field full"><div class="mini">বর্তমান অতিরিক্ত ছবি</div><div id="existingGalleryImages" class="gallery-admin-preview">${editingGalleryUrls.length?editingGalleryUrls.map((x,i)=>`<div class="gallery-admin-item"><img src="${esc(x)}"><button type="button" class="btn danger gallery-remove" onclick="removeExistingGalleryImage(${i})">✕ Remove</button></div>`).join(''):'<div class="mini">কোনো অতিরিক্ত ছবি নেই।</div>'}</div></div>
    <div class="field"><label>আগের প্রাইস</label><input id="pCompare" type="number" min="0" value="${p?.compare_at_price??''}" placeholder="৳"></div>
    <div class="field"><label>বর্তমান প্রাইস *</label><input id="pSelling" type="number" min="0" value="${p?.selling_price??0}" placeholder="৳"></div>
    <div class="field"><label>কেনা দাম (হিসাবের জন্য)</label><input id="pPurchase" type="number" min="0" value="${p?.purchase_price??0}" placeholder="৳"></div>
    <div class="field"><label>স্টক</label><input id="pStock" type="number" min="0" value="${p?.stock??0}"></div>
    <div class="field full"><label>ডিস্ক্রিপশন</label><textarea id="pDesc" rows="5" placeholder="পণ্যের বিস্তারিত লিখুন...">${esc(p?.description||'')}</textarea></div>
  </div>
  <div class="adminsection" style="margin-top:15px;padding:14px">
    <div class="sectionhead"><h3>কালার</h3><button class="btn secondary" onclick="addVariantRow()">+ কালার যোগ করুন</button></div>
    <p class="mini">শুধু কালারের নাম ও স্টক দিন। কোনো color code লাগবে না।</p>
    <div id="variantRows">${vars.map(v=>variantRow(v)).join('')}</div>
  </div>
  <br><button class="btn" style="width:100%" onclick="saveProduct()">Save Product</button>`
}
function variantRow(v={}){
  return `<div class="specrow variant-row" data-id="${v.id||''}">
    <input class="vName" placeholder="কালারের নাম (যেমন Black)" value="${esc(v.color_name||'')}">
    <input class="vStock" type="number" min="0" placeholder="স্টক" value="${v.stock??0}">
    <button class="btn danger" onclick="this.closest('.variant-row').remove()">Remove</button>
  </div>`
}
function addVariantRow(){document.querySelector('#variantRows').insertAdjacentHTML('beforeend',variantRow())}
function openProductForm(id){editingProductId=id||null;editingMainImageUrl=null;editingGalleryUrls=[];openModal(productFormHtml(id?products.find(p=>p.id===id):null))}
async function saveProduct(){
  if(savingProduct)return;
  savingProduct=true;
  const saveBtn=document.querySelector('#modalBox button[onclick=\"saveProduct()\"]');
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Saving...';}
  try{
    const name=$('#pName').value.trim();
    if(!name){toast('Product name দিন');return}
    const selling=Number($('#pSelling').value||0);
    if(selling<=0){toast('বর্তমান প্রাইস দিন');return}
    let image=editingProductId ? editingMainImageUrl : null;
    const mainFile=$('#pImageFile').files[0];
    if(mainFile) image=await uploadFile(mainFile,'product-images');
    const existing=editingProductId ? [...editingGalleryUrls] : [];
    const galleryFiles=[...($('#pGalleryFiles')?.files||[])];
    const uploadedGallery=[]; for(const gf of galleryFiles) uploadedGallery.push(await uploadFile(gf,'product-images'));
    const galleryUrls=[...existing,...uploadedGallery];
    if(!image && !editingProductId){toast('Product image দিন');return}

    const payload={
      name,
      slug:slugify(name)+'-'+(editingProductId||crypto.randomUUID()).slice(0,8),
      description:$('#pDesc').value.trim(),
      purchase_price:Number($('#pPurchase').value||0),
      selling_price:selling,
      compare_at_price:$('#pCompare').value?Number($('#pCompare').value):null,
      stock:Number($('#pStock').value||0),
      main_image_url:image,
      gallery_urls:galleryUrls,
      specifications:{},
      active:true,
      updated_at:new Date().toISOString()
    };

    let pid=editingProductId;
    if(pid){
      const {error}=await sb.from('products').update(payload).eq('id',pid);
      if(error)throw new Error('Product update হয়নি: '+error.message);
      const {error:ve}=await sb.from('product_variants').delete().eq('product_id',pid);
      if(ve)throw new Error('পুরোনো color মুছতে পারেনি: '+ve.message);
    }else{
      const {data,error}=await sb.from('products').insert(payload).select().single();
      if(error)throw new Error('Product save হয়নি: '+error.message);
      pid=data.id;
    }

    const rows=[...document.querySelectorAll('.variant-row')]
      .map(r=>({
        product_id:pid,
        color_name:r.querySelector('.vName').value.trim(),
        purchase_price:Number($('#pPurchase').value||0),
        selling_price:selling,
        stock:Number(r.querySelector('.vStock').value||0),
        image_url:null
      })).filter(x=>x.color_name);

    if(rows.length){
      const {error}=await sb.from('product_variants').insert(rows);
      if(error)throw new Error('Color save হয়নি: '+error.message);
      await sb.from('products').update({stock:0}).eq('id',pid);
    }
    toast('Product saved');closeModal();await loadAll();
  }catch(e){console.error(e);toast(e.message||'Save failed')}finally{savingProduct=false;const b=document.querySelector('#modalBox button[onclick=\"saveProduct()\"]');if(b){b.disabled=false;b.textContent='Save Product';}}
}
function slugify(s){return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-')||'product'}
async function deleteProduct(id){if(!confirm('এই product delete করবেন?'))return;const {error}=await sb.from('products').delete().eq('id',id);if(error)toast(error.message);else{toast('Deleted');await loadAll()}}
function openBannerForm(){
  openModal(`<div class="row"><h2>Add Slider</h2><button class="btn secondary" onclick="closeModal()">✕</button></div>
  <div class="field"><label>Slider image *</label><input id="bFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></div>
  <p class="mini" style="margin-top:10px">শুধু ছবি আপলোড করুন। কোনো link option নেই।</p>
  <br><button class="btn" style="width:100%" onclick="saveBanner()">Upload Slider</button>`)
}
async function saveBanner(){
  if(savingBanner)return;
  savingBanner=true;
  const saveBtn=document.querySelector('#modalBox button[onclick=\"saveBanner()\"]');
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Uploading...';}
  try{
    const f=$('#bFile').files[0];
    if(!f){toast('Slider image দিন');return}
    const url=await uploadFile(f,'banners');
    const {error}=await sb.from('banners').insert({image_url:url,title:'',subtitle:'',link_url:'',sort_order:0,active:true});
    if(error)throw new Error('Slider save হয়নি: '+error.message);
    toast('Slider added');closeModal();await loadAll();
  }catch(e){console.error(e);toast(e.message||'Slider save failed')}finally{savingBanner=false;const b=document.querySelector('#modalBox button[onclick=\"saveBanner()\"]');if(b){b.disabled=false;b.textContent='Upload Slider';}}
}
function renderBanners(){
  const el=$('#bannerList');if(!el)return;
  if(!banners.length){el.innerHTML='<div class="empty" style="grid-column:1/-1">কোনো slider নেই।</div>';return}
  el.innerHTML=banners.map(b=>`<div class="banneritem"><img src="${esc(b.image_url)}"><button class="btn danger remove" onclick="deleteBanner('${b.id}')">✕</button></div>`).join('')
}
async function deleteBanner(id){if(!confirm('Slider delete করবেন?'))return;const {error}=await sb.from('banners').delete().eq('id',id);if(error)toast(error.message);else{toast('Deleted');await loadAll()}}
function fillSettings(){const map={sName:'store_name',sTagline:'tagline',sDhakaCity:'dhaka_city_delivery',sDhakaSuburban:'dhaka_suburban_delivery',sOutside:'outside_delivery',sBkash:'bkash_number',sNagad:'nagad_number',sWhatsapp:'whatsapp_number'};Object.entries(map).forEach(([id,key])=>{const el=$('#'+id);if(!el)return;let v=settings[key];if(v==null&&key==='dhaka_city_delivery')v=settings.dhaka_delivery;if(v==null&&key==='whatsapp_number')v='01919889430';el.value=v??''})}
async function saveSettings(){const payload={store_name:$('#sName').value.trim()||'TI GADGET ZONE',tagline:$('#sTagline').value.trim(),dhaka_city_delivery:Number($('#sDhakaCity').value||0),dhaka_suburban_delivery:Number($('#sDhakaSuburban').value||0),outside_delivery:Number($('#sOutside').value||0),dhaka_delivery:Number($('#sDhakaCity').value||0),bkash_number:$('#sBkash').value.trim(),nagad_number:$('#sNagad').value.trim(),whatsapp_number:$('#sWhatsapp').value.trim()||'01919889430',updated_at:new Date().toISOString()};const {error}=await sb.from('settings').update(payload).eq('id',true);if(error)toast(error.message);else{toast('Settings saved');settings={...settings,...payload}}}
async function addCategory(){const name=$('#catName').value.trim();if(!name)return;const slug=slugify(name);const {error}=await sb.from('categories').insert({name,slug});if(error)toast(error.message);else{$('#catName').value='';toast('Category added');await loadAll()}}
function renderCategories(){const el=$('#categoryList');if(el)el.innerHTML=categories.map(c=>`<span class="pill" style="display:inline-flex;gap:7px;margin:4px">${esc(c.name)} <button style="border:0;background:none;color:#ff7180" onclick="deleteCategory('${c.id}')">✕</button></span>`).join('')||'<span class="muted">No categories</span>'}
async function deleteCategory(id){if(!confirm('Category delete করবেন?'))return;const {error}=await sb.from('categories').delete().eq('id',id);if(error)toast(error.message);else await loadAll()}
async function logout(){await sb.auth.signOut();location.reload()}
boot();
