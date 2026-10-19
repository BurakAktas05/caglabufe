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

async function test() {
  const tables = [
    'products',
    'orders',
    'campaigns',
    'profiles',
    'addresses',
    'system_settings',
    'delivery_zones',
    'dormitories',
    'banned_users',
    'push_subscriptions'
  ];

  for (const t of tables) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`${t}: error -> ${error.message}`);
      } else {
        console.log(`${t}: count = ${count}`);
      }
    } catch (e) {
      console.log(`${t}: exception -> ${e.message}`);
    }
  }
}

test();
