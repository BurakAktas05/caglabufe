'use client';

import React, { useRef } from 'react';
import { Order } from '@/types';
import { X, Printer, Download, Navigation } from 'lucide-react';
import { getSystemSettings, getGoogleMapsNavigationUrl } from '@/lib/settingsManager';
import { decodeHtmlEntities } from '@/lib/security';

interface DigitalReceiptProps {
  order: Order;
  onClose: () => void;
}

export const DigitalReceiptModal = ({ order, onClose }: DigitalReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const settings = getSystemSettings();
  const receiptNumber = `FIS-${order.orderNumber.replace('CB-', '')}`;
  const totalItemCount = order.items.reduce((sum, item) => sum + (Number(item.quantity !== undefined ? item.quantity : (item as any).count) || 1), 0);

  const dateStr = new Date(order.createdAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    const printContents = receiptRef.current?.innerHTML;
    if (!printContents) return;
    const w = window.open('', '_blank', 'width=420,height=650');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Sipariş Fişi - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace, sans-serif; font-size: 13px; padding: 12px; max-width: 320px; margin: 0 auto; color: #000; }
            .receipt-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .receipt-header h2 { font-size: 18px; margin: 0 0 2px; font-weight: 900; }
            .receipt-header p { margin: 0; font-size: 11px; }
            .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; }
            .receipt-divider-thick { border-top: 2px solid #000; margin: 8px 0; }
            .receipt-line { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
            .receipt-total { font-size: 15px; font-weight: 900; display: flex; justify-content: space-between; }
            .receipt-footer { text-align: center; margin-top: 12px; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
            @media print { body { margin: 0; padding: 5px; } }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${printContents}
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px' }}
      >
        <div className="sheet-header">
          <div className="sheet-title">
            <Printer size={18} />
            <span>Sipariş Fişi</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#5D3EBC',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>Yazdır</span>
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="sheet-body" style={{ padding: '16px' }}>
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              lineHeight: 1.45,
              color: '#000000',
              backgroundColor: '#ffffff',
              border: '1.5px solid #000000',
              borderRadius: '8px',
              padding: '18px 14px',
            }}
          >
            {/* Header */}
            <div className="receipt-header" style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 2px', fontFamily: 'inherit', letterSpacing: '0.5px' }}>
                {settings.storeName?.toUpperCase() || 'ÇAĞLA BÜFE & MARKET'}
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#444' }}>{settings.storeAddress || 'Karabük / KYK Hızlı Sipariş'}</p>
              <p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: 700 }}>Tel: {settings.storePhone || '0542 000 7878'}</p>
            </div>

            {/* Order & Customer Summary */}
            <div style={{ fontSize: '11px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SİPARİŞ NO:</span>
                <span style={{ fontWeight: 900 }}>{order.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                <span>TARİH &amp; SAAT:</span>
                <span>{dateStr} • {timeStr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                <span>MÜŞTERİ:</span>
                <span style={{ fontWeight: 800 }}>{order.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                <span>TELEFON:</span>
                <span style={{ fontWeight: 800 }}>{order.customerPhone}</span>
              </div>
            </div>

            {/* SİPARİŞ İÇERİĞİ (Odaklı & Çok Net) */}
            <div style={{ borderTop: '2px dashed #000', paddingTop: '6px', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>
                SİPARİŞ İÇERİĞİ ({totalItemCount} PARÇA)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {order.items.map((item, i) => {
                  const anyItem = item as any;
                  const name = item.productName || anyItem.product?.name || anyItem.name || 'Ürün';
                  const price = Number(item.price !== undefined ? item.price : anyItem.product?.price ?? 0);
                  const qty = Number(item.quantity !== undefined ? item.quantity : anyItem.count ?? 1);
                  return (
                    <div key={i} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                        <span style={{ fontWeight: 800, color: '#000000', maxWidth: '75%', lineHeight: 1.25 }}>
                          {qty}x {decodeHtmlEntities(name)}
                        </span>
                        <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {((isNaN(price) ? 0 : price) * (isNaN(qty) ? 1 : qty)).toFixed(2)} TL
                        </span>
                      </div>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div style={{ fontSize: '10px', color: '#555555', marginTop: '1px', paddingLeft: '14px' }}>
                          {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginBottom: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ara Toplam:</span>
                <span>{order.totalAmount.toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                <span>Teslimat Ücreti:</span>
                <span>{order.deliveryFee === 0 ? 'ÜCRETSİZ' : `${order.deliveryFee.toFixed(2)} TL`}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px', fontWeight: 700 }}>
                  <span>Kampanya İndirimi:</span>
                  <span>-{order.discountAmount.toFixed(2)} TL</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 0', margin: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900 }}>
                <span>ÖDENECEK TUTAR:</span>
                <span>{order.finalAmount.toFixed(2)} TL</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px', textAlign: 'right' }}>
                Ödeme: {order.paymentMethod === 'cash_at_door' ? '💵 KAPIDA NAKİT' : '💳 KAPIDA KREDİ KARTI / POS'}
              </div>
            </div>

            {/* TESLİMAT ADRESİ (Düzgünce & Halkasız) */}
            <div style={{ paddingTop: '4px', marginBottom: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                TESLİMAT ADRESİ:
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#000000', lineHeight: 1.3 }}>
                {order.address.type === 'dormitory'
                  ? (order.address.dormName || order.address.title)
                  : (order.address.title || order.address.district)}
              </div>
              {order.address.type === 'dormitory' ? (
                <>
                  {(Boolean(order.address.blockNumber && order.address.blockNumber !== '-') ||
                    Boolean(order.address.roomNumber && order.address.roomNumber !== '-')) && (
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>
                      {order.address.blockNumber && order.address.blockNumber !== '-' ? `Blok: ${order.address.blockNumber}` : ''}
                      {order.address.blockNumber && order.address.blockNumber !== '-' && order.address.roomNumber && order.address.roomNumber !== '-' ? ' • ' : ''}
                      {order.address.roomNumber && order.address.roomNumber !== '-' ? `Oda: ${order.address.roomNumber}` : ''}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#444444', marginTop: '1px' }}>
                    {order.address.district}
                  </div>
                  {order.address.deliveryPresetNote && (
                    <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '4px', backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' }}>
                      📌 Not: {order.address.deliveryPresetNote}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: 700 }}>
                    {order.address.fullAddress || order.address.district}
                  </div>
                  {(Boolean(order.address.buildingNumber && order.address.buildingNumber !== '-') ||
                    Boolean(order.address.apartmentNumber && order.address.apartmentNumber !== '-') ||
                    Boolean(order.address.floorNumber && order.address.floorNumber !== '-')) && (
                    <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
                      {order.address.buildingNumber ? `Bina No: ${order.address.buildingNumber}` : ''}
                      {order.address.buildingNumber && order.address.floorNumber ? ' • ' : ''}
                      {order.address.floorNumber ? `Kat: ${order.address.floorNumber}` : ''}
                      {(order.address.buildingNumber || order.address.floorNumber) && order.address.apartmentNumber ? ' • ' : ''}
                      {order.address.apartmentNumber ? `Daire: ${order.address.apartmentNumber}` : ''}
                    </div>
                  )}
                  {order.address.courierNote && (
                    <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '4px', backgroundColor: '#f1f5f9', padding: '4px 6px', borderRadius: '4px' }}>
                      📌 Not: {order.address.courierNote}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Customer Special Note */}
            {order.orderNote && (
              <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginTop: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>
                  SİPARİŞ NOTU:
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '1px' }}>
                  &ldquo;{order.orderNote}&rdquo;
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="receipt-footer" style={{ textAlign: 'center', marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700 }}>
                Bizi tercih ettiğiniz için teşekkür eder, afiyet dileriz!
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#555' }}>
                Çağla Büfe • Karabük 100. Yıl &amp; KYK
              </p>
            </div>
          </div>

          {/* 1-Click Navigation button for courier (Sadece aktif siparişlerde) */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <a
              href={getGoogleMapsNavigationUrl(order.address)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '11px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                marginTop: '12px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Navigation size={15} />
              <span>Kurye Yol Tarifi (Google Maps)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
