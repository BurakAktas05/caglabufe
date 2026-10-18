'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/types';
import {
  ReceiptText,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  XCircle,
  Building2,
  Package,
} from 'lucide-react';

interface AdminDailyReportProps {
  orders: Order[];
}

export const AdminDailyReport: React.FC<AdminDailyReportProps> = ({ orders }) => {
  const [dailyFilter, setDailyFilter] = useState<'today' | 'yesterday' | 'all'>('today');
  const [showZReportPrint, setShowZReportPrint] = useState(false);

  const dailyOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (dailyFilter === 'today') {
        return orderDate >= todayStart;
      }
      if (dailyFilter === 'yesterday') {
        return orderDate >= yesterdayStart && orderDate < todayStart;
      }
      return true;
    });
  }, [orders, dailyFilter]);

  const dailyDeliveredOrders = useMemo(
    () => dailyOrders.filter((o) => o.status === 'delivered'),
    [dailyOrders]
  );

  const dailyCancelledCount = useMemo(
    () => dailyOrders.filter((o) => o.status === 'cancelled').length,
    [dailyOrders]
  );

  const dailyRevenue = useMemo(
    () => dailyDeliveredOrders.reduce((sum, o) => sum + o.finalAmount, 0),
    [dailyDeliveredOrders]
  );

  const dailyCash = useMemo(
    () =>
      dailyDeliveredOrders
        .filter((o) => o.paymentMethod === 'cash_at_door')
        .reduce((sum, o) => sum + o.finalAmount, 0),
    [dailyDeliveredOrders]
  );

  const dailyCard = useMemo(
    () =>
      dailyDeliveredOrders
        .filter((o) => o.paymentMethod === 'card_at_door')
        .reduce((sum, o) => sum + o.finalAmount, 0),
    [dailyDeliveredOrders]
  );

  const topSellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    dailyDeliveredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.price;
        map.set(item.productId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [dailyDeliveredOrders]);

  const dormBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    dailyDeliveredOrders.forEach((o) => {
      const loc = o.address.type === 'dormitory'
        ? (o.address.dormName || 'KYK Yurdu')
        : (o.address?.district || 'Ev / Apart');
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [dailyDeliveredOrders]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Timeframe & Print Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#5D3EBC" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Zaman Dilimi:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setDailyFilter('today')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: dailyFilter === 'today' ? '#5D3EBC' : '#F3F4F6',
                color: dailyFilter === 'today' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Bugün
            </button>
            <button
              onClick={() => setDailyFilter('yesterday')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: dailyFilter === 'yesterday' ? '#5D3EBC' : '#F3F4F6',
                color: dailyFilter === 'yesterday' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Dün
            </button>
            <button
              onClick={() => setDailyFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: dailyFilter === 'all' ? '#5D3EBC' : '#F3F4F6',
                color: dailyFilter === 'all' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Tüm Dönem
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowZReportPrint(true)}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
          }}
        >
          <Printer size={16} />
          <span>Z-Raporu Al (Fiş Yazdır)</span>
        </button>
      </div>

      {/* Cash & Revenue KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '18px', border: '1.5px solid #EBEBF2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>Toplam Ciro</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F3F0FE', color: '#5D3EBC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#191919' }}>₺{dailyRevenue.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '4px' }}>
            {dailyDeliveredOrders.length} teslim edilmiş paket
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '18px', border: '1.5px solid #EBEBF2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>Kurye Nakit Tahsilat</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#047857' }}>₺{dailyCash.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Kasadaki fiziksel nakit para
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '18px', border: '1.5px solid #EBEBF2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>Kapıda POS / Kart</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#1D4ED8' }}>₺{dailyCard.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            POS slipi / banka hesabı
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '18px', border: '1.5px solid #EBEBF2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>Ortalama Sepet</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FFFBEB', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#191919' }}>
            ₺{dailyDeliveredOrders.length > 0 ? (dailyRevenue / dailyDeliveredOrders.length).toFixed(1) : '0.00'}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Paket başına düşen ortalama
          </div>
        </div>
      </div>

      {/* Two Columns: Top Selling Products & Dormitory Delivery Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Package size={18} color="#5D3EBC" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
              En Çok Satan Ürünler ({topSellingProducts.length})
            </h3>
          </div>

          {topSellingProducts.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
              Henüz teslim edilmiş ürün satışı bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSellingProducts.slice(0, 8).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: idx === 0 ? '#F3F0FE' : '#F9FAFB',
                    border: '1px solid ' + (idx === 0 ? '#DDD6FE' : '#F3F4F6'),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: idx === 0 ? '#5D3EBC' : '#9CA3AF' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{p.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#5D3EBC' }}>{p.quantity} Adet</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#191919' }}>₺{p.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Building2 size={18} color="#10B981" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
              KYK Yurdu & Bölge Dağılımı
            </h3>
          </div>

          {dormBreakdown.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
              Henüz teslimat verisi bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dormBreakdown.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{d.name}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      backgroundColor: '#ECFDF5',
                      color: '#047857',
                      padding: '3px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {d.count} Paket
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Z-Report Thermal Print Modal */}
      {showZReportPrint && (
        <div
          className="modal-overlay"
          onClick={() => setShowZReportPrint(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8F9FA',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ReceiptText size={20} color="#5D3EBC" />
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
                  Gün Sonu Z-Raporu
                </span>
              </div>
              <button
                onClick={() => setShowZReportPrint(false)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div style={{ padding: '22px', fontFamily: 'monospace', fontSize: '13px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #CBD5E1', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 900, fontSize: '17px', letterSpacing: '1px' }}>ÇAĞLA BÜFE & MARKET</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Demir Çelik Kampüsü / 100. Yıl - KARABÜK</div>
                <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', color: '#5D3EBC' }}>
                  *** GÜN SONU KASA Z-RAPORU ***
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Tarih: {new Date().toLocaleDateString('tr-TR')} - Saat: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Dönem: {dailyFilter === 'today' ? 'Bugün' : dailyFilter === 'yesterday' ? 'Dün' : 'Tüm Dönem'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Toplam Paket:</span>
                  <span style={{ fontWeight: 700 }}>{dailyOrders.length} Adet</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A' }}>
                  <span>Teslim Edilen:</span>
                  <span style={{ fontWeight: 700 }}>{dailyDeliveredOrders.length} Paket</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                  <span>İptal / Reddedilen:</span>
                  <span style={{ fontWeight: 700 }}>{dailyCancelledCount} Paket</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ort. Sepet Tutarı:</span>
                  <span style={{ fontWeight: 700 }}>{dailyDeliveredOrders.length > 0 ? (dailyRevenue / dailyDeliveredOrders.length).toFixed(1) : '0'} TL</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px dashed #CBD5E1', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 800, color: '#191919', marginBottom: '2px' }}>TAHSİLAT DÖKÜMÜ:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803D' }}>
                  <span>1. Kurye Nakit:</span>
                  <span style={{ fontWeight: 800 }}>₺{dailyCash.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1D4ED8' }}>
                  <span>2. Kapıda POS (Kart):</span>
                  <span style={{ fontWeight: 800 }}>₺{dailyCard.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dotted #CBD5E1' }}>
                  <span>TOPLAM KASA CİROSU:</span>
                  <span style={{ color: '#5D3EBC' }}>₺{dailyRevenue.toFixed(2)}</span>
                </div>
              </div>

              {topSellingProducts.length > 0 && (
                <div style={{ fontSize: '11px', borderBottom: '1px dashed #CBD5E1', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>EN ÇOK SATANLAR:</div>
                  {topSellingProducts.slice(0, 5).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>{p.name.slice(0, 22)} x{p.quantity}</span>
                      <span>₺{p.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '14px' }}>
                <div>Kasiyer / Yetkili İmza: ___________________</div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Printer size={16} />
                <span>Yazdır (Fiş Çıkart)</span>
              </button>
              <button
                onClick={() => setShowZReportPrint(false)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#64748B',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
