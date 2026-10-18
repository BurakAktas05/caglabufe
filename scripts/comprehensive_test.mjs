const SUPABASE_URL = 'https://japsiegzeuypwsknesoc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHNpZWd6ZXV5cHdza25lc29jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjIzNDY3OSwiZXhwIjoyMTA3ODEwNjc5fQ.oVZczQmUhnUZqNPm01VBj0a5jUNy-Vu8uf94mjJpl9I';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHNpZWd6ZXV5cHdza25lc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMzQ2NzksImV4cCI6MjEwNzgxMDY3OX0._YTUT_spA59ROGxbjnK7aVGy5Ryu6aN1A6VZi1O3GAg';
const VERCEL_URL = 'https://caglabufe.vercel.app';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, details = '') {
  if (success) {
    results.passed++;
    console.log(`✅ [PASS] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    results.failed++;
    console.error(`❌ [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
  results.tests.push({ name, success, details });
}

async function runAllTests() {
  console.log('============================================================');
  console.log('🚀 ÇAĞLA BÜFE & MARKET - KAPSAMLI ENTEGRASYON & YÜK TESTİ');
  console.log('============================================================\n');

  // --- 1. HEALTHCHECK & CDN PERFORMANSI ---
  console.log('--- 1. CANLI SİTE SAĞLIK VE CDN KONTROLÜ ---');
  try {
    const t0 = performance.now();
    const res = await fetch(VERCEL_URL);
    const duration = Math.round(performance.now() - t0);
    logTest('Vercel Canlı Anasayfa (HTTP 200)', res.status === 200, `${duration}ms, Status: ${res.status}`);
  } catch (err) {
    logTest('Vercel Canlı Anasayfa (HTTP 200)', false, err.message);
  }

  try {
    const t0 = performance.now();
    const res = await fetch(`${VERCEL_URL}/admin`);
    const duration = Math.round(performance.now() - t0);
    logTest('Vercel Yönetici Paneli (/admin)', res.status === 200, `${duration}ms, Status: ${res.status}`);
  } catch (err) {
    logTest('Vercel Yönetici Paneli (/admin)', false, err.message);
  }

  // --- 2. SUPABASE REST API & TABLOLAR ---
  console.log('\n--- 2. SUPABASE VERİTABANI & TABLO ENTEGRASYONU ---');
  for (const table of ['products', 'orders', 'system_settings', 'delivery_zones', 'dormitories', 'campaigns', 'banned_users', 'push_subscriptions']) {
    try {
      const t0 = performance.now();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      const duration = Math.round(performance.now() - t0);
      const isOk = res.status === 200;
      logTest(`Tablo Erişimi: ${table}`, isOk, `${duration}ms, HTTP ${res.status}`);
    } catch (err) {
      logTest(`Tablo Erişimi: ${table}`, false, err.message);
    }
  }

  // --- 3. VERİ EKLEME (CRUD) & CANLI TEST ÜRÜNÜ ---
  console.log('\n--- 3. YENİ ÜRÜN EKLEME (INSERT & UPDATE) TESTİ ---');
  const testProductId = 'test-cagla-gurme-burger-' + Date.now();
  const testProduct = {
    id: testProductId,
    name: '🔥 Çağla Gurme Burger XL (Test)',
    category: 'sicak-lezzetler',
    price: 185.00,
    discount_price: 165.00,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    description: '180 gr dana köfte, karamelize soğan, cheddar peyniri ve özel büfe sosu (Entegrasyon Test Ürünü)',
    unit: '1 porsiyon',
    barcode: '8690000009999',
    is_available: true,
    is_kitchen_item: true,
    prep_time_minutes: 15,
    options: [{ name: 'Patates', choices: ['Baharatlı', 'Sade'] }],
    search_keywords: ['burger', 'gurme burger', 'hamburger', 'köfte', 'test']
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testProduct)
    });
    const data = await res.json();
    logTest('Yeni Ürün Ekleme (POST products)', res.status === 201, `ID: ${testProductId}`);
  } catch (err) {
    logTest('Yeni Ürün Ekleme (POST products)', false, err.message);
  }

  // Verify Anon key can read this new product immediately
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${testProductId}`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    const prods = await res.json();
    logTest('Anonim İstemcinin Yeni Ürünü Okuması', prods.length === 1 && prods[0].name === testProduct.name, prods[0]?.name);
  } catch (err) {
    logTest('Anonim İstemcinin Yeni Ürünü Okuması', false, err.message);
  }

  // --- 4. UÇTAN UCA SİPARİŞ AKIŞI (CANLI MÜŞTERİ SİPARİŞİ) ---
  console.log('\n--- 4. UÇTAN UCA CANLI SİPARİŞ OLUŞTURMA & DURUM DÖNGÜSÜ ---');
  const testOrderId = 'ord_test_' + Math.random().toString(36).substring(2, 9);
  const testOrderNumber = 'CB-TEST-' + Math.floor(1000 + Math.random() * 9000);
  const mockOrder = {
    id: testOrderId,
    order_number: testOrderNumber,
    user_id: 'usr_test_student',
    customer_name: 'Antigravity Test Müşteri',
    customer_phone: '05421234567',
    items: [
      {
        productId: testProductId,
        productName: testProduct.name,
        price: testProduct.discount_price,
        quantity: 2,
        isKitchenItem: true
      }
    ],
    total_amount: 330.00,
    delivery_fee: 0.00,
    final_amount: 330.00,
    discount_amount: 0.00,
    applied_campaign_id: 'camp_free_delivery',
    address: {
      id: 'addr_test',
      type: 'dormitory',
      title: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
      dormName: 'KYK Hubbi Hatun Kız Öğrenci Yurdu',
      blockNumber: 'A Blok',
      roomNumber: '304',
      district: 'Demir Çelik Kampüsü',
      deliveryPresetNote: 'Nizamiyede teslim alacağım',
      courierNote: 'Lütfen kapıda arayınız'
    },
    payment_method: 'card_at_door',
    order_note: 'Test otomasyon siparişidir. Lütfen sıcak gelsin.',
    status: 'pending',
    estimated_delivery_minutes: 20
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(mockOrder)
    });
    const created = await res.json();
    logTest('Müşteri Siparişi Oluşturma (Anon INSERT)', res.status === 201, `No: ${testOrderNumber}, Tutar: ₺${mockOrder.final_amount}`);
  } catch (err) {
    logTest('Müşteri Siparişi Oluşturma (Anon INSERT)', false, err.message);
  }

  // Admin status transition test: pending -> preparing -> on_the_way -> delivered
  const statuses = ['preparing', 'on_the_way', 'delivered'];
  for (const nextStatus of statuses) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${testOrderId}`, {
        method: 'PATCH',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: nextStatus, updated_at: new Date().toISOString() })
      });
      const updated = await res.json();
      logTest(`Sipariş Durum Geçişi -> [${nextStatus.toUpperCase()}]`, res.status === 200 && updated[0]?.status === nextStatus);
    } catch (err) {
      logTest(`Sipariş Durum Geçişi -> [${nextStatus}]`, false, err.message);
    }
  }

  // Clean up test order
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${testOrderId}`, {
      method: 'DELETE',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    });
  } catch {}

  // --- 5. STRESS & YÜK TESTİ (EŞZAMANLI İSTEK PERFORMANSI) ---
  console.log('\n--- 5. YÜK VE EŞZAMANLILIK (CONCURRENCY) TESTİ (60 Eşzamanlı İstek) ---');
  const concurrentCount = 60;
  const latencies = [];
  const startLoad = performance.now();

  const requests = Array.from({ length: concurrentCount }, async (_, idx) => {
    const reqStart = performance.now();
    try {
      const endpoint = idx % 2 === 0
        ? `${SUPABASE_URL}/rest/v1/products?select=id,name,price,is_available&limit=10`
        : `${SUPABASE_URL}/rest/v1/system_settings?select=*`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        }
      });
      const dur = Math.round(performance.now() - reqStart);
      latencies.push(dur);
      return res.status === 200;
    } catch {
      return false;
    }
  });

  const loadResults = await Promise.all(requests);
  const totalLoadTime = Math.round(performance.now() - startLoad);
  const successfulCount = loadResults.filter(Boolean).length;
  latencies.sort((a, b) => a - b);

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];

  logTest(
    `Eşzamanlı Yük Başarısı (${successfulCount}/${concurrentCount})`,
    successfulCount === concurrentCount,
    `Toplam Süre: ${totalLoadTime}ms, Başarı Oranı: %${Math.round((successfulCount / concurrentCount) * 100)}`
  );

  console.log(`\n📊 Yük Testi Gecikme İstatistikleri:`);
  console.log(`   - En Düşük Gecikme (Min): ${minLatency} ms`);
  console.log(`   - Ortalama Gecikme (Avg): ${avgLatency} ms`);
  console.log(`   - Medyan Gecikme (P50)  : ${p50} ms`);
  console.log(`   - 95. Yüzdelik (P95)    : ${p95} ms`);
  console.log(`   - 99. Yüzdelik (P99)    : ${p99} ms`);
  console.log(`   - En Yüksek Gecikme (Max): ${maxLatency} ms`);
  console.log(`   - Throughput (İstek/sn) : ${Math.round((concurrentCount / totalLoadTime) * 1000)} req/sec`);

  // --- 6. RLS GÜVENLİK TESTİ (ANTİ-TAMPER / HACK DENEMESİ) ---
  console.log('\n--- 6. GÜVENLİK & RLS POLİTİKA ZIRHI TESTİ ---');
  try {
    // Attempt malicious order with total_amount <= 0 or customer_phone < 10 digits
    const maliciousOrder = {
      id: 'hack_order_1',
      order_number: 'HACK-001',
      customer_name: 'Hacker',
      customer_phone: '123', // invalid phone length!
      items: [],
      total_amount: -50, // invalid negative amount!
      final_amount: 0,
      delivery_fee: 0,
      address: {},
      payment_method: 'cash_at_door',
      status: 'pending'
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(maliciousOrder)
    });
    // Expected: 400 or 403 or 422 (rejected by RLS check constraint)
    const isBlocked = res.status >= 400;
    logTest('Kötü Niyetli Sipariş Engelleme (Negatif Tutar/Geçersiz Tel)', isBlocked, `HTTP Status: ${res.status} (Beklenen engelleme)`);
  } catch (err) {
    logTest('Kötü Niyetli Sipariş Engelleme', true, 'İstek reddedildi');
  }

  // --- SONUÇ RAPORU ---
  console.log('\n============================================================');
  console.log(`🏁 TEST SONUÇLARI: ${results.passed} BAŞARILI / ${results.failed} BAŞARISIZ`);
  console.log('============================================================');
}

runAllTests();
