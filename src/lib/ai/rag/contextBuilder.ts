import { AIAssistantContext } from '../types';
import { productRetriever } from './productRetriever';
import { orderRetriever } from './orderRetriever';
import { isStoreOpen } from '@/lib/settingsManager';

export interface CompiledRAGContext {
  relevantProducts: Array<{
    id: string;
    name: string;
    brand?: string;
    fullName: string;
    price: number;
    discountPrice?: number;
    isAvailable: boolean;
    category: string;
    barcode?: string;
  }>;
  relevantOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    customerPhone: string;
    dormName?: string;
    address: string;
    finalAmount: number;
    createdAt: string;
  }>;
  deliveryZones: Array<{
    id: string;
    name: string;
    minOrderAmount: number;
    deliveryFee: number;
  }>;
  dormitories: Array<{
    id: string;
    name: string;
    zoneId: string;
    minOrderAmount?: number;
    discountPercentage?: number;
    specialNote?: string;
  }>;
  bannedUsers: Array<{
    name: string;
    phone: string;
    reason: string;
    bannedAt: string;
  }>;
  kykGeneralMin: number;
  storeIsOpen: boolean;
}

export class ContextBuilder {
  /**
   * Builds high-precision RAG context for the prompt from the provided data.
   */
  public async buildContext(context: AIAssistantContext, prompt: string): Promise<CompiledRAGContext> {
    // 1. RAG Product Retrieval (Semantic Vector Search)
    const productMatches = await productRetriever.searchAsync(context.products || [], prompt, 20);

    let relevantProducts: CompiledRAGContext['relevantProducts'] = [];

    if (productMatches.length > 0) {
      relevantProducts = productMatches.map((m) => {
        const p = m.product;
        const brand = p.brand || (typeof p.options === 'object' && !Array.isArray(p.options) ? (p.options as any).brand : undefined);
        const fullName = brand && !p.name.toLowerCase().includes(brand.toLowerCase())
          ? `${brand} - ${p.name}`
          : p.name;

        return {
          id: p.id,
          name: p.name,
          brand: brand || undefined,
          fullName,
          price: p.price,
          discountPrice: p.discountPrice,
          isAvailable: p.isAvailable,
          category: p.category,
          barcode: p.barcode,
        };
      });
    } else {
      // Fallback: Sample diverse products from catalog so the assistant has context
      const sample = (context.products || []).slice(0, 15);
      relevantProducts = sample.map((p) => {
        const brand = p.brand || (typeof p.options === 'object' && !Array.isArray(p.options) ? (p.options as any).brand : undefined);
        return {
          id: p.id,
          name: p.name,
          brand: brand || undefined,
          fullName: brand && !p.name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} - ${p.name}` : p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          isAvailable: p.isAvailable,
          category: p.category,
          barcode: p.barcode,
        };
      });
    }

    // 2. Orders Retrieval
    const matchedOrders = orderRetriever.findOrders(context.orders || [], prompt, 10);
    const relevantOrders = matchedOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id.slice(-6),
      status: o.status,
      customerName: o.customerName || 'Müşteri',
      customerPhone: o.customerPhone || '',
      dormName: o.address?.dormName,
      address: o.address?.dormName || o.address?.title || o.address?.fullAddress || '',
      finalAmount: o.finalAmount || 0,
      createdAt: o.createdAt || new Date().toISOString(),
    }));

    // 3. Zones & Dorms
    const deliveryZones = (context.zones || []).map((z) => ({
      id: z.id,
      name: z.name,
      minOrderAmount: z.minOrderAmount || 0,
      deliveryFee: z.deliveryFee || 0,
    }));

    const dormitories = (context.dorms || []).map((d) => ({
      id: d.id,
      name: d.name,
      zoneId: d.zoneId,
      minOrderAmount: d.minOrderAmount,
      discountPercentage: d.discountPercentage,
      specialNote: d.specialNote,
    }));

    const kykZone = (context.zones || []).find(
      (z) => z.id === 'zone-kyk-yurtlari' || (z.name || '').toLowerCase().includes('kyk') || (z.name || '').toLowerCase().includes('yurt')
    );
    const kykGeneralMin = kykZone?.minOrderAmount || 60;

    // 4. Banned Users
    const bannedUsers = (context.bannedUsers || []).map((b) => ({
      name: b.name || 'Müşteri',
      phone: b.phone,
      reason: b.reason || 'Kötü niyetli kullanım',
      bannedAt: b.bannedAt || '',
    }));

    return {
      relevantProducts,
      relevantOrders,
      deliveryZones,
      dormitories,
      bannedUsers,
      kykGeneralMin,
      storeIsOpen: context.settings ? isStoreOpen(context.settings) : true,
    };
  }
}

export const contextBuilder = new ContextBuilder();
