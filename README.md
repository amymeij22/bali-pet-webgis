# Thermal Comfort Forecast - WebGIS (Bali, UTC+8)

Prediksi indeks kenyamanan termal berbasis **Physiological Equivalent Temperature (PET)** untuk **49 destinasi wisata di Provinsi Bali**. Aplikasi menampilkan prakiraan 3 hari ke depan dengan interval 3 jam, menyesuaikan seluruh tampilan waktu ke zona **WITA (UTC+8)**.

**Status**: Production Ready  
**Version**: 1.0  
**Last Updated**: December 2025

---

## 🎯 Ringkasan Fitur

### Visualisasi & Interaksi
- **Peta Choropleth:** 49 poligon destinasi wisata diwarnai berdasarkan nilai PET dengan hover highlight dan klik interaktif.
- **TimeSlider:** Kontrol waktu per 3 jam (24 slot) dengan autoplay, navigasi prev/next, grouping hari, dan display waktu produksi batch.
- **PET Legend:** Selector standar PET (Temperate vs Tropis/Subtropis) dengan legenda 9 kategori termal dan info popup penjelasan.
- **Weather Popup:** Detail cuaca lengkap (PET, suhu, kelembapan, angin, kondisi, visibilitas) dengan navigasi waktu di dalam popup.
- **Sidebar Destinasi:** Daftar 49 destinasi wisata dengan indikator warna PET, klik untuk pan peta dan buka popup.

### Fitur Tambahan
- **Push Notifications:** Notifikasi otomatis saat batch prakiraan baru tersedia (via Supabase Edge Function + Web Push API).
- **PWA (Progressive Web App):** Install sebagai aplikasi native-like dengan service worker dan offline capability.
- **Realtime Monitoring:** Deteksi batch baru secara real-time menggunakan Supabase Realtime.
- **Responsive Design:** Optimized untuk desktop, tablet, dan mobile dengan UI adaptif.
- **Timezone Handling:** Semua waktu ditampilkan dalam WITA (UTC+8) menggunakan helper `toWitaDate`.
- **Graceful Degradation:** Peta dan destinasi tetap tampil meskipun data forecast belum tersedia (dengan indikator "Data belum tersedia").

## 📁 Struktur Aplikasi

### Halaman
- **`/` (Index):** Halaman utama dengan peta, sidebar, kontrol waktu, dan popup.
- **`/mockup`:** Halaman mockup untuk development/testing (tidak termasuk dalam dokumentasi utama).

### Komponen Utama

#### Pages
- **`pages/Index.tsx`:** 
	- Halaman utama yang mengelola state global (times, selectedTime, isPlaying, producedAt, petStandard, forecastsByTime, choropleth, popupForecast, destinations, villagesWithDestinations).
	- Orchestrasi event handlers dan data loading.
	- Setup Realtime monitoring untuk batch baru.

#### Map Components
- **`components/map/LeafletMap.tsx`:** 
	- Peta Leaflet dengan GeoJSON layer untuk 49 destinasi wisata.
	- Choropleth coloring berdasarkan nilai PET dan standar aktif.
	- Hover highlight, klik handler, dan tooltip.
	- Support untuk poligon tanpa data (warna abu-abu).

#### Control Components
- **`components/controls/TimeSlider.tsx`:** 
	- Slider waktu dengan autoplay (1.5s interval), navigasi prev/next, grouping hari.
	- Display tanggal/jam dalam WITA, label "Waktu Produksi".
	- Notification toggle button terintegrasi.
	- Selalu tampil meskipun tidak ada data (dalam kondisi disabled).

- **`components/controls/PETLegend.tsx`:** 
	- Selector standar PET (Temperate vs Tropis/Subtropis).
	- Legenda 9 kategori termal dengan warna dan rentang suhu.
	- Info popup tentang PET dengan penjelasan lengkap.
	- Responsive: card di desktop, button overlay di mobile.

- **`components/controls/DataSourceCard.tsx`:** 
	- Card dengan daftar sumber data (BMKG, BIG, Dinas Pariwisata Bali).
	- Responsive: card di desktop, button overlay di mobile.

