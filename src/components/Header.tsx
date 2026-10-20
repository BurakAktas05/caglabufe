'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MapPin, ShoppingBag, User as UserIcon, ChevronDown, Headphones, Award } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { LanguageSelector } from './LanguageSelector';
import { getVipTierInfo } from '@/lib/settingsManager';

export const Header = () => {
  const {
    cartTotal,
    itemCount,
    setIsCartOpen,
    selectedAddress,
    setIsAddressModalOpen,
    user,
    orders,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setIsSupportModalOpen,
    minOrderAmount,
    t,
  } = useApp();

  const vipTier = React.useMemo(() => {
    if (!user) return null;
    const count = orders.length;
    const total = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    return getVipTierInfo(count, total);
  }, [user, orders]);

  return (
    <header className="main-header">
      <div className="header-inner">
        {/* Brand / Logo */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }} title="Çağla Büfe & Market Karabük">
          <BrandLogo size="md" showSubtitle={false} />
        </Link>

        {/* Right Actions */}
        <div className="header-actions">
          {/* Address Selector in Header (Sağ Üstte Adresler) */}
          <button
            type="button"
            className="address-selector-btn"
            onClick={() => setIsAddressModalOpen(true)}
            title="Teslimat Adresini Değiştir / Kayıtlı Adreslerim"
          >
            <div className="address-icon-wrap">
              <MapPin size={15} />
            </div>
            <div className="address-text-col">
              <span className="address-label">
                {selectedAddress ? t('delivery', 'Teslimat') : t('selectAddress', 'Adres Seç')}
                {minOrderAmount > 0 && (
                  <span style={{ color: '#FFD10D', fontWeight: 800, textTransform: 'none' }}>
                    {' '}• {minOrderAmount}₺
                  </span>
                )}
              </span>
              <span
                className="address-title"
                title={
                  selectedAddress
                    ? `${selectedAddress.title} - ${selectedAddress.district || ''}`
                    : t('selectAddress', 'Teslimat Adresi Seç')
                }
              >
                {selectedAddress
                  ? selectedAddress.type === 'dormitory'
                    ? (selectedAddress.dormName || selectedAddress.title)
                    : selectedAddress.title
                  : `📍 ${t('addAddress', 'Adres Ekle')}`}
              </span>
            </div>
            <ChevronDown size={14} className="address-chevron" />
          </button>

          {/* Dil Seçici (TR, EN, RU, AR, FR) */}
          <LanguageSelector />

          {/* Canlı Destek & İletişim Butonu */}
          <button
            type="button"
            className="header-link-btn"
            onClick={() => setIsSupportModalOpen(true)}
            title="Sipariş & Teknik Destek"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: '#F3F0FE',
              border: '1px solid #DDD6FE',
              color: '#5D3EBC',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Headphones size={15} color="#5D3EBC" />
            <span className="d-desktop">{t('support', 'Destek')}</span>
          </button>

          {/* User Profile on Desktop only (Mobilde sağ alt BottomNav'da) */}
          {user ? (
            <button
              type="button"
              className="header-link-btn d-desktop"
              onClick={() => setIsProfileModalOpen(true)}
              title={`Hesabım & Sipariş Geçmişim (${vipTier?.label || 'Müdavim'})`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserIcon size={16} />
              <span className="header-btn-text">{user.fullName.split(' ')[0]}</span>
              {vipTier && vipTier.level !== 'new' && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    backgroundColor: vipTier.bg,
                    color: vipTier.color,
                    border: `1px solid ${vipTier.border}`,
                    padding: '1px 6px',
                    borderRadius: '8px',
                    lineHeight: '14px',
                    letterSpacing: '0.2px',
                  }}
                >
                  {vipTier.badge}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="header-link-btn d-desktop"
              onClick={() => setIsAuthModalOpen(true)}
              title="Giriş Yap"
            >
              <UserIcon size={16} />
              <span className="header-btn-text">{t('login', 'Giriş Yap')}</span>
            </button>
          )}

          {/* Cart Button on Desktop only (Mobilde alt navigasyonda ve sepeti onayla çubuğunda) */}
          <button
            type="button"
            className="header-cart-btn d-desktop"
            onClick={() => setIsCartOpen(true)}
            aria-label="Sepeti Aç"
          >
            <div className="cart-btn-icon">
              <ShoppingBag size={18} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </div>
            <span className="cart-btn-total">₺{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
