'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { Product, CartItem, UserProfile, Address, Order, OrderStatus, PaymentMethod, SystemSettings, Campaign, BannedUser, Coupon } from '@/types';
import { Locale, DEFAULT_LOCALE, getTranslation } from '@/lib/i18n';
import { audioAlert } from '@/lib/audioAlert';
import { showLocalNotification, requestNotificationPermission } from '@/lib/pushNotifications';
import {
  getStoredOrders,
  saveOrder,
  subscribeToOrders,
  isPhoneBanned,
  getBannedUserInfo,
  fetchBannedUsers,
  getStoredProducts,
  fetchProducts,
  fetchOrders,
  fetchCustomerOrders,
  subscribeToProducts,
  supabase,
  isSupabaseConfigured,
} from '@/lib/supabase';
import {
  getSystemSettings,
  fetchSystemSettings,
  subscribeToSettings,
  getZoneForAddress,
  calculateDeliveryForZone,
  calculateCampaignDiscount,
  evaluateSingleBestCampaign,
  hasActiveFreeDeliveryCampaign,
  getCampaigns,
  fetchCampaignsFromSupabase,
  subscribeToCampaigns,
  getActiveCampaigns,
  getActiveBundleDeals,
  isStoreOpen,
  formatTemplate,
  getCoupons,
  validateCoupon,
  getDormitories,
} from '@/lib/settingsManager';
import confetti from 'canvas-confetti';
import {
  sanitizeInput,
  normalizePhoneNumber,
  checkOrderRateLimit,
  validateCartIntegrity,
} from '@/lib/security';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, options?: Record<string, string>, note?: string) => void;
  removeFromCart: (productId: string) => void;
  deleteItemFromCart: (productId: string) => void;
  clearCart: () => void;
  reorderItems: (items: Order['items']) => void;
  getMaxQuantityForProduct: (product: Product) => number;
  cartTotal: number;
  itemCount: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  discountAmount: number;
  appliedCampaignTitle: string | null;
  appliedCampaignDescription?: string | null;
  isFreeDeliveryCampaign?: boolean;
  isBundleCampaignApplied?: boolean;
  finalTotal: number;

  // Coupons & VIP Rewards
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  coupons: Coupon[];

  // Products & Dynamic Settings
  products: Product[];
  refreshProducts: () => void;
  systemSettings: SystemSettings;

  // Campaigns & Promotions (Realtime Supabase Sync)
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  bundleDeals: Campaign[];
  refreshCampaigns: () => Promise<void>;

  // User & Auth
  user: UserProfile | null;
  loginUser: (fullName: string, phone: string, initialAddresses?: Address[]) => void;
  logoutUser: () => void;

  // Addresses
  addresses: Address[];
  selectedAddress: Address | null;
  saveNewAddress: (address: Omit<Address, 'id'>) => Address;
  deleteAddress: (addressId: string) => void;
  setSelectedAddressId: (addressId: string) => void;

  // Orders & Realtime
  orders: Order[];
  placeOrder: (paymentMethod: PaymentMethod, note?: string) => Promise<Order | null>;
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: (order: Order | null) => void;

  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  bannedModalInfo: BannedUser | null;
  setBannedModalInfo: (info: BannedUser | null) => void;

  // i18n Multi-Language
  locale: Locale;
  setLocale: (loc: Locale) => void;
  isLanguageWelcomeOpen: boolean;
  setIsLanguageWelcomeOpen: (open: boolean) => void;
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => string;
  dir: 'ltr' | 'rtl';

  // Store status
  storeOpen: boolean;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'caglabufe_user_profile';
const ADDRESSES_STORAGE_KEY = 'caglabufe_addresses';
const SELECTED_ADDRESS_KEY = 'caglabufe_selected_address_id';
const CART_STORAGE_KEY = 'caglabufe_cart';
const CUSTOMER_ORDERS_KEY = 'caglabufe_customer_order_ids_v1';

function getCustomerOrderIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOMER_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordCustomerOrderId(orderId: string) {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const ids = getCustomerOrderIds();
    if (!ids.includes(orderId)) {
      ids.push(orderId);
      localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(ids));
    }
  } catch {}
}

