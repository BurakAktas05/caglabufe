const xlsx = require('xlsx');
const wb = xlsx.readFile('stok.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const counts = {};
rows.forEach(r => {
  const c = String(r['KATEGORİ'] || '').trim();
  if (c) counts[c] = (counts[c] || 0) + 1;
});

const cats = Object.keys(counts).sort();

// Let's inspect each category
console.log('Total categories:', cats.length);
cats.forEach(c => console.log(`${c} (${counts[c]})`));
