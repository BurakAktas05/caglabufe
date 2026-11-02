export interface KarabukDorm {
  id: string;
  name: string;
  shortName: string;
  district: string;
  badge?: string;
  gender?: 'kiz' | 'erkek' | 'karma';
  distanceKm?: number;
}

export const KARABUK_DORMS: KarabukDorm[] = [
  // --- BOSTANBÜKÜ / ÇEKİRDEK BÖLGE ---
  {
    id: 'bahaddin-gazi',
    name: 'KYK Bahaddin Gazi Erkek Öğrenci Yurdu',
    shortName: 'Bahaddin Gazi Yurdu',
    district: 'Bostanbükü / Safranbolu',
    badge: '⚡ 0.6 km (En Yakın)',
    gender: 'erkek',
    distanceKm: 0.6,
  },
  {
    id: 'katip-celebi',
    name: 'KYK Katip Çelebi Kız Öğrenci Yurdu',
    shortName: 'Katip Çelebi Yurdu',
    district: 'Bostanbükü / Safranbolu',
    badge: '⚡ 0.9 km (En Yakın)',
    gender: 'kiz',
    distanceKm: 0.9,
  },

  // --- KBÜ DEMİR ÇELİK KAMPÜSÜ & KILAVUZLAR ---
  {
    id: 'hubbi-hatun',
    name: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
    shortName: 'Hubbi Hatun Yurdu',
    district: 'Demir Çelik Kampüsü / Üniversite Mah.',
    badge: 'Kampüs İçi (2.3 km)',
    gender: 'kiz',
    distanceKm: 2.3,
  },
  {
    id: 'asiye-hatun',
    name: 'KYK Asiye Hatun Kız Öğrenci Yurdu',
    shortName: 'Asiye Hatun Yurdu',
    district: 'Demir Çelik Kampüsü / Kılavuzlar',
    badge: 'Kampüs İçi (2.6 km)',
    gender: 'kiz',
    distanceKm: 2.6,
  },
  {
    id: 'karabuk-kyk-kiz',
    name: 'KYK Karabük Kız Öğrenci Yurdu',
    shortName: 'Karabük Yurdu (Kılavuzlar)',
    district: 'Kılavuzlar / Demir Çelik Kampüsü',
    badge: 'Kılavuzlar (2.8 km)',
    gender: 'kiz',
    distanceKm: 2.8,
  },
  {
    id: 'ismail-necati',
    name: 'KYK İsmail Necati Efendi Erkek Yurdu',
    shortName: 'İsmail Necati Yurdu',
    district: 'Karıt / Kılavuzlar Mevkii',
    badge: 'Karıt (2.7 km)',
    gender: 'erkek',
    distanceKm: 2.7,
  },
  {
    id: 'seyh-edebali',
    name: 'KYK Şeyh Edebali Erkek Öğrenci Yurdu',
    shortName: 'Şeyh Edebali Yurdu',
    district: 'Demir Çelik Kampüsü',
    badge: 'Kampüs İçi (2.5 km)',
    gender: 'erkek',
    distanceKm: 2.5,
  },
  {
    id: 'ozel-prestij',
    name: 'Özel Prestij Erkek Öğrenci Yurdu',
    shortName: 'Prestij Erkek Yurdu',
    district: 'Demir Çelik Kampüsü / Kılavuzlar',
    badge: 'Özel Yurt (2.7 km)',
    gender: 'erkek',
    distanceKm: 2.7,
  },

  // --- 100. YIL MAHALLESİ (ÖĞRENCİ MERKEZİ) ---
  {
    id: 'eflani',
    name: 'KYK Eflani Kız Öğrenci Yurdu',
    shortName: 'Eflani Yurdu',
    district: '100. Yıl Mahallesi',
    badge: '100. Yıl (3.8 km)',
    gender: 'kiz',
    distanceKm: 3.8,
  },
  {
    id: 'ozel-altinkalem',
    name: 'Özel Altınkalem Kız ve Erkek Öğrenci Yurdu',
    shortName: 'Altınkalem Yurdu',
    district: '100. Yıl Mahallesi (KBÜ Karşısı)',
    badge: 'Özel Yurt (3.6 km)',
    gender: 'karma',
    distanceKm: 3.6,
  },
  {
    id: 'ozel-ilke',
    name: 'Özel İlke Kız Öğrenci Yurdu',
    shortName: 'İlke Kız Yurdu',
    district: '100. Yıl Mahallesi',
    badge: 'Özel Yurt (3.7 km)',
    gender: 'kiz',
    distanceKm: 3.7,
  },
  {
    id: 'ozel-dilek',
    name: 'Özel Dilek Kız Öğrenci Yurdu',
    shortName: 'Dilek Kız Yurdu',
    district: '100. Yıl Mahallesi',
    badge: 'Özel Yurt (3.9 km)',
    gender: 'kiz',
    distanceKm: 3.9,
  },
  {
    id: 'ozel-aslantepe',
    name: 'Özel Aslantepe Kız Öğrenci Yurdu',
    shortName: 'Aslantepe Kız Yurdu',
    district: '100. Yıl Mahallesi',
    badge: 'Özel Yurt (4.0 km)',
    gender: 'kiz',
    distanceKm: 4.0,
  },
  {
    id: 'ozel-karakoc',
    name: 'Özel Karakoç Erkek Öğrenci Yurdu',
    shortName: 'Karakoç Erkek Yurdu',
    district: '100. Yıl Mahallesi',
    badge: 'Özel Yurt (3.6 km)',
    gender: 'erkek',
    distanceKm: 3.6,
  },
  {
    id: 'ozel-akademi',
    name: 'Özel Akademi Kız Öğrenci Yurdu',
    shortName: 'Akademi Kız Yurdu',
    district: '100. Yıl Mahallesi',
    badge: 'Özel Yurt (3.8 km)',
    gender: 'kiz',
    distanceKm: 3.8,
  },
  {
    id: 'ozel-100yil-apart',
    name: '100. Yıl Öğrenci Apartları ve Rezidanslar',
    shortName: '100. Yıl Apartlar',
    district: '100. Yıl Mahallesi Geneli',
    badge: 'Öğrenci Bölgesi (3.8 km)',
    gender: 'karma',
    distanceKm: 3.8,
  },

  // --- SAFRANBOLU BÖLGESİ ---
  {
    id: 'aise-ana',
    name: 'KYK Aişe Ana Kız Öğrenci Yurdu',
    shortName: 'Aişe Ana Yurdu',
    district: 'Safranbolu / Tokatlı',
    badge: 'Safranbolu (4.6 km)',
    gender: 'kiz',
    distanceKm: 4.6,
  },
  {
    id: 'safranbolu-yurdu',
    name: 'KYK Safranbolu Öğrenci Yurdu',
    shortName: 'Safranbolu Yurdu',
    district: 'Safranbolu (Sadri Artunç Cad.)',
    badge: 'Safranbolu (3.9 km)',
    gender: 'karma',
    distanceKm: 3.9,
  },
  {
    id: 'ozel-gultekin',
    name: 'Özel Gültekin Kız Öğrenci Yurdu',
    shortName: 'Gültekin Kız Yurdu',
    district: 'Safranbolu (Emek Mah.)',
    badge: 'Özel Yurt (3.5 km)',
    gender: 'kiz',
    distanceKm: 3.5,
  },
  {
    id: 'ozel-celebi',
    name: 'Özel Çelebi Kız Öğrenci Yurdu',
    shortName: 'Çelebi Kız Yurdu',
    district: 'Safranbolu (Barış Mah.)',
    badge: 'Özel Yurt (3.7 km)',
    gender: 'kiz',
    distanceKm: 3.7,
  },
  {
    id: 'ozel-ova',
    name: 'Özel Ova Kız Öğrenci Yurdu',
    shortName: 'Ova Kız Yurdu',
    district: 'Safranbolu (Kıranköy)',
    badge: 'Özel Yurt (4.0 km)',
    gender: 'kiz',
    distanceKm: 4.0,
  },

  // --- KARABÜK MERKEZ & SOĞUKSU / ŞİRİNEVLER ---
  {
    id: 'soguksu-kyk',
    name: 'KYK Soğuksu Kız Yurdu',
    shortName: 'Soğuksu KYK',
    district: 'Soğuksu / Karabük Merkez',
    badge: 'Soğuksu (6.2 km)',
    gender: 'kiz',
    distanceKm: 6.2,
  },
  {
    id: 'taskent-kyk',
    name: 'KYK Taşkent Kız Yurdu',
    shortName: 'Taşkent KYK',
    district: 'Yeşil Mahalle / Karabük Merkez',
    badge: 'Merkez (6.8 km)',
    gender: 'kiz',
    distanceKm: 6.8,
  },
  {
    id: 'diger-yurt',
    name: 'Diğer Öğrenci Yurdu / Apart',
    shortName: 'Diğer Yurt / Apart',
    district: 'Karabük Geneli',
    badge: 'Karabük Geneli',
  },
];

export const KARABUK_DISTRICTS = [
  'Bostanbükü (Çekirdek Bölge)',
  'Demir Çelik Kampüsü & Kılavuzlar',
  '100. Yıl Mahallesi (Öğrenci Yaşam)',
  'Üniversite Mahallesi',
  'Safranbolu - Emek / Barış / Atatürk Mah.',
  'Safranbolu - Kıranköy & Tarihi Çarşı',
  'Şirinevler',
  '5000 Evler (75. Yıl & Cumhuriyet)',
  'Aydınlıkevler',
  'Soğuksu',
  'Yeşil Mahalle',
  'Karabük Merkez (Valilik / Çarşı)',
  'Diğer Karabük Mahalleleri',
];

export const DELIVERY_PRESET_NOTES = [
  'Yurdun önünde / ana kapısında teslim alacağım (gelince arayınız)',
  'Gelince arayın hemen yurdun önüne inerim',
  'Yurt ana giriş kapısındayım / önündeyim',
  'Yurt güvenliğine / danışmaya bırakabilirsiniz',
];
