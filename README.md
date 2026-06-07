# Bali PET WebGIS

Aplikasi WebGIS interaktif untuk memvisualisasikan prediksi **kenyamanan termal** di berbagai destinasi wisata Bali. Kenyamanan termal dihitung berdasarkan indeks **Physiological Equivalent Temperature (PET)** menggunakan data cuaca historis dan prakiraan.

[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3-purple?logo=vite)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Tests-58%20Passed-green?logo=vitest)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/E2E-4%20Passed-green?logo=playwright)](https://playwright.dev)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

---

## Daftar Isi
- [Demonstrasi Visual](#demonstrasi-visual)
- [Tentang Proyek](#tentang-proyek)
- [Arsitektur & Struktur Direktori](#arsitektur--struktur-direktori)
- [Fitur Utama](#fitur-utama)
- [Dependensi Utama](#dependensi-utama)
- [Prasyarat (Prerequisites)](#prasyarat-prerequisites)
- [Panduan Instalasi & Penggunaan](#panduan-instalasi--penggunaan)
- [Pengujian & Testing](#pengujian--testing)
- [Kontribusi & Hak Cipta](#kontribusi--hak-cipta)

---

## Demonstrasi Visual

Berikut adalah cuplikan rekaman interaksi langsung pada dasbor WebGIS (memilih bahasa, melihat detail destinasi, dan berpindah tab ke grafik tren kenyamanan):

![Demonstrasi Fitur WebGIS](public/demo/webgis_demo.webp)

| Dasbor Utama & Peta Choropleth | Tab Tren Kenyamanan (Suhu vs PET) |
| :---: | :---: |
| ![Pemuatan Awal](public/demo/webgis_loaded.png) | ![Grafik Tren](public/demo/tren_kenyamanan_chart.png) |

---

## Tentang Proyek

Proyek ini dibangun sebagai bagian dari penelitian Tugas Akhir (Skripsi) di **Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG)**. WebGIS ini dirancang untuk membantu wisatawan maupun pengelola destinasi wisata di Provinsi Bali dalam merencanakan aktivitas luar ruangan berdasarkan tingkat kenyamanan termal real-time dan prakiraan.

Peta choropleth merender warna poligon desa berdasarkan kategori kenyamanan PET terpanas (maksimum) dari seluruh destinasi wisata di dalam wilayah administrasi tersebut.

---

## Arsitektur & Struktur Direktori

Repositori ini disusun menggunakan pola standar proyek React + Vite dengan struktur direktori yang modular sebagai berikut:

```text
webgis/
├── e2e/                # Skenario pengujian End-to-End (Playwright)
├── public/             # Aset statis publik (ikon, gambar demo)
├── src/                # Kode sumber utama aplikasi
│   ├── assets/         # Aset gambar, ikon, dan gaya tambahan
│   ├── components/     # Komponen UI yang reusable
│   │   ├── ui/         # Komponen dasar visual (Button, Dialog, dll via shadcn)
│   │   ├── map/        # Komponen rendering peta Leaflet
│   │   ├── chart/      # Visualisasi tren kenyamanan dengan Recharts
│   │   ├── sidebar/    # Panel navigasi dan daftar destinasi wisata
│   │   ├── popup/      # Detail parameter cuaca & popup destinasi
│   │   └── notifications/ # Tombol pendaftaran push notification
│   ├── data/           # Kueri database & master data lokal
│   ├── hooks/          # Custom React hooks (geolokasi, state queries)
│   ├── lib/            # Utilitas global, translator i18n, & client Supabase
│   ├── pages/          # Halaman dasbor utama (Index.tsx)
│   ├── test/           # Setup pengujian Vitest & mocks
│   ├── App.tsx         # Entrypoint komponen aplikasi
│   └── main.tsx        # File inisialisasi React ke DOM
├── vite.config.ts      # Konfigurasi bundler Vite dan Vitest
└── tsconfig.json       # Konfigurasi TypeScript compiler
```

---

## Fitur Utama

- **Peta Interaktif (Leaflet)**: Peta choropleth Bali yang diwarnai dinamis sesuai tingkat kenyamanan termal saat ini.
- **Tab Panel Informasi**: Memisahkan detail cuaca terkini (suhu, kelembapan, kecepatan angin, arah angin, kondisi visual, jarak pandang) dengan grafik tren kenyamanan.
- **Grafik Tren Kenyamanan & Suhu (Recharts)**:
  - Visualisasi PET menggunakan diagram area dengan gradien warna dinamis (merah untuk sangat panas, hijau untuk nyaman, dst.) per titik waktu.
  - Ditambah garis putus-putus (*dashed line*) visualisasi tren Suhu Udara (°C).
  - **Sinkronisasi Waktu Interaktif**: Klik pada titik mana pun di grafik tren untuk menyelaraskan jam aktif dasbor dan peta.
- **Toleransi Waktu (Fuzzy Matching)**: Penanganan data BMKG otomatis dengan pencarian jam terdekat berbasis batas toleransi ±90 menit (`NEAREST_TOLERANCE_MS`).
- **Sidebar Destinasi**: Dilengkapi pencarian nama, pintasan sorot ke peta, serta pengelompokan per wilayah kabupaten/kecamatan.
- **PWA & Offline Caching (Production-Ready)**:
  - Dukungan instalasi aplikasi langsung dari browser, manifest, dan service worker.
  - **PWA Auto-Update Real-time**: Service worker mendeteksi notifikasi push batch data cuaca baru (`NEW_BATCH_NOTIFICATION`) dan secara otomatis memicu refresh data di latar belakang pada halaman dasbor tanpa memerlukan refresh browser manual oleh pengguna.
  - **Dukungan Rerun Dinamis (Run 2/3)**: Membandingkan timestamp `updated_at` untuk mendeteksi eksekusi ulang pada batch yang sama secara dinamis.
- **Optimasi Produksi (Zero Logs)**: Menonaktifkan log konsol browser di lingkungan produksi untuk privasi dan kinerja aplikasi yang optimal.
- **Push Notification**: Berlangganan notifikasi otomatis saat batch data prakiraan cuaca baru selesai diproduksi oleh backend.

---

## Dependensi Utama

Detail library kunci yang membentuk inti fungsionalitas WebGIS ini:
*   **React (v18.3)** & **TypeScript**: Framework utama dan pengetikan statis untuk keamanan kode.
*   **Leaflet & React-Leaflet**: Rendering peta interaktif serta manipulasi layer choropleth.
*   **Recharts**: Library visualisasi grafik untuk menyajikan tren data historis dan forecast.
*   **Supabase JS Client**: Library penghubung database postgres secara realtime dan aman.
*   **Framer Motion**: Library animasi untuk menghadirkan transisi halus pada elemen antarmuka.
*   **Tailwind CSS & shadcn/ui**: Kerangka penataan gaya visual komponen UI.

---

## Prasyarat (Prerequisites)

Sebelum mulai menjalankan aplikasi secara lokal, pastikan perangkat Anda sudah terinstal:
- **Node.js** (versi 18 ke atas)
- Browser modern dengan dukungan Geolocation dan Web Push (seperti Chrome, Edge, atau Firefox)

---

## Panduan Instalasi & Penggunaan

1. **Unduh repositori dan masuk ke folder proyek**:
   ```bash
   cd webgis
   ```

2. **Instal dependensi package**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Buat file baru bernama `.env.local` di folder root `webgis/` dan isi variabel berikut:

   | Variabel | Deskripsi | Status |
   | :--- | :--- | :---: |
   | `VITE_SUPABASE_URL` | URL endpoint proyek database Supabase Anda. | **Wajib** |
   | `VITE_SUPABASE_ANON_KEY` | Kunci anonim (public key) untuk akses API Supabase. | **Wajib** |
   | `VITE_VAPID_PUBLIC_KEY` | Kunci publik VAPID untuk mengaktifkan fitur Push Notifications. | *Opsional* |

   Contoh isi file `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
   ```

4. **Jalankan aplikasi di mode pengembangan (lokal)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan secara lokal di [http://localhost:8080](http://localhost:8080).

5. **Build proyek untuk mode produksi**:
   ```bash
   npm run build
   npm run preview
   ```

---

## Pengujian & Testing

Dasbor ini dilengkapi dua jenis verifikasi otomatis untuk menjaga kualitas kode:

### 1. Unit Testing (Vitest)
Digunakan untuk menguji logika bisnis deterministik (seperti konversi WITA, perhitungan fuzzy matching, pengelompokan menu, kamus bahasa, dan klasifikasi PET):
```bash
npm run test
```

### 2. End-to-End (E2E) Testing (Playwright)
Menguji alur interaksi antarmuka pengguna pada browser Chromium nyata (seperti memuat peta Leaflet, berganti bahasa, memicu pop-up dari klik sidebar, dan klik grafik tren):
```bash
# Instal browser biner Playwright jika pertama kali
npx playwright install chromium

# Jalankan semua pengujian E2E
npm run test:e2e
```

---

## Kontribusi & Hak Cipta

Proyek ini bersifat **private** (tertutup). Seluruh hak cipta dilindungi oleh penulis dan Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG). 

Hubungi penulis jika ada pertanyaan lebih lanjut terkait penelitian ini:
*   **Nama**: Ahmad Meijlan Yasir
*   **Email**: yasirahmad220504@gmail.com
*   **Instansi**: Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG), Tangerang.
