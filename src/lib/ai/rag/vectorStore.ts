import { Product } from '@/types';

interface CachedVector {
  vector: number[];
  hash: string;
}

/**
 * Production In-Memory Vector Store for RAG (Retrieval-Augmented Generation).
 * Uses OpenAI's text-embedding-3-small for semantic vector similarity (cosine distance).
 * Includes an automatic in-memory cache and lexical fallback to avoid external dependencies.
 */
export class VectorStore {
  private cache: Map<string, CachedVector> = new Map();
  private apiKey: string;
  private model: string = 'text-embedding-3-small';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generates a text representation for a product document.
   */
  public getProductDocument(p: Product): string {
    const brand = p.brand ? `${p.brand} ` : '';
    const desc = p.description ? ` - ${p.description}` : '';
    const unit = p.unit ? ` (${p.unit})` : '';
    const keywords = (p.searchKeywords || []).join(' ');
    return `${brand}${p.name} ${p.category}${unit}${desc} ${keywords}`.trim();
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  /**
   * Batch embeds multiple texts using OpenAI Embeddings API.
   */
  public async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY ortam değişkeni tanımlı değil.');
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI Embedding Hatası (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.data.map((d: any) => d.embedding);
  }

  /**
   * Indexes and caches embeddings for all products in the catalog.
   */
  public async indexProducts(products: Product[]): Promise<void> {
    const toEmbed: { index: number; id: string; doc: string }[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const doc = this.getProductDocument(p);
      const hash = this.simpleHash(doc);

      const cached = this.cache.get(p.id);
      if (!cached || cached.hash !== hash) {
        toEmbed.push({ index: i, id: p.id, doc });
      }
    }

    if (toEmbed.length === 0) return;

    // Batch embedding in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < toEmbed.length; i += chunkSize) {
      const chunk = toEmbed.slice(i, i + chunkSize);
      try {
        const vectors = await this.embedTexts(chunk.map((c) => c.doc));
        for (let j = 0; j < chunk.length; j++) {
          this.cache.set(chunk[j].id, {
            vector: vectors[j],
            hash: this.simpleHash(chunk[j].doc),
          });
        }
      } catch (err) {
        console.warn('[VectorStore] Batch embedding warning:', err);
        break;
      }
    }
  }

  /**
   * Vector Dot Product (Cosine Similarity for unit-normalized vectors).
   */
  private dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Universal n-gram character vectorizer (Lexical Fallback for offline / instant matching).
   * Creates 3-gram character frequency vector to handle typos without language-specific if-elses.
   */
  private nGramCosineSimilarity(textA: string, textB: string): number {
    const getNGrams = (str: string, n: number = 3) => {
      const clean = `  ${str.toLowerCase().trim()}  `;
      const map: Record<string, number> = {};
      for (let i = 0; i <= clean.length - n; i++) {
        const gram = clean.slice(i, i + n);
        map[gram] = (map[gram] || 0) + 1;
      }
      return map;
    };

    const gramsA = getNGrams(textA);
    const gramsB = getNGrams(textB);

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (const val of Object.values(gramsA)) magA += val * val;
    for (const val of Object.values(gramsB)) magB += val * val;

    for (const [gram, countA] of Object.entries(gramsA)) {
      if (gramsB[gram]) {
        dot += countA * gramsB[gram];
      }
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Performs semantic vector search over products.
   * Ranks products purely by mathematical cosine similarity (No hardcoded if/else rules).
   */
  public async search(
    query: string,
    products: Product[],
    topK: number = 10
  ): Promise<Array<{ product: Product; score: number }>> {
    if (!query.trim() || products.length === 0) return [];

    try {
      // 1. Ensure products are indexed in vector space
      await this.indexProducts(products);

      // 2. Generate embedding for user query
      const [queryVector] = await this.embedTexts([query.trim()]);

      // 3. Compute cosine similarity against all cached vectors
      const scored: Array<{ product: Product; score: number }> = [];

      for (const p of products) {
        const cached = this.cache.get(p.id);
        if (cached) {
          const sim = this.dotProduct(queryVector, cached.vector);
          scored.push({ product: p, score: sim });
        } else {
          // If vector wasn't cached, calculate n-gram similarity
          const doc = this.getProductDocument(p);
          const sim = this.nGramCosineSimilarity(query, doc);
          scored.push({ product: p, score: sim });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    } catch (error) {
      console.warn('[VectorStore] Vector search fallback to N-Gram Cosine:', error);

      // Lexical N-Gram vector space fallback
      const scored = products.map((p) => {
        const doc = this.getProductDocument(p);
        const score = this.nGramCosineSimilarity(query, doc);
        return { product: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    }
  }
}

export const vectorStore = new VectorStore();
