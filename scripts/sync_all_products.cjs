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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const seenBarcodes = new Set();
  const allProducts = [];

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

    allProducts.push({
      id: prodId,
      name,
      category,
      price: 75,
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

  console.log(`Total target products from Excel: ${allProducts.length}`);

  // Fetch already inserted IDs from Supabase
  const { data: existingRows, error: fetchErr } = await supabase.from('products').select('id');
  if (fetchErr) {
    console.error('Fetch existing error:', fetchErr);
    return;
  }
  const existingIds = new Set((existingRows || []).map(r => r.id));
  console.log(`Already in Supabase: ${existingIds.size}`);

  const missingProducts = allProducts.filter(p => !existingIds.has(p.id));
  console.log(`Products to upsert: ${missingProducts.length}`);

  if (missingProducts.length === 0) {
    console.log('All products already synced!');
  } else {
    const batchSize = 25;
    for (let i = 0; i < missingProducts.length; i += batchSize) {
      const batch = missingProducts.slice(i, i + batchSize);
      let success = false;
      let attempts = 0;

      while (!success && attempts < 5) {
        attempts++;
        try {
          const { error: insErr } = await supabase.from('products').upsert(batch);
          if (insErr) {
            console.warn(`[Attempt ${attempts}] Batch ${i} error:`, insErr.message);
            await sleep(1500 * attempts);
          } else {
            success = true;
            console.log(`Upserted ${i + 1} to ${Math.min(i + batchSize, missingProducts.length)} of missing.`);
          }
        } catch (err) {
          console.warn(`[Attempt ${attempts}] Exception:`, err.message);
          await sleep(1500 * attempts);
        }
      }

      await sleep(250); // Be gentle with Supabase free tier
    }
  }

  // Final count
  const { count, error: countErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log(`\nFINAL COUNT IN SUPABASE: ${count} / ${allProducts.length}`);
}

run();
