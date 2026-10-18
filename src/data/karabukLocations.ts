export interface KarabukDorm {
  id: string;
  name: string;
  shortName: string;
  district: string;
  badge?: string;
}

export const KARABUK_DORMS: KarabukDorm[] = [
  {
    id: 'hubbi-hatun',
    name: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
    shortName: 'Hubbi Hatun Yurdu',
    district: 'Demir Çelik Kampüsü',
    badge: 'Kampüs İçi'
  },
  {
    id: 'bahaddin-gazi',
    name: 'KYK Bahaddin Gazi Erkek Öğrenci Yurdu',
    shortName: 'Bahaddin Gazi Yurdu',
    district: '100. Yıl Mahallesi',
    badge: '100. Yıl'
  },
  {
    id: 'ismail-necati',
    name: 'KYK İsmail Necati Efendi Erkek Yurdu',
    shortName: 'İsmail Necati Yurdu',
    district: 'Demir Çelik Kampüsü',
    badge: 'Kampüs İçi'
  },
  {
    id: 'asiye-hatun',
    name: 'KYK Asiye Hatun Kız Öğrenci Yurdu',
    shortName: 'Asiye Hatun Yurdu',
    district: '100. Yıl Mahallesi',
    badge: '100. Yıl'
  },
  {
    id: 'aygoren-safranbolu',
    name: 'KYK Aygören Öğrenci Yurdu',
    shortName: 'Aygören Yurdu',
    district: 'Safranbolu',
    badge: 'Safranbolu'
  },
  {
    id: 'soguksu-kyk',
    name: 'KYK Soğuksu Kız Yurdu',
    shortName: 'Soğuksu KYK',
    district: 'Soğuksu Mahallesi',
    badge: 'Soğuksu'
  },
  {
    id: 'ozel-kampus-apart',
    name: '100. Yıl Özel Öğrenci Apartları',
    shortName: '100. Yıl Apartlar',
    district: '100. Yıl Mahallesi',
    badge: 'Öğrenci Bölgesi'
  },
  {
    id: 'diger-yurt',
    name: 'Diğer Öğrenci Yurdu / Apart',
    shortName: 'Diğer Yurt / Apart',
    district: 'Karabük Geneli'
  }
];

export const KARABUK_DISTRICTS = [
  '100. Yıl Mahallesi',
  'Demir Çelik Kampüsü',
  'Bostanbükü',
  'Şirinevler',
  'Aydınlıkevler',
  'Soğuksu',
  'Üniversite Mahallesi',
  'Safranbolu - Emek / Barış Mah.',
  'Diğer Karabük Mahalleleri'
];

export const DELIVERY_PRESET_NOTES = [
  'Yurdun önünde teslim alacağım (gelince arayınız)',
  'Gelince arayın yurdun önüne inerim',
  'Yurt giriş kapısındayım / önündeyim',
  'Yurt güvenliğine / danışmaya bırakabilirsiniz'
];
