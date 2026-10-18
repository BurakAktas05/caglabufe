'use client';

import React from 'react';
import {
  Menu,
  Volume2,
  Bell,
  Power,
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onOpenMobileMenu: () => void;
  pendingCount: number;
  preparingCount: number;
  onTestSound: () => void;
  isStoreOpen: boolean;
  onToggleStoreOpen: () => void;
  onRequestNotificationPermission?: () => void;
  notificationPermission?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  pendingCount,
  preparingCount,
  onTestSound,
  isStoreOpen,
  onToggleStoreOpen,
  onRequestNotificationPermission,
  notificationPermission,
}) => {
  const tabTitles: Record<AdminTab, string> = {
    orders: 'Canlı Sipariş Masası',
    daily: 'Günlük Kasa & Z-Raporu',
    inventory: 'Ürün Stok & Menü Yönetimi',
    campaigns: 'Kampanyalar & Fırsat Paketleri',
    zones: 'Teslimat Bölgeleri & KYK Yurtları',
    settings: 'Mağaza & Bildirim Ayarları',
    banned: 'Kara Liste & Engelli Numaralar',
  };

  return (
    <header
      style={{
        backgroundColor: '#161338',
        borderBottom: '1px solid #231f4b',
        padding: '12px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onOpenMobileMenu}
            className="admin-hamburger-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Menüyü Aç"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
              {tabTitles[activeTab]}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              {pendingCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#EF4444', color: '#FFFFFF', padding: '1px 7px', borderRadius: '6px' }}>
                  {pendingCount} Yeni Sipariş
                </span>
              )}
              {preparingCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#5D3EBC', color: '#FFFFFF', padding: '1px 7px', borderRadius: '6px' }}>
                  {preparingCount} Hazırlanıyor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Push Notification Permission Request if not granted */}
          {onRequestNotificationPermission && notificationPermission !== 'granted' && (
            <button
              onClick={onRequestNotificationPermission}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 209, 13, 0.15)',
                color: '#FFD10D',
                border: '1px solid rgba(255, 209, 13, 0.35)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Yeni siparişlerde arka plan bildirim izni al"
            >
              <Bell size={14} />
              <span className="hide-on-mobile">Bildirim İzni Ver</span>
            </button>
          )}

          {/* Sound Test Button */}
          <button
            onClick={onTestSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#5D3EBC',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Sipariş sesini test et"
          >
            <Volume2 size={15} />
            <span className="hide-on-mobile">Zil Testi</span>
          </button>

          {/* Quick Store Open / Close Toggle */}
          <button
            onClick={onToggleStoreOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isStoreOpen ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            title={isStoreOpen ? 'Mağaza şu an AÇIK. Sipariş alımını durdurmak için tıkla.' : 'Mağaza şu an KAPALI. Siparişe açmak için tıkla.'}
          >
            <Power size={14} />
            <span>{isStoreOpen ? 'Mağaza Açık' : 'Mağaza Kapalı'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .admin-hamburger-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
