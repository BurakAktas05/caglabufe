-- ============================================================
-- ÇAĞLA BÜFE & MARKET - SUPABASE COMPLETE PRODUCTION SCHEMA
-- Karabük / 100. Yıl Mahallesi & KYK Yurtları Altyapısı
-- ============================================================

-- 1. PROFILES TABLOSU (Müşteri & Yönetici Hesapları)
CREATE TABLE IF NOT EXISTS public.profiles (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 10)),
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_banned BOOLEAN DEFAULT false,
    banned_at TIMESTAMP WITH TIME ZONE,
    ban_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ADDRESSES TABLOSU (KYK Yurtları & Ev/İş Adresleri)
CREATE TABLE IF NOT EXISTS public.addresses (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('addr_' || substr(md5(random()::text), 1, 10)),
    user_id VARCHAR(100),
    type VARCHAR(20) NOT NULL CHECK (type IN ('dormitory', 'home', 'work')),
    title VARCHAR(100) NOT NULL,
    dorm_name VARCHAR(150),
    block_number VARCHAR(50),
    room_number VARCHAR(50),
    district VARCHAR(100) NOT NULL,
    full_address TEXT,
    delivery_preset_note TEXT,
    courier_note TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCTS TABLOSU (Market & Sıcak Büfe Menüsü)
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2),
    image_url TEXT NOT NULL,
    description TEXT,
    unit VARCHAR(50) DEFAULT 'adet',
    barcode VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    is_kitchen_item BOOLEAN DEFAULT false,
    prep_time_minutes INTEGER DEFAULT 10,
    options JSONB DEFAULT '[]'::jsonb,
    search_keywords JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ORDERS TABLOSU (Canlı Siparişler & Kurye Takibi)
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    user_id VARCHAR(100),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    applied_campaign_id VARCHAR(100),
    address JSONB NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash_at_door', 'card_at_door')),
    order_note TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
    estimated_delivery_minutes INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SYSTEM SETTINGS TABLOSU
CREATE TABLE IF NOT EXISTS public.system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DELIVERY ZONES (Mesafe ve Altıgen Teslimat Bölgeleri)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 50,
    delivery_fee NUMERIC(10, 2) DEFAULT 10,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 120,
    estimated_minutes INTEGER DEFAULT 15,
    radius_km NUMERIC(5, 2) DEFAULT 1.5,
    hex_ring INTEGER DEFAULT 1,
    hex_color VARCHAR(30) DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT true
);

-- 7. DORMITORIES (Karabük KYK & Özel Yurtlar)
CREATE TABLE IF NOT EXISTS public.dormitories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    district VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'karma' CHECK (gender IN ('kiz', 'erkek', 'karma')),
    blocks JSONB DEFAULT '[]'::jsonb,
    zone_id VARCHAR(100),
    distance_km NUMERIC(5, 2) DEFAULT 2.0,
    maps_query TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 8. CAMPAIGNS (Öğrenci Fırsat Paketleri & İndirimler)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2),
    max_discount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    banner_color VARCHAR(30) DEFAULT '#5D3EBC',
    bundle_products JSONB,
    bundle_price NUMERIC(10, 2),
    bundle_badge VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. BANNED USERS (Kara Liste)
