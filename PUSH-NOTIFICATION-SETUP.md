# Push Notification Setup Guide

Dokumentasi lengkap untuk setup dan penggunaan push notification di aplikasi WebGIS Bali PET.

## 📋 Overview

Push notification akan mengirim notifikasi ke user yang sudah enable notification ketika batch prakiraan baru tersedia. Notifikasi hanya dikirim ke user yang sudah subscribe.

## 🗄️ Database Setup

### 1. Jalankan SQL Script

Jalankan file `db/push_notifications.sql` di Supabase SQL Editor:

```sql
-- File: db/push_notifications.sql
-- Script ini akan membuat tabel push_subscriptions dan function terkait
```

Atau copy-paste isi file tersebut ke Supabase SQL Editor dan execute.

### 2. Verifikasi Tabel

Pastikan tabel `push_subscriptions` sudah dibuat dengan kolom:
- `id` (UUID)
- `endpoint` (TEXT, UNIQUE)
- `p256dh` (TEXT)
- `auth` (TEXT)
- `user_agent` (TEXT)
- `is_active` (BOOLEAN)
- `last_notified_batch_id` (UUID, FK ke forecast_batches)
- `created_at`, `updated_at` (TIMESTAMPTZ)

## 🔑 VAPID Keys Setup

Push notification memerlukan VAPID (Voluntary Application Server Identification) keys.

### Generate VAPID Keys

**Opsi 1: Menggunakan web-push (Node.js)**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

Output akan seperti:
```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa40HI...
Private Key: VRYtLh4b4rX5t7L1o...
```

**Opsi 2: Online Tool**
- Kunjungi: https://web-push-codelab.glitch.me/
- Generate keys dan copy Public Key

### Setup Environment Variables

Tambahkan ke file `.env.local`:

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

**PENTING**: 
- Public key digunakan di frontend (aman untuk di-expose)
- Private key digunakan di backend untuk send notification (JANGAN expose di frontend!)

## 🚀 Backend Setup - Supabase Edge Function

Frontend sudah siap untuk subscribe dan receive push. Untuk **send push notification**, kita menggunakan **Supabase Edge Function** yang terintegrasi dengan Supabase.

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login & Link Project

```bash
# Login ke Supabase
supabase login

# Link ke project Supabase Anda
supabase link --project-ref your-project-ref
```

Untuk mendapatkan project-ref, buka Supabase Dashboard → Settings → API → Project URL, project-ref ada di URL.

### 3. Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Simpan **Public Key** dan **Private Key** yang dihasilkan.

### 4. Set Environment Variables (Secrets)

```bash
supabase secrets set VAPID_PUBLIC_KEY=your_public_key_here
supabase secrets set VAPID_PRIVATE_KEY=your_private_key_here
supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com
```

**PENTING**: 
- Ganti `your-email@example.com` dengan email Anda (untuk VAPID subject)
- Public key dan private key dari step 3

### 5. Deploy Edge Function

```bash
supabase functions deploy send-push-notification
```

Function sudah tersedia di `supabase/functions/send-push-notification/index.ts`.

### 6. Setup Database Webhook

1. Buka **Supabase Dashboard** → **Database** → **Webhooks**
2. Klik **Create a new webhook**
3. Konfigurasi:
   - **Name**: `forecast_batch_push_notification`
   - **Table**: `forecast_batches`
   - **Events**: Pilih `INSERT` dan `UPDATE`
   - **Type**: `Supabase Edge Function`
   - **Edge Function**: Pilih `send-push-notification`
   - **HTTP Method**: `POST`
   - **HTTP Headers**: 
     - Klik **Add auth header with service key** (otomatis menambahkan service role key)
     - Pastikan `Content-Type: application/json` ada
4. Klik **Create webhook**

Webhook akan otomatis trigger Edge Function saat batch baru di-insert atau di-update dengan `is_latest = true`.

## 📱 Frontend Features

### 1. Notification Toggle

Komponen `NotificationToggle` sudah terintegrasi di header. User bisa:
- Enable/disable notification
- Auto-request permission jika belum granted
- Status ditampilkan dengan icon Bell/BellOff

### 2. Service Worker

Service worker (`public/sw.js`) sudah dikonfigurasi untuk:
- Handle push events
- Show notification dengan action buttons
- Handle notification click (buka aplikasi)

### 3. Batch Monitor

Hook `useBatchMonitor` akan:
- Monitor perubahan batch menggunakan Supabase Realtime
- Trigger push notification saat batch baru tersedia
- Auto-reload data saat batch baru terdeteksi

## 🧪 Testing

### 1. Test Subscription

1. Buka aplikasi di browser
2. Klik tombol "Aktifkan Notifikasi" di header
3. Grant permission jika diminta
4. Cek console untuk log `[Push] Subscribed successfully`
5. Cek database `push_subscriptions` - harus ada entry baru

### 2. Test Edge Function

**Test Function Langsung:**
```bash
# Test function dengan payload dummy
supabase functions invoke send-push-notification --body '{
  "type": "INSERT",
  "table": "forecast_batches",
  "record": {
    "id": "test-id",
    "produced_at": "2025-01-16T10:00:00Z",
    "is_latest": true,
    "forecast_start": "2025-01-16T00:00:00Z",
    "forecast_end": "2025-01-19T00:00:00Z"
  },
  "schema": "public"
}'
```

**Cek Logs:**
```bash
supabase functions logs send-push-notification
```

