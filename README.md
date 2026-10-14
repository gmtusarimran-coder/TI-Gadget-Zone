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


MOBILE + IMAGE EGRESS OPTIMIZATION (2026-10-14):
- Mobile product cards now keep Buy Now and Add to Cart inside the card, with compact equal-width buttons and no horizontal page overflow.
- New product and banner uploads are resized to a maximum 1000px and progressively compressed toward 300 KB in WebP where the browser supports it. Animated GIFs are kept intact.
- Previously uploaded Supabase Storage images are not rewritten automatically; replace/re-upload them through Admin to apply the new compression.
- Egress usage depends on traffic and cannot be guaranteed to stay within a month.


## Mobile compact / Supabase egress notes (2026-10-14)
- Added a stronger mobile-only layout override so product cards and action buttons stay within the phone screen. Desktop and admin styles are not intentionally changed.
- Product/banner uploads use client-side image optimization to WebP (up to 1000px, target <=300 KB where possible) and a 1-year Storage cache-control header.
- Existing images already stored in Supabase are not automatically re-compressed by a CSS/ZIP update. To reduce future image egress, re-upload oversized existing product/banner images through the Admin Panel image uploader, which optimizes new uploads.
- Supabase monthly quota cannot be guaranteed; actual usage depends on visitors, image sizes, and repeated downloads.


## Logo path compatibility fix (2026-10-14)
- Added `assets/logo.png` as a real PNG converted from the bundled `assets/logo.webp`.
- Updated storefront header/footer/favicon and admin login/sidebar logo references to use `assets/logo.png?v=20261014-logofix1`.
- Kept `assets/logo.webp` in the archive as well; no database or Supabase SQL changes are required.
