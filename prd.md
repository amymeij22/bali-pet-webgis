## PRD: WebGIS Thermal Comfort Forecast

**Nama Proyek:** Prediksi Indeks Kenyamanan Termal Destinasi Wisata Provinsi Bali  
**Versi:** 1.0  
**Status:** Draft / Living Document (disesuaikan dengan implementasi terkini)  
**Tech Stack (aktual):** React 18 + TypeScript + Vite (Frontend), Supabase (PostgreSQL), Leaflet.js (Map Library), Tailwind CSS + shadcn/ui (UI)

---

## Daftar Isi
- Ringkasan Proyek
- Tujuan & KPI
- Ruang Lingkup
- Persona & Use Case
- Fitur Utama & Alur Kerja
- Struktur UI & Layout
- Spesifikasi Pop-up Interaktif
- Arsitektur Data (Supabase/PostgreSQL)
- API & Query Layer
- Logika Sistem (Algoritma)
- Non-Functional Requirements
- Keamanan & Privasi
- Deployment & Konfigurasi
- Pengujian & Acceptance Criteria
- Risiko & Mitigasi
- Timeline & Deliverables

---

## 1. Ringkasan Proyek
Platform WebGIS interaktif dengan landing yang langsung menampilkan peta full-bleed (tanpa jendela/wrapper tambahan) untuk visualisasi prediksi kenyamanan termal berdasarkan indeks Physiological Equivalent Temperature (PET) di destinasi wisata di Bali. Prediksi disajikan per 3 jam untuk 3 hari ke depan, selalu menampilkan batch produksi terbaru (produce time). Peta menggunakan choropleth pada poligon desa wisata (geometri awal: file statis `destinasi_wisata_bali.geojson`), dilengkapi kontrol waktu, klasifikasi standar PET (Temperate vs (Sub) Tropis) yang mengubah warna secara responsif, serta pop-up interaktif dengan parameter cuaca dan saran bagi wisatawan.

Implementasi frontend menggunakan React + Vite (SPA) dengan routing `react-router-dom` (bukan Next.js/App Router), dan integrasi data cuaca & PET melalui Supabase client `@supabase/supabase-js`.

---

## 2. Tujuan & KPI
- **Tujuan:**
	- Menyediakan panduan kenyamanan termal bagi wisatawan untuk perencanaan aktivitas.
	- Menyatukan data geospasial dan cuaca dalam antarmuka yang mudah digunakan.
	- Memastikan data yang ditampilkan selalu dari batch produksi terbaru.
- **KPI:**
	- Waktu muat peta awal ≤ 3 detik pada jaringan 4G.
	- Interaksi slider waktu merender ulang peta ≤ 200 ms.
	- Akurasi pemetaan PET ke kategori sesuai standar ≥ 99% berdasarkan dataset uji.
	- Ketersediaan layanan ≥ 99% selama periode operasional.

---

## 3. Ruang Lingkup
- **Dalam lingkup:**
	- Visualisasi choropleth PET untuk 49 destinasi wisata di Bali (geometri dari file statis `destinasi_wisata_bali.geojson`).
	- Kontrol waktu per 3 jam untuk 3 hari ke depan dengan autoplay, navigasi prev/next, dan grouping hari.
	- Pemilihan standar PET (Temperate vs Tropis/Subtropis) yang mengubah legenda dan pewarnaan secara real-time.
	- Pop-up interaktif dengan detail cuaca lengkap, navigasi waktu, dan saran untuk wisatawan.
	- Sidebar destinasi dengan daftar 49 lokasi wisata dan indikator PET per destinasi.
	- Pengambilan data dari Supabase dengan filter batch terbaru (`is_latest = TRUE`).
	- Push notification untuk notifikasi batch baru (via Supabase Edge Function + Web Push API).
	- PWA (Progressive Web App) dengan install prompt dan service worker.
	- Realtime monitoring batch baru menggunakan Supabase Realtime.
	- Responsivitas penuh (desktop, tablet, mobile) dan caching data statis.
	- Penanganan waktu WITA (UTC+8) untuk semua tampilan waktu.
	- Tampilan poligon dan destinasi tetap terlihat meskipun data forecast belum tersedia (dengan indikator "Data belum tersedia").
- **Di luar lingkup:**
	- Pengeditan data geospasial/cuplikan peta oleh pengguna.
	- Auth pengguna selain kunci anon Supabase untuk pembacaan publik.
	- Halaman mockup (hanya untuk development/testing).

---

## 4. Persona & Use Case
- **Wisatawan:** Mengecek kenyamanan termal lokasi wisata untuk menentukan waktu berkunjung yang optimal.
- **Pelaku usaha lokal:** Menyesuaikan jadwal layanan/outdoor activity dengan kondisi kenyamanan termal.
- **Pengelola destinasi:** Memantau tren kenyamanan dan menyusun informasi bagi pengunjung.

Use Case utama:
- Melihat peta choropleth PET terkini untuk 49 destinasi wisata di Bali.
- Menggeser slider waktu untuk melihat prediksi per 3 jam (dengan autoplay opsional).
- Mengganti standar klasifikasi PET (Temperate vs Tropis/Subtropis) yang langsung mengubah warna peta dan legenda.
- Mengklik poligon atau item sidebar untuk melihat detail cuaca lengkap dan saran wisatawan.
- Mengaktifkan push notification untuk menerima notifikasi saat batch prakiraan baru tersedia.
- Menginstall aplikasi sebagai PWA untuk akses offline dan pengalaman native-like.

---

## 5. Fitur Utama & Alur Kerja

### Fitur Utama
- **Visualisasi Geospasial:** Poligon 49 destinasi wisata diwarnai secara dinamis (choropleth) berdasarkan nilai PET, dengan highlight saat hover dan klik.
- **Manajemen Waktu (Forecast):** 
	- Slider waktu per 3 jam untuk hingga 3 hari ke depan (24 slot waktu).
	- Autoplay dengan interval 1.5 detik (dapat di-pause).
	- Navigasi prev/next dengan tombol panah.
	- Grouping hari dengan label "Hari Ini" dan tanggal.
	- Display waktu produksi batch dalam format WITA.
	- Slider tetap tampil meskipun tidak ada data (dalam kondisi disabled).
