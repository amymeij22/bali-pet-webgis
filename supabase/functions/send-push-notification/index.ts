// Supabase Edge Function untuk send Web Push Notifications
// Dipanggil via database webhook saat batch baru tersedia

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as webpush from 'npm:web-push@3.6.6';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    produced_at: string;
    is_latest: boolean;
    forecast_start: string;
    forecast_end: string;
  };
  schema: 'public';
  old_record: null | any;
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

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

Deno.serve(async (req) => {
  try {
    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    
    console.log('[Push Function] Received webhook:', payload.type, payload.table);

    // Hanya handle INSERT atau UPDATE yang set is_latest = true
    if (payload.table !== 'forecast_batches') {
      return new Response(JSON.stringify({ error: 'Invalid table' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hanya proses jika is_latest = true
    if (!payload.record.is_latest) {
      console.log('[Push Function] Batch is not latest, skipping');
      return new Response(JSON.stringify({ message: 'Batch is not latest, skipped' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, is_active')
      .eq('is_active', true);

    if (subError) {
      console.error('[Push Function] Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
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

    console.log(`[Push Function] Sending push to ${subscriptions.length} subscribers`);

    // Format waktu produksi
    const producedDate = new Date(payload.record.produced_at);
    const formattedDate = producedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar', // WITA
    });

    // Prepare notification payload
    const notificationPayload = {
      title: 'Prakiraan Baru Tersedia',
      body: `Data prakiraan kenyamanan termal terbaru sudah tersedia (${formattedDate} WITA)`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'new-forecast-batch',
      data: {
        url: '/',
        batchId: payload.record.id,
        producedAt: payload.record.produced_at,
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

    // Send push notification to all active subscriptions
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

          await webpush.sendNotification(
            subscription,
            JSON.stringify(notificationPayload)
          );

          // Update last_notified_batch_id and last_notified_at
          await supabase
            .from('push_subscriptions')
            .update({
              last_notified_batch_id: payload.record.id,
              last_notified_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          return { id: sub.id, status: 'success' };
        } catch (error: any) {
          console.error(`[Push Function] Error sending to ${sub.id}:`, error);

          // Handle expired/invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Mark subscription as inactive
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

    console.log(`[Push Function] Sent: ${successful} successful, ${failed} failed`);

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
  } catch (error) {
    console.error('[Push Function] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
