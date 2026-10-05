/* ClothCycle - vanilla JS demo. Data layer is isolated in DB/save() so Firebase/Supabase can replace it. */
const $=s=>document.querySelector(s);
const API=localStorage.getItem('cc_api')||''; // set to http://<server-ip>:5000 inside the APK
async function api(p,m='GET',b){const r=await fetch(API+p,{method:m,headers:{'Content-Type':'application/json','X-Admin-Key':sessionStorage.getItem('adm')||''},body:b?JSON.stringify(b):undefined});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d}
const act=(p,body,cb)=>api(p,'POST',body).then(r=>{Object.assign(S,r.state);if(cb)cb(r);render()}).catch(x=>toast(x.message));
// Impact assumptions (illustrative averages for awareness, NOT measured values)
const F={co2:3.3,water:2000,energy:25,waste:0.4,rentShare:0.5}; // per garment reused: kg CO2e, litres, MJ, kg
const LCA=[['Raw material',34],['Manufacturing',38],['Transport',6],['Use phase',17],['End of life',5]]; // % of a garment's footprint (illustrative)
let THRIFT=[],RENT=[],PLACES=[];
const TIERS=[[100,25],[250,50],[500,100],[1000,250]];
let S={applied:'',loc:null,cart:[],wish:[],coupons:[],notifs:[],hist:[],passports:[],points:0,donated:0,thrifted:0,recycledKg:0,rented:0};
const save=()=>api('/api/sync','PUT',{cart:S.cart,wish:S.wish}).catch(()=>toast('Could not reach server')); // syncs cart and wishlist
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='show';setTimeout(()=>t.className='',2500)};
const modal=h=>{$('#modalBody').innerHTML=h;$('#modal').hidden=false;$('#modal .btn').focus()};
const rs=n=>'Rs '+n;
const items=()=>S.donated+S.thrifted+S.rented*F.rentShare;
const img=(c,t)=>`<div class="img" style="background:linear-gradient(160deg,${c},#2226)">${t||''}</div>`;
const bar=(v,m)=>`<div class="bar"><i style="width:${Math.min(100,v/m*100)}%"></i></div>`;

/* ---------- views ---------- */
const V={};
V.home=()=>{const n=items();return `
<div class="hero"><h1>Give your clothes a second life.</h1><p>Donate, thrift, rent and recycle. Keep textiles out of landfills.</p>
</div>
<section><h2>Quick actions</h2><div class="grid">${[['donate','Donate'],['thrift','Thrift'],['rent','Rent'],['recycle','Recycle'],['nearby','Find Nearby']].map(a=>`<a class="card" href="#${a[0]}"><h3>${a[1]}</h3></a>`).join('')}</div></section>
<section><h2>Your ClothCycle Impact</h2><div class="grid">
<div class="card stat"><b>${S.donated}</b><span>items donated</span></div><div class="card stat"><b>${S.thrifted}</b><span>items thrifted</span></div>
<div class="card stat"><b>${S.rented}</b><span>items rented</span></div><div class="card stat"><b>${S.recycledKg} kg</b><span>recycled</span></div>
<div class="card stat"><b>${S.points}</b><span>CyclePoints</span></div></div>
<div class="card" style="margin-top:.8rem"><span>Progress to next reward</span>${nextTier()}</div></section>
<section><h2>How ClothCycle works</h2><ol><li>Give: list clothes by condition.</li><li>Route: we suggest donate, thrift, rent or recycle.</li><li>Reuse: items reach a new wearer.</li><li>Reward: earn CyclePoints, redeem for discounts.</li></ol></section>`};
function nextTier(){const t=TIERS.find(t=>S.points<t[0]);return t?`${bar(S.points,t[0])}<b>${t[0]-S.points} more points to unlock ${rs(t[1])} off</b>`:'<b>All tiers unlocked</b>'}

