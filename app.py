"""ClothCycle backend: Flask REST API + SQLite. Run: python app.py  (http://localhost:5000)"""
import os, sqlite3
from flask import Flask, g, jsonify, request

app = Flask(__name__, static_folder='www', static_url_path='')
DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clothcycle.db')
ADMIN_KEY = 'admin123'            # demo admin password
UID = 1                           # demo logged-in user (add real login later)
TIERS = {100: 25, 250: 50, 500: 100, 1000: 250}
CONDITIONS = ('Like New', 'Good', 'Used', 'Worn / Damaged')
CO2_PER_GARMENT = 3.3             # illustrative estimate, kg CO2e

SCHEMA = """
CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT, donated INT, recycled_kg REAL, thrifted INT, rented INT);
CREATE TABLE thrift(id INTEGER PRIMARY KEY, name TEXT, cat TEXT, size TEXT, cond TEXT, price INT, dist REAL, seller TEXT, color TEXT, age INT, added INT, sold INT DEFAULT 0);
CREATE TABLE rent_items(id INTEGER PRIMARY KEY, name TEXT, cat TEXT, size TEXT, perDay INT, color TEXT);
CREATE TABLE places(id INTEGER PRIMARY KEY, name TEXT, type TEXT, area TEXT, lat REAL, lng REAL, close INT, accepts TEXT);
CREATE TABLE donations(id INTEGER PRIMARY KEY, user_id INT, code TEXT, name TEXT, category TEXT, cond TEXT, qty INT, dest TEXT, pickup TEXT, pickup_at TEXT, status TEXT DEFAULT 'Scheduled');
CREATE TABLE recycles(id INTEGER PRIMARY KEY, user_id INT, kg REAL, material TEXT, method TEXT, status TEXT DEFAULT 'Scheduled');
CREATE TABLE rentals(id INTEGER PRIMARY KEY, user_id INT, item_id INT, days INT, total INT);
CREATE TABLE orders(id INTEGER PRIMARY KEY, user_id INT, total INT, n_items INT);
CREATE TABLE points_tx(id INTEGER PRIMARY KEY, user_id INT, reason TEXT, points INT);
CREATE TABLE coupons(id INTEGER PRIMARY KEY, user_id INT, code TEXT, discount INT, used INT DEFAULT 0);
CREATE TABLE notifications(id INTEGER PRIMARY KEY, user_id INT, text TEXT);
CREATE TABLE cart(user_id INT, item_id INT, PRIMARY KEY(user_id,item_id));
CREATE TABLE wishlist(user_id INT, item_id INT, PRIMARY KEY(user_id,item_id));
"""
THRIFT = [('Vintage Denim Jacket','Women','M','Good',399,2.4,'Riya S.','#5b7a8c'),('Wool Overcoat','Men','L','Like New',899,3.1,'Aman K.','#7a6a55'),
 ('Cotton Kurta Set','Women','S','Good',349,1.2,'Neha P.','#b08a5b'),('Slim Fit Jeans','Men','32','Used',299,4.8,'Karan D.','#3f5a73'),
 ('Kids Hoodie','Kids','6-7y','Good',199,2.1,'Sneha M.','#9db8a4'),('Leather Sandals','Shoes','8','Good',449,5.6,'Vikram J.','#8a6a4a'),
 ('Canvas Tote','Accessories','-','Like New',149,0.9,'Pooja R.','#c9bd9c'),('Linen Shirt','Men','M','Like New',329,3.6,'Rohit T.','#a7b59a'),
 ('Floral Summer Dress','Women','M','Good',379,2.9,'Isha G.','#c69b8a'),('Sports Sneakers','Shoes','9','Used',549,6.2,'Arjun B.','#6d7f6a'),
 ('Silk Scarf','Accessories','-','Like New',229,4.1,'Meera N.','#b5a36a'),('School Blazer','Kids','10-11y','Good',259,3.3,'Deepa L.','#455a4a')]
