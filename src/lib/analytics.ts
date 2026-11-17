// Google Analytics 4 (GA4) Client-side Tracking & Session Metrics
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-VB3EM1H0BV';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Track a generic GA4 event
export const trackEvent = (action: string, params: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', action, params);
  } catch (err) {
    console.debug('[Analytics] Event tracking error:', err);
  }
};

// Track Page View
export const trackPageView = (url: string) => {
  trackEvent('page_view', {
    page_location: url,
    page_title: typeof document !== 'undefined' ? document.title : '',
  });
};

// Track Add to Cart
export const trackAddToCart = (productName: string, price: number, quantity: number = 1) => {
  trackEvent('add_to_cart', {
    currency: 'TRY',
    value: price * quantity,
    items: [
      {
        item_name: productName,
        price: price,
        quantity: quantity,
      },
    ],
  });
};

// Track Begin Checkout
export const trackBeginCheckout = (cartTotal: number, itemCount: number) => {
  trackEvent('begin_checkout', {
    currency: 'TRY',
    value: cartTotal,
    items_count: itemCount,
  });
};

// Track Purchase
export const trackPurchase = (orderNumber: string, finalAmount: number, itemsCount: number) => {
  trackEvent('purchase', {
    transaction_id: orderNumber,
    currency: 'TRY',
    value: finalAmount,
    items_count: itemsCount,
  });
};

// --- In-App Visitor & Duration Tracker for Admin Dashboard ---
const ANALYTICS_STORAGE_KEY = 'caglabufe_analytics_daily_v1';
const SESSION_START_KEY = 'caglabufe_session_start_time';
const VISITOR_ID_KEY = 'caglabufe_visitor_uuid';

export interface DailyVisitorStats {
  date: string; // YYYY-MM-DD
  totalVisitors: number;
  turkeyVisitors: number;
  internationalVisitors: number;
  totalDurationSeconds: number;
  sessionsCount: number;
  pageViews: number;
  deviceMobile: number;
  deviceDesktop: number;
}

// Initialize session tracking on client side
export const initSessionTracking = () => {
  if (typeof window === 'undefined') return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    let stats: DailyVisitorStats = raw
      ? JSON.parse(raw)
      : {
          date: today,
          totalVisitors: 0,
          turkeyVisitors: 0,
          internationalVisitors: 0,
          totalDurationSeconds: 0,
          sessionsCount: 0,
          pageViews: 0,
          deviceMobile: 0,
          deviceDesktop: 0,
        };

    // If day changed, roll over
    if (stats.date !== today) {
      stats = {
        date: today,
        totalVisitors: 0,
        turkeyVisitors: 0,
        internationalVisitors: 0,
        totalDurationSeconds: 0,
        sessionsCount: 0,
        pageViews: 0,
        deviceMobile: 0,
        deviceDesktop: 0,
      };
    }

    // Check if new visitor or returning today
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    const isNewVisitor = !visitorId;
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    const sessionKey = `caglabufe_visited_${today}`;
    const hasVisitedToday = sessionStorage.getItem(sessionKey);

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    // Detect timezone or language for Turkey check
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || '';
    const isTurkey =
      timeZone.includes('Istanbul') ||
      timeZone.includes('Turkey') ||
      lang.toLowerCase().includes('tr');

    if (!hasVisitedToday) {
      sessionStorage.setItem(sessionKey, '1');
      stats.totalVisitors += 1;
      stats.sessionsCount += 1;
      if (isTurkey) {
        stats.turkeyVisitors += 1;
      } else {
        stats.internationalVisitors += 1;
      }

      if (isMobile) {
        stats.deviceMobile += 1;
      } else {
        stats.deviceDesktop += 1;
      }
    }

    stats.pageViews += 1;
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stats));

    // Session duration tracker
    const sessionStartTime = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, sessionStartTime.toString());

    // Update duration on unload or every 30 seconds
    const interval = setInterval(() => {
      updateDuration();
    }, 30000);

    const updateDuration = () => {
      try {
        const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0', 10);
        if (start > 0) {
          const elapsedSeconds = Math.round((Date.now() - start) / 1000);
          if (elapsedSeconds > 0 && elapsedSeconds < 7200) {
            // max 2 hours per session to prevent outliers
            const currentRaw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
            if (currentRaw) {
              const currentStats: DailyVisitorStats = JSON.parse(currentRaw);
              if (currentStats.date === today) {
                // Add delta
                currentStats.totalDurationSeconds += 30;
                localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(currentStats));
              }
            }
          }
        }
      } catch {}
    };

    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      updateDuration();
    });
  } catch (err) {
    console.debug('[Analytics init error]:', err);
  }
};

// Retrieve daily stats for Admin Panel
export const getDailyVisitorStats = (): DailyVisitorStats => {
  if (typeof window === 'undefined') {
    return {
      date: new Date().toISOString().slice(0, 10),
      totalVisitors: 0,
      turkeyVisitors: 0,
      internationalVisitors: 0,
      totalDurationSeconds: 0,
      sessionsCount: 0,
      pageViews: 0,
      deviceMobile: 0,
      deviceDesktop: 0,
    };
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) {
      const parsed: DailyVisitorStats = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch {}

  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    totalVisitors: 1,
    turkeyVisitors: 1,
    internationalVisitors: 0,
    totalDurationSeconds: 180,
    sessionsCount: 1,
    pageViews: 1,
    deviceMobile: 1,
    deviceDesktop: 0,
  };
};
