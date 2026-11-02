import { AITool, ToolExecutionContext, ToolExecutionResult } from '../../types';
import { normalizeTurkish } from '../../rag/turkishNormalizer';

/**
 * Tool for updating delivery zone min order amount or delivery fee.
 */
export const updateZoneMinOrderTool: AITool = {
  definition: {
    name: 'update_zone_min_order',
    description: 'Bir teslimat bölgesinin (örn: "KYK Yurtları", "100. Yıl", "Bostanbükü") minimum sipariş tutarını veya teslimat ücretini günceller.',
    parameters: {
      type: 'object',
      properties: {
        zoneName: {
          type: 'string',
          description: 'Bölge adı (örn: "KYK Yurtları", "100. Yıl", "Bostanbükü")',
        },
        minOrderAmount: {
          type: 'number',
          description: 'Yeni minimum sepet tutarı (TL). Kullanıcı sayı söylediyse o sayı.',
        },
        deliveryFee: {
          type: 'number',
          description: 'Opsiyonel yeni teslimat ücreti (TL)',
        },
      },
      required: ['zoneName', 'minOrderAmount'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const zones = context.context.zones || [];
    const zName = normalizeTurkish(args.zoneName || '');
    const isDormZone = zName.includes('yurt') || zName.includes('kyk') || zName === '';

    const matchedZone = zones.find((z) => {
      const zn = normalizeTurkish(z.name);
      if (isDormZone) return zn.includes('kyk') || zn.includes('yurt') || z.id === 'zone-kyk-yurtlari';
      return zn.includes(zName);
    }) || (isDormZone ? zones.find((z) => z.id === 'zone-kyk-yurtlari') : undefined);

    if (matchedZone) {
      return {
        success: true,
        message: `"${matchedZone.name}" bölgesi min sepet tutarı ₺${args.minOrderAmount} olarak güncellenecek.`,
        data: {
          zoneId: matchedZone.id,
          zone: matchedZone,
          minOrderAmount: args.minOrderAmount,
          deliveryFee: args.deliveryFee,
        },
      };
    }

    return {
      success: false,
      message: `"${args.zoneName}" isimli teslimat bölgesi bulunamadı.`,
    };
  },
};

/**
 * Tool for updating dormitory-specific override.
 */
export const updateDormOverrideTool: AITool = {
  definition: {
    name: 'update_dorm_override',
    description: 'Bir KYK yurdunun minimum sipariş tutarını günceller. Kullanıcı belirli bir yurt adı söylemediyse dormName parametresine "secim_gerekli" yaz; sistem butonla soracaktır.',
    parameters: {
      type: 'object',
      properties: {
        dormName: {
          type: 'string',
          description: 'Yurt adı (örn: "Hubbi Hatun", "Bahaddin Gazi", "Şeyh Edebali") veya yurt adı belirtilmediyse "secim_gerekli"',
        },
        minOrderAmount: {
          type: 'number',
          description: 'Opsiyonel yurda özel minimum sepet tutarı (TL)',
        },
        discountPercentage: {
          type: 'number',
          description: 'Yurda özel indirim oranı (%)',
        },
        specialNote: {
          type: 'string',
          description: 'Yurda özel açıklama notu',
        },
      },
      required: ['dormName'],
    },
  },
  execute: (args: any, context: ToolExecutionContext): ToolExecutionResult => {
    const dorms = context.context.dorms || [];
    const zones = context.context.zones || [];
    const rawDName = (args.dormName || '').trim();
    const normDName = normalizeTurkish(rawDName);

    const kykZone = zones.find(
      (z) => z.id === 'zone-kyk-yurtlari' || normalizeTurkish(z.name).includes('kyk') || normalizeTurkish(z.name).includes('yurt')
    );
    const currentZoneMin = kykZone?.minOrderAmount || 60;
    const targetAmount = args.minOrderAmount ? Number(args.minOrderAmount) : undefined;

    // Check if explicit "all dorms" requested
    const isAllDorms =
      normDName.includes('tum yurt') ||
      normDName.includes('butun yurt') ||
      normDName.includes('heps') ||
      normDName.includes('kyk bolge');

    if (isAllDorms) {
      if (targetAmount && targetAmount > 0) {
        return {
          success: true,
          message: `Tüm KYK Yurtları teslimat bölgesi minimum sepet tutarı ₺${targetAmount} olarak güncellenecek.`,
          data: {
            isAllDorms: true,
            minOrderAmount: targetAmount,
          },
        };
      } else {
        return {
          success: true,
          message: 'Tüm KYK Yurtları için hedef tutarı seçin.',
          disambiguation: {
            type: 'amount_select',
            targetId: 'all_kyk',
            targetName: 'Tüm KYK Yurtları',
            options: [
              { id: 'inc_15', name: '+₺15 Artır', minOrderAmount: currentZoneMin + 15 },
              { id: 'inc_25', name: '+₺25 Artır', minOrderAmount: currentZoneMin + 25 },
              { id: 'inc_50', name: '+₺50 Artır', minOrderAmount: currentZoneMin + 50 },
              { id: 'set_100', name: '₺100 Yap', minOrderAmount: 100 },
              { id: 'set_150', name: '₺150 Yap', minOrderAmount: 150 },
              { id: 'set_200', name: '₺200 Yap', minOrderAmount: 200 },
            ].filter((o) => o.minOrderAmount !== currentZoneMin),
          },
        };
      }
    }

    // Specific dormitory match
    let matchedDorm = dorms.find((d) => {
      const normFullName = normalizeTurkish(d.name);
      const specificKeywords = normFullName
        .split(' ')
        .filter((w) => !['kyk', 'ogrenci', 'yurdu', 'kiz', 'erkek'].includes(w) && w.length >= 3);

      return (
        specificKeywords.some((kw) => normDName.includes(kw)) ||
        normFullName.includes(normDName) ||
        normDName.includes(normFullName)
      );
    });

    if (matchedDorm && rawDName !== 'secim_gerekli') {
      const currentMin = matchedDorm.minOrderAmount || currentZoneMin;

      if (targetAmount && targetAmount > 0) {
        return {
          success: true,
          message: `"${matchedDorm.name}" yurduna özel minimum sepet tutarı ₺${targetAmount} olarak güncellenecek.`,
          data: {
            dormId: matchedDorm.id,
            dorm: matchedDorm,
            minOrderAmount: targetAmount,
            discountPercentage: args.discountPercentage,
            specialNote: args.specialNote,
          },
        };
      } else {
        return {
          success: true,
          message: `"${matchedDorm.name}" için tutar seçin.`,
          disambiguation: {
            type: 'amount_select',
            targetId: matchedDorm.id,
            targetName: matchedDorm.name,
            options: [
              { id: 'inc_15', name: '+₺15 Artır', minOrderAmount: currentMin + 15 },
              { id: 'inc_25', name: '+₺25 Artır', minOrderAmount: currentMin + 25 },
              { id: 'inc_50', name: '+₺50 Artır', minOrderAmount: currentMin + 50 },
              { id: 'set_100', name: '₺100 Yap', minOrderAmount: 100 },
              { id: 'set_150', name: '₺150 Yap', minOrderAmount: 150 },
              { id: 'set_200', name: '₺200 Yap', minOrderAmount: 200 },
            ].filter((o) => o.minOrderAmount !== currentMin),
          },
        };
      }
    }

    // If dorm name not specified or ambiguous:
    return {
      success: true,
      message: 'Hangi yurt olduğunu seçin.',
      disambiguation: {
        type: 'dorm_select',
        minOrderAmount: targetAmount,
        options: [
          {
            id: 'all_kyk',
            name: '🏢 Tüm KYK Yurtları (Genel Bölge)',
            subText: `Mevcut: ₺${currentZoneMin}`,
            minOrderAmount: currentZoneMin,
          },
          ...dorms.map((d) => {
            const currentMin = d.minOrderAmount || currentZoneMin;
            return {
              id: d.id,
              name: d.name,
              subText: `Mevcut: ₺${currentMin}`,
              minOrderAmount: currentMin,
            };
          }),
        ],
      },
    };
  },
};
