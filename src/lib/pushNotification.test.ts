import { describe, expect, test, vi } from 'vitest';

vi.mock('@/data/supabaseQueries', () => ({
  savePushSubscription: vi.fn(async () => ({})),
  removePushSubscription: vi.fn(async () => true),
}));

import {
  getNotificationPermission,
  isPushNotificationSupported,
  getCurrentSubscription,
  unsubscribeFromPushNotifications,
} from '@/lib/pushNotification';

describe('pushNotification (production vital paths)', () => {
  test('isPushNotificationSupported false when missing primitives', () => {
    // In jsdom, serviceWorker/PushManager often not present.
    expect(isPushNotificationSupported()).toBe(false);
  });

  test('getNotificationPermission returns denied when Notification missing', async () => {
    const prev = (globalThis as any).Notification;
    // remove
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).Notification;
    try {
      expect(await getNotificationPermission()).toBe('denied');
    } finally {
      (globalThis as any).Notification = prev;
    }
  });

  test('getCurrentSubscription returns null on error', async () => {
    const prev = (globalThis as any).navigator?.serviceWorker;
    (globalThis as any).navigator.serviceWorker = { ready: Promise.reject(new Error('x')) };
    try {
      expect(await getCurrentSubscription()).toBeNull();
    } finally {
      (globalThis as any).navigator.serviceWorker = prev;
    }
  });

  test('unsubscribe returns true when no subscription', async () => {
    const prev = (globalThis as any).navigator?.serviceWorker;
    (globalThis as any).navigator.serviceWorker = {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: async () => null,
        },
      }),
    };
    try {
      expect(await unsubscribeFromPushNotifications()).toBe(true);
    } finally {
      (globalThis as any).navigator.serviceWorker = prev;
    }
  });
});

