# PRD: WebGIS Thermal Comfort Forecast

**Nama Proyek:** Prediksi Indeks Kenyamanan Termal Destinasi Wisata Provinsi Bali  
**Versi:** 1.0  
**Status:** Draft  
**Tech Stack:** Next.js 15.x (App Router, Frontend), Supabase (Database/PostGIS), Leaflet.js (Map Library)

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
Platform WebGIS interaktif dengan landing yang langsung menampilkan peta full-bleed (tanpa jendela/wrapper tambahan) untuk visualisasi prediksi kenyamanan termal berdasarkan indeks Physiological Equivalent Temperature (PET) di 10 destinasi wisata di Bali. Prediksi disajikan per 3 jam untuk 3 hari ke depan, selalu menampilkan batch produksi terbaru (produce time). Peta menggunakan choropleth pada poligon desa wisata (contoh geometri awal: destinasi_wisata_bali.geojson), dilengkapi kontrol waktu, klasifikasi standar PET (Temperate vs (Sub) Tropis) yang mengubah warna secara responsif, serta pop-up interaktif dengan parameter cuaca dan saran bagi wisatawan.

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
	- Visualisasi choropleth PET untuk desa wisata di Bali (seed geometri contoh: file destinasi_wisata_bali.geojson).
	- Kontrol waktu per 3 jam untuk 3 hari ke depan.
	- Pemilihan standar PET (Temperate vs (Sub) Tropis) yang mengubah legenda dan pewarnaan.
	- Pop-up dengan detail cuaca dan saran kesehatan.
	- Pengambilan data dari Supabase dengan filter batch terbaru.
	- Responsivitas dan caching data statis.
- **Di luar lingkup:**
	- Pengeditan data geospasial/cuplikan peta oleh pengguna.
	- Auth pengguna selain kunci anon Supabase untuk pembacaan publik.
	- Peringatan notifikasi push real-time (bukan target MVP).

---

## 4. Persona & Use Case
- **Wisatawan:** Mengecek kenyamanan termal lokasi wisata untuk menentukan waktu berkunjung yang optimal.
- **Pelaku usaha lokal:** Menyesuaikan jadwal layanan/outdoor activity dengan kondisi kenyamanan termal.
- **Pengelola destinasi:** Memantau tren kenyamanan dan menyusun informasi bagi pengunjung.

Use Case utama:
- Melihat peta choropleth PET terkini per desa.
- Menggeser slider waktu untuk melihat prediksi per 3 jam.
- Mengganti standar klasifikasi PET (Temperate vs (Sub) Tropis).
- Mengklik poligon untuk melihat detail cuaca dan saran.

---

## 5. Fitur Utama & Alur Kerja
- **Visualisasi Geospasial:** Poligon desa wisata diwarnai secara dinamis (choropleth) berdasarkan PET.
- **Manajemen Waktu (Forecast):** Slider waktu per 3 jam untuk hingga 3 hari ke depan.
- **Klasifikasi Dinamis:** Selector standar PET (Temperate vs (Sub) Tropis) yang mengubah legenda, label, dan pewarnaan secara responsif pada layer peta.
- **Pop-up Interaktif:** Detail cuaca + saran kesehatan, dengan navigasi jam sebelumnya/berikutnya.
- **Data Management:** Menampilkan data dari batch produksi terbaru menggunakan `is_latest = TRUE`.
- **Full-Bleed Map:** Peta langsung memenuhi viewport; semua kontrol berupa elemen melayang minimalis (sidebar destinasi, selector standar, legenda, slider waktu) yang non-intrusif.

### Alur Sistem (End-to-End)
1. **Load Aplikasi:**
	 - Inisialisasi Next.js, Leaflet map (dengan OSM TileLayer), dan Supabase client.
	 - Set initial map view ke center Bali dengan zoom level sesuai.
2. **Ambil Batch Terbaru:**
	 - Query `forecast_batches` untuk mendapatkan `id` dengan `is_latest = TRUE`, `produced_at`, dan rentang forecast.
3. **Ambil Geometri Desa:**
	 - Muat GeoJSON poligon desa (`villages`) dari cache lokal atau Supabase.
	 - Render sebagai GeoJSON layer di Leaflet.
4. **Ambil Daftar Destinasi:**
	 - Query `villages` untuk mendapatkan `id` dan `village_name`.
	 - Populate sidebar kiri dengan daftar destinasi wisata.
5. **Ambil Daftar Waktu Forecast:**
	 - Query `weather_forecasts` untuk batch terbaru, kumpulkan unik `forecast_time` terurut.
	 - Bangun opsi slider dengan step 3 jam.
6. **Render Choropleth Awal:**
	 - Untuk `forecast_time` awal (default: waktu terawal atau saat ini dibulatkan ke 3 jam).
	 - Query data `thermal_category` per desa untuk waktu tersebut.
	 - Set style layer dengan warna sesuai kategori.