RENT = [('Sherwani Set (Wedding)','Men','L',250,'#7a5a3a'),('Lehenga (Festive)','Women','M',350,'#a05a5a'),('Formal Blazer','Men','M',120,'#3f4f5a'),
 ('Graduation Gown','Women','S',100,'#2f4a3a'),('Saree (Silk)','Women','Free',200,'#8a6a8a')]
PLACES = [('Community Clothing Bank','Donation Center','Swargate',18.5018,73.8636,19,'Clothes, school uniforms'),('Deccan Giveback Hub','Donation Center','Deccan',18.5167,73.8409,20,'All wearable clothing'),
 ('Kothrud Care Collective','Donation Center','Kothrud',18.5074,73.8077,18,'Winter wear, kidswear'),('Viman Nagar Drop Point','ClothCycle Drop Point','Viman Nagar',18.5679,73.9143,21,'Wearable and damaged'),
 ('Hadapsar Seva Closet','Donation Center','Hadapsar',18.5089,73.926,17,'General clothing'),('GreenThread Recycling','Recycling Center','Sinhagad Road',18.4799,73.8236,18,'Worn, damaged textiles'),
 ('ReFibre Pune','Recycling Center','Shivajinagar',18.5314,73.8446,19,'Cotton, denim'),('Textile Loop Works','Recycling Center','Hadapsar',18.4968,73.9417,17,'Mixed textiles'),
 ('Asha Foundation (NGO)','NGO','Kothrud',18.5035,73.8190,18,'Women, children'),('Thrift Corner','Thrift Seller','Deccan',18.5196,73.8553,20,'Pre-owned fashion')]


def init_db():
    c = sqlite3.connect(DB); c.executescript(SCHEMA)
    c.executemany('INSERT INTO users VALUES(?,?,?,?,?,?)', [(1,'Aditi Kulkarni',12,3,8,0),(2,'Rohan Patil',5,0,3,1),(3,'Sana Sheikh',9,2.5,4,0)])
    c.executemany('INSERT INTO thrift(name,cat,size,cond,price,dist,seller,color,age,added) VALUES(?,?,?,?,?,?,?,?,?,?)', [t + (1 + i % 4, i) for i, t in enumerate(THRIFT)])
    c.executemany('INSERT INTO rent_items(name,cat,size,perDay,color) VALUES(?,?,?,?,?)', RENT)
    c.executemany('INSERT INTO places(name,type,area,lat,lng,close,accepts) VALUES(?,?,?,?,?,?,?)', PLACES)
    c.executemany('INSERT INTO points_tx(user_id,reason,points) VALUES(?,?,?)', [(1,'Earlier activity',320),(1,'Thrift purchase',20),(1,'Recycling',30),(1,'Donation',50)])
    c.executemany('INSERT INTO donations(user_id,code,name,category,cond,qty,dest,pickup,pickup_at,status) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [(2,'CC-2026-00470','Winter jackets','Jacket','Good',3,'Donate to NGO','Doorstep pickup','2026-09-20T10:00','Completed'),
         (3,'CC-2026-00471','Old jeans','Jeans','Worn / Damaged',4,'Send for Recycling','Nearby drop-off point','2026-09-25T16:00','Completed'),
         (3,'CC-2026-00472','Kurtas','Dress','Like New',2,'List for Thrift','Doorstep pickup','2026-09-28T11:00','Completed')])
    c.execute("INSERT INTO notifications(user_id,text) VALUES(1,'A recycling center opened near you.')")
    c.commit(); c.close()


def db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB); g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_):
    d = g.pop('db', None)
    if d: d.close()

