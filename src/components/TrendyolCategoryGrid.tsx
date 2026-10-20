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

  const drinkPills = [
    { label: t('pillKola', '🥤 Kutu Kola'), query: 'Kola' },
    { label: t('pillAyran', '🥛 Yayık Ayran'), query: 'Ayran' },
    { label: t('pillSogukCay', '🍑 Soğuk Çay'), query: 'Soğuk Çay' },
    { label: t('pillEnerji', '⚡ Enerji İçeceği'), query: 'Enerji' },
  ];

  const snackPills = [
    { label: t('pillCikolata', '🍫 Çikolata'), query: 'Çikolata' },
    { label: t('pillGofret', '🧇 Çıtır Gofret'), query: 'Gofret' },
    { label: t('pillBiskuvi', '🍪 Bisküvi'), query: 'Bisküvi' },
  ];

  const chipsPills = [
    { label: t('pillCips', '🥔 Baharatlı Cips'), query: 'Cips' },
    { label: t('pillCerez', '🥜 Kuruyemiş & Fıstık'), query: 'Kuruyemiş' },
  ];

  const coffeePills = [
    { label: t('pillKahve', '☕ Kahve'), query: 'Kahve' },
    { label: t('pillCay', '🫖 Demleme Çay'), query: 'Çay' },
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
        <div className="bento-card-hero">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
              {/* Badges Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '3px 9px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    letterSpacing: '0.3px',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                  }}
                >
                  <Flame size={13} fill="#FFFFFF" className="flame-anim" />
                  <span>{t('bentoHotKitchenBadge', 'Ateşte Pişen Lezzetler')}</span>
                </span>
                <span
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#C2410C',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid #FDBA74',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={12} />
                  <span>{t('bentoHotKitchenPrep', '~20-25 dk Taze Hazırlanır')}</span>
                </span>
                <span
                  style={{
                    backgroundColor: '#FFF7ED',
                    color: '#9A3412',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid #FED7AA',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MapPin size={12} />
                  <span>{t('bentoHotKitchenDorm', 'KYK & Kampüs Kapısına')}</span>
                </span>
              </div>

              {/* Title & Desc */}
              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#9A3412',
                  margin: '0 0 6px',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.25,
                }}
              >
                🥪 {t('bentoHotKitchenTitle', 'Sıcak Mutfak & Efsane Tostlar')}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#7C2D12',
                  margin: '0 0 14px',
                  lineHeight: 1.45,
                  fontWeight: 500,
                  maxWidth: '520px',
                }}
              >
                {t(
                  'bentoHotKitchenDesc',
                  'Bol kaşarlı sıcak tostlar, çıtır sandviçler ve sıcacık büfe lezzetleri taze hazırlanıp kapında.'
                )}
              </p>

              {/* Quick Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
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
              <Link
                href="/urunler?reyon=hazir-yiyecek"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t('bentoHotKitchenBtn', 'Tostları Gör & Sipariş Ver')}</span>
                <ArrowRight size={15} className="rtl-flip" />
              </Link>
            </div>

            {/* Visual Hero Image Container */}
            <div
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
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  right: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  letterSpacing: '0.2px',
                }}
              >
                🔥 Taze &amp; Çıtır
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. BENTO TILE: BUZ GİBİ İÇECEKLER & SU --- */}
        <div
          className="bento-sub-card"
          style={{
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 55%, #BAE6FD 100%)',
            border: '1.5px solid #7DD3FC',
            boxShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.2px',
                }}
              >
                🧊 {t('bentoColdDrinksBadge', 'Buz Gibi Ferahlık')}
              </span>
              <div
                style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #BAE6FD',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/categories/soguk-icecek.jpg"
                  alt="Soğuk İçecek"
                  fill
                  sizes="42px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#0369A1', margin: '0 0 4px' }}>
              {t('bentoColdDrinksTitle', 'Buz Gibi İçecekler & Su')}
            </h4>
            <p style={{ fontSize: '12px', color: '#075985', margin: '0 0 10px', lineHeight: 1.35, fontWeight: 500 }}>
              {t('bentoColdDrinksDesc', 'Kola, ayran, soğuk çay ve enerji içecekleri kapında.')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {drinkPills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={`/urunler?q=${encodeURIComponent(pill.query)}`}
                  className="bento-pill"
                  style={{
                    color: '#0369A1',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/urunler?reyon=soguk-icecek"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#0284C7',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('viewAllAisles', 'İncele')}</span>
              <ArrowRight size={13} className="rtl-flip" />
            </Link>
          </div>
        </div>

        {/* --- 3. BENTO TILE: KANTİN & ÇITIR ATIŞTIRMALIK --- */}
        <div
          className="bento-sub-card"
          style={{
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 55%, #DDD6FE 100%)',
            border: '1.5px solid #C4B5FD',
            boxShadow: '0 4px 16px -2px rgba(126, 34, 206, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#7E22CE',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                🍫 {t('bentoSnacksBadge', 'Müdavim Favorileri')}
              </span>
              <div
                style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DDD6FE',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/categories/kantin-atistirmalik.jpg"
                  alt="Kantin Atıştırmalık"
                  fill
                  sizes="42px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#6B21A8', margin: '0 0 4px' }}>
              {t('bentoSnacksTitle', 'Kantin & Çıtır Atıştırmalık')}
            </h4>
            <p style={{ fontSize: '12px', color: '#581C87', margin: '0 0 10px', lineHeight: 1.35, fontWeight: 500 }}>
              {t('bentoSnacksDesc', 'Çikolata, gofret, bisküvi ve kek çeşitleri.')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {snackPills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={`/urunler?q=${encodeURIComponent(pill.query)}`}
                  className="bento-pill"
                  style={{
                    color: '#6B21A8',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DDD6FE',
                  }}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/urunler?reyon=kantin-atistirmalik"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#7E22CE',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('viewAllAisles', 'İncele')}</span>
              <ArrowRight size={13} className="rtl-flip" />
            </Link>
          </div>
        </div>

        {/* --- 4. BENTO TILE: CİPS & KURUYEMİŞ KEYFİ --- */}
        <div
          className="bento-sub-card"
          style={{
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 55%, #FECDD3 100%)',
            border: '1.5px solid #FDA4AF',
            boxShadow: '0 4px 16px -2px rgba(225, 29, 72, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                🍿 {t('bentoChipsBadge', 'Film & Dizi Keyfi')}
              </span>
              <div
                style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FECDD3',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/categories/cips-cerez.jpg"
                  alt="Cips & Çerez"
                  fill
                  sizes="42px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#BE123C', margin: '0 0 4px' }}>
              {t('bentoChipsTitle', 'Cips & Kuruyemiş Keyfi')}
            </h4>
            <p style={{ fontSize: '12px', color: '#9F1239', margin: '0 0 10px', lineHeight: 1.35, fontWeight: 500 }}>
              {t('bentoChipsDesc', 'Patates cipsi, fıstık ve taze çekirdek.')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {chipsPills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={`/urunler?q=${encodeURIComponent(pill.query)}`}
                  className="bento-pill"
                  style={{
                    color: '#BE123C',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FECDD3',
                  }}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/urunler?reyon=cips-cerez"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#E11D48',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('viewAllAisles', 'İncele')}</span>
              <ArrowRight size={13} className="rtl-flip" />
            </Link>
          </div>
        </div>

        {/* --- 5. BENTO TILE: KAHVE & ÇAY MOLASI --- */}
        <div
          className="bento-sub-card"
          style={{
            background: 'linear-gradient(135deg, #FEFCE8 0%, #FEF08A 55%, #FDE047 100%)',
            border: '1.5px solid #EAB308',
            boxShadow: '0 4px 16px -2px rgba(161, 98, 7, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#A16207',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                ☕ {t('bentoCoffeeBadge', 'Sıcak Mola')}
              </span>
              <div
                style={{
                  position: 'relative',
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FDE047',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/categories/kahve-cay.jpg"
                  alt="Kahve & Çay"
                  fill
                  sizes="42px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 900, color: '#854D0E', margin: '0 0 4px' }}>
              {t('bentoCoffeeTitle', 'Kahve & Çay Molası')}
            </h4>
            <p style={{ fontSize: '12px', color: '#713F12', margin: '0 0 10px', lineHeight: 1.35, fontWeight: 500 }}>
              {t('bentoCoffeeDesc', 'Nescafe, filtre kahve ve sıcacık demleme çay.')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {coffeePills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={`/urunler?q=${encodeURIComponent(pill.query)}`}
                  className="bento-pill"
                  style={{
                    color: '#854D0E',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FDE047',
                  }}
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/urunler?reyon=kahve-cay"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#A16207',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{t('viewAllAisles', 'İncele')}</span>
              <ArrowRight size={13} className="rtl-flip" />
            </Link>
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
