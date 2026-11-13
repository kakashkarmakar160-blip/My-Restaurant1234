# My Hotel – Restaurant Ordering Website

এটি একটি responsive restaurant ordering website starter project। ZIP extract করে `index.html` খুললেই **Local Preview Mode**-এ মেনু, cart, discount calculation, table selection, order, admin demo, menu editing, Today's Food, order status, receipt download এবং CSV export পরীক্ষা করা যাবে।

## ফাইল
- `index.html` – Customer page, cart, admin panel
- `styles.css` – Responsive design ও style
- `app.js` – Menu, cart, order, receipt, local preview logic
- `supabase-schema.sql` – Supabase database schema ও secure order RPC
- `README-BN.md` – এই নির্দেশিকা

## Local Preview চালানো
1. ZIP extract করুন।
2. `index.html` Chrome-এ খুলুন।
3. Customer হিসেবে খাবার Cart-এ যোগ করে টেবিল বেছে Order দিন।
4. Admin বোতামে চাপুন।
5. **Open demo admin (local preview only)** চাপলে Admin Panel খুলবে।
6. Menu, Today's food, Tables, Reports ও Settings পরীক্ষা করুন।

> Local Preview-এর ডেটা শুধু ওই browser/device-এর localStorage-এ থাকে। অন্য ফোনে নিজে থেকে sync হবে না। এটি production restaurant service নয়।

## Supabase-এ shared live data সেটআপ
1. Supabase-এ একটি project তৈরি করুন।
2. SQL Editor-এ `supabase-schema.sql`-এর সম্পূর্ণ SQL চালান।
3. Authentication > Users থেকে মালিকের account তৈরি করুন।
4. ওই user-এর UUID কপি করুন।
5. SQL Editor-এ চালান (UUID বদলে):
   ```sql
   insert into public.hotel_admins(user_id) values ('YOUR-ADMIN-USER-UUID');
   ```
6. `food_categories`, `food_items` এবং `restaurant_tables`-এ প্রাথমিক ডেটা যোগ করুন।
7. `app.js`-এর একদম নিচে Supabase URL ও anon key বসিয়ে client uncomment করুন:
   ```js
   window.supabaseClient = window.supabase.createClient(
     'https://YOUR_PROJECT.supabase.co',
     'YOUR_SUPABASE_ANON_KEY'
   );
   ```
8. Supabase-এর `service_role` key কখনো browser code-এ দেবেন না।
9. Production deployment-এর আগে app.js-এ Supabase database read/write ও realtime integration সম্পূর্ণভাবে wire করতে হবে। এই ZIP-এর UI Local Preview-এ সম্পূর্ণ interactive; SQL schema backend foundation দেয়, কিন্তু frontend-এর সব operation এখনো Supabase-এ connected নয়।

## Admin password সম্পর্কে
আগের কথোপকথনে উল্লেখ করা পাসওয়ার্ড frontend-এ hard-code করা হয়নি। Production-এ Supabase Auth ব্যবহার করুন এবং শক্তিশালী আলাদা password দিন। Demo Admin login কেবল local preview-র জন্য; এটি security boundary নয়।

## গুরুত্বপূর্ণ production checklist
- Supabase Auth + `hotel_admins` admin restriction যাচাই।
- Customer order submission-কে `place_restaurant_order` RPC-তে connect করা।
- Admin menu/settings/order CRUD-কে Supabase API-তে connect করা।
- Supabase Realtime subscription বসানো।
- Receipt-এ হোটেলের আসল তথ্য, tax/GST ও invoice requirements যাচাই।
- Public hosting-এ HTTPS চালু।
- QR Code তৈরি করে প্রতিটি টেবিলে লাগানো।
- নিয়মিত database backup রাখা।

## Tax / GST
এই starter-এ tax/GST স্বয়ংক্রিয়ভাবে যোগ করা হয় না। আপনার ব্যবসার ক্ষেত্রে প্রযোজ্য tax rate ও invoice format নিশ্চিত করে তারপর সেটি configure করবেন।
