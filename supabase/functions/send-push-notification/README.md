# Send Push Notification Edge Function

Supabase Edge Function untuk mengirim push notification ke semua subscribers saat batch prakiraan baru tersedia.

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login ke Supabase

```bash
supabase login
```

### 3. Link Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Simpan Public Key dan Private Key yang dihasilkan.

### 5. Set Environment Variables

```bash
supabase secrets set VAPID_PUBLIC_KEY=your_public_key
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com
```

### 6. Deploy Function

```bash
supabase functions deploy send-push-notification
```

## Database Webhook Setup

1. Buka Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - **Name**: `forecast_batch_push_notification`
   - **Table**: `forecast_batches`
   - **Events**: `INSERT`, `UPDATE`
   - **Type**: `Supabase Edge Function`
   - **Function**: `send-push-notification`
   - **HTTP Method**: `POST`
   - **HTTP Headers**: 
     - Add auth header with service key
     - Content-Type: application/json

3. **Filter**: 
   - Add filter: `is_latest = true` (optional, atau handle di function)

## Testing

1. Insert batch baru dengan `is_latest = true` di database
2. Cek logs: `supabase functions logs send-push-notification`
3. Verifikasi push notification diterima oleh subscribers
