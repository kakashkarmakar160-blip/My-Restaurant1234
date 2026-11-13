/* My Hotel starter. Local preview stores data in this browser. For shared live ordering,
   configure Supabase and follow README + supabase-schema.sql before production use. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY='myhotel_v1';
const defaultData={
 settings:{hotelName:'My Hotel',tagline:'Fresh food • Happy moments',phone:'',address:'',currency:'₹',fontSize:16,cardSize:'normal',accent:'#237653',language:'en',discountNote:'',logoText:'MH'},
 foods:[
  {id:'f1',name:'Chicken Biryani',nameBn:'চিকেন বিরিয়ানি',category:'Biryani',price:220,discount:10,image:'',description:'Aromatic rice with tender chicken',available:true,today:true},
  {id:'f2',name:'Veg Fried Rice',nameBn:'ভেজ ফ্রাইড রাইস',category:'Veg',price:140,discount:0,image:'',description:'Wok tossed vegetable rice',available:true,today:true},
  {id:'f3',name:'Chicken Chaap',nameBn:'চিকেন চাপ',category:'Non-Veg',price:190,discount:5,image:'',description:'Rich and flavourful classic',available:true,today:true},
  {id:'f4',name:'Paneer Butter Masala',nameBn:'পনির বাটার মসালা',category:'Veg',price:180,discount:0,image:'',description:'Creamy tomato gravy',available:true,today:true},
  {id:'f5',name:'Cold Drinks',nameBn:'ঠান্ডা পানীয়',category:'Drinks',price:40,discount:0,image:'',description:'Chilled soft drink',available:true,today:true},
  {id:'f6',name:'Gulab Jamun',nameBn:'গুলাব জামুন',category:'Dessert',price:60,discount:0,image:'',description:'Two pieces',available:true,today:true}
 ],
 tables:[1,2,3,4,5,6].map(n=>({id:n,name:'Table '+String(n).padStart(2,'0'),active:true})),
 orders:[],cart:{},lastOrderId:null
};
let data=load(),activeCategory='All',isBn=false,admin=false;
function load(){try{return {...structuredClone(defaultData),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(defaultData)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function money(n){return `${data.settings.currency||'₹'}${Number(n||0).toFixed(2)}`}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2300)}
const tr=(en,bn)=>isBn?bn:en;
function discounted(f){return Math.max(0,Number(f.price)*(1-Number(f.discount||0)/100))}
function currentFoods(){return data.foods.filter(f=>f.available && f.today)}
function setBrand(){
 const s=data.settings;$('#hotelName').textContent=s.hotelName||'My Hotel';$('#footerHotel').textContent=s.hotelName||'My Hotel';$('#hotelTagline').textContent=s.tagline||'';$('#brandMark').textContent=s.logoText||'MH';
 document.documentElement.style.setProperty('--accent',s.accent||'#237653');document.documentElement.style.setProperty('--font-size',(s.fontSize||16)+'px');
 document.body.dataset.size=s.cardSize||'normal';
}
function renderCategories(){
 const cats=['All',...new Set(currentFoods().map(f=>f.category))];
 $('#categories').innerHTML=cats.map(c=>`<button class="category ${activeCategory===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
 $$('#categories button').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCategories();renderFoods()});
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderFoods(){
 const list=currentFoods().filter(f=>activeCategory==='All'||f.category===activeCategory);
 $('#foodGrid').innerHTML=list.length?list.map(f=>`<article class="food-card"><div class="food-photo">${f.image?`<img src="${esc(f.image)}" alt="${esc(f.name)}" onerror="this.remove()">`:'🍲'}</div><div class="food-info"><h3>${esc(isBn?(f.nameBn||f.name):f.name)}</h3><p>${esc(f.description||f.category)}</p><div class="price-row"><span class="price">${money(discounted(f))}</span>${f.discount?`<span class="old-price">${money(f.price)}</span><span class="discount">${f.discount}% OFF</span>`:''}</div><div class="food-bottom"><small class="muted">${esc(f.category)}</small><button class="add-btn" data-add="${f.id}">＋ Add</button></div></div></article>`).join(''):`<p class="muted">No food available today. Please check again later.</p>`;
 $$('[data-add]').forEach(b=>b.onclick=()=>{const id=b.dataset.add;data.cart[id]=(data.cart[id]||0)+1;save();updateCartCount();toast('Added to cart')});
}
function updateCartCount(){$('#cartCount').textContent=Object.values(data.cart).reduce((a,b)=>a+b,0)}
function cartTotals(){
 let subtotal=0,total=0,discount=0,rows=[];
 for(const [id,q] of Object.entries(data.cart)){const f=data.foods.find(x=>x.id===id);if(!f)continue;const line=Number(f.price)*q,off=line*Number(f.discount||0)/100;subtotal+=line;discount+=off;total+=line-off;rows.push({f,q,line,off,net:line-off})}
 return {subtotal,discount,total,rows};
}
function renderCart(){
 const {subtotal,discount,total,rows}=cartTotals();
 $('#cartItems').innerHTML=rows.length?rows.map(({f,q,net})=>`<div class="cart-row"><div><b>${esc(isBn?(f.nameBn||f.name):f.name)}</b><div class="muted">${money(discounted(f))} each</div></div><div class="qty"><button data-dec="${f.id}">−</button>${q}<button data-inc="${f.id}">＋</button></div><b>${money(net)}</b></div>`).join(''):'<p class="muted">Your cart is empty.</p>';
 $$('[data-dec]').forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));$$('[data-inc]').forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));
 $('#billBox').innerHTML=`<div class="bill-line"><span>Subtotal</span><b>${money(subtotal)}</b></div><div class="bill-line"><span>Discount</span><b>− ${money(discount)}</b></div><div class="bill-line bill-total"><span>Grand total</span><b>${money(total)}</b></div><small class="muted">Taxes are not added in this starter. Configure applicable tax rules before using for business.</small>`;
}
function changeQty(id,n){data.cart[id]=(data.cart[id]||0)+n;if(data.cart[id]<=0)delete data.cart[id];save();updateCartCount();renderCart()}
function openModal(id){$('#'+id).classList.remove('hidden')}function closeModal(id){$('#'+id).classList.add('hidden')}
function renderTables(){
 const sel=$('#tableSelect');sel.innerHTML=data.tables.filter(t=>t.active).map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');
 const requested=new URLSearchParams(location.search).get('table');if(requested&&[...sel.options].some(o=>o.value===requested))sel.value=requested;
}
function placeOrder(){
 const {subtotal,discount,total,rows}=cartTotals();if(!rows.length){toast('Please add food first');return}
 const order={id:'MH-'+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),tableId:$('#tableSelect').value,tableName:data.tables.find(t=>String(t.id)===$('#tableSelect').value)?.name||'Table',customer:$('#customerName').value.trim(),notes:$('#orderNotes').value.trim(),items:rows.map(({f,q,line,off,net})=>({foodId:f.id,name:f.name,nameBn:f.nameBn,quantity:q,unitPrice:f.price,discount:f.discount,lineTotal:line,discountAmount:off,total:net})),subtotal,discount,total,status:'Pending',payment:'Cash at Counter'};
 data.orders.unshift(order);data.lastOrderId=order.id;data.cart={};save();updateCartCount();closeModal('cartModal');$('#customerOrder').classList.remove('hidden');$('#customerOrderInfo').textContent=`${order.id} · ${order.tableName} · ${money(order.total)}`;$('#customerOrderStatus').textContent='Pending';toast('Order placed successfully!');renderAdmin();
}
function receiptText(order){
 const s=data.settings;return `${s.hotelName}\n${s.tagline||''}\n${s.address||''}\n${s.phone||''}\n--------------------------------\nBILL: ${order.id}\nDate: ${new Date(order.createdAt).toLocaleString()}\nTable: ${order.tableName}\n--------------------------------\n${order.items.map(i=>`${i.name} x${i.quantity}  ${money(i.total)}`).join('\n')}\n--------------------------------\nSubtotal: ${money(order.subtotal)}\nDiscount: -${money(order.discount)}\nTOTAL: ${money(order.total)}\nPayment: Cash at Counter\n\nThank you for dining with us!`;
}
function downloadBill(order){
 const {jsPDF}=window.jspdf||{};if(!jsPDF){toast('PDF library unavailable.');return}
 const doc=new jsPDF({unit:'mm',format:[80,Math.max(130,95+order.items.length*9)]});let y=12;
 doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(data.settings.hotelName||'My Hotel',40,y,{align:'center'});y+=7;
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text((data.settings.tagline||'').slice(0,50),40,y,{align:'center'});y+=8;
 doc.text(`Bill: ${order.id}`,5,y);y+=5;doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`,5,y);y+=5;doc.text(`Table: ${order.tableName}`,5,y);y+=7;doc.line(5,y,75,y);y+=6;
 order.items.forEach(i=>{doc.text(`${i.name} x${i.quantity}`,5,y);doc.text(money(i.total),75,y,{align:'right'});y+=6});
 doc.line(5,y,75,y);y+=7;doc.text(`Subtotal: ${money(order.subtotal)}`,5,y);y+=5;doc.text(`Discount: -${money(order.discount)}`,5,y);y+=7;doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(`TOTAL: ${money(order.total)}`,5,y);y+=10;doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text('Thank you for dining with us!',40,y,{align:'center'});doc.save(`${order.id}-bill.pdf`);
 // Also create a shareable receipt image from a simple canvas.
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=720;canvas.height=Math.max(900,330+order.items.length*65);ctx.fillStyle='#fff';ctx.fillRect(0,0,720,canvas.height);ctx.fillStyle='#17251f';ctx.textAlign='center';ctx.font='bold 38px Arial';ctx.fillText(data.settings.hotelName||'My Hotel',360,65);ctx.font='22px Arial';ctx.fillText(`BILL ${order.id}  •  ${order.tableName}`,360,110);ctx.textAlign='left';ctx.font='22px Arial';let yy=180;order.items.forEach(i=>{ctx.fillText(`${i.name} x${i.quantity}`,55,yy);ctx.textAlign='right';ctx.fillText(money(i.total),665,yy);ctx.textAlign='left';yy+=55});ctx.fillRect(50,yy,620,2);yy+=55;ctx.fillText(`Subtotal: ${money(order.subtotal)}`,55,yy);yy+=45;ctx.fillText(`Discount: -${money(order.discount)}`,55,yy);yy+=60;ctx.font='bold 30px Arial';ctx.fillText(`TOTAL: ${money(order.total)}`,55,yy);yy+=70;ctx.font='22px Arial';ctx.textAlign='center';ctx.fillText('Thank you for dining with us!',360,yy);const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`${order.id}-bill.png`;a.click();
}
$('#customerBillBtn').onclick=()=>{const o=data.orders.find(x=>x.id===data.lastOrderId);if(o)downloadBill(o)};
function renderAdmin(){
 $('#ordersList').innerHTML=data.orders.filter(o=>o.status!=='Completed').map(o=>`<article class="order-card"><div class="order-top"><div><h4>${esc(o.id)} · ${esc(o.tableName)}</h4><small class="muted">${new Date(o.createdAt).toLocaleString()}</small></div><span class="status">${esc(o.status)}</span></div><p>${o.items.map(i=>`${esc(i.name)} × ${i.quantity}`).join(' · ')}</p><p><b>${money(o.total)}</b> · ${esc(o.payment)} ${o.customer?'· '+esc(o.customer):''}</p>${o.notes?`<p>Note: ${esc(o.notes)}</p>`:''}<div class="order-actions"><select data-status="${o.id}">${['Pending','Preparing','Ready','Completed'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select><button class="primary" data-update="${o.id}">Update status</button><button class="ghost" data-bill="${o.id}">Bill</button></div></article>`).join('')||'<p class="muted">No active orders yet.</p>';
 $$('[data-update]').forEach(b=>b.onclick=()=>{const o=data.orders.find(x=>x.id===b.dataset.update);o.status=$(`[data-status="${o.id}"]`).value;save();renderAdmin();toast('Order status updated')});
 $$('[data-bill]').forEach(b=>b.onclick=()=>downloadBill(data.orders.find(x=>x.id===b.dataset.bill)));
 $('#adminFoodList').innerHTML=data.foods.map(f=>`<div class="admin-food-row">${f.image?`<img src="${esc(f.image)}">`:'<div class="brand-mark">🍽</div>'}<div class="grow"><b>${esc(f.name)}</b><p>${esc(f.category)} · ${money(f.price)} · ${f.discount}% off</p></div><button class="small-btn" data-edit="${f.id}">Edit</button><button class="small-btn" data-delete="${f.id}">Delete</button></div>`).join('');
 $$('[data-edit]').forEach(b=>b.onclick=()=>editFood(b.dataset.edit));$$('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Delete this food item?')){data.foods=data.foods.filter(f=>f.id!==b.dataset.delete);save();renderAll()}});
 $('#todayList').innerHTML=data.foods.map(f=>`<label class="check-item"><input type="checkbox" data-today="${f.id}" ${f.today?'checked':''}> <span>${esc(f.name)} <small class="muted">(${esc(f.category)})</small></span></label>`).join('');
 $('#tableList').innerHTML=data.tables.map(t=>`<div class="table-tile"><b>🪑 ${esc(t.name)}</b><p class="muted">Table ID: ${t.id}</p><button class="small-btn" data-table-toggle="${t.id}">${t.active?'Disable':'Enable'}</button></div>`).join('');
 $$('[data-table-toggle]').forEach(b=>b.onclick=()=>{const t=data.tables.find(x=>String(x.id)===b.dataset.tableToggle);t.active=!t.active;save();renderTables();renderAdmin()});
 const completed=data.orders.filter(o=>o.status==='Completed'),revenue=completed.reduce((s,o)=>s+o.total,0);
 $('#stats').innerHTML=`<div class="stat"><strong>${data.orders.length}</strong><span>Total orders</span></div><div class="stat"><strong>${money(revenue)}</strong><span>Completed sales</span></div><div class="stat"><strong>${completed.length}</strong><span>Completed orders</span></div>`;
 $('#historyList').innerHTML=data.orders.slice(0,15).map(o=>`<div class="bill-line"><span>${esc(o.id)} · ${esc(o.tableName)} · ${esc(o.status)}</span><b>${money(o.total)}</b></div>`).join('')||'<p class="muted">No order history.</p>';
}
function editFood(id){const f=data.foods.find(x=>x.id===id);const form=$('#foodForm');form.reset();for(const k of ['id','name','nameBn','category','price','discount','image','description','available']){if(form.elements[k]){if(k==='available')form.elements[k].checked=f[k]!==false;else form.elements[k].value=f[k]??''}}$('#foodModalTitle').textContent='Edit food';openModal('foodModal')}
function renderSettings(){const f=$('#settingsForm');Object.entries(data.settings).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v})}
function renderAll(){setBrand();renderCategories();renderFoods();renderTables();updateCartCount();renderAdmin();renderSettings()}
$('#cartOpen').onclick=()=>{renderCart();renderTables();openModal('cartModal')};$('#placeOrder').onclick=placeOrder;
$('#adminOpen').onclick=()=>openModal('adminLoginModal');$('#demoAdmin').onclick=()=>{admin=true;closeModal('adminLoginModal');$('#customerView').classList.add('hidden');$('#adminView').classList.remove('hidden');renderAdmin()};
$('#adminLogout').onclick=()=>{admin=false;$('#adminView').classList.add('hidden');$('#customerView').classList.remove('hidden')};
$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#loginError').textContent='';try{if(!window.supabaseClient){throw new Error('Supabase is not configured. Use demo mode or configure credentials in app.js.')};const {error}=await window.supabaseClient.auth.signInWithPassword({email:e.target.email.value,password:e.target.password.value});if(error)throw error;admin=true;closeModal('adminLoginModal');$('#customerView').classList.add('hidden');$('#adminView').classList.remove('hidden')}catch(err){$('#loginError').textContent=err.message}};
$('#adminTabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;$$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.admin-section').forEach(x=>x.classList.add('hidden'));$('#tab-'+b.dataset.tab).classList.remove('hidden');if(b.dataset.tab==='settings')renderSettings()};
$('#refreshOrders').onclick=()=>{renderAdmin();toast('Orders refreshed')};
$('#addFood').onclick=()=>{$('#foodForm').reset();$('#foodForm').elements.id.value='';$('#foodModalTitle').textContent='Add food';openModal('foodModal')};
$('#foodForm').onsubmit=e=>{e.preventDefault();const f=e.target,id=f.elements.id.value;const obj={id:id||'f'+Date.now(),name:f.elements.name.value,nameBn:f.elements.nameBn.value,category:f.elements.category.value,price:Number(f.elements.price.value),discount:Number(f.elements.discount.value||0),image:f.elements.image.value,description:f.elements.description.value,available:f.elements.available.checked,today:id?(data.foods.find(x=>x.id===id)?.today??true):true};if(id)data.foods=data.foods.map(x=>x.id===id?obj:x);else data.foods.push(obj);save();closeModal('foodModal');renderAll();toast('Food saved')};
$('#saveToday').onclick=()=>{$$('[data-today]').forEach(c=>{const f=data.foods.find(x=>x.id===c.dataset.today);f.today=c.checked});save();renderAll();toast("Today's menu updated")};
$('#addTable').onclick=()=>{const n=data.tables.length?Math.max(...data.tables.map(t=>Number(t.id)||0))+1:1;data.tables.push({id:n,name:'Table '+String(n).padStart(2,'0'),active:true});save();renderTables();renderAdmin()};
$('#settingsForm').onsubmit=e=>{e.preventDefault();const f=e.target;for(const k of Object.keys(data.settings)){if(f.elements[k])data.settings[k]=f.elements[k].value}data.settings.fontSize=Number(data.settings.fontSize);save();renderAll();toast('Settings saved')};
$('#exportCsv').onclick=()=>{const headers=['Order ID','Date','Table','Customer','Status','Food','Quantity','Unit price','Discount %','Line total','Order total','Payment'];const rows=[headers];data.orders.forEach(o=>o.items.forEach(i=>rows.push([o.id,o.createdAt,o.tableName,o.customer,o.status,i.name,i.quantity,i.unitPrice,i.discount,i.total,o.total,o.payment])));const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='my-hotel-orders.csv';a.click();URL.revokeObjectURL(a.href)};
$('#languageBtn').onclick=()=>{isBn=!isBn;$('#languageBtn').textContent=isBn?'English':'বাংলা';renderAll()};
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));$$('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)closeModal(o.id)}));
if(data.lastOrderId){const o=data.orders.find(x=>x.id===data.lastOrderId);if(o){$('#customerOrder').classList.remove('hidden');$('#customerOrderInfo').textContent=`${o.id} · ${o.tableName} · ${money(o.total)}`;$('#customerOrderStatus').textContent=o.status}}
renderAll();

// Optional Supabase client setup: paste your public project URL + anon key here.
// Never put a service_role key or admin password in this browser file.
// window.supabaseClient = window.supabase.createClient('https://YOUR_PROJECT.supabase.co','YOUR_SUPABASE_ANON_KEY');
