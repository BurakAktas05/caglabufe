'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MapPin, ShoppingBag, User as UserIcon, ChevronDown } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Header = () => {
  const {
    cartTotal,
    itemCount,
    setIsCartOpen,
    selectedAddress,
    setIsAddressModalOpen,
    user,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    minOrderAmount,
  } = useApp();

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
                {selectedAddress ? 'Teslimat' : 'Adres Seç'}
                {minOrderAmount > 0 && (
                  <span style={{ color: '#FFD10D', fontWeight: 800, textTransform: 'none' }}>
                    {' '}• {minOrderAmount}₺
                  </span>
                )}
              </span>
              <span className="address-title">
                {selectedAddress
                  ? selectedAddress.type === 'dormitory'
                    ? (selectedAddress.dormName || selectedAddress.title)
                    : `${selectedAddress.title} (${selectedAddress.district})`
                  : '📍 Adres Ekle'}
              </span>
            </div>
            <ChevronDown size={14} className="address-chevron" />
          </button>

          {/* User Profile on Desktop only (Mobilde sağ alt BottomNav'da) */}
          {user ? (
            <button
              type="button"
              className="header-link-btn d-desktop"
              onClick={() => setIsProfileModalOpen(true)}
              title="Hesabım & Sipariş Geçmişim"
            >
              <UserIcon size={16} />
              <span className="header-btn-text">{user.fullName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              className="header-link-btn d-desktop"
              onClick={() => setIsAuthModalOpen(true)}
              title="Giriş Yap"
            >
              <UserIcon size={16} />
              <span className="header-btn-text">Giriş Yap</span>
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
