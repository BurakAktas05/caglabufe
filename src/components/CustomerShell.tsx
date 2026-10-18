'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CartDrawer } from '@/components/CartDrawer';
import { AddressModal } from '@/components/AddressModal';
import { AuthModal } from '@/components/AuthModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { BottomNav } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { StoreClosedOverlay } from '@/components/StoreClosedOverlay';

/**
 * Isolates all customer-facing modals, overlays, and floating elements.
 * Strictly guarantees that NOTHING customer-related (such as 'Şu Anda Kapalıyız',
 * CartDrawer, BottomNav, customer toasts) can ever leak into the /admin portal.
 */
export const CustomerShell = () => {
  const pathname = usePathname();

  const isAdmin =
    Boolean(pathname && pathname.startsWith('/admin')) ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <AddressModal />
      <AuthModal />
      <OrderTrackingModal />
      <ToastContainer />
      <BottomNav />
      <PWAInstallBanner />
      <StoreClosedOverlay />
    </>
  );
};
