export type AddressType = 'dormitory' | 'home' | 'work';

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
  fullAddress?: string;
  buildingNumber?: string;
  apartmentNumber?: string;
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

export type ProductCategory =
  | 'temel-gida'
  | 'soguk-icecek'
  | 'cay-kahve'
  | 'cips-cerez'
  | 'cikolata-tatli'
  | 'biskuvi-kek'
  | 'pratik-yemek'
  | 'kisisel-bakim'
  | 'sicak-lezzetler';

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
  options?: {
    name: string;
    choices: string[];
  }[];
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

// --- DİNAMİK SİSTEM AYARLARI ---

export interface DeliveryZone {
  id: string;
  name: string;               // Bölge adı: "KYK Yurtları", "100. Yıl", vb.
  minOrderAmount: number;     // Bu bölge için minimum tutar
  deliveryFee: number;        // Teslimat ücreti
  freeDeliveryThreshold: number;
  estimatedMinutes: number;
  isActive: boolean;
  radiusKm?: number;          // Dükkandan mesafe halkası (km)
  hexRing?: 1 | 2 | 3 | 4;    // Altıgen halka seviyesi (1: 0-1.5km, 2: 1.5-3.5km, 3: 3.5-5.5km, 4: 5.5+km)
  hexColor?: string;          // Renk kodu
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
