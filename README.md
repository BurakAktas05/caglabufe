# 🥪 Çağla Büfe & Market — Karabük Online Sipariş & PWA Uygulaması (v1.0.0 Final Sürüm)

Karabük Üniversitesi öğrencileri (KYK Yurtları & 100. Yıl Mahallesi) ve yerel müşteriler için geliştirilmiş; **Getir / Trendyol Go** esintili, zengin Vanilla CSS tasarımına sahip, **Next.js 16 + React 19 + Supabase Realtime + PWA** tam donanımlı online sipariş ve yönetim uygulaması.

---

## 🚀 Öne Çıkan Özellikler (Final Sürüm)

### 1. PWA & Çevrimdışı (Offline) Mimarisi
- **Tam PWA Desteği**: `manifest.json`, Service Worker (`sw.js`), 192px/512px ikonlar ve iOS `apple-touch-icon`.
- **Yurtlar İçin Çevrimdışı Modu**: Asansör veya Wi-Fi çekmeyen noktalarda doğrudan telefon ve WhatsApp ile sipariş veren branded `offline.html` ekranı.
- **Kurulum Rehberi**: iOS Safari ve Android Chrome kullanıcıları için özel Türkçe kurulum modalı.

### 2. Müşteri Deneyimi & Karabük KYK Adres Sistemi
- **Anti-AI Slop Tasarım**: Göz yoran neon gradyanlar yerine sade, yüksek kontrastlı ve modern Getir moru (`#5D3EBC`) & sarısı (`#FFD10D`).
- **KYK Yurtları Entegrasyonu**: Hubbi Hatun, Bahaddin Gazi, İsmail Necati Efendi, Asiye Hatun ve Karabük yurtlarına özel yurt önü / kapı teslimat notları.
- **Canlı Sipariş Takibi & Fişleme**: Sipariş durumu (Hazırlanıyor ➡️ Kuryede ➡️ Teslim Edildi) anlık güncellenir. Teslim edilen siparişler için 58mm/80mm termal yazıcı uyumlu dijital fiş görüntülenebilir.
- **Tek Tıkla WhatsApp & Arama**: Müşteri siparişiyle ilgili tek tıkla WhatsApp veya telefonla büfeye ulaşabilir.

### 3. Yönetici / Admin Masası (`/admin`)
- **Şifreli Güvenlik Bariyeri**: Müşterilerin sipariş ekranına ve müşteri verilerine erişimini engeller. (Varsayılan Şifre: `cagla2024`, Ayarlar sekmesinden değiştirilebilir).
- **Tek Tıkla Müşteriye WhatsApp (WP) / Arama**: Kurye veya kasa personeli adrese varmadan önce veya tost hazır olduğunda öğrenciye tek tıkla WhatsApp mesajı atabilir.
- **Web Audio Sesli Sipariş Zili**: Tarayıcı engellerini aşan otomatik `user-gesture` ses motoru ile yeni sipariş düştüğünde anında zil çalar.
- **Günlük Kasa & Z-Raporu**: Günlük ciro, nakit/POS dağılımı, en çok satan tostlar/ürünler ve tek tıkla termal fiş dökümü.
- **Kara Liste (Banned Users)**: Sahte sipariş veren veya teslim almayan telefon numaralarını tek tıkla engelleme.

---

## 🛠️ Kurulum & Yerel Çalıştırma

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev

# 3. Canlıya derleyin
npm run build
npm run start
```

Tarayıcınızda açın:
* **Müşteri Uygulaması**: `http://localhost:3000`
* **Admin Paneli**: `http://localhost:3000/admin` (Şifre: `cagla2024`)

---

## 🗄️ Supabase Yapılandırması (Opsiyonel)

Sistem ortam değişkenleri girilmediğinde dahi yerel depolama (`localStorage`) ve tarayıcılar arası `BroadcastChannel` ile **çökmeden, sıfır hatayla** çalışır.

Gerçek çok kullanıcılı veritabanı senkronizasyonu için `.env.local` dosyası oluşturup bilgilerinizi ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://projeniz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

Veritabanı tabloları için proje kök dizinindeki `supabase_schema.sql` dosyasını Supabase SQL editöründe çalıştırmanız yeterlidir.

---

