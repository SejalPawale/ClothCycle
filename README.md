# ClothCycle

### Wear. Share. Repeat.

ClothCycle is a sustainable clothing platform that gives unwanted clothes a second life through **donation, thrift, rental, and recycling**. Users earn **CyclePoints** for sustainable actions, redeem them as thrift coupons, and track their estimated environmental impact.

## Features

- **Donate** – List clothes by name, category, size, condition, and quantity, optionally attach a photo, and get a smart routing suggestion (donate, thrift, or recycle) based on condition. Schedule a doorstep pickup or a drop-off with a future date and time.
- **Thrift** – Browse pre-owned clothes with search, category filters (Women, Men, Kids, Accessories, Shoes), condition filter, and sorting by nearest, lowest price, or newest. Each item has product photos, a details view, a wishlist, and a cart.
- **Wardrobe Passport** – Every thrift item shows a passport with a unique ID, original category, condition, approximate age, and a timeline of its journey.
- **Rent** – Rent occasion wear such as lehengas, sherwanis, blazers, and graduation gowns for 1 to 14 days, with the total price updating as you change the duration.
- **Recycle** – Submit textile waste by estimated weight and material (cotton, polyester, denim, mixed, unknown), choose pickup or a nearby recycling centre, and see the estimated CyclePoints before confirming.
- **CyclePoints & Rewards** – Earn points, redeem them for coupons, apply a coupon in the cart, and view your points history.
- **Nearby** – Find donation centres, NGOs, thrift sellers, recycling centres, and ClothCycle drop points in Pune. Sort by distance, opening hours, or type, use your current location, and open directions in your maps app.
- **Impact Dashboard** – View estimated CO₂e avoided, water saved, energy saved, and textile diverted, plus an illustrative lifecycle breakdown of a garment's carbon footprint and water saved by action.
- **Admin / Partner Dashboard** – Password-protected view of project statistics, donations by destination, and recent donations.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (single-page app with hash routing)
- **Backend:** Python, Flask (REST API)
- **Database:** SQLite
- **PWA:** Service Worker + Web App Manifest
- **Android:** Capacitor (the web app is bundled inside the APK)
- **Hosting:** Render (backend API and website)
- **CI:** GitHub Actions (APK build)
- **Version Control:** Git & GitHub

The application follows a simple **client → REST API → database** architecture. The frontend talks to the API for the catalogue, user state, donations, recycling, rentals, rewards, checkout, and admin data.

## Project Structure

```text
clothcycle/
├── app.py
├── requirements.txt
├── README.md
├── static/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── sw.js
│   ├── manifest.json
│   ├── images/          # product photos (named after each item)
│   └── icons/
└── .github/
    └── workflows/
        └── build-apk.yml
```

## CyclePoints

| Action | Points |
|---|---:|
| Donate a wearable item | +50 |
| Donate 3+ items (bonus) | +100 |
| Use a drop-off point | +25 |
| Recycle | +30 per kg |
| Buy a thrifted item | +20 |
| Rent a garment | +10 |
| Refer a friend | +75 |

### Reward tiers

| Points needed | Thrift discount |
|---:|---:|
| 100 | ₹25 |
| 250 | ₹50 |
| 500 | ₹100 |
| 1000 | ₹250 |

Redeeming a tier generates a coupon code that can be applied in the cart at checkout.

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Then open:

```text
http://localhost:5000
```

To reset the demo database, stop the server and delete `clothcycle.db`.

## Android App

The Android app is built with **Capacitor**. The user interface (HTML, CSS, JS, product images, manifest, and service worker) is **bundled inside the APK**, so the app shell and photos load from the device.

App data (catalogue, cart, wishlist, donations, points, coupons) is fetched from the **hosted ClothCycle backend on Render**, so an **internet connection is required**. When the app runs on `localhost:5000` or on the Render domain it talks to its own server; inside the Android app it automatically points to the Render backend.

- **App ID:** `com.clothcycle.app`
- **Permissions:** Internet only. "Use my location" in Nearby uses the device's location when you grant it.
- **Build output:** `app-debug.apk` (debug build, built through GitHub Actions)

## Sustainability

ClothCycle supports **SDG 1, 6, 8, 11, 12, and 13**, with its main focus on **SDG 12 – Responsible Consumption and Production**.

Impact values use fixed per-garment assumptions: about **3.3 kg CO₂e**, **2,000 L of water**, **25 MJ of energy**, and **0.4 kg of textile** per garment reused. A rental counts as half a garment, and each kg recycled counts as half a garment-equivalent.

These figures are **illustrative estimates for awareness and comparison, not scientifically measured individual savings**.

## Limitations & Future Scope

The current version is a demo and does not include user authentication, real payments (checkout is a demo purchase), a live map (Nearby uses a simple location plot and opens directions in your maps app), or a production database. Future development could include **login, live maps, cloud storage, online payments, community features, offline support, and native Android functionality**.

## Development

Generative AI was used during the initial development, but the application was subsequently **tested, modified, debugged, customised, and deployed as part of the project development process**.