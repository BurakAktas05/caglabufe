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

const posMap = new Map();
posRows.forEach(r => {
  const b = cleanBarcode(r[0]);
  if (b) {
    posMap.set(b, {
      barcode: b,
      name: r[1],
      stock: Number(r[2]) || 0,
      price: Number(r[4]) || 0,
      costPrice: Number(r[6]) || 0,
      group: r[8]
    });
  }
});

const tgoUnmatched = [];
tgoRows.forEach(r => {
  const b = cleanBarcode(r[0]);
  if (b && !posMap.has(b)) {
    tgoUnmatched.push({
      barcode: b,
      brand: r[1],
      category: r[2],
      name: r[3],
      image: r[6]
    });
  }
});

console.log(`TGO items unmatched in BenimPOS: ${tgoUnmatched.length}`);
tgoUnmatched.forEach(t => console.log(`- [${t.barcode}] ${t.brand} | ${t.category} | ${t.name}`));
