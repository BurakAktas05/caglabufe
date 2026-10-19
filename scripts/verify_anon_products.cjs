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

const supabaseAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, count, error } = await supabaseAnon
    .from('products')
    .select('id, name, price, category, barcode, image_url', { count: 'exact' });

  if (error) {
    console.error('Anon client error:', error);
  } else {
    console.log(`Anon client fetched count: ${count}`);
    console.log('Sample prod 1:', data[0]);
    console.log('Sample prod 2:', data[1]);
  }
}

test();
