import { Campaign } from '@/types';
import { Locale } from '@/lib/i18n';

/**
 * Handles multi-lingual translation for campaigns, combo menus, banner slogans,
 * and announcements while strictly preserving Turkish proper nouns
 * (e.g., 'Çağla Büfe', 'Karabük', 'Safranbolu', 'Bostanbükü', '100. Yıl', 'KYK Hubbi Hatun',
 * and product brand names like 'Ülker', 'Eti', 'Red Bull', 'Biskrem', 'Ayvalık Tostu').
 */

// Common Turkish campaign phrases to regex patterns and translations
export function translateCampaignTitle(title: string, locale: Locale, campaignType?: string): string {
  if (!title || locale === 'tr') return title;

  const t = title.trim();

  // Pattern 1: Fixed discount (e.g. "100 TL İndirim", "50 TL İndirim Kampanyası")
  const fixedMatch = t.match(/^(\d+(?:\.\d+)?)\s*(?:TL|₺)\s*(?:İndirim|İndirimi|Kampanyası)?/i);
  if (fixedMatch) {
    const val = fixedMatch[1];
    switch (locale) {
      case 'en': return `${val} TL Discount`;
      case 'ru': return `Скидка ${val} TL`;
      case 'ar': return `خصم ${val} ليرة`;
      case 'fr': return `Réduction de ${val} TL`;
    }
  }

  // Pattern 2: Percentage discount (e.g. "%20 İndirim", "%15 Öğrenci İndirimi")
  const pctMatch = t.match(/^%(\d+)\s*(.*)/i);
  if (pctMatch) {
    const pct = pctMatch[1];
    switch (locale) {
      case 'en': return `${pct}% Discount`;
      case 'ru': return `Скидка ${pct}%`;
      case 'ar': return `خصم ${pct}%`;
      case 'fr': return `Réduction de ${pct}%`;
    }
  }

  // Pattern 3: Free delivery
  if (/ücretsiz\s*teslimat/i.test(t)) {
    switch (locale) {
      case 'en': return 'Free Delivery Campaign';
      case 'ru': return 'Бесплатная доставка';
      case 'ar': return 'عرض التوصيل المجاني';
      case 'fr': return 'Offre Livraison Gratuite';
    }
  }

  // Pattern 4: Student discount
  if (/öğrenci/i.test(t)) {
    switch (locale) {
      case 'en': return 'Student Special Discount';
      case 'ru': return 'Студенческая скидка';
      case 'ar': return 'خصم خاص للطلاب';
      case 'fr': return 'Réduction Spéciale Étudiant';
    }
  }

  // Pattern 5: Bundle / Combo products (e.g. "Biskrem ... + Çikolata ...")
  // The product names are proper nouns and stay Turkish, but if it has combo prefix or type:
  if (campaignType === 'bundle' || t.includes('+')) {
    switch (locale) {
      case 'en': return `Combo Deal: ${t}`;
      case 'ru': return `Комбо набор: ${t}`;
      case 'ar': return `باقة كومبو: ${t}`;
      case 'fr': return `Menu Combo : ${t}`;
    }
  }

  // Generic fallback: if campaignType is provided
  if (campaignType === 'fixed_discount') {
    switch (locale) {
      case 'en': return 'Special Discount Campaign';
      case 'ru': return 'Специальная акция со скидкой';
      case 'ar': return 'حملة خصم خاصة';
      case 'fr': return 'Campagne de réduction spéciale';
    }
  }

  return title;
}

