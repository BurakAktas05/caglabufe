'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Clock, CreditCard, ShieldCheck, ShoppingBag } from 'lucide-react';

export const BannerCarousel = () => {
  const { systemSettings, locale } = useApp();
  const storeName = systemSettings?.storeName || 'Çağla Büfe & Market';
  const hours = systemSettings ? `${systemSettings.storeOpenTime} - ${systemSettings.storeCloseTime}` : '16:00 - 03:00';

  const getOpenLabel = () => {
    switch (locale) {
      case 'en': return 'OPEN';
      case 'ru': return 'ОТКРЫТО';
      case 'ar': return 'مفتوح';
      case 'fr': return 'OUVERT';
      case 'tr': default: return 'AÇIK';
    }
  };

  const getTitle = () => {
    switch (locale) {
      case 'en': return `${storeName} at Your Door`;
      case 'ru': return `${storeName} у вашей двери`;
      case 'ar': return `${storeName} عند بابك`;
      case 'fr': return `${storeName} à votre porte`;
      case 'tr': default: return `${storeName} Kapında`;
    }
  };

  const getSubtitle = () => {
    switch (locale) {
      case 'en': return 'Cold drinks, chips, chocolate, biscuits, energy drinks and market snacks at your door in 20-30 minutes.';
      case 'ru': return 'Холодные напитки, чипсы, шоколад, печенье, энергетики и товары маркета у вашей двери за 20-30 минут.';
      case 'ar': return 'مشروبات باردة، شيبس، شوكولاتة، بسكويت، مشروبات طاقة ومستلزمات الماركت عند بابك خلال 20-30 دقيقة.';
      case 'fr': return 'Boissons fraîches, chips, chocolat, biscuits, boissons énergisantes et produits de marché à votre porte en 20-30 minutes.';
      case 'tr': default: return 'Soğuk içecekler, cips, çikolata, bisküvi, enerji içecekleri ve market lezzetleri 20-30 dakikada kapında.';
    }
  };

  const getPills = () => {
    switch (locale) {
      case 'en':
        return {
          delivery: '20-30 Min Delivery',
          payment: 'Cash / POS at Door',
          variety: 'Wide Product Range',
          fresh: 'Fresh & Complete',
        };
      case 'ru':
        return {
          delivery: 'Доставка за 20-30 мин',
          payment: 'Оплата при получении',
          variety: 'Широкий ассортимент',
          fresh: 'Свежее и полное',
        };
      case 'ar':
        return {
          delivery: 'توصيل 20-30 دقيقة',
          payment: 'الدفع عند الاستلام',
          variety: 'تشكيلة واسعة',
          fresh: 'طازج وكامل',
        };
      case 'fr':
        return {
          delivery: 'Livraison 20-30 min',
          payment: 'Paiement à la livraison',
          variety: 'Large choix de produits',
          fresh: 'Frais et complet',
        };
      case 'tr':
      default:
        return {
          delivery: '20-30 Dk Teslimat',
          payment: 'Kapıda Nakit / POS',
          variety: 'Geniş Ürün Çeşidi',
          fresh: 'Eksiksiz & Taze',
        };
    }
  };

  const pills = getPills();

  return (
    <div className="promo-banner-container">
      <div className="promo-banner">
        <div className="promo-content">
          <div className="promo-badge">
            <span style={{ fontWeight: 800 }}>BOSTANBÜKÜ • SAFRANBOLU • KARABÜK • {hours} {getOpenLabel()}</span>
          </div>
          <h1 className="promo-title">
            {getTitle()}
          </h1>
          <p className="promo-subtitle">
            {getSubtitle()}
          </p>

          <div className="promo-info-row">
            <div className="promo-info-item">
              <Clock size={13} color="#FFD10D" />
              <span>{pills.delivery}</span>
            </div>
            <div className="promo-info-item">
              <CreditCard size={13} color="#FFD10D" />
              <span>{pills.payment}</span>
            </div>
            <div className="promo-info-item hide-on-mobile">
              <ShoppingBag size={13} color="#FFD10D" />
              <span>{pills.variety}</span>
            </div>
            <div className="promo-info-item hide-on-mobile">
              <ShieldCheck size={13} color="#FFD10D" />
              <span>{pills.fresh}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
