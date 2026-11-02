import { SystemSettings, DeliveryZone, DormitoryConfig, Campaign, Coupon, VipNotification, VipTierInfo, VipTierLevel, CustomerLoyaltyProfile, Order } from '@/types';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';

// --- STORAGE KEYS ---
const SETTINGS_KEY = 'caglabufe_system_settings_v8';
const ZONES_KEY = 'caglabufe_delivery_zones_v8';
const DORMS_KEY = 'caglabufe_dormitories_v8';
const CAMPAIGNS_KEY = 'caglabufe_campaigns_v8';

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

// --- DEFAULT DELIVERY ZONES (DÜKKANDAN UZAKLIĞA GÖRE 5 KADEMELİ DETAYLI SİSTEM) ---
export const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'zone-bostanbuku',
    name: 'Bostanbükü & Çevresi (Çekirdek Bölge - 0-1.8 km)',
    minOrderAmount: 50,
    deliveryFee: 10,
    freeDeliveryThreshold: 120,
    estimatedMinutes: 15,
    isActive: true,
    radiusKm: 1.8,
    hexRing: 1,
    hexColor: '#10B981', // Zümrüt Yeşili
    polygonCoords: [
      [41.2225, 32.6620],
      [41.2225, 32.6880],
      [41.2180, 32.6950],
      [41.2060, 32.6950],
      [41.2030, 32.6840],
      [41.2030, 32.6620],
      [41.2120, 32.6580],
      [41.2200, 32.6580],
    ],
  },
  {
    id: 'zone-kyk-yurtlari',
    name: 'KBÜ Kampüs, Kılavuzlar & Yurtlar Bölgesi (1.8-3.5 km)',
    minOrderAmount: 70,
    deliveryFee: 15,
    freeDeliveryThreshold: 150,
    estimatedMinutes: 20,
    isActive: true,
    radiusKm: 3.5,
    hexRing: 2,
    hexColor: '#8B5CF6', // Menekşe Moru
    polygonCoords: [
      [41.2330, 32.6360],
      [41.2330, 32.6620],
      [41.2200, 32.6620],
      [41.2080, 32.6580],
      [41.2030, 32.6480],
      [41.2030, 32.6360],
      [41.2150, 32.6360],
      [41.2280, 32.6360],
    ],
  },
  {
    id: 'zone-100yil',
    name: '100. Yıl Mah. (Öğrenci Yaşam & Özel Yurtlar - 3.5-5 km)',
    minOrderAmount: 80,
    deliveryFee: 20,
    freeDeliveryThreshold: 180,
    estimatedMinutes: 25,
    isActive: true,
    radiusKm: 5.0,
    hexRing: 3,
    hexColor: '#06B6D4', // Turkuaz
    polygonCoords: [
      [41.2330, 32.6100],
      [41.2330, 32.6360],
      [41.2030, 32.6360],
      [41.1980, 32.6360],
      [41.1980, 32.6100],
      [41.2150, 32.6100],
      [41.2250, 32.6100],
    ],
  },
  {
    id: 'zone-safranbolu',
    name: 'Safranbolu (Emek, Barış, Kıranköy & Çarşı - 3-6.5 km)',
    minOrderAmount: 100,
    deliveryFee: 25,
    freeDeliveryThreshold: 220,
    estimatedMinutes: 30,
    isActive: true,
    radiusKm: 6.5,
    hexRing: 4,
    hexColor: '#F59E0B', // Kehribar Turuncusu
    polygonCoords: [
      [41.2800, 32.6200],
      [41.2800, 32.7250],
      [41.2300, 32.7250],
      [41.2225, 32.6880],
      [41.2225, 32.6620],
      [41.2330, 32.6620],
      [41.2450, 32.6360],
      [41.2650, 32.6200],
    ],
  },
  {
    id: 'zone-sirinevler',
    name: 'Karabük Merkez, Şirinevler, 5000 Evler & Soğuksu (5.5-9 km)',
    minOrderAmount: 120,
    deliveryFee: 30,
    freeDeliveryThreshold: 250,
    estimatedMinutes: 35,
    isActive: true,
    radiusKm: 9.0,
    hexRing: 4,
    hexColor: '#EF4444', // Kırmızı
    polygonCoords: [
      [41.1980, 32.5500],
      [41.1980, 32.6100],
      [41.2030, 32.6480],
      [41.2030, 32.6950],
      [41.1650, 32.6950],
      [41.1650, 32.5500],
      [41.1800, 32.5500],
    ],
  },
];

