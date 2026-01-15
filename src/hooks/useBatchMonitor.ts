import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getLatestBatch, ForecastBatch } from '@/data/supabaseQueries';
import { getCurrentSubscription } from '@/lib/pushNotification';

/**
 * Hook untuk monitor batch baru menggunakan Supabase Realtime
 * Akan trigger push notification jika batch baru tersedia
 */
export function useBatchMonitor(
  currentBatchId: string | null,
  onNewBatch?: (batch: ForecastBatch) => void
) {
  const subscriptionRef = useRef<any>(null);
  const lastNotifiedBatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Setup Realtime subscription untuk forecast_batches
    const channel = supabase
      .channel('forecast_batches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forecast_batches',
          filter: 'is_latest=eq.true',
        },
        async (payload) => {
          console.log('[BatchMonitor] Batch change detected:', payload);

          // Hanya handle INSERT atau UPDATE yang set is_latest = true
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newBatch = payload.new as ForecastBatch;

            // Skip jika batch ini sama dengan yang terakhir di-notify
            if (lastNotifiedBatchIdRef.current === newBatch.id) {
              console.log('[BatchMonitor] Batch already notified, skipping');
              return;
            }

            // Skip jika batch ini sama dengan current batch
            if (currentBatchId === newBatch.id) {
              console.log('[BatchMonitor] Batch is current batch, skipping');
              return;
            }

            console.log('[BatchMonitor] New batch detected:', newBatch.id);

            // Update last notified
            lastNotifiedBatchIdRef.current = newBatch.id;

            // Call callback jika ada
            if (onNewBatch) {
              onNewBatch(newBatch);
            }

            // Show local notification sebagai fallback
            // Push notification utama di-handle oleh Supabase Edge Function via webhook
            await showLocalNotification(newBatch);
          }
        }
      )
      .subscribe((status) => {
        console.log('[BatchMonitor] Realtime subscription status:', status);
      });

    subscriptionRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [currentBatchId, onNewBatch]);

  // Check for new batch on mount (fallback if Realtime doesn't work)
  useEffect(() => {
    const checkForNewBatch = async () => {
      try {
        const latest = await getLatestBatch();
        if (latest && latest.id !== currentBatchId) {
          console.log('[BatchMonitor] New batch found on initial check:', latest.id);
          
          if (lastNotifiedBatchIdRef.current !== latest.id) {
            lastNotifiedBatchIdRef.current = latest.id;
            
            if (onNewBatch) {
              onNewBatch(latest);
            }
            
            await showLocalNotification(latest);
          }
        }
      } catch (error) {
        console.error('[BatchMonitor] Error checking for new batch:', error);
      }
    };

    // Check after 5 seconds (give Realtime time to connect)
    const timeout = setTimeout(checkForNewBatch, 5000);

    return () => clearTimeout(timeout);
  }, [currentBatchId, onNewBatch]);
}

/**
 * Show local notification sebagai fallback
 * Note: Push notification utama di-handle oleh Supabase Edge Function via webhook
 * Function ini hanya untuk show local notification jika user sedang online dan batch baru terdeteksi
 */
async function showLocalNotification(batch: ForecastBatch): Promise<void> {
  try {
    // Check if user is subscribed
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      console.log('[Push] User not subscribed, skipping local notification');
      return;
    }

    // Check notification permission
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Format waktu produksi
    const producedDate = new Date(batch.produced_at);
    const formattedDate = producedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar', // WITA
    });

    // Show local notification (fallback jika webhook/Edge Function belum trigger)
    // Push notification utama tetap di-handle oleh Supabase Edge Function via webhook
    new Notification('Prakiraan Baru Tersedia', {
      body: `Data prakiraan terbaru sudah tersedia (${formattedDate} WITA)`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'new-forecast-batch',
      data: { 
        url: '/',
        batchId: batch.id,
      },
      requireInteraction: false,
    });

    console.log('[Push] Local notification shown (Edge Function will send push to all subscribers)');
  } catch (error) {
    console.error('[Push] Error showing local notification:', error);
  }
}