export function translateCampaignDescription(
  desc: string | undefined | null,
  locale: Locale,
  campaign?: Partial<Campaign>
): string {
  if (!desc || locale === 'tr') return desc || '';

  const d = desc.trim();

  // Pattern 1: "Özel Kombin Fiyatı! Normalde ₺238.00 yerine sadece ₺200.00"
  const comboPriceMatch = d.match(/Özel Kombin Fiyatı!\s*Normalde\s*₺?(\d+(?:\.\d+)?)\s*yerine sadece\s*₺?(\d+(?:\.\d+)?)/i);
  if (comboPriceMatch) {
    const orig = comboPriceMatch[1];
    const final = comboPriceMatch[2];
    switch (locale) {
      case 'en': return `Special Combo Price! Only ₺${final} instead of ₺${orig}`;
      case 'ru': return `Специальная цена за комбо! Всего ₺${final} вместо ₺${orig}`;
      case 'ar': return `سعر العرض المميز! فقط ₺${final} بدلاً من ₺${orig}`;
      case 'fr': return `Prix combo spécial ! Seulement ₺${final} au lieu de ₺${orig}`;
    }
  }

  // Pattern 2: "600 TL ve üzeri siparişlerde 100 TL indirim uygulanır."
  const minValMatch = d.match(/(\d+(?:\.\d+)?)\s*(?:TL|₺)\s*ve üzeri siparişlerde\s*(\d+(?:\.\d+)?)\s*(?:TL|₺)\s*indirim/i);
  if (minValMatch) {
    const min = minValMatch[1];
    const val = minValMatch[2];
    switch (locale) {
      case 'en': return `${val} TL discount on orders of ${min} TL and above.`;
      case 'ru': return `Скидка ${val} TL на заказы от ${min} TL.`;
      case 'ar': return `خصم ${val} ليرة على الطلبات بقيمة ${min} ليرة فأكثر.`;
      case 'fr': return `Réduction de ${val} TL sur les commandes de ${min} TL et plus.`;
    }
  }

  // Pattern 3: "600 TL ve üzeri siparişlerde %20 indirim uygulanır."
  const minPctMatch = d.match(/(\d+(?:\.\d+)?)\s*(?:TL|₺)\s*ve üzeri siparişlerde\s*%(\d+)\s*indirim/i);
  if (minPctMatch) {
    const min = minPctMatch[1];
    const pct = minPctMatch[2];
    switch (locale) {
      case 'en': return `${pct}% discount on orders of ${min} TL and above.`;
      case 'ru': return `Скидка ${pct}% на заказы от ${min} TL.`;
      case 'ar': return `خصم ${pct}% على الطلبات بقيمة ${min} ليرة فأكثر.`;
      case 'fr': return `Réduction de ${pct}% sur les commandes de ${min} TL et plus.`;
    }
  }

  // Pattern 4: "X TL ve üzeri siparişlerde teslimat ücretsiz"
  const freeDelMatch = d.match(/(\d+(?:\.\d+)?)\s*(?:TL|₺)\s*ve üzeri siparişlerde\s*teslimat\s*ücretsiz/i);
  if (freeDelMatch) {
    const min = freeDelMatch[1];
    switch (locale) {
      case 'en': return `Free delivery on orders of ${min} TL and above!`;
      case 'ru': return `Бесплатная доставка при заказе от ${min} TL!`;
      case 'ar': return `توصيل مجاني للطلبات بقيمة ${min} ليرة فأكثر!`;
      case 'fr': return `Livraison gratuite sur les commandes de ${min} TL et plus !`;
    }
  }

  // Pattern 5: "Sepette kombin menü kampanyası uygulandı. Kampanyalar birleştirilemez."
  if (/kombin menü kampanyası uygulandı/i.test(d)) {
    switch (locale) {
      case 'en': return 'Combo deal applied to cart. Campaigns cannot be combined.';
      case 'ru': return 'Комбо-меню применено в корзине. Акции не суммируются.';
      case 'ar': return 'تم تطبيق عرض الكومبو في السلة. لا يمكن دمج العروض.';
      case 'fr': return 'Offre combo appliquée au panier. Offres non cumulables.';
    }
  }

  return desc;
}

