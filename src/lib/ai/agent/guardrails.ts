/**
 * Security guardrails for AI Agent.
 * Protects against prompt injection, destructive actions, and unauthorized tampering.
 */

const MALICIOUS_PATTERNS = [
  'delete all',
  'tum dbyi sil',
  'tümünü sil',
  'bütün siparişleri sil',
  'bütün ürünleri sil',
  'drop table',
  'truncate',
  'ignore previous instructions',
  'sistem talimatlarını unut',
  'veritabanını sıfırla',
  'format at',
  'eval(',
  '<script',
];

export interface GuardrailCheckResult {
  isSafe: boolean;
  blockReason?: string;
}

export class Guardrails {
  public validatePrompt(prompt: string): GuardrailCheckResult {
    if (!prompt || typeof prompt !== 'string') {
      return { isSafe: false, blockReason: 'Geçersiz veya boş komut.' };
    }

    const lower = prompt.toLowerCase();
    for (const pat of MALICIOUS_PATTERNS) {
      if (lower.includes(pat)) {
        return {
          isSafe: false,
          blockReason: '🛡️ Güvenlik Uyarısı: Toplu silme, veritabanı sıfırlama veya sistem manipülasyonu güvenlik kuralları gereği engellendi.',
        };
      }
    }

    return { isSafe: true };
  }
}

export const guardrails = new Guardrails();
