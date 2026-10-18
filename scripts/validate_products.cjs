const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoRows = tgoData.slice(1);

const seenBarcodes = new Map();
const duplicates = [];
const cleanProducts = [];

tgoRows.forEach((row, idx) => {
  const barcode = String(row[0] || '').trim().replace(/[^0-9]/g, '');
  const brand = String(row[1] || '').trim();
  const category = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  const description = String(row[4] || '').trim();
  const image = String(row[6] || '').trim();
  const kdv = Number(row[7]) || 10;

  if (!name || !image) {
    return; // skip rows with no name or image
  }

  const prodId = barcode ? `prod_${barcode}` : `prod_gen_${idx}`;

  if (barcode && seenBarcodes.has(barcode)) {
    duplicates.push({ barcode, name, prev: seenBarcodes.get(barcode) });
  } else {
    if (barcode) seenBarcodes.set(barcode, name);
    cleanProducts.push({
      id: prodId,
      name,
      brand,
      category,
      price: 75,
      image_url: image,
      description: description || `${brand} ${name}`,
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
  }
});

console.log(`Unique clean products to insert: ${cleanProducts.length}`);
console.log(`Duplicate barcodes found: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log('Duplicates:', duplicates);
}
console.log('\nSample 3 products to insert:');
console.log(JSON.stringify(cleanProducts.slice(0, 3), null, 2));