- **Klasifikasi Dinamis:** 
	- Selector standar PET (Temperate vs Tropis/Subtropis) yang mengubah legenda, label, dan pewarnaan secara real-time pada layer peta dan popup.
	- Info popup tentang PET dengan penjelasan lengkap.
- **Pop-up Interaktif:** 
	- Detail cuaca lengkap (PET, suhu, kelembapan, angin, kondisi, visibilitas).
	- Navigasi waktu di dalam popup (prev/next) tanpa menutup popup.
	- Saran wisatawan berdasarkan kategori termal.
	- Support untuk desa dengan multiple destinasi (menampilkan semua destinasi).
	- Tampil meskipun data forecast belum tersedia (menampilkan "Belum tersedia").
- **Sidebar Destinasi:** 
	- Daftar 49 destinasi wisata dengan indikator warna PET.
	- Klik destinasi untuk pan peta dan buka popup.
	- Toggle sidebar untuk mobile/desktop.
- **Push Notification:** 
	- Toggle notifikasi terintegrasi di TimeSlider card.
	- Notifikasi otomatis saat batch baru tersedia (via Supabase Edge Function).
	- Service worker untuk handle push events.
- **PWA (Progressive Web App):** 
	- Install prompt otomatis (auto-close setelah 10 detik).
	- Service worker untuk offline capability.
	- Manifest untuk install sebagai aplikasi native-like.
- **Data Management:** 
	- Menampilkan data dari batch produksi terbaru menggunakan `is_latest = TRUE`.
	- Realtime monitoring batch baru menggunakan Supabase Realtime.
	- Caching data forecast di memory untuk performa optimal.
- **Full-Bleed Map:** Peta langsung memenuhi viewport; semua kontrol berupa elemen melayang minimalis (header, sidebar destinasi, selector standar, legenda, slider waktu, data source card) yang non-intrusif.

### Alur Sistem (End-to-End, sesuai implementasi)

#### A. Alur Load Aplikasi (Initial Load)
1. **Inisialisasi Aplikasi:**
	 - React (Vite) mount, setup routing dengan `react-router-dom`.
	 - Inisialisasi Leaflet map dengan OSM TileLayer, center ke Bali, zoom level 10.
	 - Setup Supabase client dengan anon key.
	 - Register service worker untuk PWA (jika didukung).

2. **Load Data Awal (Paralel):**
	 - **Load Villages & Destinasi:** Query `getVillagesWithDestinations()` dan `getDestinationsWithVillage()` untuk mendapatkan 49 destinasi dan mapping desa-destinasi. Data ini **selalu di-load** meskipun tidak ada batch.
	 - **Load GeoJSON:** Fetch file statis `destinasi_wisata_bali.geojson` dari public folder.
	 - **Load Batch Terbaru:** Query `getLatestBatch()` untuk mendapatkan batch dengan `is_latest = TRUE`.

3. **Render Peta & Sidebar:**
	 - Render GeoJSON layer di Leaflet dengan style default (abu-abu jika belum ada data forecast).
	 - Populate sidebar dengan daftar 49 destinasi.
	 - Mapping `kdepum_code` dari GeoJSON ke `villages` (normalisasi: hapus karakter non-digit).

4. **Load Forecast Data (jika batch tersedia):**
	 - Query `getAllForecastsForBatch(batchId)` untuk mengambil **semua** forecast sekaligus.
	 - Build `times` array: extract unique `forecast_time`, sort ascending.
	 - Build cache `forecastsByTime: Map<forecast_time, Map<village_id, WeatherForecast>>`.
	 - Set `selectedTime` ke waktu terawal.

5. **Render Choropleth Awal:**
	 - Turunkan `choropleth: Map<village_id, { pet_value }>` dari cache untuk `selectedTime`.
	 - Hitung kategori PET berdasarkan standar aktif (default: tropical) dan `pet_value`.
	 - Apply style ke GeoJSON layer dengan warna sesuai kategori.

6. **Setup Realtime Monitoring:**
	 - Subscribe ke Supabase Realtime untuk `forecast_batches` dengan filter `is_latest=eq.true`.
	 - Setup push notification subscription (jika user sudah enable).

#### B. Alur Interaksi Pengguna

1. **Slider Waktu:**
	 - User menggeser slider atau klik prev/next → `handleTimeChange(selectedTime)`.
	 - Update `selectedTime` state.
	 - Turunkan `choropleth` baru dari cache `forecastsByTime` untuk waktu tersebut.
	 - Re-render peta dengan `setStyle()` (tanpa query ulang ke Supabase).
	 - Update label waktu di TimeSlider (format WITA).

2. **Autoplay:**
	 - User klik play → `setIsPlaying(true)`.
	 - Setup interval 1.5 detik untuk auto-advance ke waktu berikutnya.
	 - Autoplay pause otomatis saat popup dibuka.

3. **Selector Standar PET:**
	 - User pilih standar (Temperate/Tropis) → `handleStandardChange(standard)`.
	 - Update `petStandard` state.
	 - Re-calculate kategori PET untuk semua poligon berdasarkan standar baru.
	 - Re-render legenda dengan rentang baru.
	 - Re-render peta dengan warna baru (tanpa query ulang).

4. **Klik Poligon:**
	 - User klik poligon di peta → `handleVillageClick(villageId, destinationName, villageName)`.
	 - Pause autoplay (`setIsPlaying(false)`).
	 - Set `activeVillage` state dengan info desa/destinasi.
	 - Set `showPopup(true)`.
	 - Pull forecast detail dari cache `forecastsByTime` untuk `selectedTime` dan `villageId`.
	 - Tampilkan popup dengan detail cuaca.

5. **Klik Item Sidebar:**
	 - User klik destinasi di sidebar → `handleVillageClick(...)`.
	 - Pan peta ke lokasi desa (fitBounds).
	 - Highlight poligon desa (stroke tebal).
	 - Buka popup (sama seperti klik poligon).

6. **Navigasi Waktu di Popup:**
	 - User klik panah prev/next di popup → `onTimeChange(newTime)`.
	 - Update `selectedTime` (sinkron dengan slider).
	 - Pull forecast detail baru dari cache untuk waktu baru.
	 - Update popup content (tanpa menutup popup).

