const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env file to extract Supabase details
const envPath = path.join(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const matchUrl = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.*?)\s*$/);
      const matchKey = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*?)\s*$/);
      if (matchUrl) supabaseUrl = matchUrl[1];
      if (matchKey) supabaseAnonKey = matchKey[1];
    }
  } else {
    console.error('File .env tidak ditemukan di: ' + envPath);
    process.exit(1);
  }
} catch (e) {
  console.error('Gagal membaca file .env:', e.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di file .env');
  process.exit(1);
}

// Clean up surrounding quotes if any
supabaseUrl = supabaseUrl.replace(/['"]/g, '').trim();
supabaseAnonKey = supabaseAnonKey.replace(/['"]/g, '').trim();

const payload = JSON.stringify({
  is_test: true,
  title: 'Uji Coba Push Notification 🚀',
  body: 'Pemberitahuan Uji Coba: Sistem push notification Bali PET WebGIS berjalan dengan sukses!'
});

console.log('==================================================');
console.log('Mengirim notifikasi uji coba ke seluruh subscriber...');
console.log('URL Target:', `${supabaseUrl}/functions/v1/test-push-notification`);
console.log('==================================================\n');

try {
  const url = new URL(`${supabaseUrl}/functions/v1/test-push-notification`);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status Kueri: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log('Hasil Respon:\n', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Hasil Respon (Raw):\n', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Kesalahan Koneksi:', e.message);
  });

  req.write(payload);
  req.end();
} catch (err) {
  console.error('Kesalahan URL Parser:', err.message);
}
