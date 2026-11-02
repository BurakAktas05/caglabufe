import { AITool, ToolExecutionContext, ToolExecutionResult } from '../../types';
import { productRetriever } from '../../rag/productRetriever';

/**
 * On-demand catalog search tool (Server-side Read-Only).
 * Allows the LLM to search products dynamically if the user asks prices, stock, or variations.
 */
export const searchCatalogTool: AITool = {
  definition: {
    name: 'search_catalog',
    description: 'Ürün kataloğunda arama yapar; ürünün fiyatını, stok durumunu, markasını ve barkodunu getirir.',
    isReadOnly: true,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Aranacak ürün adı, marka, gramaj veya anahtar kelime (örn: "cola turka 2.5", "yoğurt", "noodle")',
        },
        category: {
          type: 'string',
          description: 'Opsiyonel kategori filtresi (örn: "Kola", "Cips", "Yoğurt")',
        },
      },
      required: ['query'],
    },
  },
  execute: async (args: any, context: ToolExecutionContext): Promise<ToolExecutionResult> => {
    const query = args.query || '';
    const products = context.context.products || [];
    const matches = await productRetriever.searchAsync(products, query, 8);

    if (matches.length === 0) {
      return {
        success: true,
        message: `"${query}" ile eşleşen ürün bulunamadı.`,
        data: [],
      };
    }

    const data = matches.map((m) => {
      const p = m.product;
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

    return {
      success: true,
      message: `${matches.length} ürün bulundu.`,
      data,
    };
  },
};

/**
 * Tool for updating product price.
 */
export const updateProductPriceTool: AITool = {
  definition: {
    name: 'update_product_price',
    description: 'Bir ürünün normal veya indirimli satış fiyatını günceller. Kullanıcı ürünün fiyatını değiştirmek istediğinde çağrılır.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Opsiyonel ürün ID\'si (örn: "prod_8697520101021")',
        },
        productQuery: {
          type: 'string',
          description: 'Ürün adı veya markası (örn: "Cola Turka 2.5 Lt", "Sütaş Yoğurt")',
        },
        newPrice: {
          type: 'number',
          description: 'Yeni normal satış fiyatı (TL)',
        },
        newDiscountPrice: {
          type: 'number',
          description: 'Opsiyonel yeni indirimli satış fiyatı (TL)',
        },
      },
      required: ['productQuery', 'newPrice'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const products = context.context.products || [];
    const query = args.productId || args.productQuery || '';
    const matchResult = productRetriever.findBestMatch(products, query);

    if (matchResult.exactMatch) {
      return {
        success: true,
        message: `"${matchResult.exactMatch.name}" fiyatı ₺${args.newPrice} olarak ayarlanacak.`,
        data: {
          productId: matchResult.exactMatch.id,
          product: matchResult.exactMatch,
          newPrice: args.newPrice,
          newDiscountPrice: args.newDiscountPrice,
        },
      };
    }

    if (matchResult.isAmbiguous && matchResult.candidates.length > 1) {
      return {
        success: true,
        message: `Birden fazla ürün bulundu.`,
        disambiguation: {
          type: 'product_price',
          newPrice: Number(args.newPrice),
          newDiscountPrice: args.newDiscountPrice ? Number(args.newDiscountPrice) : undefined,
          options: matchResult.candidates.slice(0, 8).map((p) => ({
            id: p.id,
            name: p.brand && !p.name.includes(p.brand) ? `${p.brand} - ${p.name}` : p.name,
            currentPrice: p.price,
          })),
        },
      };
    }

    return {
      success: false,
      message: `"${args.productQuery}" ile eşleşen ürün bulunamadı.`,
    };
  },
};

/**
 * Tool for toggling product stock availability.
 */
export const toggleProductStockTool: AITool = {
  definition: {
    name: 'toggle_product_stock',
    description: 'Bir ürünün stok durumunu satışta veya tükendi olarak ayarlar.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Opsiyonel ürün ID\'si',
        },
        productQuery: {
          type: 'string',
          description: 'Ürün adı veya barkodu (örn: "kola 2.5 lt", "noodle")',
        },
        isAvailable: {
          type: 'boolean',
          description: 'true = stokta var / satışta, false = tükendi / kapalı',
        },
      },
      required: ['productQuery', 'isAvailable'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const products = context.context.products || [];
    const query = args.productId || args.productQuery || '';
    const matchResult = productRetriever.findBestMatch(products, query);

    if (matchResult.exactMatch) {
      return {
        success: true,
        message: `"${matchResult.exactMatch.name}" ${args.isAvailable ? 'Satışta' : 'Tükendi'} olarak ayarlanacak.`,
        data: {
          productId: matchResult.exactMatch.id,
          product: matchResult.exactMatch,
          isAvailable: args.isAvailable,
        },
      };
    }

    if (matchResult.isAmbiguous && matchResult.candidates.length > 1) {
      return {
        success: true,
        message: `Birden fazla ürün bulundu.`,
        disambiguation: {
          type: 'product_stock',
          isAvailable: Boolean(args.isAvailable),
          options: matchResult.candidates.slice(0, 8).map((p) => ({
            id: p.id,
            name: p.brand && !p.name.includes(p.brand) ? `${p.brand} - ${p.name}` : p.name,
            isAvailable: p.isAvailable,
          })),
        },
      };
    }

    return {
      success: false,
      message: `"${args.productQuery}" ile eşleşen ürün bulunamadı.`,
    };
  },
};
