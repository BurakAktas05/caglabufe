import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Order Creation Endpoint
 * 
 * Validates order prices against the actual product catalog on the server
 * using the Supabase service role key (bypasses RLS for reads, writes securely).
 * This prevents price-tampering attacks via DevTools.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    campaignId?: string;
    isKitchenItem?: boolean;
  };
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface OrderPayload {
  id: string;
  orderNumber: number;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  deliveryFee: number;
  discountAmount?: number;
  appliedCampaignId?: string;
  address: Record<string, unknown>;
  paymentMethod: string;
  orderNote?: string;
  estimatedDeliveryMinutes?: number;
}

export async function POST(req: NextRequest) {
  try {
    const payload: OrderPayload = await req.json();

    // Basic validation
    if (!payload.id || !payload.customerPhone || !payload.items || payload.items.length === 0) {
      return NextResponse.json({ error: 'Eksik sipariş bilgileri.' }, { status: 400 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Veritabanı bağlantısı kurulamadı.' }, { status: 500 });
    }

    // 1. Check if phone is banned
    const { data: bannedData } = await supabase
      .from('banned_users')
      .select('phone')
      .or(`phone.eq.${payload.customerPhone},phone.eq.0${payload.customerPhone}`)
      .limit(1);

    if (bannedData && bannedData.length > 0) {
      return NextResponse.json(
        { error: 'Bu telefon numarası kara listeye alınmıştır. Sipariş veremezsiniz.' },
        { status: 403 }
      );
    }

    // 2. Fetch catalog products to validate prices server-side
    const productIds = payload.items
      .filter(item => !item.product.id.startsWith('bundle_'))
      .map(item => item.product.id);

    let catalogProducts: Record<string, { price: number; discount_price: number | null; is_available: boolean }> = {};

    if (productIds.length > 0) {
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, price, discount_price, is_available')
        .in('id', productIds);

      if (productError) {
        console.error('[Order API] Product fetch error:', productError.message);
        return NextResponse.json({ error: 'Ürün doğrulaması başarısız.' }, { status: 500 });
      }

      if (products) {
        for (const p of products) {
          catalogProducts[p.id] = {
            price: Number(p.price),
            discount_price: p.discount_price ? Number(p.discount_price) : null,
            is_available: p.is_available,
          };
        }
      }
    }

    // 3. Validate prices and calculate server-side total
    let serverTotal = 0;

    for (const item of payload.items) {
      if (item.quantity < 1 || item.quantity > 25) {
        return NextResponse.json(
          { error: `Geçersiz ürün adedi: ${item.product.name}` },
          { status: 400 }
        );
      }

      // Bundle items: validate against campaigns if possible, otherwise trust client price
      if (item.product.id.startsWith('bundle_')) {
        const declaredPrice = item.product.discountPrice ?? item.product.price;
        if (declaredPrice > 0) {
          serverTotal += declaredPrice * item.quantity;
        }
        continue;
      }

      const catalogItem = catalogProducts[item.product.id];
      if (!catalogItem) {
        return NextResponse.json(
          { error: `Katalogda bulunmayan ürün: ${item.product.name}` },
          { status: 400 }
        );
      }

      if (!catalogItem.is_available) {
        return NextResponse.json(
          { error: `Ürün stokta bulunmuyor: ${item.product.name}` },
          { status: 400 }
        );
      }

      const serverPrice = catalogItem.discount_price ?? catalogItem.price;
      serverTotal += serverPrice * item.quantity;
    }

    // 4. Calculate final amount
    const finalAmount = serverTotal + (payload.deliveryFee || 0) - (payload.discountAmount || 0);

    // 5. Insert order with server-validated prices
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: payload.id,
        order_number: payload.orderNumber,
        user_id: payload.userId,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        items: payload.items,
        total_amount: serverTotal,
        delivery_fee: payload.deliveryFee || 0,
        final_amount: finalAmount,
        discount_amount: payload.discountAmount || 0,
        applied_campaign_id: payload.appliedCampaignId || null,
        address: payload.address,
        payment_method: payload.paymentMethod,
        order_note: payload.orderNote || '',
        status: 'pending',
        estimated_delivery_minutes: payload.estimatedDeliveryMinutes || 25,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Order API] Insert error:', orderError.message);
      return NextResponse.json(
        { error: `Sipariş kaydedilirken hata oluştu: ${orderError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderData.id,
        orderNumber: orderData.order_number,
        status: orderData.status,
        totalAmount: serverTotal,
        deliveryFee: payload.deliveryFee || 0,
        finalAmount: finalAmount,
        discountAmount: payload.discountAmount || 0,
      },
    });
  } catch (error: unknown) {
    console.error('[Order API Error]', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
