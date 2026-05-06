# WebGIS Prediksi Kenyamanan Termal (PET) — Bali (WITA/UTC+8)

Aplikasi WebGIS (SPA) untuk menampilkan **prediksi kenyamanan termal** berbasis indeks **Physiological Equivalent Temperature (PET)** pada **destinasi wisata di Bali**, lengkap dengan peta choropleth, slider waktu, popup detail cuaca, dan dukungan PWA + push notification.

## Ringkasan cepat
- **Platform**: React 18 + TypeScript + Vite
- **Map**: Leaflet + OSM tiles + GeoJSON poligon (`public/data/destinasi_wisata_bali.geojson`)
- **Data**: Supabase Postgres (forecast per **destinasi**, bukan per desa)
- **Waktu**: Semua tampilan waktu dikonversi ke **WITA (UTC+8)**.
- **PWA**: `manifest.json` + service worker (`public/sw.js`)
- **Notifikasi**: Web Push API + Supabase Edge Function `send-push-notification`

## Fitur utama
- **Peta choropleth**: warna poligon mengikuti kategori PET pada waktu terpilih.
- **Slider waktu (3 jam)**: langkah 3 jam dengan toleransi nearest-time (kasus offset BMKG), autoplay, label “Waktu Produksi”.
- **Multi-destinasi per desa**:
  - Popup menampilkan dropdown jika satu desa memiliki >1 destinasi.
  - Warna poligon desa menggunakan **PET terpanas (maksimum)** dari destinasi dalam desa tersebut.
- **Popup detail**: hero image destinasi, PET + kategori, suhu/kelembapan/angin/kondisi/visibilitas, navigasi waktu dalam popup.
- **Sidebar destinasi**: search, grouping (jika metadata tersedia), dan scroll-to-active.
- **Multi-bahasa**: Indonesia + English (teks UI), dengan selector di TimeSlider.
- **Push notification**: subscribe/unsubscribe, status tombol mengikuti subscription nyata browser.

## Struktur data (kontrak penting)
Source of truth: `db/schema.sql`.

- **`villages`**: master desa + `kdepum_code` untuk mapping ke GeoJSON.
- **`destinations`**: master destinasi (many-to-one ke `villages`), termasuk:
  - `latitude`, `longitude`, `sea_level_height` (per destinasi)
  - `image_url` (opsional) untuk hero image popup
- **`forecast_batches`**: batch produksi data (1 batch `is_latest = true`).
- **`weather_forecasts`**: forecast per **destinasi** dan waktu (`destination_id`, `batch_id`, `forecast_time`).
- **`push_subscriptions`**: endpoint push yang aktif.

## Hero image destinasi (`destinations.image_url`)
Popup mengambil gambar dari **`destinations.image_url`** (URL penuh). Jika kosong/gagal load, akan fallback ke placeholder.

Catatan:
- Jika kamu menyimpan **signed URL** Supabase Storage, URL bisa expired. Rekomendasi: gunakan **public bucket URL** atau simpan path objek + generate URL dengan mekanisme yang tidak cepat expired.

## PWA & caching (production-ready)
- **Service worker**: `public/sw.js`
  - HTML navigations: **network-first** (update cepat), fallback cache/offline.
  - Build assets (`/assets/*`, js/css/font/img): **cache-first** (aman karena hashed).
  - GeoJSON: **stale-while-revalidate**.
  - Supabase API: **network-only** (tidak dicache).

## Setup lokal
Prerequisite: Node.js 18+.

1) Install dependencies (pilih salah satu, jangan campur):

```bash
npm install
```

2) Siapkan env:
- Buat `webgis/.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...   # untuk subscribe Web Push dari browser
```

3) Jalankan dev:

```bash
npm run dev
```

4) Build & preview:

```bash
npm run build
npm run preview
```

## Setup Supabase (ringkas)
1) Jalankan skema:
- Eksekusi `db/schema.sql` di Supabase SQL Editor.

2) (Opsional) Tambah kolom gambar jika DB lama:
- Eksekusi `db/migration.sql` (hanya menambah `destinations.image_url`).

3) Edge Function push notification:
- Deploy `supabase/functions/send-push-notification`.
- Set secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Buat database webhook untuk `forecast_batches` (INSERT/UPDATE) yang memanggil function.

4) Realtime:
- Enable Realtime untuk tabel `forecast_batches`.

## Deployment
- Output build: `dist/`
- Wajib **HTTPS** (PWA & push notifications).
- Pastikan `manifest.json` dan `sw.js` berada di root path (`/manifest.json`, `/sw.js`).

## Troubleshooting cepat
- **Peta/data tidak muncul**: cek RLS/policy untuk tabel `villages`, `destinations`, `forecast_batches`, `weather_forecasts`.
- **Gambar masih placeholder**: pastikan `destinations.image_url` terisi dan URL bisa diakses dari client.
- **Notifikasi “aktif” tapi tidak masuk**: cek Edge Function logs, VAPID keys, dan status subscription di `push_subscriptions`.

## Lisensi
Bagian dari Tugas Akhir (Skripsi) STMKG.
