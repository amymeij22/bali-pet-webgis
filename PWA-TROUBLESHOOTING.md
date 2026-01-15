# 🔧 PWA Troubleshooting Guide

Jika fitur PWA tidak muncul, ikuti langkah troubleshooting berikut:

## ✅ Checklist Dasar

### 1. Cek Console Browser
Buka DevTools (F12) → Console, cari log dengan prefix `[PWA]`:
- `[PWA] Checking PWA capabilities...` - Component sudah load
- `[PWA] Standalone mode: false` - Belum diinstall
- `[PWA] Is mobile: true/false` - Deteksi mobile
- `[PWA] Service Worker registered: Yes` - SW sudah terdaftar
- `[PWA] beforeinstallprompt event fired!` - Event install ter-trigger

### 2. Cek Service Worker
**Desktop (Chrome/Edge):**
1. DevTools → Application → Service Workers
2. Harus ada service worker dengan status "activated and is running"
3. Jika error, cek error message

**Mobile:**
- Buka Chrome → Menu (⋮) → Settings → Site settings → Service workers
- Atau gunakan Chrome DevTools remote debugging

### 3. Cek Manifest
**Desktop:**
1. DevTools → Application → Manifest
2. Harus ada manifest dengan nama "Bali PET Thermal Comfort"
3. Cek apakah icons ter-load (harus ada 8 icons)

**Mobile:**
- Buka URL: `http://your-ip:port/manifest.json`
- Harus return JSON dengan konfigurasi PWA

### 4. Cek Icons
Pastikan file berikut ada di `public/icons/`:
- ✅ `icon-192x192.png` (WAJIB)
- ✅ `icon-512x512.png` (WAJIB)
- ✅ `icon-72x72.png`
- ✅ `icon-96x96.png`
- ✅ `icon-128x128.png`
- ✅ `icon-144x144.png`
- ✅ `icon-152x152.png`
- ✅ `icon-384x384.png`

## 🐛 Masalah Umum & Solusi

### Problem: Install Prompt Tidak Muncul

**Kemungkinan Penyebab:**
1. **Belum memenuhi kriteria PWA**
   - ✅ Manifest.json valid
   - ✅ Service worker terdaftar
   - ✅ Icons tersedia (minimal 192x192 dan 512x512)
   - ✅ HTTPS atau localhost

2. **Browser tidak support**
   - Chrome/Edge: ✅ Support
   - Safari (iOS): ⚠️ Tidak support `beforeinstallprompt`, tapi bisa install manual
   - Firefox: ⚠️ Support terbatas

3. **Sudah pernah diinstall/dismiss**
   - Cek localStorage: `pwa-install-dismissed`
   - Clear localStorage atau tunggu 7 hari

**Solusi:**
```javascript
// Di browser console, clear dismissed flag:
localStorage.removeItem('pwa-install-dismissed');
// Refresh halaman
```

### Problem: Service Worker Tidak Terdaftar

**Kemungkinan Penyebab:**
1. **Path service worker salah**
   - Pastikan `public/sw.js` ada
   - Pastikan di-build, file ada di `dist/sw.js`

2. **HTTPS required**
   - Development: localhost OK
   - Production: Harus HTTPS
   - Forward port: Pastikan menggunakan HTTPS atau localhost

3. **Browser tidak support**
   - Cek: `'serviceWorker' in navigator` di console

**Solusi:**
```bash
# Pastikan build dulu
npm run build

# Test dengan preview
npm run preview

# Atau test di development (localhost)
npm run dev
# Buka: http://localhost:8080
```

### Problem: Manifest Tidak Ter-load

**Kemungkinan Penyebab:**
1. **Path manifest salah**
   - Pastikan `public/manifest.json` ada
   - Pastikan di HTML: `<link rel="manifest" href="/manifest.json" />`

2. **JSON invalid**
   - Validasi di: https://manifest-validator.appspot.com/

**Solusi:**
```bash
# Test manifest langsung
# Buka di browser: http://localhost:8080/manifest.json
# Harus return JSON, bukan 404
```

### Problem: Icons Tidak Muncul

**Kemungkinan Penyebab:**
1. **File tidak ada**
   - Pastikan semua icon ada di `public/icons/`

2. **Path salah di manifest**
   - Cek `manifest.json`, path harus `/icons/icon-XXXxXXX.png`

3. **Format tidak support**
   - Gunakan PNG (bukan SVG untuk icons)

**Solusi:**
```bash
# Generate icons menggunakan:
# https://www.pwabuilder.com/imageGenerator

# Atau manual:
# 1. Siapkan logo 512x512px
# 2. Resize ke semua ukuran
# 3. Simpan di public/icons/
```

## 📱 Testing di Mobile

### Android (Chrome)

1. **Via Forward Port (Development):**
   ```bash
   # Di komputer
   npm run dev
   # Forward port (contoh dengan ngrok atau localtunnel)
   # Atau gunakan IP lokal: http://192.168.x.x:8080
   ```

2. **Buka di Chrome Mobile:**
   - Install prompt akan muncul setelah 5 detik
   - Atau manual: Menu (⋮) → "Install app"

3. **Debug:**
   - Chrome mobile → Menu → Settings → Site settings → Service workers
   - Atau gunakan Chrome DevTools remote debugging

### iOS (Safari)

1. **Buka di Safari Mobile:**
   - Install prompt tidak otomatis (iOS tidak support `beforeinstallprompt`)
   - Manual: Share (□↑) → "Add to Home Screen"

2. **Debug:**
   - Safari mobile → Settings → Advanced → Web Inspector
   - Connect ke Mac untuk debugging

## 🔍 Debug Commands

Buka browser console dan jalankan:

```javascript
// Cek service worker
navigator.serviceWorker.getRegistration().then(reg => console.log('SW:', reg));

// Cek manifest
fetch('/manifest.json').then(r => r.json()).then(m => console.log('Manifest:', m));

// Cek PWA installable
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available!', e);
});

// Clear dismissed flag
localStorage.removeItem('pwa-install-dismissed');

// Cek standalone mode
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
```

## ✅ Verifikasi PWA

Gunakan tool online untuk verifikasi:
- **PWA Builder**: https://www.pwabuilder.com/
- **Lighthouse**: Chrome DevTools → Lighthouse → Run audit → PWA

## 🚀 Quick Fix

Jika semua sudah benar tapi masih tidak muncul:

1. **Clear cache & reload:**
   ```bash
   # Di browser: Ctrl+Shift+R (hard refresh)
   # Atau: DevTools → Application → Clear storage → Clear site data
   ```

2. **Unregister service worker lama:**
   ```javascript
   // Di console:
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister());
   });
   ```

3. **Rebuild aplikasi:**
   ```bash
   npm run build
   npm run preview
   ```

4. **Test di incognito/private mode:**
   - Pastikan tidak ada cache atau extension yang mengganggu

---

**Masih tidak berfungsi?** Cek console untuk error message spesifik dan pastikan semua checklist di atas sudah ✅
