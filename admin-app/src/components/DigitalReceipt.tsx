'use client';

import React, { useRef } from 'react';
import { Order } from '@/types';
import { X, Printer, Download, Navigation } from 'lucide-react';
import { getSystemSettings, getGoogleMapsNavigationUrl } from '@/lib/settingsManager';

interface DigitalReceiptProps {
  order: Order;
  onClose: () => void;
}

export const DigitalReceiptModal = ({ order, onClose }: DigitalReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const settings = getSystemSettings();
  const receiptNumber = `FIS-${order.orderNumber.replace('CB-', '')}`;
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
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Fiş - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; color: #000; }
            .receipt-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .receipt-header h2 { font-size: 16px; margin: 0 0 2px; }
            .receipt-header p { margin: 0; font-size: 11px; }
            .receipt-line { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
            .receipt-line.bold { font-weight: bold; }
            .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; }
            .receipt-total { font-size: 14px; font-weight: bold; }
            .receipt-footer { text-align: center; margin-top: 12px; font-size: 10px; border-top: 1px dashed #000; padding-top: 8px; }
            @media print { body { margin: 0; } }
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
            <span>Dijital Fiş</span>
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
              lineHeight: 1.5,
              color: '#191919',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px 16px',
            }}
          >
            {/* Header */}
            <div className="receipt-header" style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '10px', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 2px', fontFamily: 'inherit' }}>
                {settings.storeName?.toUpperCase() || 'ÇAĞLA BÜFE & MARKET'}
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#586174' }}>{settings.storeAddress || 'Karabük / Online Sipariş'}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#586174' }}>Tel: {settings.storePhone || '0542 000 7878'}</p>
            </div>

            {/* Order Info */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Fiş No:</span>
                <span style={{ fontWeight: 700 }}>{receiptNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Sipariş No:</span>
                <span style={{ fontWeight: 700 }}>{order.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Tarih:</span>
                <span>{dateStr} {timeStr}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Müşteri:</span>
                <span>{order.customerName} ({order.customerPhone})</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

            {/* Items */}
            <div style={{ marginBottom: '8px' }}>
              {order.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '2px 0',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ maxWidth: '60%' }}>
                    {item.quantity}x {item.productName}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {(item.price * item.quantity).toFixed(2)} TL
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

            {/* Totals */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Ara Toplam:</span>
                <span>{order.totalAmount.toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Teslimat:</span>
                <span>{order.deliveryFee === 0 ? 'ÜCRETSİZ' : `${order.deliveryFee.toFixed(2)} TL`}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#16a34a' }}>
                  <span>Kampanya İndirimi:</span>
                  <span>-{order.discountAmount.toFixed(2)} TL</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: '2px solid #191919', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900 }}>
              <span>TOPLAM:</span>
              <span>{order.finalAmount.toFixed(2)} TL</span>
            </div>

            {/* Payment method */}
            <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px', color: '#586174' }}>
              Ödeme: {order.paymentMethod === 'cash_at_door' ? 'KAPIDA NAKİT' : 'KAPIDA KREDİ KARTI / POS'}
            </div>

            {/* Address */}
            <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />
            <div style={{ fontSize: '11px', color: '#1F2937', textAlign: 'center', fontWeight: 600 }}>
              Teslimat: {order.address.type === 'dormitory'
                ? `${order.address.dormName || order.address.title} - ${order.address.district}`
                : `${order.address.district} - ${order.address.fullAddress || order.address.title}`}
            </div>
            {order.orderNote && (
              <div style={{ fontSize: '10px', color: '#EA580C', textAlign: 'center', marginTop: '4px', fontWeight: 600 }}>
                Not: &ldquo;{order.orderNote}&rdquo;
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px dashed #94a3b8', paddingTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6B7280' }}>
                Bizi tercih ettiğiniz için teşekkür eder, afiyet dileriz!
              </p>
            </div>
          </div>

          {/* 1-Click Navigation button for courier */}
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
        </div>
      </div>
    </div>
  );
};
