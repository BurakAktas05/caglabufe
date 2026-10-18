const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');

// 1. Inspect BenimPOS
const posPath = path.join(excelDir, 'Ürünler Dışa Aktar -  BenimPOS.xlsx');
const posWb = xlsx.readFile(posPath);
const posData = xlsx.utils.sheet_to_json(posWb.Sheets['Sheet1'], { header: 1 });

const posHeaders = posData[1];
const posRows = posData.slice(2);

console.log('--- BenimPOS Analysis ---');
console.log('Total rows:', posRows.length);
console.log('Headers:', posHeaders);

// 2. Inspect Trendyol Go ÜrünOlusturma
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });

const tgoHeaders = tgoData[0];
const tgoRows = tgoData.slice(1);

console.log('\n--- Trendyol Go (TGO) Analysis ---');
console.log('Total rows:', tgoRows.length);
console.log('Headers:', tgoHeaders);

// Let's check barcode formats
function cleanBarcode(b) {
  if (!b) return '';
  return String(b).replace(/[^0-9]/g, '').trim();
}

const tgoBarcodes = new Map();
tgoRows.forEach(row => {
  const barcode = cleanBarcode(row[0]);
  if (barcode) {
    tgoBarcodes.set(barcode, {
      barcode,
      brand: row[1],
      category: row[2],
      name: row[3],
      description: row[4],
      image: row[6],
      kdv: row[7]
    });
  }
});
console.log(`TGO unique valid barcodes: ${tgoBarcodes.size}`);

const posProducts = [];
const priceCounts = { zeroOrNegative: 0, valid: 0 };
const groupCounts = {};

posRows.forEach(row => {
  const barcode = cleanBarcode(row[0]);
  const name = String(row[1] || '').trim();
  const stock = Number(row[2]) || 0;
  const unit = row[3] || 'Adet';
  const price = Number(row[4]) || 0;
  const group = row[8] || 'DİĞER';

  groupCounts[group] = (groupCounts[group] || 0) + 1;

  if (price <= 0) {
    priceCounts.zeroOrNegative++;
  } else {
    priceCounts.valid++;
  }

  posProducts.push({
    barcode,
    rawBarcode: row[0],
    name,
    stock,
    unit,
    price,
    group,
    row
  });
});

console.log('BenimPOS Price stats:', priceCounts);
console.log('BenimPOS Groups:', groupCounts);

// Check barcode matches
let matchedCount = 0;
posProducts.forEach(p => {
  if (p.barcode && tgoBarcodes.has(p.barcode)) {
    matchedCount++;
  }
});
console.log(`Matched barcodes between BenimPOS and TGO: ${matchedCount}`);

// Inspect items with price <= 0 or weird names in BenimPOS
console.log('\nSample zero/low price or unusual items in BenimPOS:');
const unusual = posProducts.filter(p => p.price <= 1 || p.name.length < 3 || /diger|test|poset|koli/i.test(p.name));
console.log(`Total unusual items: ${unusual.length}`);
unusual.slice(0, 20).forEach(u => console.log(`- [${u.barcode}] ${u.name} (Fiyat: ${u.price}, Grup: ${u.group})`));

// Inspect TGO sample rows
console.log('\nSample TGO items:');
Array.from(tgoBarcodes.values()).slice(0, 10).forEach(t => {
  console.log(`- [${t.barcode}] ${t.brand} | ${t.category} | ${t.name} | Image: ${t.image ? 'YES' : 'NO'}`);
});
