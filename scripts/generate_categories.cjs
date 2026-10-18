const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoRows = tgoData.slice(1);

const categoryCounts = new Map();
tgoRows.forEach(row => {
  const cat = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  if (cat && name) {
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }
});

const sortedCats = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);

console.log('Categories count:', sortedCats.length);
sortedCats.forEach(([cat, count]) => {
  console.log(`{ id: '${cat}', name: '${cat}', count: ${count} },`);
});