### 4. Güçlendirilmiş Güvenlik Mimarisi (Anti-Tamper & Anti-Flood)
- **Fiyat & Miktar Manipülasyon Koruması**: İstemci DevTools üzerinden sepet fiyatını kurcalayamaz; [`validateCartIntegrity()`](file:///c:/Users/AKTASSAK/Desktop/caglabufe/src/lib/security.ts) ile katalog fiyatları üzerinden anlık doğrulanır.
- **Bot & Spam Sipariş Engeli (Rate Limiting)**: 90 saniyede en fazla 2 sipariş denemesi kuralı ile dükkanı kilitlemeye yönelik bot saldırıları önlenir.
- **XSS & HTML Enjeksiyon Koruması**: Müşteri adı, oda ve adres alanlarındaki tehlikeli karakterler ve scriptler [`sanitizeInput()`](file:///c:/Users/AKTASSAK/Desktop/caglabufe/src/lib/security.ts) ile temizlenir.
- **Kara Liste Kaçış Engeli**: Telefon numaraları standart 10 haneye (`5xxxxxxxxx`) indirgenerek `+90`, `0090` gibi format oyunlarıyla engeli aşma girişimleri bloke edilir.
- **Admin Brute-Force & Session Koruması**: 5 hatalı şifre denemesinde panel 5 dakika süreyle kilitlenir; tarayıcı oturumu salted hash imzasıyla korunur.
- **Supabase Row Level Security (RLS)**: Anonim kullanıcılar yalnızca ürün ve ayarları okuyabilir; ürünleri silme, fiyat değiştirme veya başkasının sipariş durumunu kurcalama RLS politikalarıyla veritabanı seviyesinde yasaklanmıştır.

### 5. Dinamik Teslimat Bölgeleri & Minimum Sepet Tutarları
- **Bölgeye Özel Kurallar**: 100. Yıl Mahallesi, Üniversite Kampüsü, KYK Yurtları, Şirinevler, 5000 Evler gibi bölgelere özel farklı minimum sipariş tutarları ve teslimat ücretleri.
- **Akıllı Eşleşme & Canlı Uyarı**: Müşteri adresini seçtiği anda o bölgenin minimum sepet tutarı (`minOrderAmount`) anlık olarak sepette kontrol edilir; limitin altındaysa eksik tutar dinamik olarak gösterilir ve sipariş butonu kilitlenir.

---

## 🛠️ Kurulum & Yerel Çalıştırma

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev

# 3. Canlıya derleyin
npm run build
npm run start
```

Tarayıcınızda açın:
* **Müşteri Uygulaması**: `http://localhost:3000`
* **Admin Paneli**: `http://localhost:3000/admin` (Şifre: `cagla2024`)

---

## 🗄️ Supabase Yapılandırması (Canlı Veritabanı)

Sistem ortam değişkenleri girilmediğinde dahi yerel depolama (`localStorage`) ve tarayıcılar arası `BroadcastChannel` ile **çökmeden, sıfır hatayla** çalışır.

Gerçek zamanlı çok kullanıcılı veritabanı senkronizasyonu için `.env.local` dosyası oluşturup bilgilerinizi ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://projeniz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

Veritabanı tabloları ve güvenlik kuralları için proje kök dizinindeki `supabase_schema.sql` dosyasını Supabase SQL editöründe çalıştırmanız yeterlidir.

---

## ☁️ Yayına Alma & Domain Bağlama (Vercel)

1. Projeyi GitHub reponuza yükleyin:
   ```bash
   git init
   git add .
   git commit -m "feat: Cagla Bufe & Market v1.0.0 production ready"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/caglabufe.git
   git push -u origin main
   ```
2. [Vercel](https://vercel.com) paneline gidip `Add New...` ➡️ `Project` seçin, reponuzu import edin.
3. Environment Variables kısmına `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` ekleyin.
4. **Deploy** butonuna basın.
5. Satın aldığınız domaini (örn: `caglabufe.com`):
   - Vercel Dashboard ➡️ **Settings** ➡️ **Domains** sekmesine girip ekleyin.
   - Domain sağlayıcınızda (GoDaddy, İsimtescil, Cloudflare vb.) DNS kayıtlarını Vercel'in verdiği `A` ve `CNAME` kayıtlarına yönlendirin. Otomatik SSL sertifikası ücretsiz olarak aktifleşecektir.
