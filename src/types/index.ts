export type AddressType = 'dormitory' | 'home' | 'work';

export interface StoreBranch {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  color: string;
  isActive: boolean;
  description: string;
}

export interface Address {
  id: string;
  type: AddressType;
  title: string;
  // Dormitory specific fields
  dormName?: string;
  blockNumber?: string;
  roomNumber?: string;
  // Regular address fields
  district: string;
  streetName?: string;
  buildingNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  fullAddress?: string;
  // Geolocation & Branch assignment
  latitude?: number;
  longitude?: number;
  assignedBranchId?: string;
  assignedZoneId?: string;
  distanceKm?: number;
  // Delivery note
  deliveryPresetNote?: string;
  courierNote?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  addresses: Address[];
  selectedAddressId?: string;
  role?: 'customer' | 'admin';
  isBanned?: boolean;
  bannedAt?: string;
  banReason?: string;
}

export interface BannedUser {
  id: string;
  phone: string;
  name: string;
  reason: string;
  bannedAt: string;
}

export type ProductCategory = string;

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  icon: string;
  badge?: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string; // Marka Adı (Eti, Ülker, Damla, Nescafe vb.)
  category: ProductCategory;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  description: string;
  unit: string;
  barcode?: string; // BenimPOS barkod
  isAvailable: boolean;
  isKitchenItem: boolean;
  prepTimeMinutes?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  campaignId?: string; // Hangi kampanyaya dahil
  searchKeywords?: string[]; // Akıllı / Semantik arama anahtar kelimeleri
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  itemNote?: string;
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'cash_at_door'
  | 'card_at_door';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  isKitchenItem?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  discountAmount?: number;
  appliedCampaignId?: string;
  address: Address;
  paymentMethod: PaymentMethod;
  orderNote?: string;
  status: OrderStatus;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// --- KAMPANYA SİSTEMİ ---

export type CampaignType =
  | 'percentage_discount'    // %X indirim
  | 'fixed_discount'         // X TL indirim
  | 'free_delivery'          // Ücretsiz teslimat
  | 'buy_x_get_y'            // X al Y öde
  | 'bundle_deal';           // Birlikte al indirimli

export interface BundleItemConfig {
  productId: string;
  quantity: number;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  value: number;              // Yüzde veya TL miktar
  bundlePrice?: number;       // Kampanyalı paket satış fiyatı (Örn: 75 TL)
  bundleOriginalPrice?: number; // Normal liste fiyatı toplamı (Örn: 100 TL)
  bundleProducts?: BundleItemConfig[]; // Paketteki ürünler ve adetleri
  bundleBadge?: string;       // "Süper İkili", "Film & Maç Menüsü", "Öğrenci Dostu"
  bundleImageUrl?: string;    // İsteğe bağlı özel görsel
  minOrderAmount?: number;    // Minimum sepet tutarı
  maxDiscount?: number;       // Maksimum indirim tutarı
  applicableCategories?: ProductCategory[]; // Belirli kategorilere mi?
  applicableProductIds?: string[];          // Belirli ürünlere mi?
  isActive: boolean;
  startsAt: string;           // ISO date
  endsAt: string;             // ISO date
  bannerColor?: string;       // Kampanya banner rengi
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;            // Örn: 'VIP20', 'FAVORI15', 'CAGLA10'
  title: string;           // 'Favori Müşteri İndirimi'
  description: string;     // 'En çok sipariş veren müşterimize özel %20 indirim'
  discountType: 'percentage' | 'fixed'; // % veya TL
  discountValue: number;   // 20 veya 50
  minOrderAmount?: number; // Minimum sepet tutarı
  maxDiscount?: number;    // Maksimum indirim tutarı
  targetPhone?: string;    // Belirli bir numaraya mı özel? (Boşsa herkese)
  targetTier?: 'bronze' | 'silver' | 'gold' | 'platinum'; // VIP seviyesine mi özel?
  expiresAt?: string;      // Son kullanma tarihi (Opsiyonel)
  isActive: boolean;
  createdAt: string;
  usageCount?: number;
}

