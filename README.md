# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

<<<<<<< HEAD
- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.
=======

**Use GitHub Codespaces**

>>>>>>> a00c07e (update ui)

## What technologies are used for this project?

This project is built with:

<<<<<<< HEAD
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
=======
>>>>>>> a00c07e (update ui)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
<<<<<<< HEAD
=======
# 🗺️ Thermal Comfort Forecast - WebGIS

Prediksi Indeks Kenyamanan Termal Berbasis **Physiological Equivalent Temperature (PET)** untuk 8 Destinasi Wisata Utama di Bali.

Platform WebGIS interaktif yang membantu wisatawan dan pelaku bisnis lokal merencanakan aktivitas outdoor berdasarkan kondisi kenyamanan termal dengan prakiraan 3 hari ke depan dalam interval 3 jam.

**Status**: Development  
**Version**: 1.0  
**Last Updated**: December 2025

---

## ✨ Fitur Utama

### 🗺️ Visualisasi Geospasial Choropleth
- Peta full-bleed dengan OSM basemap
- Poligon desa wisata diwarnai dinamis berdasarkan kategori PET
- 9 kategori sensasi termal dengan warna standar meteorologi
- Interactive hover dan highlighting

### ⏱️ Manajemen Waktu Forecast
- Slider waktu dengan 24 slot (3 jam interval, 3 hari)
- Autoplay dengan interval 1.5 detik
- Navigasi prev/next antar slot waktu
- Grouping per hari untuk kemudahan navigasi

### 🌡️ Standar Klasifikasi Dinamis
- Toggle antara 2 standar PET:
	- **Iklim Sedang (Temperate)**: Range 4-41°C
	- **Iklim Tropis/Subtropis**: Range 14-42°C
- Legenda responsif dengan rentang PET per kategori
- Perubahan instan pada peta dan popup saat switching standar

### 📍 Pop-up Interaktif Detail Cuaca
- Informasi lengkap per desa & waktu forecast:
	- Nilai PET besar dengan kategori sensasi
	- Parameter cuaca: Suhu, Kelembapan, Kecepatan/Arah Angin
	- Jarak pandang dan kondisi cuaca
- Navigasi jam prev/next tanpa menutup popup
- Visitor notes (saran wisatawan) otomatis berdasarkan kategori
- Animasi smooth dengan Framer Motion

### 📋 Sidebar Destinasi Wisata
- Daftar 8 destinasi wisata utama Bali
- Setiap item menampilkan forecast PET real-time
- Click → Pan peta + Highlight + Popup
- Drawer toggle yang responsive (desktop open, mobile closed)
- Scroll-able dengan glassmorphism effect

### 📊 Kontrol & Metadata
- Header responsif dengan logo BMKG, STMKG, Instrumentasi
- Timestamp produksi data (batch terbaru)
- Data source indicator card
- Accessible controls dengan Radix UI

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Frontend Framework** | React 18.3 + TypeScript 5.8 |
| **Build Tool** | Vite 7.3 |
| **CSS Framework** | Tailwind CSS 3.4 + tailwindcss-animate |
| **Component Library** | shadcn/ui (Radix UI) |
| **Map Library** | Leaflet 1.9 + OpenStreetMap |
| **Animation** | Framer Motion 12.23 |
| **Routing** | React Router v6 |
| **State Management** | React Query (TanStack) 5.83 + Local State |
| **Form & Validation** | React Hook Form 7.61 + Zod 3.25 |
| **Date Utilities** | date-fns 3.6 |
| **Icons** | Lucide React 0.462 |
| **Package Manager** | Bun |

---

## 📋 Daftar Destinasi Wisata

