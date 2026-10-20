import { Product, CartItem } from '@/types';
import { Locale } from './i18n';

export interface SmartUpsellResult {
  title: string;
  badge: string;
  scenario: string;
  items: Product[];
}

export type ProductSubtype =
  | 'ayran'
  | 'cola'
  | 'mineral_water'
  | 'iced_tea'
  | 'energy_drink'
  | 'cold_coffee'
  | 'gazoz'
  | 'juice'
  | 'milk'
  | 'water'
  | 'hot_drink'
  | 'food'
  | 'chips_nuts'
  | 'cracker'
  | 'chocolate'
  | 'wafer'
  | 'cake'
  | 'biscuit'
  | 'sweet'
  | 'gum'
  | 'non_consumable'
  | 'other';

interface ScenarioCopy {
  title: Record<Locale, string>;
  badge: Record<Locale, string>;
}

const SCENARIO_COPY: Record<string, ScenarioCopy> = {
  food_no_drink: {
    title: {
      tr: 'Tost & Yemeğin Yanına Buz Gibi İçecekler',
      en: 'Ice-Cold Drinks to Pair with Your Meal',
      ru: 'Ледяные напитки к еде и тостам',
      ar: 'مشروبات باردة منعشة مع وجبتك',
      fr: 'Boissons fraîches pour votre repas',
    },
    badge: {
      tr: 'Tamamlayıcı İçecek',
      en: 'Complementary Drink',
      ru: 'Освежающий напиток',
      ar: 'مشروب مكمل',
      fr: 'Boisson idéale',
    },
  },
  hot_drink_no_sweet: {
    title: {
      tr: 'Kahve & Çayın Yanına Çok Yakışacaklar',
      en: 'Sweet Treats & Snacks for Coffee & Tea',
      ru: 'Идеальные сладости к кофе и чаю',
      ar: 'حلويات ومقرمشات مع القهوة والشاي',
      fr: 'Douceurs & biscuits pour le café et thé',
    },
    badge: {
      tr: 'Tatlı Eşleşme',
      en: 'Sweet Pairing',
      ru: 'Сладкая пара',
      ar: 'ثنائي مثالي',
      fr: 'Accord parfait',
    },
  },
  chips_no_drink: {
    title: {
      tr: 'Cips & Çerez Keyfine Buz Gibi İçecek',
      en: 'Ice-Cold Drinks for Your Chips & Snacks',
      ru: 'Ледяной напиток к чипсам и снекам',
      ar: 'مشروب بارد مع الشيبس والمقرمشات',
      fr: 'Boisson fraîche pour vos chips et snacks',
    },
    badge: {
      tr: 'Film & Dizi Keyfi',
      en: 'Movie & Chill',
      ru: 'Для фильма',
      ar: 'سهرة ممتعة',
      fr: 'Pause film',
    },
  },
  complete_meal: {
    title: {
      tr: 'Yemeğin Üstüne Nefis Bir Kapanış',
      en: 'A Delicious Sweet Finish to Your Meal',
      ru: 'Вкусный сладкий десерт после еды',
      ar: 'تحلية لذيذة ومميزة بعد وجبتك',
      fr: 'Une délicieuse touche sucrée pour finir',
    },
    badge: {
      tr: 'Tatlı Kapanış',
      en: 'Sweet Ending',
      ru: 'Десерт',
      ar: 'تحلية',
      fr: 'Dessert',
    },
  },
  sweet_no_drink: {
    title: {
      tr: 'Tatlının Yanına Ferahlatıcı İçecek',
      en: 'Refreshing Drink to Balance the Sweet',
      ru: 'Освежающий напиток к сладостям',
      ar: 'مشروب منعش يوازن حلاوة التحلية',
      fr: 'Boisson rafraîchissante pour vos douceurs',
    },
    badge: {
      tr: 'Ferahlatıcı',
      en: 'Refreshing',
      ru: 'Освежение',
      ar: 'انتعاش',
      fr: 'Rafraîchissant',
    },
  },
  drink_only: {
    title: {
      tr: 'İçeceğinin Yanına Çıtır Atıştırmalıklar',
      en: 'Crispy Snacks to Pair with Your Drink',
      ru: 'Хрустящие снеки к вашему напитку',
      ar: 'مقرمشات مقرمشة ولذيذة مع مشروبك',
      fr: 'Encas croustillants pour votre boisson',
    },
    badge: {
      tr: 'Çıtır Keyif',
      en: 'Crispy Snack',
      ru: 'Хрустящий перекус',
      ar: 'سناك مقرمش',
      fr: 'Pause croquante',
    },
  },
  default: {
    title: {
      tr: 'Yanına Çok İyi Gider (Hızlı Ekle)',
      en: 'Frequently Added Together (Quick Add)',
      ru: 'Отлично подойдет к корзине',
      ar: 'يضاف كثيراً مع طلبك (إضافة سريعة)',
      fr: 'Idéal avec votre panier (Ajout rapide)',
    },
    badge: {
      tr: 'Müdavim Favorileri',
      en: 'Campus Favorites',
      ru: 'Хиты продаж',
      ar: 'الأكثر طلباً',
      fr: 'Favoris',
    },
  },
};

