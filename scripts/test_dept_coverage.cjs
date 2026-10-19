const xlsx = require('xlsx');
const wb = xlsx.readFile('stok.xlsx');
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const deptMap = {
  'kantin-atistirmalik': [
    'Çikolata', 'Gofret', 'Bisküvi', 'Kek', 'Sakız', 'Şekerleme', 'Çubuk Kraker', 'Kraker', 'Atıştırmalık Bar', 'Sağlıklı Atıştırmalık', 'Bebek Bisküvisi', 'Mısır ve Pirinç Patlağı'
  ],
  'soguk-icecek': [
    'Meyve Suyu', 'Soğuk Çay', 'Gazoz', 'Soda', 'Kola', 'Soğuk Kahve', 'Diğer Gazlı İçecek', 'Diğer Gazsız İçecek', 'Limonata', 'Aromalı Süt', 'Ayran', 'Su', 'Ramazan Şerbeti', 'Malt İçecek'
  ],
  'enerji-icecek': [
    'Enerji İçeceği'
  ],
  'cips-cerez': [
    'Cips', 'Yer Fıstığı', 'Ay Çekirdeği', 'Patlayan Mısır', 'Fındık', 'Leblebi', 'Antep Fıstığı', 'Badem', 'Kaju', 'Karışık Kuruyemiş', 'Kabak Çekirdeği', 'Diğer Kuruyemiş'
  ],
  'hazir-yiyecek': [
    'Hazır Noodle', 'Hazır Çorba', 'Makarna', 'Hazır Yemek', 'Ketçap', 'Mayonez', 'Acı Sos', 'Diğer Sos', 'Kahvaltılık Sos', 'Tost & Sıcak Lezzetler', 'Tost', 'Sandviç', 'Sıcak Sandviç', 'Sıcak Lezzetler', 'Büfe'
  ],
  'kahve-cay': [
    'Tekli Poşet Kahve', 'Granül Kahve', 'Filtre Kahve', 'Türk Kahvesi', 'Sıcak Çikolata', 'Dökme Çay', 'Bardak Poşet Çay', 'Bitki Çayı', 'Adaçayı', 'Kuşburnu', 'Rezene', 'Diğer Bitki Çayı', 'Sahlep', 'Diğer Toz İçecek', 'Kahve Kreması'
  ],
  'temel-market': [
    'Peynir', 'Sucuk', 'Salam', 'Hindi Füme', 'Normal Süt', 'Yoğurt', 'Meyveli Yoğurt', 'Siyah Zeytin', 'Bal', 'Helva', 'Sürülebilir Çikolata', 'Kahvaltılık Gevrek', 'Ton Balığı', 'Konserve Mısır', 'Turşu', 'Domates Salçası', 'Sıvı Yağ', 'Tuz', 'Toz Şeker', 'Yulaf Ezmesi'
  ],
  'kisisel-bakim': [
    'Duş Jeli', 'Hijyenik Ped', 'Şampuan', 'Islak Mendil', 'Manuel Diş Fırçası', 'Günlük Ped', 'Bebek Temizleme Pamuğu', 'Diğer Gıda Takviyesi', 'Diş Macunu', 'Banyo Sabunu', 'El Sabunu', 'Kolonya', 'Tıraş Bıçağı', 'Yarabandı'
  ],
  'kagit-temizlik': [
    'Kağıt Mendil', 'Tuvalet Kağıdı', 'Kağıt Havlu', 'Kağıt Peçete', 'Toz Deterjanı', 'Sıvı Deterjanı', 'Bulaşık Makinesi Deterjanı', 'Elde Bulaşık Deterjanı', 'Çamaşır Suyu', 'Çamaşır Yumuşatıcısı', 'Yüzey Temizleyici', 'Koku Giderici', 'Sinek İlacı', 'Çöp Torbası'
  ],
  'pet-shop': [
    'Kedi Konserve Maması', 'Kedi Ödülü'
  ],
  'elektronik-diger': [
    'Çakmak', 'Piller Şarj Cihazı', 'Oyuncak', 'Kamp Ekipmanı', 'Kibrit', 'Plastik Tabak', 'Ev Dekorasyon'
  ]
};

const allMappedCats = new Set();
Object.values(deptMap).forEach(cats => cats.forEach(c => allMappedCats.add(c)));

const missingFromDepts = [];
rows.forEach(r => {
  const c = String(r['KATEGORİ'] || '').trim();
  if (c && !allMappedCats.has(c) && !missingFromDepts.includes(c)) {
    missingFromDepts.push(c);
  }
});

console.log('Missing from departments:', missingFromDepts);

// Calculate counts per department based on stok.xlsx
let totalCount = 0;
for (const [deptId, cats] of Object.entries(deptMap)) {
  const catSet = new Set(cats);
  const count = rows.filter(r => catSet.has(String(r['KATEGORİ'] || '').trim())).length;
  totalCount += count;
  console.log(`${deptId}: ${count} products`);
}
console.log(`Total counted products: ${totalCount} / ${rows.length}`);
