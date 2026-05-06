import { savePushSubscription, removePushSubscription } from '@/data/supabaseQueries';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  last_notified_batch_id: string | null;
  created_at: string;
}

// VAPID public key - harus di-set di environment variable
// Untuk production, generate VAPID keys menggunakan: npm install -g web-push && web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const LAST_ENDPOINT_STORAGE_KEY = 'push:lastEndpoint';

/**
 * Convert base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  try {
    // Check if already subscribed
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[Push] Already subscribed:', subscription.endpoint);
      // Ensure DB has this subscription as active (can be out-of-sync).
      try {
        await saveSubscriptionToDatabase(subscription);
      } catch (e) {
        console.warn('[Push] Failed to sync existing subscription to DB:', e);
      }
      return subscription;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied');
      return null;
    }

    // Subscribe with VAPID key
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID_PUBLIC_KEY not set in environment variables');
      return null;
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('[Push] Subscribed successfully:', subscription.endpoint);

    // Save subscription to database
    await saveSubscriptionToDatabase(subscription);

    return subscription;
  } catch (error) {
    console.error('[Push] Subscription error:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] No subscription to unsubscribe');
      // Best-effort: if we have a last known endpoint, mark it inactive in DB.
      const lastEndpoint = localStorage.getItem(LAST_ENDPOINT_STORAGE_KEY);
      if (lastEndpoint) {
        try {
          await removePushSubscription(lastEndpoint);
        } catch (e) {
          console.warn('[Push] Failed to deactivate last known subscription in DB:', e);
        }
      }
      return true;
    }

    const successful = await subscription.unsubscribe();
    if (successful) {
      console.log('[Push] Unsubscribed successfully');
      // Remove from database
      await removeSubscriptionFromDatabase(subscription.endpoint);
    }

    return successful;
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return false;
  }
}

/**
 * Check if user is subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('[Push] Check subscription error:', error);
    return false;
  }
}

/**
 * Get current subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Get subscription error:', error);
    return null;
  }
}

/**
 * Save subscription to Supabase database
 */
async function saveSubscriptionToDatabase(subscription: PushSubscription): Promise<void> {
  try {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };

    const result = await savePushSubscription(
      subscriptionData.endpoint,
      subscriptionData.keys.p256dh,
      subscriptionData.keys.auth
    );

    if (!result) {
      throw new Error('Failed to save subscription');
    }

    console.log('[Push] Subscription saved to database');
    localStorage.setItem(LAST_ENDPOINT_STORAGE_KEY, subscriptionData.endpoint);
  } catch (error) {
    console.error('[Push] Save subscription error:', error);
    throw error;
  }
}

/**
 * Remove subscription from database
 */
async function removeSubscriptionFromDatabase(endpoint: string): Promise<void> {
  try {
    const success = await removePushSubscription(endpoint);

    if (!success) {
      throw new Error('Failed to remove subscription');
    }

    console.log('[Push] Subscription removed from database');
    localStorage.setItem(LAST_ENDPOINT_STORAGE_KEY, endpoint);
  } catch (error) {
    console.error('[Push] Remove subscription error:', error);
    throw error;
  }
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check notification permission
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
