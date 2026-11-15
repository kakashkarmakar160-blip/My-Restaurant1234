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
This is a static browser website connected to Supabase REST for public menu/settings/tables and customer order inserts. The Admin password remains browser/localStorage-only; it is not secure server-side authentication. A public launch requires secure server-side order creation, admin authorization, realtime updates, HTTPS hosting and tested bill generation. Do not use this browser-only password gate for real public admin security. Never place Supabase service_role keys in frontend code.

Bill buttons open the browser print dialog; choose Save as PDF. The image/PNG button opens the same print view; use a screenshot for PNG. Proper one-click PNG/PDF generation should be added in a production-connected build. GST/tax is not included and must be configured if applicable.


## নতুন ছবি আপলোড
Admin → Website Settings থেকে Hotel Logo, Welcome screen-এর ছবি এবং Menu-এর উপরের ছবি আপলোড করুন। ছবির আসল ফাইল `hotel-images` Storage bucket-এ থাকবে; তার public URL `hotel_settings` টেবিলে সংরক্ষিত হবে।


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


## অর্ডার Database-এ সংরক্ষণের Policy (গুরুত্বপূর্ণ)
1. Supabase → SQL Editor খুলুন।
2. ZIP-এর `supabase-order-insert-policy.sql` ফাইলের সম্পূর্ণ কোড কপি করে Run করুন।
3. `Success. No rows returned` এলে Policy তৈরি হয়েছে।
4. ওয়েবসাইট নতুন করে আপলোড/Deploy করে একটি পরীক্ষামূলক অর্ডার দিন।

এই আপডেটে অর্ডারের UUID ব্রাউজারেই তৈরি হয় এবং `return=minimal` ব্যবহার করে; ফলে অর্ডার জমা দিতে সব অর্ডারের SELECT অনুমতি দিতে হয় না।

**নিরাপত্তা নোট:** Authentication/Edge Function ছাড়া anonymous গ্রাহককে অর্ডার INSERT করতে দেওয়া হচ্ছে। ফলে যে কেউ public website key ব্যবহার করে অর্ডার জমা দিতে পারে। Admin password browser-এর ভিতরে থাকায় এটি database-কে নিরাপদে Admin-only করতে পারে না। কোনো service_role/secret key কখনো ওয়েবসাইটে বসাবেন না।


## Order error diagnostics (v6.1)

যদি অর্ডারের মূল row তৈরি হয় কিন্তু খাবারের row তৈরি না হয়, এখন ওয়েবসাইটে Supabase-এর আসল HTTP error/body-সহ আলাদা বার্তা দেখাবে। অর্ডারের মূল তথ্য সফল হয়ে item insert ব্যর্থ হলে বার্তায় সেটিও স্পষ্ট থাকবে। এই পরিবর্তনটি ত্রুটির কারণ শনাক্ত করতে সাহায্য করে; এটি নিজে থেকে Supabase-এর অজানা schema/constraint/configuration error অনুমান করে পরিবর্তন করে না।


## Version 6.2 — Order response fix
এই সংস্করণে Supabase REST API থেকে খালি response এলে সেটিকে JSON হিসেবে parse করা হয় না। `Prefer: return=minimal`-এর সফল empty response এখন সঠিকভাবে গ্রহণ করা হবে, ফলে অর্ডারের মূল তথ্য সংরক্ষণের পর খাবারের item-গুলোও পাঠানোর পরের ধাপে যাবে। এই JavaScript সংশোধনের জন্য নতুন SQL চালানোর প্রয়োজন নেই; আগের SQL policies অপরিবর্তিত রাখুন। GitHub Pages-এ এই ZIP-এর সব ফাইল দিয়ে আগের ফাইলগুলো প্রতিস্থাপন করে commit/publish করুন।


## Version 6.3 — Settings, Menu, Tables ও ছবি Database-এ সংরক্ষণ

1. Supabase SQL Editor-এ `supabase-admin-data-policies.sql` সম্পূর্ণ কপি করে Run করুন। `Success. No rows returned` এলে SQL সম্পন্ন।
2. Version 6.3-এর সব ফাইল GitHub Pages repository-তে আপলোড/replace করে Commit করুন।
3. ওয়েবসাইট hard refresh করে Admin → Settings-এ গিয়ে Save করুন।
4. নতুন Food/Category/Table যোগ করে Supabase Table Editor-এ `food_items`, `food_categories`, `restaurant_tables` দেখুন।
5. `hotel_settings`-এ লেখা ও image URL থাকবে। ছবির আসল ফাইল `hotel-images` Storage bucket-এ থাকবে; Database-এ ছবির URL রাখা হবে।

**গুরুত্বপূর্ণ নিরাপত্তা:** আপনি Supabase Auth ও Edge Function ব্যবহার করতে চান না বলে এই SQL-এ `anon`-কে Settings, Categories, Tables ও Food Items-এ INSERT/UPDATE/DELETE অনুমতি দেওয়া হয়েছে। ফলে ওয়েবসাইটের Admin Password শুধু browser-side বাধা; এটি Database-কে অননুমোদিত পরিবর্তন থেকে নিরাপদ রাখে না। Publish করার আগে এই ঝুঁকি বুঝে নিন। CSV/PDF bill ফাইল Database বা Storage-এ আপলোড হয় না; সেগুলি ব্যবহারকারীর ডিভাইসে ডাউনলোড হয়।


## Version 6.4 — Admin Order History ও পুরোনো ছবি Sync

- Admin → Orders এবং Reports এখন Supabase `restaurant_orders` ও `restaurant_order_items` থেকে তথ্য লোড করে। Orders প্যানেলে Refresh orders আছে। Status পরিবর্তন Supabase-এ PATCH হয়।
- এই কাজের জন্য `supabase-order-admin-read-policy.sql` SQL Editor-এ একবার Run করতে হবে। এতে anon ব্যবহারকারী order history পড়তে এবং order status update করতে পারবে। Supabase Auth/Edge Function ছাড়া password-only Admin-কে database-এ আলাদা করে সুরক্ষিত করা যায় না; তাই এই তথ্য public API দিয়ে পড়া/পরিবর্তনযোগ্য হবে।
- আগের browser localStorage-এ থাকা data:image ছবি থাকলে নতুন version সেগুলো Storage-এ স্থানান্তর করার চেষ্টা করে; Food image URL `food_items.image_url`-এ এবং Settings image URL `hotel_settings`-এ সেভ করে। যে ছবি শুধু অন্য ডিভাইসে বা মুছে যাওয়া browser data-তে ছিল, সেটি আবার upload করতে হবে।
- `hotel-images` bucket Public থাকতে হবে এবং `supabase-storage-upload-policy.sql` upload policy চালানো থাকতে হবে। Public bucket-এর public URL দিয়েই ছবি দেখানো হয়।
- CSV/PDF bill এখনও local device-এ download হয়; Supabase-এ সংরক্ষণ করা হয় না।
