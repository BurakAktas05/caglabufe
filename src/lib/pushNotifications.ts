import { PushSubscriptionData } from '@/types';
import { supabase } from './supabase';

const PUSH_STORAGE_KEY = 'caglabufe_push_subscription';

/**
 * Check if Push Notifications and Service Workers are supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        await showLocalNotification(
          '🔔 Sipariş Bildirimleri Aktif!',
          'Tostunuz hazırlandığında ve kuryemiz yola çıktığında anında bildirim alacaksınız.',
          '/',
          'caglabufe-permission-granted'
        );
      } catch {}
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Push] Error requesting permission:', err);
    return false;
  }
}

/**
 * Trigger local notification using active Service Worker registration
 * with timeout resilience and direct Notification API fallback
 */
export async function showLocalNotification(
  title: string,
  body: string,
  url = '/',
  tag = 'caglabufe-local'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  // 1. Try Service Worker showNotification first (standard PWA / Android / iOS 16.4+)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | undefined>((resolve) =>
          setTimeout(() => resolve(undefined), 1000)
        ),
      ]);

      const activeReg = reg || (await navigator.serviceWorker.getRegistration());

      if (activeReg && activeReg.showNotification) {
        await activeReg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/favicon.png',
          vibrate: [250, 100, 250, 100, 350],
          data: { url },
          tag,
          renotify: true,
        } as NotificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('[Push] ServiceWorker showNotification fallback:', err);
    }
  }

  // 2. Direct Window Notification API fallback (Desktop / browser window)
  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag,
      data: { url },
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('[Push] Direct Notification API fallback error:', err);
  }

  return false;
}

/**
 * Convert VAPID base64 public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
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
 * Subscribe browser to Web Push and save subscription
 */
export async function subscribeToPush(
  role: 'admin' | 'customer' = 'customer',
  userId?: string
): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) return null;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    let subscription: PushSubscription | null = null;

    if (vapidPublicKey) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    } else {
      // Local subscription check
      subscription = await registration.pushManager.getSubscription();
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      const pushData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
        },
        role,
        userId,
        createdAt: new Date().toISOString(),
      };

      // Save locally
      localStorage.setItem(PUSH_STORAGE_KEY, JSON.stringify(pushData));

      // Sync to Supabase if connected
      if (supabase) {
        try {
          await supabase.from('push_subscriptions').upsert(
            {
              endpoint: pushData.endpoint,
              p256dh: pushData.keys.p256dh,
              auth: pushData.keys.auth,
              role: pushData.role,
              user_id: pushData.userId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );
        } catch (e) {
          console.warn('[Push] Supabase push_subscriptions sync skipped:', e);
        }
      }

      return pushData;
    }
  } catch (err) {
    console.warn('[Push] Error subscribing to push:', err);
  }

  return null;
}