7. **Interaksi Pengguna:**
	 - **Slider waktu:** Re-fetch data untuk waktu terpilih, panggil `setStyle()` untuk update warna.
	 - **Selector standar PET:** Toggle antara Temperate/Tropis, re-render legenda (rentang PET berubah, warna tetap sama).
	 - **Klik poligon:** Tampilkan pop-up dengan detail cuaca lengkap + navigasi jam.
	 - **Klik item daftar destinasi:** Pan peta ke desa, tampilkan pop-up yang sama.
8. **Caching & Offline:**
	 - Cache GeoJSON desa di localStorage.
	 - Cache weather data per `forecast_time` di memory (Map/Object).
9. **Status & Metadata:**
	 - Tampilkan "Waktu Produksi Data: [DD/MM/YYYY HH:mm] WITA" dari `produced_at` batch terbaru di footer control panel.

---

## 6. Struktur UI & Layout
- **Canvas Peta Utama:** Peta memenuhi seluruh viewport (full-bleed) dengan OSM TileLayer; tanpa window/header terpisah. Logo BMKG/STMKG sebagai badge kecil melayang di pojok.
- **Sidebar Destinasi (Kiri):** Drawer tipis yang bisa dibuka/tutup; daftar 10 desa wisata scrollable. Klik item memicu pan-to + pop-up. Lebar maksimal 280px, background semi-transparan.
- **Panel Kontrol (Kanan):** Selector standar PET (Temperate vs Tropis) + legenda ringkas pada kartu melayang kecil. Perubahan selector langsung mengubah warna layer dan legenda.
- **Control Bar Waktu (Bawah):** Slider waktu step 3 jam dengan label waktu ringkas; bar melayang menempel di bawah dengan padding kecil dan radius halus.
- **Interaksi Peta:** Hover highlight, klik membuka pop-up; stroke tipis putih, fill warna mengikuti kategori aktif. Semua kontrol berukuran compact, warna netral, bayangan ringan agar tidak menutupi peta.

---

## 7. Spesifikasi Pop-up Interaktif
- **Navigasi:** Panah kiri/kanan untuk jam sebelumnya/berikutnya tanpa menutup pop-up.
- **Elemen & Konten:**
	- **Header:**
		- Nama desa wisata (bold, 18px).
		- Waktu forecast (format: "DD MMM YYYY, HH:mm WITA").
	- **PET Value (main display):**
		- Nilai PET (°C) dengan font besar (36px).
		- Background color sesuai kategori termal.
		- Label kategori (misal: "Nyaman", "Panas") dengan skala sensasi (misal: "0", "+3").
	- **Parameter Cuaca:**
		- Suhu Udara (°C)
		- Kelembapan (%)
		- Kecepatan Angin (km/jam)
		- Arah Angin (N, NE, E, dst)
		- Kondisi Cuaca (Cerah, Berawan, Hujan, dst)
		- Jarak Pandang (Baik, Sedang, Buruk)
	- **Visitor Notes (Saran):**
		- Saran otomatis berdasarkan kategori termal:
			- `very_hot` / `hot`: "Gunakan sunscreen SPF 30+, topi lebar, dan hidrasi setiap 15-20 menit. Hindari aktivitas berat siang hari."
			- `warm` / `slight_warm`: "Gunakan pakaian ringan dan breathable. Bawa air minum yang cukup."
			- `neutral`: "Kondisi nyaman untuk aktivitas outdoor. Tetap gunakan sunscreen."
			- `slight_cool` / `cool`: "Bawa jaket ringan. Kondisi ideal untuk trekking."
			- `cold` / `very_cold`: "Gunakan jaket tebal dan layering. Lindungi ekstremitas dari udara dingin."

---

## 8. Arsitektur Data (Supabase/PostgreSQL)

### Tabel `villages` (Master Data Desa Wisata)
| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | ID unik desa |
| `village_name` | VARCHAR(100) | NOT NULL, UNIQUE | Nama desa wisata |
| `geom` | GEOMETRY(Polygon, 4326) | NOT NULL | Poligon batas desa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record terakhir diupdate |

**Indeks:**
- `idx_villages_geom` GIST (`geom`) — untuk spatial query cepat.

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
| `village_id` | UUID | FK → `villages.id`, NOT NULL | Referensi desa |
| `batch_id` | UUID | FK → `forecast_batches.id`, NOT NULL | Referensi batch |
| `forecast_time` | TIMESTAMPTZ | NOT NULL | Waktu prediksi (per 3 jam) |
| `temperature` | NUMERIC(4,1) | NOT NULL | Suhu udara (°C) |
| `humidity` | NUMERIC(4,1) | NOT NULL, CHECK (0-100) | Kelembapan relatif (%) |
| `wind_speed` | NUMERIC(5,2) | NOT NULL | Kecepatan angin (km/jam) |
| `wind_direction` | VARCHAR(10) | NOT NULL | Arah angin (N, NE, E, SE, dst) |
| `weather_condition` | VARCHAR(100) | NOT NULL | Deskripsi cuaca (Cerah, Hujan, dst) |
| `visibility` | VARCHAR(50) | NOT NULL | Jarak pandang (Baik, Sedang, Buruk) |
| `pet_value` | NUMERIC(5,2) | NOT NULL | Nilai PET (°C) |
| `thermal_category` | VARCHAR(20) | NOT NULL | Kategori termal (`neutral`, `warm`, dst) |
| `thermal_sensation_scale` | SMALLINT | NOT NULL, CHECK (-4 to +4) | Skala sensasi termal |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record dibuat |

