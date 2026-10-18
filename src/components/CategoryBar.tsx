'use client';

import React from 'react';
import { ProductCategory } from '@/types';
import { CATEGORIES } from '@/data/seedData';
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
  ShoppingBasket,
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (cat: ProductCategory | 'all') => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'temel-gida': <ShoppingBasket size={16} />,
  'soguk-icecek': <Droplets size={16} />,
  'cay-kahve': <Coffee size={16} />,
  'pratik-yemek': <Soup size={16} />,
  'cips-cerez': <Cookie size={16} />,
  'cikolata-tatli': <Candy size={16} />,
  'biskuvi-kek': <Croissant size={16} />,
  'kisisel-bakim': <Sparkles size={16} />,
  'sicak-lezzetler': <Flame size={16} />,
};

export const CategoryBar = ({ selectedCategory, onSelectCategory }: CategoryBarProps) => {
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
        </button>

        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              {categoryIcons[cat.id] || <LayoutGrid size={15} />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
