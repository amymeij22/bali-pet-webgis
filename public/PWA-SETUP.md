# Setup PWA - Progressive Web App

Aplikasi ini sudah dikonfigurasi sebagai PWA (Progressive Web App) yang dapat diinstall di perangkat mobile dan desktop.

## ✅ Yang Sudah Dikonfigurasi

1. **Manifest.json** - Konfigurasi PWA lengkap
2. **Service Worker** - Offline capability dan caching
3. **Install Prompt** - Auto-recommend install untuk mobile users
4. **Icons** - Placeholder icon (perlu diganti dengan icon HD)

## 📱 Generate Icons HD

Icons PWA perlu dibuat dalam berbagai ukuran. Ikuti langkah berikut:

### Opsi 1: Online Tool (Paling Mudah & Recommended)

1. Kunjungi: **https://www.pwabuilder.com/imageGenerator**
2. Upload logo BMKG atau kombinasi logo (minimal 512x512px)
   - Bisa gunakan logo dari `src/assets/logo-bmkg.webp` atau kombinasi logo
3. Download semua ukuran yang dihasilkan
4. Simpan di folder `public/icons/` dengan nama:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png` ⭐ (wajib)
   - `icon-384x384.png`
   - `icon-512x512.png` ⭐ (wajib)

### Opsi 2: Menggunakan Script (Node.js)

1. Install sharp:
   ```bash
   npm install sharp --save-dev
   ```

2. Siapkan logo source (PNG) minimal 512x512px
   - Simpan di: `public/icons/logo-source.png`

3. Jalankan script:
   ```bash
   node scripts/generate-icons.js
   ```

### Opsi 3: Manual (Photoshop/GIMP)

1. Buka logo source (minimal 512x512px)
2. Export untuk setiap ukuran:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
3. Simpan di `public/icons/` dengan nama sesuai di atas

## 🧪 Testing PWA

### Desktop (Chrome/Edge)

1. Build aplikasi: `npm run build`
2. Preview: `npm run preview`
3. Buka DevTools → Application → Service Workers
4. Cek apakah service worker terdaftar
5. Cek Manifest di Application → Manifest

### Mobile (Android)

1. Deploy aplikasi ke hosting (Vercel/Netlify)
2. Buka di Chrome mobile
3. Akan muncul prompt "Install App" setelah beberapa detik
4. Atau tap menu (⋮) → "Install app"

### Mobile (iOS)

1. Deploy aplikasi ke hosting
2. Buka di Safari mobile
3. Tap tombol Share (□↑)
4. Pilih "Add to Home Screen"

## 🔧 Konfigurasi

### Update Manifest

Edit `public/manifest.json` untuk mengubah:
- Nama aplikasi
- Theme color
- Start URL
- dll

### Update Service Worker

Edit `public/sw.js` untuk mengubah:
- Cache strategy
- Assets yang di-cache
- Update frequency

## 📝 Catatan Penting

- **Icons wajib**: Minimal perlu `icon-192x192.png` dan `icon-512x512.png`
- **HTTPS required**: PWA hanya bekerja di HTTPS (atau localhost)
- **Service Worker**: Akan auto-register saat aplikasi load
- **Install Prompt**: Hanya muncul di mobile dan browser yang support

## 🚀 Deployment

Setelah icons siap, build dan deploy seperti biasa:

```bash
npm run build
# Deploy folder dist/ ke hosting
```

PWA akan otomatis aktif setelah deploy!
