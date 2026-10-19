/**
 * ÇAĞLA BÜFE & MARKET - SECURITY GUARD & ANTI-TAMPER SYSTEM
 */

import { CartItem, Product, Campaign } from '@/types';

// --- 1. XSS SANITIZATION ---
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        default: return char;
      }
    })
    .trim();
}

// --- 2. UNIVERSAL PHONE NORMALIZATION ---
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0090') && digits.length === 14) {
    digits = digits.slice(4);
  } else if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits;
}

// --- 3. RATE LIMITING ---
const RATE_LIMIT_PREFIX = 'caglabufe_ratelimit_';

export interface RateLimitResult {
  allowed: boolean;
  remainingSeconds: number;
  message?: string;
}

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

// --- 4. CART & PRICE INTEGRITY ---
export interface CartIntegrityResult {
  isValid: boolean;
  calculatedItemTotal: number;
  errorMessage?: string;
}

export function validateCartIntegrity(
  cart: CartItem[],
  catalogProducts: Product[],
  campaigns: Campaign[] = []
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

    // 1. Is it a bundle deal (Kombin Paket)?
    if (item.product.id.startsWith('bundle_')) {
      const campaignId = item.product.campaignId || item.product.id.replace('bundle_', '');
      const campaign = campaigns.find((c) => c.id === campaignId && c.type === 'bundle_deal');

      if (campaign) {
        if (!campaign.isActive) {
          return {
            isValid: false,
            calculatedItemTotal: 0,
            errorMessage: `Kampanya sona erdi: ${campaign.title}`,
          };
        }
        const expectedPrice = campaign.bundlePrice ?? campaign.value;
        total += expectedPrice * item.quantity;
        continue;
      }

      // If campaign list not yet populated or offline, validate using item's declared price if valid
      const declaredPrice = item.product.discountPrice ?? item.product.price;
      if (declaredPrice > 0) {
        total += declaredPrice * item.quantity;
        continue;
      }
    }

    // 2. Standard Catalog Product
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
