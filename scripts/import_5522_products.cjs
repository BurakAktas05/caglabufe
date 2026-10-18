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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const excelDir = path.join(__dirname, '..', 'excel');
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoRows = tgoData.slice(1);

async function run() {
  console.log('--- STEP 1: Reading Excel File ---');
  const seenBarcodes = new Set();
  const productsToInsert = [];

  tgoRows.forEach((row, idx) => {
    const barcode = String(row[0] || '').trim().replace(/[^0-9]/g, '');
    const brand = String(row[1] || '').trim();
    const category = String(row[2] || '').trim();
    const name = String(row[3] || '').trim();
    const description = String(row[4] || '').trim();
    const image = String(row[6] || '').trim();
    const kdv = Number(row[7]) || 10;

    if (!name || !image) return;

    if (barcode && seenBarcodes.has(barcode)) return;
    if (barcode) seenBarcodes.add(barcode);

    const prodId = barcode ? `prod_${barcode}` : `prod_gen_${idx}`;

    productsToInsert.push({
      id: prodId,
      name,
      category,
      price: 75, // Default 75 TL per user instruction
      discount_price: null,
      image_url: image,
      description: description || (brand ? `${brand} - ${name}` : name),
      unit: 'Adet',
      barcode: barcode || null,
      is_available: true,
      is_kitchen_item: false,
      prep_time_minutes: 0,
      options: { brand, kdv },
      search_keywords: Array.from(
        new Set(
          [
            brand.toLowerCase(),
            category.toLowerCase(),
            barcode,
            ...name.toLowerCase().split(/[\s,\.\-]+/).filter(w => w.length > 1)
          ].filter(Boolean)
        )
      )
    });
  });

  console.log(`Prepared ${productsToInsert.length} clean products to insert.`);

  console.log('--- STEP 2: Cleaning old products from Supabase ---');
  // Delete all existing products in Supabase
  const { error: delErr } = await supabase.from('products').delete().neq('id', 'PLACEHOLDER_NEVER_MATCH');
  if (delErr) {
    console.error('Delete error:', delErr.message);
  } else {
    console.log('Existing products cleared successfully.');
  }

  console.log('--- STEP 3: Inserting products in batches ---');
  const batchSize = 100;
  for (let i = 0; i < productsToInsert.length; i += batchSize) {
    const batch = productsToInsert.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('products').insert(batch);
    if (insErr) {
      console.error(`Batch insert error at index ${i}:`, insErr.message);
    } else {
      console.log(`Inserted batch ${i + 1} to ${Math.min(i + batchSize, productsToInsert.length)}`);
    }
  }

  console.log('--- STEP 4: Verifying count in Supabase ---');
  const { count, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
  if (countErr) {
    console.error('Count error:', countErr.message);
  } else {
    console.log(`SUCCESS! Total products in Supabase: ${count}`);
  }
}

run();
