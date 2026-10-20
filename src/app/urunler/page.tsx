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

  // Categories under active department
  const subCategories = useMemo(() => {
    if (!activeDepartment) {
      return CATEGORIES;
    }
    const baseCats = CATEGORIES.filter((c) => activeDepartment.categories.includes(c.id));
    // Also include any dynamically existing product categories belonging to this department
    const dynamicCats = new Set<string>();
    products.forEach((p) => {
      const isMatch =
        activeDepartment.categories.includes(p.category) ||
        findDepartmentForCategory(p.category)?.id === activeDepartment.id;
      if (isMatch && !baseCats.some((c) => c.id === p.category)) {
        dynamicCats.add(p.category);
      }
    });
    const extraCats = Array.from(dynamicCats).map((cat) => ({
      id: cat as ProductCategory,
      name: cat,
      description: `${cat} çeşitleri`,
    }));
    return [...baseCats, ...extraCats];
  }, [activeDepartment, products]);

  // Filter pool
  const filteredPool = useMemo(() => {
    let pool = products;

    // Filter by department if chosen
    if (activeDepartment) {
      pool = pool.filter(
        (p) =>
          activeDepartment.categories.includes(p.category) ||
          findDepartmentForCategory(p.category)?.id === activeDepartment.id
      );
    }

    // Filter by specific subcategory if chosen
    if (selectedCategory !== 'all') {
      pool = pool.filter((p) => p.category === selectedCategory);
    }

    return pool;
  }, [products, activeDepartment, selectedCategory]);

  // Smart Search Execution
  const searchResult: SmartSearchResult = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        products: filteredPool,
        relatedProducts: [],
        relatedTitle: undefined,
        matchedIntent: null,
        query: '',
        totalFound: filteredPool.length,
      };
    }
    return smartSearchProducts(searchQuery, filteredPool);
  }, [filteredPool, searchQuery]);

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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bu reyon içinde ara... (Örn: Red Bull, Cips, Çikolata, Noodle)"
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
                onClick={() => setSearchQuery('')}
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

        {/* Department Switcher Tabs (Horizontal Scroll) */}
        <div
          style={{
            display: 'flex',
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

        {/* Sub-Category Filter Chips (If Department has multiple categories) */}
        {subCategories.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '10px',
              marginBottom: '18px',
              scrollbarWidth: 'none',
            }}
            className="no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: selectedCategory === 'all' ? '1.5px solid #7C3AED' : '1px solid #E5E7EB',
                backgroundColor: selectedCategory === 'all' ? '#EDE9FE' : '#F9FAFB',
                color: selectedCategory === 'all' ? '#6D28D9' : '#4B5563',
                cursor: 'pointer',
              }}
            >
              Hepsi
            </button>

            {subCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => p.category === cat.id).length;
              if (count === 0) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1.5px solid #7C3AED' : '1px solid #E5E7EB',
                    backgroundColor: isSelected ? '#EDE9FE' : '#FFFFFF',
                    color: isSelected ? '#6D28D9' : '#4B5563',
                    cursor: 'pointer',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
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
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '380px', margin: '0 auto 20px' }}>
              Aradığınız kriterde ürün bu reyonda bulunamadı. Diğer reyonları inceleyebilirsiniz.
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
