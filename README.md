# ClothCycle

### Wear. Share. Repeat.

## The Idea

Most unwanted clothes end up in a wardrobe corner or a landfill, even when they could be worn again. People often don't know where to donate, whether a worn item can be resold, or what to do with textiles that are too damaged to wear. Meanwhile, buying new clothes carries a heavy carbon and water cost.

**ClothCycle** is a sustainable clothing platform that gives garments a second life through four routes in one app: **donation, thrift, rental, and recycling**. A simple routing suggestion helps users decide what to do with an item based on its condition. Users earn **CyclePoints** for sustainable actions, redeem them as thrift coupons, and see an estimated picture of the environmental impact of their choices.

**What it solves**

* **Confusion about what to do with old clothes:** one place to donate, resell, rent out, or recycle.
* **Low motivation to act:** points and rewards make sustainable choices feel worthwhile.
* **Hard-to-find local options:** a Pune-based directory of donation centres, NGOs, thrift sellers, and recycling centres.
* **Invisible impact:** a dashboard that makes the benefit of reuse easy to understand.

## Features

* **Donate:** List clothes by name, category, condition, and quantity, optionally add a photo preview and description, and get a routing suggestion (donate, thrift, or recycle) based on condition. Choose a destination and schedule a doorstep pickup or nearby drop-off with a future date and time.
* **Thrift:** Browse pre-owned clothes with search, category filters (Women, Men, Kids, Accessories, Shoes), a condition filter, and sorting by nearest, lowest price, or newest. Each item has a photo, a details view, a wishlist, and a cart with checkout (demo purchase).
* **Wardrobe Passport:** Every thrift item shows a passport with an ID, original category, condition, approximate age, and an illustrative timeline of its journey.
* **Rent:** Rent occasion wear such as lehengas, sherwanis, blazers, graduation gowns, and sarees for 1 to 14 days, with the total updating as the duration changes.
* **Recycle:** Submit textile waste by estimated weight and material (cotton, polyester, denim, mixed, unknown), choose pickup or a nearby recycling centre, and see the estimated CyclePoints before confirming.
* **CyclePoints & Rewards:** Earn points, redeem them for coupons, apply a coupon in the cart, and view your points history.
* **Nearby:** Find donation centres, NGOs, thrift sellers, recycling centres, and ClothCycle drop points in Pune. Sort by distance, closing time, or type, and open directions in your maps app.
* **Impact Dashboard:** View estimated CO₂e avoided, water saved, energy saved, and textile diverted, plus an illustrative lifecycle breakdown of a garment's carbon footprint.
* **Admin / Partner Dashboard:** A demo-key-protected view of project statistics, donations by destination, and recent donations.

### CyclePoints

| Action                  |     Points |
| ----------------------- | ---------: |
| Donate a wearable item  |        +50 |
| Donate 3+ items (bonus) |       +100 |
| Use a drop-off point    |        +25 |
| Recycle                 | +30 per kg |
| Buy a thrifted item     |        +20 |
| Rent a garment          |        +10 |

| Points needed | Thrift discount |
| ------------: | --------------: |
|           100 |             ₹25 |
|           250 |             ₹50 |
|           500 |            ₹100 |
|          1000 |            ₹250 |

Redeeming a tier generates a coupon code that can be applied in the cart at checkout.

## Tech Stack

| Layer           | Technology                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | HTML, CSS, vanilla JavaScript (single-page app with hash routing) |
| Backend         | Python, Flask (REST API)                                          |
| Database        | SQLite                                                            |
| PWA             | Service Worker + Web App Manifest                                 |
| Android         | Capacitor (web app bundled inside the APK)                        |
| Hosting         | Render (backend API and website)                                  |
| Version control | Git & GitHub                                                      |

The app follows a simple **client → REST API → database** architecture. The frontend calls the API for the catalogue, user state, donations, recycling, rentals, rewards, checkout, and admin data.

**Android app.** The UI (HTML, CSS, JS, product images, manifest, service worker) is bundled inside the APK, so the app shell and photos load from the device. App data is fetched from the hosted backend on Render, so an **internet connection is required**. On `localhost:5000` or the Render domain the app talks to its own server; inside the Android app it automatically points to the Render backend. App ID: `com.clothcycle.app`. Permissions: Internet only.

**Run locally**

```bash
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`. To reset the demo database, stop the server and delete `clothcycle.db`.

**Build the Android app**

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

The debug APK is generated under `android/app/build/outputs/apk/debug/`.

## Project Structure

```text
ClothCycle/
├── app.py                  # Flask REST API + SQLite setup and seed data
├── requirements.txt        # Python dependencies
├── package.json            # Capacitor dependencies
├── capacitor.config.json   # Capacitor config (app ID, web directory)
├── README.md
├── www/                    # Frontend (served by Flask and bundled in the APK)
│   ├── index.html
│   ├── styles.css
│   ├── app.js              # SPA logic, views, API calls
│   ├── sw.js               # Service worker
│   ├── manifest.json       # PWA manifest
│   ├── icons/
│   └── images/             # Product photos for thrift and rental items
└── android/                # Capacitor Android project
```

## Sustainability

ClothCycle supports three UN Sustainable Development Goals:

* **SDG 12, Responsible Consumption and Production (main focus):** extends the life of clothing through donation, thrift, rental, and recycling instead of buying new or discarding.
* **SDG 13, Climate Action:** reusing a garment avoids the emissions of producing a new one.
* **SDG 11, Sustainable Cities and Communities:** reduces textile waste and connects people to local donation, thrift, and recycling options in Pune.

**How impact is estimated.** Impact values use fixed per-garment assumptions: about **3.3 kg CO₂e**, **2,000 L of water**, **25 MJ of energy**, and **0.4 kg of textile** per garment reused. Donated and thrifted items count as one garment each and a rental counts as half. Recycled weight (in kg) is added to the textile-diverted figure.

These figures are **illustrative estimates for awareness and comparison, not scientifically measured individual savings.**

## Limitations & Future Scope

**Current limitations** (this is a demo, not a production system)

* **Demo authentication and payments:** The app uses a shared demo user, fixed admin access, and simulated checkout instead of real authentication and payment processing.
* **Static data and limited persistence:** Catalogue items, nearby places, and pickup statuses use demo data, while SQLite on free hosting may reset after restarts or redeployments.
* **Limited location and media functionality:** Android location access is not configured, so Nearby uses a demo location, and uploaded photos are currently previews only.

**Future scope**

* **Production-ready accounts and payments:** Add secure user authentication, individual accounts, and real online payments.
* **Live services and partner integration:** Add real-time maps and location support, cloud photo storage, and partner/NGO workflows for pickup and status updates.
* **Community and platform expansion:** Enable user-created thrift listings, referral rewards, community features, and stronger offline/native Android functionality.

## Development

Generative AI was used during the initial development. The application was subsequently **tested, modified, debugged, customised, and deployed** as part of the project development process.