/**
 * Classifies a product into a refined taxonomy subtype.
 * Strictly prevents false positives (e.g. "çikolata" matching "kola", "deterjan" matching "su").
 */
export function classifyProduct(p: Product): ProductSubtype {
  const cat = (p.category || '').toLowerCase().trim();
  const name = (p.name || '').toLowerCase().trim();

  // 1. Non-consumable filter: Never upsell cleaning, hygiene or household items next to food!
  if (
    cat.includes('deterjan') ||
    cat.includes('şampuan') ||
    cat.includes('sabun') ||
    cat.includes('tuvalet') ||
    cat.includes('havlu') ||
    cat.includes('peçete') ||
    cat.includes('mendil') ||
    cat.includes('çamaşır') ||
    cat.includes('diş') ||
    cat.includes('tıraş') ||
    cat.includes('pil') ||
    cat.includes('çakmak') ||
    cat.includes('kedi') ||
    cat.includes('sinek') ||
    name.includes('deterjan') ||
    name.includes('çamaşır suyu') ||
    name.includes('şampuan')
  ) {
    return 'non_consumable';
  }

  // 2. Pure Water
  if (
    cat === 'su' ||
    name.startsWith('su ') ||
    name.endsWith(' su') ||
    name === 'su' ||
    name.includes('doğal kaynak suyu')
  ) {
    if (!name.includes('suyu') && !name.includes('deterjan')) {
      return 'water';
    }
  }

  // 3. Ayran
  if (cat === 'ayran' || name.includes('ayran')) {
    return 'ayran';
  }

  // 4. Cold Cola (Avoid "çikolata" and "Biscolata" false substring matches)
  if (cat === 'kola') {
    return 'cola';
  }
  const cleanNameForCola = name.replace(/çikolata\w*|cikolata\w*|biscolata\w*/g, '');
  if (
    cleanNameForCola.includes('kola') ||
    cleanNameForCola.includes('cola') ||
    cleanNameForCola.includes('pepsi')
  ) {
    // Exclude candies/gums with cola flavor
    if (!cat.includes('şeker') && !cat.includes('sakız')) {
      return 'cola';
    }
  }

  // 5. Soda / Mineral Water
  if (cat === 'soda' || name.includes('maden suyu') || name.includes('beypazarı') || name.includes('kızılay')) {
    return 'mineral_water';
  }

  // 6. Gazoz
  if (cat === 'gazoz' || name.includes('gazoz') || name.includes('fruko') || name.includes('çamlıca') || name.includes('sprite')) {
    return 'gazoz';
  }

  // 7. Cold Tea / Iced Tea
  if (cat === 'soğuk çay' || name.includes('fuse') || name.includes('lipton ice') || name.includes('soğuk çay')) {
    return 'iced_tea';
  }

  // 8. Energy Drinks
  if (cat === 'enerji içeceği' || name.includes('enerji') || name.includes('red bull') || name.includes('monster') || name.includes('burn')) {
    return 'energy_drink';
  }

  // 9. Cold Coffee
  if (cat === 'soğuk kahve' || name.includes('obsesso') || name.includes('starbucks') || (name.includes('soğuk') && name.includes('kahve'))) {
    return 'cold_coffee';
  }

  // 10. Fruit Juices / Lemonade
  if (cat === 'meyve suyu' || cat === 'limonata' || name.includes('meyve suyu') || name.includes('limonata') || name.includes('cappy') || name.includes('dimes')) {
    return 'juice';
  }

  // 11. Milk (Flavored or plain)
  if (cat === 'aromalı süt' || cat === 'normal süt' || name.includes('kakaolu süt') || name.includes('çilekli süt') || name.includes('muzlu süt')) {
    return 'milk';
  }

  // 12. Hot Drinks (Coffee, Tea, Hot Chocolate)
  if (
    cat.includes('kahve') ||
    cat.includes('çay') ||
    cat.includes('cay') ||
    cat.includes('sahlep') ||
    cat.includes('sıcak çikolata')
  ) {
    return 'hot_drink';
  }

  // 13. Hot Food / Kitchen / Meals
  if (
    p.isKitchenItem ||
    cat.includes('noodle') ||
    cat.includes('makarna') ||
    cat.includes('hazır yemek') ||
    cat.includes('hazır') ||
    name.includes('tost') ||
    name.includes('sandviç') ||
    name.includes('sandvic') ||
    name.includes('burger') ||
    name.includes('dürüm') ||
    name.includes('pizza') ||
    name.includes('köfte') ||
    name.includes('sosis') ||
    name.includes('patates kızartması')
  ) {
    return 'food';
  }

  // 14. Chips & Nuts
  if (
    cat === 'cips' ||
    cat.includes('çekirdek') ||
    cat.includes('fıstık') ||
    cat.includes('fındık') ||
    cat.includes('badem') ||
    cat.includes('leblebi') ||
    name.includes('doritos') ||
    name.includes('lays') ||
    name.includes('ruffles') ||
    name.includes('çerezza') ||
    name.includes('patos')
  ) {
    return 'chips_nuts';
  }

  // 15. Crackers
  if (cat === 'kraker' || cat === 'çubuk kraker' || name.includes('kraker') || name.includes('crax') || name.includes('çizi')) {
    return 'cracker';
  }

  // 16. Sweets & Confectionery
  if (cat === 'çikolata') return 'chocolate';
  if (cat === 'gofret') return 'wafer';
  if (cat === 'kek') return 'cake';
  if (cat === 'bisküvi') return 'biscuit';
  if (cat === 'şekerleme' || cat === 'sürülebilir çikolata' || cat === 'helva') return 'sweet';

  // 17. Gum
  if (cat === 'sakız' || name.includes('sakız') || name.includes('falım') || name.includes('vivident') || name.includes('mentos')) {
    return 'gum';
  }

  return 'other';
}

