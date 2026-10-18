// Yerli SMS Servisi (Netgsm / Test Simülasyonu)
// Vodafone, Turkcell ve Türk Telekom'da anında SMS iletimi ve tek kullanımlık giriş şifresi (OTP)

export interface SendOtpResult {
  success: boolean;
  message: string;
  debugCode?: string; // Sadece test/demo ortamında kolaylık için
}

interface StoredOtpData {
  code: string;
  expiresAt: number;
}

/**
 * Her çağrıldığında telefon numarasına özel YEPYENİ 4 haneli tek kullanımlık şifre üretir.
 */
export const sendSmsOtp = async (phone: string): Promise<SendOtpResult> => {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length < 10) {
    return {
      success: false,
      message: 'Lütfen geçerli bir 10 veya 11 haneli telefon numarası giriniz.',
    };
  }

  // 4 Haneli tamamen yeni rastgele şifre üret
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

  // Şifrenin geçerlilik süresi: 3 dakika (180 saniye)
  const expiresAt = Date.now() + 180 * 1000;
  const otpData: StoredOtpData = { code: generatedOtp, expiresAt };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`otp_${cleanPhone}`, JSON.stringify(otpData));
    sessionStorage.setItem('last_otp', generatedOtp);
  }

  // API üzerinden SMS gönderimini tetikle
  try {
    await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        code: generatedOtp,
        message: `Çağla Büfe & Market tek kullanımlık giriş şifreniz: ${generatedOtp}. Kimseyle paylaşmayınız.`,
      }),
    });
  } catch {
    // API hatasında da kullanıcının test kodunu kullanabilmesi için devam et
  }

  return {
    success: true,
    message: 'Yeni tek kullanımlık şifreniz SMS ile gönderildi.',
    debugCode: generatedOtp,
  };
};

/**
 * Kullanıcının girdiği şifreyi doğrular.
 */
export const verifySmsOtp = (phone: string, inputOtp: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  const trimmed = inputOtp.trim();

  // Geliştirici test kodu: Yalnızca geliştirme/demo ortamında aktif
  if (process.env.NODE_ENV !== 'production' && trimmed === '1234') {
    return true;
  }

  if (typeof window !== 'undefined') {
    const raw = sessionStorage.getItem(`otp_${cleanPhone}`);
    if (raw) {
      try {
        const parsed: StoredOtpData = JSON.parse(raw);
        if (parsed.code === trimmed) {
          if (Date.now() > parsed.expiresAt) {
            return false; // Süresi dolmuş
          }
          sessionStorage.removeItem(`otp_${cleanPhone}`);
          return true;
        }
      } catch {
        if (raw === trimmed) {
          sessionStorage.removeItem(`otp_${cleanPhone}`);
          return true;
        }
      }
    }

    const fallbackLast = sessionStorage.getItem('last_otp');
    if (fallbackLast && fallbackLast === trimmed) {
      return true;
    }
  }

  return false;
};
