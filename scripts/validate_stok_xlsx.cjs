const xlsx = require('xlsx');

const wb = xlsx.readFile('stok.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log('Total rows:', rows.length);

let missingBarcode = 0;
let missingName = 0;
let missingPrice = 0;
let missingImage = 0;
let missingCategory = 0;
let barcodeCounts = {};
let categories = new Set();

rows.forEach((r, idx) => {
  const barcode = r['BARKOD'] ? String(r['BARKOD']).trim() : '';
  const name = r['ÜRÜN ADI'] ? String(r['ÜRÜN ADI']).trim() : '';
  const price = Number(r['FİYAT 1']);
  const image = r['GÖRSEL LİNKİ'] ? String(r['GÖRSEL LİNKİ']).trim() : '';
  const category = r['KATEGORİ'] ? String(r['KATEGORİ']).trim() : '';

  if (!barcode) missingBarcode++;
  else barcodeCounts[barcode] = (barcodeCounts[barcode] || 0) + 1;

  if (!name) missingName++;
  if (isNaN(price) || price <= 0) missingPrice++;
  if (!image) missingImage++;
  if (!category) missingCategory++;
  else categories.add(category);
});

const duplicateBarcodes = Object.entries(barcodeCounts).filter(([b, c]) => c > 1);

console.log({
  missingBarcode,
  missingName,
  missingPrice,
  missingImage,
  missingCategory,
  duplicateBarcodesCount: duplicateBarcodes.length,
  totalCategories: categories.size
});

if (duplicateBarcodes.length > 0) {
  console.log('Sample duplicates:', duplicateBarcodes.slice(0, 5));
}

console.log('Categories:', Array.from(categories).sort());
