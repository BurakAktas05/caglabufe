import { SystemSettings, DeliveryZone, DormitoryConfig, Campaign } from '@/types';

// --- STORAGE KEYS ---
const SETTINGS_KEY = 'caglabufe_system_settings_v1';
const ZONES_KEY = 'caglabufe_delivery_zones_v1';
const DORMS_KEY = 'caglabufe_dormitories_v1';
const CAMPAIGNS_KEY = 'caglabufe_campaigns_v2';

// --- DEFAULT SYSTEM SETTINGS ---
const DEFAULT_SETTINGS: SystemSettings = {
  storeName: 'Çağla Büfe & Market',
  storeOpenTime: '16:00',
  storeCloseTime: '03:00',
  isManuallyOpen: false,
  isManualOverride: false,
  closedMessage: 'Sipariş saatleri dışındayız. Hizmet saatlerimiz her gün 16:00 - 03:00 arasıdır.',
  announcementText: '🛵 Karabük & KYK Yurtlarına 15-20 dakikada sıcak teslimat! Gece acıkanlara özel tost ve atıştırmalıklar kapınızda.',
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
export function getGoogleMapsNavigationUrl(address?: { type?: string; dormName?: string; blockNumber?: string; fullAddress?: string; district?: string }): string {
  if (!address) return 'https://www.google.com/maps';
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

// --- DEFAULT DELIVERY ZONES (ALTIGEN & MESAFE HALKALARI) ---
const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'zone-100yil',
    name: '100. Yıl Mah. & Çevresi (Çekirdek Bölge)',
    minOrderAmount: 50,
    deliveryFee: 10,
    freeDeliveryThreshold: 120,
    estimatedMinutes: 12,
    isActive: true,
    radiusKm: 1.2,
    hexRing: 1,
    hexColor: '#10B981', // Zümrüt Yeşili
  },
  {
    id: 'zone-kyk-yurtlari',
    name: 'KYK Yurtları Halkası (Hubbi Hatun, Şeyh Edebali)',
    minOrderAmount: 60,
    deliveryFee: 15,
    freeDeliveryThreshold: 150,
    estimatedMinutes: 18,
    isActive: true,
    radiusKm: 2.8,
    hexRing: 2,
    hexColor: '#8B5CF6', // Mor / Menekşe
  },
  {
    id: 'zone-sirinevler',
    name: 'Şirinevler & 5000 Evler (Dış Mahalleler)',
    minOrderAmount: 80,
    deliveryFee: 20,
    freeDeliveryThreshold: 200,
    estimatedMinutes: 25,
    isActive: true,
    radiusKm: 4.8,
    hexRing: 3,
    hexColor: '#F59E0B', // Kehribar / Turuncu
  },
  {
    id: 'zone-merkez',
    name: 'Safranbolu & Karabük Merkez (Geniş Tarife)',
    minOrderAmount: 120,
    deliveryFee: 30,
    freeDeliveryThreshold: 250,
    estimatedMinutes: 35,
    isActive: true,
    radiusKm: 7.2,
    hexRing: 4,
    hexColor: '#EF4444', // Kırmızı
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

export function saveSystemSettings(settings: SystemSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('caglabufe_settings_updated', { detail: settings }));
}

/**
 * Subscribe to realtime/local settings changes across components & tabs
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

  window.addEventListener('caglabufe_settings_updated', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('caglabufe_settings_updated', handleCustom);
    window.removeEventListener('storage', handleStorage);
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
        distanceKm: d.distanceKm || match?.distanceKm || 2.4,
        mapsQuery: d.mapsQuery || match?.mapsQuery || `${d.name}, Karabük`,
      };
    });
  } catch {
    return DEFAULT_DORMS;
  }
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
    id: 'camp_bundle_kola_cekirdek',
    title: 'Film & Maç Paketi (Kola + Çekirdek)',
    description: '1 Litre Coca-Cola ve Tadım Siyah Ayçekirdeği (180 gr) birlikte süper indirimli!',
    type: 'bundle_deal',
    value: 85,
    bundlePrice: 85,
    bundleOriginalPrice: 100,
    bundleBadge: 'Süper İkili',
    bundleProducts: [
      { productId: 'coca-cola-1l', quantity: 1 },
      { productId: 'tadim-cekirdek-180', quantity: 1 },
    ],
    isActive: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2030-12-31T23:59:59.000Z',
    bannerColor: '#DC2626',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'camp_bundle_bufe_menusu',
    title: 'Çağla Büfe Doyurucu Tost Menüsü',
    description: 'Çağla Spesiyal Karışık Tost + Çıtır Parmak Patates + Eker Yayık Ayran',
    type: 'bundle_deal',
    value: 200,
    bundlePrice: 200,
    bundleOriginalPrice: 235,
    bundleBadge: 'Doyurucu Menü',
    bundleProducts: [
      { productId: 'tost-cagla-spesiyal', quantity: 1 },
      { productId: 'citir-patates-sepeti', quantity: 1 },
      { productId: 'eker-ayran-300', quantity: 1 },
    ],
    isActive: true,
    startsAt: '2024-01-01T00:00:00.000Z',
    endsAt: '2030-12-31T23:59:59.000Z',
    bannerColor: '#5D3EBC',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
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

export function isStoreOpen(): boolean {
  const settings = getSystemSettings();

  // Manual override: admin can force open or close
  if (settings.isManualOverride) {
    return settings.isManuallyOpen;
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

export function getZoneForAddress(district: string, dormName?: string): DeliveryZone | null {
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
