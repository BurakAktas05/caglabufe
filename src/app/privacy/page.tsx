import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Gizlilik Politikası & KVKK Aydınlatma | Çağla Büfe',
  description: 'Çağla Büfe & Market Kişisel Verilerin Korunması (KVKK) ve Gizlilik Politikası metni.',
};

export default function PrivacyPolicyPage() {
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
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#f3f0fe', color: '#5D3EBC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#191919' }}>
                KVKK Aydınlatma Metni & Gizlilik Politikası
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Son Güncelleme: 16 Ekim 2026 • Çağla Büfe & Market (Karabük)
              </p>
            </div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                1. Veri Sorumlusu
              </h2>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, Karabük 100. Yıl Mahallesi&rsquo;nde faaliyet gösteren Çağla Büfe &amp; Market olarak, sipariş süreçlerinin yürütülmesi amacıyla müşterilerimizin kişisel verilerini işlemekteyiz.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                2. İşlenen Kişisel Veriler ve Amacı
              </h2>
              <p>
                Siparişinizi hazırlayıp kapınıza teslim edebilmek için yalnızca gerekli asgari bilgileri talep ederiz:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Kimlik ve İletişim:</strong> Ad, soyad, telefon numarası (Kuryenin teslimat sırasında size ulaşması ve SMS/WhatsApp durum bilgilendirmesi için).</li>
                <li><strong>Teslimat Adresi:</strong> Karabük KYK Yurt adı, blok, oda numarası veya mahalle/apartman açık adresi (Paketinizin doğru kapıya ulaştırılması için).</li>
                <li><strong>Sipariş Geçmişi:</strong> Sepet içeriği, sipariş notları ve seçilen kapıda ödeme türü (Nakit / POS).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                3. Ödeme ve Kart Bilgileri Güvenliği
              </h2>
              <p>
                Uygulamamız üzerinden herhangi bir kredi kartı numarası, son kullanma tarihi veya CVV bilgisi <strong>asla alınmaz ve sunucularımızda saklanmaz</strong>. Tüm ödemeler kapıda kurye teslimatı anında nakit veya kurye POS cihazı üzerinden gerçekleştirilir.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                4. Verilerin Üçüncü Kişilerle Paylaşımı
              </h2>
              <p>
                Kişisel verileriniz yalnızca siparişi ulaştırmakla görevli kurye personelimizle paylaşılır. Reklam, pazarlama veya ticari amaçlarla hiçbir üçüncü taraf veri şirketi ile paylaşılmaz ve satılmaz.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>
                5. Haklarınız
              </h2>
              <p>
                KVKK&rsquo;nın 11. maddesi kapsamında dilediğiniz zaman verilerinizin silinmesini talep edebilir, büfemizle iletişime geçerek numaranızı sistemden sildirebilirsiniz.
              </p>
            </section>

            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '14px', backgroundColor: '#f1f5f9', fontSize: '13px', color: '#475569' }}>
              <strong>İletişim &amp; Destek:</strong> Çağla Büfe &amp; Market, 100. Yıl Mah. 1003. Cad. No:12 Karabük. Tel: 0542 000 7878.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
