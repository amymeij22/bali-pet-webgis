// Script untuk generate PWA icons dari logo source
// Install: npm install sharp (atau gunakan online tool)

const fs = require('fs');
const path = require('path');

// Ukuran icon yang diperlukan
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('📱 PWA Icon Generator');
console.log('====================\n');

console.log('Ukuran icon yang diperlukan:');
sizes.forEach(size => {
  console.log(`  - ${size}x${size}`);
});

console.log('\n📝 Instruksi:');
console.log('1. Siapkan logo source (PNG/SVG) minimal 512x512px');
console.log('2. Simpan di: public/icons/logo-source.png');
console.log('3. Install sharp: npm install sharp --save-dev');
console.log('4. Jalankan: node scripts/generate-icons.js');
console.log('\nAtau gunakan online tool: https://www.pwabuilder.com/imageGenerator');

// Check if sharp is available
try {
  const sharp = require('sharp');
  const sourcePath = path.join(__dirname, '../public/icons/logo-source.png');
  const outputDir = path.join(__dirname, '../public/icons');

  if (!fs.existsSync(sourcePath)) {
    console.log('\n⚠️  Logo source tidak ditemukan di:', sourcePath);
    console.log('   Silakan siapkan logo source terlebih dahulu.\n');
    process.exit(0);
  }

  console.log('\n🔄 Generating icons...\n');

  Promise.all(
    sizes.map(size => {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      return sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(outputPath)
        .then(() => {
          console.log(`✅ Generated: icon-${size}x${size}.png`);
        });
    })
  )
    .then(() => {
      console.log('\n✨ Semua icon berhasil di-generate!');
    })
    .catch((err) => {
      console.error('\n❌ Error:', err.message);
      console.log('\n💡 Alternatif: Gunakan online tool di https://www.pwabuilder.com/imageGenerator');
    });

} catch (err) {
  console.log('\n⚠️  Sharp tidak terinstall.');
  console.log('   Install dengan: npm install sharp --save-dev\n');
}
