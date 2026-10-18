import { CategoryInfo, Product } from '@/types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'temel-gida',
    name: 'Bakkal & Temel Gıda',
    icon: 'bakkal',
    badge: 'Temel İhtiyaç',
    description: 'Ekmek, süt, yumurta, peynir, yağ, un, şeker ve makarna',
  },
  {
    id: 'soguk-icecek',
    name: 'Su & İçecek & Soda',
    icon: 'icecek',
    badge: 'Buz Gibi',
    description: 'Doğal kaynak suları, maden suları, kolalar ve soğuk çaylar',
  },
  {
    id: 'cay-kahve',
    name: 'Çay & Kahve',
    icon: 'kahve',
    description: 'Çaykur çay, Türk kahvesi, Nescafe ve küp şeker çeşitleri',
  },
  {
    id: 'pratik-yemek',
    name: 'Noodle & Konserve',
    icon: 'noodle',
    badge: 'Öğrenci Dostu',
    description: 'Hazır noodle, ton balığı, hazır çorbalar ve pratik lezzetler',
  },
  {
    id: 'cips-cerez',
    name: 'Cips & Çerez',
    icon: 'cips',
    description: 'Doritos, Ruffles, Lays ve taze kavrulmuş kuruyemişler',
  },
  {
    id: 'cikolata-tatli',
    name: 'Çikolata & Tatlı',
    icon: 'cikolata',
    description: 'Gofretler, çikolatalar, kekler ve tatlı krizleri için atıştırmalıklar',
  },
  {
    id: 'biskuvi-kek',
    name: 'Bisküvi & Kraker',
    icon: 'biskuvi',
    description: 'Çayın kahvenin yanına bisküviler, çubuk krakerler ve kurabiyeler',
  },
  {
    id: 'kisisel-bakim',
    name: 'Bakkal İhtiyaç & Temizlik',
    icon: 'bakim',
    description: 'Şampuan, ıslak mendil, tuvalet kağıdı, pil, çakmak ve acil ihtiyaçlar',
  },
  {
    id: 'sicak-lezzetler',
    name: 'Sıcak Büfe (Tost & Sandviç)',
    icon: 'tost',
    badge: 'Fırından Sıcak',
    description: 'Çağla Spesiyal karışık tost, Ayvalık tostu, bazlama ve çıtır patates',
  },
];

// Canlı veritabanı bağlantısı (Supabase) kullanıldığı için ürünler doğrudan veritabanından çekilir.
export const INITIAL_PRODUCTS: Product[] = [];
