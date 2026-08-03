// Supabase Edge Function untuk Uji Coba Web Push Notifications (Isolated Test)
// Digunakan khusus untuk demo pengiriman notifikasi tanpa memodifikasi data prakiraan cuaca.

import { createClient } from 'npm:@supabase/supabase-js@2';
import * as webpush from 'npm:web-push@3.6.6';

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

console.log('[Test Push Function] Initializing...');

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Test Push Function] VAPID details configured');
} else {
  console.error('[Test Push Function] WARNING: VAPID keys not set!');
}

Deno.serve(async (req) => {
  console.log('[Test Push Function] ===== REQUEST RECEIVED =====');
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      console.warn('[Test Push Function] No body or invalid JSON, using defaults');
    }

    // Get all active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, is_active')
      .eq('is_active', true);
    
    if (subError) {
      console.error('[Test Push Function] Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Test Push Function] No active subscriptions found');
      return new Response(JSON.stringify({ message: 'No active subscriptions found', total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[Test Push Function] Found ${subscriptions.length} active subscriptions`);

    // Prepare notification payload
    const notificationPayload = {
      title: body.title || 'Uji Coba Push Notification 🚀',
      body: body.body || 'Pemberitahuan Uji Coba: Sistem push notification Bali PET WebGIS berjalan dengan sukses!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test-push-notification',
      data: {
        url: body.url || '/',
        isTest: true,
        testTimestamp: Date.now()
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };
    
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
          
          await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
          return { id: sub.id, status: 'success' };
        } catch (error: any) {
          console.error(`[Test Push Function] Error sending to ${sub.id}:`, error);
          
          // Handle expired subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
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
    
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failed = results.length - successful;
    
    return new Response(
      JSON.stringify({
        message: 'Test push notifications sent successfully to all active subscribers',
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
    console.error('[Test Push Function] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack || ''
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
