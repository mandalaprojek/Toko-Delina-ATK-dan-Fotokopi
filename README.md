# Toko Delina ATK & Fotokopi — Kiko POS & Smart Shop v2.1

Aplikasi Web E-Commerce & Kasir POS Hybrid Syariah untuk **Toko Delina ATK & Fotokopi ("Kiko Smart Stationery")**, Tanjung Raja, Kabupaten Ogan Ilir.

## Struktur File Penting (Aman Tanpa Kredensial Rahasia)
- `index.html` — Antarmuka Utama Aplikasi Web & PWA
- `styles.css` — Desain Visual *Tokopedia Mobile Syariah* (`#0A5C36` Emerald, `#D4AF37` Royal Gold, `#111827` Charcoal), Rainbow Glowing Border, & Dark Mode
- `app.js` — Mesin Interaktif Frontend, Pemutar Audio Azan & Iqomah Asli, PWA Engine, Keranjang Cerdas, Kalkulator Cetak, POS Kasir, & Dashboard Owner
- `manifest.json` — Konfigurasi Progressive Web App (PWA) Standalone Display & App Shortcuts
- `sw.js` — Service Worker untuk Caching Offline Aset Inti & Media
- `Code.gs` — Backend Automation Google Apps Script (Semua API Key & PIN disimpan aman di *Script Properties*, bukan di dalam kode)
- `appsscript.json` — Konfigurasi Manifest Google Apps Script
- `server.js` — Server Pratinjau Lokal (`node server.js`)
- `assets/` — Aset Gambar & Maskot Resmi
- `assets/audio/` — Rekaman Audio Asli Berkualitas Tinggi: Azan Makkah Merdu, Azan Subuh Fajr, & Iqomah Sholat Berjamaah

## Cara Menjalankan di Lokal
```bash
node server.js
```
Buka salah satu alamat yang muncul di terminal (misal `http://127.0.0.1:8080` atau `http://tokodelina.lvh.me:8080`).

## Keamanan Data
Seluruh token rahasia (`GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `PIN_OWNER`, dsb.) dikonfigurasi langsung melalui **Google Apps Script -> Project Settings -> Script Properties** dan dikecualikan melalui `.gitignore` agar tetap aman.
