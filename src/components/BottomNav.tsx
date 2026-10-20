'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Home, ShoppingBag, Clock, User, Award } from 'lucide-react';
import { getVipTierInfo } from '@/lib/settingsManager';

export const BottomNav = () => {
  const pathname = usePathname();
  const {
    itemCount,
    setIsCartOpen,
    orders,
    setActiveTrackingOrder,
    cartTotal,
    user,
    setIsProfileModalOpen,
    setIsAuthModalOpen,
    showToast,
    t,
  } = useApp();

  const vipTier = React.useMemo(() => {
    if (!user) return null;
    const count = orders.length;
    const total = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    return getVipTierInfo(count, total);
  }, [user, orders]);

  const latestActiveOrder = orders.find(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way'
  );

  // Do not show customer bottom nav on admin portal
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="mobile-dock">
      <div className="dock-container">
        <Link
          href="/"
          className={`dock-item ${pathname === '/' ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>{t('home', 'Ana Sayfa')}</span>
        </Link>

        <button
          type="button"
          className={`dock-item ${latestActiveOrder ? 'has-active' : ''}`}
          onClick={() => {
            if (latestActiveOrder) {
              setActiveTrackingOrder(latestActiveOrder);
            } else if (orders.length > 0) {
              setActiveTrackingOrder(orders[0]);
            } else {
              showToast('Henüz verilmiş bir siparişiniz bulunmamaktadır.', 'info');
            }
          }}
        >
          <div className="dock-icon-wrapper">
            <Clock size={20} />
            {latestActiveOrder && <span className="dock-dot" />}
          </div>
          <span>{t('myOrder', 'Siparişim')}</span>
        </button>

        <button
          type="button"
          className="dock-item"
          onClick={() => setIsCartOpen(true)}
        >
          <div className="dock-icon-wrapper">
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className="dock-badge">{itemCount}</span>}
          </div>
          <span>{itemCount > 0 ? `₺${cartTotal.toFixed(0)}` : t('cart', 'Sepetim')}</span>
        </button>

        <button
          type="button"
          className="dock-item"
          onClick={() => {
            if (user) {
              setIsProfileModalOpen(true);
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          title={user ? `Hesabım & Profilim (${vipTier?.badge || 'VIP'})` : 'Giriş Yap'}
        >
          <div className="dock-icon-wrapper" style={{ position: 'relative' }}>
            <User size={20} />
            {vipTier && vipTier.level !== 'new' && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  fontSize: '11px',
                  lineHeight: 1,
                }}
                title={vipTier.label}
              >
                {vipTier.iconEmoji}
              </span>
            )}
          </div>
          <span>
            {user
              ? `${user.fullName.split(' ')[0]}`
              : t('profile', 'Profilim')}
          </span>
        </button>
      </div>
    </nav>
  );
};
