import { AITool, ToolExecutionContext, ToolExecutionResult } from '../../types';
import { orderRetriever } from '../../rag/orderRetriever';

/**
 * Tool for updating order status.
 */
export const updateOrderStatusTool: AITool = {
  definition: {
    name: 'update_order_status',
    description: 'Bir siparişin durumunu günceller (hazırlanıyor, kurye yolda, teslim edildi, iptal).',
    parameters: {
      type: 'object',
      properties: {
        orderIdentifier: {
          type: 'string',
          description: 'Sipariş numarası (#1234), sipariş ID, müşteri adı veya teslimat yeri (örn: "hubbi hatun", "bahaddin gazi", "son sipariş")',
        },
        newStatus: {
          type: 'string',
          enum: ['preparing', 'on_the_way', 'delivered', 'cancelled'],
          description: 'Yeni sipariş durumu: preparing (hazırlanıyor), on_the_way (kurye yolda), delivered (teslim edildi), cancelled (iptal)',
        },
        note: {
          type: 'string',
          description: 'Opsiyonel işlem notu veya gerekçesi',
        },
      },
      required: ['orderIdentifier', 'newStatus'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const orders = context.context.orders || [];
    const matched = orderRetriever.findBestOrder(orders, args.orderIdentifier);

    if (matched) {
      return {
        success: true,
        message: `#${matched.orderNumber || matched.id.slice(-4)} (${matched.customerName} - ${matched.address?.dormName || matched.address?.title}) siparişi "${args.newStatus}" yapılacak.`,
        data: {
          orderId: matched.id,
          order: matched,
          newStatus: args.newStatus,
          note: args.note,
        },
      };
    }

    return {
      success: false,
      message: `"${args.orderIdentifier}" ile eşleşen aktif bir sipariş bulunamadı.`,
    };
  },
};

/**
 * Read-only order query tool.
 */
export const getOrderSummaryTool: AITool = {
  definition: {
    name: 'get_order_summary',
    description: 'Siparişlerin durumunu, son siparişleri veya belirli bir müşterinin sipariş bilgilerini sorgular.',
    isReadOnly: true,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Sipariş numarası, müşteri adı, yurt veya "son sipariş" gibi arama terimi',
        },
      },
      required: ['query'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const orders = context.context.orders || [];
    const matched = orderRetriever.findOrders(orders, args.query, 5);

    return {
      success: true,
      message: `${matched.length} sipariş bulundu.`,
      data: matched.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        dormName: o.address?.dormName,
        address: o.address?.fullAddress || o.address?.title,
        finalAmount: o.finalAmount,
        createdAt: o.createdAt,
      })),
    };
  },
};
