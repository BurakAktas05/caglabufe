import {
  Order,
  Product,
  DeliveryZone,
  DormitoryConfig,
} from '@/types';
import { ActionTaken, DisambiguationData } from '../types';
import { productRetriever } from '../rag/productRetriever';
import { orderRetriever } from '../rag/orderRetriever';
import { normalizeTurkish } from '../rag/turkishNormalizer';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';

export interface ActionExecutorDependencies {
  orders: Order[];
  products: Product[];
  zones: DeliveryZone[];
  dorms: DormitoryConfig[];
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onSaveProduct: (product: Product) => void;
  onToggleProductAvailability: (productId: string, currentStatus: boolean) => void;
  onUpdateZone: (id: string, updates: Partial<DeliveryZone>) => void;
  onUpdateDorm: (id: string, updates: Partial<DormitoryConfig>) => void;
  onToggleStoreOpen: (nextState: boolean) => void;
  onBanCustomer?: (phone: string, name: string, reason: string) => Promise<void> | void;
  onUnbanCustomer?: (phone: string) => Promise<void> | void;
}

export interface ClientActionResult {
  summary: string;
  isQuestion?: boolean;
  disambiguation?: DisambiguationData;
}

export class ActionExecutor {
  public execute(
    action: ActionTaken,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const { tool, arguments: args } = action;

    switch (tool) {
      case 'update_order_status':
        return this.handleUpdateOrderStatus(args, deps);

      case 'update_product_price':
        return this.handleUpdateProductPrice(args, deps);

      case 'toggle_product_stock':
        return this.handleToggleProductStock(args, deps);

      case 'update_zone_min_order':
        return this.handleUpdateZoneMinOrder(args, deps);

      case 'update_dorm_override':
        return this.handleUpdateDormOverride(args, deps);

      case 'toggle_store_status':
        return this.handleToggleStoreStatus(args, deps);

      case 'blacklist_customer':
        return this.handleBlacklistCustomer(args, deps);

      case 'unban_customer':
        return this.handleUnbanCustomer(args, deps);

      default:
        return {
          summary: `İşlem tamamlandı: ${tool}`,
        };
    }
  }

  private handleUpdateOrderStatus(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const matched = orderRetriever.findBestOrder(deps.orders, args.orderIdentifier || '');
    if (matched) {
      deps.onStatusChange(matched.id, args.newStatus);
      const statusMap: Record<string, string> = {
        preparing: 'Hazırlanıyor',
        on_the_way: 'Kurye Yolda',
        delivered: 'Teslim Edildi',
        cancelled: 'İptal Edildi',
      };
      return {
        summary: `✅ #${matched.orderNumber || matched.id.slice(-4)} (${matched.customerName} - ${matched.address?.dormName || matched.address?.title}) durumu "${statusMap[args.newStatus] || args.newStatus}" yapıldı.`,
      };
    }
    return {
      summary: `⚠️ "${args.orderIdentifier}" ile eşleşen aktif bir sipariş bulunamadı.`,
    };
  }

