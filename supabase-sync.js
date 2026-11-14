/* My Hotel: browser-side Supabase REST integration.
 * Uses only the public publishable key. No service_role key, no authentication.
 * Admin writes intentionally remain local because the requested password-only
 * gate is browser-side and cannot securely authorize public database writes.
 */
(() => {
  const cfg = window.MY_HOTEL_SUPABASE;
  if (!cfg?.url || !cfg?.publishableKey) return;
  const base = cfg.url.replace(/\/$/, '') + '/rest/v1';
  const headers = { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}` };
  async function request(path, options = {}) {
    const response = await fetch(`${base}/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase ${response.status}: ${detail}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }
  async function loadPublicData() {
    const [settings, categories, tables, foods] = await Promise.all([
      request('hotel_settings?select=*&limit=1'),
      request('food_categories?select=id,name,enabled&enabled=eq.true'),
      request('restaurant_tables?select=id,table_name,enabled&enabled=eq.true'),
      request('food_items?select=id,category_id,name,description,image_url,price,discount_percent,show_today,enabled&enabled=eq.true&show_today=eq.true')
    ]);
    return { settings: settings?.[0] || null, categories: categories || [], tables: tables || [], foods: foods || [] };
  }
  async function uploadImage(dataUrl, originalName = 'image.jpg') {
    const blob = await (await fetch(dataUrl)).blob();
    if (blob.size > cfg.maxImageBytes) throw new Error('Image exceeds 5 MB.');
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg','jpg');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;
    const path = `uploads/${safeName}`;
    const response = await fetch(`${cfg.url.replace(/\/$/, '')}/storage/v1/object/${cfg.imageBucket}/${path}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false' }, body: blob
    });
    if (!response.ok) throw new Error(`Image upload failed (${response.status}): ${await response.text()}`);
    return `${cfg.url.replace(/\/$/, '')}/storage/v1/object/public/${cfg.imageBucket}/${path}`;
  }
  async function createOrder(order) {
    const created = await request('restaurant_orders?select=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        order_number: order.id,
        table_label: order.table,
        status: 'Pending',
        payment_method: 'Cash at Counter',
        subtotal: order.sub,
        discount_total: order.discount,
        grand_total: order.total
      })
    });
    const orderId = created?.[0]?.id;
    if (!orderId) throw new Error('Supabase did not return the new order ID.');
    const rows = order.items.map(item => ({
      order_id: orderId,
      item_name: item.name,
      unit_price: item.price,
      discount_percent: item.off,
      quantity: item.qty,
      line_total: item.amount
    }));
    await request('restaurant_order_items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(rows)
    });
    return orderId;
  }
  window.MyHotelCloud = { loadPublicData, createOrder, uploadImage };
})();
