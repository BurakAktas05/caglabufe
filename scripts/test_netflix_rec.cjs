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
    products.push({ barcode, brand, category, name, price: 75 });
  }
});

const RELATED_CATEGORY_MAP = {
  'Soğuk Çay': ['Enerji İçeceği', 'Soğuk Kahve', 'Gazoz', 'Kola', 'Meyve Suyu', 'Limonata', 'Soda'],
  'Enerji İçeceği': ['Soğuk Çay', 'Soğuk Kahve', 'Kola', 'Gazoz', 'Cips'],
  'Kola': ['Enerji İçeceği', 'Gazoz', 'Soğuk Çay', 'Cips', 'Kraker'],
  'Gazoz': ['Kola', 'Enerji İçeceği', 'Soğuk Çay', 'Soda', 'Cips'],
  'Soda': ['Gazoz', 'Meyve Suyu', 'Soğuk Çay', 'Enerji İçeceği'],
  'Soğuk Kahve': ['Enerji İçeceği', 'Soğuk Çay', 'Kek', 'Bisküvi', 'Çikolata'],
  'Çikolata': ['Gofret', 'Bisküvi', 'Kek', 'Şekerleme', 'Atıştırmalık Bar'],
  'Gofret': ['Çikolata', 'Bisküvi', 'Kek'],
  'Bisküvi': ['Kek', 'Gofret', 'Çikolata', 'Kraker'],
  'Kek': ['Bisküvi', 'Çikolata', 'Gofret', 'Soğuk Kahve'],
  'Cips': ['Yer Fıstığı', 'Ay Çekirdeği', 'Kraker', 'Kola', 'Gazoz', 'Enerji İçeceği'],
  'Yer Fıstığı': ['Cips', 'Ay Çekirdeği', 'Kaju', 'Fındık', 'Kola', 'Gazoz'],
  'Ay Çekirdeği': ['Yer Fıstığı', 'Cips', 'Kola', 'Gazoz', 'Soda'],
  'Hazır Noodle': ['Hazır Çorba', 'Makarna', 'Ketçap'],
  'Hazır Çorba': ['Hazır Noodle', 'Makarna'],
};

function getNetflixRecommendations(directMatches, allProducts, limit = 8) {
  const directIds = new Set(directMatches.map(p => p.barcode || p.name));
  const directCats = Array.from(new Set(directMatches.map(p => p.category)));
  
  // Find target related categories
  const targetRelatedCats = new Set();
  directCats.forEach(cat => {
    const related = RELATED_CATEGORY_MAP[cat];
    if (related) {
      related.forEach(rc => targetRelatedCats.add(rc));
    }
  });

  // Pick top items from related categories
  const recommendations = [];
  const chosenBrands = new Set();

  for (const cat of targetRelatedCats) {
    const candidates = allProducts.filter(p => p.category === cat && !directIds.has(p.barcode || p.name));
    for (const c of candidates) {
      if (!chosenBrands.has(c.brand) || recommendations.length < 4) {
        recommendations.push(c);
        if (c.brand) chosenBrands.add(c.brand);
      }
      if (recommendations.length >= limit) break;
    }
    if (recommendations.length >= limit) break;
  }

  return { directCats, targetRelatedCats: Array.from(targetRelatedCats), recommendations };
}

// Test with Fuse Tea
const fuseTeaMatches = products.filter(p => (p.brand || '').toLowerCase().includes('fuse') || p.name.toLowerCase().includes('fuse'));
console.log(`Fuse Tea direct matches: ${fuseTeaMatches.length}`);
const res = getNetflixRecommendations(fuseTeaMatches, products, 8);
console.log('Related categories for Fuse Tea:', res.targetRelatedCats);
console.log('\nNetflix-style recommendations:');
res.recommendations.forEach(r => console.log(`  - [${r.brand}] ${r.name} (${r.category})`));
