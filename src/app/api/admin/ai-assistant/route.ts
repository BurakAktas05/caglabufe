import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { normalizeTurkish, smartMatchProducts } from '@/lib/searchEngine';

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

function selectRelevantProducts(allProducts: any[], promptText: string) {
  const matched = smartMatchProducts(allProducts, promptText);
  if (matched.length > 0) {
    return matched.slice(0, 25).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice,
      isAvailable: p.isAvailable,
      category: p.category,
      isKitchenItem: Boolean(p.isKitchenItem),
    }));
  }

  // Sadece ürün odaklı olmayan genel sorularda örnek küçük liste sağla
  return allProducts.slice(0, 15).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    discountPrice: p.discountPrice,
    isAvailable: p.isAvailable,
    category: p.category,
    isKitchenItem: Boolean(p.isKitchenItem),
  }));
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

    const productsSummary = selectRelevantProducts(context?.products || [], prompt);

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

    const systemPrompt = `
Sen Çağla Büfe & Market'in (Karabük/Bostanbükü) Akıllı Operasyon Yönetim Asistanısın.
Kuryelerin ve işletme sahibinin sahadan hızlıca verdiği sesli veya yazılı komutlarla sipariş durumlarını değiştirir, ürün fiyatlarını günceller, teslimat bölgelerinin ve yurtların minimum sepet tutarlarını ayarlar ve dükkanı açıp kapatabilirsin.
İnsan gibi dikkatli, net ve doğal davranırsın; kafandan asla tahmin yürütmezsin veya rastgele sayı uydurmazsın.

İŞLETME VE SİSTEM YAPISI:
- Son Siparişler: ${JSON.stringify(ordersSummary)}
- Ürünler Listesi (Özet & Filtrelenmiş): ${JSON.stringify(productsSummary)}
- Teslimat Bölgeleri: ${JSON.stringify(zonesSummary)}
- Öğrenci Yurtları (Dormitories): ${JSON.stringify(dormsSummary)}
- KYK Yurtları Genel Min Sepet Tutarı: ${currentKykMin} TL

GÜVENLİK VE ÇALIŞMA KURALLARI:
1. ASLA toplu silme, veritabanı çökertme veya güvenlik sınırlarını aşan eylemlere izin verme.

2. BÖLGE VE YURT MİNİMUM SEPET TUTARI KURALLARI (İNSAN GİBİ DOĞAL ÇALIŞMA):
   - KULLANICI BELİRLİ BİR YURT ADI SÖYLEDİYSE (Örn: "Hubbi Hatun", "Bahaddin Gazi", "Şeyh Edebali"):
     * dormName olarak ilgili yurdun adını yaz.
     * Kullanıcı belirli bir tutar belirttiyse (örn: "500 yap", "300 TL", "250"), minOrderAmount olarak tam o sayıyı ver.
     * Kullanıcı sayı belirtmediyse (örn: "Hubbi Hatun sepetini artır / yükselt"), minOrderAmount boş bırakılabilir; sistem arayüzde yöneticiye butonlarla tutar seçimi yaptırır.
   - KULLANICI GENEL OLARAK "YURDUN MİN TUTARINI YÜKSELT / ARTIR / DEĞİŞTİR" DEDİYSE (YURT ADI BELİRTMEDİYSE):
     * KESİNLİKLE rastgele bir yurt seçme ve kafandan genel yurtlara zam uygulama!
     * update_dorm_override(dormName: "secim_gerekli", minOrderAmount: kullanıcının_belirttiği_sayı_varsa) aracını çağır. Sistem arayüzde yöneticiye hangi yurt olduğunu butonlarla soracaktır.
   - KULLANICI AÇIKÇA "TÜM YURTLAR", "BÜTÜN YURTLAR" VEYA "KYK BÖLGESİ" DEDİYSE:
     * update_zone_min_order(zoneName: "KYK Yurtları") veya update_dorm_override(dormName: "KYK Yurtları") çağır.

3. ÜRÜN İŞLEMLERİNDE:
   - KULLANICI BİR ÜRÜNÜN FİYATINI VEYA STOĞUNU DEĞİŞTİRMEK İSTEDİĞİNDE:
     * KESİNLİKLE METİN OLARAK KAHVE VEYA ALAKASIZ ÜRÜN LİSTESİ ÇIKARMA!
     * DOĞRUDAN İLGİLİ ARACI ÇAĞIR: update_product_price veya toggle_product_stock.
     * "yoğurt fiyatını 200 TL yap": update_product_price(productQuery: "yoğurt", newPrice: 200) çağır. Sistem arayüzü yalnızca gerçek yoğurtlar (Kaymaksız Yoğurt, Meyveli Yoğurt) için yöneticiye butonla seçim yaptırır.
     * ASLA "yoğurt" dendiğinde "yoğurtlu cips" veya "kraker" gibi çeşnili atıştırmalıkları yoğurt diye sunma!
     * "kola tükendi" veya "red bull stokta": toggle_product_stock(productQuery: "kola", isAvailable: false) çağır.

4. SİPARİŞ İŞLEMLERİNDE:
   - "hubbi hatuna götürdüğümüz son siparişi teslim edildi yap": update_order_status(orderIdentifier: "hubbi hatun", newStatus: "delivered") çağır.

5. DÜKKAN İŞLEMLERİNDE:
   - "dükkanı aç": toggle_store_status(isOpen: true)
   - "dükkanı kapat": toggle_store_status(isOpen: false)

6. İlgili aracı çağırdıktan sonra samimi, net ve enerjik bir üslupla onay mesajı ver. (Örn: "Tamamdır usta, Hubbi Hatun minimum sepet tutarını ₺500 olarak güncelledim!").
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
          description: 'Bir ürünün veya ürün grubunun satış fiyatını veya indirimli fiyatını günceller. Genel bir ürün grubu girilirse (örn: "yoğurt") sistem yöneticiye butonla ürün seçimi yaptırır.',
          parameters: {
            type: 'object',
            properties: {
              productId: {
                type: 'string',
                description: 'Opsiyonel ürün ID\'si',
              },
              productQuery: {
                type: 'string',
                description: 'Ürünün tam veya belirgin adı (örn: "yoğurt", "Sütaş Tava Yoğurt 1000g", "Coca Cola 1L")',
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
          description: 'Bir ürünün stok durumunu satışta veya tükendi olarak ayarlar. Genel bir ürün adı girilirse sistem yöneticiye butonla ürün seçimi yaptırır.',
          parameters: {
            type: 'object',
            properties: {
              productQuery: {
                type: 'string',
                description: 'Ürün adı veya barkodu (örn: "yoğurt", "noodle")',
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
      },
      {
        type: 'function',
        function: {
          name: 'update_dorm_override',
          description: 'Bir KYK yurdunun minimum sipariş tutarını günceller. Kullanıcı belirli bir yurt adı söylemediyse (örn: sadece "yurdun min tutarını yükselt" dediyse), dormName parametresine "secim_gerekli" yaz; sistem kullanıcıya butonla hangi yurt olduğunu soracaktır.',
          parameters: {
            type: 'object',
            properties: {
              dormName: {
                type: 'string',
                description: 'Yurt adı (örn: "Hubbi Hatun", "Bahaddin Gazi", "Şeyh Edebali") veya yurt adı belirtilmediyse "secim_gerekli"',
              },
              minOrderAmount: {
                type: 'number',
                description: 'Opsiyonel yurda özel minimum sepet tutarı (TL). Kullanıcı sayı söylediyse o sayı.',
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
      const parsedCalls = message.tool_calls.map((tc: ToolCall) => {
        let args: any = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }
        return {
          tool: tc.function.name,
          arguments: args,
        };
      });

      // Eğer kullanıcı belirli bir yurt adı söylemişse ve model hem zone hem dorm çağırmışsa,
      // her zaman belirli yurt aracı olan update_dorm_override'ı seç:
      const dormCall = parsedCalls.find((c: any) => c.tool === 'update_dorm_override');
      const normP = normalizeTurkish(prompt);
      const dormKeywords = (dormsSummary || []).flatMap((d: any) =>
        normalizeTurkish(d.name).split(' ').filter((w: string) => !['kyk', 'ogrenci', 'yurdu', 'kiz', 'erkek'].includes(w) && w.length >= 3)
      );
      const hasSpecificDorm = dormKeywords.some((kw: string) => normP.includes(kw));
      if (dormCall && hasSpecificDorm) {
        actionTaken = dormCall;
      } else {
        actionTaken = parsedCalls[0];
      }
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