V.donate=()=>`<h1>Give Clothes a Second Life</h1>
<form class="card" id="donForm" novalidate>
<label for="dn">Clothing name</label><input id="dn" required><div class="err" id="e_dn"></div>
<div class="row"><div><label for="dc">Category</label><select id="dc">${['T-shirt','Shirt','Jeans','Dress','Jacket','Shoes','Kidswear','Other'].map(x=>`<option>${x}</option>`).join('')}</select></div>
<div><label for="ds">Size</label><input id="ds" value="M"></div></div>
<div class="row"><div><label for="dk">Condition</label><select id="dk" data-act="route">${['Like New','Good','Used','Worn / Damaged'].map(x=>`<option>${x}</option>`).join('')}</select></div>
<div><label for="dq">Quantity</label><input id="dq" type="number" min="1" value="1"></div></div>
<label for="dp">Photo</label><input id="dp" type="file" accept="image/*"><img id="prev" alt="" style="max-width:120px;display:none;margin-top:.4rem">
<label for="dd">Description</label><textarea id="dd" rows="2"></textarea>
<div class="route" id="route"></div>
<label for="dest">Choose destination</label><select id="dest"><option>Donate to NGO</option><option>List for Thrift</option><option>Send for Recycling</option></select>
<div class="row"><div><label for="pk">Pickup</label><select id="pk"><option>Doorstep pickup</option><option>Nearby drop-off point</option></select></div>
<div><label for="pd">Date and time</label><input id="pd" type="datetime-local"></div></div><div class="err" id="e_pd"></div>
<p></p><button class="btn" type="submit">Confirm donation</button></form>`;
const routeFor=c=>c==='Worn / Damaged'?['Recommended for textile recycling','Fabric is too worn for another wearer, so recycling recovers the fibre.','Send for Recycling']:c==='Used'?['Suitable for donation or upcycling','Still wearable, but better suited to NGOs or upcycling partners.','Donate to NGO']:['Suitable for donation or thrift','Wearable condition. It can directly reach a new owner.','Donate to NGO'];
function showRoute(){const r=routeFor($('#dk').value);$('#route').innerHTML=`<b>${r[0]}</b><br>${r[1]}`;$('#dest').value=r[2]}

V.thrift=()=>{const c=window._tc||'All',q=(window._q||'').toLowerCase(),so=window._so||'Nearest';
let l=THRIFT.filter(p=>(c==='All'||p.cat===c)&&p.name.toLowerCase().includes(q)&&(!window._cond||p.cond===window._cond));
l.sort((a,b)=>so==='Nearest'?a.dist-b.dist:so==='Lowest price'?a.price-b.price:b.added-a.added);
return `<h1>Thrift. Don't Throw.</h1><p>Thrift Near You: sorted by distance to cut transport.</p>
<input id="q" placeholder="Search thrift (try Denim)" value="${window._q||''}" aria-label="Search">
<div class="row" style="margin:.6rem 0">${['All','Women','Men','Kids','Accessories','Shoes'].map(x=>`<button class="btn ${x===c?'':'alt'}" data-act="cat" data-v="${x}">${x}</button>`).join('')}</div>
<div class="row"><select id="so" aria-label="Sort">${['Nearest','Lowest price','Newest'].map(x=>`<option ${x===so?'selected':''}>${x}</option>`).join('')}</select>
<select id="cf" aria-label="Condition"><option value="">Any condition</option>${['Like New','Good','Used'].map(x=>`<option ${x===window._cond?'selected':''}>${x}</option>`).join('')}</select></div>
<section class="grid w">${l.length?l.map(p=>`<div class="card">${img(p.color,p.cat)}<h3>${p.name}</h3><span class="tag">${p.cond}</span><span class="tag">Size ${p.size}</span>
<p>${rs(p.price)} / ${p.dist} km away / ${p.seller}</p><span class="tag">Reuse saves ~${F.co2} kg CO2e</span>
<div class="row" style="margin-top:.6rem"><button class="btn" data-act="add" data-id="${p.id}">Add to Cart</button><button class="btn alt" data-act="buy" data-id="${p.id}">Buy Now</button>
<button class="btn alt" data-act="wish" data-id="${p.id}">${S.wish.includes(p.id)?'Saved':'Save'}</button><button class="btn alt" data-act="view" data-id="${p.id}">Details</button></div></div>`).join(''):`<div class="card">No items match. Clear the search or filters.</div>`}</section>`};
const wallet=p=>`<h3>Wardrobe Passport</h3><p>ID: CC-2026-${String(400+p.id).padStart(5,'0')} | Original category: ${p.cat} | Condition: ${p.cond} | Approx. age: ${p.age} yr</p>
<div class="tl"><div><b>Donated</b> by ${p.seller}</div><div><b>Quality checked</b> ${p.cond}</div><div><b>Listed</b> on ClothCycle</div><div><b>Purchased</b> pending</div><div><b>Second life</b></div></div>`;

