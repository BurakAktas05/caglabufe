'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Share2,
  Check,
  Sparkles,
  Phone,
  MessageCircle,
  Globe,
  Bike,
  Clock,
  ShieldCheck,
  Flame,
  Coffee,
  ShoppingBag,
  ArrowLeft,
  Copy,
} from 'lucide-react';

export default function BrosurPage() {
  const [format, setFormat] = useState<'a4' | 'a5'>('a4');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isClean, setIsClean] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('clean') === '1') {
        setIsClean(true);
      }
      if (params.get('theme') === 'light') {
        setTheme('light');
      }
      if (params.get('format') === 'a5') {
        setFormat('a5');
      }
    }
  }, []);

  const websiteUrl = 'https://caglabufe.com';
  const phone = '0542 000 7878';
  const whatsapp = '905420007878';

  useEffect(() => {
    // Generate ultra high resolution QR code (1200x1200px for 300+ DPI razor sharp print)
    QRCode.toDataURL(websiteUrl, {
      width: 1200,
      margin: 1,
      color: {
        dark: theme === 'dark' ? '#1E1B4B' : '#1E1B4B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [theme]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'caglabufe-qr-kod.png';
    a.click();
  };

  return (
    <div className={`brosur-container ${isClean ? 'clean-view' : ''}`}>
      {/* ─── PRINT MEDIA CSS STYLES ─── */}
      <style jsx global>{`
        @page {
          size: ${format === 'a4' ? 'A4 portrait' : 'A5 portrait'};
          margin: 0;
        }

        .clean-view {
          background: none !important;
          padding: 0 !important;
        }

        .clean-view .flyer-viewport {
          padding: 0 !important;
        }

        .clean-view .flyer-paper {
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 auto !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all UI elements except the flyer itself */
          .no-print,
          .main-header,
          .bottom-nav,
          .order-bar-container,
          .toast-container {
            display: none !important;
          }

          .brosur-container {
            padding: 0 !important;
            background: none !important;
            min-height: auto !important;
          }

          .flyer-paper {
            width: ${format === 'a4' ? '210mm' : '148mm'} !important;
            height: ${format === 'a4' ? '297mm' : '210mm'} !important;
            max-width: none !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* ─── CONTROL TOOLBAR (Only visible on screen) ─── */}
      {!isClean && (
        <header className="no-print flyer-toolbar">
        <div className="toolbar-inner">
          <div className="toolbar-left">
            <Link href="/" className="back-btn" title="Ana Sayfaya Dön">
              <ArrowLeft size={18} />
              <span>Mağazaya Dön</span>
            </Link>
            <div className="toolbar-title-wrap">
              <h1 className="toolbar-title">Çağla Büfe Broşür &amp; Afiş Merkezi</h1>
              <p className="toolbar-desc">Matbaa ve yazıcı için baskıya hazır (A4 &amp; A5) el ilanı</p>
            </div>
          </div>

          <div className="toolbar-controls">
            {/* Format Selector */}
            <div className="control-group">
              <span className="control-label">Boyut:</span>
              <div className="btn-group">
                <button
                  type="button"
                  className={`toggle-btn ${format === 'a4' ? 'active' : ''}`}
                  onClick={() => setFormat('a4')}
                >
                  A4 Afiş (21×29.7cm)
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${format === 'a5' ? 'active' : ''}`}
                  onClick={() => setFormat('a5')}
                >
                  A5 El İlanı (14.8×21cm)
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="control-group">
              <span className="control-label">Tema:</span>
              <div className="btn-group">
                <button
                  type="button"
                  className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  🌙 Gece Moru (Lüks)
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  ☀️ Beyaz Zemin (Tasarruflu)
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="toolbar-actions">
              <button type="button" onClick={handleDownloadQr} className="secondary-action-btn" title="Yüksek Çözünürlüklü QR Kodu İndir">
                <Download size={16} />
                <span>QR İndir</span>
              </button>

              <button type="button" onClick={handleCopyLink} className="secondary-action-btn" title="caglabufe.com Linkini Kopyala">
                {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                <span>{copied ? 'Kopyalandı' : 'Linki Al'}</span>
              </button>

              <button type="button" onClick={handlePrint} className="primary-print-btn" title="Yazdır veya PDF Olarak Kaydet">
                <Printer size={18} />
                <span>Yazdır / PDF Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* ─── FLYER PREVIEW & PRINT CANVAS ─── */}
      <main className="flyer-viewport">
        <div
          ref={flyerRef}
          className={`flyer-paper flyer-${format} flyer-${theme}`}
        >
          {/* HEADER SECTION */}
          <div className="flyer-header">
            <div className="brand-badge-pill">
              <Sparkles size={14} color="#FFD10D" />
              <span>KARABÜK &amp; 100. YIL &amp; KYK YURTLARI</span>
            </div>

            <div className="brand-logo-title-row">
              <div className="brand-emblem-box">
                <Image
                  src="/caglabufe_logo.jpg"
                  alt="Çağla Büfe"
                  width={format === 'a4' ? 84 : 64}
                  height={format === 'a4' ? 84 : 64}
                  priority
                  className="brand-emblem-img"
                />
              </div>
              <div className="brand-headings">
                <h2 className="brand-main-title">ÇAĞLA BÜFE</h2>
                <h3 className="brand-sub-title">GECE MARKETİ &amp; KAPIYA TESLİMAT</h3>
              </div>
            </div>

            <p className="flyer-lead-banner">
              🌙 Gece Acıkanlara Sıcak Tost, Soğuk İçecek, Atıştırmalık &amp; Market Ürünleri Kapında!
            </p>
          </div>

          {/* MAIN HERO: QR CODE & ORDER CTA */}
          <div className="flyer-hero-qr-section">
            <div className="qr-card">
              <div className="qr-badge">KAMERANLA TARA &amp; SİPARİŞ VER</div>
              <div className="qr-image-wrapper">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrDataUrl} alt="caglabufe.com QR Kodu" className="qr-image" />
                ) : (
                  <div className="qr-loading">QR Kod Yükleniyor...</div>
                )}
              </div>
              <div className="qr-footer-url">
                <Globe size={14} />
                <span>caglabufe.com</span>
              </div>
            </div>

            <div className="hero-order-features">
              <div className="feature-block highlight-box">
                <div className="feature-icon-wrap" style={{ backgroundColor: '#FFD10D', color: '#1F2937' }}>
                  <Globe size={20} />
                </div>
                <div className="feature-info">
                  <h4>caglabufe.com</h4>
                  <p>Uygulama indirmeye gerek yok! Web sitemizden 30 saniyede sipariş oluştur.</p>
                </div>
              </div>

              <div className="feature-block">
                <div className="feature-icon-wrap" style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}>
                  <Bike size={20} />
                </div>
                <div className="feature-info">
                  <h4>20 - 30 Dakikada Kapında!</h4>
                  <p>100. Yıl Mahallesi, Üniversite Kampüsü ve tüm KYK Kız / Erkek Yurtları kapısına hızlı servis.</p>
                </div>
              </div>

              <div className="feature-block">
                <div className="feature-icon-wrap" style={{ backgroundColor: '#5D3EBC', color: '#FFFFFF' }}>
                  <ShieldCheck size={20} />
                </div>
                <div className="feature-info">
                  <h4>Kapıda Güvenli Ödeme</h4>
                  <p>İster Nakit, ister Kredi Kartı / Banka Kartı ile temassız POS ödemesi.</p>
                </div>
              </div>

              <div className="feature-block">
                <div className="feature-icon-wrap" style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}>
                  <Clock size={20} />
                </div>
                <div className="feature-info">
                  <h4>Her Gece 03:00&apos;e Kadar Açık</h4>
                  <p>Akşam 16:00&apos;dan Gece 03:00&apos;e kadar aralıksız sıcak servis.</p>
                </div>
              </div>
            </div>
          </div>

          {/* MENU & CATEGORIES GRID */}
          <div className="flyer-menu-section">
            <div className="section-title-line">
              <span className="section-title-text">NELER VAR? ZENGİN MENÜ &amp; MARKET</span>
            </div>

            <div className="menu-grid">
              <div className="menu-item-card">
                <div className="menu-item-icon">
                  <Flame size={20} color="#EF4444" />
                </div>
                <div className="menu-item-details">
                  <h5>Sıcak Tost Çeşitleri</h5>
                  <p>Kaşarlı, Sucuklu, Karışık, Özel Çağla Atom Tost, Sandviçler</p>
                </div>
              </div>

              <div className="menu-item-card">
                <div className="menu-item-icon">
                  <ShoppingBag size={20} color="#8B5CF6" />
                </div>
                <div className="menu-item-details">
                  <h5>Gece Marketi &amp; Atıştırmalık</h5>
                  <p>Cips çeşitleri, Çikolatalar, Bisküviler, Kuruyemiş, Krakerler</p>
                </div>
              </div>

              <div className="menu-item-card">
                <div className="menu-item-icon">
                  <Coffee size={20} color="#3B82F6" />
                </div>
                <div className="menu-item-details">
                  <h5>Buz Gibi &amp; Sıcak İçecekler</h5>
                  <p>Kola, Soğuk Çay, Enerji İçeceği, Meyve Suları, Su, Sıcak Kahve</p>
                </div>
              </div>

              <div className="menu-item-card">
                <div className="menu-item-icon">
                  <Sparkles size={20} color="#10B981" />
                </div>
                <div className="menu-item-details">
                  <h5>Gece İhtiyaçları &amp; Bakım</h5>
                  <p>Islak mendil, Şampuan, Temel hijyen &amp; kişisel bakım malzemeleri</p>
                </div>
              </div>
            </div>
          </div>

          {/* DORMITORIES / SERVICE REGIONS */}
          <div className="flyer-dormitories-strip">
            <span className="strip-label">📍 TESLİMAT BÖLGELERİMİZ:</span>
            <span className="strip-tags">
              Bahaddin Gazi KYK • Asiye Hatun KYK • Hubbi Hatun KYK • Taşkent KYK • İsmail Necati KYK • 100. Yıl Mah. • Üniversite Kampüsü
            </span>
          </div>

          {/* FOOTER SECTION: CONTACT & BIG WEBSITE DOMAIN */}
          <div className="flyer-footer">
            <div className="footer-domain-row">
              <div className="domain-pill">
                <Globe size={18} />
                <span>www.caglabufe.com</span>
              </div>
              <span className="domain-slogan">📱 Telefonuna Kaydet, Gece Acıkınca Anında Söyle!</span>
            </div>

            <div className="footer-contacts">
              <div className="contact-pill phone-pill">
                <Phone size={15} />
                <span>Sipariş: <strong>{phone}</strong></span>
              </div>

              <div className="contact-pill whatsapp-pill">
                <MessageCircle size={15} />
                <span>WhatsApp: <strong>0542 000 78 78</strong></span>
              </div>
            </div>

            <div className="footer-copyright">
              Çağla Büfe &amp; Market © Karabük 100. Yıl • Hızlı &amp; Sıcak Teslimat
            </div>
          </div>
        </div>
      </main>

      {/* ─── STYLESHEET (Screen & Print Typography) ─── */}
      <style jsx>{`
        .brosur-container {
          min-height: 100vh;
          background-color: #0F172A;
          color: #1E293B;
          font-family: inherit;
          display: flex;
          flex-direction: column;
        }

        /* Toolbar */
        .flyer-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
          color: #FFFFFF;
        }

        .toolbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: background-color 0.15s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }

        .toolbar-title-wrap {
          display: flex;
          flex-direction: column;
        }

        .toolbar-title {
          font-size: 16px;
          font-weight: 900;
          margin: 0;
          color: #FFFFFF;
          letter-spacing: -0.3px;
        }

        .toolbar-desc {
          font-size: 12px;
          color: #94A3B8;
          margin: 2px 0 0;
        }

        .toolbar-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 12px;
          font-weight: 700;
          color: #CBD5E1;
        }

        .btn-group {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.08);
          padding: 3px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toggle-btn {
          padding: 6px 12px;
          border-radius: 7px;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-btn.active {
          background: #5D3EBC;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(93, 62, 188, 0.4);
        }

        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .secondary-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .secondary-action-btn:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .primary-print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          background: #FFD10D;
          border: none;
          color: #1F2937;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(255, 209, 13, 0.4);
          transition: all 0.15s ease;
        }

        .primary-print-btn:hover {
          background: #FACC15;
          transform: translateY(-1px);
        }

        /* Flyer Viewport */
        .flyer-viewport {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 30px 16px 60px;
          overflow-x: auto;
        }

        /* Flyer Base Container (Mimicking A4 / A5 proportions) */
        .flyer-paper {
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 12px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        /* Dimensions on Screen Preview */
        .flyer-a4 {
          width: 794px; /* standard ~96 DPI preview for 210mm */
          min-height: 1123px; /* ~297mm */
          padding: 36px 36px 30px;
        }

        .flyer-a5 {
          width: 559px;
          min-height: 792px;
          padding: 24px 24px 20px;
        }

        /* Themes */
        .flyer-dark {
          background: radial-gradient(circle at 50% 15%, #241457 0%, #110B29 55%, #080514 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .flyer-light {
          background: #FFFFFF;
          color: #0F172A;
          border: 1.5px solid #E2E8F0;
        }

        /* Header Elements */
        .flyer-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
        }

        .brand-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 209, 13, 0.15);
          border: 1.5px solid rgba(255, 209, 13, 0.4);
          padding: 4px 14px;
          border-radius: 20px;
          color: #FFD10D;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
        }

        .flyer-light .brand-badge-pill {
          background: #FEF3C7;
          border-color: #F59E0B;
          color: #92400E;
        }

        .brand-logo-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 6px;
        }

        .brand-emblem-box {
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px #FFD10D;
          background-color: #5D3EBC;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-emblem-img {
          object-fit: cover;
          display: block;
        }

        .brand-headings {
          text-align: left;
        }

        .brand-main-title {
          font-size: 34px;
          font-weight: 950;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1;
        }

        .flyer-dark .brand-main-title {
          background: linear-gradient(135deg, #FFFFFF 0%, #EDE9FE 60%, #FFD10D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .flyer-light .brand-main-title {
          color: #5D3EBC;
        }

        .brand-sub-title {
          font-size: 13px;
          font-weight: 800;
          margin: 4px 0 0;
          letter-spacing: 0.6px;
        }

        .flyer-dark .brand-sub-title {
          color: #A5B4FC;
        }

        .flyer-light .brand-sub-title {
          color: #64748B;
        }

        .flyer-lead-banner {
          margin: 10px 0 0;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .flyer-dark .flyer-lead-banner {
          background: rgba(93, 62, 188, 0.35);
          border: 1px solid rgba(167, 139, 250, 0.3);
          color: #EDE9FE;
        }

        .flyer-light .flyer-lead-banner {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #1E293B;
        }

        /* Hero QR & Features Section */
        .flyer-hero-qr-section {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 18px;
          align-items: center;
          margin-bottom: 18px;
        }

        .flyer-a5 .flyer-hero-qr-section {
          grid-template-columns: 180px 1fr;
          gap: 12px;
        }

        .qr-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 14px;
          border-radius: 16px;
          text-align: center;
          box-sizing: border-box;
        }

        .flyer-dark .qr-card {
          background: #FFFFFF;
          color: #1E1B4B;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 3px #FFD10D;
        }

        .flyer-light .qr-card {
          background: #FFFFFF;
          color: #1E1B4B;
          border: 2.5px solid #5D3EBC;
          box-shadow: 0 8px 24px rgba(93, 62, 188, 0.15);
        }

        .qr-badge {
          font-size: 10px;
          font-weight: 900;
          background: #5D3EBC;
          color: #FFFFFF;
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 8px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          width: 100%;
          box-sizing: border-box;
        }

        .qr-image-wrapper {
          width: 100%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 6px;
        }

        .qr-loading {
          font-size: 11px;
          color: #64748B;
        }

        .qr-footer-url {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 900;
          color: #5D3EBC;
          letter-spacing: -0.2px;
        }

        /* Features List */
        .hero-order-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-block {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          box-sizing: border-box;
        }

        .flyer-dark .feature-block {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .flyer-light .feature-block {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .feature-block.highlight-box {
          border-width: 2px;
        }

        .flyer-dark .feature-block.highlight-box {
          background: rgba(255, 209, 13, 0.12);
          border-color: rgba(255, 209, 13, 0.45);
        }

        .flyer-light .feature-block.highlight-box {
          background: #FEFCE8;
          border-color: #FACC15;
        }

        .feature-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .flyer-a5 .feature-icon-wrap {
          width: 32px;
          height: 32px;
        }

        .feature-info h4 {
          margin: 0 0 2px;
          font-size: 13px;
          font-weight: 800;
        }

        .flyer-dark .feature-info h4 {
          color: #FFFFFF;
        }

        .flyer-light .feature-info h4 {
          color: #0F172A;
        }

        .feature-info p {
          margin: 0;
          font-size: 11px;
          line-height: 1.35;
        }

        .flyer-dark .feature-info p {
          color: #CBD5E1;
        }

        .flyer-light .feature-info p {
          color: #475569;
        }

        /* Menu Section */
        .flyer-menu-section {
          margin-bottom: 16px;
        }

        .section-title-line {
          text-align: center;
          position: relative;
          margin-bottom: 12px;
        }

        .section-title-line::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
          z-index: 1;
        }

        .flyer-light .section-title-line::before {
          background: #CBD5E1;
        }

        .section-title-text {
          position: relative;
          z-index: 2;
          padding: 2px 14px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.8px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .flyer-dark .section-title-text {
          background: #110B29;
          color: #FFD10D;
          border: 1px solid rgba(255, 209, 13, 0.4);
        }

        .flyer-light .section-title-text {
          background: #FFFFFF;
          color: #5D3EBC;
          border: 1px solid #5D3EBC;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .menu-item-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          box-sizing: border-box;
        }

        .flyer-dark .menu-item-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .flyer-light .menu-item-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .menu-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .flyer-light .menu-item-icon {
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .menu-item-details h5 {
          margin: 0 0 2px;
          font-size: 12px;
          font-weight: 800;
        }

        .flyer-dark .menu-item-details h5 {
          color: #FFFFFF;
        }

        .flyer-light .menu-item-details h5 {
          color: #0F172A;
        }

        .menu-item-details p {
          margin: 0;
          font-size: 10px;
          line-height: 1.3;
        }

        .flyer-dark .menu-item-details p {
          color: #94A3B8;
        }

        .flyer-light .menu-item-details p {
          color: #64748B;
        }

        /* Dormitories Strip */
        .flyer-dormitories-strip {
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 10.5px;
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.4;
          box-sizing: border-box;
        }

        .flyer-dark .flyer-dormitories-strip {
          background: rgba(93, 62, 188, 0.25);
          border: 1px dashed rgba(167, 139, 250, 0.4);
          color: #EDE9FE;
        }

        .flyer-light .flyer-dormitories-strip {
          background: #EEF2FF;
          border: 1px dashed #A5B4FC;
          color: #3730A3;
        }

        .strip-label {
          font-weight: 900;
          color: #FFD10D;
          margin-right: 4px;
        }

        .flyer-light .strip-label {
          color: #4338CA;
        }

        .strip-tags {
          font-weight: 600;
        }

        /* Footer */
        .flyer-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 14px;
        }

        .flyer-light .flyer-footer {
          border-top-color: #E2E8F0;
        }

        .footer-domain-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          flex-wrap: wrap;
          gap: 8px;
        }

        .domain-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFD10D;
          color: #1F2937;
          padding: 8px 18px;
          border-radius: 12px;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: -0.4px;
          box-shadow: 0 4px 14px rgba(255, 209, 13, 0.35);
        }

        .domain-slogan {
          font-size: 11.5px;
          font-weight: 700;
        }

        .flyer-dark .domain-slogan {
          color: #CBD5E1;
        }

        .flyer-light .domain-slogan {
          color: #475569;
        }

        .footer-contacts {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          flex-wrap: wrap;
        }

        .contact-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .flyer-dark .contact-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }

        .flyer-light .contact-pill {
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          color: #1E293B;
        }

        .phone-pill strong {
          color: #38BDF8;
        }

        .flyer-light .phone-pill strong {
          color: #0284C7;
        }

        .whatsapp-pill strong {
          color: #34D399;
        }

        .flyer-light .whatsapp-pill strong {
          color: #059669;
        }

        .footer-copyright {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .flyer-dark .footer-copyright {
          color: #64748B;
        }

        .flyer-light .footer-copyright {
          color: #94A3B8;
        }

        /* Mobile Adjustments for screen view */
        @media (max-width: 820px) {
          .flyer-a4 {
            width: 100% !important;
            min-height: auto !important;
            padding: 20px 16px !important;
          }

          .flyer-hero-qr-section {
            grid-template-columns: 1fr;
          }

          .qr-card {
            max-width: 220px;
            margin: 0 auto;
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }

          .footer-domain-row {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
