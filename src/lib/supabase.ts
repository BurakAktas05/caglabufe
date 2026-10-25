import { createClient } from '@supabase/supabase-js';
import { Order, Product, OrderStatus, BannedUser } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('example.com')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cross-tab and in-memory event bus for instant Realtime sync
type RealtimeCallback = (order: Order) => void;
const orderListeners: Set<RealtimeCallback> = new Set();

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('caglabufe_realtime_orders');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'ORDER_UPDATED' && event.data.order) {
        orderListeners.forEach((cb) => cb(event.data.order));
      }
    };
  } catch {
    // fallback if broadcast channel is disabled
  }
}

// Local storage keys
const STORAGE_ORDERS_KEY = 'caglabufe_orders_v1';
const STORAGE_PRODUCTS_KEY = 'caglabufe_products_v5';
const STORAGE_BANNED_KEY = 'caglabufe_banned_users_v1';

// --- DATA ACCESS LAYER ---

export const getStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Product[] = data.map((row: any) => {
          const brand = (row.options && typeof row.options === 'object' && !Array.isArray(row.options) ? row.options.brand : undefined) || row.brand || undefined;
          return {
            id: row.id,
            name: row.name,
            brand: brand || undefined,
            category: row.category,
            price: Number(row.price),
            discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
            imageUrl: row.image_url,
            description: row.description || '',
            unit: row.unit || 'Adet',
            barcode: row.barcode || undefined,
            isAvailable: row.is_available,
            isKitchenItem: row.is_kitchen_item,
            prepTimeMinutes: row.prep_time_minutes || 0,
            options: row.options || [],
            searchKeywords: row.search_keywords || [],
          };
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(mapped));
        }
        broadcastProductUpdate(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('[Supabase] fetchProducts fallback to local storage:', e);
    }
  }
  return getStoredProducts();
};

const broadcastProductUpdate = (products: Product[]) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('caglabufe_products_updated', { detail: products }));
  }
};

export const subscribeToProducts = (callback: (products: Product[]) => void): () => void => {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => {
    const ce = e as CustomEvent<Product[]>;
    callback(ce.detail || getStoredProducts());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_PRODUCTS_KEY) {
      callback(getStoredProducts());
    }
  };

  window.addEventListener('caglabufe_products_updated', handleCustom);
  window.addEventListener('storage', handleStorage);

  let supabaseSub: { unsubscribe: () => void } | null = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase
        .channel('public:products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            fetchProducts().then((latest) => callback(latest));
          }
        )
        .subscribe();
      supabaseSub = {
        unsubscribe: () => {
          supabase?.removeChannel(channel);
        },
      };
    } catch {
      // ignore
    }
  }

  return () => {
    window.removeEventListener('caglabufe_products_updated', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (supabaseSub) {
      supabaseSub.unsubscribe();
    }
  };
};

export const updateStoredProductAvailability = (productId: string, isAvailable: boolean): Product[] => {
  const current = getStoredProducts();
  const updated = current.map((p) => (p.id === productId ? { ...p, isAvailable } : p));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      supabase.from('products').update({ is_available: isAvailable, updated_at: new Date().toISOString() }).eq('id', productId).then();
    } catch {}
  }

  broadcastProductUpdate(updated);
  return updated;
};

export const saveOrUpdateProduct = (product: Product): Product[] => {
  const current = getStoredProducts();
  const exists = current.some((p) => p.id === product.id);
  const updated = exists
    ? current.map((p) => (p.id === product.id ? product : p))
    : [product, ...current];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const optionsPayload = {
        ...(typeof product.options === 'object' && !Array.isArray(product.options) ? product.options : {}),
        ...(product.brand ? { brand: product.brand } : {}),
      };

      const keywords = product.searchKeywords && product.searchKeywords.length > 0
        ? product.searchKeywords
        : Array.from(
            new Set(
              [
                (product.brand || '').toLowerCase(),
                (product.category || '').toLowerCase(),
                product.barcode || '',
                ...product.name.toLowerCase().split(/[\s,\.\-]+/).filter((w) => w.length > 1),
              ].filter(Boolean)
            )
          );

      supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        discount_price: product.discountPrice || null,
        image_url: product.imageUrl,
        description: product.description,
        unit: product.unit || 'Adet',
        barcode: product.barcode || null,
        is_available: product.isAvailable,
        is_kitchen_item: product.isKitchenItem,
        prep_time_minutes: product.prepTimeMinutes || 0,
        options: optionsPayload,
        search_keywords: keywords,
        updated_at: new Date().toISOString(),
      }).then();
    } catch {}
  }

  broadcastProductUpdate(updated);
  return updated;
};

export const deleteStoredProduct = (productId: string): Product[] => {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== productId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(updated));
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      supabase.from('products').delete().eq('id', productId).then();
    } catch {}
  }

  broadcastProductUpdate(updated);
  return updated;
};

