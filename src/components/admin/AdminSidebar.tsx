'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ReceiptText,
  Package,
  Tag,
  MapPin,
  Settings,
  Ban,
  LogOut,
  ExternalLink,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type AdminTab = 'orders' | 'daily' | 'inventory' | 'campaigns' | 'zones' | 'settings' | 'banned';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  ordersCount: number;
  pendingOrdersCount: number;
  productsCount: number;
  campaignsCount: number;
  bannedCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  storeOpen: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  ordersCount,
  pendingOrdersCount,
  productsCount,
  campaignsCount,
  bannedCount,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  soundEnabled,
  onToggleSound,
  storeOpen,
}) => {
  useEffect(() => {
    if (isMobileOpen && typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isMobileOpen]);
  const menuItems: {
    key: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      key: 'orders',
      label: 'Siparişler',
      icon: <TrendingUp size={18} />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : ordersCount,
      badgeColor: pendingOrdersCount > 0 ? '#EF4444' : '#6366F1',
    },
    {
      key: 'daily',
      label: 'Kasa & Z-Raporu',
      icon: <ReceiptText size={18} />,
    },
    {
      key: 'inventory',
      label: 'Ürün & Stok',
      icon: <Package size={18} />,
      badge: productsCount,
      badgeColor: '#64748B',
    },
    {
      key: 'campaigns',
      label: 'Kampanyalar',
      icon: <Tag size={18} />,
      badge: campaignsCount,
      badgeColor: '#10B981',
    },
    {
      key: 'zones',
      label: 'Bölgeler & Yurtlar',
      icon: <MapPin size={18} />,
    },
    {
      key: 'settings',
      label: 'Mağaza & Bildirim',
      icon: <Settings size={18} />,
    },
    {
      key: 'banned',
      label: 'Kara Liste',
      icon: <Ban size={18} />,
      badge: bannedCount > 0 ? bannedCount : undefined,
      badgeColor: '#EF4444',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0f0d23',
          borderRight: '1px solid #231f4b',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="admin-sidebar-nav"
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 18px',
            borderBottom: '1px solid #231f4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: '#FFD10D',
                color: '#191919',
                fontWeight: 900,
                fontSize: '14px',
                padding: '4px 8px',
                borderRadius: '8px',
                letterSpacing: '0.5px',
              }}
            >
              ÇAĞLA
            </span>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '15px', lineHeight: 1.2 }}>
                Admin Masası
              </div>
              <div style={{ fontSize: '11px', color: storeOpen ? '#10B981' : '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: storeOpen ? '#10B981' : '#EF4444', display: 'inline-block' }} />
                <span>{storeOpen ? 'Mağaza Açık' : 'Mağaza Kapalı'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: isActive ? '#5D3EBC' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: isActive ? '#FFD10D' : 'inherit' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '99px',
                      backgroundColor: item.badgeColor || '#64748B',
                      color: '#FFFFFF',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid #231f4b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: soundEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: soundEnabled ? '#34D399' : '#FCA5A5',
              border: '1px solid ' + (soundEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'),
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? 'Sipariş Zili Açık' : 'Zil Sessizde'}</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>{soundEnabled ? 'AÇIK' : 'KAPALI'}</span>
          </button>

          {/* Customer View Link */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#CBD5E1',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span>Müşteri Sayfası</span>
            <ExternalLink size={14} />
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#F87171',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Yönetimden Çıkış</span>
          </button>
        </div>
      </aside>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-sidebar-nav {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
