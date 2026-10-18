'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DEPARTMENTS, Department } from '@/data/departments';
import { CATEGORIES } from '@/data/categories';
import { ArrowRight, Sparkles, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface TrendyolCategoryGridProps {
  onSelectCategory?: (category: string) => void;
}

export const TrendyolCategoryGrid: React.FC<TrendyolCategoryGridProps> = () => {
  const [showAllSubCategories, setShowAllSubCategories] = useState(false);

  return (
    <section className="trendyol-category-section" style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#1F2937',
                letterSpacing: '-0.3px',
                margin: 0,
              }}
            >
              Market &amp; Kantin Reyonları
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: '#F3F0FE',
                color: '#5D3EBC',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid #DDD6FE',
              }}
            >
              653 Gerçek Ürün
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 500 }}>
            İhtiyacın olan reyonu seç, 15-20 dakikada odana gelsin.
          </p>
        </div>

        <Link
          href="/urunler"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#5D3EBC',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: '#F3F0FE',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Tüm Ürünleri Gör (653)</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Trendyol Go Style Square Photo Categories Grid */}
      <div className="trendyol-category-grid">
        {DEPARTMENTS.map((dept: Department) => {
          return (
            <Link
              key={dept.id}
              href={`/urunler?reyon=${dept.id}`}
              className="trendyol-category-card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="trendyol-card-inner"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  padding: '12px 10px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Visual Image Container */}
                <div
                  className="trendyol-img-box"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: '110px',
                    backgroundColor: dept.accentBg,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={dept.imageUrl}
                    alt={dept.name}
                    fill
                    sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 15vw"
                    style={{
                      objectFit: 'contain',
                      padding: '8px',
                      transition: 'transform 0.25s ease',
                    }}
                    className="category-product-img"
                  />
                  {/* Real count badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      color: '#1F2937',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                  >
                    {dept.count}
                  </span>
                </div>

                {/* Category Name */}
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#1F2937',
                    lineHeight: 1.2,
                    margin: '0 0 3px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '30px',
                    wordBreak: 'break-word',
                  }}
                >
                  {dept.name}
                </h3>

                {/* Subtitle / hint */}
                <span
                  style={{
                    fontSize: '10px',
                    color: '#6B7280',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    display: 'block',
                  }}
                >
                  {dept.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Subcategory Toggle (Show all 66 specific micro-categories) */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setShowAllSubCategories((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#6B7280',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            padding: '7px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={14} color="#5D3EBC" />
          <span>
            {showAllSubCategories
              ? 'Tüm Alt Reyonları Gizle'
              : 'Tüm 66 Detaylı Alt Reyonu Göster (Çikolata, Cips, Sakız, vb.)'}
          </span>
          {showAllSubCategories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAllSubCategories && (
          <div
            style={{
              marginTop: '14px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
            }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/urunler?kategori=${encodeURIComponent(cat.id)}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  border: '1px solid #E5E7EB',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
