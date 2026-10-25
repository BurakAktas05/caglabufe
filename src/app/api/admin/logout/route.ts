import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Admin Logout Endpoint
 * Clears the httpOnly admin session cookie.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('cagla_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Admin Logout Error]', error);
    return NextResponse.json({ success: false, error: 'Sunucu hatası.' }, { status: 500 });
  }
}
