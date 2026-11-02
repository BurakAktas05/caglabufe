import { Product } from '@/types';
import { ProductMatch } from '../types';
import { vectorStore } from './vectorStore';

export class ProductRetriever {
  /**
   * Retrieves relevant products using true Vector Search (OpenAI Embeddings)
   * and lexical matching without hardcoded brand lists or if-else rules.
   */
  public async searchAsync(
    allProducts: Product[],
    rawQuery: string,
    limit: number = 10
  ): Promise<ProductMatch[]> {
    if (!rawQuery || !rawQuery.trim() || !allProducts || allProducts.length === 0) {
      return [];
    }

    const vectorResults = await vectorStore.search(rawQuery, allProducts, limit);

    return vectorResults.map((r) => ({
      product: r.product,
      score: Math.round(r.score * 1000) / 10, // Normalized score e.g. 75.5
      matchedFields: ['semantic_embedding'],
    }));
  }

  /**
   * Synchronous fallback for client-side execution using n-gram lexical vector similarity.
   */
  public search(allProducts: Product[], rawQuery: string, limit: number = 10): ProductMatch[] {
    if (!rawQuery || !rawQuery.trim() || !allProducts || allProducts.length === 0) {
      return [];
    }

    const qLower = rawQuery.toLowerCase().trim();
    const qTokens = qLower.split(/\s+/).filter((t) => t.length > 0);

    const scored: ProductMatch[] = [];

    for (const p of allProducts) {
      const doc = `${p.brand || ''} ${p.name} ${p.category || ''} ${p.description || ''} ${p.barcode || ''}`.toLowerCase();

      let tokenMatches = 0;
      for (const tok of qTokens) {
        if (doc.includes(tok)) {
          tokenMatches++;
        }
      }

      if (tokenMatches > 0) {
        const score = (tokenMatches / qTokens.length) * 100;
        scored.push({
          product: p,
          score,
          matchedFields: ['lexical_token'],
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Evaluates if there is a single decisive match or if disambiguation is required.
   */
  public findBestMatch(
    allProducts: Product[],
    rawQuery: string
  ): {
    exactMatch: Product | null;
    candidates: Product[];
    isAmbiguous: boolean;
  } {
    const results = this.search(allProducts, rawQuery, 8);
    if (results.length === 0) {
      return { exactMatch: null, candidates: [], isAmbiguous: false };
    }

    const top = results[0];
    const second = results[1];

    if (results.length === 1) {
      return { exactMatch: top.product, candidates: [top.product], isAmbiguous: false };
    }

    // High confidence match (score >= 90 and significant lead over second candidate)
    if (top.score >= 90 && (!second || top.score - second.score >= 30)) {
      return { exactMatch: top.product, candidates: results.map((r) => r.product), isAmbiguous: false };
    }

    return {
      exactMatch: null,
      candidates: results.map((r) => r.product),
      isAmbiguous: true,
    };
  }
}

export const productRetriever = new ProductRetriever();
