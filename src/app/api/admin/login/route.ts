import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Server-side Admin Authentication Endpoint
 * 
 * Validates admin password against a server-only environment variable (ADMIN_PASSWORD).
 * On success, sets an httpOnly, secure, SameSite=Strict cookie containing a signed session token.
 * This prevents admin password exposure in client-side JavaScript/localStorage.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

// In-memory rate limiting (per-deployment instance, resets on cold start)
const loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

function generateToken(password: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  const secret = process.env.ADMIN_SESSION_SECRET || 'caglabufe_default_secret_2024';
  let hash = 0;
  const str = password + '_' + secret + '_' + dateKey;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'cagla_srv_' + Math.abs(hash).toString(36) + '_' + dateKey.replace(/-/g, '');
}

export function verifyToken(token: string): boolean {
  if (!token || !token.startsWith('cagla_srv_')) return false;
  const adminPassword = process.env.ADMIN_PASSWORD || 'cagla2024';
  const expected = generateToken(adminPassword);
  return token === expected;
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const ip = getClientIP(req);

    // Rate limit check
    const attempts = loginAttempts.get(ip);
    if (attempts && attempts.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: `Çok fazla hatalı giriş! ${remainingSeconds} saniye sonra tekrar deneyiniz.`,
          locked: true,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'cagla2024';

    if (password !== adminPassword) {
      // Record failed attempt
      const current = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      current.count += 1;

      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MS;
        current.count = 0;
        loginAttempts.set(ip, current);
        return NextResponse.json(
          { 
            success: false, 
            error: `Çok fazla hatalı şifre! Yönetici girişi 5 dakika kilitlendi.`,
            locked: true,
            remainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
          },
          { status: 429 }
        );
      }

      loginAttempts.set(ip, current);
      const remaining = MAX_ATTEMPTS - current.count;
      return NextResponse.json(
        { 
          success: false, 
          error: `Hatalı şifre! Kalan deneme hakkı: ${remaining}`,
        },
        { status: 401 }
      );
    }

    // Success: Clear attempts and set httpOnly cookie
    loginAttempts.delete(ip);
    const token = generateToken(adminPassword);

    const cookieStore = await cookies();
    cookieStore.set('cagla_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Admin Login Error]', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}