export type VipTierLevel = 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';

export interface VipTierInfo {
  level: VipTierLevel;
  label: string;
  badge: string;
  iconEmoji: string;
  discountPercentage: number;
  minOrders: number;
  minSpend: number;
  color: string;
  bg: string;
  border: string;
  perk: string;
}

export interface VipNotification {
  id: string;
  title: string;
  message: string;
  couponCode?: string;
  targetPhone?: string; // Boşsa tüm müdavimlere broadcast
  targetTier?: VipTierLevel | 'all';
  createdAt: string;
  expiresAt?: string;
  read?: boolean;
}

export interface CustomerLoyaltyProfile {
  cleanPhone: string;
  formattedPhone: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  tier: VipTierInfo;
}

// --- DİNAMİK SİSTEM AYARLARI ---

export interface DeliveryZone {
  id: string;
  name: string;               // Bölge adı: "KYK Yurtları", "100. Yıl", vb.
  minOrderAmount: number;     // Bu bölge için minimum tutar
  deliveryFee: number;        // Teslimat ücreti
  freeDeliveryThreshold: number;
  estimatedMinutes: number;
  isActive: boolean;
  radiusKm?: number;          // Dükkandan mesafe halkası (km, opsiyonel)
  hexRing?: 1 | 2 | 3 | 4;    // Altıgen halka seviyesi
  hexColor?: string;          // Renk kodu
  polygonCoords?: [number, number][]; // Elle çizilen poligon koordinatları [[lat, lng], ...]
}

export interface DormitoryConfig {
  id: string;
  name: string;
  district: string;
  gender: 'kiz' | 'erkek' | 'karma';
  blocks: string[];
  zoneId: string;             // Hangi bölgeye dahil
  isActive: boolean;
  distanceKm?: number;        // Dükkana olan yaklaşık mesafe (km)
  mapsQuery?: string;         // Google Maps arama sorgusu
  latitude?: number;
  longitude?: number;
}

export interface SystemSettings {
  storeName?: string;         // "Çağla Büfe & Market"
  storeOpenTime: string;      // "16:00" formatı
  storeCloseTime: string;     // "03:00" formatı
  isManuallyOpen: boolean;    // Manuel açma/kapama override
  isManualOverride: boolean;  // Manuel override aktif mi
  closedMessage: string;      // Kapalıyken gösterilecek mesaj
  announcementText?: string;  // Canlı üst bant duyurusu
  isAnnouncementActive?: boolean; // Duyuru bandı aktif mi
  defaultMinOrder: number;
  defaultDeliveryFee: number;
  defaultFreeDeliveryThreshold: number;
  adminPassword: string;      // Admin giriş şifresi
  storePhone?: string;        // Büfe telefon numarası
  storeWhatsApp?: string;     // Büfe WhatsApp numarası
  techSupportWhatsApp?: string; // Yazılım / Teknik Destek WhatsApp numarası
  storeAddress?: string;      // Büfe açık adresi
  storeLatitude?: number;     // Büfe enlem (41.2065)
  storeLongitude?: number;    // Büfe boylam (32.6285)
  // Audio & Bildirim Ayarları
  soundPreset?: 'bell' | 'siren' | 'chime' | 'gentle';
  soundVolume?: number;       // 0.1 - 1.0 arası
  soundRepeatCount?: number;  // 1 - 5 kez
  enableVibration?: boolean;
  // Dinamik Şablonlar
  templateOrderReceived?: string;
  templateOrderPreparing?: string;
  templateOrderOnTheWay?: string;
  templateOrderDelivered?: string;
  templateWhatsApp?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  role?: 'admin' | 'customer';
  userId?: string;
  createdAt?: string;
}

// --- DİJİTAL FİŞ ---

export interface DigitalReceipt {
  orderId: string;
  orderNumber: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  customerName: string;
  customerPhone: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    barcode?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: string;
  timestamp: string;
  receiptNumber: string;
}
