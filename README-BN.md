# My Hotel — Restaurant Ordering Website v2

## Customer flow
Welcome screen → How to Order instructions → Choose Table → Today's Menu → Review Bill → Place Order → Order confirmation.
Customer name, phone number, email and account/login are NOT required. Payment is Cash at Counter.
QR example: `https://your-site.example/?table=1` preselects table ID 1 and shows the guide first.

## Admin
Admin login asks for PASSWORD ONLY (no email or username). Demo password: `1234`.
Change it under Admin → Website Settings → Change admin password.
Admin panels: Orders/status updates, Menu & Categories, Today's Food visibility, Tables, CSV order export, website identity/design settings. নতুন খাবার যোগ করতে এখন ফোন/কম্পিউটার থেকে ছবি আপলোড করা বাধ্যতামূলক; URL দেওয়ার প্রয়োজন নেই।
Hotel name, tagline, welcome text, logo text, phone, address, accent colour and font size are editable.

## Run
Extract ZIP and open `index.html` in Chrome. Browser localStorage stores demo data.

## Important
This is a LOCAL PREVIEW starter, not a production multi-device system. Orders/settings/password are saved only in the current browser. The included `supabase-schema.sql` is a database foundation only; this frontend is not connected to Supabase, realtime or secure server-side authentication/order processing. A public launch requires secure server-side order creation, admin authorization, realtime updates, HTTPS hosting and tested bill generation. Do not use this browser-only password gate for real public admin security. Never place Supabase service_role keys in frontend code.

Bill buttons open the browser print dialog; choose Save as PDF. The image/PNG button opens the same print view; use a screenshot for PNG. Proper one-click PNG/PDF generation should be added in a production-connected build. GST/tax is not included and must be configured if applicable.


## নতুন ছবি আপলোড
Admin → Website Settings থেকে Hotel Logo, Welcome screen-এর ছবি এবং Menu-এর উপরের ছবি আপলোড করুন। ছবি ছোট করে ব্রাউজারে সংরক্ষণ করা হয়; এই local preview-তে সেটিংস ওই ব্রাউজারেই থাকবে।


## মোবাইল লেআউট
ওয়েবসাইটটি Desktop Mode চালু না করেও মোবাইল Chrome-এ ব্যবহারের জন্য responsive করা হয়েছে। ছোট স্ক্রিনে বাটন, লেখা, খাবারের কার্ড, Admin navigation এবং ফর্মের মাপ স্বয়ংক্রিয়ভাবে মানিয়ে নেয়।

## Supabase connected build (v5)

এই ZIP-এ `supabase-config.js`-এ Project URL ও Publishable Key রাখা হয়েছে এবং `supabase-sync.js` public menu/table/settings পড়া, customer order ও order items লেখা এবং `hotel-images` Storage-এ ছবি আপলোড করার জন্য যুক্ত হয়েছে। CSV ও Bill PDF/PNG কোনো Supabase table বা bucket-এ পাঠানো হয় না।

### সেটআপ
1. `supabase-config.js`-এ দেওয়া Project URL ও Publishable Key যাচাই করুন। এখানে শুধু Publishable Key ব্যবহার করবেন; Secret/service_role key কখনো বসাবেন না।
2. Supabase SQL Editor-এ `supabase-storage-upload-policy.sql` চালান। এটি Auth ছাড়া public image upload অনুমতি দেয়; যে কেউ bucket-এ 5 MB পর্যন্ত অনুমোদিত image upload করতে পারবে—এটি নিরাপত্তার trade-off।
3. `index.html`, `app.js`, `styles.css`, `supabase-config.js`, `supabase-sync.js` একই folder-এ রেখে HTTPS hosting-এ publish করুন। `file://` দিয়ে খোলার বদলে hosting ব্যবহার করুন।
4. Database-এ menu/category/table row আগে যোগ করতে হবে; website সেগুলো read করবে। Customer order ও order items Supabase-এ insert হবে।

### গুরুত্বপূর্ণ সীমাবদ্ধতা ও নিরাপত্তা
- Admin password আগের মতো browser/localStorage-এ আছে; কোনো Supabase Auth বা Edge Function যোগ করা হয়নি। তাই এই password database-কে secure করে না এবং browser code থেকে দেখা/বাইপাস করা সম্ভব।
- এই কারণে Menu, Categories, Tables, Website Settings ও Admin order-status পরিবর্তন এখনো এই browser-এর localStorage-এ থাকে; সেগুলোর নিরাপদ cross-device admin write এই build-এ চালু করা হয়নি। তা চালু করতে server-side authorization/Auth প্রয়োজন।
- ছবিগুলো Storage-এ আপলোড হয়, কিন্তু Menu/Settings-এর database row-তে admin পরিবর্তন এখনো cross-device sync হয় না।
- `.env.example` কেবল reference। Static browser website সরাসরি `.env` file পড়তে পারে না; বাস্তবে `supabase-config.js` ব্যবহৃত হয়।
- Original image file 5 MB-এর বেশি হলে upload বন্ধ হবে।
