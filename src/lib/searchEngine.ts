import { Product } from '@/types';

// ============================================================================
// ÇAĞLA BÜFE & MARKET - AKILLI / SEMANTİK BAKKAL ARAMA MOTORU
// ============================================================================

export interface SemanticIntent {
  id: string;
  triggerWords: string[];
  label: string;
  emoji: string;
  reason: string;
  targetTags: string[];
}

export const SEMANTIC_INTENTS: SemanticIntent[] = [
  {
    id: 'acim',
    triggerWords: [
      'acim', 'aciktim', 'karnim', 'karnim acikti', 'yemek', 'doyur', 'aksam yemegi',
      'oglen', 'oglen yemegi', 'sicak yemek', 'ne yesem', 'hizli yemek', 'hazir yemek'
    ],
    label: 'Pratik Lezzetler (Noodle, Çorba & Makarna)',
    emoji: '🍜',
    reason: 'Karnını hızlıca doyuracak hazır noodle, sıcak çorba ve makarna çeşitleri',
    targetTags: ['noodle', 'corba', 'makarna', 'yulaf', 'fistik'],
  },
  {
    id: 'kahvalti',
    triggerWords: [
      'kahvalti', 'kahvaltilik', 'sabah', 'gunaydin', 'kahvaltiya', 'kahvalti paketi',
      'cay demle', 'sut yulaf'
    ],
    label: 'Çay, Kahve & Bisküvi',
    emoji: '☕',
    reason: 'Güne başlarken çay, kahve, yulaf ve kahvaltılık bisküviler',
    targetTags: ['cay', 'kahve', 'yulaf', 'biskuvi', 'sut', 'kraker'],
  },
  {
    id: 'tatli',
    triggerWords: [
      'tatli', 'canim tatli', 'canim tatli cekti', 'seker', 'tatli krizi', 'sekerim dustu',
      'atistirmalik tatli', 'cikolata', 'kek', 'biskuvi'
    ],
    label: 'Tatlı & Çikolata Krizleri',
    emoji: '🍫',
    reason: 'Canın tatlı çektiğinde kapına gelecek çikolata, kek ve gofretler',
    targetTags: ['cikolata', 'gofret', 'kek', 'biskuvi', 'sekerleme', 'sakiz'],
  },
  {
    id: 'susadim',
    triggerWords: [
      'susadim', 'sohuk', 'soguk', 'hararet', 'icecek', 'su', 'soda', 'ferahla',
      'ferahlat', 'maden suyu', 'mesrubat', 'gazli'
    ],
    label: 'Buz Gibi İçecek & Doğal Maden Suyu',
    emoji: '🧊',
    reason: 'Hararetini alacak soğuk içecekler, meyve suları ve doğal maden suları',
    targetTags: ['su', 'maden suyu', 'soda', 'kola', 'fusetea', 'didi', 'ayran', 'redbull', 'gazoz', 'limonata'],
  },
  {
    id: 'ders',
    triggerWords: [
      'ders', 'vize', 'final', 'sabahlama', 'uykum', 'uykum var', 'enerji',
      'calisirken', 'sinav', 'ders calisma', 'kutuphane', 'uyan', 'uyandir'
    ],
    label: 'Vize & Sınav Sabahlama Paketi',
    emoji: '⚡',
    reason: 'Ders başında uykuyu açacak ve enerji verecek destekler',
    targetTags: ['redbull', 'enerji', 'kahve', 'nescafe', 'cikolata', 'fistik', 'noodle', 'su'],
  },
  {
    id: 'keyif',
    triggerWords: [
      'film', 'dizi', 'mac', 'muhabbet', 'keyif', 'otursak', 'cips kola', 'cekirdek',
      'arkadaslarla', 'sinema', 'netflix', 'cerez'
    ],
    label: 'Film, Dizi & Maç Keyfi Sepeti',
    emoji: '🍿',
    reason: 'Ekrana karşı çıtır çıtır gidecek cips ve kuruyemiş çeşitleri',
    targetTags: ['cips', 'cekirdek', 'findik', 'fistik', 'kola', 'kraker', 'patlayan misir'],
  },
  {
    id: 'bakkal',
    triggerWords: [
      'bakkal', 'temel', 'ev ihtiyac', 'mutfak', 'market', 'evde bitti',
      'pratik market'
    ],
    label: 'Pratik Market & Hazır Mutfak',
    emoji: '🛒',
    reason: 'Noodle, çorba, makarna, ketçap ve şeker gibi temel market ürünleri',
    targetTags: ['noodle', 'corba', 'makarna', 'seker', 'ketcap', 'yulaf', 'su'],
  },
  {
    id: 'hijyen',
    triggerWords: [
      'hijyen', 'temizlik', 'banyo', 'tuvalet', 'dis', 'kisisel', 'dus', 'banyo ihtiyac',
      'mendil', 'pecete', 'sabun'
    ],
    label: 'Kişisel Bakım & Hijyen',
    emoji: '🧼',
    reason: 'Yurt ve ev için gerekli şampuan, duş jeli, ıslak mendil ve temizlik ürünleri',
    targetTags: ['tuvalet kagidi', 'islak mendil', 'sampuan', 'dus jeli', 'dis fircasi', 'ped', 'havlu'],
  },
  {
    id: 'ates',
    triggerWords: [
      'ates', 'cakmak', 'kibrit', 'yakacak', 'sigara', 'cakmagim bitti'
    ],
    label: 'Taşlı Çakmak & Ateş',
    emoji: '🔥',
    reason: 'Çakmak çeşitleri',
    targetTags: ['cakmak'],
  },
];

