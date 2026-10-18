const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoRows = tgoData.slice(1);

const products = [];
tgoRows.forEach(row => {
  const barcode = String(row[0] || '').trim().replace(/[^0-9]/g, '');
  const brand = String(row[1] || '').trim();
  const category = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  if (name) {
    products.push({ barcode, brand, category, name });
  }
});

console.log(`Loaded ${products.length} products.`);

function searchTest(q) {
  const normQ = q.toLowerCase().replace(/\s+/g, '');
  const direct = products.filter(p => {
    const normName = p.name.toLowerCase().replace(/\s+/g, '');
    const normBrand = (p.brand || '').toLowerCase().replace(/\s+/g, '');
    return normName.includes(normQ) || normBrand.includes(normQ);
  });
  console.log(`\nQuery "${q}": Found ${direct.length} direct matches.`);
  direct.slice(0, 5).forEach(p => console.log(`  - [${p.brand}] ${p.name} (${p.category})`));

  // Determine categories of direct matches
  const directCats = Array.from(new Set(direct.map(p => p.category)));
  console.log('  Direct Categories:', directCats);
}

searchTest('fusetea');
searchTest('fuse tea');
searchTest('red bull');
searchTest('cips');