// Helper mapper for Supabase raw DB row
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapSupabaseOrderToOrder = (row: any): Order => {
  return {
    id: row.id,
    orderNumber: row.order_number || row.orderNumber,
    userId: row.user_id || row.userId || '',
    customerName: row.customer_name || row.customerName || '',
    customerPhone: row.customer_phone || row.customerPhone || '',
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
    totalAmount: Number(row.total_amount || row.totalAmount || 0),
    deliveryFee: Number(row.delivery_fee || row.deliveryFee || 0),
    finalAmount: Number(row.final_amount || row.finalAmount || 0),
    discountAmount: Number(row.discount_amount || row.discountAmount || 0),
    appliedCampaignId: row.applied_campaign_id || row.appliedCampaignId || undefined,
    address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
    paymentMethod: row.payment_method || row.paymentMethod || 'cash_at_door',
    orderNote: row.order_note || row.orderNote || '',
    status: row.status || 'pending',
    estimatedDeliveryMinutes: row.estimated_delivery_minutes || row.estimatedDeliveryMinutes || 25,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
};

export const getStoredOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const fetchOrders = async (): Promise<Order[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapSupabaseOrderToOrder);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e) {
      console.warn('[Supabase] fetchOrders fallback to local storage:', e);
    }
  }
  return getStoredOrders();
};

export const fetchCustomerOrders = async (orderIds: string[]): Promise<Order[]> => {
  if (!orderIds || orderIds.length === 0) return [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapSupabaseOrderToOrder);
      }
    } catch (e) {
      console.warn('[Supabase] fetchCustomerOrders error:', e);
    }
  }
  const local = getStoredOrders();
  return local.filter((o) => orderIds.includes(o.id));
};

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'on_the_way', 'delivered', 'cancelled'],
  preparing: ['on_the_way', 'delivered', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const isValidStatusTransition = (current: OrderStatus, next: OrderStatus): boolean => {
  return VALID_ORDER_TRANSITIONS[current]?.includes(next) ?? false;
};

export const saveOrder = async (order: Order): Promise<Order> => {
  // 1. Try server-side order creation API (validates prices server-side)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          items: order.items.map(item => ({
            product: {
              id: (item as any).productId || (item as any).product?.id,
              name: (item as any).productName || (item as any).product?.name,
              price: (item as any).price || (item as any).product?.price,
              discountPrice: (item as any).product?.discountPrice,
              campaignId: (item as any).product?.campaignId,
              isKitchenItem: (item as any).isKitchenItem || (item as any).product?.isKitchenItem,
            },
            quantity: item.quantity,
            selectedOptions: (item as any).selectedOptions,
          })),
          deliveryFee: order.deliveryFee,
          discountAmount: order.discountAmount || 0,
          appliedCampaignId: order.appliedCampaignId,
          address: order.address,
          paymentMethod: order.paymentMethod,
          orderNote: order.orderNote || '',
          estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update order with server-validated amounts
          const serverOrder: Order = {
            ...order,
            totalAmount: data.order.totalAmount ?? order.totalAmount,
            finalAmount: data.order.finalAmount ?? order.finalAmount,
            status: 'pending',
          };

          // Sync to local storage
          const orders = getStoredOrders();
          const updatedList = [serverOrder, ...orders];
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedList));
          }
          broadcastOrderUpdate(serverOrder);
          return serverOrder;
        }
      }

      // If server returned an error, throw it
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    } catch (apiError: any) {
      // If the error has a meaningful message, rethrow it
      if (apiError.message && !apiError.message.includes('fetch')) {
        throw apiError;
      }
      console.warn('[saveOrder] Server API unavailable, falling back to direct Supabase:', apiError.message);
    }
  }

  // 2. Fallback: Direct Supabase insert (when server API is unavailable)
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('orders').insert({
      id: order.id,
      order_number: order.orderNumber,
      user_id: order.userId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      items: order.items,
      total_amount: order.totalAmount,
      delivery_fee: order.deliveryFee,
      final_amount: order.finalAmount,
      discount_amount: order.discountAmount || 0,
      applied_campaign_id: order.appliedCampaignId || null,
      address: order.address,
      payment_method: order.paymentMethod,
      order_note: order.orderNote || '',
      status: order.status,
      estimated_delivery_minutes: order.estimatedDeliveryMinutes,
    }).select().single();

    if (error) {
      console.error('[Supabase saveOrder error]:', error.message);
      throw new Error(`Sipariş sunucuya iletilemedi: ${error.message}`);
    }

    if (data) {
      const orders = getStoredOrders();
      const exists = orders.some((o) => o.id === order.id);
      const updatedList = exists
        ? orders.map((o) => (o.id === order.id ? order : o))
        : [order, ...orders];

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedList));
      }

      broadcastOrderUpdate(order);
      return order;
    }
    throw new Error('Sipariş kaydedilirken beklenmeyen bir hata oluştu.');
  }

  // 3. Local/Offline mock mode (only when Supabase keys are not configured)
  const orders = getStoredOrders();
  const exists = orders.some((o) => o.id === order.id);
  const updatedList = exists
    ? orders.map((o) => (o.id === order.id ? order : o))
    : [order, ...orders];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedList));
  }

  broadcastOrderUpdate(order);
  return order;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Fetch current status to validate transition
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (currentOrder && currentOrder.status) {
        if (!isValidStatusTransition(currentOrder.status as OrderStatus, status)) {
          console.warn(`[Order FSM] Geçersiz durum geçişi: ${currentOrder.status} -> ${status}`);
          return null;
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (!error && data) {
        const order = mapSupabaseOrderToOrder(data);
        broadcastOrderUpdate(order);
        return order;
      }
    } catch (e) {
      console.warn('[Supabase] updateOrderStatus error:', e);
    }
  }

  // Local update fallback
  const orders = getStoredOrders();
  const target = orders.find((o) => o.id === orderId);
  if (!target) return null;

  if (!isValidStatusTransition(target.status, status)) {
    console.warn(`[Order FSM] Geçersiz durum geçişi: ${target.status} -> ${status}`);
    return null;
  }

  const updatedOrder: Order = {
    ...target,
    status,
    updatedAt: new Date().toISOString()
  };

  const updatedList = orders.map((o) => (o.id === orderId ? updatedOrder : o));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updatedList));
  }

  broadcastOrderUpdate(updatedOrder);
  return updatedOrder;
};

