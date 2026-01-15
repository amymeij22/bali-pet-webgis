# Instruksi Generate Icons PWA

Icons untuk PWA perlu dibuat dalam berbagai ukuran. Berikut cara membuatnya:

## Ukuran yang Diperlukan:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (wajib)
- 384x384
- 512x512 (wajib)

## Cara Generate:

### Opsi 1: Online Tool (Paling Mudah)
1. Kunjungi https://www.pwabuilder.com/imageGenerator
2. Upload logo BMKG atau kombinasi logo (minimal 512x512)
3. Download semua ukuran
4. Simpan di folder `public/icons/` dengan nama:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Opsi 2: ImageMagick (Command Line)
```bash
# Install ImageMagick dulu
# Lalu jalankan:
convert logo-source.png -resize 512x512 public/icons/icon-512x512.png
convert logo-source.png -resize 384x384 public/icons/icon-384x384.png
convert logo-source.png -resize 192x192 public/icons/icon-192x192.png
convert logo-source.png -resize 152x152 public/icons/icon-152x152.png
convert logo-source.png -resize 144x144 public/icons/icon-144x144.png
convert logo-source.png -resize 128x128 public/icons/icon-128x128.png
convert logo-source.png -resize 96x96 public/icons/icon-96x96.png
convert logo-source.png -resize 72x72 public/icons/icon-72x72.png
```

### Opsi 3: Photoshop/GIMP
1. Buka logo source (minimal 512x512)
2. Export untuk setiap ukuran dengan nama sesuai di atas
3. Simpan di `public/icons/`

## Catatan:
- Icon harus berbentuk persegi (square)
- Background transparan atau solid color
- Pastikan icon terlihat jelas di semua ukuran
- Gunakan logo BMKG atau kombinasi logo yang ada di `src/assets/`
