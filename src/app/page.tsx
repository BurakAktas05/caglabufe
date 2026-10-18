'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { BannerCarousel } from '@/components/BannerCarousel';
import { TrendyolCategoryGrid } from '@/components/TrendyolCategoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { BundleDealsSection } from '@/components/BundleDealsSection';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
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
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
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

  // Smart & Semantic Search Execution (if user types on home)
  const searchResult: SmartSearchResult = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        products: [],
        relatedProducts: [],
        relatedTitle: undefined,
        matchedIntent: null,
        query: '',
        totalFound: 0,
      };
    }
    return smartSearchProducts(searchQuery, products);
  }, [products, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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

      {/* Hero Banner Carousel */}
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
        <form onSubmit={handleSearchSubmit} className="search-input-box">
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#5D3EBC',
            }}
            title="Ara"
          >
            <Search size={18} className="search-icon" />
          </button>
          <input
            type="text"
            className="search-input"
            placeholder="Ürün, marka veya kategori ara... (örn: Eti, Ülker, Cips, Red Bull)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Aramayı Temizle"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Quick Popular Brand Pills -> jumps directly to /urunler?q=... */}
        <div className="search-quick-tags">
          <span className="search-tag-label">Popüler:</span>
          {['Ülker', 'Eti', 'Haribo', 'Red Bull', 'Tadım', 'Uludağ', 'Nescafe', 'Şölen'].map((brandName) => {
            return (
              <button
                key={brandName}
                type="button"
                className="search-chip"
                onClick={() => router.push(`/urunler?q=${encodeURIComponent(brandName)}`)}
              >
                <span>🏷️</span>
                <span>{brandName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content" id="katalog-bolumu">
        {/* If user is typing in home search bar, show live matching search preview */}
        {searchQuery.trim() !== '' ? (
          <div style={{ marginBottom: '32px' }}>
            {/* Semantic Intent Card */}
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
                  Temizle
                </button>
              </div>
            )}

            <div className="section-header">
              <h2 className="section-title">
                <Search size={18} color="#5D3EBC" />
                <span>&ldquo;{searchQuery}&rdquo; Arama Sonuçları</span>
              </h2>
              <Link
                href={`/urunler?q=${encodeURIComponent(searchQuery)}`}
                style={{
                  fontSize: '12px',
                  color: '#5D3EBC',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Tüm Sonuçları Gör ({searchResult.products.length})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {searchResult.products.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  border: '1px solid #E5E7EB',
                }}
              >
                <ShoppingBag size={28} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '6px' }}>
                  &ldquo;{searchQuery}&rdquo; ile eşleşen ürün bulunamadı
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '14px' }}>
                  Farklı bir kelime deneyebilir veya tüm reyonları inceleyebilirsiniz.
                </p>
                <Link
                  href="/urunler"
                  className="btn-primary"
                  style={{ display: 'inline-flex', width: 'auto', padding: '9px 18px', fontSize: '13px' }}
                >
                  Tüm Ürünleri Gör
                </Link>
              </div>
            ) : (
              <div className="product-grid">
                {searchResult.products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {searchResult.products.length > 8 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link
                  href={`/urunler?q=${encodeURIComponent(searchQuery)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#5D3EBC',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(93, 62, 188, 0.25)',
                  }}
                >
                  <span>Kalan {searchResult.products.length - 8} Ürünü İncele</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {/* Related Category Recommendations on search */}
            {searchResult.relatedProducts && searchResult.relatedProducts.length > 0 && (
              <div className="netflix-rec-wrapper" style={{ marginTop: '24px' }}>
                <div className="netflix-rec-header">
                  <h3 className="netflix-rec-title">
                    <Sparkles size={18} color="#8B5CF6" />
                    <span>{searchResult.relatedTitle || `"${searchQuery}" ile İlgili Popüler Seçenekler`}</span>
                  </h3>
                  <p className="netflix-rec-subtitle">
                    Aradığın lezzete benzer ve birlikte en çok tercih edilen alternatif ürünler
                  </p>
                </div>
                <div className="product-grid">
                  {searchResult.relatedProducts.slice(0, 4).map((product: Product) => (
                    <ProductCard key={`rec-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Homepage Showcase View */
          <>
            {/* Trendyol Go Style Photo Categories Grid */}
            <TrendyolCategoryGrid />

            {/* Bundle / Combo Deals Section */}
            {matchingBundles.length > 0 && (
              <div id="bundle-deals-section" style={{ marginBottom: '32px' }}>
                <BundleDealsSection bundles={matchingBundles} products={products} />
              </div>
            )}

            {/* Popular & Bestsellers Quick Picks (8 items) */}
            {popularProducts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div className="section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={20} color="#EA580C" />
                    <h2 className="section-title" style={{ margin: 0 }}>
                      Popüler &amp; Çok Satanlar
                    </h2>
                  </div>
                  <Link
                    href="/urunler"
                    style={{
                      fontSize: '13px',
                      color: '#5D3EBC',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Tümünü Gör</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="product-grid">
                  {popularProducts.map((product) => (
                    <ProductCard key={`pop-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Products Section */}
            {campaignProducts.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <div className="section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={18} color="#EA580C" />
                    <h2 className="section-title" style={{ margin: 0 }}>
                      Günün İndirimli Fırsatları
                    </h2>
                  </div>
                  <span style={{ fontSize: '13px', color: '#EA580C', fontWeight: 800 }}>
                    {campaignProducts.length} indirimli ürün
                  </span>
                </div>
                <div className="product-grid">
                  {campaignProducts.slice(0, 8).map((product) => (
                    <ProductCard key={`campaign-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Big Prominent Full Catalog CTA Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '28px 24px',
                border: '1.5px solid #E5E7EB',
                boxShadow: '0 4px 20px rgba(93, 62, 188, 0.06)',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%)',
              }}
            >
              <div style={{ maxWidth: '520px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    marginBottom: '10px',
                  }}
                >
                  <Layers size={13} />
                  <span>GENİŞ MARKET KATALOĞU • 11 REYON</span>
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#1F2937',
                    letterSpacing: '-0.4px',
                    margin: '0 0 8px 0',
                    lineHeight: 1.25,
                  }}
                >
                  Tüm Market &amp; Kantin Kataloğunu Keşfet
                </h3>
                <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                  Atıştırmalıktan soğuk içeceklere, hazır noodle çeşitlerinden kişisel bakıma kadar aradığın tüm ürünler tek sayfada, alt filtreler ve hızlı arama ile elinin altında.
                </p>
              </div>

              <Link
                href="/urunler"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 28px',
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 900,
                  textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(93, 62, 188, 0.3)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <span>Ürünler Sayfasına Git</span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </>
        )}

        {/* Store Info & WhatsApp / Phone Support */}
        <div
          style={{
            marginTop: '20px',
            marginBottom: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#5D3EBC',
                color: '#FFD10D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                {systemSettings.storeName || 'Çağla Büfe & Market'}
              </h4>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>
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
                borderRadius: '10px',
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
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              }}
            >
              <MessageCircle size={15} />
              <span>WhatsApp Destek</span>
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
