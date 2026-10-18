import Link from 'next/link';
import { ArrowLeft, FileText, Clock, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Kullanım Koşulları & Sipariş Kuralları | Çağla Büfe',
  description: 'Çağla Büfe & Market Karabük & KYK gece paket sipariş teslimat kuralları ve şartları.',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fc', color: '#191919', padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: '#5D3EBC',
              textDecoration: 'none',
              backgroundColor: '#f3f0fe',
              padding: '8px 14px',
              borderRadius: '10px',
            }}
          >
            <ArrowLeft size={16} />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '36px 28px', border: '1px solid #ebebf2', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#191919' }}>
                Kullanım Koşulları &amp; Teslimat Kuralları
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Çağla Büfe &amp; Market • Karabük 100. Yıl &amp; KYK Yurtları
              </p>
            </div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#5D3EBC" /> 1. Çalışma Saatleri ve Teslimat Süreleri
              </h2>
              <p>
                Sipariş servisimiz her gün <strong>16:00 - 03:00</strong> saatleri arasında aktiftir. KYK Yurtları ve 100. Yıl Mahallesine ortalama teslimat süresi 15-25 dakikadır. Olumsuz hava koşulları veya yoğunluk durumunda tahmini sürede esneme olabilir.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                2. KYK Yurt Teslimat Prosedürü
              </h2>
              <p>
                KYK Yurt kuralları gereği kuryeler yurt binalarının içine veya katlara giremez. Kuryemiz yurt nizamiyesine / ana giriş kapısına ulaştığında siparişte belirttiğiniz telefon numarasından sizi arayacak veya WhatsApp ile haber verecektir. Lütfen telefonunuzu açık ve yanınızda bulundurunuz.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                3. Asgari Sipariş Tutarları &amp; Teslimat Ücreti
              </h2>
              <p>
                Her teslimat bölgesi için belirlenmiş bir minimum sepet tutarı bulunmaktadır (KYK Yurtları için 50-60 TL civarı). Belirlenen ücretsiz teslimat eşiğini geçen siparişlerde getirme ücreti alınmaz.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} color="#dc2626" /> 4. Asılsız Sipariş ve Kara Liste Politikası
              </h2>
              <p>
                Kapıda ödeme kolaylığı güvene dayalı bir hizmettir. Kurye adrese ulaştığında kapıyı açmayan, telefonlara cevap vermeyen veya siparişi haksız yere teslim almayan numaralar tespit edilerek kalıcı olarak <strong>kara listeye (ban)</strong> alınır ve bir daha sipariş vermeleri engellenir.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                5. İptal ve Değişiklik
              </h2>
              <p>
                Siparişinizi onayladıktan sonra mutfakta hazırlanmaya başlamadan önce (genellikle ilk 3-5 dakika içinde) büfemizi arayarak ücretsiz iptal edebilir veya adres/ürün değişikliği yapabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