7. **Toggle Notifikasi:**
	 - User klik toggle notifikasi → `subscribeToPushNotifications()` atau `unsubscribeFromPushNotifications()`.
	 - Request permission (jika belum granted).
	 - Save/remove subscription ke database `push_subscriptions`.
	 - Show toast feedback.

#### C. Alur Batch Baru Terdeteksi

1. **Realtime Detection:**
	 - Supabase Realtime trigger saat batch baru di-insert/update dengan `is_latest = TRUE`.
	 - Hook `useBatchMonitor` menerima event.

2. **Reload Data:**
	 - Call `handleNewBatch(batch)`.
	 - Query `getAllForecastsForBatch(newBatchId)`.
	 - Rebuild `times` array dan cache `forecastsByTime`.
	 - Reset `selectedTime` ke waktu terawal.

3. **Push Notification:**
	 - Supabase Edge Function `send-push-notification` ter-trigger via database webhook.
	 - Function mengirim push notification ke semua active subscriptions.
	 - User menerima notifikasi di browser/device.

4. **Local Notification (Fallback):**
	 - Jika user sedang online dan batch baru terdeteksi, show local notification sebagai fallback.

#### D. Penanganan Data Tidak Tersedia

- **Tidak Ada Batch:** 
	- Peta tetap tampil dengan poligon abu-abu.
	- Sidebar tetap tampil dengan indikator "Belum tersedia".
	- TimeSlider tampil dalam kondisi disabled (menampilkan "-").
	- Popup tetap bisa dibuka (menampilkan "Belum tersedia" untuk semua parameter).

