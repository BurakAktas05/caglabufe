'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Campaign, CampaignType, Product } from '@/types';
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
} from 'lucide-react';

interface AdminCampaignsProps {
  campaigns: Campaign[];
  products: Product[];
  onAddCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => void;
  onDeleteCampaign: (id: string) => void;
}

export const AdminCampaigns: React.FC<AdminCampaignsProps> = ({
  campaigns,
  products,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
}) => {
  const [tabMode, setTabMode] = useState<'bundle' | 'general'>('bundle');

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
          <span>Genel İndirim & Sepet Kampanyası</span>
        </button>
      </div>

      {tabMode === 'bundle' ? (
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

      {/* Campaigns List */}
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