V.rent=()=>`<h1>Rent. Wear. Return.</h1><p>Occasion wear used once is wasteful. Renting spreads one garment across many wearers.</p>
<div class="grid w">${RENT.map(r=>`<div class="card">${img(r.color,r.cat)}<h3>${r.name}</h3><span class="tag">Size ${r.size}</span><p>${rs(r.perDay)} per day</p>
<button class="btn" data-act="rent" data-id="${r.id}">Rent</button></div>`).join('')}</div>`;

V.recycle=()=>`<h1>Recycle What Can't Be Reused</h1><p>Not every garment can be donated. We route worn and damaged textiles toward recycling or upcycling.</p>
<form class="card" id="recForm" novalidate><label for="rw">Estimated weight (kg)</label><input id="rw" type="number" step="0.1" min="0.1"><div class="err" id="e_rw"></div>
<label for="rm">Material</label><select id="rm">${['Cotton','Polyester','Denim','Mixed','Unknown'].map(x=>`<option>${x}</option>`).join('')}</select>
<label for="rp">Method</label><select id="rp"><option>Doorstep pickup</option><option>Nearby recycling center</option></select>
<label for="rf">Photo</label><input id="rf" type="file" accept="image/*"><div class="route" id="est">Estimated reward: 0 CyclePoints</div>
<button class="btn" type="submit">Confirm pickup</button></form>
<section><h2>Nearby recycling</h2>${PLACES.filter(p=>p.type==='Recycling Center').map(placeCard).join('')}</section>`;

V.rewards=()=>`<h1>CyclePoints</h1><div class="card stat"><b>${S.points} Points</b>${nextTier()}</div>
<section><h2>Reward tiers</h2><div class="grid">${TIERS.map(t=>`<div class="card"><h3>${rs(t[1])} off</h3><p>${t[0]} points</p><button class="btn" data-act="redeem" data-p="${t[0]}" data-d="${t[1]}" ${S.points<t[0]?'disabled':''}>${S.points<t[0]?'Locked':'Redeem'}</button></div>`).join('')}</div></section>
<section><h2>Your coupons</h2>${S.coupons.length?S.coupons.map(c=>`<span class="tag">${c.code} - ${rs(c.d)} off</span>`).join(''):'<p>No coupons yet. Redeem a tier above.</p>'}</section>
<section><h2>How to earn</h2><table>${[['Donate a wearable item',50],['Donate 3+ items (bonus)',100],['Recycle per kg',30],['Buy a thrifted item',20],['Use a drop-off point',25],['Rent a garment',10],['Refer a friend',75]].map(a=>`<tr><td>${a[0]}</td><td>+${a[1]}</td></tr>`).join('')}</table></section>
<section><h2>History</h2><table>${S.hist.slice(0,10).map(h=>`<tr><td>${h[0]}</td><td>${h[1]>0?'+':''}${h[1]}</td></tr>`).join('')}</table></section>`;

V.cart=()=>{const l=S.cart.map(id=>THRIFT.find(p=>p.id===id)).filter(Boolean);const sub=l.reduce((a,p)=>a+p.price,0);const cp=S.coupons.find(c=>c.code===S.applied);const disc=cp?Math.min(cp.d,sub):0;
return `<h1>Cart</h1>${l.length?`<div class="card">${l.map(p=>`<div class="row"><span>${p.name}</span><span>${rs(p.price)}</span><button class="btn alt" data-act="rm" data-id="${p.id}">Remove</button></div>`).join('')}
<label for="cpn">CyclePoints coupon</label><select id="cpn" data-act="coupon"><option value="">None</option>${S.coupons.map(c=>`<option value="${c.code}" ${c.code===S.applied?'selected':''}>${c.code} (${rs(c.d)} off)</option>`).join('')}</select>
<h3>Total: ${rs(sub-disc)}</h3><button class="btn" data-act="checkout">Complete demo purchase</button></div>`:'<div class="card">Your cart is empty. <a href="#thrift">Browse thrift</a></div>'}`};