- **Tidak Ada Forecast untuk Desa Tertentu:**
	- Poligon desa ditampilkan dengan warna abu-abu (#9ca3af).
	- Tooltip menampilkan "(Data belum tersedia)".
	- Sidebar menampilkan "Belum tersedia" untuk destinasi tersebut.
	- Popup tetap bisa dibuka dengan semua parameter menampilkan "Belum tersedia".

#### E. Caching & Performa

- **Memory Cache:**
	- `forecastsByTime: Map<forecast_time, Map<village_id, WeatherForecast>>` - cache semua forecast untuk batch aktif.
	- `choropleth: Map<village_id, { pet_value }>` - cache data untuk waktu terpilih.
	- `villagesByKdepum: Record<string, {...}>` - cache mapping kdepum ke village info.

- **LocalStorage:**
	- GeoJSON bisa di-cache (opsional, belum diimplementasikan).

- **Service Worker:**
	- Cache static assets (HTML, CSS, JS).
	- Cache GeoJSON file.
	- Handle push notifications.

#### F. Timezone Handling (WITA / UTC+8)

- Semua timestamp dari Supabase (UTC) dikonversi ke WITA menggunakan `toWitaDate()`.
- Format waktu di TimeSlider, popup, dan label "Waktu Produksi" selalu dalam WITA.
- Grouping hari menggunakan `isSameDay()` dengan timezone WITA.

---

## 6. Struktur UI & Layout

### Halaman Utama (`/`)
- **Canvas Peta Utama:** 
	- Peta memenuhi seluruh viewport (full-bleed) dengan OSM TileLayer.
	- Center: Bali (-8.4095, 115.1889), Zoom: 10.
	- Fit bounds ke poligon destinasi wisata saat load.
	- Z-index: 0 (background).

- **Header (Atas Tengah):**
	- Logo BMKG, STMKG, dan Instrumentasi dalam badge kecil.
	- Judul aplikasi: "Prediksi Kenyamanan Termal Berbasis Indeks Physiological Equivalent Temperature untuk Destinasi Wisata di Provinsi Bali".
	- Z-index: 40.
	- Glass panel dengan backdrop blur.

- **Sidebar Destinasi (Kiri):**
	- Drawer yang bisa dibuka/tutup (toggle button dengan label "DESTINASI").
	- Daftar 49 destinasi wisata scrollable.
	- Setiap item menampilkan:
		- Indikator warna PET (bulat kecil).
		- Nama destinasi.
		- Nilai PET (°C) atau "Belum tersedia".
	- Klik item memicu pan-to + popup.
	- Lebar: 220px (mobile) / 264px (desktop).
	- Background: glass panel semi-transparan.
	- Z-index: 40.
	- Auto-open di desktop, auto-close di mobile.

- **Panel Kontrol PET (Kanan Atas):**
	- Card melayang dengan selector standar PET (Temperate vs Tropis/Subtropis).
	- Legenda 9 kategori termal dengan warna dan rentang suhu.
	- Info button untuk popup penjelasan PET.
	- Lebar: 200px.
	- Z-index: 30.
	- Desktop: selalu visible. Mobile: button overlay di kiri bawah.

- **TimeSlider Card (Bawah Tengah):**
	- Card melayang dengan:
		- Display tanggal dan waktu (format WITA).
		- Slider waktu dengan navigasi prev/next dan play/pause.
		- Label hari (Hari Ini / tanggal).
		- Notification toggle button.
		- Label "Waktu Produksi" dengan timestamp batch.
	- Selalu tampil meskipun tidak ada data (dalam kondisi disabled).
	- Z-index: 30.
	- Auto-close PWA prompt jika tidak di-respon dalam 10 detik.

- **Data Source Card (Kanan Bawah):**
	- Card dengan daftar sumber data:
		- Data Prakiraan Cuaca Terbuka BMKG.
		- Batas Administrasi Desa/Kelurahan BIG.
		- Daya Tarik Wisata Dinas Pariwisata Provinsi Bali.
	- Desktop: selalu visible. Mobile: button overlay.
	- Z-index: 20.

- **PWA Install Prompt (Bawah Kiri/Kanan):**
	- Card dengan tombol install aplikasi.
	- Auto-close setelah 10 detik jika tidak di-respon.
	- Z-index: 35 (di bawah TimeSlider).

- **Weather Popup (Center Modal):**
	- Modal overlay dengan backdrop blur.
	- Header: nama desa/destinasi, tanggal, navigasi waktu.
	- PET display: nilai PET dengan background warna kategori.
	- Parameter cuaca: suhu, kelembapan, angin, kondisi, visibilitas.
	- Saran wisatawan berdasarkan kategori termal.
	- Z-index: 50.
	- Klik backdrop untuk tutup.

- **Interaksi Peta:**
	- Hover: highlight poligon (stroke tebal, fill opacity tinggi).
	- Klik: buka popup, pause autoplay, highlight poligon.
	- Tooltip: nama desa/destinasi + "(Data belum tersedia)" jika tidak ada data.
	- Stroke: tipis putih, fill warna mengikuti kategori aktif.
	- Poligon tanpa data: abu-abu (#9ca3af).

### Responsivitas
- **Desktop (≥ 1024px):** 
	- Sidebar auto-open, semua panel visible.
	- Popup width: 340px.
- **Tablet (768px - 1023px):** 
	- Sidebar overlay, panel compact.
	- Popup width: 340px.
- **Mobile (< 768px):** 
	- Sidebar overlay dengan backdrop.
	- Panel sebagai button overlay.
	- Popup full-width atau bottom sheet.
	- Tap target ≥ 44x44px.

---

## 7. Spesifikasi Pop-up Interaktif

### Komponen Popup (`WeatherPopup.tsx`)

- **Navigasi Waktu:**
	- Panah kiri/kanan untuk jam sebelumnya/berikutnya.
	- Navigasi tidak menutup popup.
	- Sinkron dengan TimeSlider (mengubah `selectedTime`).
	- Disabled jika tidak ada waktu prev/next.
	- Hanya tampil jika forecast data tersedia.

- **Elemen & Konten:**

	1. **Header:**
		- **Nama Destinasi/Desa:**
			- Jika desa memiliki multiple destinasi: tampilkan nama desa sebagai title utama, lalu daftar semua destinasi di bawahnya.
			- Jika desa memiliki single destinasi: tampilkan nama destinasi sebagai title, nama desa sebagai subtitle.
		- **Waktu Forecast:** Format "EEEE, dd MMM yyyy" (contoh: "Senin, 15 Jan 2025").
		- **Navigasi Waktu:** Format "HH:mm WITA" dengan tombol prev/next.
		- **Close Button:** Tombol X di pojok kanan atas.

	2. **PET Display (Main Display):**
		- **Background:** Warna sesuai kategori termal (dari `PET_COLORS`).
		- **Nilai PET:** Font besar (36px) dengan format "{value}°C".
		- **Label Kategori:** Nama kategori dalam bahasa Indonesia (dari `PET_RANGES[standard][category].labelId`).
		- **Jika Tidak Ada Data:** Menampilkan "Belum Tersedia" dengan background abu-abu.

	3. **Parameter Cuaca (Grid):**
		- **Suhu Udara:** Icon thermometer, format "{value}°C".
		- **Kelembapan:** Icon droplets, format "{value}%".
		- **Kecepatan Angin:** Icon wind, format "{value} km/jam".
		- **Arah Angin:** Icon compass, format "{value}" (N, NE, E, SE, S, SW, W, NW).
		- **Kondisi Cuaca:** Icon cloud, format "{value}" (Cerah, Berawan, Hujan, dst).
		- **Jarak Pandang:** Icon eye, format "{value}" (Baik, Sedang, Buruk).
		- **Jika Tidak Ada Data:** Semua parameter menampilkan "Belum tersedia".

	4. **Visitor Notes (Saran):**
		- Hanya tampil jika forecast data tersedia.
		- Icon lightbulb dengan saran otomatis berdasarkan kategori termal:
			- `very_hot` / `hot`: "Gunakan sunscreen SPF 30+, topi lebar, dan hidrasi setiap 15-20 menit. Hindari aktivitas berat siang hari."
			- `warm` / `slight_warm`: "Gunakan pakaian ringan dan breathable. Bawa air minum yang cukup."
			- `neutral`: "Kondisi nyaman untuk aktivitas outdoor. Tetap gunakan sunscreen."
			- `slight_cool` / `cool`: "Bawa jaket ringan. Kondisi ideal untuk trekking."
			- `cold` / `very_cold`: "Gunakan jaket tebal dan layering. Lindungi ekstremitas dari udara dingin."

- **Behavior:**
	- Popup dibuka saat klik poligon atau item sidebar.
	- Autoplay otomatis pause saat popup dibuka.
	- Klik backdrop untuk tutup popup.
	- Animasi: fade in/out dengan scale effect (Framer Motion).
	- Responsif: width 340px di desktop, full-width atau bottom sheet di mobile.

---

## 8. Arsitektur Data (Supabase/PostgreSQL – sesuai schema.sql)

### Tabel `thermal_categories` (Lookup Kategori Termal)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID unik kategori |
| `category_key` | VARCHAR(20) | NOT NULL, UNIQUE | Kunci kategori (`very_hot`, `neutral`, dst) |
| `category_name` | VARCHAR(100) | NOT NULL | Nama kategori (Indonesia) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record dibuat |

**Catatan:**
- Menyimpan 9 kategori termal standar PET.
- Dikaitkan dengan tabel `weather_forecasts` melalui kolom UUID.

---

### Tabel `villages` (Master Data Desa/Kelurahan dengan KDEPUM)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID unik desa |
| `village_name` | VARCHAR(100) | NOT NULL, UNIQUE | Nama desa/kelurahan |
| `kdepum_code` | VARCHAR(20) | NOT NULL, UNIQUE | Kode KDEPUM (boleh mengandung titik) untuk sinkronisasi dengan GeoJSON |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record terakhir diupdate (auto-update via trigger) |

**Catatan Penting:**
- Skema aktual **tidak** menyimpan geometri `geom` di database.
- Batas desa wisata diambil dari file GeoJSON statis `destinasi_wisata_bali.geojson`.
- Penyambungan poligon ke baris `villages` dilakukan di frontend dengan menormalkan `kdepum_code` dari properti GeoJSON (menghapus karakter non-digit) dan mencocokkannya ke kolom `kdepum_code`.
- Satu desa bisa memiliki multiple destinasi wisata (relasi one-to-many dengan tabel `destinations`).

### Tabel `destinations` (Master Data Destinasi Wisata)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID unik destinasi |
| `village_id` | UUID | FK → `villages.id`, NOT NULL | Referensi desa |
| `destination_name` | VARCHAR(120) | NOT NULL | Nama destinasi wisata |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record terakhir diupdate (auto-update via trigger) |

**Catatan Penting:**
- Satu desa bisa memiliki multiple destinasi (contoh: Kelurahan Tanjung Benoa memiliki 3 destinasi: Pantai Nusa Dua, Pantai Tanjung Benoa, Water Blow Peninsula).
- Total 49 destinasi wisata di database.
- Constraint `UNIQUE (village_id, destination_name)` mencegah duplikasi destinasi per desa.

---

### Tabel `forecast_batches` (Batch Produksi Data)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID batch |
| `produced_at` | TIMESTAMPTZ | NOT NULL, UNIQUE | Waktu batch diproduksi |
| `is_latest` | BOOLEAN | DEFAULT FALSE | Flag batch terbaru (hanya 1 TRUE) |
| `forecast_start` | TIMESTAMPTZ | NOT NULL | Waktu mulai forecast |
| `forecast_end` | TIMESTAMPTZ | NOT NULL | Waktu akhir forecast |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record dibuat |

**Indeks:**
- `idx_batches_is_latest` (`is_latest`) WHERE `is_latest = TRUE`.
- `idx_batches_produced_at` (`produced_at` DESC).

**Trigger:** Auto-set `is_latest = FALSE` untuk batch lain saat batch baru di-insert dengan `is_latest = TRUE`.

---

### Tabel `weather_forecasts` (Data Prediksi Cuaca & PET)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID record |
| `village_id` | UUID | FK → `villages.id`, NOT NULL | Referensi desa (forecast per desa, bukan per destinasi) |
| `batch_id` | UUID | FK → `forecast_batches.id`, NOT NULL | Referensi batch |
| `forecast_time` | TIMESTAMPTZ | NOT NULL | Waktu prediksi (per 3 jam) |
| `temperature` | NUMERIC(4,1) | NOT NULL | Suhu udara (°C) |
| `humidity` | NUMERIC(4,1) | NOT NULL, CHECK (0-100) | Kelembapan relatif (%) |
| `wind_speed` | NUMERIC(5,2) | NOT NULL | Kecepatan angin (km/jam) |
| `wind_direction` | VARCHAR(10) | NOT NULL | Arah angin (N, NE, E, SE, dst) |
| `weather_condition` | VARCHAR(100) | NOT NULL | Deskripsi cuaca (Cerah, Hujan, dst) |
| `visibility` | VARCHAR(50) | NOT NULL | Jarak pandang (Baik, Sedang, Buruk) |
| `pet_value` | NUMERIC(5,2) | NOT NULL | Nilai PET (°C) |
| `temperate_thermal_category` | UUID | NULL, FK → `thermal_categories.id` | Kategori termal (standar iklim sedang) |
| `sub_tropic_thermal_category` | UUID | NULL, FK → `thermal_categories.id` | Kategori termal (standar tropis/subtropis) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record dibuat |

**Catatan Penting:**
- Forecast disimpan **per desa** (`village_id`), bukan per destinasi.
- Jika satu desa memiliki multiple destinasi, semua destinasi tersebut menggunakan forecast yang sama (karena lokasinya sama).
- Di frontend, sidebar menampilkan 49 destinasi, tetapi forecast diambil berdasarkan `village_id`.

**Indeks:**
- `idx_forecasts_batch_time` (`batch_id`, `forecast_time`) — untuk query slider waktu.
- `idx_forecasts_village_batch` (`village_id`, `batch_id`) — untuk query per desa.
- `UNIQUE CONSTRAINT` (`village_id`, `batch_id`, `forecast_time`) — hindari duplikasi.

**Foreign Key Constraints:**
- `village_id` ON DELETE CASCADE
- `batch_id` ON DELETE CASCADE
- `temperate_thermal_category` / `sub_tropic_thermal_category` ON DELETE SET NULL

### Tabel `push_subscriptions` (Push Notification Subscriptions)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID unik subscription |
| `endpoint` | TEXT | NOT NULL, UNIQUE | Web Push endpoint URL |
| `p256dh` | TEXT | NOT NULL | Public key untuk enkripsi |
| `auth` | TEXT | NOT NULL | Secret untuk autentikasi |
| `user_agent` | TEXT | NULL | User agent browser |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Status aktif subscription |
| `last_notified_batch_id` | UUID | NULL | ID batch terakhir yang di-notify |
| `last_notified_at` | TIMESTAMPTZ | NULL | Waktu terakhir notifikasi dikirim |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Waktu record terakhir diupdate |

**Catatan Penting:**
- Menyimpan subscription Web Push API untuk setiap user yang mengaktifkan notifikasi.
- Edge Function `send-push-notification` akan mengirim notifikasi ke semua active subscriptions saat batch baru tersedia.

---

### Improvements dari Desain Sebelumnya:
1. **Penamaan konsisten:** `weather_forecasts` lebih deskriptif dari `weather_data`.
2. **Kolom timestamp:** Tambah `created_at` dan `updated_at` (di `villages`) untuk audit trail.
3. **Constraints:** CHECK constraints untuk validasi data (humidity 0-100) dan unique constraint per kombinasi desa-batch-waktu.
4. **Normalisasi:** Kategori termal dipisah ke tabel lookup `thermal_categories`; tabel `weather_forecasts` hanya menyimpan referensi UUID untuk dua standar (temperate & tropis/subtropis).
5. **Unique constraint:** Hindari duplikasi data untuk kombinasi desa-batch-waktu.
6. **Tipe data optimal:** VARCHAR dengan panjang terbatas, NUMERIC dengan precision sesuai kebutuhan.
7. **Simplifikasi spasial:** Geometri desa disimpan sebagai GeoJSON statis di frontend, sehingga Supabase tidak perlu PostGIS untuk MVP.

---

## 9. API & Query Layer (Supabase Client)

### Query Functions (`src/data/supabaseQueries.ts`)

#### 1. Batch Queries
- **`getLatestBatch()`:**
	- Query: `SELECT id, produced_at, is_latest, forecast_start, forecast_end FROM forecast_batches WHERE is_latest = TRUE LIMIT 1`
	- Return: `ForecastBatch | null`
	- Digunakan saat initial load untuk mendapatkan batch aktif.

#### 2. Village & Destination Queries
- **`getVillages()`:**
	- Query: `SELECT id, village_name, kdepum_code FROM villages ORDER BY village_name ASC`
	- Return: `Village[]`
	- Digunakan untuk mendapatkan daftar desa.

- **`getDestinations()`:**
	- Query: `SELECT id, village_id, destination_name FROM destinations ORDER BY destination_name ASC`
	- Return: `Destination[]`
	- Digunakan untuk mendapatkan daftar destinasi.

- **`getVillagesWithDestinations()`:**
	- Query dengan join: `SELECT villages.*, destinations.* FROM villages LEFT JOIN destinations ON villages.id = destinations.village_id`
	- Return: `VillageWithDestinations[]` (setiap village memiliki array `destinations`)
	- Digunakan untuk map dan popup (menampilkan semua destinasi per desa).

- **`getDestinationsWithVillage()`:**
	- Query dengan join: `SELECT destinations.*, villages.village_name, villages.kdepum_code FROM destinations JOIN villages ON destinations.village_id = villages.id`
	- Return: `Array<Destination & { village_name: string; kdepum_code: string }>`
	- Digunakan untuk sidebar (flat list 49 destinasi).

#### 3. Forecast Queries
- **`getAllForecastsForBatch(batchId)`:** ⭐ **Query Utama**
	- Query: `SELECT * FROM weather_forecasts WHERE batch_id = :batchId ORDER BY forecast_time ASC`
	- Return: `WeatherForecast[]`
	- **Strategi:** Full fetch sekali untuk semua forecast batch, kemudian di-cache di memory.
	- Cache structure: `Map<forecast_time, Map<village_id, WeatherForecast>>`
	- Digunakan untuk:
		- Build `times` array untuk slider.
		- Build `choropleth` untuk peta.
		- Popup detail (tanpa query ulang).
		- Sidebar PET values (tanpa query ulang).

- **`getForecastTimes(batchId)`:** (Opsional, tidak digunakan saat ini)
	- Query: `SELECT DISTINCT forecast_time FROM weather_forecasts WHERE batch_id = :batchId ORDER BY forecast_time ASC`
	- Return: `string[]`
	- Digunakan untuk mendapatkan daftar waktu unik (saat ini diambil dari hasil `getAllForecastsForBatch`).

#### 4. Push Notification Queries
- **`savePushSubscription(endpoint, p256dh, auth)`:**
	- Query: `UPSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent, is_active) VALUES (...) ON CONFLICT (endpoint) DO UPDATE ...`
	- Return: `PushSubscription | null`
	- Digunakan saat user mengaktifkan notifikasi.

- **`removePushSubscription(endpoint)`:**
	- Query: `UPDATE push_subscriptions SET is_active = FALSE WHERE endpoint = :endpoint`
	- Return: `boolean`
	- Digunakan saat user mematikan notifikasi.

- **`getActivePushSubscriptions()`:**
	- Query: `SELECT * FROM push_subscriptions WHERE is_active = TRUE`
	- Return: `PushSubscription[]`
	- Digunakan oleh Edge Function untuk mengirim notifikasi.

### Realtime Subscriptions

#### `useBatchMonitor` Hook (`src/hooks/useBatchMonitor.ts`)
- Subscribe ke Supabase Realtime untuk `forecast_batches` table.
- Filter: `is_latest = TRUE`, Event: `INSERT` atau `UPDATE`.
- Callback: `handleNewBatch(batch)` untuk reload data saat batch baru terdeteksi.
- Fallback: Polling setiap 5 detik jika Realtime tidak tersedia.

### Edge Functions

#### `send-push-notification` (Supabase Edge Function)
- **Trigger:** Database webhook pada `forecast_batches` table (INSERT/UPDATE dengan `is_latest = TRUE`).
- **Function:**
	1. Parse webhook payload.
	2. Fetch semua active subscriptions dari `push_subscriptions`.
	3. Kirim push notification ke semua subscribers menggunakan Web Push API.
	4. Update `last_notified_batch_id` dan `last_notified_at` untuk setiap subscription.
- **Secrets Required:**
	- `VAPID_PUBLIC_KEY`
	- `VAPID_PRIVATE_KEY`
	- `VAPID_SUBJECT`
	- `SUPABASE_SERVICE_ROLE_KEY`

---

## 10. Logika Sistem (Algoritma)
### A. Penentuan Warna (Standar PET – sesuai implementasi)
Sistem memiliki dua standar klasifikasi PET dengan 9 kategori, didefinisikan di frontend dan selaras dengan lookup `thermal_categories` di backend:

| Persepsi Termal | Rentang PET Iklim Sedang (°C) | Rentang PET Tropis/Subtropis (°C) | Skala Sensasi | Kode Warna |
|-----------------|-------------------------------|-----------------------------------|---------------|------------|
| Sangat Panas (Very hot) | > 41 | > 42 | +4 | `#800000` (Maroon) |
| Panas (Hot) | 35 – 41 | 38 – 42 | +3 | `#ff0000` (Red) |
| Hangat (Warm) | 29 – 35 | 34 – 38 | +2 | `#ff8c00` (Dark Orange) |
| Agak Hangat (Slightly warm) | 23 – 29 | 30 – 34 | +1 | `#f1c40f` (Yellow) |
| Nyaman (Neutral) | 18 – 23 | 26 – 30 | 0 | `#2ecc71` (Green) |
| Agak Dingin (Slightly cool) | 13 – 18 | 22 – 26 | −1 | `#00d2d3` (Cyan) |
| Dingin (Cool) | 8 – 13 | 18 – 22 | −2 | `#00a8ff` (Light Blue) |
| Sangat Dingin (Cold) | 4 – 8 | 14 – 18 | −3 | `#3498db` (Blue) |
| Sangat Dingin Sekali (Very cold) | < 4 | < 14 | −4 | `#000080` (Navy) |

**Catatan Penting:**
- Database menyimpan referensi kategori termal sebagai UUID:
	- `temperate_thermal_category` untuk standar iklim sedang.
	- `sub_tropic_thermal_category` untuk standar tropis/subtropis.
- Frontend menyimpan definisi rentang PET (min–max) per kategori dalam konstanta `PET_RANGES` dan **secara eksplisit menghitung kategori** di sisi klien berdasarkan:
	- nilai `pet_value` (°C),
	- standar aktif (temperate vs tropis),
	- dan tabel rentang tersebut.
- Ketika selector standar (Temperate ↔ Tropis) berubah:
	- layer peta dan legenda di-render ulang dengan menghitung ulang kategori dari `pet_value`,
	- sehingga warna dan label selalu konsisten dengan standar aktif tanpa perlu query tambahan ke backend.

Pseudocode pemilihan warna:
```ts
const COLOR_MAP = {
	'very_hot': '#800000',
	'hot': '#ff0000',
	'warm': '#ff8c00',
	'slight_warm': '#f1c40f',
	'neutral': '#2ecc71',
	'slight_cool': '#00d2d3',
	'cool': '#00a8ff',
	'cold': '#3498db',
	'very_cold': '#000080'
};

function getColorByCategory(category: string): string {
	return COLOR_MAP[category] || '#cccccc'; // fallback grey
}
```

### B. Filter Batch Terbaru
```sql
SELECT *
FROM weather_forecasts
WHERE batch_id = (
	SELECT id FROM forecast_batches WHERE is_latest = TRUE
);
```

### C. Sinkronisasi Slider Waktu
- Setiap langkah slider merepresentasikan satu `forecast_time`.
- Data untuk semua `forecast_time` telah diambil sekali di awal dan disimpan di cache in-memory (`forecastsByTime`).
- Saat nilai slider berubah, layer Leaflet memanggil `setStyle()` untuk mewarnai ulang berdasarkan kategori termal yang dihitung dari cache.

Pseudocode (mendekati implementasi di React):
```ts
function onTimeChange(selectedTime: string) {
	// Ambil data dari cache in-memory (Map<time, Map<villageId, forecast>>)
	const data = forecastsByTime.get(selectedTime);
	
	// Update style poligon peta
	villageLayer.setStyle((feature) => {
		const villageId = getVillageIdFromFeature(feature); // via mapping KDEPUM -> id desa
		const forecast = data?.get(villageId);
		
		if (!forecast) {
			return { fillColor: '#cccccc', weight: 1, color: '#fff', fillOpacity: 0.5 };
		}
		
		// Hitung kategori berdasarkan nilai PET dan standar aktif
		const category = getCategoryFromPET(forecast.pet_value, currentStandard);
		
		return {
			fillColor: getColorByCategory(category),
			weight: 1,
			color: '#fff',
			fillOpacity: 0.8,
		};
	});
	
	// Update legend jika standar berubah
	updateLegend(currentStandard);
}
```

### D. Interaksi Daftar Destinasi
Ketika pengguna mengklik item dari daftar destinasi di sidebar kiri:

Pseudocode:
```ts
function onDestinationClick(villageId: string, villageName: string) {
	// 1. Pan peta ke lokasi desa
	const villageFeature = findFeatureById(villageId);
	if (villageFeature) {
		map.fitBounds(villageFeature.getBounds(), { padding: [50, 50] });
	}
	
	// 2. Tampilkan pop-up yang sama dengan klik poligon
	showWeatherPopup(villageId, currentForecastTime);
	
	// 3. Highlight poligon
	highlightVillage(villageId);
}
```

---

## 11. Non-Functional Requirements

### Responsivitas (Desktop & Mobile)
- **Desktop (≥ 1024px):** Peta full-bleed; drawer kiri dan panel kanan melayang kompak; slider waktu menempel di bawah, lebar cukup tanpa menutupi peta.
- **Tablet (768px - 1023px):** Drawer dan panel jadi overlay tipis; peta tetap dominan; pop-up medium (350px).
- **Mobile (< 768px):** Drawer sebagai bottom/side sheet tipis; slider waktu fixed bottom dengan tinggi minimal; pop-up full-width atau bottom sheet; tap target ≥ 44x44px.

### Performa
- **Initial Load:** ≤ 3 detik pada 4G (termasuk load peta, geometri, dan batch terbaru).
- **Time Slider Interaction:** ≤ 200ms untuk re-render choropleth.
- **GeoJSON Optimization:** Gunakan TopoJSON atau simplified geometries untuk mengurangi ukuran file.
- **Caching Strategy:**
	- Cache geometri desa di localStorage/sessionStorage.
	- Cache weather data per forecast_time menggunakan Map/Object di memory.
	- Service Worker untuk offline basemap tiles (opsional).
- **Lazy Loading:** Load data slider on-demand per waktu yang dipilih.
- **UI Lightness:** Semua kontrol melayang ringan (shadow rendah, warna netral) untuk meminimalkan beban render dan tidak mengganggu peta.

### Reliabilitas
- **Error Handling:**
	- Fallback ke batch sebelumnya jika `is_latest` tidak ditemukan.
	- Tampilkan pesan user-friendly saat network error.
	- Retry logic untuk failed requests (max 3x dengan exponential backoff).
- **Data Validation:** Validasi respon API sebelum render.

### Offline Capability
- Cache GeoJSON desa (static data) untuk offline viewing.
- Tampilkan last-loaded weather data jika offline.

### Aksesibilitas (WCAG 2.1 Level AA)
- **Color Contrast:** Ratio ≥ 4.5:1 untuk teks pada background warna kategori.
- **Keyboard Navigation:** Semua kontrol dapat diakses via keyboard (Tab, Enter, Arrow keys).
- **Screen Reader:** Aria labels untuk slider, buttons, dan map features.
- **Focus Indicators:** Visible focus ring pada semua interactive elements.
- **Reduced Motion:** Animasi hover/focus ringan dengan opsi reduce motion mengikuti preferensi OS.

---

## 12. Keamanan & Privasi
- Gunakan kunci anon Supabase hanya untuk operasi read publik.
- Batasi tabel yang diekspos via policy RLS read-only.
- Hindari menyimpan PII; data hanya bersifat agregat cuaca dan geospasial.

---

## 13. Deployment & Konfigurasi

### Environment Variables (Vite/React)
File: `.env.local` atau environment variables di platform hosting.

- **`VITE_SUPABASE_URL`:** URL Supabase project (contoh: `https://xxxxx.supabase.co`)
- **`VITE_SUPABASE_ANON_KEY`:** Supabase anon key (public, untuk client-side queries)

### Supabase Edge Function Secrets
Set via Supabase CLI atau Dashboard:
- **`VAPID_PUBLIC_KEY`:** Public key untuk Web Push API
- **`VAPID_PRIVATE_KEY`:** Private key untuk Web Push API
- **`VAPID_SUBJECT`:** Subject untuk VAPID (format: `mailto:your-email@example.com`)
- **`SUPABASE_SERVICE_ROLE_KEY`:** Service role key untuk akses database dari Edge Function

### Build & Hosting
- **Build Command:** `bun run build` atau `npm run build` (Vite build)
- **Output:** Static files di folder `dist/`
- **Hosting:** 
	- Vercel/Netlify (recommended untuk PWA)
	- Atau host internal (pastikan HTTPS untuk PWA dan push notifications)
- **PWA Requirements:**
	- HTTPS required
	- Service worker harus di-root (`/sw.js`)
	- Manifest file harus accessible

### Database Setup
1. Run `db/schema.sql` di Supabase SQL Editor untuk create tables.
2. Insert data villages dan destinations (49 destinasi).
3. Setup database webhook untuk trigger Edge Function:
	- Table: `forecast_batches`
	- Events: `INSERT`, `UPDATE`
	- Type: `Supabase Edge Function`
	- Function: `send-push-notification`

### Pengaturan Peta
- **Tile Layer:** OpenStreetMap (OSM) default
- **Attribution:** Required untuk OSM
- **Rate Limiting:** Pertimbangkan menggunakan tile server alternatif jika traffic tinggi

---

## 14. Pengujian & Acceptance Criteria

### Functional Tests
- **FR-01:** Landing langsung menampilkan peta full-bleed dengan 10 poligon desa wisata (geometri contoh dari destinasi_wisata_bali.geojson) di atas basemap OSM; tidak ada window atau panel penuh yang menutupi peta.
- **FR-02:** Slider waktu (step 3 jam) mengubah warna choropleth sesuai kategori termal untuk waktu terpilih.
- **FR-03:** Selector standar PET (Temperate/Tropis) mengubah legenda dengan rentang yang berbeda dan mewarnai ulang layer secara responsif sesuai standar aktif.
- **FR-04:** Klik poligon peta menampilkan pop-up dengan:
	- Nama desa, waktu forecast
	- Nilai PET, kategori termal, skala sensasi
	- Parameter cuaca lengkap (suhu, kelembapan, angin, kondisi, visibility)
	- Saran visitor notes sesuai kategori
- **FR-05:** Navigasi panah kiri/kanan di pop-up berpindah ke jam sebelumnya/berikutnya tanpa menutup pop-up.
- **FR-06:** Tombol toggle sidebar kiri membuka/tutup daftar destinasi wisata dengan lebar maksimal 280px (compact, semi-transparan).
- **FR-07:** Klik item daftar destinasi:
	- Pan peta ke lokasi desa
	- Tampilkan pop-up yang sama seperti klik poligon
	- Highlight poligon desa tersebut
- **FR-08:** Data yang ditampilkan selalu dari batch dengan `is_latest = TRUE`.
- **FR-09:** Warna choropleth sesuai mapping kategori termal:
	- `very_hot`: Maroon (#800000)
	- `hot`: Red (#ff0000)
	- `warm`: Dark Orange (#ff8c00)
	- `slight_warm`: Yellow (#f1c40f)
	- `neutral`: Green (#2ecc71)
	- `slight_cool`: Cyan (#00d2d3)
	- `cool`: Light Blue (#00a8ff)
	- `cold`: Blue (#3498db)
	- `very_cold`: Navy (#000080)

### Performance Tests
- **PF-01:** Initial page load ≤ 3 detik pada jaringan 4G.
- **PF-02:** Time slider interaction re-render ≤ 200 ms.
- **PF-03:** Pop-up open/close ≤ 100 ms.
- **PF-04:** Destination list click → pan & popup ≤ 500 ms.

### Responsiveness Tests
- **RS-01:** Desktop (≥1024px): Peta full-bleed; panel kiri/kanan kompak melayang; kontrol aksesibel.
- **RS-02:** Tablet (768-1023px): Drawer/overlay tipis; peta tetap dominan; kontrol tetap dapat diakses.
- **RS-03:** Mobile (<768px): Drawer sebagai sheet; slider fixed bottom kompak; pop-up mobile-friendly; map gestures berfungsi normal.

### Stability Tests
- **ST-01:** Fallback ke batch sebelumnya jika `is_latest` tidak ditemukan.
- **ST-02:** Error message user-friendly saat network failure.
- **ST-03:** Aplikasi tidak crash saat data tidak tersedia untuk desa tertentu.

### Manual Test Checklist
1. ✅ Muat aplikasi; verifikasi "Waktu Produksi Data" tampil dengan format benar.
2. ✅ Geser slider waktu beberapa langkah; pastikan warna peta berubah sesuai.
3. ✅ Toggle standar PET (Temperate ↔ Tropis); cek perubahan rentang di legenda.
4. ✅ Klik poligon desa di peta; verifikasi pop-up lengkap dan akurat.
5. ✅ Gunakan navigasi panah di pop-up; pastikan berpindah jam dengan benar.
6. ✅ Buka sidebar kiri; klik salah satu destinasi; pastikan peta pan dan pop-up muncul.
7. ✅ Resize browser ke mobile width (<768px); verifikasi responsivitas.
8. ✅ Test offline: reload dengan cache; pastikan geometri desa tetap tampil.

---

## 15. Risiko & Mitigasi
- **Keterbatasan jaringan:** Gunakan caching dan ukuran file geometri minimal.
- **Ketergantungan batch:** Tambahkan fallback ke batch sebelumnya bila `is_latest` belum terset.
- **Perbedaan standar PET:** Dokumentasikan sumber standar; izinkan penyesuaian konfigurasi.

---

## 16. Timeline & Deliverables
- **MVP (1–2 minggu):**
	- Peta choropleth, slider waktu, selector standar, pop-up dasar.
- **Stabilisasi (1 minggu):**
	- Optimasi performa, caching, aksesibilitas, acceptance tests.
- **Dokumentasi (ongoing):**
	- README, panduan konfigurasi, catatan standar PET.

---

## Lampiran
- Referensi standar PET (Temperate & Tropis) — ditentukan sesuai literatur yang digunakan dalam penelitian.