**Indeks:**
- `idx_forecasts_batch_time` (`batch_id`, `forecast_time`) — untuk query slider waktu.
- `idx_forecasts_village_batch` (`village_id`, `batch_id`) — untuk query per desa.
- `UNIQUE CONSTRAINT` (`village_id`, `batch_id`, `forecast_time`) — hindari duplikasi.

**Foreign Key Constraints:**
- `village_id` ON DELETE CASCADE
- `batch_id` ON DELETE CASCADE

---

### Improvements dari Desain Sebelumnya:
1. **Penamaan konsisten:** `weather_forecasts` lebih deskriptif dari `weather_data`.
2. **Kolom timestamp:** Tambah `created_at` dan `updated_at` untuk audit trail.
3. **Constraints:** CHECK constraints untuk validasi data (humidity 0-100, scale -4 to +4).
4. **Normalisasi:** Kolom `thermal_category` dan `thermal_sensation_scale` dipisah untuk fleksibilitas.
5. **Unique constraint:** Hindari duplikasi data untuk kombinasi desa-batch-waktu.
6. **Tipe data optimal:** VARCHAR dengan panjang terbatas, NUMERIC dengan precision sesuai kebutuhan.

---

## 9. API & Query Layer
Contoh query Supabase (SQL kira-kira setara dengan filter JS Supabase client):

- **Ambil batch terbaru:**
```sql
SELECT id, produced_at, forecast_start, forecast_end
FROM forecast_batches
WHERE is_latest = TRUE
LIMIT 1;
```

- **Ambil daftar waktu untuk slider:**
```sql
SELECT DISTINCT forecast_time
FROM weather_forecasts
WHERE batch_id = :latest_batch_id
ORDER BY forecast_time ASC;
```

- **Ambil data per desa untuk waktu tertentu (untuk choropleth):**
```sql
SELECT 
	village_id,
	pet_value,
	thermal_category,
	thermal_sensation_scale
FROM weather_forecasts
WHERE batch_id = :latest_batch_id
	AND forecast_time = :selected_time;
```

- **Ambil detail cuaca untuk pop-up (satu desa, satu waktu):**
```sql
SELECT 
	v.village_name,
	wf.forecast_time,
	wf.temperature,
	wf.humidity,
	wf.wind_speed,
	wf.wind_direction,
	wf.weather_condition,
	wf.visibility,
	wf.pet_value,
	wf.thermal_category,
	wf.thermal_sensation_scale
FROM weather_forecasts wf
JOIN villages v ON wf.village_id = v.id
WHERE wf.village_id = :village_id
	AND wf.batch_id = :latest_batch_id
	AND wf.forecast_time = :selected_time;
```

- **Ambil geometri desa dengan GeoJSON:**
```sql
SELECT 
	id,
	village_name,
	ST_AsGeoJSON(geom)::json AS geojson
FROM villages
ORDER BY village_name;
```

- **Ambil daftar destinasi wisata untuk sidebar kiri:**
```sql
SELECT id, village_name
FROM villages
ORDER BY village_name ASC;
```

---

## 10. Logika Sistem (Algoritma)
### A. Penentuan Warna (Standar PET)
Sistem memiliki dua standar klasifikasi PET dengan 9 kategori:

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
- Database menyimpan kolom `thermal_sensation_scale` (INT) untuk skala sensasi termal.
- Database menyimpan kolom `thermal_category` (TEXT) untuk kategori (misal: `neutral`, `warm`, `hot`).
- Frontend **tidak perlu** menghitung kategori; cukup mapping `thermal_category` ke warna.
- Ketika selector standar (Temperate ↔ Tropis) berubah, layer peta dan legenda harus di-render ulang agar warna dan rentang label mengikuti standar aktif.

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
- Saat nilai slider berubah, layer Leaflet memanggil `setStyle()` untuk mewarnai ulang berdasarkan kategori termal.

Pseudocode:
```ts
function onTimeChange(selectedTime: string) {
	// Ambil data dari cache atau fetch dari Supabase
	const data = cache.get(selectedTime) ?? await fetchWeatherData(latestBatchId, selectedTime);
	
	// Update style poligon peta
	villageLayer.setStyle((feature) => {
		const villageId = feature.properties.id;
		const forecast = data[villageId];
		
		if (!forecast) {
			return { fillColor: '#cccccc', weight: 1, color: '#fff', fillOpacity: 0.5 };
		}
		
		return {
			fillColor: getColorByCategory(forecast.thermal_category),
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
- **Environment Variables (Next.js):**
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Build & Hosting:**
	- Build Next.js statis/hybrid; host pada platform pilihan (Vercel/Netlify/host internal).
- **Pengaturan Peta:**
	- Tile OSM standar; pertimbangkan rate-limiting dan attribution.

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