import { SystemSettings, DeliveryZone, DormitoryConfig, Campaign, StoreBranch, Coupon, VipNotification, VipTierInfo, CustomerLoyaltyProfile, Order } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';

// --- STORAGE KEYS ---
const SETTINGS_KEY = 'caglabufe_system_settings_v6';
const ZONES_KEY = 'caglabufe_delivery_zones_v6';
const DORMS_KEY = 'caglabufe_dormitories_v6';
const CAMPAIGNS_KEY = 'caglabufe_campaigns_v7';
const BRANCHES_KEY = 'caglabufe_store_branches_v6';

// Cleanup stale mock data keys from older development versions
if (typeof window !== 'undefined') {
  try {
    [
      'caglabufe_campaigns_v1', 'caglabufe_campaigns_v2', 'caglabufe_campaigns_v3', 'caglabufe_campaigns_v4', 'caglabufe_campaigns_v5', 'caglabufe_campaigns_v6',
      'caglabufe_system_settings_v1', 'caglabufe_system_settings_v2', 'caglabufe_system_settings_v3', 'caglabufe_system_settings_v4', 'caglabufe_system_settings_v5',
      'caglabufe_delivery_zones_v1', 'caglabufe_delivery_zones_v2', 'caglabufe_delivery_zones_v3', 'caglabufe_delivery_zones_v4', 'caglabufe_delivery_zones_v5',
      'caglabufe_store_branches_v1', 'caglabufe_store_branches_v2', 'caglabufe_store_branches_v3', 'caglabufe_store_branches_v4', 'caglabufe_store_branches_v5'
    ].forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch {}
}

// --- ANA MARKET / ŞUBE ODAK NOKTASI (GÜNCEL KONUM) ---
export const DEFAULT_BRANCHES: StoreBranch[] = [
  {
    id: 'branch-merkez',
    name: 'Çağla Büfe & Market (Merkez Dükkan)',
    shortName: 'Dükkan (Bostanbükü)',
    address: 'Bostanbükü, Safranbolu / Karabük',
    phone: '0542 000 7878',
    latitude: 41.212095,
    longitude: 32.6732255,
    color: '#5D3EBC', // Çağla Moru
    isActive: true,
    description: 'Bostanbükü, 100. Yıl, KYK Yurtları ve Karabük Ana Dağıtım Merkezi',
  },
];

// --- DEFAULT SYSTEM SETTINGS ---
const DEFAULT_SETTINGS: SystemSettings = {
  storeName: 'Çağla Büfe & Market',
  storeOpenTime: '16:00',
  storeCloseTime: '03:00',
  isManuallyOpen: false,
  isManualOverride: false,
  closedMessage: 'Sipariş saatleri dışındayız. Hizmet saatlerimiz her gün 16:00 - 03:00 arasıdır.',
  announcementText: '🛵 Bostanbükü, 100. Yıl, KYK Yurtları ve Karabük geneline hızlı teslimat! Soğuk içecek, atıştırmalık ve market kapınızda.',
  isAnnouncementActive: true,
  defaultMinOrder: 50,
  defaultDeliveryFee: 10,
  defaultFreeDeliveryThreshold: 120,
  adminPassword: 'cagla2024',
  storePhone: '0542 000 7878',
  storeWhatsApp: '905420007878',
  techSupportWhatsApp: '905550000000',
  storeAddress: 'Bostanbükü, Safranbolu / Karabük',
  storeLatitude: 41.212095,
  storeLongitude: 32.6732255,
  soundPreset: 'bell',
  soundVolume: 0.6,
  soundRepeatCount: 2,
  enableVibration: true,
  templateOrderReceived: 'Siparişiniz alındı! #{orderNumber} nolu siparişiniz onaylandı.',
  templateOrderPreparing: 'Mutfakta hazırlanıyor! #{orderNumber} nolu siparişiniz paketlenmek üzere.',
  templateOrderOnTheWay: 'Kuryemiz yola çıktı! #{orderNumber} nolu siparişiniz kapınıza doğru geliyor.',
  templateOrderDelivered: 'Siparişiniz teslim edildi! Afiyet olsun, Çağla Büfe keyifli anlar diler.',
  templateWhatsApp: 'Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL siparişim ({dormOrAddress}) hakkında bilgi almak istiyorum.',
};

/**
 * Format dynamic text templates replacing {key} placeholders
 */
export function formatTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
  });
}

/**
 * Generate 1-click Google Maps Navigation URL for couriers (turn-by-turn directions)
 */
export function getGoogleMapsNavigationUrl(address?: { type?: string; dormName?: string; blockNumber?: string; fullAddress?: string; district?: string; latitude?: number; longitude?: number }): string {
  if (!address) return 'https://www.google.com/maps';
  if (address.latitude && address.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;
  }
  if (address.type === 'dormitory') {
    const dorm = address.dormName || 'Karabük KYK Yurdu';
    const block = address.blockNumber ? ` ${address.blockNumber}` : '';
    const query = `${dorm}${block}, Karabük`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  }
  const full = address.fullAddress ? `${address.fullAddress}, ` : '';
  const dist = address.district || 'Karabük';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${full}${dist}, Karabük`)}`;
}

/**
 * Generate 1-click Google Maps Navigation URL for a dormitory
 */
