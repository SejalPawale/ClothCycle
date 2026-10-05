# ClothCycle (Flask + SQLite + vanilla JS)
Wear. Share. Repeat. Donate, thrift, rent and recycle clothes; earn CyclePoints; track impact.

## Structure
    app.py            Flask REST API, SQLite schema, seed data, points/impact rules
    static/           Frontend (index.html, styles.css, app.js, manifest.json, sw.js)
    clothcycle.db     Created automatically on first run (delete it to reset demo data)

## Run
    pip install -r requirements.txt
    python app.py
Open http://localhost:5000. Admin dashboard: click Admin, password `admin123`.

## API
GET /api/catalog, /api/state, /api/admin | PUT /api/sync | POST /api/donations, /api/recycle, /api/rent, /api/redeem, /api/checkout

## Build the APK (Capacitor)
    npm init -y
    npm i @capacitor/core @capacitor/cli @capacitor/android
    mkdir www && cp -r static/* www/
    npx cap init ClothCycle com.clothcycle.app --web-dir www
    npx cap add android
Edit `capacitor.config.json` and add: `"server": {"androidScheme": "http", "cleartext": true}`
In `www/app.js` change the first API line to your PC's LAN address, e.g. `const API='http://192.168.1.10:5000';`, then:
    npx cap sync
    npx cap open android      # Android Studio: Build > Build APK(s)
The phone and PC must be on the same Wi-Fi while demoing. Output: android/app/build/outputs/apk/debug/app-debug.apk
