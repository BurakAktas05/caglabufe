const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const posPath = path.join(excelDir, 'Ürünler Dışa Aktar -  BenimPOS.xlsx');
const posWb = xlsx.readFile(posPath);
const posData = xlsx.utils.sheet_to_json(posWb.Sheets['Sheet1'], { header: 1 });
const posRows = posData.slice(2);

function cleanBarcode(b) {
  if (!b) return '';
  return String(b).replace(/[^0-9]/g, '').trim();
}

const posItems = posRows.map(row => ({
  barcode: cleanBarcode(row[0]),
  rawBarcode: row[0],
  name: String(row[1] || '').trim(),
  stock: Number(row[2]) || 0,
  unit: row[3] || 'Adet',
  price: Number(row[4]) || 0,
  costPrice: Number(row[6]) || 0,
  group: String(row[8] || '').trim(),
  detail: row[11] || null
}));

// Check for suspicious patterns:
// 1. Very short names (< 4 chars)
// 2. DIGER / DİĞER
// 3. Negative stock or 0 price
// 4. Test names
// 5. Sigara / Puro / Tütün / Terea / Heets / Vozol
const suspicious = posItems.filter(p => {
  const n = p.name.toUpperCase();
  return (
    p.price <= 2 ||
    n.length < 4 ||
    n.includes('DIGER') ||
    n.includes('DİĞER') ||
    p.group === 'SİSTEM' ||
    p.group === 'SİGARA' ||
    n.includes('PURO') ||
    n.includes('VOZOL') ||
    n.includes('TEREA') ||
    n.includes('HEETS') ||
    n.includes('TEST')
  );
});

console.log(`Total suspicious items found: ${suspicious.length}`);
console.log('Sample 30 suspicious items:');
suspicious.slice(0, 30).forEach(s => console.log(`- [${s.barcode}] [${s.group}] ${s.name} - ${s.price} TL`));

console.log('\nSample legitimate non-TGO items in BenimPOS:');
const legitNonTgo = posItems.filter(p => !suspicious.includes(p));
console.log(`Legitimate items count: ${legitNonTgo.length}`);
legitNonTgo.slice(0, 20).forEach(l => console.log(`- [${l.barcode}] [${l.group}] ${l.name} - ${l.price} TL`));
