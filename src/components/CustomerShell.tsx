'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CartDrawer } from '@/components/CartDrawer';
import { AddressModal } from '@/components/AddressModal';
import { AuthModal } from '@/components/AuthModal';
import { ProfileModal } from '@/components/ProfileModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { ToastContainer } from '@/components/ToastContainer';
import { BottomNav } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { NotificationPromptBanner } from '@/components/NotificationPromptBanner';
import { StoreClosedOverlay } from '@/components/StoreClosedOverlay';

/**
 * Isolates all customer-facing modals, overlays, and floating elements.
 * Strictly guarantees that NOTHING customer-related (such as 'Şu Anda Kapalıyız',
 * CartDrawer, BottomNav, customer toasts) can ever leak into the /admin portal.
 */
export const CustomerShell = () => {
  const pathname = usePathname();

  const isExcluded =
    Boolean(pathname && (pathname.startsWith('/admin') || pathname === '/brosur')) ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/admin') || window.location.pathname === '/brosur'));

  if (isExcluded) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <AddressModal />
      <AuthModal />
      <ProfileModal />
      <OrderTrackingModal />
      <ToastContainer />
      <BottomNav />
      <NotificationPromptBanner />
      <PWAInstallBanner />
      <StoreClosedOverlay />
    </>
  );
};
