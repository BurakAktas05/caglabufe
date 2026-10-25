'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  CheckCircle,
  Clock,
  ChefHat,
  Bike,
  PhoneCall,
  Building2,
  MessageCircle,
  ReceiptText,
  Copy,
  Check,
  XCircle,
  BellRing,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Headphones,
} from 'lucide-react';
import { getSystemSettings, formatTemplate } from '@/lib/settingsManager';
import { DigitalReceiptModal } from '@/components/DigitalReceipt';
import { requestNotificationPermission } from '@/lib/pushNotifications';
import { decodeHtmlEntities } from '@/lib/security';

export const OrderTrackingModal = () => {
  const {
    activeTrackingOrder,
    setActiveTrackingOrder,
    orders,
    setIsProfileModalOpen,
    setIsSupportModalOpen,
    systemSettings,
    showToast,
    reorderItems,
    t,
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPerm('granted');
      showToast('Sipariş bildirimleri açıldı! Durum güncellendiğinde ekranınıza bildirim gelecek.', 'success');
    } else {
      showToast('Bildirim izni verilmedi veya tarayıcı tarafından engellendi.', 'warning');
    }
  };

  if (!activeTrackingOrder) return null;

  const order = activeTrackingOrder;
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way'
  );
  const settings = systemSettings || getSystemSettings();
  const storePhone = settings.storePhone || '0542 000 7878';
  const rawWhatsApp = (settings.storeWhatsApp || '905420007878').replace(/\D/g, '');
  const cleanPhone = storePhone.replace(/\s+/g, '');

  const stages = [
    { key: 'pending', label: 'Sipariş Alındı', icon: Clock, desc: 'Büfe siparişi onayladı' },
    { key: 'preparing', label: 'Hazırlanıyor', icon: ChefHat, desc: 'Siparişiniz paketleniyor' },
    { key: 'on_the_way', label: 'Kurye Yolda', icon: Bike, desc: 'Karabük içi teslimatta' },
    { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle, desc: 'Afiyet olsun!' },
  ];

  const isCancelled = order.status === 'cancelled';

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'on_the_way': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(order.status);

  const handleCopyOrderNumber = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dormOrAddress = order.address.type === 'dormitory'
    ? (order.address.dormName || 'KYK Yurdu')
    : (order.address.district || 'Karabük');

  const waRaw = formatTemplate(
    settings.templateWhatsApp || 'Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL siparişim ({dormOrAddress}) hakkında bilgi alabilir miyim?',
    {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      totalAmount: order.finalAmount,
      dormOrAddress,
    }
  );
  const waMessage = encodeURIComponent(waRaw);
  const waUrl = `https://wa.me/${rawWhatsApp}?text=${waMessage}`;

  return (
    <>
      <div className="modal-overlay" onClick={() => setActiveTrackingOrder(null)}>
        <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sheet-header">
            <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: '#5D3EBC', fontWeight: 900 }}>{order.orderNumber}</span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                title="Sipariş numarasını kopyala"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: copied ? '#10B981' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <span style={{ fontSize: '13px', color: '#586174' }}>• Sipariş Durumu</span>
              {notificationPerm === 'granted' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  🔔 Bildirimler Açık
                </span>
              )}
            </div>
            <button className="close-btn" onClick={() => setActiveTrackingOrder(null)} aria-label="Kapat">
              <X size={18} />
            </button>
          </div>

          {/* Multiple Active Orders Switcher Tabs (Never grows modal height!) */}
          {activeOrders.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '10px 16px',
                backgroundColor: '#F3F0FE',
                borderBottom: '1px solid #DDD6FE',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#5D3EBC',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeOrders.length} Aktif Sipariş:
              </span>
              {activeOrders.map((o) => {
                const isCurrent = o.id === order.id;
                const statusShort =
                  o.status === 'pending' ? 'Alındı' : o.status === 'preparing' ? 'Hazırlanıyor' : 'Yolda';
                const statusEmoji = o.status === 'on_the_way' ? '🛵' : o.status === 'preparing' ? '🍳' : '⏱️';
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setActiveTrackingOrder(o)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: isCurrent ? '#5D3EBC' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : '#4C1D95',
                      border: isCurrent ? '1px solid #5D3EBC' : '1px solid #C4B5FD',
                      whiteSpace: 'nowrap',
                      boxShadow: isCurrent ? '0 2px 5px rgba(93, 62, 188, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{statusEmoji}</span>
                    <span>{o.orderNumber}</span>
                    <span style={{ opacity: isCurrent ? 0.95 : 0.7, fontSize: '10px' }}>({statusShort})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Body */}
          <div className="sheet-body">
            {/* PWA Notification Permission Promo Card */}
            {!isCancelled && notificationPerm !== 'granted' && notificationPerm !== 'unsupported' && (
              <div
                style={{
                  backgroundColor: '#F5F3FF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(93, 62, 188, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#EDE9FE',
                      color: '#5D3EBC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BellRing size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2E1065' }}>
                      Sipariş Durum Bildirimleri
                    </div>
                    <div style={{ fontSize: '11px', color: '#6D28D9', marginTop: '2px', lineHeight: 1.3 }}>
                      Kuryemiz yola çıktığında ekranınıza anında bildirim düşsün
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  style={{
                    backgroundColor: '#5D3EBC',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(93, 62, 188, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  Bildirimleri Aç
                </button>
              </div>
            )}
            {isCancelled ? (
              /* Cancelled state */
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <XCircle size={28} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#991B1B' }}>
                  Sipariş İptal Edildi
                </h4>
                <p style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '6px', lineHeight: 1.5 }}>
                  Bu sipariş iptal edilmiştir. Bir hata olduğunu düşünüyorsanız lütfen büfe ile iletişime geçiniz.
                </p>
              </div>
            ) : (
              /* Active / Delivered Tracker */
              <div
                style={{
                  backgroundColor: '#F8F9FC',
                  borderRadius: '16px',
                  padding: '18px 16px',
                  border: '1px solid #EBEBF2',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5D3EBC' }}>
                      SİPARİŞ AŞAMASI
                    </span>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#191919', marginTop: '2px' }}>
                      {stages[currentIndex]?.label}
                    </h4>
                  </div>
                  <div
                    style={{
                      backgroundColor: order.status === 'delivered' ? '#DCFCE7' : '#F3F0FE',
                      color: order.status === 'delivered' ? '#166534' : '#5D3EBC',
                      fontWeight: 800,
                      fontSize: '13px',
                      padding: '6px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    {order.status === 'delivered' ? 'Teslim Edildi' : `~${order.estimatedDeliveryMinutes} dk`}
                  </div>
                </div>

                {/* Step icons & progress bar */}
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginTop: '24px', marginBottom: '10px' }}>
                  {/* Connector line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '18px',
                      left: '20px',
                      right: '20px',
                      height: '4px',
                      backgroundColor: '#E2E8F0',
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#5D3EBC',
                        width: `${(currentIndex / (stages.length - 1)) * 100}%`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {stages.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isPassed = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div
                        key={stage.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 2,
                          width: '64px',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isPassed ? '#5D3EBC' : '#FFFFFF',
                            border: isPassed ? '2px solid #5D3EBC' : '2px solid #CBD5E1',
                            color: isPassed ? '#FFFFFF' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            boxShadow: isCurrent ? '0 0 0 6px rgba(93, 62, 188, 0.18)' : 'none',
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCurrent ? '#5D3EBC' : '#586174',
                            marginTop: '8px',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live Status Micro-Copy */}
                <div
                  style={{
                    marginTop: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: order.status === 'delivered' ? '#10B981' : '#5D3EBC',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', lineHeight: 1.3 }}>
                    {order.status === 'pending' && '🔔 Sipariş market ekranına ulaştı • Hazırlık başlıyor...'}
                    {order.status === 'preparing' && '📦 Siparişiniz hazırlanıyor & paketleniyor ⚡'}
                    {order.status === 'on_the_way' && '🛵 Kuryemiz yola çıktı! • Lütfen telefonunuzu açık tutunuz'}
                    {order.status === 'delivered' && '✅ Siparişiniz teslim edildi! Teşekkür ederiz 🎉'}
                  </span>
                </div>
              </div>
            )}

            {/* Delivery Address Details */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEBF2',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5D3EBC', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <Building2 size={16} />
                <span>Teslim Edilecek Adres</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#191919' }}>
                {order.address.title}
              </div>
              <div style={{ fontSize: '13px', color: '#586174', marginTop: '2px' }}>
                {order.address.type === 'dormitory'
                  ? `${order.address.dormName} (${order.address.district})`
                  : `${order.address.district} • ${order.address.fullAddress || ''}`}
              </div>
              {order.address.deliveryPresetNote && (
                <div style={{ fontSize: '12px', color: '#5D3EBC', fontWeight: 600, marginTop: '6px' }}>
                  📌 Not: {order.address.deliveryPresetNote}
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBEBF2',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#191919', display: 'block', marginBottom: '10px' }}>
                Sipariş Detayı ({order.items.length} Kalem)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map((item, i) => {
                  const anyItem = item as any;
                  const name = item.productName || anyItem.product?.name || anyItem.name || 'Ürün';
                  const price = Number(item.price !== undefined ? item.price : anyItem.product?.price ?? 0);
                  const qty = Number(item.quantity !== undefined ? item.quantity : anyItem.count ?? 1);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#586174' }}>
                        <strong style={{ color: '#191919' }}>{qty}x</strong> {decodeHtmlEntities(name)}
                      </span>
                      <span style={{ fontWeight: 700, color: '#191919' }}>
                        ₺{((isNaN(price) ? 0 : price) * (isNaN(qty) ? 1 : qty)).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: '1px', backgroundColor: '#EBEBF2', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>Toplam Tutar</span>
                <span style={{ color: '#5D3EBC' }}>₺{order.finalAmount.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#8B95A5', marginTop: '4px' }}>
                Ödeme: {order.paymentMethod === 'cash_at_door' ? 'Kapıda Nakit' : 'Kapıda Kredi Kartı / POS'}
              </div>

              {order.orderNote && (
                <div
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#FEFCE8',
                    border: '1px solid #FEF08A',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#854D0E',
                    fontWeight: 600,
                  }}
                >
                  📝 Sipariş Notunuz: &ldquo;{order.orderNote}&rdquo;
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Repeat Order & Receipt Buttons if delivered */}
              {order.status === 'delivered' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTrackingOrder(null);
                      reorderItems(order.items);
                    }}
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      backgroundColor: '#5D3EBC',
                      padding: '12px 16px',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(93, 62, 188, 0.25)',
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Bu Siparişi Tekrarla 🔁</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                  >
                    <ReceiptText size={16} />
                    <span>Dijital Fişi Görüntüle &amp; Yazdır</span>
                  </button>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Call Store Button */}
                <a
                  href={`tel:${cleanPhone}`}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <PhoneCall size={15} />
                  <span>Büfeyi Ara</span>
                </a>

                {/* WhatsApp Chat Button */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Support & Help Channel */}
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '9px 12px',
                  backgroundColor: '#F3F0FE',
                  border: '1px solid #DDD6FE',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#5D3EBC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Headphones size={14} color="#5D3EBC" />
                <span>{t('supportTitle', 'Canlı Destek & İletişim (Büfe / Teknik)')}</span>
              </button>

              {/* View All Orders Shortcut */}
              <button
                type="button"
                onClick={() => {
                  setActiveTrackingOrder(null);
                  setIsProfileModalOpen(true);
                }}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#4B5563',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <ShoppingBag size={14} color="#5D3EBC" />
                <span>Tüm Sipariş Geçmişimi Görüntüle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {showReceipt && (
        <DigitalReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </>
  );
};