#### UI Components
- **`components/popup/WeatherPopup.tsx`:** 
	- Popup detail cuaca dengan navigasi waktu (prev/next tanpa menutup popup).
	- Display PET dengan background warna kategori.
	- Parameter cuaca lengkap dan saran wisatawan.
	- Support untuk desa dengan multiple destinasi.

- **`components/sidebar/DestinationSidebar.tsx`:** 
	- Daftar 49 destinasi wisata dengan indikator warna PET.
	- Klik destinasi untuk pan peta dan buka popup.
	- Toggle sidebar untuk mobile/desktop.

- **`components/header/MapHeader.tsx`:** 
	- Header dengan logo BMKG, STMKG, Instrumentasi.
	- Judul aplikasi.

- **`components/notifications/NotificationToggle.tsx`:** 
	- Toggle button untuk enable/disable push notifications.
	- Terintegrasi di TimeSlider card.

- **`components/pwa/InstallPrompt.tsx`:** 
	- PWA install prompt dengan auto-close setelah 10 detik.
	- Support untuk Android, iOS, dan desktop.

#### Data & Utilities
- **`data/supabaseQueries.ts`:** 
	- Functions untuk query Supabase (getLatestBatch, getAllForecastsForBatch, getVillagesWithDestinations, getDestinationsWithVillage, dll).
	- Push notification subscription management.

- **`lib/timezone.ts`:** 
	- Helper `toWitaDate()` untuk konversi UTC → WITA (UTC+8).
	- Helper `isSameWitaDay()` untuk perbandingan hari dalam WITA.

- **`hooks/useBatchMonitor.ts`:** 
	- Hook untuk monitor batch baru menggunakan Supabase Realtime.
	- Trigger reload data dan push notification saat batch baru terdeteksi.

## 🔄 Alur Data & Sistem

### Alur Load Aplikasi
1. **Initial Load:**
	- Load villages & destinations (selalu di-load, meskipun tidak ada batch).
	- Load GeoJSON file (`destinasi_wisata_bali.geojson`).
	- Load batch terbaru (`getLatestBatch()`).

2. **Load Forecast Data (jika batch tersedia):**
	- Query `getAllForecastsForBatch(batchId)` untuk mengambil **semua** forecast sekaligus.
	- Build `times` array: extract unique `forecast_time`, sort ascending.
	- Build cache `forecastsByTime: Map<forecast_time, Map<village_id, WeatherForecast>>`.
	- Set `selectedTime` ke waktu terawal.

3. **Render Peta:**
	- Render GeoJSON layer dengan style berdasarkan `choropleth` (dari cache).
	- Mapping `kdepum_code` dari GeoJSON ke `villages` (normalisasi: hapus karakter non-digit).

4. **Setup Realtime:**
	- Subscribe ke Supabase Realtime untuk `forecast_batches` (filter: `is_latest = TRUE`).
	- Setup push notification subscription (jika user sudah enable).

### Alur Interaksi Pengguna
1. **Slider Waktu:**
	- User menggeser slider → update `selectedTime` → turunkan `choropleth` dari cache → re-render peta.

2. **Autoplay:**
	- User klik play → setup interval 1.5s → auto-advance ke waktu berikutnya.
	- Autoplay pause otomatis saat popup dibuka.

3. **Selector Standar PET:**
	- User pilih standar → re-calculate kategori PET → re-render legenda dan peta (tanpa query ulang).

4. **Klik Poligon/Sidebar:**
	- Pause autoplay → set `activeVillage` → pull forecast dari cache → tampilkan popup.

5. **Navigasi Waktu di Popup:**
	- User klik prev/next → update `selectedTime` → pull forecast baru dari cache → update popup (tanpa menutup).

### Alur Batch Baru
1. **Realtime Detection:**
	- Supabase Realtime trigger saat batch baru dengan `is_latest = TRUE`.
	- Hook `useBatchMonitor` menerima event.

2. **Reload Data:**
	- Query `getAllForecastsForBatch(newBatchId)`.
	- Rebuild `times` array dan cache `forecastsByTime`.
	- Reset `selectedTime` ke waktu terawal.

3. **Push Notification:**
	- Supabase Edge Function `send-push-notification` ter-trigger via database webhook.
	- Function mengirim push notification ke semua active subscriptions.