/**
 * Calculates impulse appeal and convenience score.
 * Prioritizes single-serve portions (kutu, bardak, 200-330ml), reasonable prices (15-60 TL),
 * and products with verified images.
 */
function getProductImpulseScore(p: Product): number {
  let score = 100;
  const effectivePrice = p.discountPrice ?? p.price;

  // Prime impulse price sweet-spot for university campus (15 TL - 65 TL)
  if (effectivePrice >= 15 && effectivePrice <= 65) {
    score += 25;
  } else if (effectivePrice <= 85) {
    score += 10;
  }

  const name = (p.name || '').toLowerCase();

  // Convenience / Single-serve boost
  if (
    name.includes('kutu') ||
    name.includes('330') ||
    name.includes('250') ||
    name.includes('200') ||
    name.includes('275') ||
    name.includes('285') ||
    name.includes('bardak')
  ) {
    score += 20;
  }

  // Discourage large bulk bottles in quick drawer upsells
  if (name.includes('2.5 lt') || name.includes('2,5 lt') || name.includes('2 lt')) {
    score -= 30;
  }

  // Bonus if valid product image exists
  if (p.imageUrl && p.imageUrl.startsWith('http') && !p.imageUrl.includes('placeholder')) {
    score += 15;
  }

  // Discounted items get an extra highlight
  if (p.discountPrice && p.discountPrice < p.price) {
    score += 10;
  }

  return score;
}

