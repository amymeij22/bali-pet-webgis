# ⚠️ PENTING: Generate Icons PWA

PWA memerlukan icon dalam berbagai ukuran. **Icon placeholder belum dibuat** - silakan generate icon HD terlebih dahulu.

## 🚀 Cara Cepat (Recommended)

### Gunakan Online Tool (Paling Mudah)

1. **Kunjungi**: https://www.pwabuilder.com/imageGenerator
2. **Upload logo**: 
   - Gunakan logo dari `src/assets/logo-bmkg.webp` 
   - Atau kombinasi logo BMKG + STMKG
   - Minimal ukuran 512x512px
3. **Download semua ukuran** yang dihasilkan
4. **Simpan di folder ini** (`public/icons/`) dengan nama:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png` ⭐ **WAJIB**
   - `icon-384x384.png`
   - `icon-512x512.png` ⭐ **WAJIB**

## 📋 Checklist Icon

Setelah generate, pastikan file berikut ada:
- [ ] `icon-72x72.png`
- [ ] `icon-96x96.png`
- [ ] `icon-128x128.png`
- [ ] `icon-144x144.png`
- [ ] `icon-152x152.png`
- [ ] `icon-192x192.png` ⭐
- [ ] `icon-384x384.png`
- [ ] `icon-512x512.png` ⭐

## 🎨 Tips Icon

- **Background**: Transparan atau solid color (hijau #2ecc71 sesuai theme)
- **Shape**: Square (persegi)
- **Content**: Logo BMKG atau kombinasi logo yang jelas
- **Quality**: HD, tidak blur saat di-resize

## ✅ Setelah Icon Siap

1. Build aplikasi: `npm run build`
2. Test PWA di browser (Chrome DevTools → Application)
3. Deploy ke hosting (Vercel/Netlify)

PWA akan otomatis aktif setelah icon tersedia!
