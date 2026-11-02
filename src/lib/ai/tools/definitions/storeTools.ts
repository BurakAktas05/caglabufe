import { AITool, ToolExecutionContext, ToolExecutionResult } from '../../types';

export const toggleStoreStatusTool: AITool = {
  definition: {
    name: 'toggle_store_status',
    description: 'Çağla Büfe dükkanını sipariş alımına açar veya kapatır.',
    parameters: {
      type: 'object',
      properties: {
        isOpen: {
          type: 'boolean',
          description: 'true = dükkanı hemen aç ve sipariş alımını başlat, false = dükkanı siparişlere kapat',
        },
        message: {
          type: 'string',
          description: 'Kapatma sebebi veya duyuru açıklaması',
        },
      },
      required: ['isOpen'],
    },
  },
  execute: (args: any): ToolExecutionResult => {
    return {
      success: true,
      message: `Dükkan durumu ${args.isOpen ? 'AÇIK (Sipariş alınıyor)' : 'KAPALI (Sipariş alımı durduruldu)'} olarak ayarlanacak.`,
      data: {
        isOpen: Boolean(args.isOpen),
        message: args.message,
      },
    };
  },
};
