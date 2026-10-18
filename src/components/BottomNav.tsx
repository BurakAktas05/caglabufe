'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Home, ShoppingBag, Clock, MapPin } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();
  const {
    itemCount,
    setIsCartOpen,
    orders,
    setActiveTrackingOrder,
    cartTotal,
    setIsAddressModalOpen,
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
          onClick={() => setIsAddressModalOpen(true)}
          title="KYK & Teslimat Adresi"
        >
          <div className="dock-icon-wrapper">
            <MapPin size={20} />
          </div>
          <span>Adresim</span>
        </button>
      </div>
    </nav>
  );
};
