import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import NotificationToggle from '@/components/notifications/NotificationToggle';
import { I18nProvider } from '@/lib/i18n';

declare global {
  // eslint-disable-next-line no-var
  var Notification: any;
}

const toastSpy = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/lib/pushNotification', () => ({
  isPushNotificationSupported: vi.fn(),
  getNotificationPermission: vi.fn(),
  getCurrentSubscription: vi.fn(),
  subscribeToPushNotifications: vi.fn(),
  unsubscribeFromPushNotifications: vi.fn(),
}));

import * as pushNotification from '@/lib/pushNotification';

describe('NotificationToggle (prod logic)', () => {
  test('blocked toast on toggle when permission denied', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('denied' as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  test('unsubscribe failure shows destructive toast', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('granted' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue({ endpoint: 'x' } as any);
    vi.mocked(pushNotification.unsubscribeFromPushNotifications).mockResolvedValue(false as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
  });

  test('permission default but user does not grant -> toast and no subscribe call', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('default' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue(null as any);
    vi.mocked(pushNotification.subscribeToPushNotifications).mockResolvedValue({ endpoint: 'x' } as any);

    globalThis.Notification = {
      requestPermission: vi.fn(async () => 'denied'),
    };

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    expect(pushNotification.subscribeToPushNotifications).not.toHaveBeenCalled();
  });

  test('subscribe failure shows destructive toast', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('granted' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue(null as any);
    vi.mocked(pushNotification.subscribeToPushNotifications).mockResolvedValue(null as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
  });

  test('subscribe path requests permission when default', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('default' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue(null as any);
    vi.mocked(pushNotification.subscribeToPushNotifications).mockResolvedValue({ endpoint: 'x' } as any);

    globalThis.Notification = {
      requestPermission: vi.fn(async () => 'granted'),
    };

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(globalThis.Notification.requestPermission).toHaveBeenCalledTimes(1);
      expect(pushNotification.subscribeToPushNotifications).toHaveBeenCalledTimes(1);
    });
  });

  test('renders null when push not supported', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(false);

    const { container } = render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(container).toBeTruthy();
    });
    expect(container.textContent).toBe('');
  });

  test('shows blocked when permission denied', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('denied' as any);

    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    // wait initial refreshStatus
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/blocked|diblokir/i)
    );
  });

  test('toggles unsubscribe path when really active', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('granted' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue({ endpoint: 'x' } as any);
    vi.mocked(pushNotification.unsubscribeFromPushNotifications).mockResolvedValue(true as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(pushNotification.unsubscribeFromPushNotifications).toHaveBeenCalledTimes(1);
    });
  });

  test('subscribe success shows success toast', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('granted' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue(null as any);
    vi.mocked(pushNotification.subscribeToPushNotifications).mockResolvedValue({ endpoint: 'x' } as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
  });

  test('catch path shows error toast when permission check throws', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    vi.mocked(pushNotification.getNotificationPermission).mockResolvedValue('granted' as any);
    vi.mocked(pushNotification.getCurrentSubscription).mockResolvedValue(null as any);
    vi.mocked(pushNotification.subscribeToPushNotifications).mockRejectedValue(new Error('boom') as any);

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
  });

  test('click does nothing while loading (guard)', async () => {
    toastSpy.mockClear();
    vi.mocked(pushNotification.isPushNotificationSupported).mockReturnValue(true);
    // make refreshStatus hang so isLoading stays true
    vi.mocked(pushNotification.getNotificationPermission).mockImplementation(
      () => new Promise(() => {})
    );

    const user = userEvent.setup();
    render(
      <I18nProvider>
        <NotificationToggle />
      </I18nProvider>
    );

    // Force-enable button (in UI it is disabled while loading),
    // to directly exercise the early-return guard in handleToggle.
    const btn = screen.getByRole('button') as HTMLButtonElement;
    btn.disabled = false;
    btn.removeAttribute('disabled');
    await user.click(btn);
    expect(pushNotification.getCurrentSubscription).not.toHaveBeenCalled();
  });
});

