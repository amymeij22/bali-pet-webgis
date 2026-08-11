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
  currentBatchUpdatedAt: string | null,
  onNewBatch?: (batch: ForecastBatch) => void
) {
  const channelRef = useRef<any>(null);
  const lastNotifiedBatchIdRef = useRef<string | null>(null);
  const lastNotifiedBatchUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    const subscribe = () => {
      if (!navigator.onLine) {
        console.log('[BatchMonitor] Offline - skipping realtime subscription');
        return;
      }

      if (channelRef.current) return;

      console.log('[BatchMonitor] Online - subscribing to realtime changes');
      channelRef.current = supabase
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

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newBatch = payload.new as ForecastBatch;

              if (!newBatch.is_latest) {
                return;
              }

              // Bandingkan ID dan waktu update batch
              const isSameBatch = currentBatchId === newBatch.id;
              const isSameUpdate = currentBatchUpdatedAt === newBatch.updated_at ||
                (newBatch.updated_at && lastNotifiedBatchUpdatedAtRef.current === newBatch.updated_at);

              if (isSameBatch && isSameUpdate) {
                return;
              }

              console.log('[BatchMonitor] New batch/update detected:', newBatch.id, newBatch.updated_at);
              lastNotifiedBatchIdRef.current = newBatch.id;
              lastNotifiedBatchUpdatedAtRef.current = newBatch.updated_at ?? null;

              if (onNewBatch) {
                onNewBatch(newBatch);
              }

              await showLocalNotification(newBatch);
            }
          }
        )
        .subscribe((status) => {
          console.log('[BatchMonitor] Realtime subscription status:', status);
        });
    };

    const unsubscribe = () => {
      if (channelRef.current) {
        console.log('[BatchMonitor] Unsubscribing from realtime changes');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    // Initial attempt
    subscribe();

    const handleOnline = () => {
      subscribe();
    };

    const handleOffline = () => {
      unsubscribe();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentBatchId, currentBatchUpdatedAt, onNewBatch]);

  // Check for new batch/update on mount (fallback if Realtime doesn't work)
  useEffect(() => {
    const checkForNewBatch = async () => {
      if (!navigator.onLine) return;
      try {
        const latest = await getLatestBatch();
        if (latest) {
          const isSameBatch = latest.id === currentBatchId;
          const isSameUpdate = latest.updated_at === currentBatchUpdatedAt;

          if (!isSameBatch || !isSameUpdate) {
            console.log('[BatchMonitor] New batch/update found on initial check:', latest.id, latest.updated_at);
            
            const isAlreadyNotified = lastNotifiedBatchIdRef.current === latest.id &&
              lastNotifiedBatchUpdatedAtRef.current === latest.updated_at;

            if (!isAlreadyNotified) {
              lastNotifiedBatchIdRef.current = latest.id;
              lastNotifiedBatchUpdatedAtRef.current = latest.updated_at ?? null;

              if (onNewBatch) {
                onNewBatch(latest);
              }

              await showLocalNotification(latest);
            }
          }
        }
      } catch (error) {
        console.error('[BatchMonitor] Error checking for new batch:', error);
      }
    };

    // Cek setelah 5 detik
    const timeout = setTimeout(checkForNewBatch, 5000);

    return () => clearTimeout(timeout);
  }, [currentBatchId, currentBatchUpdatedAt, onNewBatch]);
}

/**
 * Show local notification sebagai fallback
 * Note: Push notification utama di-handle oleh Supabase Edge Function via webhook
 * Function ini hanya untuk show local notification jika user sedang online dan batch baru terdeteksi
 */
async function showLocalNotification(batch: ForecastBatch): Promise<void> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) {
      console.log('[Push] User not subscribed, skipping local notification');
      return;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const producedDate = new Date(batch.produced_at);
    const formattedDate = producedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
    });

    // Show local notification
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
