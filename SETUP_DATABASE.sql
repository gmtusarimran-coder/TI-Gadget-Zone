-- TI Gadget Zone complete database bootstrap / repair
create extension if not exists pgcrypto;

create table if not exists public.settings (
  id boolean primary key default true,
  store_name text not null default 'TI GADGET ZONE',
  tagline text not null default 'SMART TECH BETTER LIFE.',
  dhaka_delivery numeric(10,2) not null default 60,
  outside_delivery numeric(10,2) not null default 120,
  bkash_number text not null default '',
  nagad_number text not null default '',
  currency text not null default '৳',
  updated_at timestamptz not null default now()
);
insert into public.settings(id) values(true) on conflict(id) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, image_url text, created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '', specifications jsonb not null default '{}'::jsonb,
  main_image_url text, gallery_urls text[] not null default '{}',
  purchase_price numeric(10,2) not null default 0, selling_price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2), stock integer not null default 0,
  featured boolean not null default false, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists specifications jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists main_image_url text;
alter table public.products add column if not exists gallery_urls text[] not null default '{}';
alter table public.products add column if not exists purchase_price numeric(10,2) not null default 0;
alter table public.products add column if not exists selling_price numeric(10,2) not null default 0;
alter table public.products add column if not exists compare_at_price numeric(10,2);
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null, color_hex text not null default '#7c3aed', image_url text,
  purchase_price numeric(10,2), selling_price numeric(10,2), stock integer not null default 0,
  sort_order integer not null default 0, unique(product_id,color_name)
);
alter table public.product_variants add column if not exists color_name text;
alter table public.product_variants add column if not exists color_hex text not null default '#7c3aed';
alter table public.product_variants add column if not exists image_url text;
alter table public.product_variants add column if not exists purchase_price numeric(10,2);
alter table public.product_variants add column if not exists selling_price numeric(10,2);
alter table public.product_variants add column if not exists stock integer not null default 0;
alter table public.product_variants add column if not exists sort_order integer not null default 0;

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(), image_url text not null,
  title text not null default '', subtitle text not null default '', link_url text not null default '',
  sort_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.banners add column if not exists image_url text;
alter table public.banners add column if not exists title text not null default '';
alter table public.banners add column if not exists subtitle text not null default '';
alter table public.banners add column if not exists link_url text not null default '';
alter table public.banners add column if not exists sort_order integer not null default 0;
alter table public.banners add column if not exists active boolean not null default true;
alter table public.banners add column if not exists created_at timestamptz not null default now();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique,
  customer_name text not null, phone text not null, district text not null default '', thana text not null default '', address text not null,
  area_type text not null default 'dhaka', payment_method text not null default 'cod', payment_txn_id text,
  subtotal numeric(10,2) not null default 0, delivery_charge numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0, total numeric(10,2) not null default 0,
  status text not null default 'pending', note text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists phone text not null default '';
alter table public.orders add column if not exists district text not null default '';
alter table public.orders add column if not exists thana text not null default '';
alter table public.orders add column if not exists address text not null default '';
alter table public.orders add column if not exists area_type text not null default 'dhaka';
alter table public.orders add column if not exists payment_method text not null default 'cod';
alter table public.orders add column if not exists payment_txn_id text;
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists delivery_charge numeric(10,2) not null default 0;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists total numeric(10,2) not null default 0;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists note text not null default '';
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id), variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null, color_name text, unit_price numeric(10,2) not null default 0,
  purchase_price numeric(10,2) not null default 0, quantity integer not null default 1, line_total numeric(10,2) not null default 0
);
alter table public.order_items add column if not exists color_name text;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Public read + admin write policies
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.banners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists settings_public_read on public.settings; create policy settings_public_read on public.settings for select using(true);
drop policy if exists categories_public_read on public.categories; create policy categories_public_read on public.categories for select using(true);
drop policy if exists products_public_read on public.products; create policy products_public_read on public.products for select using(active=true or public.is_admin());
drop policy if exists variants_public_read on public.product_variants; create policy variants_public_read on public.product_variants for select using(exists(select 1 from public.products p where p.id=product_id and (p.active=true or public.is_admin())));
drop policy if exists banners_public_read on public.banners; create policy banners_public_read on public.banners for select using(active=true or public.is_admin());

drop policy if exists settings_admin_all on public.settings; create policy settings_admin_all on public.settings for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists categories_admin_all on public.categories; create policy categories_admin_all on public.categories for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists products_admin_all on public.products; create policy products_admin_all on public.products for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists variants_admin_all on public.product_variants; create policy variants_admin_all on public.product_variants for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists banners_admin_all on public.banners; create policy banners_admin_all on public.banners for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists orders_admin_all on public.orders; create policy orders_admin_all on public.orders for all using(public.is_admin()) with check(public.is_admin());
drop policy if exists order_items_admin_all on public.order_items; create policy order_items_admin_all on public.order_items for all using(public.is_admin()) with check(public.is_admin());