### 3. Test Push Notification (End-to-End)

1. Pastikan user sudah subscribe (step 1)
2. Insert batch baru di database dengan `is_latest = true`:
   ```sql
   INSERT INTO forecast_batches (produced_at, is_latest, forecast_start, forecast_end)
   VALUES (NOW(), true, NOW(), NOW() + INTERVAL '3 days');
   ```
3. Webhook akan otomatis trigger Edge Function
4. Cek logs untuk melihat proses send push
5. Notification harus muncul di browser/device user yang subscribe

### 4. Test Manual Notification (dari console)

```javascript
// Di browser console - test service worker
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test Notification', {
    body: 'Ini adalah test notification',
    icon: '/icons/icon-192x192.png',
    tag: 'test',
  });
});
```

## 🔧 Troubleshooting

### Notification Tidak Muncul

1. **Cek Permission:**
   ```javascript
   Notification.permission // Harus 'granted'
   ```

2. **Cek Subscription:**
   ```javascript
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription().then(sub => {
       console.log('Subscription:', sub);
     });
   });
   ```

3. **Cek Service Worker:**
   - DevTools → Application → Service Workers
   - Pastikan service worker aktif

4. **Cek VAPID Key:**
   - Pastikan `VITE_VAPID_PUBLIC_KEY` sudah di-set
   - Pastikan key valid (base64 URL-safe)

### Subscription Gagal

1. **Cek Browser Support:**
   - Chrome/Edge: ✅ Support
   - Firefox: ✅ Support
   - Safari: ⚠️ Support terbatas (tidak support Web Push API)

2. **Cek HTTPS:**
   - Push notification hanya bekerja di HTTPS atau localhost
   - Pastikan menggunakan HTTPS di production

3. **Cek VAPID Key:**
   - Pastikan public key sudah benar
   - Format harus base64 URL-safe

### Backend Send Push Gagal

1. **Cek VAPID Private Key:**
   - Pastikan private key sudah di-set di backend
   - Jangan expose private key di frontend!

2. **Cek Subscription Data:**
   - Pastikan endpoint, p256dh, dan auth valid
   - Pastikan subscription masih aktif di database

3. **Cek Error Response:**
   - Web Push API return error code spesifik
   - 410: Subscription expired (hapus dari database)
   - 404: Subscription tidak valid (hapus dari database)

## 📝 Environment Variables

Tambahkan ke `.env.local`:

```env
# VAPID Public Key (untuk frontend)
VITE_VAPID_PUBLIC_KEY=your_public_key_here

# Optional: Backend API URL untuk send push
VITE_PUSH_API_URL=https://your-api.com/api/push/notify
```

## 🔐 Security Notes

1. **VAPID Private Key**: JANGAN expose di frontend! Hanya digunakan di backend.
2. **Subscription Endpoint**: Endpoint bersifat unik per user/device, jangan share.
3. **Database Access**: Pastikan RLS (Row Level Security) di Supabase sudah dikonfigurasi dengan benar.

## 📚 File Structure

```
src/
  lib/
    pushNotification.ts          # Service untuk manage subscription
  hooks/
    useBatchMonitor.ts           # Hook untuk monitor batch baru
  components/
    notifications/
      NotificationToggle.tsx     # UI toggle untuk enable/disable
  data/
    supabaseQueries.ts           # Query untuk push subscriptions
public/
  sw.js                          # Service worker (handle push event)
db/
  push_notifications.sql         # Database schema untuk subscriptions
```

## ✅ Checklist Setup

- [ ] Database table `push_subscriptions` sudah dibuat (jalankan `db/push_notifications.sql`)
- [ ] VAPID keys sudah di-generate
- [ ] `VITE_VAPID_PUBLIC_KEY` sudah di-set di `.env.local` (frontend)
- [ ] Supabase CLI sudah terinstall dan login
- [ ] Project sudah di-link (`supabase link`)
- [ ] VAPID secrets sudah di-set di Supabase (`supabase secrets set`)
- [ ] Edge Function sudah di-deploy (`supabase functions deploy`)
- [ ] Database webhook sudah dibuat di Supabase Dashboard
- [ ] Service worker sudah terdaftar
- [ ] Notification permission sudah granted
- [ ] Test subscription berhasil
- [ ] Test push notification berhasil (insert batch baru)

## 🚀 Production Deployment

1. **Generate VAPID Keys untuk Production**
   - Jangan gunakan keys yang sama dengan development
   - Simpan private key dengan aman di Supabase Secrets

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-push-notification --project-ref your-production-ref
   ```

3. **Set Production Secrets**
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY=prod_public_key --project-ref your-production-ref
   supabase secrets set VAPID_PRIVATE_KEY=prod_private_key --project-ref your-production-ref
   supabase secrets set VAPID_SUBJECT=mailto:production@example.com --project-ref your-production-ref
   ```

4. **Setup Production Webhook**
   - Buat webhook di production Supabase project
   - Pastikan webhook mengarah ke Edge Function yang sudah di-deploy

5. **Configure Supabase RLS (Optional)**
   - Jika perlu, setup RLS untuk `push_subscriptions` table
   - Default: semua user bisa create subscription mereka sendiri

6. **Monitor Subscriptions**
   - Edge Function otomatis cleanup expired subscriptions (mark as inactive)
   - Monitor logs: `supabase functions logs send-push-notification`

---

**Status**: ✅ Implementation complete menggunakan Supabase Edge Functions. Tidak perlu backend terpisah!
