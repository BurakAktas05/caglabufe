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

async function listRpcs() {
  const rpcs = ['exec_sql', 'run_sql', 'sql', 'execute', 'query'];
  for (const r of rpcs) {
    const { data, error } = await supabase.rpc(r, { sql: 'SELECT 1;' });
    console.log(`RPC ${r}:`, error ? error.message : 'EXISTS!');
  }
}

listRpcs();
