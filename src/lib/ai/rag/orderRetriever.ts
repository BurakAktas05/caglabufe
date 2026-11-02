import { Order } from '@/types';
import { normalizeTurkish } from './turkishNormalizer';

export class OrderRetriever {
  /**
   * Finds the most relevant order(s) for a given query identifier or phrase.
   */
  public findOrders(orders: Order[], rawQuery: string, limit: number = 5): Order[] {
    if (!orders || orders.length === 0) return [];
    if (!rawQuery || !rawQuery.trim()) return orders.slice(0, limit);

    const norm = normalizeTurkish(rawQuery);

    // 1. "son", "last" or general latest order inquiry
    if (norm.includes('son') || norm.includes('last') || norm.includes('en son')) {
      // Check if location or dormitory is mentioned e.g. "hubbi hatun son sipariş"
      const matchedByLocation = orders.filter((o) => {
        const dorm = normalizeTurkish(o.address?.dormName || '');
        const title = normalizeTurkish(o.address?.title || '');
        const addr = normalizeTurkish(o.address?.fullAddress || '');
        const dormKeywords = dorm.split(' ').filter((w) => w.length >= 3);

        return (
          dormKeywords.some((kw) => norm.includes(kw)) ||
          norm.includes(dorm) ||
          norm.includes(title) ||
          norm.includes(addr)
        );
      });

      if (matchedByLocation.length > 0) {
        return matchedByLocation.slice(0, limit);
      }

      return [orders[0]];
    }

    // 2. Order Number, ID, Customer Name, Phone, Dormitory Match
    const cleanDigits = rawQuery.replace(/\D/g, '');
    const matched = orders.filter((o) => {
      const orderNum = (o.orderNumber || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const customerName = normalizeTurkish(o.customerName || '');
      const phone = (o.customerPhone || '').replace(/\D/g, '');
      const dorm = normalizeTurkish(o.address?.dormName || '');
      const addr = normalizeTurkish(o.address?.fullAddress || '');

      return (
        orderNum.includes(norm) ||
        id.includes(norm) ||
        customerName.includes(norm) ||
        (cleanDigits.length >= 4 && (phone.includes(cleanDigits) || orderNum.includes(cleanDigits))) ||
        (dorm && (norm.includes(dorm) || dorm.includes(norm))) ||
        addr.includes(norm)
      );
    });

    return matched.slice(0, limit);
  }

  /**
   * Finds single exact or best order for mutations like status change.
   */
  public findBestOrder(orders: Order[], rawQuery: string): Order | null {
    const list = this.findOrders(orders, rawQuery, 1);
    return list.length > 0 ? list[0] : null;
  }
}

export const orderRetriever = new OrderRetriever();