export function getGoogleMapsDormUrl(dorm: DormitoryConfig): string {
  const query = dorm.mapsQuery || `${dorm.name}, ${dorm.district || 'Karabük'}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

/**
 * Generate Google Maps URL for Store Base
 */
export function getGoogleMapsStoreUrl(settings?: SystemSettings): string {
  const addr = settings?.storeAddress || 'Bostanbükü, Safranbolu / Karabük';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

// --- DEFAULT DELIVERY ZONES (TEMİZ POLİGON VE MESAFE ALANLARI) ---
const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'zone-bostanbuku',
    name: 'Bostanbükü & Çevresi (Çekirdek Bölge)',
    minOrderAmount: 50,
    deliveryFee: 10,
    freeDeliveryThreshold: 120,
    estimatedMinutes: 15,
    isActive: true,
    radiusKm: 1.5,
    hexRing: 1,
    hexColor: '#10B981', // Zümrüt Yeşili
    polygonCoords: [
      [41.2220, 32.6610],
      [41.2220, 32.6950],
      [41.2030, 32.6950],
      [41.2030, 32.6610],
    ],
  },
  {
    id: 'zone-kyk-yurtlari',
    name: 'KYK Yurtları & Kampüs (Hubbi Hatun, Şeyh Edebali)',
    minOrderAmount: 70,
    deliveryFee: 15,
    freeDeliveryThreshold: 150,
    estimatedMinutes: 20,
    isActive: true,
    radiusKm: 3.0,
    hexRing: 2,
    hexColor: '#8B5CF6', // Menekşe Moru
    polygonCoords: [
      [41.2320, 32.6375],
      [41.2320, 32.6610],
      [41.2220, 32.6610],
      [41.2030, 32.6610],
      [41.2030, 32.6375],
    ],
  },
  {
    id: 'zone-100yil',
    name: '100. Yıl Mah. & Öğrenci Bölgesi',
    minOrderAmount: 80,
    deliveryFee: 15,
    freeDeliveryThreshold: 175,
    estimatedMinutes: 25,
    isActive: true,
    radiusKm: 4.5,
    hexRing: 3,
    hexColor: '#06B6D4', // Turkuaz
    polygonCoords: [
      [41.2320, 32.6150],
      [41.2320, 32.6375],
      [41.2030, 32.6375],
      [41.1980, 32.6375],
      [41.1980, 32.6150],
    ],
  },
  {
    id: 'zone-sirinevler',
    name: 'Şirinevler, 5000 Evler & Karabük Merkez',
    minOrderAmount: 100,
    deliveryFee: 25,
    freeDeliveryThreshold: 220,
    estimatedMinutes: 30,
    isActive: true,
    radiusKm: 7.0,
    hexRing: 4,
    hexColor: '#F59E0B', // Kehribar / Turuncu
    polygonCoords: [
      [41.1980, 32.5700],
      [41.1980, 32.6150],
      [41.1980, 32.6375],
      [41.2030, 32.6375],
      [41.2030, 32.6610],
      [41.2030, 32.6950],
      [41.1750, 32.6950],
      [41.1750, 32.5700],
    ],
  },
  {
    id: 'zone-safranbolu',
    name: 'Safranbolu (Emek, Barış, Kıranköy & Çarşı)',
    minOrderAmount: 120,
    deliveryFee: 30,
    freeDeliveryThreshold: 250,
    estimatedMinutes: 35,
    isActive: true,
    radiusKm: 8.5,
    hexRing: 4,
    hexColor: '#EF4444', // Kırmızı
    polygonCoords: [
      [41.2780, 32.6150],
      [41.2780, 32.7200],
      [41.2220, 32.7200],
      [41.2220, 32.6950],
      [41.2220, 32.6610],
      [41.2320, 32.6610],
      [41.2320, 32.6375],
      [41.2320, 32.6150],
    ],
  },
];

// --- DEFAULT DORMITORIES ---
const DEFAULT_DORMS: DormitoryConfig[] = [
  {
    id: 'hubbi-hatun',
    name: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok', 'D Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.4,
    mapsQuery: 'KYK Hubbi Hatun Kız Öğrenci Yurdu, Karabük',
    latitude: 41.2125,
    longitude: 32.6450,
  },
  {
    id: 'seyh-edebali',
    name: 'KYK Şeyh Edebali Erkek Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü',
    gender: 'erkek',
    blocks: ['1. Blok', '2. Blok', '3. Blok', '4. Blok', '5. Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.6,
    mapsQuery: 'KYK Şeyh Edebali Erkek Öğrenci Yurdu, Karabük',
    latitude: 41.2150,
    longitude: 32.6480,
  },
  {
    id: 'eflani',
    name: 'KYK Eflani Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 1.1,
    mapsQuery: 'KYK Eflani Kız Öğrenci Yurdu, 100. Yıl, Karabük',
    latitude: 41.2080,
    longitude: 32.6240,
  },
  {
    id: 'ozel-akademi',
    name: 'Özel Akademi Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: [],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 0.8,
    mapsQuery: '100. Yıl Mah. 1003. Cad. Karabük',
    latitude: 41.2050,
    longitude: 32.6310,
  },
  {
    id: 'ozel-prestij',
    name: 'Özel Prestij Erkek Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü',
    gender: 'erkek',
    blocks: [],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.1,
    mapsQuery: 'Demir Çelik Kampüsü, Karabük',
    latitude: 41.2160,
    longitude: 32.6420,
  },
  {
    id: 'safranbolu-yurdu',
    name: 'KYK Safranbolu Öğrenci Yurdu',
    district: 'Safranbolu',
    gender: 'karma',
    blocks: ['A Blok', 'B Blok', 'C Blok'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 3.8,
    mapsQuery: 'KYK Safranbolu Öğrenci Yurdu, Safranbolu',
    latitude: 41.2450,
    longitude: 32.6850,
  },
];

// --- GETTER / SETTER FUNCTIONS ---

export function getSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (parsed.announcementText && (parsed.announcementText.includes('tost') || parsed.announcementText.includes('15-20'))) {
      parsed.announcementText = parsed.announcementText.replace(/15-20/g, '20-30');
      if (parsed.announcementText.includes('tost')) {
        parsed.announcementText = DEFAULT_SETTINGS.announcementText;
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Cross-tab broadcast channel for instant zero-latency settings sync
let settingsBroadcastChannel: BroadcastChannel | null = null;
let campaignsBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    settingsBroadcastChannel = new BroadcastChannel('caglabufe_realtime_settings');
  } catch {
    // fallback
  }
  try {
    campaignsBroadcastChannel = new BroadcastChannel('caglabufe_realtime_campaigns');
  } catch {
    // fallback
  }
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // 1. Instant local persistence
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('caglabufe_settings_updated', { detail: settings }));

  // 2. Broadcast across tabs in the same browser immediately
  if (settingsBroadcastChannel) {
    try {
      settingsBroadcastChannel.postMessage({ type: 'SETTINGS_UPDATED', settings });
    } catch {
      // ignore
    }
  }

  // 3. Realtime cross-device sync to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ id: 'current', settings, updated_at: new Date().toISOString() });
      if (error) {
        console.warn('[Supabase] Failed to persist system_settings to database:', error);
      }
    } catch (e) {
      console.warn('[Supabase] Error saving system settings:', e);
    }
  }
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('id', 'current')
        .single();
      if (!error && data?.settings) {
        const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...data.settings };
        if (merged.announcementText && merged.announcementText.includes('15-20')) {
          merged.announcementText = merged.announcementText.replace(/15-20/g, '20-30');
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('caglabufe_settings_updated', { detail: merged }));
        }
        return merged;
      }
    } catch (e) {
      console.warn('[Supabase] fetchSystemSettings fallback to local:', e);
    }
  }
  return getSystemSettings();
}

/**
 * Subscribe to realtime/local settings changes across components, tabs & Supabase
 */
export function subscribeToSettings(callback: (settings: SystemSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => {
    const ce = e as CustomEvent<SystemSettings>;
    callback(ce.detail || getSystemSettings());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) {
      callback(getSystemSettings());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SETTINGS_UPDATED' && event.data.settings) {
      callback(event.data.settings);
    }
  };

  window.addEventListener('caglabufe_settings_updated', handleCustom);
  window.addEventListener('storage', handleStorage);
  if (settingsBroadcastChannel) {
    settingsBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  let supabaseSub: { unsubscribe: () => void } | null = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase
        .channel('public:system_settings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload.new && payload.new.settings) {
              const updated: SystemSettings = { ...DEFAULT_SETTINGS, ...payload.new.settings };
              if (typeof window !== 'undefined') {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
              }
              callback(updated);
            }
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
    window.removeEventListener('caglabufe_settings_updated', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (settingsBroadcastChannel) {
      settingsBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    supabaseSub?.unsubscribe();
  };
}

export function getDeliveryZones(): DeliveryZone[] {
  if (typeof window === 'undefined') return DEFAULT_ZONES;
  try {
    const raw = localStorage.getItem(ZONES_KEY);
    if (!raw) {
      localStorage.setItem(ZONES_KEY, JSON.stringify(DEFAULT_ZONES));
      return DEFAULT_ZONES;
    }
    const parsed: DeliveryZone[] = JSON.parse(raw);
    return parsed.map((z, idx) => {
      const match = DEFAULT_ZONES.find((dz) => dz.id === z.id);
      const ring = (z.hexRing || match?.hexRing || ((idx % 4 + 1) as 1 | 2 | 3 | 4));
      return {
        ...match,
        ...z,
        polygonCoords: z.polygonCoords || match?.polygonCoords,
        hexRing: ring,
        radiusKm: z.radiusKm || match?.radiusKm || (ring === 1 ? 1.2 : ring === 2 ? 2.8 : ring === 3 ? 4.8 : 7.2),
        hexColor: z.hexColor || match?.hexColor || (ring === 1 ? '#10B981' : ring === 2 ? '#8B5CF6' : ring === 3 ? '#F59E0B' : '#EF4444'),
      };
    });
  } catch {
    return DEFAULT_ZONES;
  }
}

export function saveDeliveryZones(zones: DeliveryZone[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
}

export function getDormitories(): DormitoryConfig[] {
  if (typeof window === 'undefined') return DEFAULT_DORMS;
  try {
    const raw = localStorage.getItem(DORMS_KEY);
    if (!raw) {
      localStorage.setItem(DORMS_KEY, JSON.stringify(DEFAULT_DORMS));
      return DEFAULT_DORMS;
    }
    const parsed: DormitoryConfig[] = JSON.parse(raw);
    return parsed.map((d) => {
      const match = DEFAULT_DORMS.find((dd) => dd.id === d.id);
      return {
        ...match,
        ...d,
        latitude: d.latitude || match?.latitude,
        longitude: d.longitude || match?.longitude,
        distanceKm: d.distanceKm || match?.distanceKm || 2.4,
        mapsQuery: d.mapsQuery || match?.mapsQuery || `${d.name}, Karabük`,
      };
    });
  } catch {
    return DEFAULT_DORMS;
  }
}

// --- STORE BRANCHES MANAGEMENT ---

export function getStoreBranches(): StoreBranch[] {
  if (typeof window === 'undefined') return DEFAULT_BRANCHES;
  try {
    const raw = localStorage.getItem(BRANCHES_KEY);
    if (!raw) {
      localStorage.setItem(BRANCHES_KEY, JSON.stringify(DEFAULT_BRANCHES));
      return DEFAULT_BRANCHES;
    }
    const parsed: StoreBranch[] = JSON.parse(raw);
    return parsed.map((b) => {
      const match = DEFAULT_BRANCHES.find((db) => db.id === b.id);
      return { ...match, ...b };
    });
  } catch {
    return DEFAULT_BRANCHES;
  }
}

export function saveStoreBranches(branches: StoreBranch[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
}

export function addStoreBranch(branch: Omit<StoreBranch, 'id'>): StoreBranch {
  const newBranch: StoreBranch = {
    ...branch,
    id: 'branch_' + Math.random().toString(36).substring(2, 9),
  };
  const current = getStoreBranches();
  saveStoreBranches([...current, newBranch]);
  return newBranch;
}

export function updateStoreBranch(id: string, updates: Partial<StoreBranch>): void {
  const current = getStoreBranches();
  const updated = current.map((b) => (b.id === id ? { ...b, ...updates } : b));
  saveStoreBranches(updated);
}

export function deleteStoreBranch(id: string): void {
  const current = getStoreBranches();
  saveStoreBranches(current.filter((b) => b.id !== id));
}

/**
 * Haversine formula: Computes great-circle distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Ray-casting Point-in-Polygon check: returns true if (lat, lng) is inside polygon [[lat, lng], ...]
 */
export function isPointInPolygon(lat: number, lng: number, polygon?: [number, number][]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates approximate 2D planar area of a polygon using the Shoelace formula
 * Used to prioritize specific/smaller zones when polygons overlap
 */
export function calculatePolygonArea(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    area += (coords[j][1] + coords[i][1]) * (coords[j][0] - coords[i][0]);
  }
  return Math.abs(area / 2);
}

/**
 * Finds the closest active store branch and the corresponding delivery zone for a customer point
 */
export function getClosestBranchAndZone(lat: number, lng: number): {
  branch: StoreBranch;
  zone: DeliveryZone;
  distanceKm: number;
} {
  const branches = getStoreBranches().filter((b) => b.isActive);
  const zones = getDeliveryZones().filter((z) => z.isActive);

  const fallbackBranch = branches[0] || DEFAULT_BRANCHES[0];
  const fallbackZone = zones[0] || {
    id: 'zone-100yil',
    name: '100. Yıl Mah. (Çekirdek Bölge)',
    minOrderAmount: 50,
    deliveryFee: 10,
    freeDeliveryThreshold: 120,
    estimatedMinutes: 12,
    isActive: true,
    radiusKm: 1.5,
    hexRing: 1,
    hexColor: '#10B981',
  };

  if (branches.length === 0) {
    return { branch: fallbackBranch, zone: fallbackZone, distanceKm: 1.0 };
  }

  // 1. Calculate distance to each branch and pick the closest
  let closestBranch = branches[0];
  let minDistance = calculateDistanceKm(closestBranch.latitude, closestBranch.longitude, lat, lng);

  for (let i = 1; i < branches.length; i++) {
    const dist = calculateDistanceKm(branches[i].latitude, branches[i].longitude, lat, lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestBranch = branches[i];
    }
  }

  // 2. Priority 1: Check if (lat, lng) falls directly inside any custom drawn polygon zone
  // Handle overlaps: if multiple polygons match, pick the most specific (smallest area) one
  const matchingPolygons = zones.filter(
    (z) => z.polygonCoords && z.polygonCoords.length >= 3 && isPointInPolygon(lat, lng, z.polygonCoords)
  );

  if (matchingPolygons.length > 0) {
    const bestPolygonMatch = matchingPolygons.length === 1
      ? matchingPolygons[0]
      : [...matchingPolygons].sort((a, b) => {
          const areaA = calculatePolygonArea(a.polygonCoords!);
          const areaB = calculatePolygonArea(b.polygonCoords!);
          return areaA - areaB;
        })[0];

    return {
      branch: closestBranch,
      zone: bestPolygonMatch,
      distanceKm: minDistance,
    };
  }

  // 3. Priority 2: Distance ring fallback
  const sortedZones = [...zones].sort((a, b) => (a.radiusKm || 2) - (b.radiusKm || 2));
  let matchedZone = sortedZones[sortedZones.length - 1] || fallbackZone;

  for (const z of sortedZones) {
    const r = z.radiusKm || (z.hexRing ? z.hexRing * 1.8 : 2.5);
    if (minDistance <= r) {
      matchedZone = z;
      break;
    }
  }

  return {
    branch: closestBranch,
    zone: matchedZone,
    distanceKm: minDistance,
  };
}

export function saveDormitories(dorms: DormitoryConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DORMS_KEY, JSON.stringify(dorms));
}

export function addDormitory(dorm: Omit<DormitoryConfig, 'id'>): DormitoryConfig {
  const newDorm: DormitoryConfig = {
    ...dorm,
    id: 'dorm_' + Math.random().toString(36).substring(2, 9),
  };
  const current = getDormitories();
  saveDormitories([newDorm, ...current]);
  return newDorm;
}

export function updateDormitory(id: string, updates: Partial<DormitoryConfig>): void {
  const current = getDormitories();
  const updated = current.map((d) => (d.id === id ? { ...d, ...updates } : d));
  saveDormitories(updated);
}

export function deleteDormitory(id: string): void {
  const current = getDormitories();
  saveDormitories(current.filter((d) => d.id !== id));
}

export function addDeliveryZone(zone: Omit<DeliveryZone, 'id'>): DeliveryZone {
  const newZone: DeliveryZone = {
    ...zone,
    id: 'zone_' + Math.random().toString(36).substring(2, 9),
  };
  const current = getDeliveryZones();
  saveDeliveryZones([newZone, ...current]);
  return newZone;
}

export function updateDeliveryZone(id: string, updates: Partial<DeliveryZone>): void {
  const current = getDeliveryZones();
  const updated = current.map((z) => (z.id === id ? { ...z, ...updates } : z));
  saveDeliveryZones(updated);
}

export function deleteDeliveryZone(id: string): void {
  const current = getDeliveryZones();
  saveDeliveryZones(current.filter((z) => z.id !== id));
}

// --- DEFAULT CAMPAIGNS ---
const DEFAULT_CAMPAIGNS: Campaign[] = [];

// --- CAMPAIGNS (PERSISTENCE & REALTIME SUPABASE SYNC) ---

// Row mapper for campaigns table in Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToCampaign(row: any): Campaign {
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    type: row.type || 'fixed_discount',
    value: Number(row.value) || 0,
    bundlePrice: row.bundle_price != null ? Number(row.bundle_price) : undefined,
    bundleProducts: Array.isArray(row.bundle_products) ? row.bundle_products : undefined,
    bundleBadge: row.bundle_badge || undefined,
    minOrderAmount: row.min_order_amount != null ? Number(row.min_order_amount) : undefined,
    maxDiscount: row.max_discount != null ? Number(row.max_discount) : undefined,
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at || new Date().toISOString(),
    endsAt: row.ends_at || '2030-12-31T23:59:59.000Z',
    bannerColor: row.banner_color || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCampaignToRow(c: Campaign): any {
  return {
    id: c.id,
    title: c.title,
    description: c.description || '',
    type: c.type,
    value: c.value,
    min_order_amount: c.minOrderAmount ?? null,
    max_discount: c.maxDiscount ?? null,
    is_active: c.isActive,
    starts_at: c.startsAt,
    ends_at: c.endsAt,
    banner_color: c.bannerColor ?? null,
    bundle_products: c.bundleProducts ?? null,
    bundle_price: c.bundlePrice ?? null,
    bundle_badge: c.bundleBadge ?? null,
    created_at: c.createdAt || new Date().toISOString(),
  };
}

function saveCampaignsLocally(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  window.dispatchEvent(new CustomEvent('caglabufe_campaigns_updated', { detail: campaigns }));
  if (campaignsBroadcastChannel) {
    try {
      campaignsBroadcastChannel.postMessage({ type: 'CAMPAIGNS_UPDATED', campaigns });
    } catch {}
  }
}

export function getCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return DEFAULT_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCampaigns(campaigns: Campaign[]): Promise<void> {
  saveCampaignsLocally(campaigns);

  if (isSupabaseConfigured() && supabase) {
    try {
      const rows = campaigns.map(mapCampaignToRow);
      const { error } = await supabase.from('campaigns').upsert(rows);
      if (error) {
        console.warn('[Supabase] Failed to upsert campaigns:', error);
      }
    } catch (e) {
      console.warn('[Supabase] saveCampaigns error:', e);
    }
  }
}

const PURGED_CAMPAIGN_IDS = new Set([
  'camp_2ttv7s2',
  'camp_lk6ax2a',
  'camp_free_delivery',
  'camp_ogrenci_indirim',
  'camp_bundle_bufe_menusu',
  'camp_bundle_kola_cekirdek',
]);

/**
 * Fetches all campaigns from Supabase.
 * Supabase is the single source of truth.
 */
export async function fetchCampaignsFromSupabase(): Promise<Campaign[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // If any purged campaigns still appear, wipe them from Supabase in background
        const staleItems = data.filter((row) => PURGED_CAMPAIGN_IDS.has(row.id));
        if (staleItems.length > 0) {
          const staleIds = staleItems.map((r) => r.id);
          supabase.from('campaigns').delete().in('id', staleIds).then(() => {});
        }

        const validRows = data.filter((row) => !PURGED_CAMPAIGN_IDS.has(row.id));
        const remoteCampaigns = validRows.map(mapRowToCampaign);
        saveCampaignsLocally(remoteCampaigns);
        return remoteCampaigns;
      }
    } catch (e) {
      console.warn('[Supabase] fetchCampaignsFromSupabase fallback:', e);
    }
  }

  return getCampaigns();
}



export async function addCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
  const newCampaign: Campaign = {
    ...campaign,
    id: 'camp_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  };
  const current = getCampaigns();
  const updated = [newCampaign, ...current.filter((c) => c.id !== newCampaign.id)];
  saveCampaignsLocally(updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('campaigns').upsert(mapCampaignToRow(newCampaign));
      if (error) {
        console.warn('[Supabase] addCampaign error:', error);
      }
    } catch (e) {
      console.warn('[Supabase] addCampaign error:', e);
    }
  }
  return newCampaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
  const current = getCampaigns();
  const item = current.find((c) => c.id === id);
  if (!item) return;
  const updatedItem: Campaign = { ...item, ...updates };
  const updated = current.map((c) => (c.id === id ? updatedItem : c));
  saveCampaignsLocally(updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('campaigns').upsert(mapCampaignToRow(updatedItem));
      if (error) {
        console.warn('[Supabase] updateCampaign error:', error);
      }
    } catch (e) {
      console.warn('[Supabase] updateCampaign error:', e);
    }
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  const current = getCampaigns();
  const updated = current.filter((c) => c.id !== id);
  saveCampaignsLocally(updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) {
        console.warn('[Supabase] deleteCampaign error:', error);
      }
    } catch (e) {
      console.warn('[Supabase] deleteCampaign error:', e);
    }
  }
}

/**
 * Realtime subscription to campaigns across tabs, windows, and Supabase Postgres changes
 */
export function subscribeToCampaigns(callback: (campaigns: Campaign[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e: Event) => {
    const ce = e as CustomEvent<Campaign[]>;
    callback(ce.detail || getCampaigns());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === CAMPAIGNS_KEY) {
      callback(getCampaigns());
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CAMPAIGNS_UPDATED' && event.data.campaigns) {
      callback(event.data.campaigns);
    }
  };

  window.addEventListener('caglabufe_campaigns_updated', handleCustom);
  window.addEventListener('storage', handleStorage);
  if (campaignsBroadcastChannel) {
    campaignsBroadcastChannel.addEventListener('message', handleBroadcast);
  }

  let supabaseSub: { unsubscribe: () => void } | null = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase
        .channel('public:campaigns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaigns' },
          () => {
            fetchCampaignsFromSupabase().then((latest) => {
              callback(latest);
            });
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
    window.removeEventListener('caglabufe_campaigns_updated', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (campaignsBroadcastChannel) {
      campaignsBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    supabaseSub?.unsubscribe();
  };
}

export function getActiveCampaigns(campaignsList?: Campaign[]): Campaign[] {
  const now = new Date();
  const list = campaignsList || getCampaigns();
  return list.filter((c) => {
    if (!c.isActive) return false;
    const start = new Date(c.startsAt);
    const end = new Date(c.endsAt);
    return now >= start && now <= end;
  });
}

export function getActiveBundleDeals(campaignsList?: Campaign[]): Campaign[] {
  return getActiveCampaigns(campaignsList).filter(
    (c) => c.type === 'bundle_deal' && c.bundleProducts && c.bundleProducts.length > 0
  );
}

// --- STORE OPEN/CLOSE LOGIC ---

export function isStoreOpen(customSettings?: SystemSettings): boolean {
  const settings = customSettings || getSystemSettings();

  // Manual override: admin can force open or close
  if (settings.isManualOverride) {
    return Boolean(settings.isManuallyOpen);
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = settings.storeOpenTime.split(':').map(Number);
  const [closeH, closeM] = settings.storeCloseTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Gece yarısını geçen durumu hesapla (16:00 - 03:00 gibi)
  if (closeMinutes < openMinutes) {
    // Açılış ve kapanış gece yarısını geçiyor
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  } else {
    // Normal durum (08:00 - 22:00 gibi)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
}

// --- ZONE-BASED DELIVERY CALCULATIONS ---

export function getZoneForAddress(
  district: string,
  dormName?: string,
  coords?: { latitude?: number; longitude?: number }
): DeliveryZone | null {
  // 0. If exact coordinates are provided, resolve zone with Euclidean / Haversine distance to nearest branch
  if (coords?.latitude && coords?.longitude) {
    const res = getClosestBranchAndZone(coords.latitude, coords.longitude);
    if (res?.zone) return res.zone;
  }

  const zones = getDeliveryZones();
  const dorms = getDormitories();

  // 1. Yurt adı verilmişse doğrudan eşleştir
  if (dormName) {
    const matchedDorm = dorms.find(
      (d) =>
        d.isActive &&
        (d.name.toLowerCase() === dormName.toLowerCase() ||
          dormName.toLowerCase().includes(d.name.toLowerCase()) ||
          d.name.toLowerCase().includes(dormName.toLowerCase()))
    );
    if (matchedDorm) {
      const found = zones.find((z) => z.id === matchedDorm.zoneId && z.isActive);
      if (found) return found;
    }
  }

  // 2. Yurt ilçe/semt eşleşmesi
  if (district) {
    const matchedByDistrict = dorms.find(
      (d) =>
        d.isActive &&
        (d.district.toLowerCase() === district.toLowerCase() ||
          d.name.toLowerCase().includes(district.toLowerCase()))
    );
    if (matchedByDistrict) {
      const found = zones.find((z) => z.id === matchedByDistrict.zoneId && z.isActive);
      if (found) return found;
    }

    // 3. Normal mahalle / bölge eşleşmesi
    const zoneMatch = zones.find(
      (z) =>
        z.isActive &&
        (z.name.toLowerCase().includes(district.toLowerCase()) ||
          district.toLowerCase().includes(z.name.toLowerCase().split('&')[0].trim()))
    );
    if (zoneMatch) return zoneMatch;
  }

  // Fallback: ilk aktif bölge
  return zones.find((z) => z.isActive) || null;
}

export function calculateDeliveryForZone(
  zone: DeliveryZone | null,
  cartTotal: number,
  customSettings?: SystemSettings
): { minOrder: number; deliveryFee: number; freeThreshold: number; estimatedMin: number } {
  const settings = customSettings || getSystemSettings();
  if (!zone) {
    return {
      minOrder: settings.defaultMinOrder,
      deliveryFee: cartTotal >= settings.defaultFreeDeliveryThreshold ? 0 : settings.defaultDeliveryFee,
      freeThreshold: settings.defaultFreeDeliveryThreshold,
      estimatedMin: 20,
    };
  }
  return {
    minOrder: zone.minOrderAmount,
    deliveryFee: cartTotal >= zone.freeDeliveryThreshold ? 0 : zone.deliveryFee,
    freeThreshold: zone.freeDeliveryThreshold,
    estimatedMin: zone.estimatedMinutes,
  };
}

// --- CAMPAIGN EVALUATION & DISCOUNT (SINGLE CAMPAIGN ENFORCEMENT) ---

export interface SingleCampaignEvaluationResult {
  appliedCampaignId: string | null;
  appliedCampaignTitle: string | null;
  discountAmount: number;
  isFreeDeliveryCampaign: boolean;
  benefitAmount: number;
  campaignDescription?: string | null;
  isBundleApplied?: boolean;
}

/**
 * Calculates the single best applicable campaign for an order.
 * CRITICAL RULE: Exactly ONE campaign can be used per order at any time.
 * Campaigns are never stacked or combined.
 */
export function evaluateSingleBestCampaign({
  cartTotal,
  cartItems,
  hasBundle = false,
  standardDeliveryFee = 0,
  isZoneAlreadyFree = false,
  campaignsList,
}: {
  cartTotal: number;
  cartItems: { productId: string; category: string; quantity: number; price: number }[];
  hasBundle?: boolean;
  standardDeliveryFee?: number;
  isZoneAlreadyFree?: boolean;
  campaignsList?: Campaign[];
}): SingleCampaignEvaluationResult {
  // If the cart contains a bundle deal (combo menu), that order is already using a campaign.
  if (hasBundle) {
    return {
      appliedCampaignId: 'bundle_deal_active',
      appliedCampaignTitle: 'Fırsat Paketi (Kombin Menü)',
      discountAmount: 0,
      isFreeDeliveryCampaign: false,
      benefitAmount: 0,
      campaignDescription: 'Sepette kombin menü kampanyası uygulandı. Kampanyalar birleştirilemez.',
      isBundleApplied: true,
    };
  }

  const activeCampaigns = getActiveCampaigns(campaignsList);
  if (activeCampaigns.length === 0 || cartTotal <= 0) {
    return {
      appliedCampaignId: null,
      appliedCampaignTitle: null,
      discountAmount: 0,
      isFreeDeliveryCampaign: false,
      benefitAmount: 0,
    };
  }

  let bestBenefit = 0;
  let bestCampaign: Campaign | null = null;
  let isBestFreeDelivery = false;

  for (const campaign of activeCampaigns) {
    // Ignore bundle deals here since bundles are evaluated via cart items above
    if (campaign.type === 'bundle_deal') continue;

    // Minimum order check
    if (campaign.minOrderAmount && cartTotal < campaign.minOrderAmount) continue;

    if (campaign.type === 'free_delivery') {
      // If delivery is already free by zone threshold, free delivery campaign adds 0 extra benefit
      if (isZoneAlreadyFree || standardDeliveryFee <= 0) {
        continue;
      }
      const benefit = standardDeliveryFee;
      if (benefit > bestBenefit) {
        bestBenefit = benefit;
        bestCampaign = campaign;
        isBestFreeDelivery = true;
      }
      continue;
    }

    // Determine applicable items total for category or product specific campaigns
    let applicableTotal = cartTotal;
    if (campaign.applicableCategories && campaign.applicableCategories.length > 0) {
      applicableTotal = cartItems
        .filter((item) => campaign.applicableCategories!.includes(item.category as never))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    if (campaign.applicableProductIds && campaign.applicableProductIds.length > 0) {
      applicableTotal = cartItems
        .filter((item) => campaign.applicableProductIds!.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    let discount = 0;
    if (campaign.type === 'percentage_discount') {
      discount = applicableTotal * (campaign.value / 100);
    } else if (campaign.type === 'fixed_discount') {
      discount = campaign.value;
    }

    // Cap at maxDiscount if defined
    if (campaign.maxDiscount && discount > campaign.maxDiscount) {
      discount = campaign.maxDiscount;
    }
    // Cannot discount more than cartTotal
    discount = Math.min(discount, cartTotal);

    if (discount > bestBenefit) {
      bestBenefit = discount;
      bestCampaign = campaign;
      isBestFreeDelivery = false;
    }
  }

  if (!bestCampaign || bestBenefit <= 0) {
    return {
      appliedCampaignId: null,
      appliedCampaignTitle: null,
      discountAmount: 0,
      isFreeDeliveryCampaign: false,
      benefitAmount: 0,
    };
  }

  return {
    appliedCampaignId: bestCampaign.id,
    appliedCampaignTitle: bestCampaign.title,
    discountAmount: isBestFreeDelivery ? 0 : Math.round(bestBenefit * 100) / 100,
    isFreeDeliveryCampaign: isBestFreeDelivery,
    benefitAmount: Math.round(bestBenefit * 100) / 100,
    campaignDescription: bestCampaign.description,
  };
}

export function calculateCampaignDiscount(
  cartTotal: number,
  cartItems: { productId: string; category: string; quantity: number; price: number }[],
  campaignsList?: Campaign[]
): { discountAmount: number; campaignId: string | null; campaignTitle: string | null } {
  const res = evaluateSingleBestCampaign({ cartTotal, cartItems, campaignsList });
  return {
    discountAmount: res.discountAmount,
    campaignId: res.appliedCampaignId,
    campaignTitle: res.appliedCampaignTitle,
  };
}

export function hasActiveFreeDeliveryCampaign(campaignsList?: Campaign[]): boolean {
  return getActiveCampaigns(campaignsList).some((c) => c.type === 'free_delivery');
}

// --- COUPON & VIP LOYALTY SYSTEM ---
const COUPONS_KEY = 'caglabufe_coupons_v1';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-vip20',
    code: 'VIP20',
    title: '👑 VIP & Sadık Müdavim İndirimi',
    description: 'En çok sipariş veren müşterilerimize özel sepet tutarında %20 indirim!',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 75,
    maxDiscount: 60,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-favori15',
    code: 'FAVORI15',
    title: '🥇 Favori Müşteri İndirimi',
    description: 'Çağla Büfe müdavimlerine özel %15 sepet indirimi!',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 60,
    maxDiscount: 45,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-cagla10',
    code: 'CAGLA10',
    title: '⚡ Çağla Hoş Geldin İndirimi',
    description: 'Tüm siparişlerde geçerli anında 15 TL indirim!',
    discountType: 'fixed',
    discountValue: 15,
    minOrderAmount: 80,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function getCoupons(): Coupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (!raw) {
      localStorage.setItem(COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function saveCoupons(coupons: Coupon[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  } catch {}
}

export function addCoupon(coupon: Omit<Coupon, 'id' | 'createdAt'>): Coupon {
  const coupons = getCoupons();
  const newCoupon: Coupon = {
    ...coupon,
    id: 'coupon_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    code: coupon.code.trim().toUpperCase(),
  };
  saveCoupons([newCoupon, ...coupons]);
  return newCoupon;
}

export function deleteCoupon(id: string): void {
  const coupons = getCoupons();
  saveCoupons(coupons.filter((c) => c.id !== id));
}

export function validateCoupon(
  code: string,
  cartTotal: number,
  userPhone?: string
): {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount: number;
} {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Lütfen bir kupon kodu giriniz.', discountAmount: 0 };
  }

  const coupons = getCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

  if (!coupon) {
    return { valid: false, message: 'Geçersiz veya süresi dolmuş kupon kodu.', discountAmount: 0 };
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: 'Bu kupon kodunun kullanım süresi dolmuştur.', discountAmount: 0 };
  }

  // Target phone check
  if (coupon.targetPhone && userPhone) {
    const cleanUser = userPhone.replace(/\D/g, '');
    const cleanTarget = coupon.targetPhone.replace(/\D/g, '');
    if (cleanUser && cleanTarget && cleanUser !== cleanTarget) {
      return { valid: false, message: 'Bu özel kupon yalnızca tanımlanan hesaba aittir.', discountAmount: 0 };
    }
  }

  // Min order amount check
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Bu kuponu kullanmak için minimum sepet tutarı ${coupon.minOrderAmount} TL olmalıdır.`,
      discountAmount: 0,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cartTotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  discount = Math.min(discount, cartTotal);
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    message: `${coupon.title} başarıyla uygulandı! (-${discount.toFixed(2)} TL)`,
    coupon,
    discountAmount: discount,
  };
}

