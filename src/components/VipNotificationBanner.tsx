'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Sparkles, X, Check, ArrowRight, Tag, Gift } from 'lucide-react';
import { VipNotification } from '@/types';
import {
  getVipNotifications,
  getDismissedVipNotificationIds,
  dismissVipNotification,
} from '@/lib/settingsManager';
import { normalizePhoneNumber } from '@/lib/security';

export const VipNotificationBanner: React.FC = () => {
  const { user, applyCouponCode, setIsCartOpen, showToast, t, dir } = useApp();
  const isRtl = dir === 'rtl';
  const [activeNotif, setActiveNotif] = useState<VipNotification | null>(null);
  const [copied, setCopied] = useState(false);

  const checkNotifications = useCallback(() => {
    try {
      const allNotifs = getVipNotifications();
      const dismissedIds = getDismissedVipNotificationIds();
      const cleanUserPhone = user?.phone ? normalizePhoneNumber(user.phone) : '';

      // Find the most recent active notification matching this user
      const matched = allNotifs.find((n) => {
        if (dismissedIds.includes(n.id)) return false;
        // Check expiration if any
        if (n.expiresAt && new Date(n.expiresAt).getTime() < Date.now()) return false;

        // If targeted to a phone, user must match
        if (n.targetPhone) {
          if (!cleanUserPhone) return false;
          return normalizePhoneNumber(n.targetPhone) === cleanUserPhone;
        }

        // Broadcast to logged-in users or anyone
        return Boolean(cleanUserPhone);
      });

      setActiveNotif(matched || null);
    } catch {
      setActiveNotif(null);
    }
  }, [user]);

  useEffect(() => {
    checkNotifications();

    // Listen to local custom event
    const handleLocalEvent = () => checkNotifications();
    window.addEventListener('caglabufe_vip_notif_event', handleLocalEvent);
    window.addEventListener('caglabufe_vip_notif_dismissed', handleLocalEvent);
    window.addEventListener('storage', handleLocalEvent);

    // Listen to BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('caglabufe_vip_channel');
        bc.onmessage = () => {
          checkNotifications();
        };
      }
    } catch {}

    return () => {
      window.removeEventListener('caglabufe_vip_notif_event', handleLocalEvent);
      window.removeEventListener('caglabufe_vip_notif_dismissed', handleLocalEvent);
      window.removeEventListener('storage', handleLocalEvent);
      if (bc) bc.close();
    };
  }, [checkNotifications]);

  if (!activeNotif) return null;

  const handleApply = () => {
    if (activeNotif.couponCode) {
      applyCouponCode(activeNotif.couponCode);
      showToast(t('couponAppliedSuccess', 'Kupon başarıyla uygulandı!'), 'success');
      setIsCartOpen(true);
    }
    dismissVipNotification(activeNotif.id);
    setActiveNotif(null);
  };

  const handleDismiss = () => {
    dismissVipNotification(activeNotif.id);
    setActiveNotif(null);
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeNotif.couponCode) {
      navigator.clipboard.writeText(activeNotif.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 85,
        width: 'calc(100% - 24px)',
        maxWidth: '460px',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
          borderRadius: '18px',
          padding: '16px 18px',
          color: '#FFFFFF',
          boxShadow: '0 20px 35px -5px rgba(30, 27, 75, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.2)',
          border: '1.5px solid rgba(251, 191, 36, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow backdrop accent */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: isRtl ? 'auto' : '12px',
            left: isRtl ? '12px' : 'auto',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E0E7FF',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          title={t('dismiss', 'Kapat')}
        >
          <X size={15} />
        </button>

        {/* Header with VIP Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div
            style={{
              backgroundColor: '#F59E0B',
              borderRadius: '8px',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Award size={18} color="#FFFFFF" />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              backgroundColor: 'rgba(251, 191, 36, 0.2)',
              color: '#FDE047',
              border: '1px solid rgba(253, 224, 71, 0.4)',
              padding: '2px 8px',
              borderRadius: '20px',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            👑 {t('forYouExclusive', 'Size Özel VIP')}
          </span>
        </div>

        {/* Title & Message */}
        <h4
          style={{
            fontSize: '15px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 4px',
            lineHeight: 1.3,
            paddingRight: '20px',
          }}
        >
          {activeNotif.title}
        </h4>
        <p
          style={{
            fontSize: '12px',
            color: '#E0E7FF',
            margin: '0 0 12px',
            lineHeight: 1.4,
          }}
        >
          {activeNotif.message}
        </p>

        {/* Coupon Code & Action CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {activeNotif.couponCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px dashed rgba(253, 224, 71, 0.6)',
                borderRadius: '10px',
                padding: '6px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FDE047',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.8px',
                cursor: 'pointer',
              }}
              title="Kodu kopyala"
            >
              <Tag size={13} />
              <span>{activeNotif.couponCode}</span>
              {copied ? <Check size={13} color="#86EFAC" /> : null}
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s, background-color 0.15s',
              }}
            >
              <Sparkles size={14} />
              <span>{t('applyVipCoupon', 'Kuponu Sepete Uygula')}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
