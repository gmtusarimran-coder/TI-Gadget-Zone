TI GADGET ZONE — FINAL ORDER FIX v4

1) Upload this entire folder/ZIP to Vercel.
2) In Supabase SQL Editor, run supabase/ORDER_FIX.sql once.
3) The storefront uses versioned app.v20260928.js and styles.v20260928.css to avoid an old cached app.js/styles.css.
4) Checkout calls public.create_order_v2(text,text,text,text,text,text,text,text,text,jsonb).
5) customer_phone is populated from the submitted phone and the database repair makes the legacy phone columns compatible.
6) Buy Now sets the selected product/variant quantity to exactly 1; cart normalization merges duplicate product+variant entries without adding their quantities.
7) Color buttons and bKash/Nagad/COD payment buttons have white backgrounds and black text for readability.



ORDER TRACKING + ADMIN DETAILS FIX
1. Run supabase/ORDER_TRACKING_FIX.sql in Supabase SQL Editor.
2. Deploy this ZIP to the same Vercel project.
3. Customer: after ordering, the order number is saved in the browser and Track Order can use it with the phone number.
4. Admin: Orders -> সম্পূর্ণ তথ্য shows customer/address/products/payment/status. Status can be changed from the Orders table.


## FINAL DELIVERY/PAYMENT FIX
1. Deploy this ZIP to the same Vercel project. Existing localStorage/cart and database data are not deleted by the frontend update.
2. In Supabase SQL Editor run `supabase/FINAL_DELIVERY_PAYMENT_ORDER_FIX.sql` ONCE. This migration adds the three delivery charges while preserving the old settings and orders, and installs the corrected `create_order_v2` that does not use missing `purchase_price`/`line_total` columns.
3. In Admin > Store & Delivery set: ঢাকা সিটির মধ্যে, ঢাকা সাব-আরবান, ঢাকার বাইরে delivery charges.
4. Checkout now shows all three delivery options at once; selected color, delivery, COD/bKash/Nagad gets a green selected state/check. bKash/Nagad explicitly says “শুধুমাত্র Send Money করবেন”; transaction ID is optional.
5. Existing orders are preserved. Old `dhaka` orders are displayed/treated as `dhaka_city`.


## FINAL MASTER FIX — 2026-10-02
এই ZIP-এ আগের Delivery/Payment/Order/Meta Pixel কাজের উপর নিচের পরিবর্তন যোগ করা হয়েছে:
- Header/footer/floating customer WhatsApp help: default 01919889430; Admin > Store & Delivery থেকে পরিবর্তনযোগ্য।
- Product detail order: নাম → দাম → ৩-zone delivery charge → সম্পূর্ণ Cash on Delivery available / প্রডাক্ট চেক করে টাকা দিবেন → Color → Cart/Buy Now → Description → Specifications → Copy Product Link।
- Product description line breaks preserved.
- Product link copy opens the exact product using `?product=PRODUCT_ID`.
- Customer Order Tracking-এ মোবাইল নম্বর দিয়ে সব পুরোনো/নতুন order history দেখার অপশন।
- Admin product form-এ একসাথে একাধিক additional product image upload; existing gallery preserved when editing.
- Gross Profit formula fixed to use order-item purchase-cost snapshot; cancelled/returned orders excluded. Existing old orders are backfilled with the best available current product/variant purchase cost because historical cost was not stored in the old schema.
- Admin Orders-এ শুধু Cancelled order-এর জন্য permanent Remove button।
- Checkout customer name/phone/district/thana/address fields use white background.
- Existing order creation compatibility retained; final SQL adds purchase-cost snapshot without using the old `line_total`/`purchase_price` bug in the previous live insert schema.
- Existing products/orders are not automatically deleted. Cancelled orders are only deleted when an admin explicitly presses Remove.

### Supabase
Run `supabase/FINAL_DELIVERY_PAYMENT_ORDER_FIX.sql` once. This migration adds the WhatsApp setting, delivery settings, purchase-cost snapshot, order-history RPCs and the corrected order function. It does not delete existing data.

### Important
The frontend files are prepared and JavaScript syntax-checked locally. Live Vercel/Supabase behavior still depends on deploying the ZIP and running the SQL migration in the user's project.