// --- VIP SADAKAT & BİLDİRİM SİSTEMİ ---
export const VIP_NOTIFICATIONS_KEY = 'caglabufe_vip_notifications_v1';
export const DISMISSED_VIP_NOTIFS_KEY = 'caglabufe_dismissed_vip_notifs_v1';

export function getVipTierInfo(orderCount: number, totalSpent: number = 0): VipTierInfo {
  if (orderCount >= 10 || totalSpent >= 2000) {
    return {
      level: 'platinum',
      label: 'Platin Müdavim',
      badge: '👑 Platin',
      iconEmoji: '👑',
      discountPercentage: 20,
      minOrders: 10,
      minSpend: 2000,
      color: '#7C3AED',
      bg: '#EDE9FE',
      border: '#DDD6FE',
      perk: '%20 VIP İndirimi & Öncelikli Hazırlık',
    };
  }
  if (orderCount >= 5 || totalSpent >= 1000) {
    return {
      level: 'gold',
      label: 'Altın Müdavim',
      badge: '🥇 Altın',
      iconEmoji: '🥇',
      discountPercentage: 15,
      minOrders: 5,
      minSpend: 1000,
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
      perk: '%15 Müdavim İndirimi & Özel İkramlar',
    };
  }
  if (orderCount >= 3 || totalSpent >= 500) {
    return {
      level: 'silver',
      label: 'Gümüş Müdavim',
      badge: '🥈 Gümüş',
      iconEmoji: '🥈',
      discountPercentage: 10,
      minOrders: 3,
      minSpend: 500,
      color: '#4B5563',
      bg: '#F1F5F9',
      border: '#CBD5E1',
      perk: '%10 İndirim & Hızlı Teslimat',
    };
  }
  if (orderCount >= 1 || totalSpent >= 100) {
    return {
      level: 'bronze',
      label: 'Bronz Müdavim',
      badge: '🥉 Bronz',
      iconEmoji: '🥉',
      discountPercentage: 5,
      minOrders: 1,
      minSpend: 100,
      color: '#92400E',
      bg: '#FFFBEB',
      border: '#FCD34D',
      perk: 'Müdavim Hoş Geldin Avantajları',
    };
  }
  return {
    level: 'new',
    label: 'Yeni Müdavim',
    badge: '🌟 Yeni',
    iconEmoji: '🌟',
    discountPercentage: 0,
    minOrders: 0,
    minSpend: 0,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    perk: 'İlk siparişinizle VIP seviyelerine adım atın',
  };
}

