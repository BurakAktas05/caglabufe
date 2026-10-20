'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { sendSmsOtp, verifySmsOtp } from '@/lib/smsService';
import { findProfileByPhone, isPhoneBanned, getBannedUserInfo } from '@/lib/supabase';
import { normalizePhoneNumber } from '@/lib/security';
import { Address } from '@/types';
import {
  X,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, showToast, setBannedModalInfo, t, dir } = useApp();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      setDebugOtp(null);
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
      const res = await sendSmsOtp(phone);
      if (res.success) {
        setDebugOtp(res.debugCode || '1234');
        setStep('otp');
        setResendCooldown(30);
        showToast(t('otpSentSuccess', 'Yeni tek kullanımlık SMS şifreniz iletildi!'), 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [phone, fullName, showToast, t, setBannedModalInfo, setIsAuthModalOpen]);

  // SMS ile gelen tek kullanımlık şifreyi doğrula
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      showToast(t('enter4DigitsWarning', 'Lütfen 4 haneli SMS şifresini giriniz.'), 'warning');
      return;
    }

    const isValid = verifySmsOtp(phone, otpCode);
    if (isValid) {
      setIsLoading(true);
      try {
        const clean = phone.replace(/\D/g, '');
        const profile = await findProfileByPhone(clean);
        const effectiveName = (fullName.trim() || profile?.fullName || 'Müşteri');
        loginUser(
          effectiveName,
          phone.trim(),
          profile?.lastAddress ? [profile.lastAddress as Address] : undefined
        );
        setIsAuthModalOpen(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast(t('invalidOtpError', 'Hatalı veya süresi dolmuş SMS şifresi! Tekrar deneyiniz.'), 'error');
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
                  <span>{t('sendingOtp', 'Şifre Gönderiliyor...')}</span>
                ) : (
                  <>
                    <span>{t('sendOtpBtn', 'Tek Kullanımlık Şifre Gönder')}</span>
                    <ArrowRight size={18} style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }} />
                  </>
                )}
              </button>
            </form>
          ) : (
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
                  {t('enterOtpTitle', 'SMS Şifrenizi Giriniz')}
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                  {t('enterOtpDesc', '{phone} numarasına gönderilen 4 haneli tek kullanımlık giriş şifrenizi giriniz.', { phone })}
                </p>
              </div>

              {/* Demo / Test Modu Şifre Bilgisi */}
              {debugOtp && (
                <div
                  onClick={() => setOtpCode(debugOtp)}
                  style={{
                    backgroundColor: '#F3F0FE',
                    border: '1.5px dashed #8B5CF6',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  title="Tek tıkla doldurmak için tıklayınız"
                >
                  <div style={{ fontSize: '11px', color: '#6D28D9', fontWeight: 700 }}>
                    {t('testOtpBannerTitle', '🧪 Test & Doğrulama Şifreniz (Tıkla Doldur):')}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#5D3EBC', letterSpacing: '6px', marginTop: '3px' }}>
                    {debugOtp}
                  </div>
                  <div style={{ fontSize: '10px', color: '#7C3AED', marginTop: '2px' }}>
                    {t('testOtpBannerSub', '(SMS gelmediyse bu kodu veya 1234 yazıp giriş yapabilirsiniz)')}
                  </div>
                </div>
              )}

              {/* 4 Haneli Şifre Girişi */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={4}
                  className="form-input"
                  style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '14px',
                    textAlign: 'center',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '2px solid #5D3EBC',
                    backgroundColor: '#faf5ff',
                    direction: 'ltr',
                  }}
                  placeholder="----"
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
                <CheckCircle2 size={18} />
                <span>{t('verifyOtpBtn', 'Onayla ve Giriş Yap')}</span>
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
          )}
        </div>
      </div>
    </div>
  );
};
