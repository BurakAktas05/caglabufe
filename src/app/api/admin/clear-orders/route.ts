import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Delete all orders
    const { error: ordErr } = await supabaseAdmin.from('orders').delete().neq('id', 'keep_none');
    if (ordErr) {
      return NextResponse.json({ success: false, error: ordErr.message }, { status: 500 });
    }

    // Delete push subscriptions
    await supabaseAdmin.from('push_subscriptions').delete().neq('id', 'keep_none');

    return NextResponse.json({
      success: true,
      message: 'Tüm eski test siparişleri ve işlem kayıtları başarıyla temizlendi! Sistem bebek gibi tertemiz.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Temizleme başarısız' }, { status: 500 });
  }
}
