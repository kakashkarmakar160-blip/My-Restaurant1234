# My Hotel — Restaurant Ordering Website v2

## Customer flow
Welcome screen → How to Order instructions → Choose Table → Today's Menu → Review Bill → Place Order → Order confirmation.
Customer name, phone number, email and account/login are NOT required. Payment is Cash at Counter.
QR example: `https://your-site.example/?table=1` preselects table ID 1 and shows the guide first.

## Admin
Admin login asks for PASSWORD ONLY (no email or username). Demo password: `1234`.
Change it under Admin → Website Settings → Change admin password.
Admin panels: Orders/status updates, Menu & Categories, Today's Food visibility, Tables, CSV order export, website identity/design settings.
Hotel name, tagline, welcome text, logo text, phone, address, accent colour and font size are editable.

## Run
Extract ZIP and open `index.html` in Chrome. Browser localStorage stores demo data.

## Important
This is a LOCAL PREVIEW starter, not a production multi-device system. Orders/settings/password are saved only in the current browser. The included `supabase-schema.sql` is a database foundation only; this frontend is not connected to Supabase, realtime or secure server-side authentication/order processing. A public launch requires secure server-side order creation, admin authorization, realtime updates, HTTPS hosting and tested bill generation. Do not use this browser-only password gate for real public admin security. Never place Supabase service_role keys in frontend code.

Bill buttons open the browser print dialog; choose Save as PDF. The image/PNG button opens the same print view; use a screenshot for PNG. Proper one-click PNG/PDF generation should be added in a production-connected build. GST/tax is not included and must be configured if applicable.


## নতুন ছবি আপলোড
Admin → Website Settings থেকে Hotel Logo, Welcome screen-এর ছবি এবং Menu-এর উপরের ছবি আপলোড করুন। ছবি ছোট করে ব্রাউজারে সংরক্ষণ করা হয়; এই local preview-তে সেটিংস ওই ব্রাউজারেই থাকবে।