const broadcastOrderUpdate = (order: Order) => {
  orderListeners.forEach((cb) => {
    try {
      cb(order);
    } catch {
      // ignore callback error
    }
  });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDER_UPDATED', order });
    } catch {
      // ignore
    }
  }
};

// Shared Supabase channel singleton for orders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedOrderChannel: any = null;

export const subscribeToOrders = (callback: RealtimeCallback): (() => void) => {
  orderListeners.add(callback);

  // If live Supabase Realtime is enabled, ensure single active channel
  if (isSupabaseConfigured() && supabase && !sharedOrderChannel) {
    try {
      sharedOrderChannel = supabase
        .channel('public:orders_stream_v1')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.new) {
              const updated = mapSupabaseOrderToOrder(payload.new);
              orderListeners.forEach((cb) => {
                try {
                  cb(updated);
                } catch (e) {
                  console.warn('[Realtime order callback error]:', e);
                }
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[Supabase Realtime] orders channel error, resetting...');
            sharedOrderChannel = null;
          }
        });
    } catch (e) {
      console.warn('[Supabase] orders channel subscription error:', e);
    }
  }

  return () => {
    orderListeners.delete(callback);
    if (orderListeners.size === 0 && sharedOrderChannel && supabase) {
      try {
        supabase.removeChannel(sharedOrderChannel);
      } catch {}
      sharedOrderChannel = null;
    }
  };
};

// --- BANNED USERS / BLACKLIST SERVICES ---

import { normalizePhoneNumber } from './security';

export interface RegisteredProfile {
  id: string;
  phone: string;
  fullName: string;
  role?: string;
  isBanned?: boolean;
  bannedAt?: string;
  banReason?: string;
  createdAt?: string;
}

export const getStoredBannedUsers = (): BannedUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_BANNED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Fetches all registered customer profiles from Supabase 'profiles' table.
 * Used for admin customer selection when banning or managing accounts.
 */
export const fetchRegisteredProfiles = async (): Promise<RegisteredProfile[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((row: any) => ({
          id: row.id,
          phone: normalizePhoneNumber(row.phone),
          fullName: row.full_name || 'Kayıtlı Müşteri',
          role: row.role || 'customer',
          isBanned: Boolean(row.is_banned),
          bannedAt: row.banned_at || undefined,
          banReason: row.ban_reason || undefined,
          createdAt: row.created_at,
        }));
      }
    } catch (e) {
      console.warn('[Supabase] fetchRegisteredProfiles fallback:', e);
    }
  }

  // Fallback: check localStorage for current user session
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('caglabufe_user_profile');
      if (local) {
        const u = JSON.parse(local);
        if (u && u.phone) {
          return [
            {
              id: u.id || 'usr_local',
              phone: normalizePhoneNumber(u.phone),
              fullName: u.fullName || 'Müşteri',
              role: 'customer',
              isBanned: isPhoneBanned(u.phone),
            },
          ];
        }
      }
    } catch {}
  }
  return [];
};

/**
 * Fetches banned users list from Supabase 'banned_users' table and updates localStorage cache.
 */
