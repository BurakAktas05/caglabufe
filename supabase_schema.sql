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
-- BAŞLANGIÇ VERİLERİ (SEED DATA)
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
('camp_bundle_kola_cekirdek', 'Film & Maç Paketi (Kola + Çekirdek)', '1 Litre Coca-Cola ve Tadım Siyah Ayçekirdeği (180 gr) birlikte süper indirimli!', 'bundle_deal', 85, NULL, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#DC2626', '[{"productId":"coca-cola-1l","quantity":1},{"productId":"tadim-cekirdek-180","quantity":1}]'::jsonb, 85, 'Süper İkili'),
('camp_bundle_bufe_menusu', 'Çağla Büfe Doyurucu Tost Menüsü', 'Çağla Spesiyal Karışık Tost + Çıtır Parmak Patates + Eker Yayık Ayran', 'bundle_deal', 200, NULL, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#5D3EBC', '[{"productId":"tost-cagla-spesiyal","quantity":1},{"productId":"citir-patates-sepeti","quantity":1},{"productId":"eker-ayran-300","quantity":1}]'::jsonb, 200, 'Doyurucu Menü'),
('camp_free_delivery', 'KYK Yurtlarına Ücretsiz Teslimat', '120 TL ve üzeri KYK yurtları siparişlerinde teslimat ücreti sıfırlanır.', 'free_delivery', 0, 120, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#5D3EBC', NULL, NULL, NULL),
('camp_ogrenci_indirim', '200 TL Üzerine 25 TL İndirim', 'Sepetiniz 200 TL ve üzeri olduğunda anında 25 TL indirim uygulanır.', 'fixed_discount', 25, 200, NULL, true, '2024-01-01T00:00:00.000Z', '2030-12-31T23:59:59.000Z', '#059669', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
description = EXCLUDED.description,
bundle_price = EXCLUDED.bundle_price;

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
      "announcementText": "🛵 Karabük & KYK Yurtlarına 15-20 dakikada sıcak teslimat! Gece acıkanlara özel tost ve atıştırmalıklar kapınızda.",
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
      "templateOrderPreparing": "Mutfakta hazırlanıyor! #{orderNumber} nolu siparişiniz fırından çıkmak üzere.",
      "templateOrderOnTheWay": "Kuryemiz yola çıktı! #{orderNumber} nolu siparişiniz ~10-15 dk içinde kapınızda.",
      "templateOrderDelivered": "Siparişiniz teslim edildi! Afiyet olsun, Çağla Büfe keyifli geceler diler.",
      "templateWhatsApp": "Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL siparişim ({dormOrAddress}) hakkında yazıyorum."
    }'::jsonb,
    timezone('utc'::text, now())
)
ON CONFLICT (id) DO UPDATE SET
settings = EXCLUDED.settings,
updated_at = EXCLUDED.updated_at;

-- 5. ÜRÜN KATALOĞU (46 Adet Büfe & Market Ürünü)
INSERT INTO public.products (id, name, category, price, discount_price, image_url, description, unit, barcode, is_available, is_kitchen_item, prep_time_minutes, options, search_keywords)
VALUES
('bakkal-somun-ekmek', 'Taze Fırın Somun Ekmek (210 gr)', 'temel-gida', 10, NULL, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', 'Karabük fırınından günlük taptaze sıcacık somun ekmek.', '1 adet (210 gr)', '8690000000101', TRUE, FALSE, 10, '[]'::jsonb, '["ekmek","somun","fırın","taze ekmek","kahvaltılık","bakkal","yemek","acım","ekmk"]'::jsonb),
('bakkal-sutas-sut-1l', 'Sütaş Günlük Tam Yağlı Süt 1 Litre', 'temel-gida', 38, NULL, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80', '%100 doğal pastörize tam yağlı taze inek sütü.', '1 Litre Tetra Pak', '8690000000102', TRUE, FALSE, 10, '[]'::jsonb, '["süt","sutas","tam yağlı","kahvaltı","kahvaltılık","bakkal","kalsiyum","sut"]'::jsonb),
('bakkal-koy-yumurta-15li', 'Taze Çiftlik Yumurtası (15''li Viyol)', 'temel-gida', 75, 65, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80', 'A sınıfı taze iri boy çiftlik yumurtası, sağlam ambalajında.', '15''li Viyol Paket', '8690000000103', TRUE, FALSE, 10, '[]'::jsonb, '["yumurta","kahvaltı","protein","omlet","menemen","bakkal","kahvaltılık","ymurta"]'::jsonb),
('bakkal-icim-suzme-peynir', 'İçim Süzme Beyaz Peynir 500 gr', 'temel-gida', 95, NULL, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80', 'Yumuşacık kıvamıyla kahvaltılıkların ve sandviçlerin vazgeçilmezi.', '500 gr Kutu', '8690000000104', TRUE, FALSE, 10, '[]'::jsonb, '["peynir","süzme peynir","beyaz peynir","kahvaltılık","kahvaltı","içim","peynr"]'::jsonb),
('bakkal-sutas-kasar-400', 'Sütaş Taze Kaşar Peyniri 400 gr', 'temel-gida', 135, 125, 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=600&auto=format&fit=crop&q=80', 'Tostta mükemmel eriyen geleneksel Sütaş taze kaşar.', '400 gr Blok', '8690000000105', TRUE, FALSE, 10, '[]'::jsonb, '["kaşar","peynir","tostluk kaşar","kahvaltı","sütaş","kasar"]'::jsonb),
('bakkal-yudum-aycicek-1l', 'Yudum Ayçiçek Yağı 1 Litre', 'temel-gida', 85, NULL, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', 'Hafif ve berrak yemeklik ayçiçek yağı pet şişe.', '1 Litre Pet', '8690000000106', TRUE, FALSE, 10, '[]'::jsonb, '["sıvı yağ","ayçiçek yağı","yemeklik yağ","kızartma","yudum","mutfak","bakkal","yag"]'::jsonb),
('bakkal-barilla-makarna-500', 'Barilla Burgu Makarna (Fusilli) 500 gr', 'temel-gida', 35, NULL, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80', '%100 durum buğdayından İtalyan kalitesinde burgu makarna.', '500 gr Paket', '8690000000107', TRUE, FALSE, 10, '[]'::jsonb, '["makarna","barilla","burgu","akşam yemeği","öğrenci","doyurucu","bakkal"]'::jsonb),
('bakkal-tat-salca-430', 'Tat Domates Salçası Cam Kavanoz 430 gr', 'temel-gida', 45, NULL, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', 'Güneşte olgunlaşmış domateslerden yoğun kıvamlı salça.', '430 gr Cam', '8690000000108', TRUE, FALSE, 10, '[]'::jsonb, '["salça","domates salçası","yemeklik","tat","makarna sosu","bakkal"]'::jsonb),
('su-erikli-5000', 'Erikli Doğal Kaynak Suyu 5 Litre', 'soguk-icecek', 35, NULL, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80', 'Uludağ''ın zirvesinden el değmeden şişelenen 5 litrelik ekonomik su.', '5 Litre Pet Şişe', '8690000000201', TRUE, FALSE, 10, '[]'::jsonb, '["su","erikli","damacana","5 litre","içme suyu","susadım","hararet","bakkal"]'::jsonb),
('su-hayat-500', 'Hayat Doğal Kaynak Suyu 0.5 L', 'soguk-icecek', 10, NULL, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80', 'Buz gibi soğuk cep boy doğal kaynak suyu.', '500 ml', '8690000000202', TRUE, FALSE, 10, '[]'::jsonb, '["su","küçük su","soğuk su","hayat su","susadım","hararet"]'::jsonb),
('beypazari-soda-6li', 'Beypazarı Doğal Maden Suyu (6''lı Koli)', 'soguk-icecek', 80, 72, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80', 'Zengin mineralli efsane Beypazarı sodası 6''lı paket.', '6 x 200 ml Cam', '8690000000203', TRUE, FALSE, 10, '[]'::jsonb, '["maden suyu","soda","beypazarı","beypazari","mineralli","hararet","hazımsızlık","soda koli"]'::jsonb),
('kizilay-elmali-soda', 'Kızılay Elma Aromalı Maden Suyu 200 ml', 'soguk-icecek', 18, NULL, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80', 'Ferahlatıcı yeşil elma lezzetiyle zenginleştirilmiş maden suyu.', '200 ml Cam Şişe', '8690000000204', TRUE, FALSE, 10, '[]'::jsonb, '["meyveli soda","elmalı soda","kızılay","maden suyu","gazoz","soğuk içecek"]'::jsonb),
('coca-cola-1l', 'Coca-Cola Orijinal Tat 1 Litre', 'soguk-icecek', 55, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80', 'Buz gibi soğuk 1 litrelik Coca-Cola.', '1 Litre Pet', '8690000000205', TRUE, FALSE, 10, '[]'::jsonb, '["kola","coca cola","coke","gazlı içecek","soğuk içecek","kola 1l","film","yemek"]'::jsonb),
('coca-cola-kutu-330', 'Coca-Cola Kutu 330 ml', 'soguk-icecek', 45, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80', 'Buz gibi teneke kutu Coca-Cola.', '330 ml Teneke', '8690000000206', TRUE, FALSE, 10, '[]'::jsonb, '["kutu kola","coca cola","soğuk","tost yanı","içecek"]'::jsonb),
('didi-bergamot-1l', 'Çaykur Didi Soğuk Çay Bergamot 1 Litre', 'soguk-icecek', 45, NULL, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80', 'Karadeniz çayından ferahlatıcı bergamot aromalı soğuk çay.', '1 Litre Pet', '8690000000207', TRUE, FALSE, 10, '[]'::jsonb, '["didi","soğuk çay","bergamot","buzlu çay","icetea","çaykur","susadım"]'::jsonb),
('redbull-250', 'Red Bull Enerji İçeceği 250 ml', 'soguk-icecek', 75, NULL, 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=600&auto=format&fit=crop&q=80', 'Sınav gecelerinde, vize dönemlerinde ve yorgun anlarda kanatlandırır.', '250 ml Teneke', '8690000000208', TRUE, FALSE, 10, '[]'::jsonb, '["red bull","enerji","sabahlama","vize","final","ders","uykum var","uyan","redbull"]'::jsonb),
('eker-ayran-300', 'Eker Yayık Ayran 300 ml', 'soguk-icecek', 25, NULL, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80', 'Bol köpüklü, tost ve yemeklerin yanına yakışan yayık ayran.', '300 ml Bardak', '8690000000209', TRUE, FALSE, 10, '[]'::jsonb, '["ayran","eker","yayık ayran","tost yanı","içecek"]'::jsonb),
('caykur-rize-turist-500', 'Çaykur Rize Turist Çay 500 gr', 'cay-kahve', 95, NULL, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 'Karadeniz''in taze yapraklarından geleneksel sarı paket Rize çayı.', '500 gr Paket', '8690000000301', TRUE, FALSE, 10, '[]'::jsonb, '["çay","çaykur","rize çayı","sarı paket","demlik çay","kahvaltı","bakkal","cay"]'::jsonb),
('mehmet-efendi-kahve-100', 'Kurukahveci Mehmet Efendi Türk Kahvesi 100 gr', 'cay-kahve', 55, NULL, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 'Taze kavrulmuş, mis kokulu geleneksel Türk kahvesi folyo paket.', '100 gr Paket', '8690000000302', TRUE, FALSE, 10, '[]'::jsonb, '["türk kahvesi","mehmet efendi","kahve","bol köpüklü","sohbet","uyku açıcı"]'::jsonb),
('nescafe-3u1arada-10lu', 'Nescafé 3''ü 1 Arada (10''lu Paket)', 'cay-kahve', 65, 58, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 'Öğrencinin vize ve ders cankurtaranı pratik kahve seti.', '10 x 17.5 gr Paket', '8690000000303', TRUE, FALSE, 10, '[]'::jsonb, '["nescafe","kahve","3ü1arada","hazır kahve","sınav","vize","ders","sabahlama"]'::jsonb),
('dogus-kup-seker-750', 'Doğuş Küp Şeker 750 gr', 'cay-kahve', 45, NULL, 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80', '%100 pancar şekerinden üretilmiş standart küp şeker.', '750 gr Kutu', '8690000000304', TRUE, FALSE, 10, '[]'::jsonb, '["şeker","küp şeker","çay şekeri","doğuş","tatlı","bakkal","seker"]'::jsonb),
('indomie-korili-noodle', 'Indomie Hazır Bardak Noodle (Körili)', 'pratik-yemek', 30, NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80', 'Yurt odasında sadece sıcak su ekleyerek 3 dakikada hazır yemek.', '60 gr Bardak', '8690000000401', TRUE, FALSE, 10, '[]'::jsonb, '["noodle","körili","indomie","bardak noodle","pratik yemek","açım","öğrenci","nodıl","nudıl"]'::jsonb),
('indomie-tavuklu-paket', 'Indomie Hazır Paket Noodle (Özel Tavuklu)', 'pratik-yemek', 18, NULL, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80', 'Öğrencinin cankurtaranı tavuk çeşnili hazır paket noodle.', '70 gr Paket', '8690000000402', TRUE, FALSE, 10, '[]'::jsonb, '["noodle","tavuklu noodle","indomie","hazır yemek","açım","ucuz","nodıl"]'::jsonb),
('dardanel-ton-balik-2li', 'Dardanel Ayçiçek Yağlı Ton Balığı (2x160 gr)', 'pratik-yemek', 165, 145, 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600&auto=format&fit=crop&q=80', 'Yüksek proteinli, kolay açılır kapak zeytinyağlı lezzette ton balığı.', '2 x 160 gr Konserve', '8690000000403', TRUE, FALSE, 10, '[]'::jsonb, '["ton balığı","dardanel","balık","protein","öğrenci","pratik yemek","sandviç"]'::jsonb),
('knorr-ezogelin-corba', 'Knorr Çabuk Ezogelin Çorbası', 'pratik-yemek', 22, NULL, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80', 'Fincana sıcak su dökün, 1 dakikada sıcacık çorbanız hazır.', 'Tek Kişilik Paket', '8690000000404', TRUE, FALSE, 10, '[]'::jsonb, '["çorba","ezogelin","knorr","sıcak çorba","hasta","pratik","açım"]'::jsonb),
('doritos-nacho-mega', 'Doritos Nacho Peynirli Süper Boy', 'cips-cerez', 55, NULL, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80', 'Yoğun peynir lezzeti ile efsane üçgen mısır cipsi.', '120 gr Paket', '8690000000501', TRUE, FALSE, 10, '[]'::jsonb, '["cips","doritos","nacho","peynirli","film","dizi","maç","atıştırmalık"]'::jsonb),
('ruffles-ketcap-mega', 'Ruffles Ketçap Aromalı Tırtıklı Cips Süper Boy', 'cips-cerez', 55, NULL, 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?w=600&auto=format&fit=crop&q=80', 'En sevilen ketçaplı çıtır dalgalı patates cipsi.', '115 gr Paket', '8690000000502', TRUE, FALSE, 10, '[]'::jsonb, '["cips","ruffles","ketçaplı","tırtıklı","patates cipsi","film"]'::jsonb),
('tadim-cekirdek-180', 'Tadım Siyah Kavrulmuş Ayçekirdeği 180 gr', 'cips-cerez', 45, NULL, 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=600&auto=format&fit=crop&q=80', 'Taze kavrulmuş, çıtır tuzlu siyah dakota ayçekirdeği.', '180 gr Paket', '8690000000503', TRUE, FALSE, 10, '[]'::jsonb, '["çekirdek","ayçekirdeği","tadım","çerez","muhabbet","maç","film","dizi"]'::jsonb),
('tadim-fistik-180', 'Tadım Kavrulmuş Tuzlu Yer Fıstığı 180 gr', 'cips-cerez', 60, NULL, 'https://images.unsplash.com/photo-1525708711042-f41df5b13465?w=600&auto=format&fit=crop&q=80', 'Fırınlanmış çıtır tuzlu yer fıstığı.', '180 gr Paket', '8690000000504', TRUE, FALSE, 10, '[]'::jsonb, '["fıstık","yer fıstığı","tadım","kuruyemiş","çerez","atıştırmalık"]'::jsonb),
('ulker-cikolatali-gofret', 'Ülker Çikolatalı Gofret (Tekli)', 'cikolata-tatli', 15, NULL, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80', 'Gofret denince akla gelen klasik sütlü çikolatalı efsane.', '36 gr', '8690000000601', TRUE, FALSE, 10, '[]'::jsonb, '["çikolata","gofret","ülker","tatlı","tatlı krizi","canım tatlı","cikolata"]'::jsonb),
('eti-karam-gurme', 'Eti Karam Gurme Bitter Çikolatalı Gofret', 'cikolata-tatli', 25, NULL, 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&auto=format&fit=crop&q=80', 'Yoğun bitter kreması ve çıtır gofret katmanları.', '50 gr', '8690000000602', TRUE, FALSE, 10, '[]'::jsonb, '["karam","eti karam","bitter","çikolata","tatlı krizi","yoğun bitter"]'::jsonb),
('eti-browni-intense', 'Eti Browni Intense Çikolatalı Kek', 'cikolata-tatli', 22, NULL, 'https://images.unsplash.com/photo-1589218436045-ee320057f443?w=600&auto=format&fit=crop&q=80', 'İçi ıslak kek ve çikolata dolgusu, üzeri çikolata kaplama.', '48 gr', '8690000000603', TRUE, FALSE, 10, '[]'::jsonb, '["browni","kek","intense","çikolatalı kek","tatlı","ıslak kek"]'::jsonb),
('ulker-halley-10lu', 'Ülker Halley Sandviç Bisküvi (10''lu Paket)', 'cikolata-tatli', 48, NULL, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80', 'İki gevrek bisküvi arasında marshmallow ve enfes çikolata kaplama.', '10''lu Aile Boyu', '8690000000604', TRUE, FALSE, 10, '[]'::jsonb, '["halley","ülker","marshmallow","çikolata","atıştırmalık","tatlı"]'::jsonb),
('eti-burcak-klasik', 'Eti Burçak Yulaflı Bisküvi 131 gr', 'biskuvi-kek', 25, NULL, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80', 'Çayın yanına en çok yakışan lifli doğal yulaflı bisküvi.', '131 gr Paket', '8690000000701', TRUE, FALSE, 10, '[]'::jsonb, '["burçak","eti","yulaflı bisküvi","çay yanı","bisküvi"]'::jsonb),
('ulker-biskrem-kakao', 'Ülker Biskrem Kakaolu Bisküvi 100 gr', 'biskuvi-kek', 24, NULL, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80', 'İçinde eriyen çikolata kreması ile efsane dolgulu bisküvi.', '100 gr Rulo', '8690000000702', TRUE, FALSE, 10, '[]'::jsonb, '["biskrem","ülker","çikolata dolgulu","bisküvi","tatlı"]'::jsonb),
('ulker-cubuk-kraker', 'Ülker Çubuk Kraker Tuzlu (Büyük Boy)', 'biskuvi-kek', 15, NULL, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80', 'Tuzlu, çıtır çıtır mide yatıştıran klasik çubuk kraker.', '65 gr Paket', '8690000000703', TRUE, FALSE, 10, '[]'::jsonb, '["çubuk kraker","tuzlu kraker","mide","atıştırmalık","kraker"]'::jsonb),
('selpak-tuvalet-kagidi-4lu', 'Selpak 3 Katlı Parfümlü Tuvalet Kağıdı (4''lü)', 'kisisel-bakim', 55, NULL, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', '3 katlı ekstra yumuşak ve dayanıklı banyo tuvalet kağıdı.', '4 Rulo Paket', '8690000000801', TRUE, FALSE, 10, '[]'::jsonb, '["tuvalet kağıdı","selpak","rulo peçete","banyo","hijyen","temizlik","bakkal"]'::jsonb),
('sleepy-islak-mendil-3lu', 'Sleepy Cep Islak Mendil (3''lü Paket)', 'kisisel-bakim', 35, NULL, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', 'Hassas ciltlere uygun, pratik cep boy ıslak mendil seti.', '3 x 15 Yaprak', '8690000000802', TRUE, FALSE, 10, '[]'::jsonb, '["ıslak mendil","sleepy","hijyen","temizlik","cep mendil"]'::jsonb),
('tokai-tasli-cakmak', 'Tokai Taşlı Bakkal Çakmağı', 'kisisel-bakim', 20, NULL, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', 'Dayanıklı ve uzun ömürlü klasik taşlı cep çakmağı.', '1 adet', '8690000000803', TRUE, FALSE, 10, '[]'::jsonb, '["çakmak","tokai","ateş","kibrit","cakmak","ates"]'::jsonb),
('duracell-aaa-pil-4lu', 'Duracell İnce Kalem Pil AAA (4''lü Paket)', 'kisisel-bakim', 95, NULL, 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80', 'Kumandalar, saatler ve cihazlar için uzun ömürlü alkali pil.', '4 adet', '8690000000804', TRUE, FALSE, 10, '[]'::jsonb, '["pil","duracell","ince pil","kumanda pili","aaa pil","bakkal"]'::jsonb),
('head-shoulders-sampuan', 'Head & Shoulders Şampuan Klasik Bakım 330 ml', 'kisisel-bakim', 110, NULL, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80', 'Kepeğe karşı etkili klasik ferah duş şampuanı.', '330 ml Şişe', '8690000000805', TRUE, FALSE, 10, '[]'::jsonb, '["şampuan","head shoulders","duş","banyo","saç","temizlik"]'::jsonb),
('tost-cagla-spesiyal', 'Çağla Spesiyal Süper Karışık Tost', 'sicak-lezzetler', 135, 120, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80', 'Büyük somun ekmeğinde bol kaşar, dana sucuk, salam, kornişon turşu, domates ve özel büfe sosu.', '1 porsiyon', '8690000000001', TRUE, TRUE, 12, '[{"name":"Sos Seçimi","choices":["Ketçap & Mayonezli","Acılı Soslu","Sossuz"]},{"name":"Turşu Tercihi","choices":["Bol Turşulu","Normal Turşulu","Turşusuz"]}]'::jsonb, '["tost","karışık tost","çağla tost","sucuklu kaşarlı","sıcak yemek","açım","somun tost"]'::jsonb),
('tost-ayvalik', 'Ayvalık Tostu (Özel Ekmeğinde)', 'sicak-lezzetler', 140, 125, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', 'Özel Ayvalık ekmeğinde sosis, salam, sucuk, bol kaşar peyniri, rus salatası ve turşu.', '1 porsiyon', '8690000000007', TRUE, TRUE, 12, '[]'::jsonb, '["ayvalık tostu","tost","sosisli","rus salatası","açım","doyurucu"]'::jsonb),
('tost-kasarli-bazlama', 'Köy Bazlamasında Kaşarlı Tost', 'sicak-lezzetler', 95, NULL, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', 'Tereyağlı taze bazlama arasında eriyen bol kaşar peyniri ve dağ kekiği.', '1 porsiyon', '8690000000002', TRUE, TRUE, 10, '[]'::jsonb, '["bazlama tost","kaşarlı tost","tereyağlı","kahvaltı","sıcak tost"]'::jsonb),
('citir-patates-sepeti', 'Çıtır Parmak Patates Sepeti (Baharatlı)', 'sicak-lezzetler', 75, NULL, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80', 'Sıcak kızarmış patates, özel cajun baharatı ve yanında soslar.', 'Büyük Boy Sepet', '8690000000005', TRUE, TRUE, 10, '[]'::jsonb, '["patates","kızartma","çıtır patates","cajun","atıştırmalık","sıcak"]'::jsonb),
('sicak-cay-buyuk', 'Taze Demleme Çay (Karton Bardak)', 'sicak-lezzetler', 20, NULL, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 'Rize çayından taze demlenmiş sıcacık tavşankanı çay.', 'Büyük Karton Bardak', '8690000000006', TRUE, TRUE, 3, '[]'::jsonb, '["çay","sıcak çay","taze çay","demleme çay","kahvaltı"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
price = EXCLUDED.price,
discount_price = EXCLUDED.discount_price,
image_url = EXCLUDED.image_url,
description = EXCLUDED.description,
is_available = EXCLUDED.is_available,
is_kitchen_item = EXCLUDED.is_kitchen_item,
search_keywords = EXCLUDED.search_keywords;
