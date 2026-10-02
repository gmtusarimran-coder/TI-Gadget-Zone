# TI GADGET ZONE — FINAL FIXED BUILD

This build fixes:
- Buy Now / cart duplicate quantity: the same product+color is no longer merged by adding old duplicate quantities.
- Checkout order error involving `customer_phone`.
- Checkout now calls the dedicated `create_order_v2` RPC to avoid old Supabase function overload/schema conflicts.
- Color buttons have a white background with dark readable text.
- bKash, Nagad and Cash on Delivery buttons have a white background with dark readable text.

## One Supabase step is required
Run this file once in Supabase SQL Editor:

`supabase/ORDER_FIX.sql`

It creates `create_order_v2`, repairs the legacy phone columns and reloads the PostgREST schema cache.

Then replace the website files on the same hosting/Vercel project with this ZIP.

FINAL MASTER FIX v2 2026-10-02: logo replaced; WhatsApp editable; bKash/Nagad sender number + Txn mandatory; readable delivery selection; robust tracking/history; admin payment details; purchase-cost snapshot for gross profit. Run FINAL_DELIVERY_PAYMENT_ORDER_FIX.sql once after deployment.


FINAL V3 notes (2026-10-02):
- Customer WhatsApp/help number is stored in settings.whatsapp_number and is editable from Admin > Settings. Default 01919889430.
- Checkout requires Send Money phone + Transaction ID for bKash/Nagad.
- Delivery and payment selected states use a readable light-green selected card with check mark.
- Order Tracking includes single-order tracking and all-order history by normalized phone number.
- Run supabase/FINAL_DELIVERY_PAYMENT_ORDER_FIX.sql once before testing the new checkout/tracking features.
- Deploy to the same GitHub main branch connected to the existing Vercel project.
