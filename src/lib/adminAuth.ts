import { cookies } from 'next/headers';

/**
 * Server-side Admin Session Verification
 * Verifies the httpOnly cookie set by /api/admin/login.
 * Must be called from server-side code only (API routes, Server Components).
 */

function generateExpectedToken(password: string): string {
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

/**
 * Checks whether the current request has a valid admin session cookie.
 * Returns true if admin is authenticated, false otherwise.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cagla_admin_token')?.value;
    if (!token || !token.startsWith('cagla_srv_')) return false;

    const adminPassword = process.env.ADMIN_PASSWORD || 'cagla2024';
    const expected = generateExpectedToken(adminPassword);
    return token === expected;
  } catch {
    return false;
  }
}
