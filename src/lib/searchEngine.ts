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
  matchedIntent: SemanticIntent | null;
  query: string;
  totalFound: number;
}

// --- AKILLI ARAMA ÇEKİRDEĞİ ---
export const smartSearchProducts = (query: string, allProducts: Product[]): SmartSearchResult => {
  const cleanQuery = normalizeTurkish(query);
  if (!cleanQuery) {
    return {
      products: allProducts,
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

  // 2. Ürün Puanlama Motoru
  const scoredProducts: { product: Product; score: number }[] = [];

  for (const product of allProducts) {
    let score = 0;
    const normName = normalizeTurkish(product.name);
    const normDesc = normalizeTurkish(product.description || '');
    const normUnit = normalizeTurkish(product.unit || '');
    const keywords = (product.searchKeywords || []).map((k) => normalizeTurkish(k));
    const nameWords = normName.split(' ');

    // (A) Tam Eşleşme
    if (normName === cleanQuery) {
      score += 120;
    } else if (normName.startsWith(cleanQuery)) {
      score += 90;
    } else if (normName.includes(cleanQuery)) {
      score += 70;
    }

    // (B) Kelime Bazlı İnceleme
    for (const qWord of queryWords) {
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

  const finalProducts = scoredProducts.map((sp) => sp.product);

  return {
    products: finalProducts,
    matchedIntent,
    query,
    totalFound: finalProducts.length,
  };
};
