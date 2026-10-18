const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');

const posPath = path.join(excelDir, 'Ürünler Dışa Aktar -  BenimPOS.xlsx');
const posWb = xlsx.readFile(posPath);
const posData = xlsx.utils.sheet_to_json(posWb.Sheets['Sheet1'], { header: 1 });
const posRows = posData.slice(2);

const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoRows = tgoData.slice(1);

function cleanBarcode(b) {
  if (!b) return '';
  return String(b).replace(/[^0-9]/g, '').trim();
}

const tgoMap = new Map();
tgoRows.forEach(row => {
  const barcode = cleanBarcode(row[0]);
  if (barcode) {
    tgoMap.set(barcode, {
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

const posItems = posRows.map(row => ({
  barcode: cleanBarcode(row[0]),
  rawBarcode: row[0],
  name: String(row[1] || '').trim(),
  stock: Number(row[2]) || 0,
  unit: row[3] || 'Adet',
  price: Number(row[4]) || 0,
  costPrice: Number(row[6]) || 0,
  group: String(row[8] || '').trim()
}));

console.log('=== SİSTEM ITEMS ===');
posItems.filter(p => p.group === 'SİSTEM').forEach(p => console.log(p));

console.log('\n=== DİĞER ITEMS ===');
posItems.filter(p => p.group === 'DİĞER' || /diger/i.test(p.name)).forEach(p => console.log(p));

console.log('\n=== SİGARA ITEMS (Sample) ===');
const sigaraItems = posItems.filter(p => p.group === 'SİGARA' || /parliament|marlboro|winston|kent|camel|chesterfield|rothmans|touch/i.test(p.name));
console.log(`Total Sigara/Tobacco items in BenimPOS: ${sigaraItems.length}`);
sigaraItems.slice(0, 5).forEach(p => console.log(`- [${p.barcode}] ${p.name} - ${p.price} TL`));

console.log('\n=== TGO Categories ===');
const tgoCategories = {};
for (const t of tgoMap.values()) {
  tgoCategories[t.category] = (tgoCategories[t.category] || 0) + 1;
}
console.log('TGO Categories count:', Object.keys(tgoCategories).length);
console.log(tgoCategories);

console.log('\n=== BenimPOS Unmatched in TGO (Sample) ===');
const posUnmatched = posItems.filter(p => !tgoMap.has(p.barcode));
console.log(`Total BenimPOS items NOT in TGO: ${posUnmatched.length}`);
const posUnmatchedNonSigara = posUnmatched.filter(p => p.group !== 'SİGARA' && !/diger/i.test(p.name));
console.log(`BenimPOS non-sigara, non-diger unmatched: ${posUnmatchedNonSigara.length}`);
console.log('Sample 30 unmatched non-sigara:');
posUnmatchedNonSigara.slice(0, 30).forEach(p => console.log(`- [${p.barcode}] [${p.group}] ${p.name} - ${p.price} TL`));
