'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DEPARTMENTS, Department } from '@/data/departments';
import { CATEGORIES } from '@/data/categories';
import { useApp } from '@/context/AppContext';
import {
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Flame,
  Clock,
  MapPin,
  Store,
} from 'lucide-react';

interface TrendyolCategoryGridProps {
  onSelectCategory?: (category: string) => void;
}

export const TrendyolCategoryGrid: React.FC<TrendyolCategoryGridProps> = () => {
  const { t, dir } = useApp();
  const [showAllSubCategories, setShowAllSubCategories] = useState(false);

  const hotPills = [
    { label: t('pillKasarliTost', '🥪 Kaşarlı Tost'), query: 'Kaşarlı Tost' },
    { label: t('pillKarisikTost', '🥓 Karışık Tost'), query: 'Karışık Tost' },
    { label: t('pillAyvalikTost', '🥖 Ayvalık Tostu'), query: 'Ayvalık' },
    { label: t('pillSicakSandvic', '🌭 Sıcak Sandviç'), query: 'Sandviç' },
    { label: t('pillPatatesSos', '🍟 Çıtır Patates'), query: 'Patates' },
    { label: t('pillNoodleMakarna', '🍜 Noodle & Makarna'), query: 'Noodle' },
  ];

  return (
    <section className="trendyol-category-section" style={{ marginBottom: '32px' }} dir={dir}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#1F2937',
                letterSpacing: '-0.3px',
                margin: 0,
              }}
            >
              {t('allAisles', 'Market & Kantin Reyonları')}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: '#F3F0FE',
                color: '#5D3EBC',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid #DDD6FE',
              }}
            >
              {t('fastDelivery', 'Hızlı Teslimat')}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 500, margin: 0 }}>
            {t('aislesSubtitle', 'İhtiyacın olan reyonu seç, siparişin dakikalar içinde kapına gelsin.')}
          </p>
        </div>

        <Link
          href="/urunler"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#5D3EBC',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: '#F3F0FE',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{t('viewAllAisles', 'Tüm Reyonları Gör')}</span>
          <ArrowRight size={14} className="rtl-flip" />
        </Link>
      </div>

      {/* ======================================================================
          BENTO GRID SHOWCASE (HERO TOST + 4 KEY COMPANION TILES)
          ====================================================================== */}
      <div className="bento-showcase-grid">
        {/* --- 1. HERO BENTO: SICAK MUTFAK & EFSANE TOSTLAR --- */}
        {/* --- 1. HERO BENTO: SICAK MUTFAK & EFSANE TOSTLAR --- */}
        <div className="bento-card-hero">
          <div className="bento-hero-wrapper">
            <div className="bento-hero-main">
              {/* Badges Bar */}
              <div className="bento-badges-row">
                <span className="bento-badge-flame">
                  <Flame size={13} fill="#FFFFFF" className="flame-anim" />
                  <span>{t('bentoHotKitchenBadge', 'Ateşte Pişen Lezzetler')}</span>
                </span>
                <span className="bento-badge-prep">
                  <Clock size={12} />
                  <span>{t('bentoHotKitchenPrep', '~20-25 dk Taze')}</span>
                </span>
                <span className="bento-badge-loc">
                  <MapPin size={12} />
                  <span>{t('bentoHotKitchenDorm', 'KYK & Kampüs')}</span>
                </span>
              </div>

              {/* Title & Mobile Image Row */}
              <div className="bento-title-mobile-row">
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <h3 className="bento-hero-heading">
                    🥪 {t('bentoHotKitchenTitle', 'Sıcak Mutfak & Efsane Tostlar')}
                  </h3>
                  <p className="bento-hero-paragraph">
                    {t(
                      'bentoHotKitchenDesc',
                      'Bol kaşarlı sıcak tostlar, çıtır sandviçler ve sıcacık büfe lezzetleri taze hazırlanıp kapında.'
                    )}
                  </p>
                </div>
                {/* Mobile Hero Thumbnail */}
                <div
                  className="bento-hero-img-mobile"
                  style={{
                    position: 'relative',
                    width: '74px',
                    height: '74px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.22)',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src="/categories/hot-tost-hero.jpg"
                    alt="Sıcak Tost"
                    fill
                    sizes="74px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                  <div className="bento-mobile-tag">🔥 Taze</div>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="bento-pills-container">
                {hotPills.map((pill, idx) => (
                  <Link
                    key={idx}
                    href={`/urunler?q=${encodeURIComponent(pill.query)}`}
                    className="bento-pill"
                    style={{
                      color: '#9A3412',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #FED7AA',
                    }}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>

              {/* Action Button */}
              <div className="bento-cta-wrapper">
                <Link
                  href="/urunler?reyon=sicak-mutfak"
                  className="bento-cta-btn"
                >
                  <span>{t('bentoHotKitchenBtn', 'Tostları Gör & Sipariş Ver')}</span>
                  <ArrowRight size={15} className="rtl-flip" />
                </Link>
              </div>
            </div>

            {/* Desktop Hero Image Container (hidden on mobile) */}
            <div
              className="bento-hero-img-desktop"
              style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.22)',
                border: '3px solid #FFFFFF',
                flexShrink: 0,
              }}
            >
              <Image
                src="/categories/hot-tost-hero.jpg"
                alt="Sıcak Tost"
                fill
                sizes="140px"
                style={{ objectFit: 'cover' }}
                priority
              />
              <div className="bento-desktop-tag">
                🔥 Taze &amp; Çıtır
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ======================================================================
          FULL REYON DIRECTORY (ALL 11 AISLES)
          ====================================================================== */}
      <div style={{ marginTop: '28px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1F2937', margin: 0 }}>
              {t('allAislesHeader', 'Tüm Market & Bakkal Reyonları')}
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
              {t('allAislesDesc', 'Temel gıda, kahvaltılık, kişisel bakım ve ev ihtiyaçları.')}
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#5D3EBC', backgroundColor: '#F3F0FE', padding: '2px 8px', borderRadius: '8px' }}>
            {DEPARTMENTS.length} {t('allAisles', 'Reyon')}
          </span>
        </div>

        <div className="trendyol-category-grid">
          {DEPARTMENTS.map((dept: Department) => {
            const translatedName = t(`cat.${dept.id}`, dept.name);
            const translatedBadge = t(`cat.${dept.id}.badge`, dept.badge);

            return (
              <Link
                key={dept.id}
                href={`/urunler?reyon=${dept.id}`}
                className="trendyol-category-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  className="trendyol-card-inner"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    padding: '12px 10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Image container */}
                  <div
                    className="trendyol-img-box"
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1 / 1',
                      maxHeight: '105px',
                      backgroundColor: dept.accentBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={dept.id === 'hazir-yiyecek' ? '/categories/hot-tost-hero.jpg' : dept.imageUrl}
                      alt={translatedName}
                      fill
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 15vw"
                      style={{
                        objectFit: 'cover',
                        transition: 'transform 0.25s ease',
                      }}
                      className="category-product-img"
                    />
                  </div>

                  {/* Department name */}
                  <h3
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#1F2937',
                      lineHeight: 1.25,
                      margin: '0 0 3px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '30px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {translatedName}
                  </h3>

                  {/* Subtitle / hint */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#6B7280',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  >
                    {translatedBadge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Subcategory Toggle (Show all 66 specific micro-categories) */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setShowAllSubCategories((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#6B7280',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={14} color="#5D3EBC" />
          <span>
            {showAllSubCategories
              ? t('hideAllSubcategories', 'Tüm Alt Reyonları Gizle')
              : t('showAllSubcategories', 'Tüm 66 Detaylı Alt Reyonu Göster (Çikolata, Cips, vb.)')}
          </span>
          {showAllSubCategories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAllSubCategories && (
          <div
            style={{
              marginTop: '14px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/urunler?kategori=${encodeURIComponent(cat.id)}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
