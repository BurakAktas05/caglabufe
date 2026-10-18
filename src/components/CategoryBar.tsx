'use client';

import React, { useMemo } from 'react';
import { ProductCategory, CategoryInfo } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { useApp } from '@/context/AppContext';
import {
  Flame,
  Droplets,
  Cookie,
  Candy,
  Croissant,
  Soup,
  Sparkles,
  LayoutGrid,
  Coffee,
  Zap,
  Smile,
  Apple,
  Heart,
  Shield,
  Layers,
  CircleDot,
  Nut,
  Milk,
  Tent,
  Utensils,
  Package,
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (cat: ProductCategory | 'all') => void;
}

const getCategoryIcon = (categoryName: string, iconKey?: string): React.ReactNode => {
  const key = (iconKey || categoryName).toLowerCase();

  if (key.includes('çikolata') || key === 'candy') return <Candy size={16} />;
  if (key.includes('sakız') || key.includes('şeker') || key === 'smile') return <Smile size={16} />;
  if (key.includes('meyve') || key === 'apple') return <Apple size={16} />;
  if (key.includes('cips') || key.includes('bisküvi') || key.includes('kraker') || key === 'cookie') return <Cookie size={16} />;
  if (key.includes('gofret') || key.includes('kek') || key === 'croissant') return <Croissant size={16} />;
  if (key.includes('enerji') || key === 'zap') return <Zap size={16} />;
  if (key.includes('çay') || key.includes('kahve') || key === 'coffee') return <Coffee size={16} />;
  if (key.includes('su') || key.includes('soda') || key.includes('kola') || key.includes('içecek') || key === 'droplets') return <Droplets size={16} />;
  if (key.includes('noodle') || key.includes('çorba') || key.includes('makarna') || key === 'soup') return <Soup size={16} />;
  if (key.includes('kuruyemiş') || key.includes('fıstık') || key.includes('çekirdek') || key.includes('fındık') || key === 'circledot' || key === 'nut') return <Nut size={16} />;
  if (key.includes('süt') || key.includes('yoğurt') || key.includes('ayran') || key === 'milk') return <Milk size={16} />;
  if (key.includes('ped') || key === 'shield') return <Shield size={16} />;
  if (key.includes('şampuan') || key.includes('bakım') || key.includes('temizlik') || key.includes('mendil') || key === 'sparkles') return <Sparkles size={16} />;
  if (key.includes('kağıt') || key === 'layers') return <Layers size={16} />;
  if (key.includes('kedi') || key === 'heart') return <Heart size={16} />;
  if (key.includes('çakmak') || key === 'flame') return <Flame size={16} />;
  if (key.includes('kamp') || key === 'tent') return <Tent size={16} />;
  if (key.includes('sos') || key.includes('ketçap') || key === 'utensils') return <Utensils size={16} />;

  return <Package size={16} />;
};

export const CategoryBar = ({ selectedCategory, onSelectCategory }: CategoryBarProps) => {
  const { products } = useApp();

  // Compute category counts from live products
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    (products || []).forEach((p) => {
      if (p.category) {
        map.set(p.category, (map.get(p.category) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  const activeCategories: CategoryInfo[] = useMemo(() => {
    if (CATEGORIES && CATEGORIES.length > 0) {
      // Filter or sort by categories present in active products
      return CATEGORIES.filter((c) => categoryCounts.has(c.id)).sort(
        (a, b) => (categoryCounts.get(b.id) || 0) - (categoryCounts.get(a.id) || 0)
      );
    }
    // Fallback: derive categories directly from products
    const unique = Array.from(categoryCounts.keys());
    return unique.map((catKey) => ({
      id: catKey,
      name: catKey,
      icon: 'package',
      description: '',
    }));
  }, [categoryCounts]);

  if (activeCategories.length === 0 && (products || []).length === 0) {
    return null;
  }

  return (
    <div className="category-bar-wrapper">
      <div className="category-bar">
        <button
          type="button"
          className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <LayoutGrid size={15} />
          <span>Tüm Reyonlar</span>
          {products.length > 0 && <span className="cat-count">({products.length})</span>}
        </button>

        {activeCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts.get(cat.id) || 0;
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              {getCategoryIcon(cat.name, cat.icon)}
              <span>{cat.name}</span>
              {count > 0 && <span className="cat-count">({count})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
