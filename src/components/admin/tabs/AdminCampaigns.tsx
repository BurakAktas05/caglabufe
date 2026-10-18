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

  const [selectedBundleProductIds, setSelectedBundleProductIds] = useState<string[]>(['coca-cola-1l', 'tadim-cekirdek-180']);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState('85');
  const [bundleBadge, setBundleBadge] = useState('Süper İkili');
  const [bundleColor, setBundleColor] = useState('#DC2626');
  const [bundleSearchFilter, setBundleSearchFilter] = useState('');

  const [campTitle, setCampTitle] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campType, setCampType] = useState<CampaignType>('percentage_discount');
  const [campValue, setCampValue] = useState('');
  const [campMinOrder, setCampMinOrder] = useState('');
  const [campMaxDiscount, setCampMaxDiscount] = useState('');
  const [campStartsAt, setCampStartsAt] = useState('');
  const [campEndsAt, setCampEndsAt] = useState('');
  const [campColor, setCampColor] = useState('#5D3EBC');

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

    onAddCampaign({
      title: autoTitle,
      description: bundleDesc.trim() || `Özel Kombin Fiyatı! Normalde ₺${bundleOriginalSum.toFixed(2)} yerine sadece ₺${finalPrice.toFixed(2)}`,
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
    if (!campTitle.trim() || !campValue.trim()) return;

    onAddCampaign({
      title: campTitle.trim(),
      description: campDesc.trim(),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <input
                type="text"
                placeholder="Kampanya Başlığı (Örn: Gece %15 İndirim)"
                value={campTitle}
                onChange={(e) => setCampTitle(e.target.value)}
                required
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />

              <select
                value={campType}
                onChange={(e) => setCampType(e.target.value as CampaignType)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="percentage_discount">Yüzde İndirimi (%)</option>
                <option value="fixed_discount">Sabit Tutar İndirimi (TL)</option>
                <option value="free_delivery">Ücretsiz Teslimat</option>
              </select>

              <input
                type="number"
                placeholder="İndirim Değeri (% veya TL)"
                value={campValue}
                onChange={(e) => setCampValue(e.target.value)}
                required
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />

              <input
                type="number"
                placeholder="Min. Sepet Tutarı (TL)"
                value={campMinOrder}
                onChange={(e) => setCampMinOrder(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
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

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '14px' }}>
          Aktif Kampanyalar ({campaigns.length})
        </h3>

        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '13px' }}>
            Henüz aktif bir kampanya bulunmuyor.
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
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid ' + (c.isActive ? '#E2E8F0' : '#FECDD3'),
                    backgroundColor: c.isActive ? '#FFFFFF' : '#FEF2F2',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isBundle && bundleProductsList.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {bundleProductsList.map((bp) => (
                          <div key={bp.id} style={{ width: '36px', height: '36px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                            <Image src={bp.imageUrl} alt={bp.name} fill sizes="36px" style={{ objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#191919' }}>{c.title}</span>
                        {isBundle && (
                          <span style={{ fontSize: '10px', fontWeight: 900, backgroundColor: '#DC2626', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px' }}>
                            {c.bundleBadge || 'FIRSAT PAKETİ'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {isBundle ? (
                          <span>
                            Normal: <del>₺{c.bundleOriginalPrice?.toFixed(2)}</del> ➡️ <strong>₺{c.bundlePrice?.toFixed(2)}</strong>
                          </span>
                        ) : (
                          <span>{c.description || `${c.value} TL indirim`}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
    </div>
  );
};
