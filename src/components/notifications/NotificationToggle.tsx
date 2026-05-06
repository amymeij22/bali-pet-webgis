import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSupported,
  getNotificationPermission,
  getCurrentSubscription,
} from '@/lib/pushNotification';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';

type NotifStatus = 'active' | 'inactive' | 'blocked';

export default function NotificationToggle() {
  const { t } = useI18n();
  const [status, setStatus] = useState<NotifStatus>('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    void refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setIsLoading(true);
    
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    const permission = await getNotificationPermission();
    if (permission === 'denied') {
      setStatus('blocked');
      setIsLoading(false);
      return;
    }

    const sub = await getCurrentSubscription();
    setStatus(sub ? 'active' : 'inactive');
    setIsLoading(false);
  };

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      // Always re-check real state before toggling (avoids stale UI).
      const permission = await getNotificationPermission();
      if (permission === 'denied') {
        setStatus('blocked');
        toast({
          title: t('toast_perm_denied_title'),
          description: t('toast_perm_denied_desc'),
          variant: 'destructive',
        });
        return;
      }

      const currentSub = await getCurrentSubscription();
      const isReallyActive = !!currentSub && permission === 'granted';

      if (isReallyActive) {
        // Unsubscribe
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          toast({
            title: t('toast_notif_disabled_title'),
            description: t('toast_notif_disabled_desc'),
          });
        } else {
          toast({
            title: t('toast_failed_title'),
            description: t('toast_failed_disable_desc'),
            variant: 'destructive',
          });
        }
      } else {
        // Subscribe
        if (permission === 'default') {
          // Request permission first
          const newPermission = await Notification.requestPermission();
          if (newPermission !== 'granted') {
            toast({
              title: t('toast_perm_denied_title'),
              description: t('toast_perm_required_desc'),
              variant: 'destructive',
            });
            return;
          }
        }

        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          toast({
            title: t('toast_notif_enabled_title'),
            description: t('toast_notif_enabled_desc'),
          });
        } else {
          toast({
            title: t('toast_failed_title'),
            description: t('toast_failed_enable_desc'),
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('[Notification] Toggle error:', error);
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_desc'),
        variant: 'destructive',
      });
    } finally {
      await refreshStatus();
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-1.5 h-7 px-2 text-[10px] sm:text-xs whitespace-nowrap"
      aria-label={
        status === 'blocked'
          ? t('notif_aria_blocked')
          : status === 'active'
            ? t('notif_aria_disable')
            : t('notif_aria_enable')
      }
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
          <span>{t('notif_processing')}</span>
        </>
      ) : status === 'active' ? (
        <>
          <Bell className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>{t('notif_active')}</span>
        </>
      ) : status === 'blocked' ? (
        <>
          <BellOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>{t('notif_blocked')}</span>
        </>
      ) : (
        <>
          <BellOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>{t('notif_enable')}</span>
        </>
      )}
    </Button>
  );
}