/**
 * Intelligent Complementary Pairing Engine (Yanına İyi Gider)
 *
 * Evaluates the current cart contents and determines the best complementary pairings:
 * 1. Food/Tost/Sandviç without Cold Drink -> Ayran, Kutu Kola, Maden Suyu, Soğuk Çay, Gazoz, Su
 * 2. Hot Coffee/Tea without Sweet -> Gofret, Çikolata, Bisküvi, Kek, Maden Suyu
 * 3. Chips/Nuts without Cold Drink -> Kutu Kola, Soğuk Çay, Enerji İçeceği, Maden Suyu
 * 4. Meal + Drink in cart -> Sweet finish, Digestive Soda, Refreshing Gum
 * 5. Sweets without Drink -> Aromatic Milk, Cold Coffee, Mineral Water, Cold Tea
 * 6. Cold Drink only in cart -> Chips, Chocolate Wafer, Crackers, Biscuit
 * 7. Default / Mixed basket -> Mineral Water, Cold Drinks, Wafer, Campus Favorites
 */
export function getSmartRecommendations(
  cart: CartItem[],
  allProducts: Product[],
  limit = 4,
  locale: Locale = 'tr'
): SmartUpsellResult {
  const validLocale: Locale = ['tr', 'en', 'ru', 'ar', 'fr'].includes(locale) ? locale : 'tr';

  if (!allProducts || allProducts.length === 0) {
    const copy = SCENARIO_COPY.default;
    return {
      title: copy.title[validLocale] || copy.title.tr,
      badge: copy.badge[validLocale] || copy.badge.tr,
      scenario: 'default',
      items: [],
    };
  }

  const cartProductIds = new Set(cart.map((c) => c.product.id));

  // Analyze basket characteristics
  let hasFood = false;
  let hasColdDrink = false;
  let hasHotDrink = false;
  let hasSnack = false;
  let hasSweet = false;

  const coldDrinkTypes: ProductSubtype[] = [
    'ayran',
    'cola',
    'mineral_water',
    'iced_tea',
    'energy_drink',
    'cold_coffee',
    'gazoz',
    'juice',
    'milk',
    'water',
  ];
  const snackTypes: ProductSubtype[] = ['chips_nuts', 'cracker'];
  const sweetTypes: ProductSubtype[] = ['chocolate', 'wafer', 'cake', 'biscuit', 'sweet'];

  for (const item of cart) {
    const subtype = classifyProduct(item.product);
    if (subtype === 'food') hasFood = true;
    if (coldDrinkTypes.includes(subtype)) hasColdDrink = true;
    if (subtype === 'hot_drink') hasHotDrink = true;
    if (snackTypes.includes(subtype)) hasSnack = true;
    if (sweetTypes.includes(subtype)) hasSweet = true;
  }

  // Determine active scenario & target complementary order
  let scenarioKey = 'default';
  let targetOrder: ProductSubtype[] = [];

  if (hasFood && !hasColdDrink) {
    scenarioKey = 'food_no_drink';
    targetOrder = ['ayran', 'cola', 'mineral_water', 'iced_tea', 'gazoz', 'water'];
  } else if (hasHotDrink && !hasSweet) {
    scenarioKey = 'hot_drink_no_sweet';
    targetOrder = ['wafer', 'chocolate', 'biscuit', 'cake', 'mineral_water'];
  } else if (hasSnack && !hasColdDrink) {
    scenarioKey = 'chips_no_drink';
    targetOrder = ['cola', 'iced_tea', 'energy_drink', 'mineral_water', 'gazoz'];
  } else if (hasFood && hasColdDrink && !hasSweet) {
    scenarioKey = 'complete_meal';
    targetOrder = ['chocolate', 'wafer', 'mineral_water', 'cake', 'gum'];
  } else if (hasSweet && !hasColdDrink && !hasHotDrink) {
    scenarioKey = 'sweet_no_drink';
    targetOrder = ['milk', 'cold_coffee', 'mineral_water', 'iced_tea', 'water'];
  } else if (hasColdDrink && !hasFood && !hasSnack && !hasSweet) {
    scenarioKey = 'drink_only';
    targetOrder = ['chips_nuts', 'wafer', 'cracker', 'chocolate', 'biscuit'];
  } else {
    scenarioKey = 'default';
    targetOrder = ['mineral_water', 'water', 'wafer', 'ayran', 'cola', 'chips_nuts'];
  }

  const copy = SCENARIO_COPY[scenarioKey] || SCENARIO_COPY.default;
  const title = copy.title[validLocale] || copy.title.tr;
  const badge = copy.badge[validLocale] || copy.badge.tr;

  // Filter candidates:
  // 1. Available in stock
  // 2. Not already in cart
  // 3. Accessible impulse price (<= 95 TL)
  // 4. Must be consumable (exclude detergents, shampoos, etc.)
  const availableCandidates = allProducts.filter((p) => {
    if (!p.isAvailable) return false;
    if (cartProductIds.has(p.id)) return false;
    const effPrice = p.discountPrice ?? p.price;
    if (effPrice <= 0 || effPrice > 95) return false;
    const type = classifyProduct(p);
    return type !== 'non_consumable' && type !== 'other';
  });

  const picked: Product[] = [];
  const pickedSubtypes = new Set<ProductSubtype>();

  // Helper to pick the best scoring item of a given subtype
  const pickBestOfSubtype = (st: ProductSubtype): Product | null => {
    const matching = availableCandidates.filter((p) => {
      if (picked.some((pk) => pk.id === p.id)) return false;
      return classifyProduct(p) === st;
    });
    if (matching.length === 0) return null;
    matching.sort((a, b) => getProductImpulseScore(b) - getProductImpulseScore(a));
    return matching[0];
  };

  // 1. Match prioritized complementary subtypes (1 distinct item per target type)
  for (const st of targetOrder) {
    if (picked.length >= limit) break;
    const item = pickBestOfSubtype(st);
    if (item) {
      picked.push(item);
      pickedSubtypes.add(st);
    }
  }

  // 2. Fill remainder up to limit with diverse top impulse items
  if (picked.length < limit) {
    // Sort all remaining candidates by impulse score
    const remaining = [...availableCandidates]
      .filter((p) => !picked.some((pk) => pk.id === p.id))
      .sort((a, b) => getProductImpulseScore(b) - getProductImpulseScore(a));

    for (const p of remaining) {
      if (picked.length >= limit) break;
      const type = classifyProduct(p);
      // Diversity rule: favor subtypes not yet picked
      if (!pickedSubtypes.has(type)) {
        picked.push(p);
        pickedSubtypes.add(type);
      }
    }

    // Absolute fallback: if still under limit, fill with any top item
    if (picked.length < limit) {
      for (const p of remaining) {
        if (picked.length >= limit) break;
        if (!picked.some((pk) => pk.id === p.id)) {
          picked.push(p);
        }
      }
    }
  }

  return {
    title,
    badge,
    scenario: scenarioKey,
    items: picked,
  };
}
