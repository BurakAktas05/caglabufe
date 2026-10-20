'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { PaymentMethod, Product } from '@/types';
import { getSmartRecommendations } from '@/lib/recommendationEngine';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Flame,
  Banknote,
  CreditCard,
  MapPin,
  ArrowRight,
  Tag,
  Sparkles,
  Ticket,
  Check,
  Gift,
} from 'lucide-react';

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    addToCart,
    removeFromCart,
    deleteItemFromCart,
    clearCart,
    cartTotal,
    deliveryFee,
    discountAmount,
    appliedCampaignTitle,
    appliedCampaignDescription,
    isFreeDeliveryCampaign,
    isBundleCampaignApplied,
    finalTotal,
    minOrderAmount,
    freeDeliveryThreshold,
    selectedAddress,
    setIsAddressModalOpen,
    user,
    setIsAuthModalOpen,
    placeOrder,
    storeOpen,
    products,
    coupons,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    t,
    locale,
    dir,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_at_door');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const [mountTime] = useState(() => Date.now());
  const cleanUserPhone = user?.phone ? user.phone.replace(/\D/g, '') : '';
  const availableQuickCoupons = useMemo(() => {
    const activeList = (coupons || []).filter((c) => {
      if (!c.isActive) return false;
      if (c.expiresAt && new Date(c.expiresAt).getTime() < mountTime) return false;
      if (c.targetPhone) {
        const cleanTarget = c.targetPhone.replace(/\D/g, '');
        return cleanUserPhone && cleanTarget === cleanUserPhone;
      }
      return true;
    });

    if (activeList.length === 0) {
      return [
        { code: 'VIP20', label: '👑 VIP20 (%20)' },
        { code: 'FAVORI15', label: '🥇 FAVORI15 (%15)' },
        { code: 'CAGLA10', label: '⚡ CAGLA10 (15 TL)' },
      ];
    }

    return activeList.map((c) => ({
      code: c.code,
      label: `${c.targetPhone ? '🎁 ' : ''}${c.code} (${c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`})`,
    }));
  }, [coupons, cleanUserPhone]);

  // Intelligent Complementary Upsell Engine (Yanına İyi Gider)
  const upsellData = useMemo(() => {
    return getSmartRecommendations(cart, products, 4, locale);
  }, [products, cart, locale]);

  if (!isCartOpen) return null;

  const hasKitchenItem = cart.some((item) => item.product.isKitchenItem);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeDeliveryThreshold) * 100);

  const handleCheckout = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedAddress) {
      setIsAddressModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await placeOrder(paymentMethod, orderNote);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCartOpen(false)} dir={dir}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} dir={dir}>
        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title">
            <span>{t('cart', 'Sepetim')}</span>
            <span style={{ fontSize: '12px', color: '#5D3EBC', backgroundColor: '#F3F0FE', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
              {cart.length} {t('cartItemsCount', 'Ürün')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={13} />
                <span>{t('clearCart', 'Temizle')}</span>
              </button>
            )}
            <button className="close-btn" onClick={() => setIsCartOpen(false)} aria-label="Kapat">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="sheet-body" style={{ padding: '16px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px', opacity: 0.35 }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>{t('emptyCart', 'Sepetiniz Boş')}</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                {t('emptyCartDesc', 'Katalogdan ürünleri keşfedip sepetinize ekleyin.')}
              </p>
              <button className="btn-primary" onClick={() => setIsCartOpen(false)}>
                {t('startShopping', 'Alışverişe Başla')}
              </button>
            </div>
          ) : (
            <div>
              {/* Free Delivery Progress */}
              <div
                style={{
                  backgroundColor: '#F3F0FE',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  border: '1px solid #DDD6FE',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#5D3EBC', marginBottom: '6px' }}>
                  <span>
                    {remainingForFreeDelivery === 0
                      ? t('freeDeliveryEarned', 'Ücretsiz Teslimat Kazandınız!')
                      : t('remainingForFreeDelivery', '{amount} TL daha ekleyin, teslimat ücretsiz!', { amount: remainingForFreeDelivery.toFixed(0) })}
                  </span>
                  <span>%{Math.round(progressPercent)}</span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: '#E2D9FC', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: remainingForFreeDelivery === 0 ? '#10B981' : '#5D3EBC',
                      borderRadius: '999px',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>

              {/* Single Campaign Banner */}
              {discountAmount > 0 && appliedCampaignTitle && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                      <Tag size={15} style={{ flexShrink: 0 }} />
                      <span>{appliedCampaignTitle}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      -{discountAmount.toFixed(2)} TL
                    </span>
                  </div>
                  {appliedCampaignDescription && (
                    <div style={{ fontSize: '11px', color: '#047857', opacity: 0.9, lineHeight: 1.35 }}>
                      {appliedCampaignDescription}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span>•</span>
                    <span>Aynı anda sadece 1 kampanya kullanılabilir (En avantajlı kampanya seçildi).</span>
                  </div>
                </div>
              )}

              {isFreeDeliveryCampaign && appliedCampaignTitle && (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                      <Tag size={15} style={{ flexShrink: 0 }} />
                      <span>{appliedCampaignTitle}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                      ÜCRETSİZ TESLİMAT
                    </span>
                  </div>
                  {appliedCampaignDescription && (
                    <div style={{ fontSize: '11px', color: '#166534', opacity: 0.9, lineHeight: 1.35 }}>
                      {appliedCampaignDescription}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span>•</span>
                    <span>Aynı anda sadece 1 kampanya kullanılabilir.</span>
                  </div>
                </div>
              )}

              {isBundleCampaignApplied && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FECDD3',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>
                    <Flame size={15} color="#DC2626" style={{ flexShrink: 0 }} />
                    <span>Fırsat Paketi (Kombin Menü) uygulandı</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 700, backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                    Tek Kampanya
                  </span>
                </div>
              )}

              {/* Kitchen item notice */}
              {hasKitchenItem && (
                <div
                  style={{
                    backgroundColor: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    color: '#C2410C',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Flame size={15} style={{ flexShrink: 0 }} />
                  <span>Sıcak mutfak siparişi taze hazırlanıp sıcak teslim edilir (~20-30 dk).</span>
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', width: '100%' }}>
                {cart.map((item) => {
                  const price = item.product.discountPrice ?? item.product.price;
                  return (
                    <div
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        gap: '10px',
                        minWidth: 0,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#F9FAFB' }}>
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="44px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '13px',
                                color: item.product.isAvailable ? '#1F2937' : '#9CA3AF',
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                textDecoration: item.product.isAvailable ? 'none' : 'line-through',
                              }}
                            >
                              {item.product.name}
                            </span>
                            {!item.product.isAvailable && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  color: '#DC2626',
                                  backgroundColor: '#FEE2E2',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                }}
                              >
                                Tükendi
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#5D3EBC', marginTop: '2px' }}>
                            {(price * item.quantity).toFixed(2)} TL
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F0FE', borderRadius: '6px', padding: '2px' }}>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5D3EBC' }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: '12px', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: '#5D3EBC' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5D3EBC' }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteItemFromCart(item.product.id)}
                          style={{ color: '#9CA3AF', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '16px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                    <Ticket size={15} color="#5D3EBC" />
                    <span>{t('enterCoupon', 'Kupon / VIP İndirim Kodu')}</span>
                  </div>
                  {appliedCoupon && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                      Kupon Aktif
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                        {appliedCoupon.title} ({appliedCoupon.code})
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803D' }}>{appliedCoupon.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{ fontSize: '12px', color: '#DC2626', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder={t('couponPlaceholder', 'Örn: VIP20, FAVORI15')}
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        minWidth: 0,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (couponCodeInput.trim()) {
                          applyCouponCode(couponCodeInput.trim());
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#5D3EBC',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('applyCoupon', 'Uygula')}
                    </button>
                  </div>
                )}
              </div>

              {/* Intelligent Upsell Section (Yanına İyi Gider) */}
              {upsellData.items.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FAF5FF',
                    border: '1.5px solid #E9D5FF',
                    borderRadius: '14px',
                    padding: '12px',
                    marginBottom: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 10px rgba(126, 34, 206, 0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#581C87', minWidth: 0 }}>
                      <Sparkles size={14} color="#7E22CE" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {upsellData.title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#F3E8FF',
                        color: '#7E22CE',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        flexShrink: 0,
                        border: '1px solid #E9D5FF',
                      }}
                    >
                      {upsellData.badge}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '8px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {upsellData.items.map((prod) => {
                      const isAdded = justAddedId === prod.id;
                      const hasDiscount = prod.discountPrice && prod.discountPrice < prod.price;
                      const displayPrice = (prod.discountPrice ?? prod.price).toFixed(2);

                      return (
                        <div
                          key={prod.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: isAdded ? '1px solid #10B981' : '1px solid #F3E8FF',
                            borderRadius: '10px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            minWidth: 0,
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                position: 'relative',
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                backgroundColor: '#F3F4F6',
                                border: '1px solid #F3E8FF',
                              }}
                            >
                              <Image
                                src={prod.imageUrl}
                                alt={prod.name}
                                fill
                                sizes="36px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#1F2937',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={prod.name}
                              >
                                {prod.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#5D3EBC' }}>
                                  ₺{displayPrice}
                                </span>
                                {hasDiscount && (
                                  <span style={{ fontSize: '9px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                                    ₺{prod.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(prod);
                              setJustAddedId(prod.id);
                              setTimeout(() => setJustAddedId(null), 1200);
                            }}
                            style={{
                              backgroundColor: isAdded ? '#10B981' : '#5D3EBC',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                              transform: isAdded ? 'scale(1.1)' : 'scale(1)',
                            }}
                            title={isAdded ? t('added', 'Eklendi!') : t('add', 'Sepete Ekle')}
                          >
                            {isAdded ? <Check size={14} /> : <Plus size={15} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {!selectedAddress ? (
                <div
                  style={{
                    backgroundColor: '#FFF1F2',
                    border: '1.5px dashed #FDA4AF',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#E11D48' }}>
                      <MapPin size={16} />
                      <span>{t('deliveryAddressRequired', 'Teslimat Adresi Gerekli')}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9F1239', margin: 0, lineHeight: 1.4 }}>
                    {t('deliveryAddressRequiredDesc', 'Kuryemizin teslimat yapabilmesi için sokak, bina ve daire numarası zorunludur.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    style={{
                      marginTop: '4px',
                      backgroundColor: '#E11D48',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '12px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={14} />
                    <span>{t('addDeliveryAddress', '+ Teslimat Adresi Ekle')}</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#5D3EBC' }}>
                      <MapPin size={14} />
                      <span>{t('deliveryAddress', 'Teslimat Adresi')}</span>
                    </div>
                    <button type="button" onClick={() => setIsAddressModalOpen(true)} style={{ fontSize: '12px', color: '#5D3EBC', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {t('change', 'Değiştir')}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', wordBreak: 'break-word' }}>
                    {selectedAddress.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', wordBreak: 'break-word' }}>
                    {selectedAddress.type === 'dormitory'
                      ? `${selectedAddress.dormName} (${selectedAddress.district})`
                      : `${selectedAddress.fullAddress || selectedAddress.district}`}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div style={{ marginBottom: '14px', width: '100%', boxSizing: 'border-box' }}>
                <label className="form-label">{t('paymentMethodDoor', 'Ödeme Yöntemi (Kapıda)')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_at_door')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: paymentMethod === 'cash_at_door' ? '2px solid #5D3EBC' : '1px solid #E5E7EB',
                      backgroundColor: paymentMethod === 'cash_at_door' ? '#F3F0FE' : '#FFFFFF',
                      color: paymentMethod === 'cash_at_door' ? '#5D3EBC' : '#4B5563',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      minWidth: 0,
                    }}
                  >
                    <Banknote size={20} />
                    <span>{t('cashAtDoorShort', 'Kapıda Nakit')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_at_door')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: paymentMethod === 'card_at_door' ? '2px solid #5D3EBC' : '1px solid #E5E7EB',
                      backgroundColor: paymentMethod === 'card_at_door' ? '#F3F0FE' : '#FFFFFF',
                      color: paymentMethod === 'card_at_door' ? '#5D3EBC' : '#4B5563',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      minWidth: 0,
                    }}
                  >
                    <CreditCard size={20} />
                    <span>{t('cardAtDoorShort', 'Kapıda Kart (POS)')}</span>
                  </button>
                </div>
              </div>

              {/* Order Note with Friendly Student Presets */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>{t('orderNote', 'Sipariş Notu')}</label>
                  <span style={{ fontSize: '11px', color: '#5D3EBC', fontWeight: 600 }}>{t('studentCourierNotes', 'Öğrenci Kurye Notları:')}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[
                    t('presetNote1', 'Yurdun önünde bekliyorum'),
                    t('presetNote2', 'Gelince arayın aşağı inerim'),
                    t('presetNote3', 'Yurdun önüne inerim'),
                    t('presetNote4', 'Güvenliğe bırakabilirsiniz'),
                    t('presetNote5', 'Kapıda temassız POS getirin'),
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOrderNote((prev) => prev ? `${prev}, ${preset}` : preset)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#F3F0FE',
                        color: '#5D3EBC',
                        border: '1px solid #DDD6FE',
                        cursor: 'pointer',
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  className="form-input"
                  style={{ fontSize: '13px', borderRadius: '6px', resize: 'none', lineHeight: 1.4 }}
                  placeholder="Örn: Zile basmayın bebek uyuyor, kapıda temassız POS getirin..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>

              {/* Kupon Kodu & VIP İndirimi */}
              <div
                style={{
                  backgroundColor: appliedCoupon ? '#F0FDF4' : '#F9FAFB',
                  border: `1.5px solid ${appliedCoupon ? '#86EFAC' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: appliedCoupon ? '0' : '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: appliedCoupon ? '#166534' : '#5D3EBC' }}>
                    <Ticket size={15} />
                    <span>{appliedCoupon ? t('appliedCoupon', 'Kupon Uygulandı!') : t('enterCoupon', 'İndirim Kuponu')}</span>
                  </div>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#15803D' }}>
                        {appliedCoupon.code}
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534' }}>
                        {appliedCoupon.title}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#15803D' }}>
                      -{discountAmount > 0 ? discountAmount.toFixed(2) : appliedCoupon.discountValue} TL
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder={t('couponPlaceholder', 'Örn: VIP20, FAVORI15')}
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (couponCodeInput.trim()) {
                              applyCouponCode(couponCodeInput.trim());
                            }
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '12px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (couponCodeInput.trim()) {
                            applyCouponCode(couponCodeInput.trim());
                          }
                        }}
                        disabled={!couponCodeInput.trim()}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: couponCodeInput.trim() ? '#5D3EBC' : '#9CA3AF',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: couponCodeInput.trim() ? 'pointer' : 'default',
                        }}
                      >
                        {t('applyCoupon', 'Uygula')}
                      </button>
                    </div>

                    {/* Quick suggestion tags */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {availableQuickCoupons.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setCouponCodeInput(item.code);
                            applyCouponCode(item.code);
                          }}
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F3F0FE',
                            color: '#5D3EBC',
                            border: '1px dashed #DDD6FE',
                            cursor: 'pointer',
                          }}
                        >
                          🏷️ {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px', border: '1px solid #E5E7EB', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  <span>{t('itemsTotal', 'Ürünler Toplamı')}</span>
                  <span style={{ fontWeight: 600, color: '#1F2937' }}>{cartTotal.toFixed(2)} TL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  <span>{t('deliveryFee', 'Teslimat Ücreti')}</span>
                  <span style={{ fontWeight: 600, color: deliveryFee === 0 ? '#10B981' : '#1F2937' }}>
                    {deliveryFee === 0
                      ? (isFreeDeliveryCampaign ? `${t('free', 'Ücretsiz')} (${t('campaign', 'Kampanya')})` : t('free', 'Ücretsiz'))
                      : `${deliveryFee.toFixed(2)} TL`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', marginBottom: '6px' }}>
                    <span>{t('discount', 'İndirim')} {appliedCampaignTitle ? `(${appliedCampaignTitle})` : ''}</span>
                    <span style={{ fontWeight: 700 }}>-{discountAmount.toFixed(2)} TL</span>
                  </div>
                )}
                <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#5D3EBC' }}>
                  <span>{t('totalAmount', 'Ödenecek Tutar')}</span>
                  <span>{finalTotal.toFixed(2)} TL</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="sheet-footer">
            {(() => {
              const hasUnavailableItem = cart.some((i) => !i.product.isAvailable);
              return (
                <>
                  <button
                    className="btn-primary"
                    onClick={handleCheckout}
                    disabled={isSubmitting || cartTotal < minOrderAmount || !storeOpen || hasUnavailableItem}
                    style={{
                      backgroundColor: hasUnavailableItem ? '#EF4444' : undefined,
                    }}
                  >
                    <span>
                      {!storeOpen
                        ? t('storeClosed', 'Mağaza Şu An Kapalı')
                        : hasUnavailableItem
                        ? t('removeOutOfStock', '⚠️ Tükenen Ürünü Çıkarınız')
                        : cartTotal < minOrderAmount
                        ? t('minOrderWarning', 'Minimum sipariş tutarı {amount} TL olmalıdır.', { amount: minOrderAmount.toFixed(0) })
                        : !user
                        ? t('loginAndConfirm', 'Giriş Yap ve Onayla')
                        : !selectedAddress
                        ? t('addAddressAndConfirm', '📍 Adres Ekleyiniz ve Onayla')
                        : t('confirmOrder', 'Siparişi Onayla')}
                    </span>
                    <span style={{ fontWeight: 800 }}>- {finalTotal.toFixed(2)} TL</span>
                    <ArrowRight size={16} />
                  </button>
                  {hasUnavailableItem ? (
                    <p style={{ fontSize: '11px', color: '#DC2626', textAlign: 'center', marginTop: '6px', fontWeight: 700 }}>
                      {t('outOfStockNotice', 'Stokta kalmayan ürünü (-) butonuna basarak sepetten çıkarınız.')}
                    </p>
                  ) : cartTotal < minOrderAmount ? (
                    <p style={{ fontSize: '11px', color: '#EF4444', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>
                      {t('minOrderWarning', 'Minimum sipariş tutarı {amount} TL olmalıdır.', { amount: minOrderAmount.toFixed(0) })}
                    </p>
                  ) : null}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
