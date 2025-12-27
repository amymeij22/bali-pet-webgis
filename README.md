# Thermal Comfort Forecast - WebGIS (Bali, UTC+8)

Prediksi indeks kenyamanan termal berbasis Physiological Equivalent Temperature (PET) untuk destinasi wisata Bali. Aplikasi menampilkan prakiraan 3 hari ke depan dengan interval 3 jam, menyesuaikan seluruh tampilan waktu ke zona WITA (UTC+8).

**Status**: Development  
**Version**: 1.0  
**Last Updated**: December 2025

---

## Ringkasan Fitur
- Peta choropleth Leaflet dengan warna PET per desa wisata dan hover highlight.
- Slider waktu 3-harian (24 slot) dengan autoplay, navigasi prev/next, dan penanda hari.
- Label waktu produksi batch, kini ditampilkan dalam WITA (UTC+8); semua waktu Supabase dikonversi dari UTC ke WITA melalui helper `toWitaDate`.
- Toggle standar PET (Temperate vs Tropis/Subtropis) yang langsung mengubah legenda, peta, dan popup.
- Popup cuaca lengkap (PET, suhu, kelembapan, angin, visibilitas, kondisi) dengan navigasi jam di dalam popup.
- Sidebar destinasi interaktif; klik tujuan mem-pause autoplay dan membuka popup.
- PET selector tetap dapat dipakai meski autoplay berjalan; kontrol waktu berhenti otomatis saat popup dibuka.

## Arsitektur & Komponen
- Halaman utama: `pages/Index.tsx` mengelola state global (times, selectedTime, isPlaying, producedAt, petStandard, forecastsByTime, choropleth, popupForecast, villages) dan orchestrasi event.
- Peta: `components/map/LeafletMap.tsx` memetakan GeoJSON destinasi dan mewarnai berdasarkan PET; klik polygon memicu popup dan mem-pause autoplay.
- Kontrol waktu: `components/controls/TimeSlider.tsx` untuk display tanggal/jam WITA, autoplay, prev/next, grouping hari, label Waktu Produksi.
- Legenda & standar: `components/controls/PETLegend.tsx` untuk selector standar PET (temperate/tropis) dan legend warna.
- Popup: `components/popup/WeatherPopup.tsx` menampilkan detail cuaca per desa/waktu dan memungkinkan navigasi jam.
- Sidebar: `components/sidebar/DestinationSidebar.tsx` daftar destinasi yang men-trigger highlight/popup.
- Utilitas waktu: `lib/timezone.ts` berisi `toWitaDate` untuk konversi UTC → WITA di seluruh tampilan.

## Alur Data (Supabase → UI)
1. Ambil batch terbaru (`getLatestBatch`), lalu unduh semua forecast untuk batch itu sekali (`getAllForecastsForBatch`).
2. Bentuk daftar waktu terurut (set → sort) dan set `selectedTime` awal.
3. Bentuk cache `forecastsByTime`: Map<waktu, Map<desa, forecast>> untuk lookup instan tanpa request ulang.
4. Saat waktu berubah: turunkan `choropleth` (Map<desa, { pet_value }>) dan peta me-render ulang warna.
5. Klik destinasi (peta/sidebar): set `activeVillage`, buka popup, auto-pause autoplay, dan tampilkan detail dari cache.
6. Navigasi jam di popup memanggil `onTimeChange`; slider dan peta tetap sinkron tanpa query baru.

## Penanganan Waktu (WITA / UTC+8)
- Asumsi semua timestamp Supabase disimpan sebagai UTC.
- `toWitaDate` menambahkan offset +8 jam dikoreksi `getTimezoneOffset` sehingga tampilan konsisten di zona apa pun.
- Dipakai di: TimeSlider (tanggal, jam, grouping hari, label "Hari Ini", label "Waktu Produksi"), WeatherPopup (tanggal & jam), dan setiap format waktu lainnya yang berasal dari Supabase.

## Data & Penanganan Waktu
- Backend: Supabase dengan tabel `forecast_batches` (produced_at, forecast_start/end), `weather_forecasts` (forecast_time per desa), dan `villages`.
- Semua timestamp yang datang dalam UTC dikonversi ke WITA (UTC+8) untuk display: slider, grouping hari, label "Hari Ini", popup, dan "Waktu Produksi" memakai `toWitaDate` di `src/lib/timezone.ts`.
- PET kategori dihitung client-side berdasarkan rentang standar yang dipilih (temperate atau tropis/subtropis).

## Stack Teknis
- React 18 + TypeScript, Vite 7, Tailwind CSS, shadcn/ui (Radix), Framer Motion.
- Leaflet untuk peta; date-fns untuk format tanggal; TanStack Query siap dipakai bila perlu.
- Package manager: Bun (opsional pakai npm).

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

## Struktur Singkat
```
src/
	pages/Index.tsx              # Halaman utama
	components/
		map/LeafletMap.tsx         # Choropleth PET
		controls/TimeSlider.tsx    # Slider waktu + autoplay + WITA display
		controls/PETLegend.tsx     # Legenda + selector standar
		popup/WeatherPopup.tsx     # Detail cuaca per desa/waktu
	data/                        # Supabase queries & dummy data
	lib/timezone.ts              # Konversi UTC -> WITA (UTC+8)
```

## Perilaku Penting
- Autoplay berhenti ketika popup dibuka; pemilihan standar PET tidak terganggu oleh autoplay.
	- PET selector tetap responsif saat autoplay.
	- Semua waktu yang berasal dari Supabase dianggap UTC dan ditampilkan sebagai WITA (UTC+8) di seluruh UI.

## Manual Check Singkat
- Peta dan GeoJSON tampil dengan warna PET.
- Slider mengubah peta, autoplay berputar dan bisa dijeda.
- Label "Waktu Produksi" dan jam di slider/popup menampilkan waktu WITA (UTC+8).
- Toggle standar PET mengubah legenda, peta, dan popup secara instan.
- Klik desa menampilkan popup, autoplay pause, dan navigasi jam di popup berfungsi.

## Testing & Deployment
- Lint: `bun run lint` (atau `npm run lint`).
- Build statis: `bun run build` (atau `npm run build`); preview lokal: `bun run preview`.
- Hosting: Vercel/Netlify; pastikan env Supabase diisi di platform deploy.

## Deployment
- Siap dibuild statis via `bun run build` (atau `npm run build`) untuk Vercel/Netlify. Atur env Supabase di platform tujuan.

## Lisensi
Bagian dari Tugas Akhir (Skripsi) STMKG
