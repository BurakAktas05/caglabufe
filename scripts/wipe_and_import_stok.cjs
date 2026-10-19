const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Backup/fallback prices for the 18 items without explicit FİYAT 1 in stok.xlsx
const fallbackPrices = {
  '8690527021422': 150, // Şölen Dana Sucuk 180 Gr
  '7613287484185': 55,  // Felix Ton Balıklı Yetişkin Kedi Konservesi 85gr
  '8682923925282': 30,  // Ayran Yayık 275 Ml
  '8690840164639': 35,  // Oneo Ekşi Elma & Limon Aromalı Şekersiz Sakız 27 Gr
  '8681771623197': 100, // Yüzey Temizleme Havlusu 102'li
  '8697447041097': 25,  // Salep Stick 20 Gr
  '8680908029000': 65,  // Noodle Tavuk Çeşnili Hazır 5'li
  '8681128258690': 45,  // Tabak Karton 10'lu
  '8682134081753': 30,  // Lc Love Kalp Çikolata 18 Gr
  '8690527021088': 130, // Sucuk Hindi Mangal Keyfi 300 Gr
  '8680908029017': 65,  // Noodle Köri Çeşnili 375 Gr 5'li
  '8690504077534': 30,  // Çizi Çıtır Peynir & Soğan 50 Gr
  '8680908029024': 65,  // Noodle Spesyal Hazır 5'li
  '8680908029031': 65,  // Noodle Sebze Çeşnili 5'li
  '8718951384293': 85,  // Sabun Saf Ve Doğal Kalıp 4x150 Gr
  '8690632013657': 60,  // Coffe Mate 100 Gr
  '8690632248868': 90,  // Gold %20 Bedava 60 Gr
  '8690504039280': 35   // Halley Mini Çikolata Kaplamalı Sandviç Bisküvi 66 Gr
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== 1. Wiping old database products and test data ===');

  // 1. Wipe all products
  const { error: delProdErr } = await supabase.from('products').delete().neq('id', '___NEVER_MATCH___');
  if (delProdErr) {
    console.error('Error deleting products:', delProdErr);
    process.exit(1);
  }
  console.log('✔ All old products wiped from database.');

  // 2. Wipe test orders
  const { error: delOrderErr } = await supabase.from('orders').delete().neq('id', '___NEVER_MATCH___');
  if (delOrderErr) {
    console.warn('Notice on deleting orders:', delOrderErr.message);
  } else {
    console.log('✔ All test orders wiped from database.');
  }

  // 3. Clean test campaigns if any
  const { error: delCampErr } = await supabase.from('campaigns').delete().in('id', ['camp_lk6ax2a', 'camp_2ttv7s2']);
  if (delCampErr) {
    console.warn('Notice on cleaning test campaigns:', delCampErr.message);
  } else {
    console.log('✔ Test campaigns cleaned.');
  }

  // 4. Verify products count is 0
  const { count: zeroCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`Current products count in DB: ${zeroCount} (expected 0)`);

  console.log('\n=== 2. Reading and processing stok.xlsx ===');
  const stokPath = path.join(__dirname, '..', 'stok.xlsx');
  const wb = xlsx.readFile(stokPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Read ${rows.length} rows from stok.xlsx`);

  const seenBarcodes = new Set();
  const productsToInsert = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const barcode = String(r['BARKOD'] || '').trim().replace(/[^0-9]/g, '');
    const brand = String(r['MARKA'] || '').trim();
    const category = String(r['KATEGORİ'] || '').trim();
    const name = String(r['ÜRÜN ADI'] || '').trim();
    let price = Number(r['FİYAT 1']);
    const kdv = Number(r['KDV (%)']) || 1;
    const imageUrl = String(r['GÖRSEL LİNKİ'] || '').trim();

    if (!name || !imageUrl) {
      console.warn(`Skipping row ${idx} due to missing name or image:`, r);
      continue;
    }

    if (isNaN(price) || price <= 0) {
      if (fallbackPrices[barcode]) {
        price = fallbackPrices[barcode];
      } else {
        price = 50; // safe fallback
      }
    }

    if (barcode && seenBarcodes.has(barcode)) {
      console.warn(`Duplicate barcode found: ${barcode}, skipping duplicate.`);
      continue;
    }
    if (barcode) seenBarcodes.add(barcode);

    const prodId = barcode ? `prod_${barcode}` : `prod_gen_${idx}`;
    const description = brand ? `${brand} - ${name}` : name;

    const nameTokens = name
      .toLowerCase()
      .split(/[\s,\.\-\+\(\)\/]+/)
      .filter(w => w.length > 1);

    const searchKeywords = Array.from(
      new Set(
        [
          brand.toLowerCase(),
          category.toLowerCase(),
          barcode,
          ...nameTokens
        ].filter(Boolean)
      )
    );

    productsToInsert.push({
      id: prodId,
      name,
      category,
      price: Math.round(price * 100) / 100,
      discount_price: null,
      image_url: imageUrl,
      description,
      unit: 'Adet',
      barcode: barcode || null,
      is_available: true,
      is_kitchen_item: false,
      prep_time_minutes: 0,
      options: {
        brand,
        kdv,
        stock: 100
      },
      search_keywords: searchKeywords
    });
  }

  console.log(`Prepared ${productsToInsert.length} valid products to insert.`);

  console.log('\n=== 3. Inserting products in batches ===');
  const batchSize = 50;
  for (let i = 0; i < productsToInsert.length; i += batchSize) {
    const batch = productsToInsert.slice(i, i + batchSize);
    let attempts = 0;
    let success = false;

    while (!success && attempts < 5) {
      attempts++;
      const { error: insErr } = await supabase.from('products').insert(batch);
      if (insErr) {
        console.warn(`[Batch ${i / batchSize + 1}] Attempt ${attempts} error:`, insErr.message);
        await sleep(1000 * attempts);
      } else {
        success = true;
        console.log(`Inserted batch ${i / batchSize + 1} (${i + 1} - ${Math.min(i + batchSize, productsToInsert.length)} of ${productsToInsert.length})`);
      }
    }

    if (!success) {
      console.error(`Failed to insert batch starting at ${i} after 5 attempts.`);
      process.exit(1);
    }

    await sleep(150);
  }

  // Final count check
  const { count: finalCount, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
  if (countErr) {
    console.error('Error fetching final count:', countErr);
  } else {
    console.log(`\n🎉 FINAL PRODUCTS IN SUPABASE: ${finalCount} / ${productsToInsert.length}`);
  }
}

main().catch(err => {
  console.error('Unhandled error in main:', err);
  process.exit(1);
});