@app.after_request
def cors(r):  # allows the APK (different origin) to call this API
    r.headers.update({'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Key', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'})
    return r

def q(sql, a=()): return [dict(r) for r in db().execute(sql, a).fetchall()]
def one(sql, a=()): return db().execute(sql, a).fetchone()[0]
def fail(msg, code=400): return jsonify(error=msg), code

def add_points(reason, pts):
    db().execute('INSERT INTO points_tx(user_id,reason,points) VALUES(?,?,?)', (UID, reason, pts))
    if pts > 0: db().execute('INSERT INTO notifications(user_id,text) VALUES(?,?)', (UID, f'You earned {pts} CyclePoints for {reason.lower()}.'))

def state():
    u = q('SELECT * FROM users WHERE id=?', (UID,))[0]
    return dict(name=u['name'], donated=u['donated'], thrifted=u['thrifted'], recycledKg=u['recycled_kg'], rented=u['rented'],
        points=one('SELECT COALESCE(SUM(points),0) FROM points_tx WHERE user_id=?', (UID,)),
        cart=[r['item_id'] for r in q('SELECT item_id FROM cart WHERE user_id=?', (UID,))],
        wish=[r['item_id'] for r in q('SELECT item_id FROM wishlist WHERE user_id=?', (UID,))],
        coupons=q('SELECT code, discount AS d FROM coupons WHERE user_id=? AND used=0', (UID,)),
        notifs=[r['text'] for r in q('SELECT text FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 20', (UID,))],
        hist=[[r['reason'], r['points']] for r in q('SELECT reason,points FROM points_tx WHERE user_id=? ORDER BY id DESC LIMIT 10', (UID,))],
        passports=[r['code'] for r in q('SELECT code FROM donations WHERE user_id=?', (UID,))])

@app.get('/')
def index(): return app.send_static_file('index.html')

@app.get('/api/catalog')
def catalog():
    return jsonify(thrift=q('SELECT * FROM thrift WHERE sold=0'), rent=q('SELECT * FROM rent_items'), places=q('SELECT * FROM places'))

@app.get('/api/state')
def get_state(): return jsonify(state())

@app.put('/api/sync')
def sync():
    d = request.get_json(force=True)
    for table, key in (('cart', 'cart'), ('wishlist', 'wish')):
        db().execute(f'DELETE FROM {table} WHERE user_id=?', (UID,))
        db().executemany(f'INSERT OR IGNORE INTO {table} VALUES(?,?)', [(UID, int(i)) for i in d.get(key, [])])
    db().commit(); return jsonify(ok=True)

@app.post('/api/donations')
def donate():
    d = request.get_json(force=True); qty = int(d.get('qty') or 0)
    if not str(d.get('name', '')).strip(): return fail('Enter a clothing name.')
    if d.get('condition') not in CONDITIONS: return fail('Choose a valid condition.')
    if qty < 1: return fail('Quantity must be at least 1.')
    if not d.get('pickup_at'): return fail('Choose a pickup date and time.')
    wearable = d['condition'] != 'Worn / Damaged'
    pts = (50 + (100 if qty >= 3 else 0) if wearable else 0) + (25 if str(d.get('pickup', '')).startswith('Nearby') else 0)
    cur = db().execute('INSERT INTO donations(user_id,code,name,category,cond,qty,dest,pickup,pickup_at) VALUES(?,?,?,?,?,?,?,?,?)',
        (UID, 'tmp', d['name'].strip(), d.get('category'), d['condition'], qty, d.get('dest'), d.get('pickup'), d['pickup_at']))
    code = 'CC-2026-%05d' % (480 + cur.lastrowid)
    db().execute('UPDATE donations SET code=? WHERE id=?', (code, cur.lastrowid))
    db().execute('UPDATE users SET donated=donated+? WHERE id=?', (qty, UID))
    if pts: add_points('Donation', pts)
    db().commit()
    return jsonify(state=state(), id=code, points=pts, co2=round(qty * CO2_PER_GARMENT, 1))

@app.post('/api/recycle')
def recycle():
    d = request.get_json(force=True)
    try: kg = float(d.get('kg'))
    except (TypeError, ValueError): kg = 0
    if kg <= 0: return fail('Enter a weight above 0 kg.')
    pts = round(kg * 30)
    db().execute('INSERT INTO recycles(user_id,kg,material,method) VALUES(?,?,?,?)', (UID, kg, d.get('material'), d.get('method')))
    db().execute('UPDATE users SET recycled_kg=ROUND(recycled_kg+?,1) WHERE id=?', (kg, UID))
    add_points('Recycling', pts); db().commit()
    return jsonify(state=state(), points=pts)

@app.post('/api/rent')
def rent():
    d = request.get_json(force=True); days = int(d.get('days') or 0)
    item = q('SELECT * FROM rent_items WHERE id=?', (d.get('id'),))
    if not item: return fail('Item not found.', 404)
    if not 1 <= days <= 14: return fail('Rental must be 1 to 14 days.')
    total = item[0]['perDay'] * days
    db().execute('INSERT INTO rentals(user_id,item_id,days,total) VALUES(?,?,?,?)', (UID, item[0]['id'], days, total))
    db().execute('UPDATE users SET rented=rented+1 WHERE id=?', (UID,))
    add_points('Renting', 10)
    db().execute('INSERT INTO notifications(user_id,text) VALUES(?,?)', (UID, f"Rental confirmed: {item[0]['name']} for {days} days."))
    db().commit(); return jsonify(state=state(), total=total)

@app.post('/api/redeem')
def redeem():
    p = int(request.get_json(force=True).get('points') or 0)
    if p not in TIERS: return fail('Invalid reward tier.')
    if state()['points'] < p: return fail('Not enough CyclePoints.')
    code = f'CYCLE{TIERS[p]}'
    db().execute('INSERT INTO coupons(user_id,code,discount) VALUES(?,?,?)', (UID, code, TIERS[p]))
    db().execute('INSERT INTO points_tx(user_id,reason,points) VALUES(?,?,?)', (UID, f'Redeemed Rs {TIERS[p]} discount', -p))
    db().execute('INSERT INTO notifications(user_id,text) VALUES(?,?)', (UID, f'Your Rs {TIERS[p]} thrift reward is ready.'))
    db().commit(); return jsonify(state=state(), code=code, discount=TIERS[p])

@app.post('/api/checkout')
def checkout():
    code = request.get_json(force=True).get('coupon') or ''
    items = q('SELECT t.* FROM thrift t JOIN cart c ON c.item_id=t.id WHERE c.user_id=? AND t.sold=0', (UID,))
    if not items: return fail('Your cart is empty.')
    sub = sum(i['price'] for i in items); disc = 0
    if code:
        cp = q('SELECT * FROM coupons WHERE user_id=? AND code=? AND used=0 LIMIT 1', (UID, code))
        if not cp: return fail('Coupon is not valid.')
        disc = min(cp[0]['discount'], sub); db().execute('UPDATE coupons SET used=1 WHERE id=?', (cp[0]['id'],))
    for i in items: db().execute('UPDATE thrift SET sold=1 WHERE id=?', (i['id'],))
    db().execute('DELETE FROM cart WHERE user_id=?', (UID,))
    db().execute('INSERT INTO orders(user_id,total,n_items) VALUES(?,?,?)', (UID, sub - disc, len(items)))
    db().execute('UPDATE users SET thrifted=thrifted+? WHERE id=?', (len(items), UID))
    add_points('Thrift purchase', 20 * len(items)); db().commit()
    return jsonify(state=state(), total=sub - disc, points=20 * len(items))

@app.get('/api/admin')
def admin():
    if request.headers.get('X-Admin-Key') != ADMIN_KEY: return fail('Admin access denied.', 403)
    stats = {'Total users': one('SELECT COUNT(*) FROM users'), 'Total donated items': one('SELECT SUM(donated) FROM users'),
        'Recycled (kg)': one('SELECT SUM(recycled_kg) FROM users'), 'Thrift transactions': one('SELECT COUNT(*) FROM orders') + one('SELECT SUM(thrifted) FROM users'),
        'CyclePoints issued': one('SELECT COALESCE(SUM(points),0) FROM points_tx WHERE points>0'),
        'Active pickups': one("SELECT COUNT(*) FROM donations WHERE status='Scheduled'") + one("SELECT COUNT(*) FROM recycles WHERE status='Scheduled'")}
    return jsonify(stats=stats, recent=q('SELECT code,name,qty,dest,status FROM donations ORDER BY id DESC LIMIT 8'),
        by_dest=q('SELECT dest, SUM(qty) AS n FROM donations GROUP BY dest'))

if __name__ == '__main__':
    if not os.path.exists(DB): init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
