'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { PaymentMethod } from '@/types';
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
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_at_door');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickUpsells = useMemo(() => {
    const popularIds = [
      'coca-cola-kutu-330',
      'eker-ayran-300',
      'su-hayat-500',
      'doritos-nacho-mega',
      'citir-patates-sepeti',
      'tadim-cekirdek-180',
    ];
    return (products || [])
      .filter((p) => p.isAvailable && popularIds.includes(p.id) && !cart.some((c) => c.product.id === p.id))
      .slice(0, 4);
  }, [products, cart]);

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
    <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title">
            <span>Sepetim</span>
            <span style={{ fontSize: '12px', color: '#5D3EBC', backgroundColor: '#F3F0FE', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
              {cart.length} Ürün
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
                <span>Temizle</span>
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
              <h4 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Sepetiniz Boş</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                Katalogdan ürünleri keşfedip sepetinize ekleyin.
              </p>
              <button className="btn-primary" onClick={() => setIsCartOpen(false)}>
                Alışverişe Başla
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
                      ? 'Ücretsiz Teslimat Kazandınız!'
                      : `${remainingForFreeDelivery.toFixed(0)} TL daha ekleyin, teslimat ücretsiz!`}
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

              {/* Campaign discount banner */}
              {discountAmount > 0 && appliedCampaignTitle && (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#065F46',
                  }}
                >
                  <Tag size={15} style={{ flexShrink: 0 }} />
                  <span>{appliedCampaignTitle}: -{discountAmount.toFixed(2)} TL indirim</span>
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

              {/* Quick Upsell Section */}
              {quickUpsells.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#581C87',
                      marginBottom: '10px',
                    }}
                  >
                    <Sparkles size={14} color="#7E22CE" />
                    <span>Sepetine Çok Yakışır (Hızlı Ekle)</span>
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
                    {quickUpsells.map((prod) => (
                      <div
                        key={prod.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #F3E8FF',
                          borderRadius: '10px',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          minWidth: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              position: 'relative',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              backgroundColor: '#F3F4F6',
                            }}
                          >
                            <Image
                              src={prod.imageUrl}
                              alt={prod.name}
                              fill
                              sizes="32px"
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
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#5D3EBC' }}>
                              ₺{(prod.discountPrice ?? prod.price).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          style={{
                            backgroundColor: '#5D3EBC',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          title="Sepete Ekle"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
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
                      <span>Teslimat Adresi Gerekli</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9F1239', margin: 0, lineHeight: 1.4 }}>
                    Kuryemizin teslimat yapabilmesi için sokak, bina ve daire numarası zorunludur.
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
                    <span>+ Teslimat Adresi Ekle</span>
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
                      <span>Teslimat Adresi</span>
                    </div>
                    <button type="button" onClick={() => setIsAddressModalOpen(true)} style={{ fontSize: '12px', color: '#5D3EBC', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                      Değiştir
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
                <label className="form-label">Ödeme Yöntemi (Kapıda)</label>
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
                    <span>Kapıda Nakit</span>
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
                    <span>Kapıda Kart (POS)</span>
                  </button>
                </div>
              </div>

              {/* Order Note with Friendly Student Presets */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Sipariş Notu</label>
                  <span style={{ fontSize: '11px', color: '#5D3EBC', fontWeight: 600 }}>Öğrenci Kurye Notları:</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['Yurdun önünde bekliyorum', 'Gelince arayın aşağı inerim', 'Yurdun önüne inerim', 'Güvenliğe bırakabilirsiniz', 'Kapıda temassız POS getirin'].map((preset) => (
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

              {/* Price Breakdown */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px', border: '1px solid #E5E7EB', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  <span>Ürünler Toplamı</span>
                  <span style={{ fontWeight: 600, color: '#1F2937' }}>{cartTotal.toFixed(2)} TL</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
                  <span>Teslimat Ücreti</span>
                  <span style={{ fontWeight: 600, color: deliveryFee === 0 ? '#10B981' : '#1F2937' }}>
                    {deliveryFee === 0 ? 'ÜCRETSİZ' : `${deliveryFee.toFixed(2)} TL`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', marginBottom: '6px' }}>
                    <span>İndirim</span>
                    <span style={{ fontWeight: 700 }}>-{discountAmount.toFixed(2)} TL</span>
                  </div>
                )}
                <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#5D3EBC' }}>
                  <span>Ödenecek Tutar</span>
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
                        ? 'Mağaza Şu An Kapalı'
                        : hasUnavailableItem
                        ? '⚠️ Tükenen Ürünü Çıkarınız'
                        : cartTotal < minOrderAmount
                        ? `Min. Sepet: ${minOrderAmount} TL (${(minOrderAmount - cartTotal).toFixed(0)} TL eksik)`
                        : !user
                        ? 'Giriş Yap ve Onayla'
                        : !selectedAddress
                        ? '📍 Adres Ekleyiniz ve Onayla'
                        : 'Siparişi Onayla'}
                    </span>
                    <span style={{ fontWeight: 800 }}>- {finalTotal.toFixed(2)} TL</span>
                    <ArrowRight size={16} />
                  </button>
                  {hasUnavailableItem ? (
                    <p style={{ fontSize: '11px', color: '#DC2626', textAlign: 'center', marginTop: '6px', fontWeight: 700 }}>
                      Stokta kalmayan ürünü (-) butonuna basarak sepetten çıkarınız.
                    </p>
                  ) : cartTotal < minOrderAmount ? (
                    <p style={{ fontSize: '11px', color: '#EF4444', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>
                      Minimum sepet tutarı {minOrderAmount.toFixed(0)} TL olmalıdır.
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
