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
const STORAGE_PRODUCTS_KEY = 'caglabufe_products_v4';
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
        const mapped: Product[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          price: Number(row.price),
          discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
          imageUrl: row.image_url,
          description: row.description || '',
          unit: row.unit || 'adet',
          barcode: row.barcode || undefined,
          isAvailable: row.is_available,
          isKitchenItem: row.is_kitchen_item,
          prepTimeMinutes: row.prep_time_minutes || 10,
          options: row.options || [],
          searchKeywords: row.search_keywords || [],
        }));
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
      supabase.from('products').upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        discount_price: product.discountPrice || null,
        image_url: product.imageUrl,
        description: product.description,
        unit: product.unit,
        is_available: product.isAvailable,
        is_kitchen_item: product.isKitchenItem,
        prep_time_minutes: product.prepTimeMinutes || 15,
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

export const saveOrder = async (order: Order): Promise<Order> => {
  // If Supabase is configured, push to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
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
      } else if (data) {
        // Broadcast locally too for instant feedback
        broadcastOrderUpdate(order);
        return order;
      }
    } catch {
      // Fallback to local storage if network glitch
    }
  }

  // Local/Offline storage mode
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
    } catch {
      // Fallback to local
    }
  }

  // Local update
  const orders = getStoredOrders();
  const target = orders.find((o) => o.id === orderId);
  if (!target) return null;

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

export const subscribeToOrders = (callback: RealtimeCallback): (() => void) => {
  orderListeners.add(callback);

  // If live Supabase Realtime is enabled
  let supabaseSubscription: { unsubscribe: () => void } | null = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase
        .channel('public:orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.new) {
              const updated = mapSupabaseOrderToOrder(payload.new);
              callback(updated);
            }
          }
        )
        .subscribe();

      supabaseSubscription = {
        unsubscribe: () => {
          supabase?.removeChannel(channel);
        }
      };
    } catch {
      // ignore
    }
  }

  return () => {
    orderListeners.delete(callback);
    if (supabaseSubscription) {
      supabaseSubscription.unsubscribe();
    }
  };
};

// --- BANNED USERS / BLACKLIST SERVICES ---

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

export const isPhoneBanned = (phone: string): boolean => {
  const clean = phone.replace(/\D/g, '');
  const list = getStoredBannedUsers();
  return list.some((u) => u.phone.replace(/\D/g, '') === clean);
};

export const banUser = async (phone: string, name: string, reason: string): Promise<BannedUser> => {
  const cleanPhone = phone.trim();
  const newBan: BannedUser = {
    id: 'ban_' + Math.random().toString(36).substring(2, 9),
    phone: cleanPhone,
    name: name.trim() || 'Müşteri',
    reason: reason.trim() || 'Kötü niyetli kullanım / Sahte sipariş',
    bannedAt: new Date().toISOString(),
  };

  // If Supabase is connected
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').update({
        is_banned: true,
        ban_reason: newBan.reason,
        banned_at: newBan.bannedAt,
      }).eq('phone', cleanPhone);
    } catch {
      // fallback
    }
  }

  // Local storage
  const current = getStoredBannedUsers();
  const filtered = current.filter((u) => u.phone.replace(/\D/g, '') !== cleanPhone.replace(/\D/g, ''));
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
  const cleanPhone = phone.trim().replace(/\D/g, '');

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
      }).eq('phone', cleanPhone);
    } catch {
      // fallback
    }
  }

  const current = getStoredBannedUsers();
  const updated = current.filter((u) => u.phone.replace(/\D/g, '') !== cleanPhone);

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

