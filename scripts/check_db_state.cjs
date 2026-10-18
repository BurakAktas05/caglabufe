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
  const { data: prods, count: prodCount } = await supabase.from('products').select('*', { count: 'exact' });
  const { data: orders, count: orderCount } = await supabase.from('orders').select('*', { count: 'exact' });
  const { data: camps } = await supabase.from('campaigns').select('*');
  
  console.log(`Current products in DB: ${prods ? prods.length : 0}`);
  console.log(`Current orders in DB: ${orders ? orders.length : 0}`);
  console.log(`Current campaigns in DB: ${camps ? camps.length : 0}`);
}

checkState();
