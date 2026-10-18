'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BannerCarousel } from '@/components/BannerCarousel';
import { CategoryBar } from '@/components/CategoryBar';
import { ProductCard } from '@/components/ProductCard';
import { BundleDealsSection } from '@/components/BundleDealsSection';
import { useApp } from '@/context/AppContext';
import { Product, ProductCategory } from '@/types';
import { getActiveCampaigns, getActiveBundleDeals } from '@/lib/settingsManager';
import { smartSearchProducts, SmartSearchResult } from '@/lib/searchEngine';
import {
  Search,
  ShoppingBag,
  Clock,
  ArrowRight,
  Flame,
  Tag,
  Phone,
  MessageCircle,
  Sparkles,
  Store,
  X,
  RotateCcw,
  Plus,
  Check,
} from 'lucide-react';

const QUICK_INTENTS = [
  { label: 'Çikolata & Tatlı', query: 'Çikolata', emoji: '🍫' },
  { label: 'Cips & Çerez', query: 'Cips', emoji: '🍿' },
  { label: 'Enerji & Soğuk', query: 'Enerji İçeceği', emoji: '⚡' },
  { label: 'Soğuk Çay & İçecek', query: 'Soğuk Çay', emoji: '🧊' },
  { label: 'Noodle & Pratik', query: 'Hazır Noodle', emoji: '🍜' },
  { label: 'Kahve & Çay', query: 'Tekli Poşet Kahve', emoji: '☕' },
  { label: 'Kişisel Bakım', query: 'Şampuan', emoji: '🧴' },
];