// --- DEFAULT DORMITORIES (KARABÜK TÜM DEVLET KYK VE ÖZEL ÖĞRENCİ YURTLARI) ---
export const DEFAULT_DORMS: DormitoryConfig[] = [
  // --- 1. BOSTANBÜKÜ VE ÇEVRESİ (EN YAKIN ÇEKİRDEK BÖLGE: 0.6 - 1.2 KM) ---
  {
    id: 'bahaddin-gazi',
    name: 'KYK Bahaddin Gazi Erkek Öğrenci Yurdu',
    district: 'Bostanbükü / Safranbolu',
    gender: 'erkek',
    blocks: ['A Blok', 'B Blok', 'C Blok', 'D Blok', 'E Blok', 'F Blok'],
    zoneId: 'zone-bostanbuku',
    isActive: true,
    distanceKm: 0.6,
    mapsQuery: 'KYK Bahaddin Gazi Erkek Öğrenci Yurdu, Bostanbükü, Karabük',
    latitude: 41.2175,
    longitude: 32.6715,
    specialNote: 'Dükkanımıza 600 metre mesafede - Ekspres Hızlı Teslimat (10-15 dk)',
  },
  {
    id: 'katip-celebi',
    name: 'KYK Katip Çelebi Kız Öğrenci Yurdu',
    district: 'Bostanbükü / Safranbolu',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok'],
    zoneId: 'zone-bostanbuku',
    isActive: true,
    distanceKm: 0.9,
    mapsQuery: 'KYK Katip Çelebi Kız Öğrenci Yurdu, Bostanbükü, Karabük',
    latitude: 41.2140,
    longitude: 32.6650,
    specialNote: 'Bostanbükü Bahçelievler Girişi - Ekspres Hızlı Teslimat (10-15 dk)',
  },

  // --- 2. KBÜ DEMİR ÇELİK KAMPÜSÜ & KILAVUZLAR BÖLGESİ (2.0 - 3.2 KM) ---
  {
    id: 'hubbi-hatun',
    name: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü / Üniversite Mah.',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok', 'D Blok', 'E Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.3,
    mapsQuery: 'KYK Hubbi Hatun Kız Öğrenci Yurdu, Üniversite Mah., Karabük',
    latitude: 41.2128,
    longitude: 32.6465,
    specialNote: 'Demir Çelik Kampüsü Yurtlar Bölgesi Ana Giriş',
  },
  {
    id: 'asiye-hatun',
    name: 'KYK Asiye Hatun Kız Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü / Kılavuzlar',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok', 'D Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.6,
    mapsQuery: 'KYK Asiye Hatun Kız Öğrenci Yurdu, Kılavuzlar Mah., Karabük',
    latitude: 41.2165,
    longitude: 32.6470,
    specialNote: 'Kampüs İçi Kılavuzlar Girişi',
  },
  {
    id: 'karabuk-kyk-kiz',
    name: 'KYK Karabük Kız Öğrenci Yurdu',
    district: 'Kılavuzlar / Demir Çelik Kampüsü',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.8,
    mapsQuery: 'KYK Karabük Kız Yurt Müdürlüğü, Kılavuzlar Köyü Ötekarşı, Karabük',
    latitude: 41.2195,
    longitude: 32.6510,
    specialNote: 'Kılavuzlar Ötekarşı Giriş Kapısı',
  },
  {
    id: 'ismail-necati',
    name: 'KYK İsmail Necati Efendi Erkek Öğrenci Yurdu',
    district: 'Karıt / Kılavuzlar Mevkii',
    gender: 'erkek',
    blocks: ['1. Blok', '2. Blok', '3. Blok', '4. Blok', '5. Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.7,
    mapsQuery: 'KYK İsmail Necati Efendi Erkek Öğrenci Yurdu, Karıt Mücavir, Safranbolu',
    latitude: 41.2250,
    longitude: 32.6580,
    specialNote: 'Karıt Mücavir 213. Sokak Girişi',
  },
  {
    id: 'seyh-edebali',
    name: 'KYK Şeyh Edebali Erkek Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü',
    gender: 'erkek',
    blocks: ['1. Blok', '2. Blok', '3. Blok', '4. Blok'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.5,
    mapsQuery: 'KYK Şeyh Edebali Erkek Öğrenci Yurdu, Karabük Kampüs',
    latitude: 41.2145,
    longitude: 32.6430,
    specialNote: 'Demir Çelik Kampüs İçi Erkek Yurtları Bölgesi',
  },
  {
    id: 'ozel-prestij',
    name: 'Özel Prestij Erkek Öğrenci Yurdu',
    district: 'Demir Çelik Kampüsü / Kılavuzlar',
    gender: 'erkek',
    blocks: ['Ana Bina'],
    zoneId: 'zone-kyk-yurtlari',
    isActive: true,
    distanceKm: 2.7,
    mapsQuery: 'Özel Prestij Erkek Yurdu, Kampüs Yolu, Karabük',
    latitude: 41.2160,
    longitude: 32.6420,
  },

  // --- 3. 100. YIL MAHALLESİ (ÖĞRENCİ MERKEZİ & ÖZEL YURTLAR: 3.5 - 4.5 KM) ---
  {
    id: 'eflani',
    name: 'KYK Eflani Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.8,
    mapsQuery: 'KYK Eflani Kız Öğrenci Yurdu, 100. Yıl, Karabük',
    latitude: 41.2078,
    longitude: 32.6235,
    specialNote: '100. Yıl 1003. Cadde Girişi',
  },
  {
    id: 'ozel-altinkalem',
    name: 'Özel Altınkalem Kız ve Erkek Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'karma',
    blocks: ['Kız Bloğu', 'Erkek Bloğu'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.6,
    mapsQuery: 'Altınkalem Öğrenci Yurdu, 100. Yıl Mah. 1002. Cad. Karabük',
    latitude: 41.2090,
    longitude: 32.6280,
    specialNote: 'KBÜ Ana Kapı Karşısı 1002. Cadde',
  },
  {
    id: 'ozel-ilke',
    name: 'Özel İlke Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.7,
    mapsQuery: 'Özel İlke Kız Yurdu, 1003. Cad. 100. Yıl, Karabük',
    latitude: 41.2065,
    longitude: 32.6260,
  },
  {
    id: 'ozel-dilek',
    name: 'Özel Dilek Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['Ana Bina'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.9,
    mapsQuery: 'Dilek Kız Yurdu, 1009. Sokak, 100. Yıl Mah., Karabük',
    latitude: 41.2055,
    longitude: 32.6245,
  },
  {
    id: 'ozel-aslantepe',
    name: 'Özel Aslantepe Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['Ana Bina'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 4.0,
    mapsQuery: 'Aslantepe Kız Öğrenci Yurdu, 1010. Sokak, 100. Yıl, Karabük',
    latitude: 41.2045,
    longitude: 32.6230,
  },
  {
    id: 'ozel-karakoc',
    name: 'Özel Karakoç Erkek Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'erkek',
    blocks: ['Ana Blok'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.6,
    mapsQuery: 'Karakoç Erkek Yurdu, 1002. Sokak, 100. Yıl, Karabük',
    latitude: 41.2085,
    longitude: 32.6275,
  },
  {
    id: 'ozel-akademi',
    name: 'Özel Akademi Kız Öğrenci Yurdu',
    district: '100. Yıl Mahallesi',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.8,
    mapsQuery: 'Özel Akademi Kız Yurdu, 1003. Cadde, 100. Yıl, Karabük',
    latitude: 41.2050,
    longitude: 32.6310,
  },
  {
    id: 'ozel-100yil-apart',
    name: '100. Yıl Öğrenci Apartları ve Rezidanslar',
    district: '100. Yıl Mahallesi',
    gender: 'karma',
    blocks: ['Apart A', 'Apart B', 'Apart C', 'Rezidans'],
    zoneId: 'zone-100yil',
    isActive: true,
    distanceKm: 3.8,
    mapsQuery: '100. Yıl Mahallesi Öğrenci Apartları, Karabük',
    latitude: 41.2070,
    longitude: 32.6250,
    specialNote: '100. Yıl Mahallesindeki tüm apartlar, rezidanslar ve öğrenci evleri',
  },

  // --- 4. SAFRANBOLU BÖLGESİ (3.5 - 6.5 KM) ---
  {
    id: 'aise-ana',
    name: 'KYK Aişe Ana Kız Öğrenci Yurdu',
    district: 'Safranbolu / Tokatlı',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok', 'D Blok'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 4.6,
    mapsQuery: 'KYK Aişe Ana Kız Öğrenci Yurdu, Tokatlı Köyü, Safranbolu',
    latitude: 41.2580,
    longitude: 32.6780,
    specialNote: 'Tokatlı Köyü Mevkii Girişi',
  },
  {
    id: 'safranbolu-yurdu',
    name: 'KYK Safranbolu Öğrenci Yurdu',
    district: 'Safranbolu',
    gender: 'karma',
    blocks: ['A Blok (Kız)', 'B Blok (Erkek)', 'C Blok'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 3.9,
    mapsQuery: 'KYK Safranbolu Öğrenci Yurdu, Sadri Artunç Cad., Safranbolu',
    latitude: 41.2460,
    longitude: 32.6860,
  },
  {
    id: 'ozel-gultekin',
    name: 'Özel Gültekin Kız Öğrenci Yurdu',
    district: 'Safranbolu (Emek Mah.)',
    gender: 'kiz',
    blocks: ['Ana Bina'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 3.5,
    mapsQuery: 'Özel Gültekin Kız Yurdu, Atatürk Bulvarı, Safranbolu',
    latitude: 41.2420,
    longitude: 32.6790,
  },
  {
    id: 'ozel-celebi',
    name: 'Özel Çelebi Kız Öğrenci Yurdu',
    district: 'Safranbolu (Barış Mah.)',
    gender: 'kiz',
    blocks: ['Ana Bina'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 3.7,
    mapsQuery: 'Özel Çelebi Kız Yurdu, Sadri Artunç Cad., Safranbolu',
    latitude: 41.2440,
    longitude: 32.6820,
  },
  {
    id: 'ozel-ova',
    name: 'Özel Ova Kız Öğrenci Yurdu',
    district: 'Safranbolu (Kıranköy)',
    gender: 'kiz',
    blocks: ['Ana Bina'],
    zoneId: 'zone-safranbolu',
    isActive: true,
    distanceKm: 4.0,
    mapsQuery: 'Ova Kız Öğrenci Yurdu, Emek Mah. Kıranköy, Safranbolu',
    latitude: 41.2470,
    longitude: 32.6840,
  },

  // --- 5. KARABÜK MERKEZ & SOĞUKSU / ŞİRİNEVLER (6.0 - 8.5 KM) ---
  {
    id: 'soguksu-kyk',
    name: 'KYK Soğuksu Kız Öğrenci Yurdu',
    district: 'Soğuksu / Karabük Merkez',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok', 'C Blok'],
    zoneId: 'zone-sirinevler',
    isActive: true,
    distanceKm: 6.2,
    mapsQuery: 'KYK Soğuksu Kız Yurdu, Melise Cad., Karabük',
    latitude: 41.1960,
    longitude: 32.6100,
  },
  {
    id: 'taskent-kyk',
    name: 'KYK Taşkent Kız Öğrenci Yurdu',
    district: 'Yeşil Mahalle / Karabük Merkez',
    gender: 'kiz',
    blocks: ['A Blok', 'B Blok'],
    zoneId: 'zone-sirinevler',
    isActive: true,
    distanceKm: 6.8,
    mapsQuery: 'KYK Taşkent Kız Yurdu, Taşkent Cad. Yeşil Mah., Karabük',
    latitude: 41.1920,
    longitude: 32.6210,
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
    const existingZoneIds = new Set(parsed.map((z) => z.id));
    const missingDefaults = DEFAULT_ZONES.filter((dz) => !existingZoneIds.has(dz.id));
    const combinedZones = [...parsed, ...missingDefaults];

    return combinedZones.map((z, idx) => {
      const match = DEFAULT_ZONES.find((dz) => dz.id === z.id);
      const ring = (z.hexRing || match?.hexRing || ((idx % 4 + 1) as 1 | 2 | 3 | 4));
      return {
        ...match,
        ...z,
        polygonCoords: z.polygonCoords || match?.polygonCoords,
        hexRing: ring,
        radiusKm: z.radiusKm || match?.radiusKm || (ring === 1 ? 1.8 : ring === 2 ? 3.5 : ring === 3 ? 5.0 : ring === 4 ? 6.5 : 9.0),
        hexColor: z.hexColor || match?.hexColor || (ring === 1 ? '#10B981' : ring === 2 ? '#8B5CF6' : ring === 3 ? '#06B6D4' : ring === 4 ? '#F59E0B' : '#EF4444'),
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
    const existingDormIds = new Set(parsed.map((d) => d.id));
    const missingDefaults = DEFAULT_DORMS.filter((dd) => !existingDormIds.has(dd.id));
    const combinedDorms = [...parsed, ...missingDefaults];

    return combinedDorms.map((d) => {
      const match = DEFAULT_DORMS.find((dd) => dd.id === d.id);
      return {
        ...match,
        ...d,
        latitude: d.latitude || match?.latitude,
        longitude: d.longitude || match?.longitude,
        distanceKm: d.distanceKm || match?.distanceKm || 2.4,
        mapsQuery: d.mapsQuery || match?.mapsQuery || `${d.name}, Karabük`,
        specialNote: d.specialNote || match?.specialNote,
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

export function getTurkeyMinutesNow(): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value;
    const m = parts.find((p) => p.type === 'minute')?.value;
    if (h !== undefined && m !== undefined) {
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    }
  } catch {
    // fallback
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function isStoreOpen(customSettings?: SystemSettings): boolean {
  const settings = customSettings || getSystemSettings();

  // Manual override: admin can force open or close
  if (settings.isManualOverride) {
    return Boolean(settings.isManuallyOpen);
  }

  const currentMinutes = getTurkeyMinutesNow();

  const openTime = settings.storeOpenTime || '16:00';
  const closeTime = settings.storeCloseTime || '03:00';

  const [openH, openM] = openTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [closeH, closeM] = closeTime.split(':').map((v) => parseInt(v, 10) || 0);

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

// --- COUPON & VIP LOYALTY SYSTEM ---
const COUPONS_KEY = 'caglabufe_coupons_v2';
export const VIP_NOTIFICATIONS_KEY = 'caglabufe_vip_notifications_v1';
export const DISMISSED_VIP_NOTIFS_KEY = 'caglabufe_dismissed_vip_notifs_v1';

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-vip20',
    code: 'VIP20',
    title: '👑 Platin Müdavim İndirimi',
    description: 'En çok sipariş veren Platin müdavimlerimize (10+ sipariş) özel %20 sepet indirimi!',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 75,
    maxDiscount: 60,
    requiresAuth: true,
    targetTier: 'platinum',
    minOrdersRequired: 10,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-favori15',
    code: 'FAVORI15',
    title: '🥇 Altın Müdavim İndirimi',
    description: 'Çağla Büfe altın müdavimlerine (5+ sipariş) özel %15 sepet indirimi!',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 60,
    maxDiscount: 45,
    requiresAuth: true,
    targetTier: 'gold',
    minOrdersRequired: 5,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-cagla10',
    code: 'CAGLA10',
    title: '⚡ Çağla Hoş Geldin İndirimi',
    description: 'Kayıtlı yeni müşterilerimize ilk siparişinde anında 15 TL indirim!',
    discountType: 'fixed',
    discountValue: 15,
    minOrderAmount: 80,
    requiresAuth: true,
    oneTimePerUser: true,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
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
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    const merged = parsed.map((c) => {
      const def = DEFAULT_COUPONS.find((d) => d.code === c.code);
      if (def) {
        return {
          ...def,
          ...c,
          requiresAuth: def.requiresAuth,
          targetTier: def.targetTier ?? c.targetTier,
          minOrdersRequired: def.minOrdersRequired ?? c.minOrdersRequired,
          oneTimePerUser: def.oneTimePerUser ?? c.oneTimePerUser,
          usedPhones: Array.isArray(c.usedPhones) ? c.usedPhones : [],
        };
      }
      return c;
    });
    return merged;
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

export function recordCouponUsage(couponIdOrCode: string, phone: string): void {
  if (!couponIdOrCode || !phone) return;
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return;

  const coupons = getCoupons();
  const cleanTarget = couponIdOrCode.trim().toUpperCase();
  const updated = coupons.map((c) => {
    if (c.id === couponIdOrCode || c.code.toUpperCase() === cleanTarget) {
      const existing = Array.isArray(c.usedPhones) ? c.usedPhones : [];
      const usedPhones = existing.includes(cleanPhone) ? existing : [...existing, cleanPhone];
      return {
        ...c,
        usageCount: (c.usageCount || 0) + 1,
        usedPhones,
      };
    }
    return c;
  });
  saveCoupons(updated);
}

export function validateCoupon(
  code: string,
  cartTotal: number,
  userPhone?: string,
  userOrderCount: number = 0,
  userTierLevel: VipTierLevel = 'new'
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

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: 'Bu kupon kodunun kullanım süresi dolmuştur.', discountAmount: 0 };
  }

  const cleanUser = userPhone ? userPhone.replace(/\D/g, '') : '';

  const requiresLogin =
    coupon.requiresAuth ||
    Boolean(coupon.targetPhone) ||
    Boolean(coupon.targetTier) ||
    Boolean(coupon.minOrdersRequired && coupon.minOrdersRequired > 0) ||
    Boolean(coupon.oneTimePerUser);

  if (requiresLogin && !cleanUser) {
    return {
      valid: false,
      message: 'Bu indirim kuponundan yararlanabilmek için lütfen hesabınıza giriş yapınız.',
      discountAmount: 0,
    };
  }

  if (coupon.oneTimePerUser && cleanUser) {
    if (coupon.usedPhones && coupon.usedPhones.includes(cleanUser)) {
      return {
        valid: false,
        message: 'Bu indirim kuponunu daha önce kullandınız. Her müşteri yalnızca 1 kez yararlanabilir.',
        discountAmount: 0,
      };
    }
  }

  if (coupon.targetPhone) {
    const cleanTarget = coupon.targetPhone.replace(/\D/g, '');
    if (!cleanUser || !cleanTarget || cleanUser !== cleanTarget) {
      return { valid: false, message: 'Bu özel kupon yalnızca tanımlanan hesaba aittir.', discountAmount: 0 };
    }
  }

  if (coupon.minOrdersRequired && coupon.minOrdersRequired > 0) {
    if (userOrderCount < coupon.minOrdersRequired) {
      return {
        valid: false,
        message: `Bu kupon müdavim müşterilerimize özeldir (Minimum ${coupon.minOrdersRequired} sipariş gereklidir).`,
        discountAmount: 0,
      };
    }
  }

  if (coupon.targetTier) {
    const TIER_RANKS: Record<string, number> = {
      new: 0,
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
    };
    const tierLabels: Record<string, string> = {
      bronze: 'Bronz',
      silver: 'Gümüş',
      gold: 'Altın',
      platinum: 'Platin',
    };
    const userRank = TIER_RANKS[userTierLevel] || 0;
    const requiredRank = TIER_RANKS[coupon.targetTier] || 0;

    if (userRank < requiredRank) {
      const requiredLabel = tierLabels[coupon.targetTier] || coupon.targetTier;
      return {
        valid: false,
        message: `Bu kupon yalnızca ${requiredLabel} ve üzeri Müdavim müşterilerimize özeldir.`,
        discountAmount: 0,
      };
    }
  }

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
