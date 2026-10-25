import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Server-side Admin Authentication Check
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim. Lütfen önce yönetici girişi yapınız.' },
        { status: 401 }
      );
    }

    const { prompt, context } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Lütfen bir komut veya soru yazın.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY ortam değişkeni tanımlı değil.' },
        { status: 500 }
      );
    }

    // 1. Prompt Injection & Destructive Intent Guardrail
    const lower = prompt.toLowerCase();
    const maliciousPatterns = [
      'delete all',
      'tüm dbyi sil',
      'tümünü sil',
      'bütün siparişleri sil',
      'bütün ürünleri sil',
      'drop table',
      'truncate',
      'ignore previous instructions',
      'sistem talimatlarını unut',
      'veritabanını sıfırla',
      'format at',
    ];

    for (const pat of maliciousPatterns) {
      if (lower.includes(pat)) {
        return NextResponse.json({
          assistantMessage: '🛡️ Güvenlik Uyarısı: Toplu silme, veritabanı sıfırlama veya yetkisiz sistem manipülasyonu güvenlik kuralları gereği engellendi.',
          actionTaken: null,
        });
      }
    }

    // 2. Prepare Context Snippet for LLM
    const ordersSummary = (context?.orders || []).slice(0, 15).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      address: o.address?.title || o.address?.dormName || o.address?.fullAddress,
      dormName: o.address?.dormName,
      finalAmount: o.finalAmount,
      createdAt: o.createdAt,
    }));

    const productsSummary = (context?.products || []).slice(0, 40).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice,
      isAvailable: p.isAvailable,
      category: p.category,
      isKitchenItem: Boolean(p.isKitchenItem),
    }));

    const zonesSummary = (context?.zones || []).map((z: any) => ({
      id: z.id,
      name: z.name,
      minOrderAmount: z.minOrderAmount,
      deliveryFee: z.deliveryFee,
    }));

    const dormsSummary = (context?.dorms || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      zoneId: d.zoneId,
      minOrderAmount: d.minOrderAmount,
      discountPercentage: d.discountPercentage,
      specialNote: d.specialNote,
    }));

    const kykZone = (context?.zones || []).find((z: any) => z.id === 'zone-kyk-yurtlari' || (z.name || '').toLowerCase().includes('kyk') || (z.name || '').toLowerCase().includes('yurt'));
    const currentKykMin = kykZone?.minOrderAmount || 60;
    const suggestedKykMin = currentKykMin + 15;

    const systemPrompt = `
Sen Çağla Büfe & Market'in (Karabük/Bostanbükü) Akıllı Operasyon Yönetim Asistanısın.
Kuryelerin ve işletme sahibinin sahadan hızlıca verdiği sesli veya yazılı komutlarla sipariş durumlarını değiştirir, ürün fiyatlarını günceller, teslimat bölgelerinin ve yurtların minimum sepet tutarlarını ayarlar ve dükkanı açıp kapatabilirsin.

ÖNEMLİ BAĞLAM VERİLERİ:
- Son Siparişler: ${JSON.stringify(ordersSummary)}
- Ürünler Listesi (Özet): ${JSON.stringify(productsSummary)}
- Bölgeler: ${JSON.stringify(zonesSummary)}
- Yurtlar: ${JSON.stringify(dormsSummary)}
- KYK Yurtları Mevcut Min Sepet Tutarı: ${currentKykMin} TL (Artırma komutunda hedef tutar: ${suggestedKykMin} TL)

GÜVENLİK VE ÇALIŞMA KURALLARI:
1. ASLA toplu silme, veritabanı çökertme veya güvenlik sınırlarını aşan eylemlere izin verme.
2. Kullanıcının niyeti bir eylem gerektiriyorsa MUTLAKA uygun aracı (tool calling) çağır:
   - "yurdun min tutarını artır", "yurtların sepetini artır", "kyk sepetini 80 yap":
     * update_dorm_override ve/veya update_zone_min_order aracını çağır.
     * Kullanıcı özel bir yurt adı belirtmediyse dormName olarak "KYK Yurtları", zoneName olarak "KYK Yurtları" ver.
     * Eğer kullanıcı belirli bir sayı söylemediyse (sadece "artır" dediyse), minOrderAmount parametresine kesinlikle ${suggestedKykMin} sayısını ata.
   - "yoğurda zam geldi 200 tl yap": update_product_price aracını çağır.
   - "hubbi hatuna götürdüğümüz son siparişi teslim edildi yap": update_order_status aracını çağır.
   - "dükkanı aç" veya "kapat": toggle_store_status aracını çağır.
3. İlgili aracı çağırdıktan sonra Türkçe, net, enerjik ve samimi bir açıklama yap. Kuryeye "Tamamdır usta, işlem yapıldı!" gibi güven verici bir tonla hitap et.
`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'update_order_status',
          description: 'Bir siparişin durumunu günceller (hazırlanıyor, yola çıktı, teslim edildi, iptal).',
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
                description: 'Yeni sipariş durumu',
              },
              note: {
                type: 'string',
                description: 'İşlem gerekçesi veya açıklaması',
              },
            },
            required: ['orderIdentifier', 'newStatus'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_product_price',
          description: 'Bir ürünün satış fiyatını veya indirimli fiyatını günceller.',
          parameters: {
            type: 'object',
            properties: {
              productQuery: {
                type: 'string',
                description: 'Ürün adı veya arama terimi (örn: "500g yoğurt", "kola 1l", "karışık tost")',
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
      },
      {
        type: 'function',
        function: {
          name: 'toggle_product_stock',
          description: 'Bir ürünün stok durumunu satışta veya tükendi olarak ayarlar.',
          parameters: {
            type: 'object',
            properties: {
              productQuery: {
                type: 'string',
                description: 'Ürün adı veya barkodu',
              },
              isAvailable: {
                type: 'boolean',
                description: 'true = stokta var / sipariş alınabilir, false = tükendi / kapalı',
              },
            },
            required: ['productQuery', 'isAvailable'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_zone_min_order',
          description: 'Bir teslimat bölgesinin minimum sipariş tutarını veya teslimat ücretini günceller.',
          parameters: {
            type: 'object',
            properties: {
              zoneName: {
                type: 'string',
                description: 'Bölge adı (örn: "KYK Yurtları", "100. Yıl", "Bostanbükü")',
              },
              minOrderAmount: {
                type: 'number',
                description: 'Yeni minimum sepet tutarı (TL). Belirtilmediyse mevcut tutarı 10 TL artırın.',
              },
              deliveryFee: {
                type: 'number',
                description: 'Opsiyonel yeni teslimat ücreti (TL)',
              },
            },
            required: ['zoneName', 'minOrderAmount'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'update_dorm_override',
          description: 'Belirli bir KYK yurduna veya genel yurtlara özel min sepet tutarı veya indirim oranı tanımlar / override eder.',
          parameters: {
            type: 'object',
            properties: {
              dormName: {
                type: 'string',
                description: 'Yurt adı veya genel adı (örn: "Hubbi Hatun", "Şeyh Edebali", "Eflani", "KYK Yurtları", "Yurtlar")',
              },
              minOrderAmount: {
                type: 'number',
                description: 'Yurda özel minimum sepet tutarı (TL). Belirtilmediyse mevcut tutarı 10 TL artırıp kesin sayı olarak verin (örn: 75).',
              },
              discountPercentage: {
                type: 'number',
                description: 'Yurda özel indirim oranı (%)',
              },
              specialNote: {
                type: 'string',
                description: 'Yurda özel açıklama notu (örn: "%10 Hubbi Hatun İndirimi")',
              },
            },
            required: ['dormName'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'toggle_store_status',
          description: 'Çağla Büfe dükkanını acil veya manuel olarak açar ya da kapatır.',
          parameters: {
            type: 'object',
            properties: {
              isOpen: {
                type: 'boolean',
                description: 'true = dükkanı hemen aç, false = dükkanı siparişlere kapat',
              },
              message: {
                type: 'string',
                description: 'Kapatma sebebi veya duyuru mesajı',
              },
            },
            required: ['isOpen'],
          },
        },
      },
    ];

    // Call OpenAI Chat Completions API
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.2,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[OpenAI Error]', errText);
      return NextResponse.json(
        { error: 'Yapay zeka servisine bağlanırken bir hata oluştu: ' + openaiRes.statusText },
        { status: 500 }
      );
    }

    const data = await openaiRes.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    let actionTaken: any = null;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall: ToolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      actionTaken = {
        tool: fnName,
        arguments: args,
      };
    }

    const assistantContent =
      message?.content ||
      (actionTaken
        ? `İşlem başarıyla planlandı ve sisteme iletildi: ${actionTaken.tool}`
        : 'Komutunuz anlaşıldı.');

    return NextResponse.json({
      assistantMessage: assistantContent,
      actionTaken,
    });
  } catch (error: any) {
    console.error('[Admin AI Error]', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası.' }, { status: 500 });
  }
}
