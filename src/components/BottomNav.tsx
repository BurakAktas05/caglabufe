'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Home, ShoppingBag, Clock, User } from 'lucide-react';

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
  } = useApp();

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
          <span>Ana Sayfa</span>
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
          <span>Siparişim</span>
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
          <span>{itemCount > 0 ? `₺${cartTotal.toFixed(0)}` : 'Sepetim'}</span>
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
          title="Hesabım & Profilim"
        >
          <div className="dock-icon-wrapper">
            <User size={20} />
          </div>
          <span>{user ? user.fullName.split(' ')[0] : 'Profilim'}</span>
        </button>
      </div>
    </nav>
  );
};