| No. | Destinasi | Lokasi | Tipe |
|-----|-----------|--------|------|
| 1 | Pantai Kuta | Badung | Pantai (Coastal) |
| 2 | Pantai Nusa Dua | Badung | Pantai (Coastal) |
| 3 | Pura Tanah Lot | Tabanan | Pantai (Coastal) |
| 4 | Tegallalang Rice Terrace | Gianyar | Tengah (Midland) |
| 5 | Monkey Forest Ubud | Gianyar | Tengah (Midland) |
| 6 | Danau Batur (Kintamani) | Bangli | Pegunungan (Highland) |
| 7 | Danau Beratan (Bedugul) | Tabanan | Pegunungan (Highland) |
| 8 | Air Terjun Tegenungan | Gianyar | Tengah (Midland) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (direkomendasikan menggunakan [nvm](https://github.com/nvm-sh/nvm))
- Bun package manager (atau npm/yarn sebagai alternatif)

### Installation

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd webgis

# Install dependencies
bun install
# atau dengan npm
npm install
```

### Development Server

```bash
# Start development server dengan hot reload
bun run dev
# atau
npm run dev
```

Server akan berjalan di: **http://localhost:8080**

Aplikasi akan auto-reload saat ada perubahan file.

### Build untuk Production

```bash
# Build optimized bundle
bun run build
# atau
npm run build

# Preview build lokal
bun run preview
```

---

## 📁 Struktur Proyek

```
webgis/
├── public/
│   └── data/
│       └── destinasi_wisata_bali.geojson    # GeoJSON poligon desa
├── src/
│   ├── pages/
│   │   ├── Index.tsx                         # Halaman utama (peta)
│   │   └── NotFound.tsx                      # Halaman 404
│   ├── components/
│   │   ├── map/
│   │   │   └── LeafletMap.tsx               # Peta choropleth utama
│   │   ├── controls/
│   │   │   ├── TimeSlider.tsx               # Slider waktu forecast
│   │   │   ├── PETLegend.tsx                # Legenda & selector standar
│   │   │   └── DataSourceCard.tsx           # Info source data
│   │   ├── header/
│   │   │   └── MapHeader.tsx                # Header dengan logo
│   │   ├── sidebar/
│   │   │   └── DestinationSidebar.tsx       # Daftar destinasi
│   │   ├── popup/
│   │   │   └── WeatherPopup.tsx             # Detail cuaca interaktif
│   │   └── ui/                               # shadcn/ui components
│   │       ├── button.tsx, card.tsx, select.tsx, slider.tsx
│   │       ├── dialog.tsx, drawer.tsx, tooltip.tsx, dst.
│   │       └── ... (50+ komponen)
│   ├── data/
│   │   └── dummyData.ts                      # Dummy forecast & village data
│   ├── hooks/
│   │   ├── use-mobile.tsx                    # Mobile detection hook
│   │   └── use-toast.ts                      # Toast notification hook
│   ├── lib/
│   │   └── utils.ts                          # Utility functions
│   ├── App.tsx                               # Router & Context setup
│   ├── main.tsx                              # Entry point
│   ├── App.css                               # Global styles
│   └── index.css                             # Tailwind imports
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.js
└── README.md
```

---

## 🎨 Kategori Warna PET

Sistem menggunakan 9 kategori sensasi termal dengan warna standar:

| Kategori | Range Temp. (°C) | Range Tropis (°C) | Warna | Skala |
|----------|------------------|-------------------|-------|-------|
| Sangat Panas | > 41 | > 42 | 🟫 Maroon | +4 |
| Panas | 35-41 | 38-42 | 🔴 Red | +3 |
| Hangat | 29-35 | 34-38 | 🟠 Orange | +2 |
| Agak Hangat | 23-29 | 30-34 | 🟡 Yellow | +1 |
| Nyaman | 18-23 | 26-30 | 🟢 Green | 0 |
| Agak Dingin | 13-18 | 22-26 | 🔵 Cyan | -1 |
| Dingin | 8-13 | 18-22 | 🔵 Light Blue | -2 |
| Sangat Dingin | 4-8 | 14-18 | 🔵 Blue | -3 |
| Sangat Dingin Sekali | < 4 | < 14 | 🟦 Navy | -4 |

---

## 📱 Responsive Design

### Desktop (≥ 1024px)
- Sidebar destinasi open by default
- Panel kontrol melayang kompak di sisi kanan
- Slider waktu fixed di bawah
- Peta full-bleed dengan kontrol aksesibel

### Tablet (768px - 1023px)
- Sidebar & panel sebagai overlay drawer
- Peta tetap dominan
- Kontrol responsif dengan sizing optimal

### Mobile (< 768px)
- Sidebar collapsed by default (drawer samping)
- Slider waktu fixed bottom dengan height minimal
- Pop-up full-width atau bottom sheet
- Touch-friendly tap targets (min 44x44px)

---

## 🔧 Konfigurasi

### Environment Variables
Aplikasi saat ini menggunakan dummy data lokal. Untuk integrasi dengan backend:

```env
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Development Server Port
Port default: `8080` (konfigurasi di `vite.config.ts`)

---

## 🧪 Testing & Validation

### Lint Code
```bash
bun run lint
# atau
npm run lint
```

### Manual Testing Checklist
- ✅ Peta Leaflet load dengan GeoJSON poligon
- ✅ Slider waktu mengubah warna choropleth
- ✅ Toggle standar PET (Temperate ↔ Tropis) mengubah legenda & warna
- ✅ Klik poligon → Pop-up dengan data lengkap
- ✅ Navigasi panah di popup berpindah ke jam sebelumnya/berikutnya
- ✅ Click destinasi di sidebar → Pan & highlight
- ✅ Autoplay slider (play/pause)
- ✅ Responsivitas desktop/tablet/mobile

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Build
bun run build

# Deploy build folder ke Netlify
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN bun install && bun run build
EXPOSE 8080
CMD ["bun", "run", "preview"]
```

---

## 📚 Dokumentasi Referensi

- **PRD Lengkap**: Lihat [prd.md](./prd.md) untuk spesifikasi detail
- **Leaflet Docs**: https://leafletjs.com/reference.html
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Router**: https://reactrouter.com/
- **Framer Motion**: https://www.framer.com/motion/

---

## 🤝 Kontribusi

Untuk kontribusi atau feedback:

1. Buat branch fitur baru: `git checkout -b feature/nama-fitur`
2. Commit perubahan: `git commit -m 'feat: deskripsi fitur'`
3. Push ke repository: `git push origin feature/nama-fitur`
4. Buat Pull Request untuk review

---

## 📝 Lisensi

Proyek ini adalah bagian dari **Tugas Akhir (Skripsi)** di STMKG (Sekolah Tinggi Meteorologi Klimatologi dan Geofisika).

---

## 👥 Tim & Attribution

**Dikembangkan oleh:**
- STMKG (Sekolah Tinggi Meteorologi Klimatologi dan Geofisika)
- BMKG (Badan Meteorologi Klimatologi dan Geofisika)

**Data Source:**
- OpenStreetMap (OSM)
- GeoJSON Poligon Desa Bali
- Dummy Weather Forecast Data (Development)

---

## ❓ FAQ

### Q: Bagaimana cara mengubah 10 destinasi yang tercantum di PRD menjadi 8?
**A:** PRD awalnya merencanakan 10 destinasi, namun implementasi saat ini menggunakan 8 destinasi utama. Untuk menambah destinasi, edit `src/data/dummyData.ts` di array `VILLAGES` dan tambahkan geometri di GeoJSON.

### Q: Bisakah saya mengubah dari dummy data ke real API?
**A:** Ya, modifikasi `src/data/dummyData.ts` untuk fetch dari Supabase atau API backend Anda. Struktur interface sudah siap untuk integrasi.

### Q: Bagaimana mengganti logo atau menambah informasi metadata?
**A:** Logo berada di `src/assets/` dan dikonfigurasi di `src/components/header/MapHeader.tsx`. Metadata (produced_at, batch info) berada di `src/data/dummyData.ts`.

### Q: Apakah ada offline capability?
**A:** Saat ini tidak ada service worker. Untuk offline, implementasikan caching GeoJSON di localStorage dan cached weather data per slot waktu.

---

**Dibuat dengan ❤️ untuk destinasi wisata Bali**
>>>>>>> a00c07e (update ui)