const DEFAULT_KARABUK_ADDRESS: Address = {
  id: 'default-kyk-address',
  type: 'dormitory',
  title: 'KYK Hubbi Hatun Kız Yurdu',
  dormName: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
  district: 'Demir Çelik Kampüsü',
  deliveryPresetNote: 'Yurdun önünde teslim alacağım (gelince arayınız)',
  isDefault: true,
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [bannedModalInfo, setBannedModalInfo] = useState<BannedUser | null>(null);
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isLanguageWelcomeOpen, setIsLanguageWelcomeOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caglabufe_locale') as Locale;
      const hasSelected = localStorage.getItem('caglabufe_lang_selected');
      if (saved && ['tr', 'en', 'ru', 'ar', 'fr'].includes(saved)) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      }
      // First-time visitor on this device: prompt language selection modal
      if (!hasSelected) {
        setIsLanguageWelcomeOpen(true);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caglabufe_locale', newLocale);
      localStorage.setItem('caglabufe_lang_selected', 'true');
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr';
  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => getTranslation(locale, key, fallbackOrParams, params);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressIdState] = useState<string>('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };
  const [storeOpen, setStoreOpen] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(getSystemSettings);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [campaigns, setCampaigns] = useState<Campaign[]>(getCampaigns);
  const [coupons, setCoupons] = useState<Coupon[]>(getCoupons);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const lastKnownStatusRef = useRef<Record<string, OrderStatus>>({});

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const systemSettingsRef = useRef(systemSettings);
  useEffect(() => { systemSettingsRef.current = systemSettings; }, [systemSettings]);

  const activeTrackingOrderRef = useRef(activeTrackingOrder);
  useEffect(() => { activeTrackingOrderRef.current = activeTrackingOrder; }, [activeTrackingOrder]);

  const refreshProducts = () => {
    setProducts(getStoredProducts());
  };

  const activeCampaigns = useMemo(() => getActiveCampaigns(campaigns), [campaigns]);
  const bundleDeals = useMemo(() => getActiveBundleDeals(campaigns), [campaigns]);

  const refreshCampaigns = async () => {
    const live = await fetchCampaignsFromSupabase();
    if (Array.isArray(live)) setCampaigns(live);
  };

  const setSelectedAddressId = (id: string) => {
    setSelectedAddressIdState(id);
    try {
      localStorage.setItem(SELECTED_ADDRESS_KEY, id);
    } catch {
      // ignore
    }
  };

  // Helper to trigger rich PWA push notification and audio/vibration for this customer
  const handleOrderNotification = (updatedOrder: Order, prevStatus?: OrderStatus) => {
    // Never trigger customer push alerts if on admin dashboard
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }

    const currentUser = userRef.current;
    const currentSettings = systemSettingsRef.current;
    const currentActiveOrder = activeTrackingOrderRef.current;

    const myOrderIds = getCustomerOrderIds();
    const isMyOrder =
      myOrderIds.includes(updatedOrder.id) ||
      (currentUser && currentUser.phone && normalizePhoneNumber(currentUser.phone) === normalizePhoneNumber(updatedOrder.customerPhone)) ||
      (currentUser && currentUser.id && currentUser.id === updatedOrder.userId) ||
      (currentActiveOrder && currentActiveOrder.id === updatedOrder.id);

    if (!isMyOrder) return;

    recordCustomerOrderId(updatedOrder.id);

    // Only notify if status actually changed
    if (prevStatus && prevStatus !== updatedOrder.status) {
      let title = `Sipariş #${updatedOrder.orderNumber} Güncellendi`;
      let body = `Siparişinizin yeni durumu: ${getStatusLabel(updatedOrder.status)}`;

      if (updatedOrder.status === 'preparing') {
        title = `👨‍🍳 Siparişiniz Hazırlanıyor! #${updatedOrder.orderNumber}`;
        body = currentSettings.templateOrderPreparing
          ? formatTemplate(currentSettings.templateOrderPreparing, {
              orderNumber: updatedOrder.orderNumber,
              customerName: updatedOrder.customerName,
            })
          : 'Siparişiniz paketleniyor, ürünleriniz özenle hazırlanıyor.';
      } else if (updatedOrder.status === 'on_the_way') {
        title = `🛵 Kuryemiz Yola Çıktı! #${updatedOrder.orderNumber}`;
        body = currentSettings.templateOrderOnTheWay
          ? formatTemplate(currentSettings.templateOrderOnTheWay, {
              orderNumber: updatedOrder.orderNumber,
              customerName: updatedOrder.customerName,
            })
          : 'Kuryemiz siparişinizi teslim etmek üzere yola çıktı!';
      } else if (updatedOrder.status === 'delivered') {
        title = `✅ Siparişiniz Teslim Edildi! #${updatedOrder.orderNumber}`;
        body = currentSettings.templateOrderDelivered
          ? formatTemplate(currentSettings.templateOrderDelivered, {
              orderNumber: updatedOrder.orderNumber,
              customerName: updatedOrder.customerName,
            })
          : 'Siparişiniz teslim edildi. Afiyet olsun, Çağla Büfe keyifli anlar diler!';
      } else if (updatedOrder.status === 'cancelled') {
        title = `❌ Sipariş İptal Edildi #${updatedOrder.orderNumber}`;
        body = 'Siparişiniz iptal edildi. Bilgi için büfe ile iletişime geçebilirsiniz.';
      }

      // 1. Dual-tone status audio chime & haptic feedback
      audioAlert.playStatusUpdateSound();

      // 2. Hardware vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([250, 100, 250, 100, 350]);
        } catch {}
      }

      // 3. PWA device notification (lockscreen / notification tray)
      showLocalNotification(
        title,
        body,
        '/',
        `caglabufe-order-${updatedOrder.id}`
      );

      // 4. In-app toast banner
      showToast(
        body ? `${title} • ${body}` : title,
        updatedOrder.status === 'delivered' ? 'success' : updatedOrder.status === 'cancelled' ? 'error' : 'info'
      );
    }
  };

  // Load initial state & subscriptions
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));

      const storedAddresses = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      if (storedAddresses) {
        let parsed: Address[] = JSON.parse(storedAddresses);
        if (Array.isArray(parsed)) {
          // Purge legacy default dummy address and unconfigured placeholder
          parsed = parsed.filter(
            (a) =>
              a.id !== 'default-kyk-address' &&
              a.fullAddress !== 'Haritada Seçilen Konum'
          );
          if (parsed.length > 0) {
            setAddresses(parsed);
            const savedSel = localStorage.getItem(SELECTED_ADDRESS_KEY);
            const exists = parsed.some((a) => a.id === savedSel);
            setSelectedAddressIdState(exists && savedSel ? savedSel : parsed[0].id);
          } else {
            setAddresses([]);
            setSelectedAddressIdState('');
            localStorage.removeItem(ADDRESSES_STORAGE_KEY);
            localStorage.removeItem(SELECTED_ADDRESS_KEY);
          }
        }
      }

      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) setCart(JSON.parse(storedCart));

      const myOrderIds = getCustomerOrderIds();
      const customerOrders = getStoredOrders().filter((o) => myOrderIds.includes(o.id));
      setOrders(customerOrders);
      customerOrders.forEach((o) => {
        lastKnownStatusRef.current[o.id] = o.status;
      });

      // İlk açılışta müşterinin siparişlerini Supabase'den canlı çek
      if (myOrderIds.length > 0) {
        fetchCustomerOrders(myOrderIds).then((latest) => {
          if (Array.isArray(latest) && latest.length > 0) {
            setOrders(latest);
            latest.forEach((o) => {
              lastKnownStatusRef.current[o.id] = o.status;
            });
            const active = latest.find(
              (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way'
            );
            if (active) {
              setActiveTrackingOrder(active);
            }
          }
        });
      }

      setSystemSettings(getSystemSettings());
      setProducts(getStoredProducts());
      setCampaigns(getCampaigns());

      // Fetch live product updates from Supabase
      fetchProducts().then((live) => {
        if (live && live.length > 0) setProducts(live);
      });

      // Fetch live system settings from Supabase
      fetchSystemSettings().then((liveSettings) => {
        if (liveSettings) {
          setSystemSettings(liveSettings);
          setStoreOpen(isStoreOpen(liveSettings));
        }
      });

      // Fetch live campaigns from Supabase
      fetchCampaignsFromSupabase().then((liveCampaigns) => {
        if (Array.isArray(liveCampaigns)) setCampaigns(liveCampaigns);
      });
    } catch {
      // ignore
    }

    // Store open check
    setStoreOpen(isStoreOpen());

    // Subscribe to dynamic settings changes from admin
    const unsubSettings = subscribeToSettings((newSettings) => {
      setSystemSettings(newSettings);
      setStoreOpen(isStoreOpen(newSettings));
    });

    // Subscribe to dynamic product updates from admin
    const unsubProducts = subscribeToProducts((newProducts) => {
      setProducts(newProducts);
    });

    // Subscribe to dynamic campaigns updates from Supabase Realtime
    const unsubCampaigns = subscribeToCampaigns((newCampaigns) => {
      setCampaigns(newCampaigns);
    });

    // Active polling fallback for mobile devices where WebSockets might pause in background
    const interval = setInterval(() => {
      setStoreOpen(isStoreOpen());
      fetchSystemSettings().then((latest) => {
        if (latest) {
          setSystemSettings(latest);
          setStoreOpen(isStoreOpen(latest));
        }
      });
      fetchCampaignsFromSupabase().then((latest) => {
        if (Array.isArray(latest)) {
          setCampaigns(latest);
        }
      });

      // Background order status sync for mobile devices
      const myIds = getCustomerOrderIds();
      if (myIds.length > 0) {
        fetchCustomerOrders(myIds).then((latestOrders) => {
          if (Array.isArray(latestOrders)) {
            latestOrders.forEach((o) => {
              const prev = lastKnownStatusRef.current[o.id];
              if (prev && prev !== o.status) {
                lastKnownStatusRef.current[o.id] = o.status;
                handleOrderNotification(o, prev);
              } else if (!prev) {
                lastKnownStatusRef.current[o.id] = o.status;
              }
            });
            setOrders(latestOrders);
          }
        });
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      unsubSettings();
      unsubProducts();
      unsubCampaigns();
    };
  }, []);

  // Oturumu açık kullanıcının kara listede olup olmadığını kontrol et (Giriş, açılış, Supabase çekimi & anlık yayınlar)
  useEffect(() => {
    const checkBanForUser = (targetPhone?: string) => {
      const phoneToCheck = targetPhone || user?.phone;
      if (!phoneToCheck) return;
      const clean = normalizePhoneNumber(phoneToCheck);
      if (isPhoneBanned(clean)) {
        const info = getBannedUserInfo(clean);
        setBannedModalInfo(
          info || {
            id: 'ban_' + clean,
            phone: clean,
            name: user?.fullName || 'Müşteri',
            reason: 'Kötü niyetli sipariş / Güvenlik ihlali',
            bannedAt: new Date().toISOString(),
          }
        );
      }
    };

    // 1. Yerel veriden anlık kontrol et
    checkBanForUser();

    // 2. Uzak Supabase kara listesini arka planda senkronize et
    fetchBannedUsers().then((list) => {
      if (!user?.phone) return;
      const clean = normalizePhoneNumber(user.phone);
      const match = list.find((b) => normalizePhoneNumber(b.phone) === clean);
      if (match) {
        setBannedModalInfo(match);
      }
    }).catch(() => {});

    // 3. Sekmeler & pencereler arası anlık senkronizasyon dinleyicileri
    const handleCustomBanned = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: 'BAN' | 'UNBAN'; ban?: BannedUser; phone?: string }>;
      if (!customEvent.detail) return;
      if (customEvent.detail.type === 'BAN' && customEvent.detail.ban) {
        if (user?.phone && normalizePhoneNumber(customEvent.detail.ban.phone) === normalizePhoneNumber(user.phone)) {
          setBannedModalInfo(customEvent.detail.ban);
        }
      } else if (customEvent.detail.type === 'UNBAN' && customEvent.detail.phone) {
        if (user?.phone && normalizePhoneNumber(customEvent.detail.phone) === normalizePhoneNumber(user.phone)) {
          setBannedModalInfo(null);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'caglabufe_banned_users_v1') {
        checkBanForUser();
      }
    };

    window.addEventListener('caglabufe_banned_event', handleCustomBanned);
    window.addEventListener('storage', handleStorageChange);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('caglabufe_security_channel');
        bc.onmessage = (msgEvent) => {
          const data = msgEvent.data;
          if (data?.type === 'BAN' && data.ban) {
            if (user?.phone && normalizePhoneNumber(data.ban.phone) === normalizePhoneNumber(user.phone)) {
              setBannedModalInfo(data.ban);
            }
          } else if (data?.type === 'UNBAN' && data.phone) {
            if (user?.phone && normalizePhoneNumber(data.phone) === normalizePhoneNumber(user.phone)) {
              setBannedModalInfo(null);
            }
          }
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('caglabufe_banned_event', handleCustomBanned);
      window.removeEventListener('storage', handleStorageChange);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [user]);

  // Realtime order updates & status notifications (single stable subscription)
  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrder) => {
      const prevStatus = lastKnownStatusRef.current[updatedOrder.id];
      lastKnownStatusRef.current[updatedOrder.id] = updatedOrder.status;

      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === updatedOrder.id);
        if (index > -1) {
          const next = [...prev];
          next[index] = updatedOrder;
          return next;
        }
        return [updatedOrder, ...prev];
      });

      setActiveTrackingOrder((current) => {
        if (current && current.id === updatedOrder.id) {
          return updatedOrder;
        }
        return current;
      });

      if (prevStatus && prevStatus !== updatedOrder.status) {
        handleOrderNotification(updatedOrder, prevStatus);
      }
    });

    // Catch background updates on mobile tab focus or screen unlock
    const syncLatest = async () => {
      try {
        const myIds = getCustomerOrderIds();
        if (myIds.length > 0) {
          const latestOrders = await fetchCustomerOrders(myIds);
          if (Array.isArray(latestOrders)) {
            latestOrders.forEach((o) => {
              const prevStatus = lastKnownStatusRef.current[o.id];
              if (prevStatus && prevStatus !== o.status) {
                lastKnownStatusRef.current[o.id] = o.status;
                handleOrderNotification(o, prevStatus);
              } else {
                lastKnownStatusRef.current[o.id] = o.status;
              }
            });
            setOrders(latestOrders);
          }
        }
      } catch {}
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncLatest();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncLatest);

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncLatest);
    };
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Live Cart Validation: Auto-sync cart items with live database products (price changes, stock availability, removed items)
  useEffect(() => {
    if (products.length === 0 || cart.length === 0) return;

    setCart((prevCart) => {
      let changed = false;
      const validItems: CartItem[] = [];
      const removedNames: string[] = [];

      for (const item of prevCart) {
        if (item.product.id.startsWith('bundle_')) {
          validItems.push(item);
          continue;
        }

        const live = products.find((p) => p.id === item.product.id);
        if (!live) {
          changed = true;
          removedNames.push(item.product.name);
          continue;
        }

        const priceChanged =
          live.price !== item.product.price ||
          live.discountPrice !== item.product.discountPrice;
        const availChanged = live.isAvailable !== item.product.isAvailable;
        const nameChanged = live.name !== item.product.name;

        if (priceChanged || availChanged || nameChanged) {
          changed = true;
          validItems.push({
            ...item,
            product: live,
          });
        } else {
          validItems.push(item);
        }
      }

      if (removedNames.length > 0) {
        showToast(
          `Katalogda artık yer almayan ${removedNames.join(', ')} sepetinizden çıkarıldı.`,
          'warning'
        );
      }

      return changed ? validItems : prevCart;
    });
  }, [products]);

  // --- ÜRÜN BAŞINA MAKSİMUM ADET LİMİTİ ---
  const getMaxQuantityForProduct = (product: Product): number => {
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    // Litrelik kolalar ve büyük şişe içecekler: max 2
    if (cat === 'kola' || cat === 'soda' || cat === 'gazoz' || cat === 'limonata' || cat === 'su'
      || cat === 'diğer gazlı i̇çecek' || cat === 'diğer gazsız i̇çecek' || cat === 'malt i̇çecek'
      || cat === 'ramazan şerbeti') {
      // Litrelik / büyük şişeler: max 2, kutu/küçük olanlar: max 3
      if (name.includes('litre') || name.includes('lt') || name.includes('1l') || name.includes('1,5') || name.includes('2,5')) {
        return 2;
      }
      return 3;
    }

    // Çikolatalar: max 10
    if (cat === 'çikolata' || cat === 'sürülebilir çikolata' || cat === 'sıcak çikolata') {
      return 10;
    }

    // Cipsler: max 5
    if (cat === 'cips') {
      return 5;
    }

    // Enerji içecekleri: max 3
    if (cat === 'enerji i̇çeceği') {
      return 3;
    }

    // Meyve suyu, soğuk çay, ayran, soğuk kahve: max 3
    if (cat === 'meyve suyu' || cat === 'soğuk çay' || cat === 'ayran' || cat === 'soğuk kahve' || cat === 'aromalı süt') {
      return 3;
    }

    // Diğer tüm ürünler: max 3
    return 3;
  };

  // --- CART ---
  const addToCart = (product: Product, options?: Record<string, string>, note?: string) => {
    if (!product.isAvailable) {
      showToast('Bu ürün şu an stokta bulunmuyor.', 'warning');
      return;
    }

    // Miktar limiti kontrolü
    const maxQty = getMaxQuantityForProduct(product);
    const existingItem = cart.find((item) => item.product.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    if (currentQty >= maxQty) {
      showToast(`Bu üründen en fazla ${maxQty} adet ekleyebilirsiniz.`, 'warning');
      return;
    }

    audioAlert.playCartClickSound();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(35); } catch {}
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prev, { product, quantity: 1, selectedOptions: options, itemNote: note }];
    });

    showToast(`${product.name} sepete eklendi`, 'success');
  };

  const removeFromCart = (productId: string) => {
    audioAlert.playCartClickSound();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const deleteItemFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const reorderItems = (orderItems: Order['items']) => {
    if (!orderItems || orderItems.length === 0) return;
    let addedCount = 0;
    const currentProducts = products.length > 0 ? products : getStoredProducts();

    setCart((prev) => {
      const updated = [...prev];
      for (const item of orderItems) {
        const anyItem = item as any;
        const targetId = item.productId || anyItem.product?.id || anyItem.id;
        const targetName = (item.productName || anyItem.product?.name || anyItem.name || '').trim().toLowerCase();
        const quantity = Number(item.quantity !== undefined ? item.quantity : anyItem.count ?? 1);
        const safeQty = isNaN(quantity) || quantity <= 0 ? 1 : quantity;

        const prod = currentProducts.find(
          (p) => (targetId && p.id === targetId) || (targetName && p.name.trim().toLowerCase() === targetName)
        );
        if (prod && prod.isAvailable) {
          const existingIdx = updated.findIndex((i) => i.product.id === prod.id);
          if (existingIdx > -1) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + safeQty,
            };
          } else {
            updated.push({
              product: prod,
              quantity: safeQty,
              selectedOptions: item.selectedOptions,
            });
          }
          addedCount += safeQty;
        }
      }
      return updated;
    });

    if (addedCount > 0) {
      audioAlert.playCartClickSound();
      showToast(`${addedCount} ürün sepetinize tekrar eklendi!`, 'success');
      setIsCartOpen(true);
    } else {
      showToast('Siparişteki ürünler şu an stokta bulunmuyor.', 'warning');
    }
  };

  const cartTotal = Math.round(
    cart.reduce((acc, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return acc + price * item.quantity;
    }, 0) * 100
  ) / 100;

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Zone-based delivery calculation & Dormitory Overrides
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;

  const selectedDormConfig = useMemo(() => {
    if (!selectedAddress || selectedAddress.type !== 'dormitory') return null;
    const dorms = getDormitories();
    const dormName = (selectedAddress.dormName || selectedAddress.title || '').toLowerCase();
    return dorms.find((d) => d.name.toLowerCase().includes(dormName) || dormName.includes(d.name.toLowerCase())) || null;
  }, [selectedAddress]);

  const activeZone = useMemo(() => {
    return selectedAddress
      ? getZoneForAddress(selectedAddress.district, selectedAddress.dormName, {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        })
      : null;
  }, [selectedAddress]);

  const zoneCalc = useMemo(() => {
    return calculateDeliveryForZone(activeZone, cartTotal, systemSettings, selectedDormConfig);
  }, [activeZone, cartTotal, systemSettings, selectedDormConfig]);

  const minOrderAmount = zoneCalc.minOrder;
  const freeDeliveryThreshold = zoneCalc.freeThreshold;

  // Single Campaign Rule: Evaluate exactly one best campaign across discount, free delivery or bundle
  const singleCampaignResult = useMemo(() => {
    const hasBundle = cart.some(
      (c) => c.product.id.startsWith('bundle_') || Boolean(c.product.campaignId)
    );
    const items = cart.map((c) => ({
      productId: c.product.id,
      category: c.product.category,
      quantity: c.quantity,
      price: c.product.discountPrice ?? c.product.price,
    }));
    return evaluateSingleBestCampaign({
      cartTotal,
      cartItems: items,
      hasBundle,
      standardDeliveryFee: zoneCalc.deliveryFee,
      isZoneAlreadyFree: cartTotal >= freeDeliveryThreshold || cartTotal === 0,
      campaignsList: campaigns,
      zoneId: activeZone?.id,
      dormitoryId: selectedDormConfig?.id,
    });
  }, [cart, cartTotal, zoneCalc.deliveryFee, freeDeliveryThreshold, campaigns, activeZone?.id, selectedDormConfig?.id]);

  // Dormitory Special Discount
  const dormDiscount = useMemo(() => {
    if (!selectedDormConfig || !selectedDormConfig.discountPercentage || cartTotal <= 0) return 0;
    const disc = (cartTotal * selectedDormConfig.discountPercentage) / 100;
    return Math.min(cartTotal, Math.round(disc * 100) / 100);
  }, [selectedDormConfig, cartTotal]);

  // Coupon Discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || cartTotal <= 0) return 0;
    if (appliedCoupon.minOrderAmount && cartTotal < appliedCoupon.minOrderAmount) return 0;
    let disc = 0;
    if (appliedCoupon.discountType === 'percentage') {
      disc = (cartTotal * appliedCoupon.discountValue) / 100;
    } else {
      disc = appliedCoupon.discountValue;
    }
    if (appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount) {
      disc = appliedCoupon.maxDiscount;
    }
    return Math.min(cartTotal, Math.round(disc * 100) / 100);
  }, [appliedCoupon, cartTotal]);

  const discountAmount = Math.max(singleCampaignResult.discountAmount, couponDiscount, dormDiscount);

  const appliedCampaignTitle = appliedCoupon
    ? appliedCoupon.title
    : dormDiscount >= singleCampaignResult.discountAmount && dormDiscount > 0
    ? (selectedDormConfig?.specialNote || `🏢 ${selectedDormConfig?.name} %${selectedDormConfig?.discountPercentage} İndirimi`)
    : singleCampaignResult.appliedCampaignTitle;

  const appliedCampaignDescription = appliedCoupon
    ? appliedCoupon.description
    : dormDiscount >= singleCampaignResult.discountAmount && dormDiscount > 0
    ? 'Yurdunuza özel indirim sepetinize otomatik uygulandı.'
    : singleCampaignResult.campaignDescription;

  const isFreeDeliveryCampaign = singleCampaignResult.isFreeDeliveryCampaign;
  const isBundleCampaignApplied = singleCampaignResult.isBundleApplied;

  const applyCouponCode = (code: string) => {
    const res = validateCoupon(code, cartTotal, user?.phone);
    if (res.valid && res.coupon) {
      setAppliedCoupon(res.coupon);
      showToast(res.message, 'success');
      return { success: true, message: res.message, discount: res.discountAmount };
    } else {
      showToast(res.message, 'error');
      return { success: false, message: res.message, discount: 0 };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Kupon kaldırıldı.', 'info');
  };

  // Delivery fee: Free if standard zone threshold is reached OR if winning campaign is free_delivery!
  const deliveryFee =
    cartTotal === 0 || cartTotal >= freeDeliveryThreshold || isFreeDeliveryCampaign
      ? 0
      : zoneCalc.deliveryFee;

  const rawFinal = cartTotal + deliveryFee - discountAmount;
  const finalTotal = cartTotal > 0 ? Math.max(0, Math.round(rawFinal * 100) / 100) : 0;

  // --- AUTH ---
  const loginUser = (fullName: string, phone: string, initialAddresses?: Address[]) => {
    const cleanPhone = normalizePhoneNumber(phone);
    if (isPhoneBanned(cleanPhone)) {
      const info = getBannedUserInfo(cleanPhone);
      setBannedModalInfo(
        info || {
          id: 'ban_' + cleanPhone,
          phone: cleanPhone,
          name: fullName.trim() || 'Müşteri',
          reason: t('bannedDefaultReason', 'Kötü niyetli sipariş / Güvenlik ihlali'),
          bannedAt: new Date().toISOString(),
        }
      );
      setIsAuthModalOpen(false);
      return;
    }
    const safeName = sanitizeInput(fullName.trim() || 'Müşteri');

    // Müşterinin mevcut adresi yoksa ancak geçmişten getirilmiş adresi varsa aktar
    let userAddresses = addresses;
    let userSelectedAddressId = selectedAddressId;
    if (userAddresses.length === 0 && initialAddresses && initialAddresses.length > 0) {
      userAddresses = initialAddresses;
      userSelectedAddressId = initialAddresses[0].id;
      setAddresses(initialAddresses);
      setSelectedAddressId(userSelectedAddressId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(initialAddresses));
        localStorage.setItem(SELECTED_ADDRESS_KEY, userSelectedAddressId);
      }
    }

    const profile: UserProfile = {
      id: user?.id || 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: safeName,
      phone: cleanPhone,
      addresses: userAddresses,
      selectedAddressId: userSelectedAddressId,
    };
    setUser(profile);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setIsAuthModalOpen(false);
    showToast(`Hoş geldin, ${safeName}!`, 'success');

    // Prompt customer to add delivery address if they have none
    if (userAddresses.length === 0) {
      setTimeout(() => {
        setIsAddressModalOpen(true);
      }, 400);
    }

    // Sync customer profile to Supabase profiles table for admin management
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('profiles')
        .upsert(
          {
            phone: cleanPhone,
            full_name: safeName,
            role: 'customer',
          },
          { onConflict: 'phone' }
        )
        .then();
    }
  };


  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    showToast('Çıkış yapıldı', 'info');
  };

  // --- ADDRESSES ---
  const saveNewAddress = (addr: Omit<Address, 'id'>): Address => {
    const newAddress: Address = {
      ...addr,
      id: 'addr_' + Math.random().toString(36).substring(2, 9),
    };
    const updated = [newAddress, ...addresses];
    setAddresses(updated);
    setSelectedAddressId(newAddress.id);
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
    showToast('Adresiniz başarıyla kaydedildi', 'success');
    return newAddress;
  };

  const deleteAddress = (addressId: string) => {
    const updated = addresses.filter((a) => a.id !== addressId);
    setAddresses(updated);
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
    if (selectedAddressId === addressId && updated.length > 0) {
      setSelectedAddressId(updated[0].id);
    }
    showToast('Adres silindi', 'info');
  };

  // --- ORDERS ---
  const placeOrder = async (paymentMethod: PaymentMethod, orderNote?: string): Promise<Order | null> => {
    if (!storeOpen) {
      showToast(systemSettings.closedMessage || 'Mağaza şu an kapalı. Hizmet saatlerinde tekrar deneyiniz.', 'warning');
      return null;
    }
    if (cart.length === 0) {
      showToast('Sepetiniz boş!', 'warning');
      return null;
    }

    // 1. Anti-Tamper: Verify cart item prices and quantities against catalog and active campaigns
    let currentCatalog = products;
    if (currentCatalog.length === 0) {
      currentCatalog = await fetchProducts();
    }
    if (currentCatalog.length === 0 && cart.length > 0) {
      showToast('Ürün kataloğu yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.', 'error');
      return null;
    }

    const cartCheck = validateCartIntegrity(cart, currentCatalog, campaigns);
    if (!cartCheck.isValid) {
      showToast(cartCheck.errorMessage || 'Sepet içeriği doğrulanamadı.', 'error');
      return null;
    }

    if (cartTotal < minOrderAmount) {
      showToast(`Minimum sepet tutarı ${minOrderAmount} TL olmalıdır.`, 'warning');
      return null;
    }
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Sipariş vermek için lütfen adınızı ve telefonunuzu giriniz.', 'info');
      return null;
    }

    const cleanUserPhone = normalizePhoneNumber(user.phone);
    if (isPhoneBanned(cleanUserPhone)) {
      const info = getBannedUserInfo(cleanUserPhone);
      setBannedModalInfo(
        info || {
          id: 'ban_' + cleanUserPhone,
          phone: cleanUserPhone,
          name: user.fullName || 'Müşteri',
          reason: t('bannedDefaultReason', 'Kötü niyetli sipariş / Güvenlik ihlali'),
          bannedAt: new Date().toISOString(),
        }
      );
      return null;
    }

    // 2. Anti-Spam: Rate limiting (max 2 orders in 60s per phone/device)
    const rateCheck = checkOrderRateLimit(cleanUserPhone, 2, 60);
    if (!rateCheck.allowed) {
      showToast(rateCheck.message || 'Lütfen yeni bir sipariş vermeden önce bekleyiniz.', 'warning');
      return null;
    }

    if (!selectedAddress) {
      setIsAddressModalOpen(true);
      showToast('Sipariş verebilmek için lütfen teslimat adresinizi ekleyiniz.', 'warning');
      return null;
    }

    if (selectedAddress.type === 'home') {
      const isPlaceholder =
        selectedAddress.fullAddress === 'Haritada Seçilen Konum' ||
        selectedAddress.fullAddress === 'Mevcut Konumum (GPS)' ||
        selectedAddress.title === 'Mevcut Konumum (GPS)';

      const hasGranular = Boolean(selectedAddress.streetName && selectedAddress.buildingNumber && selectedAddress.apartmentNumber);
      const hasFull = Boolean(selectedAddress.fullAddress && selectedAddress.fullAddress.length > 15 && !isPlaceholder);

      if (!hasGranular && !hasFull) {
        setIsAddressModalOpen(true);
        showToast('Kuryemizin teslimat yapabilmesi için sokak ismi, bina no ve daire no zorunludur.', 'warning');
        return null;
      }
    }

    // Live stock / availability validation: block order if any item became unavailable
    const unavailableItem = cart.find((item) => {
      const live = products.find((p) => p.id === item.product.id);
      return (live && !live.isAvailable) || (!live && !item.product.id.startsWith('bundle_'));
    });

    if (unavailableItem) {
      showToast(`"${unavailableItem.product.name}" şu anda tükendi. Lütfen sepetinizden çıkarıp tekrar deneyin.`, 'warning');
      return null;
    }

    // 3. XSS Sanitization for all customer text inputs
    const safeCustomerName = sanitizeInput(user.fullName);
    const safeOrderNote = sanitizeInput(orderNote || '');
    const safeAddress: Address = {
      ...selectedAddress,
      title: sanitizeInput(selectedAddress.title),
      streetName: selectedAddress.streetName ? sanitizeInput(selectedAddress.streetName) : undefined,
      buildingNumber: selectedAddress.buildingNumber ? sanitizeInput(selectedAddress.buildingNumber) : undefined,
      floorNumber: selectedAddress.floorNumber ? sanitizeInput(selectedAddress.floorNumber) : undefined,
      apartmentNumber: selectedAddress.apartmentNumber ? sanitizeInput(selectedAddress.apartmentNumber) : undefined,
      fullAddress: selectedAddress.fullAddress ? sanitizeInput(selectedAddress.fullAddress) : undefined,
      courierNote: selectedAddress.courierNote ? sanitizeInput(selectedAddress.courierNote) : undefined,
    };

    const hasKitchenItem = cart.some((i) => i.product.isKitchenItem);
    const estimatedMinutes = hasKitchenItem ? Math.max(25, zoneCalc.estimatedMin) : zoneCalc.estimatedMin;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `CB-${randomSuffix}`;

    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substring(2, 10),
      orderNumber,
      userId: user.id,
      customerName: safeCustomerName,
      customerPhone: cleanUserPhone,
      items: cart.map((i) => {
        const live = products.find((p) => p.id === i.product.id) || i.product;
        const livePrice = live.discountPrice ?? live.price;
        return {
          productId: i.product.id,
          productName: sanitizeInput(live.name),
          price: livePrice,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
          isKitchenItem: live.isKitchenItem,
        };
      }),
      totalAmount: cartTotal,
      deliveryFee,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      appliedCampaignId: singleCampaignResult.appliedCampaignId || undefined,
      finalAmount: finalTotal,
      address: safeAddress,
      paymentMethod,
      orderNote: safeOrderNote,
      status: 'pending',
      estimatedDeliveryMinutes: estimatedMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = await saveOrder(newOrder);

      // Sync customer profile to Supabase profiles table
      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('profiles')
          .upsert(
            {
              phone: cleanUserPhone,
              full_name: safeCustomerName,
              role: 'customer',
            },
            { onConflict: 'phone' }
          )
          .then();
      }

      // Save order ID to this customer's device for tracking & push notifications
      recordCustomerOrderId(saved.id);
      lastKnownStatusRef.current[saved.id] = saved.status;

      // Prompt for notification permission on user gesture (checkout click) if not yet decided
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission().catch(() => {});
      }

      audioAlert.playNewOrderSound();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([60, 40, 80]); } catch {}
      }
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5D3EBC', '#FFD10D', '#10B981'],
        });
      } catch {
        // ignore
      }
      clearCart();
      setIsCartOpen(false);
      setActiveTrackingOrder(saved);
      showToast(`Siparişiniz alındı! Sipariş No: ${orderNumber}`, 'success');
      return saved;
    } catch (err: unknown) {
      console.error('[placeOrder error]:', err);
      const msg = err instanceof Error ? err.message : 'Sipariş iletilemedi.';
      showToast(msg || 'Sipariş büfeye iletilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.', 'error');
      return null;
    }
  };

  return (
    <AppContext.Provider
      value={{
        cart, addToCart, removeFromCart, deleteItemFromCart, clearCart, reorderItems, getMaxQuantityForProduct,
        cartTotal, itemCount, minOrderAmount, freeDeliveryThreshold,
        deliveryFee, discountAmount, appliedCampaignTitle,
        appliedCampaignDescription, isFreeDeliveryCampaign, isBundleCampaignApplied,
        finalTotal,
        appliedCoupon, applyCouponCode, removeCoupon, coupons,
        products, refreshProducts, systemSettings,
        campaigns, activeCampaigns, bundleDeals, refreshCampaigns,
        user, loginUser, logoutUser,
        addresses, selectedAddress, saveNewAddress, deleteAddress, setSelectedAddressId,
        orders, placeOrder, activeTrackingOrder, setActiveTrackingOrder,
        isCartOpen, setIsCartOpen,
        isAddressModalOpen, setIsAddressModalOpen,
        isAuthModalOpen, setIsAuthModalOpen,
        isProfileModalOpen, setIsProfileModalOpen,
        isSupportModalOpen, setIsSupportModalOpen,
        bannedModalInfo, setBannedModalInfo,
        locale, setLocale, isLanguageWelcomeOpen, setIsLanguageWelcomeOpen, t, dir,
        storeOpen,
        toasts, showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Sipariş Alındı';
    case 'preparing': return 'Hazırlanıyor';
    case 'on_the_way': return 'Kurye Yolda';
    case 'delivered': return 'Teslim Edildi';
    case 'cancelled': return 'İptal Edildi';
    default: return status;
  }
}