V.impact=()=>{const n=items()+S.recycledKg*0.5,r=k=>Math.round(n*F[k]*10)/10;return `<h1>Your Circular Impact</h1>
<div class="grid"><div class="card stat"><b>${Math.round(items())}</b><span>garments reused</span></div><div class="card stat"><b>${r('co2')} kg</b><span>CO2e avoided (est.)</span></div>
<div class="card stat"><b>${Math.round(n*F.water).toLocaleString()} L</b><span>water saved (est.)</span></div><div class="card stat"><b>${r('energy')} MJ</b><span>energy saved (est.)</span></div>
<div class="card stat"><b>${(S.recycledKg+items()*F.waste).toFixed(1)} kg</b><span>textile diverted</span></div></div>
<section class="card"><h2>Carbon footprint by lifecycle stage</h2><p>Illustrative Life Cycle Assessment (LCA) split for one cotton garment. Reuse avoids the production stages (raw material, manufacturing).</p>
${LCA.map(a=>`<div class="row"><span style="flex:0 0 120px">${a[0]}</span>${bar(a[1],40)}<span style="flex:0 0 40px">${a[1]}%</span></div>`).join('')}</section>
<section class="card"><h2>Water saved (L) by action</h2>${[['Donated',S.donated],['Thrifted',S.thrifted],['Rented',S.rented*F.rentShare]].map(a=>`<div class="row"><span style="flex:0 0 90px">${a[0]}</span>${bar(a[1],Math.max(15,items()))}<span style="flex:0 0 70px">${Math.round(a[1]*F.water)}</span></div>`).join('')}</section>
<p class="err" style="color:var(--mute)">Impact values are estimates based on standardized assumptions (per garment: ${F.co2} kg CO2e, ${F.water} L water, ${F.energy} MJ energy) and are intended for awareness and comparison, not as measured personal savings.</p>`};

function dist(p){const o=S.loc||{lat:18.5167,lng:73.8409},R=6371,d=Math.PI/180,a=Math.sin((p.lat-o.lat)*d/2)**2+Math.cos(o.lat*d)*Math.cos(p.lat*d)*Math.sin((p.lng-o.lng)*d/2)**2;return +(2*R*Math.asin(Math.sqrt(a))).toFixed(1)}
const placeCard=p=>`<div class="card" style="margin-bottom:.6rem"><h3>${p.name}</h3><span class="tag">${p.type}</span><span class="tag">${dist(p)} km</span><span class="tag">${p.area}</span>
<p>Open until ${p.close-12}:00 PM. Accepts: ${p.accepts}</p><a class="btn alt" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}">Get Directions</a></div>`;
V.nearby=()=>{const so=window._ns||'Distance';const l=[...PLACES].sort((a,b)=>so==='Distance'?dist(a)-dist(b):so==='Type'?a.type.localeCompare(b.type):b.close-a.close);
const xs=PLACES.map(p=>p.lng),ys=PLACES.map(p=>p.lat),X=Math.min(...xs),Y=Math.min(...ys),W=Math.max(...xs)-X,H=Math.max(...ys)-Y;
const col={'Donation Center':'#1f4d3a','Recycling Center':'#b08a5b','NGO':'#455a8a','Thrift Seller':'#a05a5a','ClothCycle Drop Point':'#2f9e6b'};
return `<h1>Nearby</h1><p>${S.loc?'Using your current location.':'Showing Pune (Deccan) as demo location.'} <button class="btn alt" data-act="locate">Use my location</button></p>
<svg viewBox="0 0 300 200" class="card" style="padding:0;width:100%;background:#e9eee4" role="img" aria-label="Map of nearby places">${l.map(p=>`<circle cx="${20+(p.lng-X)/W*260}" cy="${180-(p.lat-Y)/H*160}" r="7" fill="${col[p.type]}" stroke="#fff" stroke-width="2"><title>${p.name}</title></circle>`).join('')}</svg>
<p>${Object.entries(col).map(a=>`<span class="tag" style="border-color:${a[1]}">${a[0]}</span>`).join('')}</p>
<select id="ns" aria-label="Sort">${['Distance','Open now','Type'].map(x=>`<option ${x===so?'selected':''}>${x}</option>`).join('')}</select>
<h2 style="margin-top:1rem">Closest to you</h2>${l.map(placeCard).join('')}`};

