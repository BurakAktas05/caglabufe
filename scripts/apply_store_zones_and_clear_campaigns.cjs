const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const STORE_LAT = 41.212095;
const STORE_LNG = 32.6732255;
const STORE_ADDRESS = 'Bostanbükü, Safranbolu / Karabük';

// 5 Contiguous Zones around Store Location (ZERO GAPS - BOŞLUKSUZ)
const ZONES = [
  {
    id: 'zone-bostanbuku',
    name: 'Bostanbükü & Çevresi (Çekirdek Bölge)',
    min_order_amount: 50,
    delivery_fee: 10,
    free_delivery_threshold: 120,
    estimated_minutes: 15,
    radius_km: 1.5,
    hex_ring: 1,
    hex_color: '#10B981', // Zümrüt Yeşili
    is_active: true
  },
  {
    id: 'zone-kyk-yurtlari',
    name: 'KYK Yurtları & Kampüs (Hubbi Hatun, Şeyh Edebali)',
    min_order_amount: 70,
    delivery_fee: 15,
    free_delivery_threshold: 150,
    estimated_minutes: 20,
    radius_km: 3.0,
    hex_ring: 2,
    hex_color: '#8B5CF6', // Menekşe Moru
    is_active: true
  },
  {
    id: 'zone-100yil',
    name: '100. Yıl Mah. & Öğrenci Bölgesi',
    min_order_amount: 80,
    delivery_fee: 15,
    free_delivery_threshold: 175,
    estimated_minutes: 25,
    radius_km: 4.5,
    hex_ring: 3,
    hex_color: '#06B6D4', // Turkuaz
    is_active: true
  },
  {
    id: 'zone-sirinevler',
    name: 'Şirinevler, 5000 Evler & Karabük Merkez',
    min_order_amount: 100,
    delivery_fee: 25,
    free_delivery_threshold: 220,
    estimated_minutes: 30,
    radius_km: 7.0,
    hex_ring: 4,
    hex_color: '#F59E0B', // Kehribar / Turuncu
    is_active: true
  },
  {
    id: 'zone-safranbolu',
    name: 'Safranbolu (Emek, Barış, Kıranköy & Çarşı)',
    min_order_amount: 120,
    delivery_fee: 30,
    free_delivery_threshold: 250,
    estimated_minutes: 35,
    radius_km: 8.5,
    hex_ring: 4,
    hex_color: '#EF4444', // Kırmızı
    is_active: true
  }
];

async function run() {
  console.log('=== 1. Deleting all registered campaigns ===');
  const { error: delCampErr } = await supabase.from('campaigns').delete().neq('id', '___NEVER___');
  if (delCampErr) {
    console.error('Error deleting campaigns:', delCampErr);
  } else {
    console.log('✔ All campaigns successfully deleted.');
  }

  const { count: campCount } = await supabase.from('campaigns').select('*', { count: 'exact', head: true });
  console.log(`Campaigns in DB now: ${campCount}`);

  console.log('\n=== 2. Updating Store Location in system_settings ===');
  const { data: currSettingsRow, error: fetchErr } = await supabase.from('system_settings').select('settings').eq('id', 'current').single();
  let currentSettings = currSettingsRow?.settings || {};

  currentSettings.storeLatitude = STORE_LAT;
  currentSettings.storeLongitude = STORE_LNG;
  currentSettings.storeAddress = STORE_ADDRESS;
  currentSettings.announcementText = '🛵 Bostanbükü, 100. Yıl, KYK Yurtları ve Karabük geneline hızlı teslimat! Soğuk içecek, atıştırmalık ve market kapınızda.';

  const { error: setErr } = await supabase.from('system_settings').upsert({
    id: 'current',
    settings: currentSettings,
    updated_at: new Date().toISOString()
  });

  if (setErr) {
    console.error('Error updating system_settings:', setErr);
  } else {
    console.log(`✔ Store location updated to [${STORE_LAT}, ${STORE_LNG}] (${STORE_ADDRESS})`);
  }

  console.log('\n=== 3. Resetting and Updating delivery_zones in Supabase ===');
  // Delete old zones
  await supabase.from('delivery_zones').delete().neq('id', '___NEVER___');
  // Insert new zones
  const { error: insZoneErr } = await supabase.from('delivery_zones').insert(ZONES);
  if (insZoneErr) {
    console.error('Error inserting delivery zones:', insZoneErr);
  } else {
    console.log(`✔ Successfully inserted ${ZONES.length} contiguous delivery zones.`);
  }

  const { data: finalZones } = await supabase.from('delivery_zones').select('*');
  console.log('Final delivery zones in DB:', finalZones.map(z => `${z.id} -> ${z.name} (Min: ${z.min_order_amount} TL, Fee: ${z.delivery_fee} TL)`));
}

run().catch(console.error);