export function calculateCustomerLoyalty(orders: Order[] = []): CustomerLoyaltyProfile[] {
  if (!orders || orders.length === 0) return [];
  const map = new Map<string, {
    cleanPhone: string;
    formattedPhone: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate?: string;
  }>();

  orders.forEach((o) => {
    const clean = normalizePhoneNumber(o.customerPhone);
    if (!clean) return;
    const existing = map.get(clean);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += (o.finalAmount || 0);
      if (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.createdAt;
        if (o.customerName && o.customerName !== 'Müşteri') {
          existing.name = o.customerName;
        }
      }
    } else {
      map.set(clean, {
        cleanPhone: clean,
        formattedPhone: formatPhoneNumber(clean),
        name: o.customerName || 'Müşteri',
        orderCount: 1,
        totalSpent: (o.finalAmount || 0),
        lastOrderDate: o.createdAt,
      });
    }
  });

  return Array.from(map.values())
    .map((c) => ({
      ...c,
      tier: getVipTierInfo(c.orderCount, c.totalSpent),
    }))
    .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
}

export function getVipNotifications(): VipNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VIP_NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVipNotifications(notifs: VipNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VIP_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('caglabufe_vip_channel');
        bc.postMessage({ type: 'VIP_NOTIFS_UPDATED', count: notifs.length });
        bc.close();
      }
    } catch {}
    window.dispatchEvent(new CustomEvent('caglabufe_vip_notif_event', { detail: notifs }));
  } catch {}
}

export function sendVipNotification(notif: Omit<VipNotification, 'id' | 'createdAt'>): VipNotification {
  const existing = getVipNotifications();
  const newNotif: VipNotification = {
    ...notif,
    id: 'vip_notif_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    read: false,
  };
  saveVipNotifications([newNotif, ...existing]);
  return newNotif;
}

export function getDismissedVipNotificationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISMISSED_VIP_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissVipNotification(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedVipNotificationIds();
    if (!dismissed.includes(id)) {
      localStorage.setItem(DISMISSED_VIP_NOTIFS_KEY, JSON.stringify([...dismissed, id]));
    }
    window.dispatchEvent(new CustomEvent('caglabufe_vip_notif_dismissed', { detail: id }));
  } catch {}
}

