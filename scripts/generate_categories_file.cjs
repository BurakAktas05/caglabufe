const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const wb = xlsx.readFile('stok.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const counts = {};
rows.forEach(r => {
  const c = String(r['KATEGORİ'] || '').trim();
  if (c) counts[c] = (counts[c] || 0) + 1;
});

const sortedCats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

function getIconForCat(c) {
  const l = c.toLowerCase();
  if (l.includes('çikolata')) return 'Candy';
  if (l.includes('sakız') || l.includes('şeker')) return 'Smile';
  if (l.includes('meyve')) return 'Apple';
  if (l.includes('bisküvi') || l.includes('cips') || l.includes('kraker') || l.includes('mısır ve pirinç')) return 'Cookie';
  if (l.includes('gofret') || l.includes('kek')) return 'Croissant';
  if (l.includes('enerji')) return 'Zap';
  if (l.includes('çay') || l.includes('kahve') || l.includes('sahlep')) return 'Coffee';
  if (l.includes('su') || l.includes('soda') || l.includes('kola') || l.includes('gazoz') || l.includes('şerbet') || l.includes('limonata') || l.includes('içecek')) return 'Droplets';
  if (l.includes('süt') || l.includes('yoğurt') || l.includes('ayran')) return 'Milk';
  if (l.includes('peynir') || l.includes('sucuk') || l.includes('salam') || l.includes('füme') || l.includes('helva') || l.includes('bal') || l.includes('zeytin') || l.includes('sos') || l.includes('ketçap') || l.includes('mayonez') || l.includes('salça') || l.includes('yağ') || l.includes('tuz') || l.includes('şeker') || l.includes('ton balığı') || l.includes('turşu') || l.includes('makarna') || l.includes('yemek') || l.includes('gevrek') || l.includes('konserve')) return 'Utensils';
  if (l.includes('noodle') || l.includes('çorba')) return 'Soup';
  if (l.includes('fıstık') || l.includes('fındık') || l.includes('badem') || l.includes('leblebi') || l.includes('çekirdek') || l.includes('kaju') || l.includes('kuruyemiş')) return 'Nut';
  if (l.includes('ped')) return 'Shield';
  if (l.includes('şampuan') || l.includes('sabun') || l.includes('diş') || l.includes('kolonya') || l.includes('mendil') || l.includes('pamuk') || l.includes('deterjan') || l.includes('temizle') || l.includes('yumuşatıcı') || l.includes('çamaşır suyu') || l.includes('tıraş') || l.includes('yarabandı') || l.includes('koku')) return 'Sparkles';
  if (l.includes('kağıt') || l.includes('tuvalet')) return 'Layers';
  if (l.includes('kedi') || l.includes('mama')) return 'Heart';
  if (l.includes('çakmak') || l.includes('kibrit') || l.includes('tost')) return 'Flame';
  if (l.includes('pil')) return 'BatteryCharging';
  if (l.includes('kamp')) return 'Tent';
  return 'Package';
}

function getDescriptionForCat(c) {
  const l = c.toLowerCase();
  if (l.includes('çikolata')) return 'Kare, tablet, bar ve dolgulu çikolatalar';
  if (l.includes('bisküvi')) return 'Kremalı, kakaolu ve taze bisküviler';
  if (l.includes('kek')) return 'Dolgulu, meyveli ve kakaolu kek çeşitleri';
  if (l.includes('gofret')) return 'Çıtır gofretler ve atıştırmalıklar';
  if (l.includes('cips')) return 'Patates ve mısır cipsleri';
  if (l.includes('enerji')) return 'Enerji ve canlandırıcı soğuk içecekler';
  if (l.includes('peynir')) return 'Taze labne, beyaz peynir ve kaşar çeşitleri';
  if (l.includes('sucuk') || l.includes('salam') || l.includes('füme')) return 'Şarküteri lezzetleri ve pratik et ürünleri';
  if (l.includes('süt')) return 'Taze günlük ve aromalı süt çeşitleri';
  if (l.includes('deterjan') || l.includes('temizle') || l.includes('çamaşır')) return 'Ev ve bulaşık temizlik ürünleri';
  if (l.includes('şampuan') || l.includes('sabun') || l.includes('diş')) return 'Kişisel bakım ve hijyen ürünleri';
  if (l.includes('kahve')) return 'Filtre, granül ve pratik kahve çeşitleri';
  if (l.includes('çay')) return 'Poşet, dökme ve bitki çayları';
  return `${c} çeşitleri ve lezzetleri`;
}

// Also keep hot food categories for buffet kitchen
const hotFoods = [
  { id: 'Tost & Sıcak Lezzetler', name: 'Tost & Sıcak Lezzetler', icon: 'Flame', description: 'Karışık tost, Ayvalık tostu, bazlama ve sıcak büfe ürünleri' },
  { id: 'Sandviç', name: 'Sandviç', icon: 'Croissant', description: 'Soğuk ve sıcak sandviç çeşitleri' },
];

let code = `import { CategoryInfo } from '@/types';

// Tüm Reyon & Kategori Kataloğu (${sortedCats.length} Kategori)
export const CATEGORIES: CategoryInfo[] = [
`;

hotFoods.forEach(h => {
  code += `  { id: '${h.id}', name: '${h.name}', icon: '${h.icon}', description: '${h.description}' },\n`;
});

sortedCats.forEach(c => {
  const icon = getIconForCat(c);
  const desc = getDescriptionForCat(c);
  code += `  { id: '${c}', name: '${c}', icon: '${icon}', description: '${desc}' },\n`;
});

code += `];\n`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'categories.ts'), code, 'utf8');
console.log('Successfully wrote src/data/categories.ts with', sortedCats.length + hotFoods.length, 'categories');
