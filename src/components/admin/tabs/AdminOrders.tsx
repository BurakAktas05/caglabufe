'use client';

import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, BannedUser } from '@/types';
import {
  ChefHat,
  Bike,
  CheckCircle,
  Phone,
  Building2,
  Package,
  MessageCircle,
  Ban,
  ReceiptText,
  Search,
  Navigation,
  Compass,
} from 'lucide-react';
import { getGoogleMapsNavigationUrl, getDormitories, getDeliveryZones } from '@/lib/settingsManager';
import { decodeHtmlEntities, normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';

interface AdminOrdersProps {
  orders: Order[];
  bannedUsers?: BannedUser[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onBanCustomer: (phone: string, name: string) => void;
  onOpenReceipt: (order: Order) => void;
  filter: 'all' | 'pending' | 'preparing' | 'on_the_way' | 'delivered';
  onFilterChange: (f: 'all' | 'pending' | 'preparing' | 'on_the_way' | 'delivered') => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  bannedUsers = [],
  onStatusChange,
  onBanCustomer,
  onOpenReceipt,
  filter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === 'preparing'), [orders]);
  const onTheWayOrders = useMemo(() => orders.filter((o) => o.status === 'on_the_way'), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter !== 'all') {
      result = result.filter((o) => o.status === filter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(term) ||
          o.customerName.toLowerCase().includes(term) ||
          o.customerPhone.includes(term) ||
          (o.address?.dormName && o.address.dormName.toLowerCase().includes(term))
      );
    }
    return result;
  }, [orders, filter, searchTerm]);

  const dorms = useMemo(() => getDormitories(), []);
  const zones = useMemo(() => getDeliveryZones(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter & Search Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Status Filters */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            width: '100%',
            maxWidth: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {(['all', 'pending', 'preparing', 'on_the_way', 'delivered'] as const).map((f) => {
            const count =
              f === 'all'
                ? orders.length
                : f === 'pending'
                ? pendingOrders.length
                : f === 'preparing'
                ? preparingOrders.length
                : f === 'on_the_way'
                ? onTheWayOrders.length
                : deliveredOrders.length;

            const isActive = filter === f;

            return (
              <button
                key={f}
                type="button"
                onClick={() => onFilterChange(f)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  backgroundColor: isActive ? '#5D3EBC' : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#4B5563',
                  border: '1px solid ' + (isActive ? '#5D3EBC' : '#E5E7EB'),
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                }}
              >
                <span>
                  {f === 'all' && 'Tümü'}
                  {f === 'pending' && 'Bekleyen'}
                  {f === 'preparing' && 'Hazırlanan'}
                  {f === 'on_the_way' && 'Kuryede'}
                  {f === 'delivered' && 'Teslim Edilen'}
                </span>
                <span
                  style={{
                    backgroundColor: isActive ? '#FFD10D' : '#E5E7EB',
                    color: isActive ? '#191919' : '#6B7280',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, width: '100%', flex: '1 1 200px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              width: '100%',
            }}
          >
            <Search size={15} color="#6B7280" />
            <input
              type="text"
              placeholder="Sipariş no, isim, oda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #EBEBF2',
          }}
        >
          <Package size={42} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937' }}>
            {searchTerm ? 'Aramaya Uygun Sipariş Bulunamadı' : 'Henüz Bu Filtrede Sipariş Yok'}
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Yeni bir sipariş geldiğinde zil sesiyle ekranda belirecektir.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const cleanPhone = normalizePhoneNumber(order.customerPhone);
            const formattedPhone = formatPhoneNumber(cleanPhone);
            const isCustomerBanned = Boolean(
              bannedUsers?.some((b) => normalizePhoneNumber(b.phone) === cleanPhone)
            );

            const dormMatch = order.address.type === 'dormitory' && order.address.dormName
              ? dorms.find((d) => d.name.toLowerCase() === order.address.dormName?.toLowerCase() || order.address.dormName?.toLowerCase().includes(d.name.toLowerCase()))
              : null;

            const zoneMatch = dormMatch?.zoneId
              ? zones.find((z) => z.id === dormMatch.zoneId)
              : order.address.district
              ? zones.find((z) => z.name.toLowerCase().includes(order.address.district.toLowerCase()))
              : null;

            const mapsNavUrl = getGoogleMapsNavigationUrl(order.address);

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: isPending ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '18px',
                  boxShadow: isPending ? '0 4px 16px rgba(245, 158, 11, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 900, color: '#5D3EBC' }}>
                        {order.orderNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            order.status === 'pending'
                              ? '#FEF3C7'
                              : order.status === 'preparing'
                              ? '#EDE9FE'
                              : order.status === 'on_the_way'
                              ? '#DBEAFE'
                              : order.status === 'delivered'
                              ? '#D1FAE5'
                              : '#FEE2E2',
                          color:
                            order.status === 'pending'
                              ? '#B45309'
                              : order.status === 'preparing'
                              ? '#5B21B6'
                              : order.status === 'on_the_way'
                              ? '#1E40AF'
                              : order.status === 'delivered'
                              ? '#065F46'
                              : '#991B1B',
                        }}
                      >
                        {order.status === 'pending' && 'YENİ'}
                        {order.status === 'preparing' && 'HAZIRLANIYOR'}
                        {order.status === 'on_the_way' && 'KURYEDE'}
                        {order.status === 'delivered' && 'TESLİM EDİLDİ'}
                        {order.status === 'cancelled' && 'İPTAL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#191919' }}>
                    ₺{order.finalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Customer & Address Details */}
                <div
                  style={{
                    backgroundColor: '#F8F9FA',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    border: '1px solid #EBEBF2',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#191919' }}>{order.customerName}</span>
                      {isCustomerBanned && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            color: '#DC2626',
                            backgroundColor: '#FEE2E2',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #FECDD3',
                          }}
                        >
                          🚫 KARA LİSTEDE
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a
                        href={`tel:0${cleanPhone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '12px',
                          textDecoration: 'none',
                        }}
                      >
                        <Phone size={13} />
                        <span>{formattedPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/90${cleanPhone}?text=Merhaba%20${encodeURIComponent(
                          order.customerName
                        )},%20Cagla%20Bufe'den%20${order.orderNumber}%20nolu%20siparisiniz%20icin%20yaziyoruz.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#10B981',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                        title="WhatsApp Mesajı Gönder"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>

                  {/* Address with 1-Click Google Maps Link */}
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <Building2 size={15} style={{ marginTop: '2px', flexShrink: 0, color: '#5D3EBC' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                            {order.address.type === 'dormitory'
                              ? (order.address.dormName || order.address.title)
                              : (order.address.title || order.address.district)}
                          </div>
                          {order.address.type === 'dormitory' ? (
                            <>
                              {(Boolean(order.address.blockNumber && order.address.blockNumber !== '-') ||
                                Boolean(order.address.roomNumber && order.address.roomNumber !== '-')) && (
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#4B5563', marginTop: '2px' }}>
                                  {order.address.blockNumber && order.address.blockNumber !== '-' ? `Blok: ${order.address.blockNumber}` : ''}
                                  {order.address.blockNumber && order.address.blockNumber !== '-' && order.address.roomNumber && order.address.roomNumber !== '-' ? ' • ' : ''}
                                  {order.address.roomNumber && order.address.roomNumber !== '-' ? `Oda: ${order.address.roomNumber}` : ''}
                                </div>
                              )}
                              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                                {order.address.district}
                              </div>
                              {order.address.deliveryPresetNote && (
                                <div style={{ fontSize: '11px', color: '#5D3EBC', fontWeight: 700, marginTop: '3px' }}>
                                  📌 {order.address.deliveryPresetNote}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>
                                {order.address.fullAddress || order.address.district}
                              </div>
                              {(Boolean(order.address.buildingNumber && order.address.buildingNumber !== '-') ||
                                Boolean(order.address.apartmentNumber && order.address.apartmentNumber !== '-') ||
                                Boolean(order.address.floorNumber && order.address.floorNumber !== '-')) && (
                                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                                  {order.address.buildingNumber ? `Bina: ${order.address.buildingNumber}` : ''}
                                  {order.address.buildingNumber && order.address.floorNumber ? ' • ' : ''}
                                  {order.address.floorNumber ? `Kat: ${order.address.floorNumber}` : ''}
                                  {(order.address.buildingNumber || order.address.floorNumber) && order.address.apartmentNumber ? ' • ' : ''}
                                  {order.address.apartmentNumber ? `Daire: ${order.address.apartmentNumber}` : ''}
                                </div>
                              )}
                              {order.address.courierNote && (
                                <div style={{ fontSize: '11px', color: '#5D3EBC', fontWeight: 700, marginTop: '3px' }}>
                                  📌 {order.address.courierNote}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <a
                          href={mapsNavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#047857',
                            backgroundColor: '#D1FAE5',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            border: '1px solid #A7F3D0',
                          }}
                          title="Google Maps'te Yol Tarifi Al"
                        >
                          <Navigation size={12} />
                          <span>Maps</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Order Note */}
                  {order.orderNote && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        fontSize: '11px',
                        color: '#92400E',
                        fontWeight: 600,
                      }}
                    >
                      📝 Not: {order.orderNote}
                    </div>
                  )}

                  {/* Payment Method Badge */}
                  <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 700, color: '#4B5563' }}>
                    Ödeme:{' '}
                    <span style={{ color: order.paymentMethod === 'cash_at_door' ? '#15803D' : '#1D4ED8' }}>
                      {order.paymentMethod === 'cash_at_door' ? '💵 Kapıda Nakit' : '💳 Kapıda POS (Kredi Kartı)'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#6B7280', marginBottom: '6px' }}>
                    SİPARİŞ İÇERİĞİ ({order.items.reduce((s, i) => s + i.quantity, 0)} Parça):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#1F2937',
                        }}
                      >
                        <span>
                          <strong style={{ color: '#5D3EBC' }}>{item.quantity}x</strong> {decodeHtmlEntities(item.productName)}
                        </span>
                        <span style={{ fontWeight: 600 }}>₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    paddingTop: '10px',
                    borderTop: '1px solid #EBEBF2',
                    marginTop: 'auto',
                  }}
                >
                  {order.status === 'pending' && (
                    <button
                      onClick={() => onStatusChange(order.id, 'preparing')}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#5D3EBC',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <ChefHat size={14} />
                      <span>Hazırla</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => onStatusChange(order.id, 'on_the_way')}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#1D4ED8',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Bike size={14} />
                      <span>Kuryeye Ver</span>
                    </button>
                  )}

                  {order.status === 'on_the_way' && (
                    <button
                      onClick={() => onStatusChange(order.id, 'delivered')}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle size={14} />
                      <span>Teslim Edildi</span>
                    </button>
                  )}

                  {/* 1-Click Google Maps Navigation for Courier (Sadece aktif siparişlerde) */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <a
                      href={mapsNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        textDecoration: 'none',
                      }}
                      title="Google Maps ile Navigasyon Başlat"
                    >
                      <Navigation size={13} color="#059669" />
                      <span>Yol Tarifi</span>
                    </a>
                  )}

                  {/* Digital Receipt */}
                  <button
                    onClick={() => onOpenReceipt(order)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#F3F4F6',
                      color: '#4B5563',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: '1px solid #D1D5DB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Dijital Fiş Görüntüle"
                  >
                    <ReceiptText size={14} />
                    <span>Fiş</span>
                  </button>

                  {/* Ban Button if customer misbehaved */}
                  <button
                    onClick={() => !isCustomerBanned && onBanCustomer(cleanPhone, order.customerName)}
                    disabled={isCustomerBanned}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      backgroundColor: isCustomerBanned ? '#F3F4F6' : '#FEF2F2',
                      color: isCustomerBanned ? '#9CA3AF' : '#DC2626',
                      border: isCustomerBanned ? '1px solid #E5E7EB' : '1px solid #FECDD3',
                      cursor: isCustomerBanned ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: isCustomerBanned ? 0.6 : 1,
                    }}
                    title={isCustomerBanned ? 'Bu müşteri zaten kara listede' : 'Bu müşteriyi engelle & kara listeye al'}
                  >
                    <Ban size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