/* ---------- router ---------- */
function render(){const h=(location.hash||'#home').slice(1);const v=V[h]?h:'home';$('#view').innerHTML=V[v]();
 document.querySelectorAll('.bottom a').forEach(a=>a.classList.toggle('on',a.hash==='#'+v));
 $('#cartLink').textContent='Cart ('+S.cart.length+')';
 if(v==='donate')showRoute();window.scrollTo(0,0)}
addEventListener('hashchange',render);

/* ---------- events ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act,id=+b.dataset.id;
 if(a==='closeModal'){$('#modal').hidden=true;return}
 if(a==='cat'){window._tc=b.dataset.v;render()}
 if(a==='add'){if(!S.cart.includes(id))S.cart.push(id);save();toast('Added to cart');$('#cartLink').textContent='Cart ('+S.cart.length+')'}
 if(a==='buy'){if(!S.cart.includes(id))S.cart.push(id);save();location.hash='#cart'}
 if(a==='wish'){S.wish=S.wish.includes(id)?S.wish.filter(x=>x!==id):[...S.wish,id];save();render()}
 if(a==='view'){const p=THRIFT.find(x=>x.id===id);modal(`${img(p.color,p.name)}<h2>${p.name}</h2><p>${rs(p.price)} | ${p.cond} | Size ${p.size} | ${p.dist} km away (Pune) | Seller: ${p.seller}</p><p>Buying this instead of a new garment helps avoid the resources used to produce another item (est. ${F.co2} kg CO2e, ${F.water} L water).</p>${wallet(p)}`)}
 if(a==='rm'){S.cart=S.cart.filter(x=>x!==id);save();render()}
 if(a==='rent'){const r=RENT.find(x=>x.id===id);modal(`<h2>Rent ${r.name}</h2><label for="days">Days</label><input id="days" type="number" min="1" max="14" value="3"><p id="rtot">Total: ${rs(r.perDay*3)}</p><button class="btn" data-act="rentgo" data-id="${id}">Confirm rental</button>`);
  $('#days').oninput=ev=>$('#rtot').textContent='Total: '+rs(r.perDay*Math.max(1,+ev.target.value||1))}
 if(a==='rentgo'){const d=Math.max(1,Math.min(14,+$('#days').value||1));act('/api/rent',{id,days:d},r=>{$('#modal').hidden=true;toast(`Rented for ${d} days (${rs(r.total)})`)})}
 if(a==='redeem'){act('/api/redeem',{points:+b.dataset.p},r=>modal(`<h2>${rs(r.discount)} Thrift Discount Unlocked</h2><p>Coupon code</p><h1>${r.code}</h1><p>Apply it in your cart.</p>`))}
 if(a==='checkout'){act('/api/checkout',{coupon:S.applied},r=>{S.applied='';api('/api/catalog').then(c=>{THRIFT=c.thrift;render()});modal(`<h2>Purchase complete</h2><p>Total paid: ${rs(r.total)}. +${r.points} CyclePoints. Your impact dashboard has been updated.</p><a class="btn" href="#impact" data-act="closeModal">View impact</a>`)})}
 if(a==='locate'){if(!navigator.geolocation)return toast('Location not supported. Using demo location.');navigator.geolocation.getCurrentPosition(p=>{S.loc={lat:p.coords.latitude,lng:p.coords.longitude};save();render()},()=>toast('Permission denied. Using Pune demo location.'))}
 if(a==='set_ip'){localStorage.setItem('cc_api',$('#api_ip').value);toast('Server address saved');setTimeout(()=>location.reload(),1000)}
});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='dk')showRoute();if(t.id==='so'){window._so=t.value;render()}if(t.id==='cf'){window._cond=t.value;render()}if(t.id==='ns'){window._ns=t.value;render()}
 if(t.id==='cpn'){S.applied=t.value;save();render()}
 if(t.type==='file'&&t.files[0]&&$('#prev')){const r=new FileReader();r.onload=()=>{$('#prev').src=r.result;$('#prev').style.display='block'};r.readAsDataURL(t.files[0])}});
document.addEventListener('input',e=>{if(e.target.id==='q'){window._q=e.target.value;const p=e.target.selectionStart;render();const q=$('#q');q.focus();q.setSelectionRange(p,p)}
 if(e.target.id==='rw')$('#est').textContent='Estimated reward: '+Math.round((+e.target.value||0)*30)+' CyclePoints'});
document.addEventListener('submit',e=>{e.preventDefault();
 if(e.target.id==='donForm'){let ok=1;$('#e_dn').textContent=$('#e_pd').textContent='';
  if(!$('#dn').value.trim()){$('#e_dn').textContent='Enter a clothing name.';ok=0}
  if(!$('#pd').value||new Date($('#pd').value)<new Date()){$('#e_pd').textContent='Choose a future pickup date and time.';ok=0}
  if(!ok)return;const pk=$('#pk').value,at=$('#pd').value;
  act('/api/donations',{name:$('#dn').value,category:$('#dc').value,condition:$('#dk').value,qty:+$('#dq').value,dest:$('#dest').value,pickup:pk,pickup_at:at,description:$('#dd').value},
   r=>modal(`<h2>Donation Scheduled</h2><p>Donation ID: <b>${r.id}</b><br>Pickup: ${new Date(at).toLocaleString()} (${pk})<br>Destination: ${$('#dest').value}<br>Estimated impact: ~${r.co2} kg CO2e avoided<br>Reward points earned: +${r.points}</p>`))}
 if(e.target.id==='recForm'){const w=+$('#rw').value;if(!(w>0)){$('#e_rw').textContent='Enter a weight above 0 kg.';return}
  act('/api/recycle',{kg:w,material:$('#rm').value,method:$('#rp').value},r=>modal(`<h2>Recycling Pickup Scheduled</h2><p>${w} kg of ${$('#rm').value} via ${$('#rp').value}. +${r.points} CyclePoints.</p>`))}});
V.admin=()=>{const a=window._adm;if(!a)return '<h1>Partner dashboard</h1><p>Loading...</p>';const m=Math.max(1,...a.by_dest.map(x=>x.n));
return `<h1>Partner dashboard</h1><div class="grid">${Object.entries(a.stats).map(([k,v])=>`<div class="card stat"><b>${v}</b><span>${k}</span></div>`).join('')}</div>
<section class="card"><h2>Donations by destination</h2>${a.by_dest.map(d=>`<div class="row"><span style="flex:0 0 150px">${d.dest}</span>${bar(d.n,m)}<span style="flex:0 0 30px">${d.n}</span></div>`).join('')}</section>
<section><h2>Recent donations</h2><table>${a.recent.map(d=>`<tr><td>${d.code}</td><td>${d.name}</td><td>${d.qty}</td><td>${d.dest}</td><td>${d.status}</td></tr>`).join('')}</table></section>
<section class="card" style="margin-top:1.6rem"><h2>Server Settings</h2><p>Update this if your PC's IP address changes.</p><div class="row"><input id="api_ip" value="${API}" placeholder="http://192.168.1.10:5000"><button class="btn" data-act="set_ip">Save IP</button></div></section>`};
async function loadAdmin(){if(!sessionStorage.getItem('adm')){const k=prompt('Admin password (demo: admin123)');if(!k){location.hash='#home';return}sessionStorage.setItem('adm',k)}
 try{window._adm=await api('/api/admin');render()}catch(x){sessionStorage.removeItem('adm');toast('Access denied');location.hash='#home'}}
addEventListener('hashchange',()=>{if(location.hash==='#admin')loadAdmin()});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
(async()=>{try{const[c,st]=await Promise.all([api('/api/catalog'),api('/api/state')]);THRIFT=c.thrift;RENT=c.rent;PLACES=c.places;Object.assign(S,st)}
catch(x){$('#view').innerHTML=`<div class="card"><h2>Cannot reach the ClothCycle server</h2><p>Start it with: python app.py, then reload this page.</p><div style="margin-top:1rem;border-top:1px solid var(--line);padding-top:1rem"><label for="newip">Server Address</label><div class="row"><input id="newip" value="${API}" placeholder="http://192.168.1.10:5000"><button class="btn" onclick="localStorage.setItem('cc_api',$('#newip').value);location.reload()">Save & Reload</button></div></div></div>`;return}
render();if(location.hash==='#admin')loadAdmin()})();