export const fetchBannedUsers = async (): Promise<BannedUser[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: BannedUser[] = data.map((row: any) => ({
          id: row.id || `ban_${normalizePhoneNumber(row.phone)}`,
          phone: normalizePhoneNumber(row.phone),
          name: row.name || 'Müşteri',
          reason: row.reason || 'Kötü niyetli sipariş',
          bannedAt: row.banned_at || new Date().toISOString(),
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_BANNED_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (e) {
      console.warn('[Supabase] fetchBannedUsers fallback:', e);
    }
  }
  return getStoredBannedUsers();
};

export const isPhoneBanned = (phone: string): boolean => {
  const clean = normalizePhoneNumber(phone);
  if (!clean) return false;
  const list = getStoredBannedUsers();
  return list.some((u) => normalizePhoneNumber(u.phone) === clean);
};

export const getBannedUserInfo = (phone: string): BannedUser | undefined => {
  const clean = normalizePhoneNumber(phone);
  if (!clean) return undefined;
  const list = getStoredBannedUsers();
  return list.find((u) => normalizePhoneNumber(u.phone) === clean);
};

export const banUser = async (phone: string, name: string, reason: string): Promise<BannedUser> => {
  const cleanPhone = normalizePhoneNumber(phone);
  const newBan: BannedUser = {
    id: 'ban_' + cleanPhone,
    phone: cleanPhone,
    name: name.trim() || 'Müşteri',
    reason: reason.trim() || 'Kötü niyetli kullanım / Sahte sipariş',
    bannedAt: new Date().toISOString(),
  };

  // Sync to Supabase: both banned_users and profiles tables
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('banned_users').upsert(
        {
          id: newBan.id,
          phone: cleanPhone,
          name: newBan.name,
          reason: newBan.reason,
          banned_at: newBan.bannedAt,
        },
        { onConflict: 'phone' }
      );

      await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: newBan.reason,
          banned_at: newBan.bannedAt,
        })
        .or(`phone.eq.${cleanPhone},phone.eq.0${cleanPhone}`);
    } catch (err) {
      console.warn('[Supabase] banUser error:', err);
    }
  }

  // Local storage update with canonical normalized phone
  const current = getStoredBannedUsers();
  const filtered = current.filter((u) => normalizePhoneNumber(u.phone) !== cleanPhone);
  const updated = [newBan, ...filtered];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_BANNED_KEY, JSON.stringify(updated));
    try {
      window.dispatchEvent(
        new CustomEvent('caglabufe_banned_event', { detail: { type: 'BAN', ban: newBan } })
      );
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('caglabufe_security_channel');
        bc.postMessage({ type: 'BAN', ban: newBan });
        bc.close();
      }
    } catch {
      // ignore broadcast error
    }
  }

  return newBan;
};

export const unbanUser = async (phone: string): Promise<void> => {
  const cleanPhone = normalizePhoneNumber(phone);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('banned_users')
        .delete()
        .or(`phone.eq.${cleanPhone},phone.eq.0${cleanPhone}`);

      await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
        })
        .or(`phone.eq.${cleanPhone},phone.eq.0${cleanPhone}`);
    } catch (err) {
      console.warn('[Supabase] unbanUser error:', err);
    }
  }

  const current = getStoredBannedUsers();
  const updated = current.filter((u) => normalizePhoneNumber(u.phone) !== cleanPhone);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_BANNED_KEY, JSON.stringify(updated));
    try {
      window.dispatchEvent(
        new CustomEvent('caglabufe_banned_event', { detail: { type: 'UNBAN', phone: cleanPhone } })
      );
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('caglabufe_security_channel');
        bc.postMessage({ type: 'UNBAN', phone: cleanPhone });
        bc.close();
      }
    } catch {
      // ignore broadcast error
    }
  }
};

/**
 * Telefon numarasına göre kayıtlı müşteri profilini ve varsa son adresini sorgular.
 */
export const findProfileByPhone = async (
  phone: string
): Promise<{ fullName: string; lastAddress?: Order['address'] } | null> => {
  const clean = normalizePhoneNumber(phone);
  if (!clean || clean.length < 10) return null;

  // 1. Supabase profiles tablosundan kontrol et
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${clean},phone.eq.0${clean}`)
        .maybeSingle();

      if (!error && data && data.full_name) {
        return { fullName: data.full_name };
      }
    } catch {
      // sessizce fallback'e geç
    }
  }

  // 2. Tarayıcıdaki geçmiş siparişlerden kontrol et
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (raw) {
        const orders: Order[] = JSON.parse(raw);
        const match = orders.find(
          (o) => normalizePhoneNumber(o.customerPhone) === clean && o.customerName
        );
        if (match && match.customerName) {
          return {
            fullName: match.customerName,
            lastAddress: match.address,
          };
        }
      }
    } catch {
      // fallback
    }
  }

  return null;
};



