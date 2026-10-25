'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Campaign, CampaignType, Product, Order, Coupon } from '@/types';
import {
  Tag,
  Plus,
  Layers,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Pencil,
  Info,
  X,
  Check,
  Ticket,
  Award,
  MessageCircle,
  Search,
  ExternalLink,
  Users,
  Copy,
  Phone,
  Gift,
  Bell,
} from 'lucide-react';
import { getCoupons, addCoupon, deleteCoupon, sendVipNotification, getVipTierInfo } from '@/lib/settingsManager';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';

interface AdminCampaignsProps {
  campaigns: Campaign[];
  products: Product[];
  orders?: Order[];
  onAddCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => void;
  onDeleteCampaign: (id: string) => void;
}

export const AdminCampaigns: React.FC<AdminCampaignsProps> = ({
  campaigns,
  products,
  orders = [],
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}) => {
  const [tabMode, setTabMode] = useState<'bundle' | 'general' | 'coupons'>('bundle');

  // Coupon & VIP States
  const [couponsList, setCouponsList] = useState<Coupon[]>(() => getCoupons());
  const [couponCode, setCouponCode] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('20');
  const [couponMinOrder, setCouponMinOrder] = useState('150');
  const [couponMaxDiscount, setCouponMaxDiscount] = useState('50');
  const [couponTargetPhone, setCouponTargetPhone] = useState('');
  const [couponExpiresAt, setCouponExpiresAt] = useState('');
  const [vipSearch, setVipSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sendVipNotifNow, setSendVipNotifNow] = useState(true);

  // Bundle Create States
  const [selectedBundleProductIds, setSelectedBundleProductIds] = useState<string[]>(['coca-cola-1l', 'tadim-cekirdek-180']);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState('85');
  const [bundleBadge, setBundleBadge] = useState('Süper İkili');
  const [bundleColor, setBundleColor] = useState('#DC2626');
  const [bundleSearchFilter, setBundleSearchFilter] = useState('');

  // General Create States
  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campType, setCampType] = useState<CampaignType>('percentage_discount');
  const [campValue, setCampValue] = useState('');
  const [campMinOrder, setCampMinOrder] = useState('');
  const [campMaxDiscount, setCampMaxDiscount] = useState('');
  const [campStartsAt, setCampStartsAt] = useState('');
  const [campEndsAt, setCampEndsAt] = useState('');
  const [campColor, setCampColor] = useState('#5D3EBC');

  // Edit Modal States
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editMinOrder, setEditMinOrder] = useState('');
  const [editBannerColor, setEditBannerColor] = useState('#5D3EBC');
  const [editIsActive, setEditIsActive] = useState(true);

  const selectedBundleProducts = useMemo(() => {
    return selectedBundleProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedBundleProductIds, products]);

  const bundleOriginalSum = useMemo(() => {
    return selectedBundleProducts.reduce((sum, p) => sum + p.price, 0);
  }, [selectedBundleProducts]);

  const toggleBundleProductSelection = (productId: string) => {
    setSelectedBundleProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleCreateBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBundleProductIds.length < 2) {
      alert('Lütfen kombin menü için en az 2 ürün seçiniz.');
      return;
    }
    const finalPrice = parseFloat(bundlePrice);
    if (!finalPrice || finalPrice <= 0) {
      alert('Geçerli bir paket indirimli satış fiyatı giriniz.');
      return;
    }

    const autoTitle = bundleTitle.trim()
      ? bundleTitle.trim()
      : selectedBundleProducts.map((p) => p.name).join(' + ');

    const finalDesc = bundleDesc.trim() || `Özel Kombin Fiyatı! Normalde ₺${bundleOriginalSum.toFixed(2)} yerine sadece ₺${finalPrice.toFixed(2)}`;

    onAddCampaign({
      title: autoTitle,
      description: finalDesc,
      type: 'bundle_deal',
      value: Math.max(0, bundleOriginalSum - finalPrice),
      isActive: true,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      bannerColor: bundleColor,
      bundleProducts: selectedBundleProductIds.map((id) => ({ productId: id, quantity: 1 })),
      bundlePrice: finalPrice,
      bundleOriginalPrice: bundleOriginalSum,
      bundleBadge: bundleBadge.trim() || 'FIRSAT PAKETİ',
      createdAt: new Date().toISOString(),
    });

    setBundleTitle('');
    setBundleDesc('');
    alert('Fırsat Paketi başarıyla oluşturuldu!');
  };

  const handleCreateGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim() || !campValue.trim()) {
      alert('Lütfen kampanya başlığı ve değerini doldurunuz.');
      return;
    }

    const autoDesc = campDesc.trim() || (
      campType === 'free_delivery'
        ? `${campMinOrder ? `${campMinOrder} TL ve üzeri siparişlerde ` : ''}teslimat ücreti sıfırlanır.`
        : campType === 'percentage_discount'
        ? `${campMinOrder ? `${campMinOrder} TL ve üzeri siparişlerde ` : ''}%${campValue} indirim uygulanır.`
        : `${campMinOrder ? `${campMinOrder} TL ve üzeri siparişlerde ` : ''}${campValue} TL indirim uygulanır.`
    );

    onAddCampaign({
      title: campTitle.trim(),
      description: autoDesc,
      type: campType,
      value: Number(campValue),
      minOrderAmount: campMinOrder ? Number(campMinOrder) : undefined,
      maxDiscount: campMaxDiscount ? Number(campMaxDiscount) : undefined,
      isActive: true,
      startsAt: campStartsAt || new Date().toISOString(),
      endsAt: campEndsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      bannerColor: campColor,
      createdAt: new Date().toISOString(),
    });

    setCampTitle('');
    setCampDesc('');
    setCampValue('');
    setCampMinOrder('');
    setCampMaxDiscount('');
    alert('Kampanya başarıyla oluşturuldu!');
  };

  const openEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setEditTitle(c.title);
    setEditDesc(c.description || '');
    setEditValue(c.type === 'bundle_deal' ? String(c.bundlePrice ?? c.value) : String(c.value));
    setEditMinOrder(c.minOrderAmount ? String(c.minOrderAmount) : '');
    setEditBannerColor(c.bannerColor || '#5D3EBC');
    setEditIsActive(c.isActive);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    const updates: Partial<Campaign> = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      bannerColor: editBannerColor,
      isActive: editIsActive,
      minOrderAmount: editMinOrder ? Number(editMinOrder) : undefined,
    };

    if (editingCampaign.type === 'bundle_deal') {
      const p = parseFloat(editValue) || 0;
      updates.bundlePrice = p;
      updates.value = Math.max(0, (editingCampaign.bundleOriginalPrice || 0) - p);
    } else {
      updates.value = Number(editValue) || 0;
    }

    onUpdateCampaign(editingCampaign.id, updates);
    setEditingCampaign(null);
  };

  // VIP Customers aggregation
  const vipCustomers = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const map = new Map<string, {
      cleanPhone: string;
      formattedPhone: string;
      name: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate?: string;
    }>();

    orders.forEach((o) => {
      const clean = normalizePhoneNumber(o.customerPhone);
      if (!clean) return;
      const existing = map.get(clean);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += o.finalAmount;
        if (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
          if (o.customerName && o.customerName !== 'Müşteri') {
            existing.name = o.customerName;
          }
        }
      } else {
        map.set(clean, {
          cleanPhone: clean,
          formattedPhone: formatPhoneNumber(clean),
          name: o.customerName || 'Müşteri',
          orderCount: 1,
          totalSpent: o.finalAmount,
          lastOrderDate: o.createdAt,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredVipCustomers = useMemo(() => {
    if (!vipSearch.trim()) return vipCustomers;
    const q = vipSearch.toLowerCase().trim();
    const cleanQ = normalizePhoneNumber(q);
    return vipCustomers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = cleanQ ? c.cleanPhone.includes(cleanQ) : c.cleanPhone.includes(q);
      return matchName || matchPhone;
    });
  }, [vipCustomers, vipSearch]);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      alert('Lütfen geçerli bir kupon kodu giriniz.');
      return;
    }
    const val = parseFloat(couponValue);
    if (!val || val <= 0) {
      alert('Geçerli bir indirim tutarı / oranı giriniz.');
      return;
    }

    const created = addCoupon({
      code: couponCode.trim().toUpperCase(),
      title: couponTitle.trim() || `${couponCode.toUpperCase()} İndirim Kuponu`,
      description: couponDesc.trim() || (couponType === 'percentage' ? `%${val} İndirim Fırsatı!` : `₺${val} Sabit İndirim!`),
      discountType: couponType,
      discountValue: val,
      minOrderAmount: couponMinOrder ? parseFloat(couponMinOrder) : undefined,
      maxDiscount: couponMaxDiscount ? parseFloat(couponMaxDiscount) : undefined,
      targetPhone: couponTargetPhone.trim() ? normalizePhoneNumber(couponTargetPhone.trim()) : undefined,
      expiresAt: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : undefined,
      isActive: true,
    });

    if (sendVipNotifNow) {
      const cleanTarget = couponTargetPhone.trim() ? normalizePhoneNumber(couponTargetPhone.trim()) : undefined;
      sendVipNotification({
        title: `🎉 ${couponTitle.trim() || 'Tebrikler! Size Özel VIP İndirim Kuponu!'}`,
        message: couponDesc.trim() || `Değerli siparişleriniz için teşekkürler! ${couponCode.trim().toUpperCase()} kodunuz tanımlandı.`,
        couponCode: couponCode.trim().toUpperCase(),
        targetPhone: cleanTarget,
        expiresAt: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : undefined,
      });

      if (cleanTarget) {
        fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanTarget,
            code: couponCode.trim().toUpperCase(),
            message: `Cagla Bufe: Tebrikler! Size ozel VIP indirim kuponunuz (${couponCode.trim().toUpperCase()}) tanimlandi. caglabufe.vercel.app adresinden hemen siparis verebilirsiniz.`,
          }),
        }).catch(() => {});
      }
    }

    setCouponsList(getCoupons());
    setCouponCode('');
    setCouponTitle('');
    setCouponDesc('');
    setCouponTargetPhone('');
    alert(`Kupon (${created.code}) başarıyla oluşturuldu${sendVipNotifNow ? ' ve VIP bildirimi müşteriye iletildi' : ''}!`);
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
      deleteCoupon(id);
      setCouponsList(getCoupons());
    }
  };

  const handleSelectCustomerForCoupon = (customer: { name: string; cleanPhone: string }) => {
    const rawFirst = customer.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    const code = `VIP-${rawFirst || 'MUDAVIM'}-20`;
    setCouponCode(code);
    setCouponTitle(`${customer.name} Özel %20 VIP Kuponu`);
    setCouponDesc(`Değerli müdavimimiz ${customer.name} için tanımlanmış özel %20 indirim kuponu.`);
    setCouponType('percentage');
    setCouponValue('20');
    setCouponTargetPhone(customer.cleanPhone);
    setTabMode('coupons');
  };

  const handleDirectNotifyCustomer = (cust: { name: string; cleanPhone: string; formattedPhone: string }) => {
    const rawFirst = cust.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    const code = `VIP-${rawFirst || 'MUDAVIM'}-20`;

    // Ensure coupon exists in system
    const currentCoupons = getCoupons();
    let coupon = currentCoupons.find((c) => c.code === code && c.isActive);
    if (!coupon) {
      coupon = addCoupon({
        code,
        title: `${cust.name} Özel %20 VIP Kuponu`,
        description: `Değerli müdavimimiz ${cust.name} için tanımlanmış özel %20 indirim kuponu.`,
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 80,
        maxDiscount: 60,
        targetPhone: cust.cleanPhone,
        isActive: true,
      });
      setCouponsList(getCoupons());
    }

    sendVipNotification({
      title: `🎉 Tebrikler ${cust.name}! %20 VIP Kuponunuz Tanımlandı`,
      message: `Çağla Büfe müdavimimiz olduğunuz için teşekkür ederiz. Sıradaki siparişinizde "${code}" kupon kodunuzu kullanarak anında %20 indirim kazanabilirsiniz!`,
      couponCode: code,
      targetPhone: cust.cleanPhone,
    });

    if (cust.cleanPhone) {
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cust.cleanPhone,
          code,
          message: `Cagla Bufe: Tebrikler ${cust.name}! Size ozel %20 VIP kuponunuz (${code}) tanimlandi. caglabufe.vercel.app adresinden siparisinizde kullanabilirsiniz.`,
        }),
      }).catch(() => {});
    }

    alert(`🔔 ${cust.name} (${cust.formattedPhone}) müşterisine VIP bildirimi ve %20 indirim kuponu (${code}) anında iletildi!\n\nMüşteri uygulamayı açtığında tebrik kutlama kartı gösterilecektir.`);
  };

  const handleNotifyCoupon = (cp: Coupon) => {
    const cleanTarget = cp.targetPhone ? normalizePhoneNumber(cp.targetPhone) : undefined;
    sendVipNotification({
      title: `🎉 ${cp.title}`,
      message: cp.description || `${cp.code} kupon kodunuz tanımlandı. Sepette anında uygulayabilirsiniz!`,
      couponCode: cp.code,
      targetPhone: cleanTarget,
    });

    if (cleanTarget) {
      fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanTarget,
          code: cp.code,
          message: `Cagla Bufe: Tebrikler! ${cp.title} (${cp.code}) kodunuz tanimlandi. caglabufe.vercel.app adresinden siparisinizde kullanabilirsiniz.`,
        }),
      }).catch(() => {});
    }

    alert(`🔔 Kupon bildirimi (${cp.code}) ${cp.targetPhone ? `${cp.targetPhone} müşterisine` : 'tüm müşterilere'} başarıyla gönderildi!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tek Kampanya Kuralı Bilgilendirme Bandı */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderLeft: '4px solid #5D3EBC',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Info size={22} color="#5D3EBC" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.45 }}>
          <strong style={{ color: '#1E293B' }}>Sipariş Kampanya Kuralı:</strong> Bir siparişte aynı anda <strong>yalnızca 1 kampanya</strong> kullanılabilir. Sepette birden fazla kampanyanın şartı sağlansa dahi müşteriye en avantajlı olan tek kampanya otomatik seçilir; indirimler ve ücretsiz teslimat kampanyaları birbiriyle veya fırsat paketleriyle birleştirilemez.
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: '#FFFFFF', padding: '6px', borderRadius: '14px', border: '1.5px solid #E2E8F0', width: 'fit-content', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setTabMode('bundle')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 800,
            backgroundColor: tabMode === 'bundle' ? '#DC2626' : 'transparent',
            color: tabMode === 'bundle' ? '#FFFFFF' : '#4B5563',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <Layers size={16} />
          <span>Fırsat Paketi / Kombin Menü Oluştur</span>
        </button>

        <button
          type="button"
          onClick={() => setTabMode('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 800,
            backgroundColor: tabMode === 'general' ? '#5D3EBC' : 'transparent',
            color: tabMode === 'general' ? '#FFFFFF' : '#4B5563',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <Tag size={16} />
          <span>Genel İndirim &amp; Sepet Kampanyası</span>
        </button>

        <button
          type="button"
          onClick={() => setTabMode('coupons')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 800,
            backgroundColor: tabMode === 'coupons' ? '#10B981' : 'transparent',
            color: tabMode === 'coupons' ? '#FFFFFF' : '#4B5563',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <Award size={16} />
          <span>⭐ VIP Müdavimler &amp; Sadakat Kuponları ({vipCustomers.length})</span>
        </button>
      </div>

      {tabMode === 'coupons' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* VIP Sadakat Özeti Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
              borderRadius: '16px',
              padding: '20px 24px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Award size={22} color="#FBBF24" />
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  VIP Müşteri Lider Tablosu &amp; Kişiye Özel Kuponlar
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: '#C7D2FE', margin: 0, lineHeight: 1.45, maxWidth: '650px' }}>
                En çok sipariş veren müdavim müşterilerinizi görüntüleyin, onlara tek tıkla özel kupon tanımlayın veya WhatsApp üzerinden teşekkür mesajı ve indirim kuponu gönderin.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#FCD34D' }}>
                  {vipCustomers.length}
                </div>
                <div style={{ fontSize: '11px', color: '#E0E7FF' }}>Toplam Müşteri</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#86EFAC' }}>
                  {couponsList.length}
                </div>
                <div style={{ fontSize: '11px', color: '#E0E7FF' }}>Aktif Kupon</div>
              </div>
            </div>
          </div>

          {/* 1. Müşteri Lider Tablosu (Leaderboard) */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', margin: '0 0 2px' }}>
                  🏆 En Çok Sipariş Veren Müdavim Müşteriler
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  Sipariş geçmişine göre otomatik hesaplanan müdavim listesi
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Müşteri veya telefon ara..."
                    value={vipSearch}
                    onChange={(e) => setVipSearch(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 30px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      outline: 'none',
                      width: '200px',
                    }}
                  />
                </div>
              </div>
            </div>

            {filteredVipCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
                Kayıtlı sipariş geçmişi olan müşteri bulunamadı.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9', textAlign: 'left', color: '#64748B', fontSize: '12px' }}>
                      <th style={{ padding: '10px 12px' }}>Sıra</th>
                      <th style={{ padding: '10px 12px' }}>Müşteri</th>
                      <th style={{ padding: '10px 12px' }}>Seviye</th>
                      <th style={{ padding: '10px 12px' }}>Sipariş</th>
                      <th style={{ padding: '10px 12px' }}>Toplam Harcama</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVipCustomers.slice(0, 15).map((cust, idx) => {
                      const tier =
                        cust.orderCount >= 10
                          ? { label: '👑 Platin', bg: '#EDE9FE', color: '#6D28D9' }
                          : cust.orderCount >= 5
                          ? { label: '🥇 Altın', bg: '#FEF3C7', color: '#B45309' }
                          : cust.orderCount >= 3
                          ? { label: '🥈 Gümüş', bg: '#F1F5F9', color: '#475569' }
                          : { label: '🥉 Bronz', bg: '#FFFBEB', color: '#92400E' };

                      const waCouponMsg = encodeURIComponent(
                        `Merhaba ${cust.name}, Çağla Büfe'deki siparişleriniz için çok teşekkür ederiz! Siz değerli müdavimimize özel tanımladığımız indirim kuponunuzla sıradaki siparişinizde indirimden faydalanabilirsiniz. Afiyet olsun!`
                      );

                      return (
                        <tr
                          key={cust.cleanPhone}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                          }}
                        >
                          <td style={{ padding: '12px', fontWeight: 800, color: '#94A3B8' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#1E293B' }}>{cust.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{cust.formattedPhone}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: tier.bg,
                                color: tier.color,
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {tier.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#1E293B' }}>
                            {cust.orderCount} adet
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                            ₺{cust.totalSpent.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleDirectNotifyCustomer(cust)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: '#FEF3C7',
                                  color: '#B45309',
                                  border: '1px solid #FDE68A',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Müşteriye anında VIP kuponu tanımla ve uygulama içi tebrik bildirimi gönder"
                              >
                                <Bell size={12} />
                                <span>Bildirim Gönder</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectCustomerForCoupon(cust)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: '#F3F0FE',
                                  color: '#5D3EBC',
                                  border: '1px solid #DDD6FE',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Bu müşteriye özel kupon oluştur"
                              >
                                <Ticket size={12} />
                                <span>Kupon Formu</span>
                              </button>

                              <a
                                href={`https://wa.me/${cust.cleanPhone}?text=${waCouponMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  backgroundColor: '#DCFCE7',
                                  color: '#15803D',
                                  border: '1px solid #BBF7D0',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="WhatsApp ile teşekkür ve kupon mesajı gönder"
                              >
                                <MessageCircle size={12} />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Yeni Kupon Oluşturma Formu */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '2px solid #86EFAC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={20} color="#059669" />
              <h4 style={{ fontSize: '17px', fontWeight: 900, color: '#064E3B', margin: 0 }}>
                Yeni İndirim Kuponu Tanımla
              </h4>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Tüm müşterilere açık genel bir kupon veya yukarıdaki lider tablosundan seçtiğiniz özel bir VIP müşteriye hediye kuponu tanımlayın.
            </p>

            <form onSubmit={handleCreateCoupon}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Kupon Kodu * (Örn: VIP20, CAGLA15)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: VIP-FATIH-20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    İndirim Türü *
                  </label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as 'percentage' | 'fixed')}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="percentage">Yüzde İndirimi (%)</option>
                    <option value="fixed">Sabit Tutar İndirimi (TL)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    İndirim Değeri (% veya TL) *
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Min. Sepet Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Maks. İndirim Tutarı (TL) (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={couponMaxDiscount}
                    onChange={(e) => setCouponMaxDiscount(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Hedef Müşteri Telefonu (Boş = Herkes)
                  </label>
                  <input
                    type="text"
                    placeholder="05421234567"
                    value={couponTargetPhone}
                    onChange={(e) => setCouponTargetPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Son Geçerlilik Tarihi (Opsiyonel)
                  </label>
                  <input
                    type="date"
                    value={couponExpiresAt}
                    onChange={(e) => setCouponExpiresAt(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Kupon Başlığı (Müşterinin Göreceği İsim)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: VIP Müdavim %20 İndirimi"
                    value={couponTitle}
                    onChange={(e) => setCouponTitle(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <input
                    type="checkbox"
                    id="sendVipNotifCheckbox"
                    checked={sendVipNotifNow}
                    onChange={(e) => setSendVipNotifNow(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sendVipNotifCheckbox" style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bell size={15} color="#B45309" />
                    <span>🔔 Kupon oluşturulduğunda hedef müşteriye anında VIP uygulama içi tebrik bildirimi gönder</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                <span>Kuponu Kaydet &amp; Yayınla</span>
              </button>
            </form>
          </div>

          {/* 3. Aktif Kuponlar Listesi */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1.5px solid #E2E8F0' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '14px' }}>
              Mevcut Tanımlı Kuponlar ({couponsList.length})
            </h4>

            {couponsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
                Henüz tanımlı kupon bulunmamaktadır.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {couponsList.map((cp) => (
                  <div
                    key={cp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#5D3EBC', backgroundColor: '#F3F0FE', padding: '2px 8px', borderRadius: '6px' }}>
                          {cp.code}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '6px' }}>
                          {cp.discountType === 'percentage' ? `%${cp.discountValue} İndirim` : `₺${cp.discountValue} İndirim`}
                        </span>
                        {cp.targetPhone && (
                          <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#EDE9FE', color: '#7C3AED', padding: '2px 6px', borderRadius: '4px' }}>
                            Kişiye Özel: {cp.targetPhone}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginTop: '4px' }}>
                        {cp.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {cp.minOrderAmount ? `Min. sepet: ${cp.minOrderAmount} TL` : 'Alt limit yok'}
                        {cp.maxDiscount ? ` • Maks. indirim: ${cp.maxDiscount} TL` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(cp.code);
                          setCopiedCode(cp.id);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: copiedCode === cp.id ? '#15803D' : '#475569',
                          border: '1px solid #CBD5E1',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Kupon kodunu kopyala"
                      >
                        {copiedCode === cp.id ? <Check size={13} color="#15803D" /> : <Copy size={13} />}
                        <span>{copiedCode === cp.id ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNotifyCoupon(cp)}
                        style={{
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Bu kuponu hedef müşteriye veya tüm müdavimlere bildirim olarak ilet"
                      >
                        <Bell size={13} />
                        <span>Bildir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(cp.id)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tabMode === 'bundle' ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '2px solid #FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={20} color="#DC2626" />
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#191919' }}>
              Yeni Fırsat Paketi (Kombin Menü)
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
            Örn: Kola + Cips veya Red Bull + Çikolata gibi birden fazla ürünü cazip fiyata tek tıkla sepete ekletin.
          </p>

          <form onSubmit={handleCreateBundle}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                  1. Pakete Dahil Edilecek Ürünleri Seçin ({selectedBundleProductIds.length} ürün seçildi):
                </span>
                <input
                  type="text"
                  placeholder="Ürün filtrele..."
                  value={bundleSearchFilter}
                  onChange={(e) => setBundleSearchFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                {products
                  .filter((p) => !bundleSearchFilter || p.name.toLowerCase().includes(bundleSearchFilter.toLowerCase()))
                  .map((p) => {
                    const isSelected = selectedBundleProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleBundleProductSelection(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#FEF2F2' : '#FFFFFF',
                          border: isSelected ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? <CheckSquare size={16} color="#DC2626" /> : <Square size={16} color="#94A3B8" />}
                        <div style={{ width: '28px', height: '28px', position: 'relative', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={p.imageUrl} alt={p.name} fill sizes="28px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>₺{p.price.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Paket Başlığı (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Gece Sinema Menüsü"
                  value={bundleTitle}
                  onChange={(e) => setBundleTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Paket Satış Fiyatı (₺) * (Normal: ₺{bundleOriginalSum.toFixed(2)})
                </label>
                <input
                  type="number"
                  placeholder="85"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 800, color: '#DC2626' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Rozet Metni
                </label>
                <input
                  type="text"
                  placeholder="Süper İkili / Gece Menüsü"
                  value={bundleBadge}
                  onChange={(e) => setBundleBadge(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Paket Açıklaması (Description) (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  placeholder={`Özel Kombin Fiyatı! Normalde ₺${bundleOriginalSum.toFixed(2)} yerine sadece ₺${bundlePrice || '0'}`}
                  value={bundleDesc}
                  onChange={(e) => setBundleDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                padding: '11px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              <span>Fırsat Paketini Yayınla</span>
            </button>
          </form>
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1.5px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', marginBottom: '14px' }}>
            Genel Kampanya & Kupon Oluştur
          </h3>
          <form onSubmit={handleCreateGeneral}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Kampanya Başlığı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Gece %15 İndirim"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Kampanya Türü *
                </label>
                <select
                  value={campType}
                  onChange={(e) => setCampType(e.target.value as CampaignType)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                >
                  <option value="percentage_discount">Yüzde İndirimi (%)</option>
                  <option value="fixed_discount">Sabit Tutar İndirimi (TL)</option>
                  <option value="free_delivery">Ücretsiz Teslimat</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  İndirim Değeri (% veya TL) *
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={campValue}
                  onChange={(e) => setCampValue(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Min. Sepet Tutarı (TL)
                </label>
                <input
                  type="number"
                  placeholder="200"
                  value={campMinOrder}
                  onChange={(e) => setCampMinOrder(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              {/* Description field - Crucial for user request */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Kampanya Açıklaması (Description) * (Müşteriye ve sepette gösterilecek metin)
                </label>
                <textarea
                  rows={2}
                  placeholder="Örn: 200 TL ve üzeri tüm siparişlerde sepette anında 25 TL indirim uygulanır!"
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#5D3EBC',
                color: '#FFFFFF',
                padding: '11px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              <span>Kampanyayı Başlat</span>
            </button>
          </form>
        </div>
      )}

      {/* Campaigns List (only in bundle & general tabs) */}
      {tabMode !== 'coupons' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '14px' }}>
            Kayıtlı Kampanyalar ({campaigns.length})
          </h3>

        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
            Henüz kayıtlı bir kampanya bulunmuyor.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {campaigns.map((c) => {
              const isBundle = c.type === 'bundle_deal';
              const bundleProductsList = isBundle && c.bundleProducts
                ? c.bundleProducts.map((item) => products.find((p) => p.id === item.productId)).filter((p): p is Product => Boolean(p))
                : [];

              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid ' + (c.isActive ? '#E2E8F0' : '#FECDD3'),
                    backgroundColor: c.isActive ? '#FFFFFF' : '#FEF2F2',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', flex: 1 }}>
                    {isBundle && bundleProductsList.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {bundleProductsList.map((bp) => (
                          <div key={bp.id} style={{ width: '38px', height: '38px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                            <Image src={bp.imageUrl} alt={bp.name} fill sizes="38px" style={{ objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#191919' }}>{c.title}</span>
                        {isBundle ? (
                          <span style={{ fontSize: '10px', fontWeight: 900, backgroundColor: '#DC2626', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>
                            {c.bundleBadge || 'FIRSAT PAKETİ'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 6px', borderRadius: '4px' }}>
                            {c.type === 'percentage_discount' ? `%${c.value} İndirim` : c.type === 'fixed_discount' ? `₺${c.value} Sabit İndirim` : 'Ücretsiz Teslimat'}
                          </span>
                        )}
                        {!c.isActive && (
                          <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px' }}>
                            Pasif
                          </span>
                        )}
                      </div>

                      {/* Display Description Clearly */}
                      <div style={{ fontSize: '13px', color: '#334155', marginTop: '3px', fontWeight: 500, lineHeight: 1.35 }}>
                        {c.description || (isBundle ? `Kombin Fiyatı: ₺${c.bundlePrice?.toFixed(2)}` : `${c.value} TL İndirim`)}
                      </div>

                      {/* Conditions */}
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {isBundle ? (
                          <span>Normal Fiyat: <del>₺{c.bundleOriginalPrice?.toFixed(2)}</del> • Satış: <strong style={{ color: '#DC2626' }}>₺{c.bundlePrice?.toFixed(2)}</strong></span>
                        ) : (
                          <>
                            {c.minOrderAmount ? <span>Min. Sepet: <strong>₺{c.minOrderAmount}</strong></span> : null}
                            {c.maxDiscount ? <span>Maks. İndirim: <strong>₺{c.maxDiscount}</strong></span> : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE',
                        cursor: 'pointer',
                      }}
                      title="Kampanyayı ve Açıklamayı Düzenle"
                    >
                      <Pencil size={13} />
                      <span>Düzenle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateCampaign(c.id, { isActive: !c.isActive })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: c.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: c.isActive ? '#15803D' : '#B91C1C',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      {c.isActive ? 'Aktif' : 'Pasif'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${c.title}" kampanyasını silmek istiyor musunuz?`)) {
                          onDeleteCampaign(c.id);
                        }
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        color: '#B91C1C',
                        backgroundColor: '#FEF2F2',
                        cursor: 'pointer',
                        border: '1px solid #FECDD3',
                      }}
                      title="Kampanyayı Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setEditingCampaign(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pencil size={18} color="#5D3EBC" />
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                  Kampanyayı Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Kampanya Başlığı *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Kampanya Açıklaması (Description) * (Müşterilere ve sepette gösterilen metin)
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required
                    placeholder="Kampanya detaylarını açıklayınız..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      {editingCampaign.type === 'bundle_deal' ? 'Paket Satış Fiyatı (₺) *' : 'İndirim Değeri *'}
                    </label>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>

                  {editingCampaign.type !== 'bundle_deal' && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                        Min. Sepet Tutarı (TL)
                      </label>
                      <input
                        type="number"
                        value={editMinOrder}
                        onChange={(e) => setEditMinOrder(e.target.value)}
                        placeholder="Örn: 200"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="editIsActiveCheckbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="editIsActiveCheckbox" style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                    Kampanya Aktif Olsun
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: 'none',
                    backgroundColor: '#5D3EBC',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={16} />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