CREATE TABLE IF NOT EXISTS public.banned_users (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('ban_' || substr(md5(random()::text), 1, 10)),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. PUSH NOTIFICATION SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('push_' || substr(md5(random()::text), 1, 10)),
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    user_id VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- İNDEKSLER (Arama ve Listeleme Performansı)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_banned_users_phone ON public.banned_users(phone);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.push_subscriptions(endpoint);

-- ============================================================
-- SUPABASE REALTIME REPLICATION (Anlık Sipariş & Menü Senkronizasyonu)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'system_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'campaigns') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
  END IF;
END $$;

-- ============================================================
-- OTOMATİK GÜNCELLEME TETİKLEYİCİSİ (TRIGGER)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. ORDERS POLİTİKALARI
DROP POLICY IF EXISTS "Orders read all" ON public.orders;
CREATE POLICY "Orders read all" ON public.orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Orders insert all" ON public.orders;
CREATE POLICY "Orders insert all" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (
    total_amount > 0 AND final_amount >= 0 AND length(customer_phone) >= 10
);

DROP POLICY IF EXISTS "Orders update all" ON public.orders;
CREATE POLICY "Orders update all" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. PRODUCTS POLİTİKALARI
DROP POLICY IF EXISTS "Products read all" ON public.products;
CREATE POLICY "Products read all" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Products modify all" ON public.products;
CREATE POLICY "Products modify all" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. SYSTEM SETTINGS POLİTİKALARI
DROP POLICY IF EXISTS "Settings read all" ON public.system_settings;
CREATE POLICY "Settings read all" ON public.system_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Settings modify all" ON public.system_settings;
CREATE POLICY "Settings modify all" ON public.system_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. CAMPAIGNS POLİTİKALARI
DROP POLICY IF EXISTS "Campaigns read all" ON public.campaigns;
CREATE POLICY "Campaigns read all" ON public.campaigns FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Campaigns modify all" ON public.campaigns;
CREATE POLICY "Campaigns modify all" ON public.campaigns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. ZONES & DORMS POLİTİKALARI
DROP POLICY IF EXISTS "Zones read all" ON public.delivery_zones;
CREATE POLICY "Zones read all" ON public.delivery_zones FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Zones modify all" ON public.delivery_zones;
CREATE POLICY "Zones modify all" ON public.delivery_zones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Dorms read all" ON public.dormitories;
CREATE POLICY "Dorms read all" ON public.dormitories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Dorms modify all" ON public.dormitories;
CREATE POLICY "Dorms modify all" ON public.dormitories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. BANNED USERS & PUSH SUBS
DROP POLICY IF EXISTS "Banned users read all" ON public.banned_users;
CREATE POLICY "Banned users read all" ON public.banned_users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Banned users modify all" ON public.banned_users;
CREATE POLICY "Banned users modify all" ON public.banned_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Push read all" ON public.push_subscriptions;
CREATE POLICY "Push read all" ON public.push_subscriptions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Push modify all" ON public.push_subscriptions;
CREATE POLICY "Push modify all" ON public.push_subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles read all" ON public.profiles;
CREATE POLICY "Profiles read all" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Profiles modify all" ON public.profiles;
CREATE POLICY "Profiles modify all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SİSTEM KONFİGÜRASYONLARI (BÖLGELER & YURTLAR)
-- ============================================================

-- 1. TESLİMAT BÖLGELERİ
INSERT INTO public.delivery_zones (id, name, min_order_amount, delivery_fee, free_delivery_threshold, estimated_minutes, radius_km, hex_ring, hex_color, is_active)
VALUES
('zone-100yil', '100. Yıl Mah. & Çevresi (Çekirdek Bölge)', 50, 10, 120, 12, 1.2, 1, '#10B981', true),
('zone-kyk-yurtlari', 'KYK Yurtları Halkası (Hubbi Hatun, Şeyh Edebali)', 60, 15, 150, 18, 2.8, 2, '#8B5CF6', true),
('zone-sirinevler', 'Şirinevler & 5000 Evler (Dış Mahalleler)', 80, 20, 200, 25, 4.8, 3, '#F59E0B', true),
('zone-merkez', 'Safranbolu & Karabük Merkez (Geniş Tarife)', 120, 30, 250, 35, 7.2, 4, '#EF4444', true)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
min_order_amount = EXCLUDED.min_order_amount,
delivery_fee = EXCLUDED.delivery_fee,
free_delivery_threshold = EXCLUDED.free_delivery_threshold,
estimated_minutes = EXCLUDED.estimated_minutes;

-- 2. KARABÜK KYK & ÖZEL YURTLAR
INSERT INTO public.dormitories (id, name, district, gender, blocks, zone_id, distance_km, maps_query, is_active)
VALUES
('hubbi-hatun', 'KYK Hubbi Hatun Kız Öğrenci Yurdu', 'Demir Çelik Kampüsü', 'kiz', '["A Blok", "B Blok", "C Blok", "D Blok"]'::jsonb, 'zone-kyk-yurtlari', 2.4, 'KYK Hubbi Hatun Kız Öğrenci Yurdu, Karabük', true),
('seyh-edebali', 'KYK Şeyh Edebali Erkek Öğrenci Yurdu', 'Demir Çelik Kampüsü', 'erkek', '["1. Blok", "2. Blok", "3. Blok", "4. Blok", "5. Blok"]'::jsonb, 'zone-kyk-yurtlari', 2.6, 'KYK Şeyh Edebali Erkek Öğrenci Yurdu, Karabük', true),
('eflani', 'KYK Eflani Kız Öğrenci Yurdu', '100. Yıl Mahallesi', 'kiz', '["A Blok", "B Blok"]'::jsonb, 'zone-100yil', 1.1, 'KYK Eflani Kız Öğrenci Yurdu, 100. Yıl, Karabük', true),
('ozel-akademi', 'Özel Akademi Kız Öğrenci Yurdu', '100. Yıl Mahallesi', 'kiz', '[]'::jsonb, 'zone-100yil', 0.8, '100. Yıl Mah. 1003. Cad. Karabük', true),
('ozel-prestij', 'Özel Prestij Erkek Öğrenci Yurdu', 'Demir Çelik Kampüsü', 'erkek', '[]'::jsonb, 'zone-kyk-yurtlari', 2.1, 'Demir Çelik Kampüsü, Karabük', true),
('safranbolu-yurdu', 'KYK Safranbolu Öğrenci Yurdu', 'Safranbolu', 'karma', '["A Blok", "B Blok", "C Blok"]'::jsonb, 'zone-merkez', 7.2, 'KYK Safranbolu Öğrenci Yurdu, Safranbolu', false)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
blocks = EXCLUDED.blocks,
zone_id = EXCLUDED.zone_id;

-- 3. KAMPANYALAR & FIRSATLAR
INSERT INTO public.campaigns (id, title, description, type, value, min_order_amount, max_discount, is_active, starts_at, ends_at, banner_color, bundle_products, bundle_price, bundle_badge)
VALUES
('camp_free_delivery', 'KYK Yurtlarına Ücretsiz Teslimat', '120 TL ve üzeri KYK yurtları siparişlerinde teslimat ücreti sıfırlanır.', 'free_delivery', 0, 120, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#5D3EBC', NULL, NULL, NULL),
('camp_ogrenci_indirim', '200 TL Üzerine 25 TL İndirim', 'Sepetiniz 200 TL ve üzeri olduğunda anında 25 TL indirim uygulanır.', 'fixed_discount', 25, 200, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#059669', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
description = EXCLUDED.description;

-- 4. SİSTEM AYARLARI
INSERT INTO public.system_settings (id, settings, updated_at)
VALUES (
    'current',
    '{
      "storeName": "Çağla Büfe & Market",
      "storeOpenTime": "16:00",
      "storeCloseTime": "03:00",
      "isManuallyOpen": false,
      "isManualOverride": false,
      "closedMessage": "Sipariş saatleri dışındayız. Hizmet saatlerimiz her gün 16:00 - 03:00 arasıdır.",
      "announcementText": "🛵 Karabük & KYK Yurtlarına 15-20 dakikada hızlı teslimat! Soğuk içecek, çikolata, cips ve market lezzetleri kapınızda.",
      "isAnnouncementActive": true,
      "defaultMinOrder": 60,
      "defaultDeliveryFee": 15,
      "defaultFreeDeliveryThreshold": 150,
      "adminPassword": "cagla2024",
      "storePhone": "0542 000 7878",
      "storeWhatsApp": "905420007878",
      "storeAddress": "100. Yıl Mah. 1003. Cad. No:12 Karabük",
      "storeLatitude": 41.2065,
      "storeLongitude": 32.6285,
      "soundPreset": "bell",
      "soundVolume": 0.6,
      "soundRepeatCount": 2,
      "enableVibration": true,
      "templateOrderReceived": "Siparişiniz alındı! #{orderNumber} nolu siparişiniz onaylandı.",
      "templateOrderPreparing": "Siparişiniz hazırlanıyor! #{orderNumber} nolu siparişiniz paketleniyor.",
      "templateOrderOnTheWay": "Kuryemiz yola çıktı! #{orderNumber} nolu siparişiniz ~10-15 dk içinde kapınızda.",
      "templateOrderDelivered": "Siparişiniz teslim edildi! Afiyet olsun, Çağla Büfe keyifli anlar diler.",
      "templateWhatsApp": "Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL siparişim ({dormOrAddress}) hakkında yazıyorum."
    }'::jsonb,
    timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
settings = EXCLUDED.settings,
updated_at = EXCLUDED.updated_at;

-- NOT: Ürünler doğrudan Excel kataloğundan (excel/ÜrünOlusturma_5522d054) 653 gerçek ürün olarak yüklenmektedir.
-- Hiçbir mock/örnek ürün kataloğa eklenmez.