## 🗄️ Database Schema

### Tabel Utama
- **`villages`:** Master data desa/kelurahan dengan `kdepum_code` untuk mapping ke GeoJSON.
- **`destinations`:** Master data 49 destinasi wisata (relasi one-to-many dengan `villages`).
- **`forecast_batches`:** Batch produksi data dengan flag `is_latest` untuk batch aktif.
- **`weather_forecasts`:** Data prediksi cuaca & PET per desa, per waktu (forecast per desa, bukan per destinasi).
- **`thermal_categories`:** Lookup 9 kategori termal (very_hot, hot, warm, slight_warm, neutral, slight_cool, cool, cold, very_cold).
- **`push_subscriptions`:** Web Push subscriptions untuk notifikasi batch baru.

### Relasi Data
- Satu desa bisa memiliki multiple destinasi (contoh: Kelurahan Tanjung Benoa memiliki 3 destinasi).
- Forecast disimpan per desa (`village_id`), bukan per destinasi.
- Jika satu desa memiliki multiple destinasi, semua destinasi menggunakan forecast yang sama.

## ⏰ Penanganan Waktu (WITA / UTC+8)
- **Asumsi:** Semua timestamp Supabase disimpan sebagai UTC.
- **Konversi:** `toWitaDate()` menambahkan offset +8 jam dikoreksi `getTimezoneOffset()` sehingga tampilan konsisten di zona apa pun.
- **Penggunaan:** 
	- TimeSlider (tanggal, jam, grouping hari, label "Hari Ini", label "Waktu Produksi").
	- WeatherPopup (tanggal & jam forecast).
	- Semua format waktu yang berasal dari Supabase.

## 🎨 Klasifikasi PET
- **Standar:** 
	- **Temperate (Iklim Sedang):** 9 kategori dengan rentang suhu untuk iklim sedang.
	- **Tropis/Subtropis:** 9 kategori dengan rentang suhu untuk iklim tropis/subtropis.
- **Perhitungan:** Kategori PET dihitung **client-side** berdasarkan nilai `pet_value` dan standar aktif.
- **Warna:** Setiap kategori memiliki warna unik (dari `PET_COLORS`).

## 🛠️ Stack Teknis

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI components)
- **Animasi:** Framer Motion
- **Routing:** React Router DOM
- **Peta:** Leaflet.js dengan OpenStreetMap tiles
- **Date Formatting:** date-fns dengan locale Indonesia
- **State Management:** React Hooks (useState, useEffect, useMemo, useCallback)
- **Data Fetching:** Supabase JS Client (@supabase/supabase-js)
- **Package Manager:** Bun (opsional: npm)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime untuk monitoring batch baru
- **Edge Functions:** Supabase Edge Functions (Deno) untuk push notifications
- **Web Push:** Web Push API dengan VAPID keys

### PWA
- **Service Worker:** Custom service worker untuk caching dan push notifications
- **Manifest:** Web App Manifest untuk install sebagai PWA
- **Offline:** Cache static assets dan GeoJSON file

## Setup & Skrip
Prerequisites: Node 18+, Bun atau npm.

Install & jalankan dev server:
```bash
bun install   # atau npm install
bun run dev   # atau npm run dev
```

Build & preview:
```bash
bun run build
bun run preview
```

Lint:
```bash
bun run lint
```

