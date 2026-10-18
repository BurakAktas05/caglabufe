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
      'oglen', 'oglen yemegi', 'sicak yemek', 'ne yesem', 'hizli yemek'
    ],
    label: 'Doyurucu Sıcak & Pratik Yemekler',
    emoji: '🥪',
    reason: 'Karnını hızlıca doyuracak tost, sandviç ve bakkal ürünleri',
    targetTags: ['tost', 'sandvic', 'noodle', 'ton balik', 'patates', 'makarna', 'corba', 'ekmek', 'kasar'],
  },
  {
    id: 'kahvalti',
    triggerWords: [
      'kahvalti', 'kahvaltilik', 'sabah', 'gunaydin', 'kahvaltiya', 'kahvalti paketi',
      'peynir ekmek', 'cay demle', 'sut yumurta'
    ],
    label: 'Kahvaltılık Bakkal Sepeti',
    emoji: '🍳',
    reason: 'Sabah güne enerjik başlamak için taze kahvaltılıklar',
    targetTags: ['ekmek', 'yumurta', 'peynir', 'kasar', 'sut', 'cay', 'zeytin', 'tereyag', 'bazlama', 'tost'],
  },
  {
    id: 'tatli',
    triggerWords: [
      'tatli', 'canim tatli', 'canim tatli cekti', 'seker', 'tatli krizi', 'sekerim dustu',
      'atistirmalik tatli', 'cikolata', 'kek', 'biskuvi'
    ],
    label: 'Tatlı & Çikolata Krizleri',
    emoji: '🍫',
    reason: 'Canın tatlı çektiğinde kapına gelecek lezzetler',
    targetTags: ['cikolata', 'gofret', 'browni', 'kek', 'biskrem', 'halley', 'tutku', 'sut'],
  },
  {
    id: 'susadim',
    triggerWords: [
      'susadim', 'sohuk', 'soguk', 'hararet', 'icecek', 'su', 'soda', 'ferahla',
      'ferahlat', 'maden suyu', 'mesrubat', 'gazli'
    ],
    label: 'Buz Gibi İçecek & Doğal Maden Suyu',
    emoji: '🧊',
    reason: 'Hararetini alacak soğuk içecekler ve doğal kaynak suları',
    targetTags: ['su', 'maden suyu', 'soda', 'kola', 'fusetea', 'didi', 'ayran', 'redbull', 'coca cola', 'icecek'],
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
    targetTags: ['redbull', 'kahve', 'nescafe', 'bitter', 'cikolata', 'fistik', 'noodle', 'su'],
  },
  {
    id: 'keyif',
    triggerWords: [
      'film', 'dizi', 'mac', 'muhabbet', 'keyif', 'otursak', 'cips kola', 'cekirdek',
      'arkadaslarla', 'sinema', 'netflix', 'cerez'
    ],
    label: 'Film, Dizi & Maç Keyfi Sepeti',
    emoji: '🍿',
    reason: 'Ekrana karşı çıtır çıtır gidecek atıştırmalıklar',
    targetTags: ['cips', 'cekirdek', 'findik', 'fistik', 'kola', 'doritos', 'ruffles', 'lays', 'biskuvi'],
  },
  {
    id: 'bakkal',
    triggerWords: [
      'bakkal', 'temel', 'ev ihtiyac', 'mutfak', 'yag seker', 'market', 'evde bitti',
      'yemek yapma', 'yemeklik'
    ],
    label: 'Temel Mahalle Bakkalı Sepeti',
    emoji: '🛒',
    reason: 'Mutfakta eksik kalmasın: Ekmek, süt, yumurta, yağ ve makarna',
    targetTags: ['ekmek', 'sut', 'yumurta', 'yag', 'seker', 'makarna', 'salca', 'un', 'cay', 'su'],
  },
  {
    id: 'hijyen',
    triggerWords: [
      'hijyen', 'temizlik', 'banyo', 'tuvalet', 'dis', 'kisisel', 'dus', 'banyo ihtiyac',
      'mendil', 'pecete', 'sabun'
    ],
    label: 'Kişisel Bakım & Ev İhtiyaçları',
    emoji: '🧼',
    reason: 'Yurt ve ev için gerekli temizlik ve kişisel bakım ürünleri',
    targetTags: ['tuvalet kagidi', 'islak mendil', 'sampuan', 'dis macunu', 'cop torbasi', 'sabun', 'pil'],
  },
  {
    id: 'ates',
    triggerWords: [
      'ates', 'cakmak', 'kibrit', 'yakacak', 'sigara', 'cakmagim bitti'
    ],
    label: 'Taşlı Çakmak & Ateş',
    emoji: '🔥',
    reason: 'Acil çakmak ve ateş ihtiyaçları',
    targetTags: ['cakmak', 'tokai', 'kibrit'],
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
  if (inputWord === targetWord) return true;
  if (targetWord.includes(inputWord) || inputWord.includes(targetWord)) return true;
  if (inputWord.length >= 3 && targetWord.length >= 3) {
    const maxErrors = inputWord.length > 5 ? 2 : 1;
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
