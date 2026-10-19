const xlsx = require('xlsx');
const fs = require('fs');

const wb = xlsx.readFile('stok.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
const excelCats = new Set();
rows.forEach(r => {
  const c = String(r['KATEGORİ'] || '').trim();
  if (c) excelCats.add(c);
});

const catFile = fs.readFileSync('src/data/categories.ts', 'utf8');
const missing = [];
excelCats.forEach(c => {
  if (!catFile.includes(`'${c}'`) && !catFile.includes(`"${c}"`)) {
    missing.push(c);
  }
});

console.log('Total excel categories:', excelCats.size);
console.log('Missing from categories.ts count:', missing.length);
console.log('Missing:', missing);
