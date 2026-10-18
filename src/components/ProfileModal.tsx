'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Order, OrderStatus } from '@/types';
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
} from 'lucide-react';
import { DigitalReceiptModal } from '@/components/DigitalReceipt';

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
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  if (!isProfileModalOpen) return null;

  // Not logged in fallback
  if (!user) {
    return (
      <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <div className="sheet-header">
            <h3 className="sheet-title">Giriş Yapmanız Gerekiyor</h3>
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
              Profilinizi ve Siparişlerinizi Görün
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.5 }}>
              Telefon numaranız ile tek seferlik SMS şifresi alarak giriş yapabilir, geçmiş ve aktif siparişlerinizi anlık takip edebilirsiniz.
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
              Giriş Yap / Kayıt Ol
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
    if (confirm('Oturumunuzu kapatmak istediğinize emin misiniz?')) {
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
              Hesabım &amp; Profilim
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
                title="Oturumu Kapat"
              >
                <LogOut size={13} />
                <span>Çıkış Yap</span>
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
                    Kayıtlı Sipariş
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

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#E5E7EB',
                borderRadius: '10px',
                padding: '3px',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'orders' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'orders' ? '#5D3EBC' : '#6B7280',
                  boxShadow: activeTab === 'orders' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ShoppingBag size={14} />
                <span>Sipariş Geçmişim ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'addresses' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'addresses' ? '#5D3EBC' : '#6B7280',
                  boxShadow: activeTab === 'addresses' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MapPin size={14} />
                <span>Adreslerim ({addresses.length})</span>
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
