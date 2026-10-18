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

async function inspect() {
  console.log('Connecting to Supabase:', env.NEXT_PUBLIC_SUPABASE_URL);
  
  // Try to insert a test record to see all accepted columns, or inspect error
  const testObj = {
    id: 'test_' + Date.now(),
    name: 'Test Product',
    category: 'test',
    price: 10,
    image_url: 'https://test.com/img.jpg',
    description: 'test desc',
    unit: 'Adet',
    barcode: '123456789',
    is_available: true,
    is_kitchen_item: false,
    brand: 'TestBrand',
    created_at: new Date().toISOString()
  };

  const { data: insData, error: insErr } = await supabase.from('products').insert(testObj).select();
  if (insErr) {
    console.log('Insert with brand error:', insErr.message);
    // If brand column doesn't exist, let's test without brand
    delete testObj.brand;
    const { data: insData2, error: insErr2 } = await supabase.from('products').insert(testObj).select();
    if (insErr2) {
      console.log('Insert without brand error:', insErr2.message);
    } else {
      console.log('Insert without brand SUCCESS! Columns:', Object.keys(insData2[0]));
      // Clean up test record
      await supabase.from('products').delete().eq('id', testObj.id);
    }
  } else {
    console.log('Insert with brand SUCCESS! brand column exists! Columns:', Object.keys(insData[0]));
    // Clean up test record
    await supabase.from('products').delete().eq('id', testObj.id);
  }
}

inspect();
