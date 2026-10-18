export interface Department {
  id: string;
  name: string;
  badge: string;
  emoji: string;
  count: number;
  imageUrl: string;
  accentBg: string;
  categories: string[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'kantin-atistirmalik',
    name: 'Kantin & Atıştırmalık',
    badge: 'Çikolata, Gofret & Kek',
    emoji: '🍫',
    count: 308,
    imageUrl: '/categories/kantin-atistirmalik.jpg',
    accentBg: '#FFF7ED',
    categories: [
      'Çikolata',
      'Gofret',
      'Bisküvi',
      'Kek',
      'Sakız',
      'Şekerleme',
      'Çubuk Kraker',
      'Kraker',
      'Atıştırmalık Bar',
      'Sağlıklı Atıştırmalık',
    ],
  },
  {
    id: 'soguk-icecek',
    name: 'Soğuk İçecek & Su',
    badge: 'Kola, Gazoz & Soğuk Çay',
    emoji: '🧊',
    count: 162,
    imageUrl: '/categories/soguk-icecek.jpg',
    accentBg: '#EFF6FF',
    categories: [
      'Meyve Suyu',
      'Soğuk Çay',
      'Gazoz',
      'Soda',
      'Kola',
      'Soğuk Kahve',
      'Diğer Gazlı İçecek',
      'Diğer Gazsız İçecek',
      'Limonata',
      'Aromalı Süt',
      'Ayran',
      'Su',
      'Ramazan Şerbeti',
      'Malt İçecek',
    ],
  },
  {
    id: 'enerji-icecek',
    name: 'Enerji İçecekleri',
    badge: 'Enerji & Canlandırıcı İçecekler',
    emoji: '⚡',
    count: 32,
    imageUrl: '/categories/enerji-icecek.jpg',
    accentBg: '#FEF3C7',
    categories: ['Enerji İçeceği'],
  },
  {
    id: 'cips-cerez',
    name: 'Cips & Kuruyemiş',
    badge: 'Patates Cipsi & Çekirdek',
    emoji: '🍿',
    count: 61,
    imageUrl: '/categories/cips-cerez.jpg',
    accentBg: '#FEF2F2',
    categories: [
      'Cips',
      'Yer Fıstığı',
      'Ay Çekirdeği',
      'Patlayan Mısır',
      'Fındık',
      'Leblebi',
      'Kaju',
      'Karışık Kuruyemiş',
      'Kabak Çekirdeği',
      'Diğer Kuruyemiş',
    ],
  },
  {
    id: 'hazir-yiyecek',
    name: 'Hazır Yiyecek & Tost',
    badge: 'Tost, Noodle & Sıcaklar',
    emoji: '🥪',
    count: 20,
    imageUrl: '/categories/hazir-yiyecek.jpg',
    accentBg: '#FFFBEB',
    categories: [
      'Hazır Noodle',
      'Hazır Çorba',
      'Makarna',
      'Ketçap',
      'Tost & Sıcak Lezzetler',
      'Tost',
      'Sandviç',
      'Sıcak Sandviç',
      'Sıcak Lezzetler',
      'Büfe'
    ],
  },
  {
    id: 'kahve-cay',
    name: 'Kahve & Sıcak Çay',
    badge: 'Kahve, Demleme Çay & Sıcaklar',
    emoji: '☕',
    count: 30,
    imageUrl: '/categories/kahve-cay.jpg',
    accentBg: '#FAF5FF',
    categories: [
      'Tekli Poşet Kahve',
      'Granül Kahve',
      'Sıcak Çikolata',
      'Diğer Toz İçecek',
      'Dökme Çay',
      'Sahlep',
      'Türk Kahvesi',
    ],
  },
  {
    id: 'kisisel-bakim',
    name: 'Kişisel Bakım & Hijyen',
    badge: 'Şampuan, Duş Jeli & Diş',
    emoji: '🧴',
    count: 21,
    imageUrl: '/categories/kisisel-bakim.jpg',
    accentBg: '#ECFDF5',
    categories: [
      'Duş Jeli',
      'Hijyenik Ped',
      'Şampuan',
      'Islak Mendil',
      'Manuel Diş Fırçası',
      'Günlük Ped',
      'Bebek Temizleme Pamuğu',
      'Diğer Gıda Takviyesi',
    ],
  },
  {
    id: 'kagit-temizlik',
    name: 'Kağıt Ürünleri',
    badge: 'Tuvalet Kağıdı & Havlu',
    emoji: '🧻',
    count: 5,
    imageUrl: '/categories/kagit-temizlik.jpg',
    accentBg: '#F0FDF4',
    categories: ['Kağıt Mendil', 'Tuvalet Kağıdı', 'Kağıt Havlu'],
  },
  {
    id: 'temel-market',
    name: 'Temel Gıda & Bakkal',
    badge: 'Yulaf, Şeker & Mutfak',
    emoji: '🛒',
    count: 3,
    imageUrl: '/categories/temel-market.jpg',
    accentBg: '#F8FAFC',
    categories: ['Yulaf Ezmesi', 'Toz Şeker', 'Meyveli Yoğurt'],
  },
  {
    id: 'pet-shop',
    name: 'Evcil Hayvan (Pet)',
    badge: 'Kedi Konserve & Ödül Maması',
    emoji: '🐱',
    count: 7,
    imageUrl: '/categories/pet-shop.jpg',
    accentBg: '#FFF1F2',
    categories: ['Kedi Konserve Maması', 'Kedi Ödülü'],
  },
  {
    id: 'elektronik-diger',
    name: 'Çakmak & Elektronik',
    badge: 'Çakmak, Pil & Kamp',
    emoji: '🔋',
    count: 4,
    imageUrl: '/categories/elektronik-diger.jpg',
    accentBg: '#F1F5F9',
    categories: ['Çakmak', 'Piller Şarj Cihazı', 'Oyuncak', 'Kamp Ekipmanı'],
  },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function findDepartmentForCategory(category: string): Department | undefined {
  if (!category) return undefined;
  const direct = DEPARTMENTS.find((d) =>
    d.categories.some((c) => c.toLowerCase() === category.toLowerCase())
  );
  if (direct) return direct;

  const catLower = category.toLowerCase();
  if (
    catLower.includes('tost') ||
    catLower.includes('sandvic') ||
    catLower.includes('sandviç') ||
    catLower.includes('burger') ||
    catLower.includes('sicak') ||
    catLower.includes('sıcak') ||
    catLower.includes('patates') ||
    catLower.includes('yemek')
  ) {
    return getDepartmentById('hazir-yiyecek');
  }
  if (
    catLower.includes('tatli') ||
    catLower.includes('tatlı') ||
    catLower.includes('cikolata') ||
    catLower.includes('çikolata') ||
    catLower.includes('kek') ||
    catLower.includes('gofret') ||
    catLower.includes('sakiz') ||
    catLower.includes('sakız')
  ) {
    return getDepartmentById('kantin-atistirmalik');
  }
  if (
    catLower.includes('icecek') ||
    catLower.includes('içecek') ||
    catLower.includes('su') ||
    catLower.includes('kola') ||
    catLower.includes('gazoz') ||
    catLower.includes('ayran')
  ) {
    return getDepartmentById('soguk-icecek');
  }

  return undefined;
}
