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
      className="admin-header-box"
      style={{
        backgroundColor: '#161338',
        borderBottom: '1px solid #231f4b',
        padding: '12px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            onClick={onOpenMobileMenu}
            className="admin-hamburger-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Menüyü Aç"
          >
            <Menu size={18} />
          </button>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h1
              className="admin-page-title"
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tabTitles[activeTab]}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
              {pendingCount > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#EF4444', color: '#FFFFFF', padding: '1px 6px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  {pendingCount} Yeni
                </span>
              )}
              {preparingCount > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#5D3EBC', color: '#FFFFFF', padding: '1px 6px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  {preparingCount} Hazırlanıyor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Push Notification Permission Request if not granted */}
          {onRequestNotificationPermission && notificationPermission !== 'granted' && (
            <button
              onClick={onRequestNotificationPermission}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(255, 209, 13, 0.15)',
                color: '#FFD10D',
                border: '1px solid rgba(255, 209, 13, 0.35)',
                padding: '7px 9px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Yeni siparişlerde arka plan bildirim izni al"
            >
              <Bell size={14} />
              <span className="hide-on-mobile">Bildirim</span>
            </button>
          )}

          {/* Sound Test Button */}
          <button
            onClick={onTestSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#5D3EBC',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 9px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Sipariş sesini test et"
          >
            <Volume2 size={15} />
            <span className="hide-on-mobile">Zil</span>
          </button>

          {/* Quick Store Open / Close Toggle */}
          <button
            onClick={onToggleStoreOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: isStoreOpen ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              flexShrink: 0,
            }}
            title={isStoreOpen ? 'Mağaza şu an AÇIK. Sipariş alımını durdurmak için tıkla.' : 'Mağaza şu an KAPALI. Siparişe açmak için tıkla.'}
          >
            <Power size={14} />
            <span className="hide-on-mobile">{isStoreOpen ? 'Mağaza Açık' : 'Mağaza Kapalı'}</span>
            <span className="show-on-mobile">{isStoreOpen ? 'Açık' : 'Kapalı'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .show-on-mobile {
          display: none !important;
        }
        @media (min-width: 1024px) {
          .admin-hamburger-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header-box {
            padding: 10px 12px !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: inline !important;
            font-size: 11px !important;
            font-weight: 800 !important;
          }
          .admin-page-title {
            font-size: 14px !important;
            max-width: 130px !important;
          }
        }
      `}</style>
    </header>
  );
};
