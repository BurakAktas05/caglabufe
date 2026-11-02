/**
 * Pure Text Normalization Utilities.
 * Language character normalization and generic token cleaning (No hardcoded brand/product lists).
 */

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
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9\s.,]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Levenshtein distance calculation for typo tolerance.
 */
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

/**
 * General conversational stop words to strip when searching product catalog.
 */
export const QUERY_STOP_WORDS = new Set([
  'fiyatini', 'fiyati', 'fiyat', 'yap', 'et', 'guncelle', 'kac', 'kaca', 'para', 'ne', 'kadar',
  'tl', 'lira', 'kurus', 'urunu', 'urun', 've', 'ile', 'icin', 'olan', 'bir', 'adet', 'tane',
  'getir', 'ver', 'goster', 'listele', 'al', 'stok', 'stokta', 'stoktan', 'kaldir', 'kapat',
  'ac', 'satista', 'tukendi', 'son', 'yeni', 'lutfen', 'cagla', 'bufe', 'market', 'selam',
  'merhaba', 'usta', 'kardes', 'abi', 'bize', 'bana', 'bunu', 'su', 'var', 'mi', 'mı', 'mu',
  'mu?', 'mi?', 'mı?', 'mu?', 'kalan', 'elimizde', 'varmi', 'varmı', 'bitti', 'bittimi'
]);

/**
 * Cleans conversational sentence into query tokens.
 */
export const cleanProductQuery = (rawQuery: string): { effectiveQuery: string; tokens: string[] } => {
  const norm = normalizeTurkish(rawQuery);
  const words = norm.split(' ').filter((w) => w.length >= 2);
  const cleanTokens = words.filter((w) => !QUERY_STOP_WORDS.has(w) && !/^\d+$/.test(w));
  return {
    effectiveQuery: cleanTokens.join(' ').trim() || norm,
    tokens: cleanTokens.length > 0 ? cleanTokens : words,
  };
};
