'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { Plus, Minus, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { cart, addToCart, removeFromCart } = useApp();
  const [imageError, setImageError] = useState(false);

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const currentPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className={`market-card ${quantity > 0 ? 'selected' : ''}`}>
      {/* Image Area */}
      <div className="card-image-box">
        {!imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="card-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="card-fallback">
            <Package size={28} className="text-muted" />
            <span className="card-fallback-text">{product.name}</span>
          </div>
        )}

        {/* Hot / Kitchen Badge */}
        {product.isKitchenItem && (
          <span className="badge-kitchen">Sıcak Mutfak</span>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="badge-discount">İndirim</span>
        )}
      </div>

      {/* Info Body */}
      <div className="card-body">
        {/* Price Row */}
        <div className="card-price-row">
          <span className="card-price">₺{currentPrice.toFixed(2)}</span>
          {hasDiscount && (
            <span className="card-old-price">₺{product.price.toFixed(2)}</span>
          )}
        </div>

        {/* Brand Badge (Only rendered if brand is present, e.g. Ülker, Eti. Omitted for Tost/unbranded products) */}
        {product.brand && product.brand.trim() !== '' && (
          <span className="card-brand-badge">{product.brand.trim()}</span>
        )}

        {/* Title */}
        <h3 className="card-title" title={product.name}>
          {product.name}
        </h3>

        {/* Action Button */}
        <div className="card-action">
          {quantity === 0 ? (
            <button
              type="button"
              className="card-add-btn"
              onClick={() => addToCart(product)}
              disabled={!product.isAvailable}
              aria-label={`${product.name} sepete ekle`}
            >
              <Plus size={16} />
              <span>{product.isAvailable ? 'Ekle' : 'Tükendi'}</span>
            </button>
          ) : (
            <div className="card-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => removeFromCart(product.id)}
                aria-label="Azalt"
              >
                <Minus size={14} />
              </button>
              <span className="stepper-count">{quantity}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => addToCart(product)}
                aria-label="Arttır"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