  private handleUpdateProductPrice(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const query = args.productId || args.productQuery || '';
    const matchResult = productRetriever.findBestMatch(deps.products, query);

    if (matchResult.exactMatch) {
      const p = matchResult.exactMatch;
      const updated: Product = {
        ...p,
        price: Number(args.newPrice) || p.price,
        discountPrice: args.newDiscountPrice ? Number(args.newDiscountPrice) : p.discountPrice,
      };
      deps.onSaveProduct(updated);

      const brandPrefix = p.brand && !p.name.includes(p.brand) ? `${p.brand} ` : '';
      return {
        summary: `✅ "${brandPrefix}${p.name}" fiyatı ₺${args.newPrice}${args.newDiscountPrice ? ` (İndirimli: ₺${args.newDiscountPrice})` : ''} olarak güncellendi.`,
      };
    }

    if (matchResult.candidates.length > 1) {
      return {
        summary: `❓ "${args.productQuery}" ile eşleşen ${matchResult.candidates.length} ürün bulundu. Hangisinin fiyatını ₺${args.newPrice} yapmak istiyorsunuz?`,
        isQuestion: true,
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
      summary: `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`,
    };
  }

  private handleToggleProductStock(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const query = args.productId || args.productQuery || '';
    const matchResult = productRetriever.findBestMatch(deps.products, query);

    if (matchResult.exactMatch) {
      const p = matchResult.exactMatch;
      deps.onToggleProductAvailability(p.id, p.isAvailable);
      const brandPrefix = p.brand && !p.name.includes(p.brand) ? `${p.brand} ` : '';
      return {
        summary: `✅ "${brandPrefix}${p.name}" ürünü ${args.isAvailable ? 'Satışta (Stokta)' : 'Tükendi'} olarak işaretlendi.`,
      };
    }

    if (matchResult.candidates.length > 1) {
      return {
        summary: `❓ "${args.productQuery}" ile eşleşen ${matchResult.candidates.length} ürün bulundu. Hangisinin durumunu ${args.isAvailable ? 'Satışta' : 'Tükendi'} yapmak istiyorsunuz?`,
        isQuestion: true,
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
      summary: `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`,
    };
  }

  private handleUpdateZoneMinOrder(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const zName = normalizeTurkish(args.zoneName || '');
    const isDormZone = zName.includes('yurt') || zName.includes('kyk') || zName === '';

    const matchedZone = deps.zones.find((z) => {
      const zn = normalizeTurkish(z.name);
      if (isDormZone) return zn.includes('kyk') || zn.includes('yurt') || z.id === 'zone-kyk-yurtlari';
      return zn.includes(zName);
    }) || (isDormZone ? deps.zones.find((z) => z.id === 'zone-kyk-yurtlari') : undefined);

    if (matchedZone) {
      const currentMin = matchedZone.minOrderAmount || 60;
      let targetMin = Number(args.minOrderAmount);
      if (!targetMin || isNaN(targetMin) || targetMin <= 0) {
        targetMin = currentMin + 10;
      }

      deps.onUpdateZone(matchedZone.id, {
        minOrderAmount: targetMin,
        deliveryFee: args.deliveryFee ? Number(args.deliveryFee) : matchedZone.deliveryFee,
      });

      return {
        summary: `✅ "${matchedZone.name}" bölgesi min sepet tutarı ₺${targetMin} olarak güncellendi.`,
      };
    }

    return {
      summary: `⚠️ "${args.zoneName}" isimli teslimat bölgesi bulunamadı.`,
    };
  }

  private handleUpdateDormOverride(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const rawDName = (args.dormName || '').trim();
    const normDName = normalizeTurkish(rawDName);
    const kykZone = deps.zones.find(
      (z) => z.id === 'zone-kyk-yurtlari' || normalizeTurkish(z.name).includes('kyk') || normalizeTurkish(z.name).includes('yurt')
    );
    const currentZoneMin = kykZone?.minOrderAmount || 60;
    const targetAmount = args.minOrderAmount ? Number(args.minOrderAmount) : undefined;

    const isAllDorms =
      normDName.includes('tum yurt') ||
      normDName.includes('butun yurt') ||
      normDName.includes('heps') ||
      normDName.includes('kyk bolge');

    if (isAllDorms) {
      if (targetAmount && targetAmount > 0) {
        if (kykZone) deps.onUpdateZone(kykZone.id, { minOrderAmount: targetAmount });
        deps.dorms.forEach((d) => {
          if (d.zoneId === 'zone-kyk-yurtlari' && d.minOrderAmount) {
            deps.onUpdateDorm(d.id, { minOrderAmount: targetAmount });
          }
        });
        return {
          summary: `✅ Tüm KYK Yurtları teslimat bölgesi minimum sepet tutarı ₺${targetAmount} olarak güncellendi.`,
        };
      } else {
        return {
          summary: `❓ Tüm KYK Yurtları için hedef minimum sepet tutarını belirleyin (Mevcut: ₺${currentZoneMin}):`,
          isQuestion: true,
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

    let matchedDorm: DormitoryConfig | undefined;
    if (rawDName && rawDName !== 'secim_gerekli' && rawDName !== 'yurt' && rawDName !== 'yurdun') {
      matchedDorm = deps.dorms.find((d) => {
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
    }

    if (matchedDorm) {
      const currentMin = matchedDorm.minOrderAmount || currentZoneMin;

      if (targetAmount && targetAmount > 0) {
        deps.onUpdateDorm(matchedDorm.id, {
          minOrderAmount: targetAmount,
          discountPercentage: args.discountPercentage !== undefined ? Number(args.discountPercentage) : matchedDorm.discountPercentage,
          specialNote: args.specialNote || matchedDorm.specialNote,
        });

        return {
          summary: `✅ "${matchedDorm.name}" yurduna özel minimum sepet tutarı ₺${targetAmount} olarak güncellendi.${
            args.discountPercentage ? ` (İndirim: %${args.discountPercentage})` : ''
          }`,
        };
      } else {
        return {
          summary: `❓ "${matchedDorm.name}" için hedef minimum sepet tutarını belirleyin (Mevcut: ₺${currentMin}):`,
          isQuestion: true,
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

    return {
      summary: `❓ Hangi yurdun minimum sepet tutarını ${targetAmount ? `₺${targetAmount}` : 'güncellemek'} istiyorsunuz?`,
      isQuestion: true,
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
          ...deps.dorms.map((d) => {
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
  }

  private handleToggleStoreStatus(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    deps.onToggleStoreOpen(Boolean(args.isOpen));
    return {
      summary: `✅ Dükkan durumu ${args.isOpen ? 'AÇIK (Sipariş alınıyor)' : 'KAPALI (Sipariş alımı durduruldu)'} olarak güncellendi.`,
    };
  }

  private handleBlacklistCustomer(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const ident = (args.customerIdentifier || '').toLowerCase();
    let targetPhone = args.phoneNumber || '';
    let targetName = args.customerName || '';
    const reason = args.reason || 'Kapıda teslim almadı / telefonu açmadı';

    if (ident.includes('son') || ident.includes('last') || !ident) {
      if (deps.orders.length > 0) {
        const lastOrder = deps.orders[0];
        targetPhone = lastOrder.customerPhone;
        targetName = lastOrder.customerName;
      }
    } else {
      const matched = orderRetriever.findBestOrder(deps.orders, ident);
      if (matched) {
        targetPhone = matched.customerPhone;
        targetName = matched.customerName;
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
      if (deps.onBanCustomer) {
        deps.onBanCustomer(clean, targetName || 'Müşteri', reason);
      }
      return {
        summary: `🚫 ${targetName ? `"${targetName}"` : 'Müşteri'} (${display}) başarıyla kara listeye eklendi ve engellendi.\nSebep: "${reason}".`,
      };
    }

    return {
      summary: `⚠️ Kara listeye eklenecek müşteri veya telefon numarası bulunamadı.`,
    };
  }

  private handleUnbanCustomer(
    args: any,
    deps: ActionExecutorDependencies
  ): ClientActionResult {
    const ident = (args.customerIdentifier || '').trim();
    const clean = normalizePhoneNumber(ident);
    const display = formatPhoneNumber(clean);
    if (deps.onUnbanCustomer && clean) {
      deps.onUnbanCustomer(clean);
      return {
        summary: `✅ "${display || ident}" numarasının kara liste engeli başarıyla kaldırıldı.`,
      };
    }
    return {
      summary: `⚠️ Kara liste engeli kaldırılamadı veya geçerli bir telefon numarası bulunamadı.`,
    };
  }
}

export const actionExecutor = new ActionExecutor();
