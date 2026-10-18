/**
 * ÇAĞLA BÜFE & MARKET - SECURITY GUARD & ANTI-TAMPER SYSTEM
 * 
 * Protects against:
 * 1. Script kiddie spam / DoS flooding (Rate Limiting)
 * 2. Parameter & Price tampering (Cart Integrity Verification)
 * 3. XSS injection via order notes / customer names (HTML Sanitization)
 * 4. Blacklist bypass via phone formatting (Universal Normalization)
 * 5. Admin panel brute force attacks (Failed Attempt Lockout)
 * 6. Bot honeypot traps
 */

import { CartItem, Product } from '@/types';

// --- 1. XSS SANITIZATION & HTML DECODING ---
/**
 * Decodes HTML entities (e.g. &#39; -> ', &quot; -> ", &amp; -> &)
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Strips HTML tags and dangerous characters from user inputs
 * Preserves normal Turkish characters and apostrophes (e.g. 6'lı Koli)
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return decodeHtmlEntities(text)
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/[<>]/g, '')    // Strip any stray angle brackets
    .trim();
}

// --- 2. UNIVERSAL PHONE NORMALIZATION ---
/**
 * Normalizes any phone variation (+90, 0090, 0542, spaces, dashes)
 * to standard 10-digit format: 5xxxxxxxxx
 * Guarantees that whether a user or admin enters 0507, 507, +90507 or 0090507,
 * they all match the EXACT SAME canonical 10-digit identifier.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  // 1. Strip all non-digit characters (spaces, dashes, parentheses, pluses)
  let digits = phone.replace(/\D/g, '');

  // 2. Strip international prefix (0090 or 90)
  if (digits.startsWith('0090')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('90') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // 3. Strip any leading zeros (e.g. 0507 -> 507)
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // 4. Turkish mobile numbers are exactly 10 digits starting with 5 (e.g. 5xxxxxxxxx).
  // If user entered extra prefix numbers, extract last 10 digits if it starts with 5
  if (digits.length > 10 && digits.slice(-10).startsWith('5')) {
    digits = digits.slice(-10);
  }

  return digits;
}

/**
 * Formats a canonical 10-digit or raw phone number into standard Turkish display format:
 * 0 (507) 123 45 67
 */
export function formatPhoneNumber(phone: string): string {
  const clean = normalizePhoneNumber(phone);
  if (clean.length === 10) {
    return `0 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
  }
  return phone;
}


// --- 3. RATE LIMITING (FLOOD / SPAM PROTECTION) ---
const RATE_LIMIT_PREFIX = 'caglabufe_ratelimit_';

export interface RateLimitResult {
  allowed: boolean;
  remainingSeconds: number;
  message?: string;
}

/**
 * Client-side & Session rate limiter to prevent bot scripts from flooding orders
 * Limits orders to maxAttempts within windowSeconds
 */
export function checkOrderRateLimit(
  phoneOrIp: string,
  maxAttempts: number = 2,
  windowSeconds: number = 90
): RateLimitResult {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingSeconds: 0 };
  }

  const cleanKey = RATE_LIMIT_PREFIX + normalizePhoneNumber(phoneOrIp);
  const now = Date.now();

  try {
    const raw = localStorage.getItem(cleanKey);
    let history: number[] = raw ? JSON.parse(raw) : [];

    const windowMs = windowSeconds * 1000;
    history = history.filter((timestamp) => now - timestamp < windowMs);

    if (history.length >= maxAttempts) {
      const oldestInWindow = history[0];
      const remainingMs = windowMs - (now - oldestInWindow);
      const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      return {
        allowed: false,
        remainingSeconds,
        message: `Çok fazla sipariş denemesi yaptınız. Lütfen ${remainingSeconds} saniye sonra tekrar deneyiniz.`,
      };
    }

    history.push(now);
    localStorage.setItem(cleanKey, JSON.stringify(history));

    return { allowed: true, remainingSeconds: 0 };
  } catch {
    return { allowed: true, remainingSeconds: 0 };
  }
}

// --- 4. CART & PRICE INTEGRITY VERIFICATION ---
export interface CartIntegrityResult {
  isValid: boolean;
  calculatedItemTotal: number;
  errorMessage?: string;
}

/**
 * Validates that quantities are reasonable positive integers (1 - 25)
 * and verifies prices match the actual catalog (prevents DevTools price tampering)
 */
export function validateCartIntegrity(
  cart: CartItem[],
  catalogProducts: Product[]
): CartIntegrityResult {
  if (!cart || cart.length === 0) {
    return { isValid: false, calculatedItemTotal: 0, errorMessage: 'Sepet boş olamaz.' };
  }

  let total = 0;

  for (const item of cart) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 25) {
      return {
        isValid: false,
        calculatedItemTotal: 0,
        errorMessage: `Geçersiz ürün adedi: ${item.product.name} (Adet: ${item.quantity})`,
      };
    }

    const catalogItem = catalogProducts.find((p) => p.id === item.product.id);
    if (!catalogItem) {
      return {
        isValid: false,
        calculatedItemTotal: 0,
        errorMessage: `Katalogda bulunmayan ürün: ${item.product.name}`,
      };
    }

    if (!catalogItem.isAvailable) {
      return {
        isValid: false,
        calculatedItemTotal: 0,
        errorMessage: `Ürün stokta bulunmuyor: ${catalogItem.name}`,
      };
    }

    const expectedPrice = catalogItem.discountPrice ?? catalogItem.price;
    total += expectedPrice * item.quantity;
  }

  return { isValid: true, calculatedItemTotal: total };
}

// --- 5. ADMIN BRUTE FORCE LOCKOUT ---
const ADMIN_LOCK_KEY = 'caglabufe_admin_lockout';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

export interface AdminLockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
}

export function getAdminLockoutStatus(): AdminLockoutStatus {
  if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0 };

  try {
    const raw = sessionStorage.getItem(ADMIN_LOCK_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0 };

    const data: { attempts: number; lockedUntil: number } = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }

    return { isLocked: false, remainingSeconds: 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0 };
  }
}

export function recordAdminLoginAttempt(isSuccess: boolean): { canLogin: boolean; message?: string } {
  if (typeof window === 'undefined') return { canLogin: true };

  try {
    const raw = sessionStorage.getItem(ADMIN_LOCK_KEY);
    let data: { attempts: number; lockedUntil: number } = raw
      ? JSON.parse(raw)
      : { attempts: 0, lockedUntil: 0 };

    if (isSuccess) {
      sessionStorage.removeItem(ADMIN_LOCK_KEY);
      return { canLogin: true };
    }

    data.attempts = (data.attempts || 0) + 1;

    if (data.attempts >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      sessionStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify(data));
      return {
        canLogin: false,
        message: `Çok fazla hatalı şifre girildi! Yönetici girişi güvenlik sebebiyle ${LOCKOUT_MINUTES} dakika kilitlendi.`,
      };
    }

    sessionStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify(data));
    const remaining = MAX_FAILED_ATTEMPTS - data.attempts;
    return {
      canLogin: true,
      message: `Hatalı şifre! Kalan deneme hakkı: ${remaining}`,
    };
  } catch {
    return { canLogin: true };
  }
}

/**
 * Generates a daily session authentication signature
 */
export function generateAdminSessionSignature(password: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = password + '_caglabufe_salt_' + dateKey;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'cagla_auth_' + Math.abs(hash).toString(36);
}

export function verifyAdminSessionSignature(token: string, password: string): boolean {
  return token === generateAdminSessionSignature(password);
}
