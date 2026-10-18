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
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/43769775_1707393806596_org.jpg',
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
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/245503677_1707334403608_org.jpg',
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
    badge: 'Red Bull, Monster & Burn',
    emoji: '⚡',
    count: 32,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/245547598_1707334764567_org.jpg',
    accentBg: '#FEF3C7',
    categories: ['Enerji İçeceği'],
  },
  {
    id: 'cips-cerez',
    name: 'Cips & Kuruyemiş',
    badge: 'Patates Cipsi & Çekirdek',
    emoji: '🍿',
    count: 61,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/91538491_1712222163380_org.jpg',
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
    name: 'Hazır Yiyecek & Noodle',
    badge: 'Noodle, Çorba & Makarna',
    emoji: '🍜',
    count: 20,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/245768180_1733829087441_org.jpg',
    accentBg: '#FFFBEB',
    categories: ['Hazır Noodle', 'Hazır Çorba', 'Makarna', 'Ketçap'],
  },
  {
    id: 'kahve-cay',
    name: 'Kahve & Sıcak Çay',
    badge: 'Nescafe, Çay & Türk Kahvesi',
    emoji: '☕',
    count: 30,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/245255309_1707332993094_org.jpg',
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
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/245539778_1707332930247_org.jpg',
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
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/32407208_1707335202156_org.jpg',
    accentBg: '#F0FDF4',
    categories: ['Kağıt Mendil', 'Tuvalet Kağıdı', 'Kağıt Havlu'],
  },
  {
    id: 'temel-market',
    name: 'Temel Gıda & Bakkal',
    badge: 'Yulaf, Şeker & Mutfak',
    emoji: '🛒',
    count: 3,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/70079156_1707335232153_org.jpg',
    accentBg: '#F8FAFC',
    categories: ['Yulaf Ezmesi', 'Toz Şeker', 'Meyveli Yoğurt'],
  },
  {
    id: 'pet-shop',
    name: 'Evcil Hayvan (Pet)',
    badge: 'Kedi Konserve & Ödül Maması',
    emoji: '🐱',
    count: 7,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/32633063_1707331605343_org.jpg',
    accentBg: '#FFF1F2',
    categories: ['Kedi Konserve Maması', 'Kedi Ödülü'],
  },
  {
    id: 'elektronik-diger',
    name: 'Çakmak & Elektronik',
    badge: 'Çakmak, Pil & Kamp',
    emoji: '🔋',
    count: 4,
    imageUrl: 'https://cdn.tgoapps.com/tgo1/prod/grocery/images/2422019_1750866688404_org.jpg',
    accentBg: '#F1F5F9',
    categories: ['Çakmak', 'Piller Şarj Cihazı', 'Oyuncak', 'Kamp Ekipmanı'],
  },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function findDepartmentForCategory(category: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.categories.includes(category));
}
