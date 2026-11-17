'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { sendSmsOtp, verifySmsOtp } from '@/lib/smsService';
import { findProfileByPhone, isPhoneBanned, getBannedUserInfo } from '@/lib/supabase';
import { normalizePhoneNumber } from '@/lib/security';
import { Address } from '@/types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  X,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, showToast, setBannedModalInfo, t, dir } = useApp();

  const [step, setStep] = useState<'phone' | 'otp' | 'add_phone'>('phone');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [googleUserTemp, setGoogleUserTemp] = useState<{ name: string; email?: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);
  const [recognizedAddress, setRecognizedAddress] = useState<Address | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Telefon numarasını temizleyip 05XX XXX XX XX formatına dönüştürme
  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  };

  // Telefon numarasını temizleyip 05XX XXX XX XX formatına dönüştürme
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatPhoneNumber(rawVal);
    setPhone(formatted);
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Modal sıfırlama
  useEffect(() => {
    if (!isAuthModalOpen) {
      setStep('phone');
      setOtpCode('');
      setIsLoading(false);
    }
  }, [isAuthModalOpen]);

  // Yeni tek kullanımlık SMS şifresi gönder
  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast(t('validPhoneWarning', 'Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX).'), 'warning');
      return;
    }

    // Eğer ad soyad girilmemişse uyar
    const effectiveName = fullName.trim();
    if (!effectiveName) {
      showToast(t('nameRequiredWarning', 'Lütfen siparişleriniz için adınızı ve soyadınızı giriniz.'), 'warning');
      return;
    }

    const clean = normalizePhoneNumber(phone);
    if (isPhoneBanned(clean)) {
      const info = getBannedUserInfo(clean);
      setBannedModalInfo(
        info || {
          id: 'ban_' + clean,
          phone: clean,
          name: effectiveName,
          reason: t('bannedDefaultReason', 'Kötü niyetli sipariş / Güvenlik ihlali'),
          bannedAt: new Date().toISOString(),
        }
      );
      setIsAuthModalOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendSmsOtp(phone, 'recaptcha-container');
      if (res.success) {
        setStep('otp');
        setResendCooldown(30);
        showToast(t('otpSentSuccess', 'SMS doğrulama kodu cep telefonunuza iletildi!'), 'success');
      } else {
        const isVodafone = cleanPhone.startsWith('54') || cleanPhone.startsWith('054');
        if (isVodafone || res.message.includes('39') || res.message.includes('kotası') || res.message.includes('bekleyip')) {
          showToast(
            'Vodafone operatör kısıtlaması nedeniyle SMS iletilemedi. Dilerseniz hemen aşağıdaki "Google ile Giriş Yap" seçeneğini kullanabilirsiniz!',
            'error'
          );
        } else {
          showToast(res.message, 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [phone, fullName, showToast, t, setBannedModalInfo, setIsAuthModalOpen]);

  // Google ile Giriş Yap
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      const gName = gUser.displayName || fullName.trim() || 'Müşteri';
      const gEmail = gUser.email || undefined;

      // Google hesabında kayıtlı telefon var mı?
      const cleanDigits = (gUser.phoneNumber || phone).replace(/\D/g, '');
      if (cleanDigits && cleanDigits.length >= 10) {
        const profile = await findProfileByPhone(cleanDigits);
        loginUser(
          gName,
          formatPhoneNumber(cleanDigits),
          profile?.lastAddress ? [profile.lastAddress as Address] : undefined
        );
        setIsAuthModalOpen(false);
        showToast(t('loginSuccess', 'Google ile giriş başarılı! Hoş geldiniz.'), 'success');
      } else {
        // Telefon henüz yok: Müşteriyi telefon numarasını girmesi için adıma al
        setGoogleUserTemp({ name: gName, email: gEmail });
        setStep('add_phone');
        showToast('Google ile bağlandınız! Kuryemiz için lütfen telefon numaranızı ekleyiniz.', 'info');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (error?.code === 'auth/operation-not-allowed') {
        showToast('Google ile giriş henüz Firebase Console üzerinde aktif edilmemiş.', 'error');
        return;
      }
      showToast(error?.message || 'Google ile giriş yapılırken bir hata oluştu.', 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google ile giriş sonrası telefon numarasını kaydetme
  const handleSavePhoneAfterGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      showToast(t('validPhoneWarning', 'Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX).'), 'warning');
      return;
    }

    const clean = normalizePhoneNumber(phone);
    if (isPhoneBanned(clean)) {
      const info = getBannedUserInfo(clean);
      setBannedModalInfo(
        info || {
          id: 'ban_' + clean,
          phone: clean,
          name: googleUserTemp?.name || 'Müşteri',
          reason: t('bannedDefaultReason', 'Kötü niyetli sipariş / Güvenlik ihlali'),
          bannedAt: new Date().toISOString(),
        }
      );
      setIsAuthModalOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const profile = await findProfileByPhone(cleanDigits);
      const effectiveName = googleUserTemp?.name || fullName.trim() || profile?.fullName || 'Müşteri';
      loginUser(
        effectiveName,
        phone.trim(),
        profile?.lastAddress ? [profile.lastAddress as Address] : undefined
      );
      setIsAuthModalOpen(false);
      showToast(t('loginSuccess', 'Giriş başarılı! Hoş geldiniz.'), 'success');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS ile gelen tek kullanımlık şifreyi doğrula
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      showToast(t('enter6DigitsWarning', 'Lütfen 6 haneli SMS kodunu eksiksiz giriniz.'), 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const verifyRes = await verifySmsOtp(otpCode);
      if (verifyRes.success) {
        const clean = phone.replace(/\D/g, '');
        const profile = await findProfileByPhone(clean);
        const effectiveName = (fullName.trim() || profile?.fullName || 'Müşteri');
        loginUser(
          effectiveName,
          phone.trim(),
          profile?.lastAddress ? [profile.lastAddress as Address] : undefined
        );
        setIsAuthModalOpen(false);
        showToast(t('loginSuccess', 'Giriş başarılı! Hoş geldiniz.'), 'success');
      } else {
        showToast(verifyRes.message || t('invalidOtpError', 'Hatalı veya süresi dolmuş SMS kodu! Tekrar deneyiniz.'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const isRtl = dir === 'rtl';

  return (
    <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', margin: '0 auto', borderRadius: '24px 24px 0 0' }}
      >
        {/* Header */}
        <div className="sheet-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#f3f0fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5D3EBC',
                flexShrink: 0,
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937' }}>
                {t('authTitle', 'Hızlı SMS Girişi')}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#10b981',
                  marginTop: '1px',
                }}
              >
                {t('authSubtitle', '✨ Sabit şifre yok • Her seferinde tek kullanımlık SMS')}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsAuthModalOpen(false)} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="sheet-body" style={{ padding: '20px' }}>
          {/* Firebase reCAPTCHA container */}
          <div id="recaptcha-container"></div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp}>
              {/* Bilgilendirme Kutusu */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Sparkles size={20} color="#5D3EBC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  {t('authEasyHelp', 'Kullanımı çok kolay! Şifre ezberlemenize gerek yok. Telefon numaranızı girin, her seferinde cebinize gelen tek kullanımlık SMS şifresi ile anında bağlanın.')}
                </div>
              </div>

              {/* Telefon Numarası */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  {t('phoneLabel', 'Telefon Numaranız')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      paddingLeft: isRtl ? '14px' : '40px',
                      paddingRight: isRtl ? '40px' : '14px',
                      direction: 'ltr',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    autoFocus
                    required
                  />
                  <Smartphone
                    size={18}
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      left: isRtl ? 'auto' : '12px',
                      right: isRtl ? '12px' : 'auto',
                      top: '14px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  {t('phoneHint', 'Turkcell, Vodafone ve Türk Telekom hatlarına anında SMS ulaşır.')}
                </span>
              </div>

              {/* Tanınan Müşteri Kartı */}
              {recognizedName ? (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 800 }}>
                      {t('registeredCustomerFound', 'Kayıtlı Müşteri Tanındı')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#047857', fontWeight: 700 }}>
                      {t('welcomeUser', 'Hoş geldiniz, {name}!', { name: recognizedName })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Yeni Müşteri için İsim Alanı */
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                    {t('fullNameLabel', 'Adınız ve Soyadınız')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('fullNamePlaceholder', 'Örn: Ahmet Yılmaz')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    {t('fullNameHint', 'Kuryemizin ve sipariş fişinin size ait olduğunu belirtmesi için gereklidir.')}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || isGoogleLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                }}
              >
                {isLoading ? (
                  <span>{t('sendingOtp', 'Şifre Gönderiliyor...')}</span>
                ) : (
                  <>
                    <span>{t('sendOtpBtn', 'Tek Kullanımlık Şifre Gönder')}</span>
                    <ArrowRight size={18} style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                  </>
                )}
              </button>

              {/* Veya Çizgisi */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '16px 0',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                  {t('orText', 'veya')}
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Google ile Giriş Yap Butonu */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isGoogleLoading ? (
                  <span>Bağlanıyor...</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google ile Hızlı Giriş Yap</span>
                  </>
                )}
              </button>

              {/* Vodafone Dostane Bilgilendirme Kartı */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  backgroundColor: '#fff1f2',
                  border: '1px dashed #fda4af',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Info size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '11px', color: '#4c0519', lineHeight: 1.5 }}>
                  <strong style={{ color: '#9f1239', display: 'block', marginBottom: '2px', fontSize: '12px' }}>
                    📱 Vodafone Kullanıcılarımız İçin Dostane Bir Not:
                  </strong>
                  Operatör kaynaklı yurt dışı SMS kısıtlamaları nedeniyle Vodafone hatlarına doğrulama kodu gecikebilir veya ulaşmayabilir.
                  Beklemek yerine yukarıdaki <strong>Google ile Hızlı Giriş Yap</strong> butonunu kullanabilirsiniz! Sipariş teslimatınız için telefon numaranızı hemen ardından SMS&apos;siz kolayca ekleyebilirsiniz. ❤️🥪
                </div>
              </div>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <ShieldCheck size={32} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#111827' }}>
                  {t('enterOtpTitle', 'SMS Kodunuzu Giriniz')}
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                  {t('enterOtpDesc', '{phone} numarasına gönderilen 6 haneli tek kullanımlık giriş kodunuzu giriniz.', { phone })}
                </p>
              </div>

              {/* 6 Haneli Şifre Girişi */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    letterSpacing: '8px',
                    textAlign: 'center',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '2px solid #5D3EBC',
                    backgroundColor: '#faf5ff',
                    direction: 'ltr',
                  }}
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              {/* Onay Butonu */}
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                }}
              >
                {isLoading ? (
                  <span>{t('verifyingOtp', 'Doğrulanıyor...')}</span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{t('verifyOtpBtn', 'Onayla ve Giriş Yap')}</span>
                  </>
                )}
              </button>

              {/* Yeniden Gönder & Numara Değiştir */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {t('changePhoneBtn', '← Numara Değiştir')}
                </button>

                {resendCooldown > 0 ? (
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                    {t('resendCooldown', 'Yeni şifre: {seconds}s', { seconds: resendCooldown })}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: '#5D3EBC',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>{t('resendOtpBtn', 'Tekrar Yeni Şifre Gönder')}</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* step === 'add_phone': Google sonrası SMS'siz doğrudan telefon tamamlama adımı */
            <form onSubmit={handleSavePhoneAfterGoogle}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#111827' }}>
                  Hoş Geldiniz, {googleUserTemp?.name || 'Müşterimiz'}! 👋
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                  Google ile bağlantınız sağlandı. Siparişinizi teslim ederken kuryemizin size ulaşabilmesi için lütfen telefon numaranızı ekleyiniz:
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  {t('phoneLabel', 'Telefon Numaranız')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      paddingLeft: isRtl ? '14px' : '40px',
                      paddingRight: isRtl ? '40px' : '14px',
                      direction: 'ltr',
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                    autoFocus
                    required
                  />
                  <Smartphone
                    size={18}
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      left: isRtl ? 'auto' : '12px',
                      right: isRtl ? '12px' : 'auto',
                      top: '14px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                  ✨ Google ile doğrulandığınız için SMS şifresi beklemenize gerek yoktur.
                </span>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                }}
              >
                {isLoading ? (
                  <span>Kaydediliyor...</span>
                ) : (
                  <>
                    <span>Kaydet ve Siparişe Başla</span>
                    <ArrowRight size={18} style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setGoogleUserTemp(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Farklı bir yöntemle giriş yap
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
