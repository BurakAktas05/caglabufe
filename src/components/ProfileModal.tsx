'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Order, OrderStatus, Coupon } from '@/types';
import {
  X,
  User as UserIcon,
  Phone,
  MapPin,
  Clock,
  RotateCcw,
  ReceiptText,
  LogOut,
  Package,
  ShoppingBag,
  CheckCircle,
  ChefHat,
  Bike,
  Plus,
  Trash2,
  ArrowRight,
  Bell,
  Headphones,
  Ticket,
  Award,
  Sparkles,
  Gift,
} from 'lucide-react';
import { DigitalReceiptModal } from '@/components/DigitalReceipt';
import { isPushSupported, getNotificationPermission, requestNotificationPermission } from '@/lib/pushNotifications';
import { getVipTierInfo } from '@/lib/settingsManager';
import { normalizePhoneNumber } from '@/lib/security';

export const ProfileModal = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    user,
    logoutUser,
    orders,
    setActiveTrackingOrder,
    reorderItems,
    addresses,
    deleteAddress,
    setIsAddressModalOpen,
    setIsAuthModalOpen,
    setIsCartOpen,
    setIsSupportModalOpen,
    coupons,
    applyCouponCode,
    appliedCoupon,
    showToast,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'coupons'>('orders');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof window !== 'undefined' ? getNotificationPermission() : 'default'
  );
  const [mountTime] = useState(() => Date.now());

  const orderCount = orders.length;
  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }, [orders]);

  const vipTierBase = useMemo(() => {
    return getVipTierInfo(orderCount, totalSpent);
  }, [orderCount, totalSpent]);

  const vipTier = useMemo(() => {
    const nextTier =
      vipTierBase.level === 'platinum'
        ? null
        : vipTierBase.level === 'gold'
        ? 'Platin'
        : vipTierBase.level === 'silver'
        ? 'Altın'
        : vipTierBase.level === 'bronze'
        ? 'Gümüş'
        : 'Bronz';

    const needed =
      vipTierBase.level === 'platinum'
        ? 0
        : vipTierBase.level === 'gold'
        ? Math.max(1, 10 - orderCount)
        : vipTierBase.level === 'silver'
        ? Math.max(1, 5 - orderCount)
        : vipTierBase.level === 'bronze'
        ? Math.max(1, 3 - orderCount)
        : 1;

    const progress =
      vipTierBase.level === 'platinum'
        ? 100
        : vipTierBase.level === 'gold'
        ? Math.min(100, Math.round((orderCount / 10) * 100))
        : vipTierBase.level === 'silver'
        ? Math.min(100, Math.round((orderCount / 5) * 100))
        : vipTierBase.level === 'bronze'
        ? Math.min(100, Math.round((orderCount / 3) * 100))
        : 0;

    return {
      ...vipTierBase,
      progress,
      nextTier,
      needed,
    };
  }, [vipTierBase, orderCount]);

  const userCleanPhone = user?.phone ? normalizePhoneNumber(user.phone) : '';
  const availableCoupons: Coupon[] = useMemo(() => {
    return (coupons || []).filter((c: Coupon) => {
      if (!c.isActive) return false;
      if (c.expiresAt && new Date(c.expiresAt).getTime() < mountTime) return false;
      if (c.targetPhone) {
        const cleanTarget = normalizePhoneNumber(c.targetPhone);
        return cleanTarget === userCleanPhone;
      }
      return true;
    });
  }, [coupons, userCleanPhone, mountTime]);

  if (!isProfileModalOpen) return null;

  // Not logged in fallback
  if (!user) {
    return (
      <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <div className="sheet-header">
            <h3 className="sheet-title">{t('needLoginTitle', 'Giriş Yapmanız Gerekiyor')}</h3>
            <button
              type="button"
              className="sheet-close-btn"
              onClick={() => setIsProfileModalOpen(false)}
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#F3F0FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#5D3EBC',
              }}
            >
              <UserIcon size={32} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
              {t('seeProfileAndOrders', 'Profilinizi ve Siparişlerinizi Görün')}
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.5 }}>
              {t('needLoginDesc', 'Telefon numaranız ile tek seferlik SMS şifresi alarak giriş yapabilir, geçmiş ve aktif siparişlerinizi anlık takip edebilirsiniz.')}
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsAuthModalOpen(true);
              }}
            >
              {t('loginRegister', 'Giriş Yap / Kayıt Ol')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Sipariş Alındı',
          bg: '#FEF3C7',
          color: '#92400E',
          border: '#FDE68A',
          icon: Clock,
        };
      case 'preparing':
        return {
          label: 'Hazırlanıyor',
          bg: '#EDE9FE',
          color: '#5B21B6',
          border: '#DDD6FE',
          icon: ChefHat,
        };
      case 'on_the_way':
        return {
          label: 'Kuryede Yolda',
          bg: '#DBEAFE',
          color: '#1E40AF',
          border: '#BFDBFE',
          icon: Bike,
        };
      case 'delivered':
        return {
          label: 'Teslim Edildi',
          bg: '#ECFDF5',
          color: '#065F46',
          border: '#A7F3D0',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          label: 'İptal Edildi',
          bg: '#FEE2E2',
          color: '#991B1B',
          border: '#FECACA',
          icon: X,
        };
      default:
        return {
          label: status,
          bg: '#F3F4F6',
          color: '#374151',
          border: '#E5E7EB',
          icon: Package,
        };
    }
  };

  const handleLogout = () => {
    if (confirm(t('confirmLogout', 'Oturumunuzu kapatmak istediğinize emin misiniz?'))) {
      logoutUser();
      setIsProfileModalOpen(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
        <div
          className="bottom-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '540px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="sheet-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 className="sheet-title" style={{ fontSize: '18px', fontWeight: 800 }}>
              {t('profile', 'Hesabım & Profilim')}
            </h3>
            <button
              type="button"
              className="sheet-close-btn"
              onClick={() => setIsProfileModalOpen(false)}
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            {/* User Profile Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #5D3EBC 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    fontSize: '18px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(93, 62, 188, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {initials || 'CB'}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '2px' }}>
                    {user.fullName}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6B7280' }}>
                    <Phone size={13} />
                    <span>{user.phone}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#EF4444',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                title={t('logout', 'Çıkış Yap')}
              >
                <LogOut size={13} />
                <span>{t('logout', 'Çıkış Yap')}</span>
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#F3F0FE',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #DDD6FE',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShoppingBag size={20} color="#5D3EBC" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#5D3EBC', lineHeight: 1 }}>
                    {orders.length}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginTop: '3px' }}>
                    {t('registeredOrdersCount', 'Kayıtlı Sipariş')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <MapPin size={20} color="#059669" />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                    {addresses.length}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginTop: '3px' }}>
                    Teslimat Adresi
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Status & Permission Banner */}
            {isPushSupported() && (
              <div
                style={{
                  backgroundColor: notifPerm === 'granted' ? '#F0FDF4' : '#FFFBEB',
                  border: `1px solid ${notifPerm === 'granted' ? '#BBF7D0' : '#FDE68A'}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <Bell size={18} color={notifPerm === 'granted' ? '#16A34A' : '#D97706'} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: notifPerm === 'granted' ? '#166534' : '#92400E' }}>
                      {notifPerm === 'granted' ? 'Sipariş Bildirimleri Açık' : 'Sipariş Bildirimleri'}
                    </div>
                    <div style={{ fontSize: '11px', color: notifPerm === 'granted' ? '#15803D' : '#B45309', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notifPerm === 'granted' ? 'Kurye hareketleri anında kilit ekranınıza gelir' : 'Kurye yola çıktığında anında bildirim alın'}
                    </div>
                  </div>
                </div>
                {notifPerm !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const granted = await requestNotificationPermission();
                      setNotifPerm(granted ? 'granted' : 'denied');
                      if (granted) showToast('Bildirimler başarıyla açıldı!', 'success');
                    }}
                    style={{
                      backgroundColor: '#5D3EBC',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    İzin Ver
                  </button>
                )}
              </div>
            )}

            {/* Canlı Destek & İletişim Kartı */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#F3F0FE',
                    color: '#5D3EBC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Headphones size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                    Canlı Destek &amp; İletişim
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Sipariş teslimatı veya teknik sorunlar için
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                style={{
                  padding: '7px 12px',
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Destek Al
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#E5E7EB',
                borderRadius: '10px',
                padding: '3px',
                marginBottom: '16px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'orders' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'orders' ? '#5D3EBC' : '#6B7280',
                  boxShadow: activeTab === 'orders' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <ShoppingBag size={13} />
                <span>{t('myOrder', 'Siparişlerim')} ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'addresses' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'addresses' ? '#5D3EBC' : '#6B7280',
                  boxShadow: activeTab === 'addresses' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <MapPin size={13} />
                <span>{t('selectAddress', 'Adreslerim')} ({addresses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'coupons' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'coupons' ? '#5D3EBC' : '#6B7280',
                  boxShadow: activeTab === 'coupons' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  position: 'relative',
                }}
              >
                <Ticket size={13} />
                <span>{t('myCoupons', 'Kuponlar & VIP')} ({availableCoupons.length})</span>
                {availableCoupons.length > 0 && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'inline-block',
                    }}
                  />
                )}
              </button>
            </div>

            {/* TAB CONTENT 1: SİPARİŞ GEÇMİŞİ */}
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Package size={40} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                    <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#374151', marginBottom: '4px' }}>
                      Henüz Bir Siparişiniz Yok
                    </h5>
                    <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                      Atıştırmalıklar, soğuk içecekler ve market ürünleri 20-30 dakikada kapınızda!
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setIsProfileModalOpen(false)}
                      style={{ padding: '8px 18px', fontSize: '13px' }}
                    >
                      Katalogdan Sipariş Ver
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.map((o) => {
                      const badge = getStatusBadge(o.status);
                      const BadgeIcon = badge.icon;
                      const isActive = o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way';
                      const dormOrLoc =
                        o.address.type === 'dormitory'
                          ? (o.address.dormName || o.address.title)
                          : `${o.address.title} (${o.address.district})`;

                      return (
                        <div
                          key={o.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            border: isActive ? '1.5px solid #5D3EBC' : '1px solid #E5E7EB',
                            boxShadow: isActive ? '0 4px 12px rgba(93, 62, 188, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                        >
                          {/* Order Top Bar */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '10px',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 900, color: '#1F2937' }}>
                                {o.orderNumber}
                              </span>
                              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>•</span>
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                {formatDateTime(o.createdAt)}
                              </span>
                            </div>

                            {/* Status Pill */}
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              <BadgeIcon size={12} />
                              <span>{badge.label}</span>
                            </div>
                          </div>

                          {/* Address Info */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              color: '#4B5563',
                              marginBottom: '8px',
                            }}
                          >
                            <MapPin size={13} color="#5D3EBC" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dormOrLoc}
                            </span>
                          </div>

                          {/* Items Summary */}
                          <div
                            style={{
                              backgroundColor: '#F9FAFB',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              marginBottom: '10px',
                              fontSize: '12px',
                              color: '#374151',
                            }}
                          >
                            {o.items.map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '2px 0',
                                }}
                              >
                                <span>
                                  {item.quantity}x {item.productName}
                                </span>
                                <span style={{ fontWeight: 700, color: '#1F2937' }}>
                                  ₺{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Price & Action Row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '8px',
                              paddingTop: '6px',
                              borderTop: '1px dashed #E5E7EB',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                {o.paymentMethod === 'card_at_door' ? 'Kapıda Kart/POS' : 'Kapıda Nakit'}
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: '#5D3EBC' }}>
                                ₺{o.finalAmount.toFixed(2)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {/* Active Order Tracking CTA */}
                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTrackingOrder(o);
                                    setIsProfileModalOpen(false);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '7px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#5D3EBC',
                                    color: '#FFFFFF',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(93, 62, 188, 0.25)',
                                  }}
                                >
                                  <span>Canlı Takip Et</span>
                                  <ArrowRight size={13} />
                                </button>
                              ) : (
                                <>
                                  {/* Reorder Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      reorderItems(o.items);
                                      setIsProfileModalOpen(false);
                                      setIsCartOpen(true);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      backgroundColor: '#F3F0FE',
                                      color: '#5D3EBC',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      border: '1px solid #DDD6FE',
                                      cursor: 'pointer',
                                    }}
                                    title="Bu siparişi tekrar sepete ekle"
                                  >
                                    <RotateCcw size={12} />
                                    <span>Tekrarla</span>
                                  </button>

                                  {/* Receipt Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceiptOrder(o)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      backgroundColor: '#F3F4F6',
                                      color: '#4B5563',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      border: '1px solid #E5E7EB',
                                      cursor: 'pointer',
                                    }}
                                    title="Dijital Termal Fiş"
                                  >
                                    <ReceiptText size={12} />
                                    <span>Fiş</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: ADRESLERİM */}
            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setIsAddressModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#5D3EBC',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} />
                    <span>Yeni Adres Ekle</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '30px 16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <MapPin size={36} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '13px', color: '#6B7280' }}>Kayıtlı teslimat adresiniz bulunmuyor.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          border: '1px solid #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: '#F3F0FE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#5D3EBC',
                              flexShrink: 0,
                            }}
                          >
                            <MapPin size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>
                              {addr.title}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {addr.type === 'dormitory'
                                ? `${addr.dormName || ''} ${addr.blockNumber || ''} ${addr.roomNumber ? `Oda: ${addr.roomNumber}` : ''}`
                                : `${addr.streetName || ''} ${addr.buildingNumber || ''} ${addr.apartmentNumber ? `Daire: ${addr.apartmentNumber}` : ''} (${addr.district})`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteAddress(addr.id)}
                          style={{
                            padding: '6px',
                            color: '#EF4444',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                          }}
                          title="Adresi Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: KUPONLAR & VIP MÜDAVİM DURUMU */}
            {activeTab === 'coupons' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* VIP Status Hero Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#FFFFFF',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 14px rgba(49, 46, 129, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={20} color="#FBBF24" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Müşteri Sadakat Programı
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(8px)',
                        padding: '3px 9px',
                        borderRadius: '20px',
                        color: '#FDE68A',
                        border: '1px solid rgba(253, 230, 138, 0.3)',
                      }}
                    >
                      {vipTier.badge}
                    </span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px', color: '#FFFFFF' }}>
                      {user.fullName}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#E0E7FF', margin: 0 }}>
                      Toplam <strong style={{ color: '#FCD34D' }}>{orderCount} adet</strong> tamamlanmış siparişiniz bulunuyor.
                    </p>
                  </div>

                  {/* Level Benefit */}
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      color: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '12px',
                    }}
                  >
                    <Sparkles size={14} color="#FDE047" style={{ flexShrink: 0 }} />
                    <span>Mevcut Seviye Ayrıcalığı: <strong>{vipTier.perk}</strong></span>
                  </div>

                  {/* Progress to next tier */}
                  {vipTier.nextTier ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#C7D2FE', marginBottom: '4px' }}>
                        <span>Sonraki Seviye: <strong>{vipTier.nextTier}</strong></span>
                        <span>{vipTier.needed} sipariş kaldı</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${vipTier.progress}%`,
                            background: 'linear-gradient(90deg, #F59E0B, #10B981)',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#FDE68A', fontWeight: 700 }}>
                      🎉 Tebrikler! En üst Platin Müdavim seviyesindesiniz!
                    </div>
                  )}
                </div>

                {/* Coupons Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Ticket size={16} color="#5D3EBC" />
                    <span>Kullanılabilir Kuponlarım &amp; Avantajlar</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
                    {availableCoupons.length} Kupon
                  </span>
                </div>

                {/* Coupons List */}
                {availableCoupons.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Gift size={32} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#374151' }}>
                      Henüz Tanımlı Kuponunuz Yok
                    </div>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4 }}>
                      Çağla Büfe&apos;den sipariş verdikçe müdavim kuponları ve size özel indirim kodları buraya eklenecektir.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {availableCoupons.map((coupon: Coupon) => {
                      const isApplied = appliedCoupon?.id === coupon.id;
                      const isTargetedToMe = Boolean(coupon.targetPhone);

                      return (
                        <div
                          key={coupon.id}
                          style={{
                            backgroundColor: isApplied ? '#F0FDF4' : '#FFFFFF',
                            border: `1.5px ${isApplied ? 'solid #86EFAC' : isTargetedToMe ? 'dashed #7C3AED' : 'solid #E2E8F0'}`,
                            borderRadius: '14px',
                            padding: '12px 14px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    color: '#5D3EBC',
                                    backgroundColor: '#F3F0FE',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {coupon.code}
                                </span>
                                {isTargetedToMe && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      backgroundColor: '#EDE9FE',
                                      color: '#7C3AED',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    🎁 Size Özel
                                  </span>
                                )}
                                {isApplied && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      backgroundColor: '#DCFCE7',
                                      color: '#15803D',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ✓ Sepette Aktif
                                  </span>
                                )}
                              </div>
                              <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', margin: '4px 0 2px' }}>
                                {coupon.title}
                              </h5>
                              <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                                {coupon.description}
                              </p>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>
                                {coupon.discountType === 'percentage'
                                  ? `%${coupon.discountValue}`
                                  : `₺${coupon.discountValue}`}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>
                                {coupon.discountType === 'percentage' ? 'İndirim' : 'İndirim'}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '6px',
                              borderTop: '1px solid #F1F5F9',
                              fontSize: '11px',
                              color: '#94A3B8',
                            }}
                          >
                            <span>
                              {coupon.minOrderAmount
                                ? `Min. ${coupon.minOrderAmount} TL sepet`
                                : 'Alt limit yok'}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                applyCouponCode(coupon.code);
                                setIsProfileModalOpen(false);
                                setIsCartOpen(true);
                              }}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: isApplied ? '#10B981' : '#5D3EBC',
                                color: '#FFFFFF',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                              }}
                            >
                              {isApplied ? 'Sepeti Gör' : 'Sepete Uygula'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital thermal receipt modal when opened from history */}
      {selectedReceiptOrder && (
        <DigitalReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </>
  );
};