-- Storage buckets and policies
insert into storage.buckets(id,name,public) values('product-images','product-images',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values('banners','banners',true) on conflict(id) do update set public=true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select using(bucket_id='product-images');
drop policy if exists banners_public_read on storage.objects;
create policy banners_public_read on storage.objects for select using(bucket_id='banners');
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects for insert to authenticated with check(bucket_id='product-images');
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects for update to authenticated using(bucket_id='product-images') with check(bucket_id='product-images');
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
drop policy if exists banners_admin_insert on storage.objects;
create policy banners_admin_insert on storage.objects for insert to authenticated with check(bucket_id='banners');
drop policy if exists banners_admin_update on storage.objects;
create policy banners_admin_update on storage.objects for update to authenticated using(bucket_id='banners') with check(bucket_id='banners');
drop policy if exists banners_admin_delete on storage.objects;
create policy banners_admin_delete on storage.objects for delete to authenticated using(bucket_id='banners' and public.is_admin());

-- Atomic order placement
create or replace function public.create_order(p_customer_name text,p_phone text,p_district text,p_thana text,p_address text,p_area_type text,p_payment_method text,p_payment_txn_id text,p_note text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order_id uuid; v_order_number text; v_subtotal numeric:=0; v_delivery numeric:=0; v_total numeric:=0; v_item jsonb; v_product public.products%rowtype; v_variant public.product_variants%rowtype; v_qty int; v_unit numeric; v_purchase numeric; v_color text;
begin
 if trim(coalesce(p_customer_name,''))='' or trim(coalesce(p_phone,''))='' or trim(coalesce(p_district,''))='' or trim(coalesce(p_thana,''))='' or trim(coalesce(p_address,''))='' then raise exception 'Customer information is required'; end if;
 if p_area_type not in ('dhaka','outside') then raise exception 'Invalid delivery area'; end if;
 if p_items is null or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
 select case when p_area_type='dhaka' then dhaka_delivery else outside_delivery end into v_delivery from public.settings where id=true;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_qty:=greatest(1,coalesce((v_item->>'quantity')::int,1));
  select * into v_product from public.products where id=(v_item->>'product_id')::uuid and active=true for update;
  if not found then raise exception 'Product unavailable'; end if;
  v_unit:=v_product.selling_price; v_purchase:=v_product.purchase_price; v_color:=null;
  if coalesce(v_item->>'variant_id','')<>'' then
   select * into v_variant from public.product_variants where id=(v_item->>'variant_id')::uuid and product_id=v_product.id for update;
   if not found then raise exception 'Color option unavailable'; end if;
   if v_variant.stock<v_qty then raise exception 'Not enough stock for %',coalesce(v_variant.color_name,'selected color'); end if;
   v_unit:=coalesce(v_variant.selling_price,v_unit); v_purchase:=coalesce(v_variant.purchase_price,v_purchase); v_color:=v_variant.color_name;
   update public.product_variants set stock=stock-v_qty where id=v_variant.id;
  else
   if v_product.stock<v_qty then raise exception 'Not enough stock for %',v_product.name; end if;
   update public.products set stock=stock-v_qty,updated_at=now() where id=v_product.id;
  end if;
  v_subtotal:=v_subtotal+v_unit*v_qty;
 end loop;
 v_total:=v_subtotal+v_delivery;
 v_order_number:='TIGZ-'||to_char(now(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
 insert into public.orders(order_number,customer_name,phone,customer_phone,district,thana,address,area_type,payment_method,payment_txn_id,subtotal,delivery_charge,total,note) values(v_order_number,trim(p_customer_name),trim(p_phone),trim(p_phone),trim(p_district),trim(p_thana),trim(p_address),p_area_type,p_payment_method,nullif(trim(coalesce(p_payment_txn_id,'')),''),v_subtotal,v_delivery,v_total,coalesce(p_note,'')) returning id into v_order_id;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_qty:=greatest(1,coalesce((v_item->>'quantity')::int,1)); select * into v_product from public.products where id=(v_item->>'product_id')::uuid; v_unit:=v_product.selling_price; v_purchase:=v_product.purchase_price; v_color:=null;
  if coalesce(v_item->>'variant_id','')<>'' then select * into v_variant from public.product_variants where id=(v_item->>'variant_id')::uuid; v_unit:=coalesce(v_variant.selling_price,v_unit); v_purchase:=coalesce(v_variant.purchase_price,v_purchase); v_color:=v_variant.color_name; end if;
  insert into public.order_items(order_id,product_id,variant_id,product_name,color_name,unit_price,purchase_price,quantity,line_total) values(v_order_id,v_product.id,nullif(v_item->>'variant_id','')::uuid,v_product.name,v_color,v_unit,v_purchase,v_qty,v_unit*v_qty);
 end loop;
 return jsonb_build_object('id',v_order_id,'order_number',v_order_number,'subtotal',v_subtotal,'delivery_charge',v_delivery,'total',v_total);
end; $$;
grant execute on function public.create_order(text,text,text,text,text,text,text,text,text,jsonb) to anon,authenticated;

create or replace function public.track_order(p_order_number text,p_phone text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r jsonb; begin
 select jsonb_build_object('order_number',o.order_number,'status',o.status,'created_at',o.created_at,'delivery_charge',o.delivery_charge,'total',o.total,'items',coalesce((select jsonb_agg(jsonb_build_object('product_name',i.product_name,'color_name',i.color_name,'quantity',i.quantity,'line_total',i.line_total)) from public.order_items i where i.order_id=o.id),'[]'::jsonb)) into r from public.orders o where o.order_number=trim(p_order_number) and o.phone=trim(p_phone); return r;
end; $$;
grant execute on function public.track_order(text,text) to anon,authenticated;
