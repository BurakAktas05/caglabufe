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
    id: 'sicak-mutfak',
    name: 'Sıcak Mutfak & Tostlar',
    badge: 'Taze Tost, Sandviç & Büfe',
    emoji: '🥪',
    count: 20,
    imageUrl: '/categories/hot-tost-hero.jpg',
    accentBg: '#FFF7ED',
    categories: [
      'Tost & Sıcak Lezzetler',
      'Tost',
      'Sandviç',
      'Sıcak Sandviç',
      'Sıcak Lezzetler',
      'Büfe',
      'Burger & Sıcak Atıştırmalık',
      'Gözleme',
      'Dürüm',
      'Patates & Sıcak Sepet',
    ],
  },
  {
    id: 'kantin-atistirmalik',
    name: 'Kantin & Atıştırmalık',
    badge: 'Çikolata, Gofret & Bisküvi',
    emoji: '🍫',
    count: 354,
    imageUrl: '/categories/kantin-atistirmalik.jpg',
    accentBg: '#FFF7ED',
    categories: [
      'Çikolata',
      'Bisküvi',
      'Kek',
      'Gofret',
      'Şekerleme',
      'Sakız',
      'Çubuk Kraker',
      'Kraker',
      'Atıştırmalık Bar',
      'Sağlıklı Atıştırmalık',
      'Bebek Bisküvisi',
      'Mısır ve Pirinç Patlağı'
    ],
  },
  {
    id: 'soguk-icecek',
    name: 'Soğuk İçecek & Su',
    badge: 'Kola, Gazoz & Soğuk Çay',
    emoji: '🧊',
    count: 145,
    imageUrl: '/categories/soguk-icecek.jpg',
    accentBg: '#EFF6FF',
    categories: [
      'Meyve Suyu',
      'Soğuk Çay',
      'Soğuk Kahve',
      'Kola',
      'Soda',
      'Gazoz',
      'Diğer Gazlı İçecek',
      'Aromalı Süt',
      'Diğer Gazsız İçecek',
      'Ayran',
      'Limonata',
      'Su',
      'Malt İçecek',
      'Ramazan Şerbeti'
    ],
  },
  {
    id: 'enerji-icecek',
    name: 'Enerji İçecekleri',
    badge: 'Canlandırıcı İçecekler',
    emoji: '⚡',
    count: 23,
    imageUrl: '/categories/enerji-icecek.jpg',
    accentBg: '#FEF3C7',
    categories: ['Enerji İçeceği'],
  },
  {
    id: 'cips-cerez',
    name: 'Cips & Kuruyemiş',
    badge: 'Patates Cipsi & Çekirdek',
    emoji: '🍿',
    count: 57,
    imageUrl: '/categories/cips-cerez.jpg',
    accentBg: '#FEF2F2',
    categories: [
      'Cips',
      'Yer Fıstığı',
      'Ay Çekirdeği',
      'Badem',
      'Fındık',
      'Leblebi',
      'Antep Fıstığı',
      'Patlayan Mısır',
      'Kaju',
      'Karışık Kuruyemiş',
      'Kabak Çekirdeği',
      'Diğer Kuruyemiş'
    ],
  },
  {
    id: 'hazir-yiyecek',
    name: 'Pratik Mutfak, Noodle & Soslar',
    badge: 'Noodle, Makarna & Soslar',
    emoji: '🍜',
    count: 24,
    imageUrl: '/categories/hazir-yiyecek.jpg',
    accentBg: '#FFFBEB',
    categories: [
      'Hazır Noodle',
      'Diğer Sos',
      'Ketçap',
      'Mayonez',
      'Acı Sos',
      'Kahvaltılık Sos',
      'Makarna',
      'Hazır Yemek',
      'Hazır Çorba',
    ],
  },
  {
    id: 'kahve-cay',
    name: 'Kahve & Sıcak Çay',
    badge: 'Kahve, Demleme & Bitki Çayı',
    emoji: '☕',
    count: 44,
    imageUrl: '/categories/kahve-cay.jpg',
    accentBg: '#FAF5FF',
    categories: [
      'Tekli Poşet Kahve',
      'Granül Kahve',
      'Diğer Bitki Çayı',
      'Dökme Çay',
      'Bardak Poşet Çay',
      'Kahve Kreması',
      'Filtre Kahve',
      'Türk Kahvesi',
      'Sıcak Çikolata',
      'Bitki Çayı',
      'Adaçayı',
      'Kuşburnu',
      'Rezene',
      'Sahlep',
      'Diğer Toz İçecek'
    ],
  },
  {
    id: 'temel-market',
    name: 'Temel Gıda & Kahvaltılık',
    badge: 'Peynir, Şarküteri & Süt',
    emoji: '🛒',
    count: 53,
    imageUrl: '/categories/temel-market.jpg',
    accentBg: '#F8FAFC',
    categories: [
      'Peynir',
      'Sürülebilir Çikolata',
      'Normal Süt',
      'Ton Balığı',
      'Sucuk',
      'Turşu',
      'Salam',
      'Kahvaltılık Gevrek',
      'Hindi Füme',
      'Domates Salçası',
      'Meyveli Yoğurt',
      'Siyah Zeytin',
      'Sıvı Yağ',
      'Toz Şeker',
      'Helva',
      'Konserve Mısır',
      'Yoğurt',
      'Bal',
      'Tuz',
      'Yulaf Ezmesi'
    ],
  },
  {
    id: 'kisisel-bakim',
    name: 'Kişisel Bakım & Hijyen',
    badge: 'Şampuan, Sabun & Diş',
    emoji: '🧴',
    count: 35,
    imageUrl: '/categories/kisisel-bakim.jpg',
    accentBg: '#ECFDF5',
    categories: [
      'Şampuan',
      'Islak Mendil',
      'Diş Macunu',
      'Diğer Gıda Takviyesi',
      'Banyo Sabunu',
      'Kolonya',
      'El Sabunu',
      'Tıraş Bıçağı',
      'Yarabandı',
      'Duş Jeli',
      'Hijyenik Ped',
      'Manuel Diş Fırçası',
      'Günlük Ped',
      'Bebek Temizleme Pamuğu'
    ],
  },
  {
    id: 'kagit-temizlik',
    name: 'Kağıt & Ev Temizlik',
    badge: 'Deterjan, Kağıt & Temizlik',
    emoji: '🧻',
    count: 22,
    imageUrl: '/categories/kagit-temizlik.jpg',
    accentBg: '#F0FDF4',
    categories: [
      'Tuvalet Kağıdı',
      'Çamaşır Yumuşatıcısı',
      'Toz Deterjanı',
      'Sıvı Deterjanı',
      'Kağıt Havlu',
      'Kağıt Peçete',
      'Çöp Torbası',
      'Sinek İlacı',
      'Koku Giderici',
      'Bulaşık Makinesi Deterjanı',
      'Kağıt Mendil',
      'Yüzey Temizleyici',
      'Elde Bulaşık Deterjanı',
      'Çamaşır Suyu'
    ],
  },
  {
    id: 'pet-shop',
    name: 'Evcil Hayvan (Pet)',
    badge: 'Kedi Konserve & Ödül Maması',
    emoji: '🐱',
    count: 1,
    imageUrl: '/categories/pet-shop.jpg',
    accentBg: '#FFF1F2',
    categories: ['Kedi Konserve Maması', 'Kedi Ödülü'],
  },
  {
    id: 'elektronik-diger',
    name: 'Çakmak, Pil & Yaşam',
    badge: 'Çakmak, Pil & Kamp',
    emoji: '🔋',
    count: 8,
    imageUrl: '/categories/elektronik-diger.jpg',
    accentBg: '#F1F5F9',
    categories: [
      'Çakmak',
      'Kamp Ekipmanı',
      'Piller Şarj Cihazı',
      'Kibrit',
      'Ev Dekorasyon',
      'Plastik Tabak',
      'Oyuncak'
    ],
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
    catLower.includes('gözleme') ||
    catLower.includes('dürüm') ||
    catLower.includes('patates') ||
    catLower.includes('mutfak') ||
    catLower.includes('büfe')
  ) {
    return getDepartmentById('sicak-mutfak');
  }
  if (
    catLower.includes('yemek') ||
    catLower.includes('sos') ||
    catLower.includes('noodle') ||
    catLower.includes('makarna') ||
    catLower.includes('çorba')
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
    catLower.includes('sakız') ||
    catLower.includes('bisküvi')
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
  if (
    catLower.includes('kahve') ||
    catLower.includes('cay') ||
    catLower.includes('çay')
  ) {
    return getDepartmentById('kahve-cay');
  }
  if (
    catLower.includes('peynir') ||
    catLower.includes('sucuk') ||
    catLower.includes('salam') ||
    catLower.includes('süt') ||
    catLower.includes('zeytin') ||
    catLower.includes('bal') ||
    catLower.includes('gıda')
  ) {
    return getDepartmentById('temel-market');
  }
  if (
    catLower.includes('temiz') ||
    catLower.includes('deterjan') ||
    catLower.includes('kağıt')
  ) {
    return getDepartmentById('kagit-temizlik');
  }

  return undefined;
}