export function translateBundleBadge(badge: string | undefined, locale: Locale): string {
  if (locale === 'tr' || !badge) return badge || '🔥 Süper Fırsat';

  if (badge.includes('Süper Fırsat') || badge.includes('Fırsat')) {
    switch (locale) {
      case 'en': return '🔥 Super Deal';
      case 'ru': return '🔥 Супер выгода';
      case 'ar': return '🔥 عرض ممتاز';
      case 'fr': return '🔥 Super Offre';
    }
  }

  if (badge.includes('Popüler') || badge.includes('Çok Satan')) {
    switch (locale) {
      case 'en': return '⭐ Best Seller';
      case 'ru': return '⭐ Хит продаж';
      case 'ar': return '⭐ الأكثر طلباً';
      case 'fr': return '⭐ Meilleure Vente';
    }
  }

  if (badge.includes('Kantin') || badge.includes('Menü')) {
    switch (locale) {
      case 'en': return '🍱 Combo Menu';
      case 'ru': return '🍱 Комбо меню';
      case 'ar': return '🍱 باقة منوعة';
      case 'fr': return '🍱 Menu Combo';
    }
  }

  return badge;
}

/**
 * Announcement text: Preserves Karabük proper names:
 * 'Bostanbükü', '100. Yıl', 'KYK Yurtları', 'Karabük'
 */
export function translateAnnouncement(text: string, locale: Locale): string {
  if (!text || locale === 'tr') return text;

  // Standard Çağla Büfe announcement
  if (text.includes('Bostanbükü') && text.includes('KYK Yurtları')) {
    switch (locale) {
      case 'en':
        return '🛵 Fast delivery to Bostanbükü, 100. Yıl, KYK Dorms and across Karabük! Cold drinks, snacks & groceries at your door.';
      case 'ru':
        return '🛵 Быстрая доставка в Бостанбюкю, 100. Yıl, общежития KYK и по всему Карабюку! Холодные напитки, снеки и маркет у вашей двери.';
      case 'ar':
        return '🛵 توصيل سريع إلى بوستان بوكو، 100. Yıl، وسكنات KYK وجميع أنحاء كارابوك! مشروبات باردة، وجبات خفيفة ومستلزمات الماركت عند بابك.';
      case 'fr':
        return '🛵 Livraison rapide à Bostanbükü, 100. Yıl, résidences KYK et partout à Karabük ! Boissons fraîches, snacks et épicerie à votre porte.';
    }
  }

  return text;
}

/**
 * Store hours bar translation:
 * 'Şu An Açığız • 03:00'e kadar Karabük 100. Yıl & KYK Yurtlarına hızlı teslimat'
 */
export function translateStoreHoursBar(storeCloseTime: string, locale: Locale): { text: string; hoursLabel: string } {
  switch (locale) {
    case 'en':
      return {
        text: `Open Now • Fast delivery to Karabük 100. Yıl & KYK Dorms until ${storeCloseTime}`,
        hoursLabel: 'Hours ➔',
      };
    case 'ru':
      return {
        text: `Открыто сейчас • Быстрая доставка в Karabük 100. Yıl и общежития KYK до ${storeCloseTime}`,
        hoursLabel: 'График ➔',
      };
    case 'ar':
      return {
        text: `مفتوح الآن • توصيل سريع إلى Karabük 100. Yıl وسكنات KYK حتى ${storeCloseTime}`,
        hoursLabel: 'المواعيد ➔',
      };
    case 'fr':
      return {
        text: `Ouvert actuellement • Livraison rapide à Karabük 100. Yıl & résidences KYK jusqu'à ${storeCloseTime}`,
        hoursLabel: 'Horaires ➔',
      };
    case 'tr':
    default:
      return {
        text: `Şu An Açığız • ${storeCloseTime}'e kadar Karabük 100. Yıl & KYK Yurtlarına hızlı teslimat`,
        hoursLabel: 'Saatler ➔',
      };
  }
}
