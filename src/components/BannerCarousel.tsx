'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Clock, CreditCard, ShieldCheck, ShoppingBag } from 'lucide-react';

export const BannerCarousel = () => {
  const { systemSettings } = useApp();
  const storeName = systemSettings?.storeName || 'Çağla Büfe & Market';
  const hours = systemSettings ? `${systemSettings.storeOpenTime} - ${systemSettings.storeCloseTime}` : '16:00 - 03:00';

  return (
    <div className="promo-banner-container">
      <div className="promo-banner">
        <div className="promo-content">
          <div className="promo-badge">
            <span style={{ fontWeight: 800 }}>KARABÜK • 100. YIL • KYK YURTLARI • {hours} AÇIK</span>
          </div>
          <h1 className="promo-title">
            {storeName} Kapında
          </h1>
          <p className="promo-subtitle">
            <span className="hide-on-mobile">Ekmek, süt, yumurta, 5L su, atıştırmalık ve </span>gece sıcak tostları 15-20 dakikada odana teslim.
          </p>

          <div className="promo-info-row">
            <div className="promo-info-item">
              <Clock size={13} color="#FFD10D" />
              <span>15-20 Dk Teslim</span>
            </div>
            <div className="promo-info-item">
              <CreditCard size={13} color="#FFD10D" />
              <span>Kapıda Nakit / POS</span>
            </div>
            <div className="promo-info-item hide-on-mobile">
              <ShoppingBag size={13} color="#FFD10D" />
              <span>Gerçek Mahalle Bakkalı</span>
            </div>
            <div className="promo-info-item hide-on-mobile">
              <ShieldCheck size={13} color="#FFD10D" />
              <span>Eksiksiz &amp; Taze</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
