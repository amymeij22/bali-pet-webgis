// Supabase Edge Function untuk send Web Push Notifications
// Dipanggil via database webhook saat batch baru tersedia

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as webpush from 'npm:web-push@3.6.6';

interface WebhookPayload {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: {
    id: string;
    produced_at: string;
    is_latest: boolean;
    forecast_start: string;
    forecast_end: string;
  };
  new?: {
    id: string;
    produced_at: string;
    is_latest: boolean;
    forecast_start: string;
    forecast_end: string;
  };
  schema?: 'public';
  old_record?: null | any;
  old?: null | any;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  is_active: boolean;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Setup VAPID details
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:your-email@example.com';

console.log('[Push Function] Initializing...');
console.log('[Push Function] VAPID_PUBLIC_KEY set:', !!VAPID_PUBLIC_KEY);
console.log('[Push Function] VAPID_PRIVATE_KEY set:', !!VAPID_PRIVATE_KEY);
console.log('[Push Function] SUPABASE_URL set:', !!Deno.env.get('SUPABASE_URL'));

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push Function] VAPID details configured');
} else {
  console.error('[Push Function] WARNING: VAPID keys not set!');
}

Deno.serve(async (req) => {
  console.log('[Push Function] ===== REQUEST RECEIVED =====');
  console.log('[Push Function] Method:', req.method);
  console.log('[Push Function] URL:', req.url);
  
  try {
    const rawBody = await req.text();
    console.log('[Push Function] Raw body:', rawBody);
    
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('[Push Function] Failed to parse JSON:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON', details: e.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[Push Function] Parsed body:', JSON.stringify(body, null, 2));
    
    const payload: WebhookPayload = body;
    const eventType = payload.type || payload.eventType || 'INSERT';
    const table = payload.table || 'forecast_batches';
    const record = payload.record || payload.new || body;
    
    console.log('[Push Function] Event type:', eventType);
    console.log('[Push Function] Table:', table);
    console.log('[Push Function] Record:', JSON.stringify(record, null, 2));
    
    // Filter event
    if (eventType !== 'INSERT' && eventType !== 'UPDATE') {
      console.log('[Push Function] Event type not INSERT/UPDATE, skipping');
      return new Response(JSON.stringify({ message: 'Event type not supported' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Filter tabel
    if (table !== 'forecast_batches') {
      console.log('[Push Function] Table is not forecast_batches, skipping');
      return new Response(JSON.stringify({ message: 'Table not supported' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!record || !record.id) {
      console.error('[Push Function] Invalid record:', record);
      return new Response(JSON.stringify({ error: 'Invalid record format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Filter is_latest
    if (!record.is_latest) {
      console.log('[Push Function] Batch is not latest, skipping. is_latest:', record.is_latest);
      return new Response(JSON.stringify({ message: 'Batch is not latest, skipped' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek perubahan status is_latest
    if (eventType === 'UPDATE') {
      const oldRecord = payload.old || payload.old_record;
      if (oldRecord && oldRecord.is_latest === true) {
        console.log('[Push Function] Batch was already latest (is_latest was true in old record), skipping notification');
        return new Response(JSON.stringify({ message: 'Batch was already latest, skipped notification' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    console.log('[Push Function] Processing batch:', record.id);
    
    // Ambil subscription aktif
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, is_active')
      .eq('is_active', true);
    
    if (subError) {
      console.error('[Push Function] Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push Function] No active subscriptions found');
      return new Response(JSON.stringify({ message: 'No active subscriptions' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[Push Function] Found ${subscriptions.length} active subscriptions`);
    
    const producedDate = new Date(record.produced_at);
    const formattedDate = producedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
    });
    
    // Buat payload
    const notificationPayload = {
      title: 'Prakiraan Baru Tersedia',
      body: `Data prakiraan kenyamanan termal Destinasi Wisata Bali terbaru sudah tersedia (${formattedDate} WITA). Buka aplikasi untuk melihat peta interaktif.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'new-forecast-batch',
      data: {
        url: '/',
        batchId: record.id,
        producedAt: record.produced_at,
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Buka Aplikasi',
        },
      ],
    };
    
    console.log('[Push Function] Sending push notifications...');
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          
          console.log(`[Push Function] Sending to subscription ${sub.id}...`);
          
          await webpush.sendNotification(
            subscription,
            JSON.stringify(notificationPayload)
          );
          
          console.log(`[Push Function] Successfully sent to ${sub.id}`);
          
          // Catat metadata notifikasi
          await supabase
            .from('push_subscriptions')
            .update({
              last_notified_batch_id: record.id,
              last_notified_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
          
          return { id: sub.id, status: 'success' };
        } catch (error: any) {
          console.error(`[Push Function] Error sending to ${sub.id}:`, error);
          console.error(`[Push Function] Error details:`, JSON.stringify(error, null, 2));
          
          // Matikan subscription kedaluwarsa
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[Push Function] Subscription ${sub.id} expired, marking as inactive`);
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id);
            
            return { id: sub.id, status: 'expired', error: error.message };
          }
          
          return { id: sub.id, status: 'error', error: error.message };
        }
      })
    );
    
    // Count successes and failures
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failed = results.length - successful;
    
    console.log(`[Push Function] ===== COMPLETED =====`);
    console.log(`[Push Function] Total: ${subscriptions.length}, Successful: ${successful}, Failed: ${failed}`);
    
    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        total: subscriptions.length,
        successful,
        failed,
        results: results.map((r) => 
          r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason }
        ),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Push Function] ===== ERROR =====');
    console.error('[Push Function] Error:', error);
    console.error('[Push Function] Error stack:', error.stack);
    console.error('[Push Function] Error details:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack || JSON.stringify(error, null, 2)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});