// --- TÜRKÇE NORMALİZASYON ---
export const normalizeTurkish = (str: string): string => {
  if (!str) return '';
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

// --- LEVENSHTEIN FUZZY MESAFE ---
export const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Fuzzy kelime benzerliği kontrolü (yazım hataları için)
export const isFuzzyMatch = (inputWord: string, targetWord: string): boolean => {
  if (!inputWord || !targetWord) return false;
  if (inputWord === targetWord) return true;

  // Sadece anlamlı uzunluktaki kelimelerde alt kelime kontrolü
  if (inputWord.length >= 3 && targetWord.length >= 3) {
    if (targetWord.includes(inputWord) || inputWord.includes(targetWord)) {
      const minLen = Math.min(inputWord.length, targetWord.length);
      const maxLen = Math.max(inputWord.length, targetWord.length);
      // Kısa olan, uzunun en az %60'ı kadar olmalı (örn: "cikolat" -> "cikolata", "nodil" -> "noodle")
      if (minLen / maxLen >= 0.6) return true;
    }
  }

  // Levenshtein toleransı: Sadece 4+ harfli kelimelerde ve sıkı sınırlarla (1-2 harf hatası)
  if (inputWord.length >= 4 && targetWord.length >= 4) {
    const maxErrors = inputWord.length > 6 ? 2 : 1;
    return levenshteinDistance(inputWord, targetWord) <= maxErrors;
  }
  return false;
};

// --- ARAMA SONUCU TİPİ ---
export interface SmartSearchResult {
  products: Product[];
  relatedProducts: Product[];
  relatedTitle?: string;
  matchedIntent: SemanticIntent | null;
  query: string;
  totalFound: number;
}

// Netflix Tarzı Kategori & Ürün İlgi Haritası
export const RELATED_CATEGORY_MAP: Record<string, { relatedCats: string[]; defaultTitle: string }> = {
  'Yoğurt': {
    relatedCats: ['Normal Süt', 'Ayran', 'Peynir', 'Meyveli Yoğurt'],
    defaultTitle: 'Süt, Peynir & Kahvaltılık Lezzetler',
  },
  'Meyveli Yoğurt': {
    relatedCats: ['Yoğurt', 'Normal Süt', 'Atıştırmalık Bar', 'Meyve Suyu'],
    defaultTitle: 'Meyveli ve Taze Atıştırmalıklar',
  },
  'Soğuk Çay': {
    relatedCats: ['Enerji İçeceği', 'Soğuk Kahve', 'Gazoz', 'Kola', 'Limonata', 'Soda', 'Meyve Suyu'],
    defaultTitle: 'Enerji İçecekleri & Soğuk Lezzetler',
  },
  'Enerji İçeceği': {
    relatedCats: ['Soğuk Çay', 'Soğuk Kahve', 'Kola', 'Gazoz', 'Cips'],
    defaultTitle: 'Buz Gibi İçecekler & Enerji Verenler',
  },
  'Kola': {
    relatedCats: ['Enerji İçeceği', 'Gazoz', 'Soğuk Çay', 'Cips', 'Kraker'],
    defaultTitle: 'Ferahlatıcı İçecekler & Cips Çeşitleri',
  },
  'Gazoz': {
    relatedCats: ['Kola', 'Enerji İçeceği', 'Soğuk Çay', 'Soda', 'Cips'],
    defaultTitle: 'Gazlı İçecekler & Serinletici Tatlar',
  },
  'Soda': {
    relatedCats: ['Gazoz', 'Meyve Suyu', 'Soğuk Çay', 'Enerji İçeceği'],
    defaultTitle: 'Maden Suları & Soğuk İçecekler',
  },
  'Soğuk Kahve': {
    relatedCats: ['Enerji İçeceği', 'Soğuk Çay', 'Kek', 'Bisküvi', 'Çikolata'],
    defaultTitle: 'Enerji Veren İçecekler & Kahve Yanı Tatlılar',
  },
  'Meyve Suyu': {
    relatedCats: ['Soğuk Çay', 'Limonata', 'Soda', 'Kola', 'Bisküvi'],
    defaultTitle: 'Meyveli ve Doğal İçecekler',
  },
  'Çikolata': {
    relatedCats: ['Gofret', 'Bisküvi', 'Kek', 'Şekerleme', 'Atıştırmalık Bar', 'Soğuk Kahve'],
    defaultTitle: 'Gofret, Bisküvi & Tatlı Çeşitleri',
  },
  'Gofret': {
    relatedCats: ['Çikolata', 'Bisküvi', 'Kek', 'Soğuk Kahve'],
    defaultTitle: 'Çikolata & Bisküvi Dünyası',
  },
  'Bisküvi': {
    relatedCats: ['Kek', 'Gofret', 'Çikolata', 'Kraker', 'Dökme Çay'],
    defaultTitle: 'Çay & Kahve Yanı Bisküviler ve Kekler',
  },
  'Kek': {
    relatedCats: ['Bisküvi', 'Çikolata', 'Gofret', 'Soğuk Kahve'],
    defaultTitle: 'Kekler & Çikolata Çeşitleri',
  },
  'Cips': {
    relatedCats: ['Yer Fıstığı', 'Ay Çekirdeği', 'Kraker', 'Kola', 'Gazoz', 'Enerji İçeceği'],
    defaultTitle: 'Kuruyemiş, Çerez & Gazlı İçecekler',
  },
  'Yer Fıstığı': {
    relatedCats: ['Cips', 'Ay Çekirdeği', 'Kaju', 'Fındık', 'Kola', 'Gazoz'],
    defaultTitle: 'Cips & Çerez Eşlikçileri',
  },
  'Ay Çekirdeği': {
    relatedCats: ['Yer Fıstığı', 'Cips', 'Kola', 'Gazoz', 'Soda'],
    defaultTitle: 'Çerez & Soğuk İçecekler',
  },
  'Hazır Noodle': {
    relatedCats: ['Hazır Çorba', 'Makarna', 'Ketçap', 'İçecek', 'Kola'],
    defaultTitle: 'Pratik Yemekler & Çorbalar',
  },
  'Hazır Çorba': {
    relatedCats: ['Hazır Noodle', 'Makarna', 'Ekmek'],
    defaultTitle: 'Sıcak ve Pratik Lezzetler',
  },
};

// --- AKILLI ARAMA ÇEKİRDEĞİ ---
export const smartSearchProducts = (query: string, allProducts: Product[]): SmartSearchResult => {
  const cleanQuery = normalizeTurkish(query);
  if (!cleanQuery) {
    return {
      products: allProducts,
      relatedProducts: [],
      matchedIntent: null,
      query: '',
      totalFound: allProducts.length,
    };
  }

  const queryWords = cleanQuery.split(' ').filter((w) => w.length > 0);

  // 1. Niyet (Semantic Intent) Tespiti
  let matchedIntent: SemanticIntent | null = null;
  for (const intent of SEMANTIC_INTENTS) {
    const hasTrigger = intent.triggerWords.some((trigger) => {
      const normTrigger = normalizeTurkish(trigger);
      return cleanQuery.includes(normTrigger) || queryWords.some((qw) => isFuzzyMatch(qw, normTrigger));
    });
    if (hasTrigger) {
      matchedIntent = intent;
      break;
    }
  }

  // 2. Doğrudan Eşleşme Puanlama Motoru
  const scoredProducts: { product: Product; score: number }[] = [];

  for (const product of allProducts) {
    let score = 0;
    const normName = normalizeTurkish(product.name);
    const normDesc = normalizeTurkish(product.description || '');
    const normUnit = normalizeTurkish(product.unit || '');
    const keywords = (product.searchKeywords || []).map((k) => normalizeTurkish(k));
    const nameWords = normName.split(' ');

    const normBrand = normalizeTurkish(product.brand || '');
    const normCategory = normalizeTurkish(product.category || '');

    // (A) Barkod & Tam / Ön Ek Eşleşme
    if (product.barcode && product.barcode.includes(cleanQuery)) {
      score += 150;
    }
    if (normName === cleanQuery) {
      score += 120;
    } else if (normName.startsWith(cleanQuery)) {
      score += 90;
    } else if (normName.includes(cleanQuery)) {
      score += 70;
    }

    if (normBrand && (normBrand === cleanQuery || normBrand.startsWith(cleanQuery))) {
      score += 85;
    } else if (normBrand.includes(cleanQuery)) {
      score += 60;
    }

    if (normCategory && (normCategory === cleanQuery || normCategory.includes(cleanQuery))) {
      score += 65;
    }

    // (B) Kelime Bazlı İnceleme
    for (const qWord of queryWords) {
      // Marka kelimesi
      if (normBrand && (normBrand === qWord || normBrand.includes(qWord))) {
        score += 45;
      }

      // Kategori kelimesi
      if (normCategory && (normCategory === qWord || normCategory.includes(qWord))) {
        score += 35;
      }

      // İsim kelimeleri
      for (const nWord of nameWords) {
        if (nWord === qWord) {
          score += 50;
        } else if (nWord.startsWith(qWord)) {
          score += 35;
        } else if (isFuzzyMatch(qWord, nWord)) {
          score += 25; // Yazım hatası toleransı (nodıl -> noodle vb.)
        }
      }

      // Anahtar kelimeler
      for (const kw of keywords) {
        if (kw === qWord || kw.includes(qWord)) {
          score += 30;
        } else if (isFuzzyMatch(qWord, kw)) {
          score += 20;
        }
      }

      // Açıklama veya birim
      if (normDesc.includes(qWord)) {
        score += 15;
      }
      if (normUnit.includes(qWord)) {
        score += 10;
      }
    }

    // (C) Semantik Niyet Eşleşmesi
    if (matchedIntent) {
      const matchesIntentTag = matchedIntent.targetTags.some((tag) => {
        const normTag = normalizeTurkish(tag);
        return normName.includes(normTag) || keywords.some((k) => k.includes(normTag)) || normDesc.includes(normTag);
      });
      if (matchesIntentTag) {
        score += 45;
      }
    }

    if (score > 0) {
      scoredProducts.push({ product, score });
    }
  }

  // Skorlara göre sırala
  scoredProducts.sort((a, b) => b.score - a.score);
  const directMatches = scoredProducts.map((sp) => sp.product);

  // 3. NETFLIX TARZI İLGİLİ ÜRÜN ÖNERİ MOTORU
  // Doğrudan eşleşen ürünlerin kategorilerini ve niyetlerini analiz et
  const directIds = new Set(directMatches.map((p) => p.id));
  const directCategories = Array.from(new Set(directMatches.map((p) => p.category).filter(Boolean)));

  // İlgili hedef kategorileri belirle
  const targetRelatedCategories = new Set<string>();
  let customTitle: string | undefined = undefined;

  for (const cat of directCategories) {
    const config = RELATED_CATEGORY_MAP[cat];
    if (config) {
      config.relatedCats.forEach((rc) => targetRelatedCategories.add(rc));
      if (!customTitle) customTitle = `"${query}" ile İlgili ${config.defaultTitle}`;
    }
  }

  // Eğer doğrudan eşleşme yoksa (örneğin "fusetea" yerine "fuse" yazıldı ama doğrudan kategori eşleşmedi)
  // veya genel içecek/atıştırmalık aramasıysa akıllı fallback
  if (targetRelatedCategories.size === 0) {
    if (cleanQuery.includes('tea') || cleanQuery.includes('cay') || cleanQuery.includes('soguk') || cleanQuery.includes('icecek')) {
      ['Enerji İçeceği', 'Soğuk Çay', 'Kola', 'Gazoz', 'Soğuk Kahve'].forEach((rc) => targetRelatedCategories.add(rc));
      customTitle = `"${query}" ile İlgili Enerji İçecekleri & Soğuk Lezzetler`;
    } else if (cleanQuery.includes('cips') || cleanQuery.includes('atistir') || cleanQuery.includes('cerez')) {
      ['Cips', 'Yer Fıstığı', 'Ay Çekirdeği', 'Kraker', 'Enerji İçeceği'].forEach((rc) => targetRelatedCategories.add(rc));
      customTitle = `"${query}" ile İlgili Çerezler & İçecekler`;
    } else if (cleanQuery.includes('tatli') || cleanQuery.includes('cikolata') || cleanQuery.includes('seker')) {
      ['Çikolata', 'Gofret', 'Bisküvi', 'Kek'].forEach((rc) => targetRelatedCategories.add(rc));
      customTitle = `"${query}" ile İlgili Çikolata & Tatlı Çeşitleri`;
    }
  }

  // Netflix tarzı önerileri topla (farklı markalardan ve popüler ürünlerden çeşitlendirerek)
  const relatedProducts: Product[] = [];
  const chosenBrands = new Set<string>();

  for (const cat of targetRelatedCategories) {
    const candidates = allProducts.filter((p) => p.category === cat && !directIds.has(p.id) && p.isAvailable);
    for (const c of candidates) {
      if (!c.brand || !chosenBrands.has(c.brand) || relatedProducts.length < 4) {
        relatedProducts.push(c);
        if (c.brand) chosenBrands.add(c.brand);
      }
      if (relatedProducts.length >= 8) break;
    }
    if (relatedProducts.length >= 8) break;
  }

  // Eğer hala 8'den azsa, ilgili kategorilerden herhangi bir ürünü ekle
  if (relatedProducts.length < 8 && targetRelatedCategories.size > 0) {
    for (const cat of targetRelatedCategories) {
      const candidates = allProducts.filter(
        (p) => p.category === cat && !directIds.has(p.id) && !relatedProducts.some((r) => r.id === p.id) && p.isAvailable
      );
      for (const c of candidates) {
        relatedProducts.push(c);
        if (relatedProducts.length >= 8) break;
      }
      if (relatedProducts.length >= 8) break;
    }
  }

  return {
    products: directMatches,
    relatedProducts,
    relatedTitle: customTitle || `"${query}" ile İlgili Önerilen Popüler Seçenekler`,
    matchedIntent,
    query,
    totalFound: directMatches.length,
  };
};

// ============================================================================
// ÇAĞLA BÜFE - AKILLI ÜRÜN & KATEGORİ EŞLEŞTİRME (ÇEŞNİ / AROMA AYIRIMI)
// ============================================================================
export const FLAVOR_CATEGORY_EXCLUSIONS: Record<string, string[]> = {
  yogurt: ['cips', 'kraker', 'biskuvi', 'sekerleme', 'atistirmalik', 'sos'],
  peynir: ['cips', 'kraker', 'biskuvi', 'makarna'],
  sut: ['cikolata', 'gofret', 'biskuvi', 'kek', 'sekerleme', 'dondurma'],
  kola: ['sekerleme', 'sakiz', 'dondurma', 'tatli'],
  kahve: ['cikolata', 'biskuvi', 'gofret', 'kek', 'sekerleme'],
  findik: ['cikolata', 'gofret', 'biskuvi', 'kek'],
  fistik: ['cikolata', 'gofret', 'biskuvi', 'kek'],
  limon: ['soda', 'gazoz', 'deterjan', 'temizlik', 'kek', 'biskuvi'],
  cilek: ['sut', 'sakiz', 'sekerleme', 'gofret', 'biskuvi', 'soda'],
  muz: ['sut', 'gofret', 'biskuvi', 'kek'],
};

export const smartMatchProducts = <
  T extends {
    id: string;
    name: string;
    category?: string;
    brand?: string;
    barcode?: string;
    isAvailable?: boolean;
    price?: number;
  }
>(
  allProducts: T[],
  rawQuery: string
): T[] => {
  const normQ = normalizeTurkish(rawQuery);
  if (!normQ) return [];

  // Stop words to clean if user sent phrase like "yoğurt fiyatını 200 TL yap"
  const stopWords = new Set([
    'fiyatini', 'fiyati', 'fiyat', 'yap', 'et', 'guncelle', 'kac', 'tl', 'lira', 'kurus',
    'urunu', 'urun', 've', 'ile', 'icin', 'olan', 'bir', 'adet', 'tane', 'getir', 'ver',
    'goster', 'listele', 'al', 'stok', 'stokta', 'stoktan', 'kaldir', 'kapat', 'ac',
    'satista', 'tukendi', 'son', 'yeni', 'lutfen', 'cagla', 'bufe', 'market', 'selam',
    'merhaba', 'usta', 'kardes', 'abi', 'bize', 'bana', 'bunu', 'su'
  ]);

  const rawWords = normQ.split(' ').filter((w) => w.length >= 2);
  const cleanWords = rawWords.filter((w) => !stopWords.has(w) && !/^\d+$/.test(w));
  const effectiveQuery = cleanWords.length > 0 ? cleanWords.join(' ') : normQ;
  const qWords = effectiveQuery.split(' ').filter((w) => w.length > 0);

  // 1. Direct ID / Barcode match
  const directMatch = allProducts.find(
    (p) => p.id === rawQuery || (p.barcode && p.barcode.trim() === rawQuery.trim())
  );
  if (directMatch) return [directMatch];

  // 2. Exact full name match
  const exactName = allProducts.find((p) => normalizeTurkish(p.name) === effectiveQuery);
  if (exactName) return [exactName];

  // 3. Find candidate products that match the query
  let candidates = allProducts.filter((p) => {
    const normName = normalizeTurkish(p.name || '');
    const normCat = normalizeTurkish(p.category || '');
    const normBrand = normalizeTurkish(p.brand || '');
    return (
      normName.includes(effectiveQuery) ||
      normCat.includes(effectiveQuery) ||
      (qWords.length > 0 &&
        qWords.every((qw) => normName.includes(qw) || normCat.includes(qw) || normBrand.includes(qw)))
    );
  });

  // 4. Primary Category Filtering (Avoid flavor matches like 'Yoğurtlu Cips' when searching 'yoğurt')
  for (const [keyWord, excludedCats] of Object.entries(FLAVOR_CATEGORY_EXCLUSIONS)) {
    if (qWords.includes(keyWord) || effectiveQuery === keyWord) {
      const userAskedForExcluded = excludedCats.some((cat) => effectiveQuery.includes(cat));
      if (!userAskedForExcluded) {
        const primaryMatches = candidates.filter((p) => {
          const cat = normalizeTurkish(p.category || '');
          const isExcluded = excludedCats.some((ex) => cat.includes(ex));
          return !isExcluded;
        });

        if (primaryMatches.length > 0) {
          candidates = primaryMatches;
        }
      }
    }
  }

  // 5. Rank candidates:
  // - Category exactly matching keyword comes first
  // - Name starting with keyword comes next
  // - Purest / shortest name comes next
  candidates.sort((a, b) => {
    const aName = normalizeTurkish(a.name);
    const bName = normalizeTurkish(b.name);
    const aCat = normalizeTurkish(a.category || '');
    const bCat = normalizeTurkish(b.category || '');

    const aCatExact = aCat === effectiveQuery || aCat.startsWith(effectiveQuery);
    const bCatExact = bCat === effectiveQuery || bCat.startsWith(effectiveQuery);
    if (aCatExact && !bCatExact) return -1;
    if (!aCatExact && bCatExact) return 1;

    const aNameStarts = aName.startsWith(effectiveQuery);
    const bNameStarts = bName.startsWith(effectiveQuery);
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;

    return aName.length - bName.length;
  });

  return candidates;
};

