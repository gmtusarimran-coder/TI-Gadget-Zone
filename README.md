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
