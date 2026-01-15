import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribed,
  isPushNotificationSupported,
  getNotificationPermission,
} from '@/lib/pushNotification';
import { useToast } from '@/hooks/use-toast';

export default function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    const permission = await getNotificationPermission();
    if (permission === 'denied') {
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }

    const subscribed = await isSubscribed();
    setIsEnabled(subscribed);
    setIsLoading(false);
  };

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isEnabled) {
        // Unsubscribe
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsEnabled(false);
          toast({
            title: 'Notifikasi Dimatikan',
            description: 'Anda tidak akan menerima notifikasi prakiraan baru',
          });
        } else {
          toast({
            title: 'Gagal',
            description: 'Gagal mematikan notifikasi',
            variant: 'destructive',
          });
        }
      } else {
        // Subscribe
        const permission = await getNotificationPermission();
        
        if (permission === 'denied') {
          toast({
            title: 'Izin Ditolak',
            description: 'Silakan aktifkan izin notifikasi di pengaturan browser',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (permission === 'default') {
          // Request permission first
          const newPermission = await Notification.requestPermission();
          if (newPermission !== 'granted') {
            toast({
              title: 'Izin Ditolak',
              description: 'Notifikasi memerlukan izin untuk berfungsi',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        }

        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsEnabled(true);
          toast({
            title: 'Notifikasi Diaktifkan',
            description: 'Anda akan menerima notifikasi saat prakiraan baru tersedia',
          });
        } else {
          toast({
            title: 'Gagal',
            description: 'Gagal mengaktifkan notifikasi. Pastikan VAPID key sudah dikonfigurasi',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('[Notification] Toggle error:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat mengubah pengaturan notifikasi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      aria-label={isEnabled ? 'Matikan notifikasi' : 'Aktifkan notifikasi'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
          <span>Memproses...</span>
        </>
      ) : isEnabled ? (
        <>
          <Bell className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>Notifikasi Aktif</span>
        </>
      ) : (
        <>
          <BellOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>Aktifkan Notifikasi</span>
        </>
      )}
    </Button>
  );
}
