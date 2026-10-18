import { SystemSettings, DeliveryZone, DormitoryConfig, Campaign, StoreBranch } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- STORAGE KEYS ---
const SETTINGS_KEY = 'caglabufe_system_settings_v1';
const ZONES_KEY = 'caglabufe_delivery_zones_v1';
const DORMS_KEY = 'caglabufe_dormitories_v1';
const CAMPAIGNS_KEY = 'caglabufe_campaigns_v2';
const BRANCHES_KEY = 'caglabufe_store_branches_v1';

// --- 2 ANA MARKET / ŞUBE ODAK NOKTALARI ---
export const DEFAULT_BRANCHES: StoreBranch[] = [
  {
    id: 'branch-100yil',
    name: '1. Şube: 100. Yıl Mah. (Merkez Büfe)',
    shortName: '1. Şube (100. Yıl)',
    address: '100. Yıl Mah. 1003. Cad. No:12 Karabük',
    phone: '0542 000 7878',
    latitude: 41.2065,
    longitude: 32.6285,
    color: '#5D3EBC', // Çağla Moru
    isActive: true,
    description: '100. Yıl, Eflani KYK, Akademi Yurdu ve Üniversite Çevresi',
  },
  {
    id: 'branch-kampus',
    name: '2. Şube: Demir Çelik Kampüsü & Safranbolu',
    shortName: '2. Şube (Kampüs)',
    address: 'Demir Çelik Kampüsü Kılavuzlar Kavşağı Karabük',
    phone: '0542 000 7879',
    latitude: 41.2185,
    longitude: 32.6510,
    color: '#059669', // Zümrüt Yeşili
    isActive: true,
    description: 'Hubbi Hatun KYK, Şeyh Edebali KYK, Prestij Yurdu ve Safranbolu Girişi',
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
  announcementText: '🛵 Karabük & KYK Yurtlarına 15-20 dakikada hızlı teslimat! Soğuk içecek, çikolata, cips ve market ihtiyaçları kapınızda.',
  isAnnouncementActive: true,
  defaultMinOrder: 60,
  defaultDeliveryFee: 15,
  defaultFreeDeliveryThreshold: 150,
  adminPassword: 'cagla2024',
  storePhone: '0542 000 7878',
  storeWhatsApp: '905420007878',
  storeAddress: '100. Yıl Mah. 1003. Cad. No:12 Karabük',
  storeLatitude: 41.2065,
  storeLongitude: 32.6285,
  soundPreset: 'bell',
  soundVolume: 0.6,
  soundRepeatCount: 2,
  enableVibration: true,
  templateOrderReceived: 'Siparişiniz alındı! #{orderNumber} nolu siparişiniz onaylandı.',
  templateOrderPreparing: 'Mutfakta hazırlanıyor! #{orderNumber} nolu siparişiniz fırından çıkmak üzere.',
  templateOrderOnTheWay: 'Kuryemiz yola çıktı! #{orderNumber} nolu siparişiniz ~10-15 dk içinde kapınızda.',
  templateOrderDelivered: 'Siparişiniz teslim edildi! Afiyet olsun, Çağla Büfe keyifli geceler diler.',
  templateWhatsApp: 'Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL siparişim ({dormOrAddress}) hakkında yazıyorum.',
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
  const addr = settings?.storeAddress || '100. Yıl Mah. 1003. Cad. No:12 Karabük';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

// --- DEFAULT DELIVERY ZONES (TEMİZ POLİGON VE MESAFE ALANLARI) ---
const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'zone-100yil',
    name: '100. Yıl Mah. (Çekirdek Bölge)',
    minOrderAmount: 50,
    deliveryFee: 10,
    freeDeliveryThreshold: 120,
    estimatedMinutes: 12,
    isActive: true,
    radiusKm: 1.5,
    hexRing: 1,
    hexColor: '#10B981', // Zümrüt Yeşili
    polygonCoords: [
      [41.2135, 32.6210],
      [41.2140, 32.6375],
      [41.2015, 32.6385],
      [41.1990, 32.6235],
    ],
  },
  {
    id: 'zone-kyk-yurtlari',
    name: 'KYK Yurtları & Kampüs (Hubbi Hatun, Edebali)',
    minOrderAmount: 60,
    deliveryFee: 15,
    freeDeliveryThreshold: 150,
    estimatedMinutes: 18,
    isActive: true,
    radiusKm: 3.0,
    hexRing: 2,
    hexColor: '#8B5CF6', // Mor / Menekşe
    polygonCoords: [
      [41.2260, 32.6380],
      [41.2255, 32.6620],
      [41.2085, 32.6590],
      [41.2075, 32.6385],
    ],
  },
  {
    id: 'zone-sirinevler',
    name: 'Şirinevler & 5000 Evler (Çevre Mahalleler)',
    minOrderAmount: 80,
    deliveryFee: 20,
    freeDeliveryThreshold: 200,
    estimatedMinutes: 25,
    isActive: true,
    radiusKm: 5.0,
    hexRing: 3,
    hexColor: '#F59E0B', // Kehribar / Turuncu
    polygonCoords: [
      [41.2160, 32.5950],
      [41.2150, 32.6200],
      [41.1920, 32.6220],
      [41.1910, 32.5980],
    ],
  },
  {
    id: 'zone-merkez',
    name: 'Safranbolu & Genişletilmiş Bölge',
    minOrderAmount: 120,
    deliveryFee: 30,
    freeDeliveryThreshold: 250,
    estimatedMinutes: 35,
    isActive: true,
    radiusKm: 7.5,
    hexRing: 4,
    hexColor: '#EF4444', // Kırmızı
    polygonCoords: [
      [41.2700, 32.6500],
      [41.2720, 32.7100],
      [41.2300, 32.7050],
      [41.2280, 32.6550],
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
    zoneId: 'zone-merkez',
    isActive: false,
    distanceKm: 7.2,
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Cross-tab broadcast channel for instant zero-latency settings sync
let settingsBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    settingsBroadcastChannel = new BroadcastChannel('caglabufe_realtime_settings');
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
  const polygonMatch = zones.find(
    (z) => z.polygonCoords && z.polygonCoords.length >= 3 && isPointInPolygon(lat, lng, z.polygonCoords)
  );

  if (polygonMatch) {
    return {
      branch: closestBranch,
      zone: polygonMatch,
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
const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_free_delivery',
    title: 'KYK Yurtlarına Ücretsiz Teslimat',
    description: '120 TL ve üzeri KYK yurtları siparişlerinde teslimat ücreti sıfırlanır.',
    type: 'free_delivery',
    value: 0,
    minOrderAmount: 120,
    isActive: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2030-12-31T23:59:59.000Z',
    bannerColor: '#5D3EBC',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'camp_ogrenci_indirim',
    title: '200 TL Üzerine 25 TL İndirim',
    description: 'Sepetiniz 200 TL ve üzeri olduğunda anında 25 TL indirim uygulanır.',
    type: 'fixed_discount',
    value: 25,
    minOrderAmount: 200,
    isActive: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2030-12-31T23:59:59.000Z',
    bannerColor: '#059669',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// --- CAMPAIGNS ---

export function getCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return DEFAULT_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    if (!raw) {
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(DEFAULT_CAMPAIGNS));
      return DEFAULT_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CAMPAIGNS;
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

export function addCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Campaign {
  const newCampaign: Campaign = {
    ...campaign,
    id: 'camp_' + Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
  };
  const current = getCampaigns();
  saveCampaigns([newCampaign, ...current]);
  return newCampaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>): void {
  const current = getCampaigns();
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCampaigns(updated);
}

export function deleteCampaign(id: string): void {
  const current = getCampaigns();
  saveCampaigns(current.filter((c) => c.id !== id));
}

export function getActiveCampaigns(): Campaign[] {
  const now = new Date();
  return getCampaigns().filter((c) => {
    if (!c.isActive) return false;
    const start = new Date(c.startsAt);
    const end = new Date(c.endsAt);
    return now >= start && now <= end;
  });
}

export function getActiveBundleDeals(): Campaign[] {
  return getActiveCampaigns().filter(
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

// --- CAMPAIGN DISCOUNT CALCULATION ---

export function calculateCampaignDiscount(
  cartTotal: number,
  cartItems: { productId: string; category: string; quantity: number; price: number }[]
): { discountAmount: number; campaignId: string | null; campaignTitle: string | null } {
  const activeCampaigns = getActiveCampaigns();
  if (activeCampaigns.length === 0) {
    return { discountAmount: 0, campaignId: null, campaignTitle: null };
  }

  let bestDiscount = 0;
  let bestCampaignId: string | null = null;
  let bestCampaignTitle: string | null = null;

  for (const campaign of activeCampaigns) {
    // Min order check
    if (campaign.minOrderAmount && cartTotal < campaign.minOrderAmount) continue;

    let discount = 0;

    // Determine applicable items total
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

    switch (campaign.type) {
      case 'percentage_discount':
        discount = applicableTotal * (campaign.value / 100);
        break;
      case 'fixed_discount':
        discount = campaign.value;
        break;
      case 'free_delivery':
        // Handled separately
        discount = 0;
        break;
      default:
        discount = 0;
    }

    // Cap at maxDiscount
    if (campaign.maxDiscount && discount > campaign.maxDiscount) {
      discount = campaign.maxDiscount;
    }

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestCampaignId = campaign.id;
      bestCampaignTitle = campaign.title;
    }
  }

  return {
    discountAmount: Math.round(bestDiscount * 100) / 100,
    campaignId: bestCampaignId,
    campaignTitle: bestCampaignTitle,
  };
}

export function hasActiveFreeDeliveryCampaign(): boolean {
  return getActiveCampaigns().some((c) => c.type === 'free_delivery');
}
