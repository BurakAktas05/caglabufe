'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { useApp } from '@/context/AppContext';
import { Product, ProductCategory } from '@/types';
import { DEPARTMENTS, getDepartmentById, findDepartmentForCategory } from '@/data/departments';
import { CATEGORIES } from '@/data/categories';
import { smartSearchProducts, SmartSearchResult } from '@/lib/searchEngine';
import {
  Search,
  ArrowLeft,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('kategori') || '';
  const initialReyon = searchParams.get('reyon') || '';
  const initialQuery = searchParams.get('q') || '';

  const { products, cart, storeOpen } = useApp();

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(initialReyon || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Sync state when URL params change
  useEffect(() => {
    if (initialReyon) {
      setSelectedDepartmentId(initialReyon);
      setSelectedCategory('all');
    } else if (initialCategory) {
      setSelectedCategory(initialCategory);
      const dep = findDepartmentForCategory(initialCategory);
      if (dep) setSelectedDepartmentId(dep.id);
    }
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialReyon, initialCategory, initialQuery]);

  // Active Department
  const activeDepartment = useMemo(() => {
    if (selectedDepartmentId === 'all') return null;
    return getDepartmentById(selectedDepartmentId) || null;
  }, [selectedDepartmentId]);

  // 1. Department Pool (products belonging to current active department or whole store)
  const departmentPool = useMemo(() => {
    if (!activeDepartment) return products;
    if (activeDepartment.id === 'sicak-mutfak') {
      return products.filter(
        (p) =>
          p.isKitchenItem ||
          activeDepartment.categories.includes(p.category) ||
          findDepartmentForCategory(p.category)?.id === 'sicak-mutfak'
      );
    }
    return products.filter(
      (p) =>
        !p.isKitchenItem &&
        (activeDepartment.categories.includes(p.category) ||
          findDepartmentForCategory(p.category)?.id === activeDepartment.id)
    );
  }, [products, activeDepartment]);

  // 2. Subcategories with live product counts (only for browsing when NOT searching)
  const availableSubCategories = useMemo(() => {
    // When a specific department is chosen and user is not searching: show department categories
    if (activeDepartment && !searchQuery.trim()) {
      const counts: Record<string, number> = {};
      departmentPool.forEach((p) => {
        if (p.category) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });

      return activeDepartment.categories
        .filter((cat) => (counts[cat] || 0) > 0)
        .map((cat) => ({
          id: cat,
          name: cat,
          count: counts[cat] || 0,
        }));
    }

    return [];
  }, [searchQuery, activeDepartment, departmentPool]);

  // 3. Search Result & Products Display
  const searchResult: SmartSearchResult = useMemo(() => {
    // A. Active Search: Search across ALL store products without category/department restrictions
    if (searchQuery.trim()) {
      return smartSearchProducts(searchQuery, products);
    }

    // B. Browsing: Filter department pool by selectedCategory if any
    let pool = departmentPool;
    if (selectedCategory !== 'all') {
      pool = pool.filter((p) => p.category === selectedCategory);
    }

    return {
      products: pool,
      relatedProducts: [],
      relatedTitle: undefined,
      matchedIntent: null,
      query: '',
      totalFound: pool.length,
    };
  }, [products, departmentPool, searchQuery, selectedCategory]);

  // Progressive Pagination
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedDepartmentId, selectedCategory, searchQuery]);

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

  // Title calculation
  const pageTitle = useMemo(() => {
    if (searchQuery.trim()) {
      return `"${searchQuery}" Arama Sonuçları`;
    }
    if (selectedCategory !== 'all') {
      return `${selectedCategory} Reyonu`;
    }
    if (activeDepartment) {
      return `${activeDepartment.emoji} ${activeDepartment.name}`;
    }
    return 'Tüm Market Reyonları';
  }, [searchQuery, selectedCategory, activeDepartment]);

  return (
    <div className={`page-wrapper ${cart.length > 0 ? 'has-floating-cart' : ''}`}>
      <Header />

      <main className="main-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 14px' }}>
        {/* Navigation Bar / Back Button & Breadcrumbs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            backgroundColor: '#FFFFFF',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 800,
                color: '#5D3EBC',
                textDecoration: 'none',
                backgroundColor: '#F3F0FE',
                padding: '7px 14px',
                borderRadius: '10px',
                transition: 'background-color 0.15s ease',
              }}
            >
              <ArrowLeft size={16} />
              <span>Ana Sayfa</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}>
              <ChevronRight size={14} />
              <span style={{ fontWeight: 700, color: '#1F2937' }}>{pageTitle}</span>
            </div>
          </div>

          {searchQuery ? (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#5D3EBC', backgroundColor: '#F3F0FE', padding: '4px 10px', borderRadius: '12px' }}>
              {searchResult.products.length} ürün bulundu
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              {activeDepartment ? activeDepartment.badge : 'Tüm Reyonlar'}
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              color="#9CA3AF"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory('all');
              }}
              placeholder="Market genelinde ürün, marka veya kategori ara... (Örn: Uludağ, Nescafe, Cips)"
              style={{
                width: '100%',
                padding: '12px 42px 12px 46px',
                fontSize: '14px',
                borderRadius: '14px',
                border: '1.5px solid #E5E7EB',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* If Active Search: Show Search Status Bar; Else: Show Department Tabs & Category Chips */}
        {searchQuery.trim() ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E9D5FF',
              borderRadius: '16px',
              padding: '12px 18px',
              marginBottom: '20px',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.06)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#F3F0FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5D3EBC',
                }}
              >
                <Search size={16} />
              </div>
              <div style={{ fontSize: '13.5px', color: '#374151' }}>
                Tüm markette <strong style={{ color: '#5D3EBC' }}>&ldquo;{searchQuery}&rdquo;</strong> için arama sonuçları:
              </div>
              <span
                style={{
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}
              >
                {searchResult.products.length} ürün bulundu
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '10px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#4B5563',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={14} />
              <span>Aramayı Temizle (Reyonlara Dön)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Department Switcher Tabs (2-Row Grid Scroll) */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(2, auto)',
                gridAutoFlow: 'column',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '10px',
                marginBottom: '14px',
                scrollbarWidth: 'none',
              }}
              className="no-scrollbar"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartmentId('all');
                  setSelectedCategory('all');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  border: selectedDepartmentId === 'all' ? '2px solid #5D3EBC' : '1px solid #E5E7EB',
                  backgroundColor: selectedDepartmentId === 'all' ? '#5D3EBC' : '#FFFFFF',
                  color: selectedDepartmentId === 'all' ? '#FFFFFF' : '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Tüm Reyonlar</span>
              </button>

              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDepartmentId === dept.id;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      setSelectedDepartmentId(dept.id);
                      setSelectedCategory('all');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      border: isSelected ? '2px solid #5D3EBC' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#5D3EBC' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{dept.emoji}</span>
                    <span>{dept.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Category Filter Chips (Single Row Horizontal Scroll with Live Counts) */}
            {availableSubCategories.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginBottom: '16px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                className="no-scrollbar"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '12.5px',
                    fontWeight: selectedCategory === 'all' ? 800 : 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    border: selectedCategory === 'all' ? '1.5px solid #5D3EBC' : '1px solid #E5E7EB',
                    backgroundColor: selectedCategory === 'all' ? '#5D3EBC' : '#FFFFFF',
                    color: selectedCategory === 'all' ? '#FFFFFF' : '#374151',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedCategory === 'all' ? '0 2px 6px rgba(93, 62, 188, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Hepsi</span>
                  <span
                    style={{
                      fontSize: '11px',
                      opacity: selectedCategory === 'all' ? 0.95 : 0.7,
                      fontWeight: 700,
                      backgroundColor: selectedCategory === 'all' ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                      color: selectedCategory === 'all' ? '#FFFFFF' : '#6B7280',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {departmentPool.length}
                  </span>
                </button>

                {availableSubCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        fontWeight: isSelected ? 800 : 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        border: isSelected ? '1.5px solid #5D3EBC' : '1px solid #E5E7EB',
                        backgroundColor: isSelected ? '#5D3EBC' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#374151',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSelected ? '0 2px 6px rgba(93, 62, 188, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{cat.name}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          opacity: isSelected ? 0.95 : 0.7,
                          fontWeight: 700,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                          color: isSelected ? '#FFFFFF' : '#6B7280',
                          padding: '1px 6px',
                          borderRadius: '10px',
                        }}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hot Kitchen Special Reyon Banner */}
            {selectedDepartmentId === 'sicak-mutfak' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
                  border: '2px solid #FDBA74',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 8px 24px -4px rgba(234, 88, 12, 0.15)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 0', minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '3px 9px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🔥 Ateşte Pişen Lezzetler
                    </span>
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#C2410C',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid #FDBA74',
                      }}
                    >
                      ⏱️ ~20-25 dk Taze Hazırlık
                    </span>
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#7C2D12',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid #FDBA74',
                      }}
                    >
                      🎓 KYK &amp; Kampüs Hızlı Teslimat
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#9A3412', margin: '0 0 4px 0' }}>
                    🥪 Sıcak Mutfak &amp; Efsane Tostlar
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#7C2D12', margin: 0, lineHeight: 1.45 }}>
                    Tüm tostlar, sandviçler ve sıcak büfe lezzetleri siparişiniz anında taze pişirilir, özenle paketlenir ve sıcacık kapınıza getirilir.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Products Grid */}
        {searchResult.products.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid #E5E7EB',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#F3F0FE',
                color: '#5D3EBC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Search size={26} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', marginBottom: '8px' }}>
              Ürün Bulunamadı
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              {searchQuery.trim()
                ? `"${searchQuery}" ile eşleşen bir ürün bulunamadı. Farklı bir kelime deneyebilir veya tüm reyonlara göz atabilirsiniz.`
                : 'Aradığınız kriterde ürün bu reyonda bulunamadı. Diğer reyonları inceleyebilirsiniz.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDepartmentId('all');
              }}
              style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '13px' }}
            >
              Tüm Ürünleri Göster
            </button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Related Recommendations */}
            {searchResult.relatedProducts && searchResult.relatedProducts.length > 0 && (
              <div className="netflix-recommendations-wrapper" style={{ marginTop: '36px' }}>
                <div className="netflix-rec-header">
                  <h3 className="netflix-rec-title">
                    <Sparkles size={18} color="#8B5CF6" />
                    <span>{searchResult.relatedTitle || 'İlginizi Çekebilecek Diğer Lezzetler'}</span>
                  </h3>
                  <p className="netflix-rec-subtitle">
                    Aradığınız lezzete benzer ve birlikte tercih edilen alternatifler
                  </p>
                </div>
                <div className="product-grid">
                  {searchResult.relatedProducts.map((p) => (
                    <ProductCard key={`rec-${p.id}`} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Pagination Bar & Buttons */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="pagination-btn pagination-btn-primary"
                  onClick={handleLoadMore}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 800,
                    borderRadius: '14px',
                    backgroundColor: '#5D3EBC',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(93, 62, 188, 0.2)',
                  }}
                >
                  Daha Fazla Ürün Göster
                </button>
                <button
                  type="button"
                  className="pagination-btn pagination-btn-secondary"
                  onClick={handleShowAll}
                  style={{
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '14px',
                    backgroundColor: '#F3F0FE',
                    color: '#5D3EBC',
                    border: '1px solid #DDD6FE',
                    cursor: 'pointer',
                  }}
                >
                  Tümünü Listele
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6B7280' }}>
          Ürünler yükleniyor...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
