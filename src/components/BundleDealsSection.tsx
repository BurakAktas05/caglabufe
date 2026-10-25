'use client';

import React, { useState } from 'react';
import { Campaign, Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { Flame, Sparkles, Check, ShoppingBag, Plus } from 'lucide-react';
import { translateBundleBadge, translateCampaignDescription } from '@/lib/campaignTranslator';

interface BundleDealsSectionProps {
  bundles: Campaign[];
  products: Product[];
}

export const BundleDealsSection: React.FC<BundleDealsSectionProps> = ({
  bundles,
  products,
}) => {
  const { addToCart, locale } = useApp();
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  if (!bundles || bundles.length === 0) return null;

  const handleAddBundleToCart = (campaign: Campaign) => {
    // Resolve products
    const resolvedItems = (campaign.bundleProducts || [])
      .map((bp) => {
        const prod = products.find((p) => p.id === bp.productId);
        return {
          product: prod,
          quantity: bp.quantity,
        };
      })
      .filter((item): item is { product: Product; quantity: number } => item.product !== undefined);

    const firstProduct = resolvedItems[0]?.product;
    const itemsSummary = resolvedItems
      .map((item) => `${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.product.name}`)
      .join(' + ');

    const originalPrice =
      campaign.bundleOriginalPrice ||
      resolvedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0) ||
      campaign.value;

    const bundlePrice = campaign.bundlePrice || campaign.value;

    // Construct unified bundle product for cart
    const bundleProduct: Product = {
      id: `bundle_${campaign.id}`,
      name: campaign.title,
      category: 'pratik-yemek',
      price: originalPrice,
      discountPrice: bundlePrice,
      imageUrl: firstProduct?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
      description: campaign.description,
      unit: 'Kombin Paket',
      isAvailable: true,
      isKitchenItem: resolvedItems.some((item) => item.product.isKitchenItem),
      campaignId: campaign.id,
      searchKeywords: ['paket', 'kampanya', 'kombin', 'fırsat', 'menü', 'ikili'],
    };

    addToCart(bundleProduct, undefined, itemsSummary);

    setAddedBundleId(campaign.id);
    setTimeout(() => {
      setAddedBundleId((curr) => (curr === campaign.id ? null : curr));
    }, 1800);
  };

  const getSectionTexts = () => {
    switch (locale) {
      case 'en':
        return {
          title: 'Super Deal Bundles (Combo Deals)',
          subtitle: 'Cold Drinks + Chips, Snacks & Drink Combos with extra discounts at a single price!',
          badge: `${bundles.length} Active Deals`,
          savings: (s: number) => `Save ${s} ₺!`,
          unit: 'pcs',
          individually: 'Individually',
          add: 'Add Bundle',
          added: 'Added!',
        };
      case 'ru':
        return {
          title: 'Супер комбо-наборы (Специальные предложения)',
          subtitle: 'Напитки + чипсы, снеки и комбо-наборы с дополнительной скидкой!',
          badge: `${bundles.length} Активных наборов`,
          savings: (s: number) => `Экономия ${s} ₺!`,
          unit: 'шт.',
          individually: 'По отдельности',
          add: 'Добавить набор',
          added: 'Добавлено!',
        };
      case 'ar':
        return {
          title: 'باقات العروض المميزة (وجبات كومبو)',
          subtitle: 'مشروبات + شيبس، وجبات خفيفة ومجموعات بسعر مخفض مميز!',
          badge: `${bundles.length} باقات نشطة`,
          savings: (s: number) => `وفر ${s} ₺!`,
          unit: 'قطع',
          individually: 'سعر المفرد',
          add: 'أضف الباقة',
          added: 'تمت الإضافة!',
        };
      case 'fr':
        return {
          title: 'Packs Super Offre (Menus Combo)',
          subtitle: 'Boissons + chips, snacks et combos avec remise spéciale à prix unique !',
          badge: `${bundles.length} Packs Actifs`,
          savings: (s: number) => `Économisez ${s} ₺ !`,
          unit: 'pièces',
          individually: 'À l\'unité',
          add: 'Ajouter le pack',
          added: 'Ajouté !',
        };
      case 'tr':
      default:
        return {
          title: 'Süper Fırsat Paketleri (Kombin Menüler)',
          subtitle: 'Kola + Cips, Atıştırmalık & İçecek Menüleri tek fiyata ekstra indirimli!',
          badge: `${bundles.length} Aktif Paket`,
          savings: (s: number) => `${s} ₺ Tasarruf!`,
          unit: 'Adet',
          individually: 'Tek Tek',
          add: 'Paketi Ekle',
          added: 'Eklendi!',
        };
    }
  };

  const texts = getSectionTexts();

  return (
    <section className="bundle-deals-section" style={{ marginBottom: '32px' }}>
      <div className="section-header" style={{ marginBottom: '14px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={22} color="#DC2626" />
            <span>{texts.title}</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', fontWeight: 500 }}>
            {texts.subtitle}
          </p>
        </div>
        <span className="bundle-header-badge">
          <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
          {texts.badge}
        </span>
      </div>

      <div className="bundle-cards-grid">
        {bundles.map((campaign) => {
          const resolvedItems = (campaign.bundleProducts || [])
            .map((bp) => ({
              product: products.find((p) => p.id === bp.productId),
              quantity: bp.quantity,
            }))
            .filter((i): i is { product: Product; quantity: number } => !!i.product);

          const normalTotal =
            campaign.bundleOriginalPrice ||
            resolvedItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

          const finalPrice = campaign.bundlePrice || campaign.value;
          const savings = normalTotal - finalPrice;
          const isJustAdded = addedBundleId === campaign.id;

          return (
            <div key={campaign.id} className="bundle-card">
              {/* Top Banner Tag */}
              <div className="bundle-card-topbar">
                <span className="bundle-card-badge">
                  {translateBundleBadge(campaign.bundleBadge, locale)}
                </span>
                {savings > 0 && (
                  <span className="bundle-savings-tag">
                    {texts.savings(savings)}
                  </span>
                )}
              </div>

              {/* Combined Multi-Image Collage Visual */}
              <div className="bundle-collage-container">
                {resolvedItems.length > 0 ? (
                  resolvedItems.map((item, idx) => (
                    <React.Fragment key={item.product.id}>
                      <div className="bundle-image-box">
                        <img
                          src={item.product.imageUrl || '/categories/kantin-atistirmalik.jpg'}
                          alt={item.product.name}
                          className="bundle-item-img"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/categories/kantin-atistirmalik.jpg';
                          }}
                        />
                        <span className="bundle-item-qty-tag">
                          {item.quantity} {texts.unit}
                        </span>
                        <span className="bundle-item-caption">
                          {item.product.name}
                        </span>
                      </div>

                      {/* Plus connector between images */}
                      {idx < resolvedItems.length - 1 && (
                        <div className="bundle-plus-connector" title="Birlikte">
                          <Plus size={16} strokeWidth={3} />
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                    Paket içerik görselleri yükleniyor...
                  </div>
                )}
              </div>

              {/* Bundle Details */}
              <div className="bundle-content">
                <h3 className="bundle-title">{campaign.title}</h3>
                <p className="bundle-desc">
                  {translateCampaignDescription(campaign.description, locale, campaign)}
                </p>

                {/* Items Pill List */}
                <div className="bundle-items-pills">
                  {resolvedItems.map((item) => (
                    <span key={item.product.id} className="bundle-item-pill">
                      ✓ {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.product.name}
                    </span>
                  ))}
                </div>

                {/* Price & Add to Cart Action */}
                <div className="bundle-footer">
                  <div className="bundle-pricing">
                    {normalTotal > finalPrice && (
                      <div className="bundle-original-price">
                        {texts.individually}: {normalTotal} ₺
                      </div>
                    )}
                    <div className="bundle-final-price">
                      {finalPrice} <span>₺</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`bundle-add-btn ${isJustAdded ? 'added' : ''}`}
                    onClick={() => handleAddBundleToCart(campaign)}
                  >
                    {isJustAdded ? (
                      <>
                        <Check size={18} strokeWidth={2.5} />
                        <span>{texts.added}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        <span>{texts.add}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