Env Supabase (contoh `.env.local`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📂 Struktur File

```
src/
├── pages/
│   ├── Index.tsx                 # Halaman utama
│   ├── Mockup.tsx                # Halaman mockup (development)
│   └── NotFound.tsx              # 404 page
├── components/
│   ├── map/
│   │   └── LeafletMap.tsx        # Peta choropleth PET
│   ├── controls/
│   │   ├── TimeSlider.tsx        # Slider waktu + autoplay + WITA
│   │   ├── PETLegend.tsx         # Legenda + selector standar PET
│   │   └── DataSourceCard.tsx    # Card sumber data
│   ├── popup/
│   │   └── WeatherPopup.tsx      # Popup detail cuaca
│   ├── sidebar/
│   │   └── DestinationSidebar.tsx # Sidebar daftar destinasi
│   ├── header/
│   │   └── MapHeader.tsx         # Header dengan logo
│   ├── notifications/
│   │   └── NotificationToggle.tsx # Toggle push notifications
│   ├── pwa/
│   │   └── InstallPrompt.tsx     # PWA install prompt
│   └── ui/                       # shadcn/ui components
├── data/
│   ├── supabaseQueries.ts        # Supabase query functions
│   └── dummyData.ts              # Data dummy & constants (PET_RANGES, PET_COLORS)
├── lib/
│   ├── supabaseClient.ts         # Supabase client setup
│   ├── timezone.ts               # Konversi UTC -> WITA
│   ├── pushNotification.ts       # Web Push API helpers
│   └── utils.ts                  # Utility functions
├── hooks/
│   ├── useBatchMonitor.ts        # Hook untuk monitor batch baru
│   ├── use-mobile.tsx            # Hook untuk detect mobile
│   └── use-toast.ts              # Toast notification hook
├── assets/                        # Static assets (logo, dll)
├── App.tsx                        # Root component dengan routing
└── main.tsx                       # Entry point

public/
├── data/
│   └── destinasi_wisata_bali.geojson  # GeoJSON poligon destinasi
├── sw.js                          # Service worker
└── manifest.json                  # PWA manifest

db/
└── schema.sql                     # Database schema

supabase/
└── functions/
    └── send-push-notification/   # Edge Function untuk push notifications
```

## ⚙️ Konfigurasi

### Environment Variables
Buat file `.env.local` di root project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. **Database:**
	- Run `db/schema.sql` di Supabase SQL Editor.
	- Insert data villages dan destinations (49 destinasi).

2. **Edge Function (Push Notifications):**
	- Deploy Edge Function `send-push-notification`.
	- Set secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.
	- Setup database webhook untuk trigger Edge Function (table: `forecast_batches`, events: `INSERT`, `UPDATE`).

3. **Realtime:**
	- Enable Realtime untuk table `forecast_batches` di Supabase Dashboard.

## 🚀 Deployment

### Build
```bash
bun run build    # atau npm run build
```

Output: Static files di folder `dist/`

### Hosting
- **Recommended:** Vercel atau Netlify (optimized untuk PWA).
- **Requirements:**
	- HTTPS required (untuk PWA dan push notifications).
	- Service worker harus di-root (`/sw.js`).
	- Set environment variables di platform hosting.

## ✅ Checklist Testing

### Functional
- [ ] Peta dan GeoJSON tampil dengan warna PET.
- [ ] Slider mengubah peta, autoplay berputar dan bisa dijeda.
- [ ] Label "Waktu Produksi" dan jam di slider/popup menampilkan waktu WITA (UTC+8).
- [ ] Toggle standar PET mengubah legenda, peta, dan popup secara instan.
- [ ] Klik desa menampilkan popup, autoplay pause, dan navigasi jam di popup berfungsi.
- [ ] Sidebar menampilkan 49 destinasi dengan indikator warna PET.
- [ ] Push notification berfungsi saat batch baru tersedia.
- [ ] PWA install prompt muncul dan bisa di-install.

### Responsive
- [ ] Desktop: semua panel visible, sidebar auto-open.
- [ ] Tablet: panel overlay, sidebar toggle.
- [ ] Mobile: panel sebagai button overlay, popup full-width.

### Edge Cases
- [ ] Peta tetap tampil meskipun tidak ada batch (poligon abu-abu).
- [ ] Sidebar tetap tampil meskipun tidak ada data (indikator "Belum tersedia").
- [ ] TimeSlider tetap tampil meskipun tidak ada data (dalam kondisi disabled).
- [ ] Popup tetap bisa dibuka meskipun tidak ada forecast (menampilkan "Belum tersedia").

## Testing & Deployment
- Lint: `bun run lint` (atau `npm run lint`).
- Build statis: `bun run build` (atau `npm run build`); preview lokal: `bun run preview`.
- Hosting: Vercel/Netlify; pastikan env Supabase diisi di platform deploy.

## Deployment
- Siap dibuild statis via `bun run build` (atau `npm run build`) untuk Vercel/Netlify. Atur env Supabase di platform tujuan.

## Lisensi
Bagian dari Tugas Akhir (Skripsi) STMKG
