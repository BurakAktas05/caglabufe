import { AITool, ToolExecutionContext, ToolExecutionResult } from '../../types';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';
import { orderRetriever } from '../../rag/orderRetriever';

export const blacklistCustomerTool: AITool = {
  definition: {
    name: 'blacklist_customer',
    description: 'Kötü niyetli, sahte sipariş veren veya kapıda telefonunu açmayan bir müşteriyi / telefon numarasını kara listeye ekler ve siparişlerini engeller.',
    parameters: {
      type: 'object',
      properties: {
        customerIdentifier: {
          type: 'string',
          description: 'Engellenecek müşteri adı, sipariş numarası, telefon numarası veya "son sipariş" (örn: "son sipariş", "CB-5513", "0507xxxxxxx")',
        },
        phoneNumber: {
          type: 'string',
          description: 'Opsiyonel müşterinin telefon numarası',
        },
        customerName: {
          type: 'string',
          description: 'Opsiyonel müşterinin adı soyadı',
        },
        reason: {
          type: 'string',
          description: 'Engelleme sebebi (örn: "Telefonu açmadı", "Sahte sipariş", "Kapıda teslim almadı")',
        },
      },
      required: ['customerIdentifier'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const orders = context.context.orders || [];
    const ident = (args.customerIdentifier || '').toLowerCase();
    let targetPhone = args.phoneNumber || '';
    let targetName = args.customerName || '';
    const reason = args.reason || 'Kapıda teslim almadı / telefonu açmadı';

    // 1. Identify customer via orders or phone
    if (ident.includes('son') || ident.includes('last') || !ident) {
      if (orders.length > 0) {
        const lastOrder = orders[0];
        targetPhone = lastOrder.customerPhone;
        targetName = lastOrder.customerName;
      }
    } else {
      const matchedOrder = orderRetriever.findBestOrder(orders, ident);
      if (matchedOrder) {
        targetPhone = matchedOrder.customerPhone;
        targetName = matchedOrder.customerName;
      } else {
        const digits = ident.replace(/\D/g, '');
        if (digits.length >= 7) {
          targetPhone = digits;
          targetName = targetName || 'Müşteri';
        }
      }
    }

    if (targetPhone) {
      const clean = normalizePhoneNumber(targetPhone);
      const display = formatPhoneNumber(clean);
      return {
        success: true,
        message: `🚫 ${targetName ? `"${targetName}"` : 'Müşteri'} (${display}) kara listeye eklenecek. Sebep: "${reason}"`,
        data: {
          phone: clean,
          name: targetName || 'Müşteri',
          reason,
        },
      };
    }

    return {
      success: false,
      message: 'Kara listeye eklenecek geçerli bir telefon numarası veya sipariş tespit edilemedi.',
    };
  },
};

export const unbanCustomerTool: AITool = {
  definition: {
    name: 'unban_customer',
    description: 'Kara listedeki bir müşterinin veya telefon numarasının engelini kaldırır.',
    parameters: {
      type: 'object',
      properties: {
        customerIdentifier: {
          type: 'string',
          description: 'Engeli kaldırılacak müşteri adı veya telefon numarası',
        },
      },
      required: ['customerIdentifier'],
    },
  },
  execute: (args: any): ToolExecutionResult => {
    const ident = (args.customerIdentifier || '').trim();
    const clean = normalizePhoneNumber(ident);
    const display = formatPhoneNumber(clean);

    if (clean) {
      return {
        success: true,
        message: `✅ "${display || ident}" numarasının kara liste engeli kaldırılacak.`,
        data: {
          phone: clean,
        },
      };
    }

    return {
      success: false,
      message: 'Engel kaldırılması için geçerli bir telefon numarası belirtilmedi.',
    };
  },
};
