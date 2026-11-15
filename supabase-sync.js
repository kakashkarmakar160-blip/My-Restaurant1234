/* My Hotel: Supabase REST integration for orders, menu, settings and image URLs.
 * Uses only the public publishable key. No service_role key or Supabase Auth.
 * IMPORTANT: anonymous admin writes require public RLS policies; anyone can call these APIs.
 */
(() => {
  const cfg = window.MY_HOTEL_SUPABASE;
  if (!cfg?.url || !cfg?.publishableKey) return;
  const projectUrl = cfg.url.replace(/\/$/, '');
  const base = projectUrl + '/rest/v1';
  const headers = { apikey: cfg.publishableKey, Authorization: `Bearer ${cfg.publishableKey}` };

  async function request(path, options = {}) {
    const response = await fetch(`${base}/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const responseText = await response.text();
    if (!response.ok) {
      let detail = responseText;
      try { detail = JSON.stringify(JSON.parse(responseText)); } catch {}
      throw new Error(`Supabase ${response.status}: ${detail || response.statusText || 'Request failed'}`);
    }
    if (!responseText || !responseText.trim()) return null;
    try { return JSON.parse(responseText); }
    catch { throw new Error(`Supabase returned a non-JSON response (${response.status}): ${responseText.slice(0, 300)}`); }
  }
  const jsonHeaders = { 'Content-Type': 'application/json' };

  async function loadPublicData() {
    const [settings, categories, tables, foods] = await Promise.all([
      request('hotel_settings?select=*&id=eq.true&limit=1'),
      request('food_categories?select=id,name,enabled&order=name.asc'),
      request('restaurant_tables?select=id,table_name,enabled&order=table_name.asc'),
      request('food_items?select=id,category_id,name,description,image_url,price,discount_percent,show_today,enabled&order=name.asc')
    ]);
    return { settings: settings?.[0] || null, categories: categories || [], tables: tables || [], foods: foods || [] };
  }

  // Admin order history is fetched from Supabase, not browser localStorage.
  async function loadOrders() {
    const [orders, items] = await Promise.all([
      request('restaurant_orders?select=*&order=created_at.desc'),
      request('restaurant_order_items?select=*&order=id.asc')
    ]);
    const byOrder = new Map();
    for (const item of (items || [])) {
      const list = byOrder.get(item.order_id) || [];
      list.push({
        name: item.item_name, qty: Number(item.quantity || 0),
        price: Number(item.unit_price || 0),
        off: Number(item.discount_percent || 0),
        amount: Number(item.line_total || 0)
      });
      byOrder.set(item.order_id, list);
    }
    return (orders || []).map(order => ({
      id: order.order_number || order.id,
      _dbId: order.id,
      date: order.created_at,
      table: order.table_label || '',
      total: Number(order.grand_total || 0),
      sub: Number(order.subtotal || 0),
      discount: Number(order.discount_total || 0),
      items: byOrder.get(order.id) || [],
      status: order.status || 'Pending'
    }));
  }

  async function updateOrderStatus(id, status) {
    if (!id) throw new Error('Order database ID is missing.');
    await request(`restaurant_orders?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...jsonHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ status })
    });
  }

  async function uploadImage(dataUrl, originalName = 'image.jpg') {
    const blob = await (await fetch(dataUrl)).blob();
    if (blob.size > cfg.maxImageBytes) throw new Error('Image exceeds 5 MB.');
    const mime = blob.type || 'image/jpeg';
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(mime)) throw new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
    const ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `uploads/${safeName}`;
    const response = await fetch(`${projectUrl}/storage/v1/object/${cfg.imageBucket}/${path}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': mime, 'x-upsert': 'false' },
      body: blob
    });
    if (!response.ok) throw new Error(`Image upload failed (${response.status}): ${await response.text()}`);
    return `${projectUrl}/storage/v1/object/public/${cfg.imageBucket}/${path}`;
  }

  async function saveSettings(s) {
    const row = {
      id: true,
      hotel_name: s.name || 'My Hotel',
      tagline: s.tag || '',
      welcome_message: s.welcome || '',
      phone: s.phone || '',
      address: s.address || '',
      logo_text: s.logo || 'MH',
      logo_image_url: s.logoImage || null,
      welcome_image_url: s.welcomeImage || null,
      menu_image_url: s.menuImage || null,
      accent_color: s.accent || '#c88b48',
      font_size: Number(s.font || 16)
    };
    await request('hotel_settings?on_conflict=id', {
      method: 'POST', headers: { ...jsonHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row)
    });
    return true;
  }

  async function ensureCategory(name) {
    const safe = encodeURIComponent(name);
    const found = await request(`food_categories?select=id,name&name=eq.${safe}&limit=1`);
    if (found?.length) return found[0];
    const made = await request('food_categories', {
      method: 'POST', headers: { ...jsonHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ name, enabled: true })
    });
    if (!made?.[0]?.id) throw new Error('Category was not returned by Supabase.');
    return made[0];
  }

  async function addCategory(name) {
    return await ensureCategory(name);
  }

  async function addFood(food) {
    const category = await ensureCategory(food.cat);
    const rows = await request('food_items', {
      method: 'POST', headers: { ...jsonHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({
        category_id: category.id, name: food.name, description: food.desc || '',
        image_url: food.img, price: Number(food.price), discount_percent: Number(food.off || 0),
        show_today: food.today !== false, enabled: true
      })
    });
    if (!rows?.[0]?.id) throw new Error('Food item was not returned by Supabase.');
    return { ...food, id: rows[0].id };
  }

  async function updateFoodImage(id, imageUrl) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))) return;
    await request(`food_items?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...jsonHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ image_url: imageUrl })
    });
  }

  async function deleteFood(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))) return;
    await request(`food_items?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }

  async function setFoodToday(id, showToday) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))) return;
    await request(`food_items?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...jsonHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ show_today: !!showToday })
    });
  }

  async function addTable(name) {
    const rows = await request('restaurant_tables', {
      method: 'POST', headers: { ...jsonHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ table_name: name, enabled: true })
    });
    if (!rows?.[0]?.id) throw new Error('Table was not returned by Supabase.');
    return { id: rows[0].id, name: rows[0].table_name, on: rows[0].enabled };
  }

  async function setTableEnabled(id, enabled) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id))) return;
    await request(`restaurant_tables?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...jsonHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ enabled: !!enabled })
    });
  }

  async function initialize(localDb) {
    const existingSettings = await request('hotel_settings?select=id&limit=1');
    if (!existingSettings?.length) await saveSettings(localDb.settings || {});

    const existingCategories = await request('food_categories?select=id&limit=1');
    if (!existingCategories?.length) {
      for (const name of (localDb.cats || [])) await ensureCategory(name);
    }

    const existingTables = await request('restaurant_tables?select=id&limit=1');
    if (!existingTables?.length) {
      for (const table of (localDb.tables || [])) await addTable(table.name);
    }

    const existingFoods = await request('food_items?select=id&limit=1');
    if (!existingFoods?.length) {
      for (const food of (localDb.foods || [])) {
        await addFood({ ...food, img: food.img || '', today: food.today !== false });
      }
    }
    return await loadPublicData();
  }

  async function createOrder(order) {
    const orderId = (window.crypto && typeof window.crypto.randomUUID === 'function')
      ? window.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    try {
      await request('restaurant_orders', {
        method: 'POST', headers: { ...jsonHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ id: orderId, order_number: order.id, table_label: order.table,
          status: 'Pending', payment_method: 'Cash at Counter', subtotal: order.sub,
          discount_total: order.discount, grand_total: order.total })
      });
    } catch (err) { throw new Error(`অর্ডারের মূল তথ্য restaurant_orders-এ সংরক্ষণ হয়নি। ${err.message}`); }
    const rows = order.items.map(item => ({ order_id: orderId, item_name: item.name,
      unit_price: item.price, discount_percent: item.off, quantity: item.qty, line_total: item.amount }));
    try {
      await request('restaurant_order_items', {
        method: 'POST', headers: { ...jsonHeaders, Prefer: 'return=minimal' }, body: JSON.stringify(rows)
      });
    } catch (err) {
      throw new Error(`অর্ডারের মূল তথ্য সংরক্ষিত হয়েছে (Order ID: ${orderId}), কিন্তু খাবারের তালিকা সংরক্ষণ হয়নি। ${err.message}`);
    }
    return orderId;
  }

  window.MyHotelCloud = { loadPublicData, loadOrders, updateOrderStatus, initialize, createOrder, uploadImage, saveSettings,
    addCategory, addFood, updateFoodImage, deleteFood, setFoodToday, addTable, setTableEnabled };
})();
