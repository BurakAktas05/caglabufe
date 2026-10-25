'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ToastContainer } from '@/components/ToastContainer';
import { BottomNav } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { NotificationPromptBanner } from '@/components/NotificationPromptBanner';
import { StoreClosedOverlay } from '@/components/StoreClosedOverlay';
import { VipNotificationBanner } from '@/components/VipNotificationBanner';
import { useApp } from '@/context/AppContext';

// Code-split heavy modals to dramatically optimize initial load, FCP, LCP and Speed Index
const CartDrawer = dynamic(() => import('@/components/CartDrawer').then((m) => m.CartDrawer), { ssr: false });
const AddressModal = dynamic(() => import('@/components/AddressModal').then((m) => m.AddressModal), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal').then((m) => m.AuthModal), { ssr: false });
const ProfileModal = dynamic(() => import('@/components/ProfileModal').then((m) => m.ProfileModal), { ssr: false });
const OrderTrackingModal = dynamic(() => import('@/components/OrderTrackingModal').then((m) => m.OrderTrackingModal), { ssr: false });
const BannedUserModal = dynamic(() => import('@/components/BannedUserModal').then((m) => m.BannedUserModal), { ssr: false });
const SupportModal = dynamic(() => import('@/components/SupportModal').then((m) => m.SupportModal), { ssr: false });
const LanguageWelcomeModal = dynamic(() => import('@/components/LanguageWelcomeModal').then((m) => m.LanguageWelcomeModal), { ssr: false });

/**
 * Isolates all customer-facing modals, overlays, and floating elements.
 * Strictly guarantees that NOTHING customer-related (such as 'Şu Anda Kapalıyız',
 * CartDrawer, BottomNav, customer toasts) can ever leak into the /admin portal.
 */
export const CustomerShell = () => {
  const pathname = usePathname();
  const {
    isCartOpen,
    isAddressModalOpen,
    isAuthModalOpen,
    isProfileModalOpen,
    activeTrackingOrder,
    bannedModalInfo,
    setBannedModalInfo,
    logoutUser,
    systemSettings,
    isSupportModalOpen,
    setIsSupportModalOpen,
    isLanguageWelcomeOpen,
    setIsLanguageWelcomeOpen,
  } = useApp();

  const isAnyModalOpen = Boolean(
    isCartOpen ||
    isAddressModalOpen ||
    isAuthModalOpen ||
    isProfileModalOpen ||
    activeTrackingOrder ||
    bannedModalInfo ||
    isSupportModalOpen ||
    isLanguageWelcomeOpen
  );

  const isExcluded =
    Boolean(pathname && (pathname.startsWith('/admin') || pathname === '/brosur')) ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/admin') || window.location.pathname === '/brosur'));

  if (isExcluded) {
    return null;
  }

  return (
    <>
      {isCartOpen && <CartDrawer />}
      {isAddressModalOpen && <AddressModal />}
      {isAuthModalOpen && <AuthModal />}
      {isProfileModalOpen && <ProfileModal />}
      {activeTrackingOrder && <OrderTrackingModal />}
      <ToastContainer />
      <BottomNav />
      {!isAnyModalOpen && <NotificationPromptBanner />}
      {!isAnyModalOpen && <PWAInstallBanner />}
      <StoreClosedOverlay />
      {bannedModalInfo && (
        <BannedUserModal
          bannedInfo={bannedModalInfo}
          isOpen={Boolean(bannedModalInfo)}
          onClose={() => setBannedModalInfo(null)}
          onLogout={() => {
            logoutUser();
            setBannedModalInfo(null);
          }}
          storePhone={systemSettings.storePhone}
          storeWhatsApp={systemSettings.storeWhatsApp}
        />
      )}
      {isSupportModalOpen && (
        <SupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      )}
      {isLanguageWelcomeOpen && (
        <LanguageWelcomeModal
          isOpen={isLanguageWelcomeOpen}
          onClose={() => setIsLanguageWelcomeOpen(false)}
        />
      )}
      {!isAnyModalOpen && <VipNotificationBanner />}
    </>
  );
};
