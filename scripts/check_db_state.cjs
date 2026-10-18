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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkState() {
  const { data: prods } = await supabase.from('products').select('id, name, image_url, category');
  const { data: camps } = await supabase.from('campaigns').select('id, title, type');
  
  console.log(`Current products in DB: ${prods ? prods.length : 0}`);
  const unsplashProds = (prods || []).filter(p => p.image_url && p.image_url.includes('unsplash'));
  console.log(`Unsplash mock products count: ${unsplashProds.length}`);
  if (unsplashProds.length > 0) {
    console.log('Sample unsplash prods:', unsplashProds.slice(0, 3));
  }
  console.log(`Campaigns in DB:`, camps);
}

checkState();