export default function Home() {
  const {
    cart,
    cartTotal,
    itemCount,
    setIsCartOpen,
    orders,
    setActiveTrackingOrder,
    storeOpen,
    products,
    systemSettings,
    reorderItems,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCampaigns = useMemo(() => getActiveCampaigns(), []);
  const bundleDeals = useMemo(() => getActiveBundleDeals(), []);
  const storePhone = systemSettings.storePhone || '0542 000 7878';
  const rawWhatsApp = (systemSettings.storeWhatsApp || '905420007878').replace(/\D/g, '');
  const cleanPhone = storePhone.replace(/\s+/g, '');

  // Bundles matching search query or default
  const matchingBundles = useMemo(() => {
    if (!searchQuery.trim()) return bundleDeals;
    const q = searchQuery.toLowerCase();
    return bundleDeals.filter((b) =>
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      (b.bundleBadge && b.bundleBadge.toLowerCase().includes(q))
    );
  }, [bundleDeals, searchQuery]);

  // Campaign products (products with discountPrice)
  const campaignProducts = useMemo(() => {
    return products.filter((p) => p.isAvailable && p.discountPrice && p.discountPrice < p.price);
  }, [products]);

  // Top Popular & Bestseller items for quick picks on home
  const popularProducts = useMemo(() => {
    const popularBrands = [
      'Red Bull',
      'Eti',
      'Ülker',
      'Tadım',
      'Haribo',
      'Indomie',
      'Damla',
      'Nescafe',
      'Lipton Ice Tea',
      'Uludağ',
      'Cipso',
      'Şölen',
    ];
    const chosen: Product[] = [];
    const usedIds = new Set<string>();

    for (const brand of popularBrands) {
      const match = products.find((p) => p.brand === brand && p.isAvailable && !usedIds.has(p.id));
      if (match) {
        chosen.push(match);
        usedIds.add(match.id);
      }
      if (chosen.length >= 8) break;
    }

    if (chosen.length < 8) {
      for (const p of products) {
        if (!usedIds.has(p.id) && p.isAvailable) {
          chosen.push(p);
          usedIds.add(p.id);
          if (chosen.length >= 8) break;
        }
      }
    }
    return chosen;
  }, [products]);

  // Smart & Semantic Search Execution
  const searchResult: SmartSearchResult = useMemo(() => {
    const pool = selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

    if (!searchQuery.trim()) {
      return {
        products: pool,
        relatedProducts: [],
        relatedTitle: undefined,
        matchedIntent: null,
        query: '',
        totalFound: pool.length,
      };
    }

    return smartSearchProducts(searchQuery, pool);
  }, [products, selectedCategory, searchQuery]);

  // Progressive Pagination for high performance rendering
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchQuery]);

  const visibleProducts = useMemo(() => {
    return searchResult.products.slice(0, visibleCount);
  }, [searchResult.products, visibleCount]);

  const hasMore = visibleCount < searchResult.products.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, searchResult.products.length));
  };

  const handleShowAll = () => {
    setVisibleCount(searchResult.products.length);
  };

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way'
    );
  }, [orders]);

  const lastCompletedOrder = useMemo(() => {
    return orders.find((o) => o.status === 'delivered');
  }, [orders]);

  return (
    <div className={`page-wrapper ${cart.length > 0 ? 'has-floating-cart' : ''}`}>
      <Header />

      {/* Live Announcement Banner from Admin Settings */}
      {systemSettings.isAnnouncementActive && systemSettings.announcementText && (
        <div
          style={{
            backgroundColor: '#FFD10D',
            color: '#1F2937',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderBottom: '1px solid #E5BA0A',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Sparkles size={15} color="#5D3EBC" />
          <span>{systemSettings.announcementText}</span>
        </div>
      )}

      {/* Store Open / Closed Status Banner */}
      {!storeOpen ? (
        <div
          style={{
            backgroundColor: '#1E1B4B',
            color: '#A5B4FC',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            textAlign: 'center',
            borderBottom: '1px solid #312E81',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          {systemSettings.closedMessage || `Sipariş saatleri dışındayız. Hizmet saatlerimiz: ${systemSettings.storeOpenTime} - ${systemSettings.storeCloseTime}.`}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 700,
            textAlign: 'center',
            borderBottom: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', flexShrink: 0 }} />
          <span>Şu An Açığız • {systemSettings.storeCloseTime}&apos;e kadar Karabük 100. Yıl &amp; KYK Yurtlarına hızlı teslimat</span>
        </div>
      )}

      {/* Active order(s) bar */}
      {activeOrders.length > 0 && (
        <div
          onClick={() => setActiveTrackingOrder(activeOrders[0])}
          style={{
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeOrders.length > 1 ? (
                  <span>
                    <strong>{activeOrders.length} Aktif Siparişiniz Var:</strong> {activeOrders.map((o) => `${o.orderNumber} (${o.status === 'on_the_way' ? 'Kuryede' : o.status === 'preparing' ? 'Hazırlanıyor' : 'Alındı'})`).join(' • ')}
                  </span>
                ) : (
                  <span>
                    <strong>{activeOrders[0].orderNumber}</strong> nolu siparişiniz{' '}
                    {activeOrders[0].status === 'pending' ? 'alındı' : activeOrders[0].status === 'preparing' ? 'hazırlanıyor' : 'kuryede yolda'}
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline', flexShrink: 0 }}>
              <span>{activeOrders.length > 1 ? 'Siparişleri Takip Et' : 'Sipariş Durumu'}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      )}

      {/* Quick Repeat Last Order Banner for returning customers */}
      {activeOrders.length === 0 && lastCompletedOrder && cart.length === 0 && (
        <div
          style={{
            backgroundColor: '#F5F3FF',
            borderBottom: '1px solid #DDD6FE',
            padding: '9px 16px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#4C1D95',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#7C3AED" />
              <span>
                Son Siparişiniz: <strong>{lastCompletedOrder.orderNumber}</strong> ({lastCompletedOrder.items.length} ürün, ₺{lastCompletedOrder.finalAmount.toFixed(2)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => reorderItems(lastCompletedOrder.items)}
              style={{
                backgroundColor: '#5D3EBC',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(93, 62, 188, 0.2)',
              }}
            >
              <RotateCcw size={12} />
              <span>Aynı Sepeti Tekrarla</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <BannerCarousel />

      {/* Active Campaign Banners */}
      {activeCampaigns.length > 0 && searchQuery === '' && (
        <div className="campaign-banners-container">
          <div className="campaign-banners-scroll">
            {activeCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="campaign-banner-card"
                style={{
                  backgroundColor: campaign.bannerColor || '#5D3EBC',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Tag size={16} color="#FFD10D" />
                  <span style={{ fontSize: '14px', fontWeight: 800 }}>{campaign.title}</span>
                </div>
                <p style={{ fontSize: '12px', opacity: 0.92, lineHeight: 1.4 }}>{campaign.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Search Bar */}
      <div className="search-container">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Ürün, marka veya kategori ara... (örn: Eti, Ülker, Cips, Red Bull)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Aramayı Temizle"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Popular Brand Pills */}
        <div className="search-quick-tags">
          <span className="search-tag-label">Popüler:</span>
          {['Ülker', 'Eti', 'Haribo', 'Red Bull', 'Tadım', 'Uludağ', 'Nescafe', 'Şölen'].map((brandName) => {
            const isActive = searchQuery.toLowerCase() === brandName.toLowerCase();
            return (
              <button
                key={brandName}
                type="button"
                className={`search-chip ${isActive ? 'active' : ''}`}
                onClick={() => setSearchQuery(isActive ? '' : brandName)}
              >
                <span>🏷️</span>
                <span>{brandName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Bar */}
      <CategoryBar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      {/* Main Content */}
      <main className="main-content" id="katalog-bolumu">
        {/* Semantic Search Result Card */}
        {searchResult.matchedIntent && (
          <div className="semantic-intent-card">
            <div className="intent-card-left">
              <span className="intent-card-emoji">{searchResult.matchedIntent.emoji}</span>
              <div>
                <div className="intent-card-badge">AKILLI NİYET EŞLEŞMESİ</div>
                <h3 className="intent-card-title">{searchResult.matchedIntent.label}</h3>
                <p className="intent-card-desc">{searchResult.matchedIntent.reason}</p>
              </div>
            </div>
            <button
              type="button"
              className="intent-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              Filtreyi Temizle
            </button>
          </div>
        )}

        {/* Bundle / Combo Deals Section */}
        {matchingBundles.length > 0 && selectedCategory === 'all' && (
          <div id="bundle-deals-section">
            <BundleDealsSection bundles={matchingBundles} products={products} />
          </div>
        )}

        {/* 1. Popular & Bestsellers Section (when on All with no search) */}
        {selectedCategory === 'all' && searchQuery === '' && popularProducts.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div className="section-header">
              <h2 className="section-title">
                <Flame size={20} color="#EA580C" />
                <span>Popüler &amp; Çok Satanlar</span>
              </h2>
              <span style={{ fontSize: '12px', color: '#EA580C', fontWeight: 800 }}>
                En Çok Tercih Edilenler
              </span>
            </div>
            <div className="product-grid">
              {popularProducts.map((product) => (
                <ProductCard key={`pop-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* 2. Campaign Products Section */}
        {selectedCategory === 'all' && campaignProducts.length > 0 && searchQuery === '' && (
          <div style={{ marginBottom: '28px' }}>
            <div className="section-header">
              <h2 className="section-title">
                <Tag size={18} color="#EA580C" />
                <span>Günün Fırsatları</span>
              </h2>
              <span style={{ fontSize: '13px', color: '#EA580C', fontWeight: 700 }}>
                {campaignProducts.length} indirimli ürün
              </span>
            </div>
            <div className="product-grid">
              {campaignProducts.map((product) => (
                <ProductCard key={`campaign-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* 3. Filtered or All Products Section */}
        <div className="section-header">
          <h2 className="section-title">
            {searchQuery ? (
              <>
                <Search size={18} color="#5D3EBC" />
                <span>&ldquo;{searchQuery}&rdquo; Arama Sonuçları</span>
              </>
            ) : selectedCategory === 'all' ? (
              <span>Tüm Market Reyonları</span>
            ) : (
              <span>{selectedCategory} Reyonu</span>
            )}
          </h2>
          <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 700 }}>
            {visibleProducts.length} / {searchResult.products.length} ürün listeleniyor
          </span>
        </div>

        {searchResult.products.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '48px 20px',
              textAlign: 'center',
              border: '1px solid #E5E7EB',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#F3F0FE',
                color: '#5D3EBC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <ShoppingBag size={26} color="#5D3EBC" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', marginBottom: '6px' }}>
              {products.length === 0
                ? 'Katalog Güncelleniyor'
                : 'Aradığınız Ürün Bulunamadı'}
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '380px', margin: '0 auto 16px', lineHeight: 1.4 }}>
              {products.length === 0
                ? 'Ürün kataloğu ve fiyat listesi güncellenmektedir. Lütfen birazdan tekrar kontrol ediniz.'
                : searchResult.relatedProducts && searchResult.relatedProducts.length > 0
                ? `"${searchQuery}" ifadesine birebir uyan ürün bulunamadı, ancak aşağıda senin için önerdiğimiz benzer lezzetlere göz atabilirsin:`
                : `"${searchQuery}" ifadesine uygun ürün bulamadık. Dilerseniz aramayı temizleyebilirsiniz.`}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Progressive Pagination / Load More Box */}
            {hasMore ? (
              <div className="catalog-pagination-box">
                <div className="pagination-progress-info">
                  <span>
                    Toplam {searchResult.products.length} üründen <strong>{visibleProducts.length}</strong> tanesi listeleniyor
                  </span>
                  <div className="pagination-progress-track">
                    <div
                      className="pagination-progress-bar"
                      style={{
                        width: `${Math.round((visibleProducts.length / searchResult.products.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pagination-actions">
                  <button
                    type="button"
                    className="btn-load-more"
                    onClick={handleLoadMore}
                  >
                    <Plus size={16} />
                    <span>Daha Fazla Göster (+{Math.min(PAGE_SIZE, searchResult.products.length - visibleProducts.length)})</span>
                  </button>

                  {searchResult.products.length > visibleCount + PAGE_SIZE && (
                    <button
                      type="button"
                      className="btn-show-all"
                      onClick={handleShowAll}
                    >
                      <span>Tümünü Göster ({searchResult.products.length})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : searchResult.products.length > PAGE_SIZE ? (
              <div className="catalog-end-banner">
                <Check size={16} color="#059669" />
                <span>Reyondaki tüm ürünler listelendi ({searchResult.products.length} ürün)</span>
              </div>
            ) : null}
          </>
        )}

        {/* Netflix-Style Related Category Recommendations */}
        {searchQuery.trim() !== '' && searchResult.relatedProducts && searchResult.relatedProducts.length > 0 && (
          <div className="netflix-rec-wrapper">
            <div className="netflix-rec-header">
              <span className="netflix-rec-badge">🎬 NETFLIX TARZI ÖNERİLER</span>
              <h3 className="netflix-rec-title">
                <Sparkles size={18} color="#8B5CF6" />
                <span>{searchResult.relatedTitle || `"${searchQuery}" ile İlgili Popüler Seçenekler`}</span>
              </h3>
              <p className="netflix-rec-subtitle">
                Aradığın lezzete benzer ve birlikte en çok tercih edilen alternatif ürünler
              </p>
            </div>
            <div className="product-grid">
              {searchResult.relatedProducts.map((product: Product) => (
                <ProductCard key={`rec-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* PWA Install & Quick Support */}
        <div
          style={{
            marginTop: '36px',
            marginBottom: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#5D3EBC',
                color: '#FFD10D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>
                {systemSettings.storeName || 'Çağla Büfe & Market'}
              </h4>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                {systemSettings.storeAddress || '100. Yıl Mah. 1003. Cad. No:12 Karabük'} • Hizmet Saatleri: {systemSettings.storeOpenTime} - {systemSettings.storeCloseTime}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#F3F4F6',
                color: '#1F2937',
                border: '1px solid #D1D5DB',
                textDecoration: 'none',
              }}
            >
              <Phone size={15} />
              <span>Büfeyi Ara</span>
            </a>
            <a
              href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent('Merhaba Çağla Büfe, sipariş vermek istiyorum.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      {/* Floating Cart Bar (Solid, high contrast, mobile bottom thumb reachable) */}
      {cart.length > 0 && (
        <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="floating-cart-info">
            <span className="floating-cart-badge">{itemCount}</span>
            <span className="floating-cart-total">{cartTotal.toFixed(2)} TL</span>
          </div>
          <div className="floating-cart-btn">
            <span>Sepeti Onayla</span>
            <ShoppingBag size={18} />
          </div>
        </div>
      )}
    </div>
  );
}
