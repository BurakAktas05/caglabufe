const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const tgoPath = path.join(excelDir, 'ÜrünOlusturma_5522d054-4f10-4c3f-b430-dfa3bc18d348.xlsx');
const tgoWb = xlsx.readFile(tgoPath);
const tgoData = xlsx.utils.sheet_to_json(tgoWb.Sheets['Ürünlerinizi Burada Listeleyin'], { header: 1 });
const tgoHeaders = tgoData[0];
const tgoRows = tgoData.slice(1);

console.log('Headers:', tgoHeaders);
console.log('Total rows:', tgoRows.length);

const categories = new Map();
const brands = new Map();
let emptyBarcodes = 0;
let emptyNames = 0;
let emptyImages = 0;

const cleanProducts = [];

tgoRows.forEach((row, idx) => {
  const barcode = String(row[0] || '').trim().replace(/[^0-9]/g, '');
  const brand = String(row[1] || '').trim();
  const category = String(row[2] || '').trim();
  const name = String(row[3] || '').trim();
  const description = String(row[4] || '').trim();
  const image = String(row[6] || '').trim();
  const kdv = Number(row[7]) || 10;

  if (!barcode) emptyBarcodes++;
  if (!name) emptyNames++;
  if (!image) emptyImages++;

  if (category) {
    categories.set(category, (categories.get(category) || 0) + 1);
  }
  if (brand) {
    brands.set(brand, (brands.get(brand) || 0) + 1);
  }

  if (name) {
    cleanProducts.push({
      barcode,
      brand,
      category,
      name,
      description,
      image,
      kdv
    });
  }
});

console.log(`Valid products count: ${cleanProducts.length}`);
console.log(`Empty barcodes: ${emptyBarcodes}, Empty names: ${emptyNames}, Empty images: ${emptyImages}`);
console.log('\nCategories breakdown (sorted by count):');
const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
sortedCategories.forEach(([cat, count]) => {
  console.log(`- ${cat}: ${count}`);
});

console.log(`\nTotal unique categories: ${categories.size}`);
console.log(`Total unique brands: ${brands.size}`);
console.log('\nTop 20 brands:');
const sortedBrands = Array.from(brands.entries()).sort((a, b) => b[1] - a[1]);
sortedBrands.slice(0, 20).forEach(([brand, count]) => {
  console.log(`- ${brand}: ${count}`);
});
