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
    return permission === 'granted';
  } catch (err) {
    console.warn('[Push] Error requesting permission:', err);
    return false;
  }
}

/**
 * Trigger local notification using active Service Worker registration
 */
export async function showLocalNotification(
  title: string,
  body: string,
  url = '/',
  tag = 'caglabufe-local'
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration && registration.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        data: { url },
        tag,
      } as NotificationOptions);
      return true;
    }
  } catch (err) {
    console.warn('[Push] Error showing local notification:', err);
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
