'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, ProductCategory } from '@/types';
import { X, Save, Package } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

import { CATEGORIES } from '@/data/seedData';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(product);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Çikolata');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Adet');
  const [isKitchenItem, setIsKitchenItem] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (product) {
      setId(product.id);
      setName(product.name);
      setBrand(product.brand || '');
      setBarcode(product.barcode || '');
      setCategory(product.category);
      setPrice(product.price.toString());
      setDiscountPrice(product.discountPrice ? product.discountPrice.toString() : '');
      setImageUrl(product.imageUrl);
      setDescription(product.description || '');
      setUnit(product.unit || 'Adet');
      setIsKitchenItem(Boolean(product.isKitchenItem));
      setIsAvailable(product.isAvailable);
    } else {
      setId('');
      setName('');
      setBrand('');
      setBarcode('');
      setCategory('Çikolata');
      setPrice('');
      setDiscountPrice('');
      setImageUrl('');
      setDescription('');
      setUnit('Adet');
      setIsKitchenItem(false);
      setIsAvailable(true);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const finalId = id.trim()
      ? id.trim()
      : barcode.trim()
        ? `prod_${barcode.trim()}`
        : name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4);

    const updatedProduct: Product = {
      id: finalId,
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.trim() || undefined,
      category,
      price: parseFloat(price) || 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60',
      description: description.trim(),
      unit,
      isKitchenItem,
      isAvailable,
    };

    onSave(updatedProduct);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8F9FA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#5D3EBC" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937' }}>
              {isEditing ? `Ürünü Düzenle: ${product?.name}` : 'Yeni Ürün Ekle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Product Name */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Ürün Adı *
              </label>
              <input
                type="text"
                placeholder="Örn: Kaşarlı Sucuklu Tost, Coca Cola 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Brand & Barcode Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Marka (Örn: Eti, Ülker)
                </label>
                <input
                  type="text"
                  placeholder="Marka adı..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Barkod (BenimPOS)
                </label>
                <input
                  type="text"
                  placeholder="Örn: 8690526095226"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Kategori *
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => {
                  const val = e.target.value as ProductCategory;
                  setCategory(val);
                  if (val === 'sicak-lezzetler') setIsKitchenItem(true);
                }}
                placeholder="Kategori seçin veya yazın..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Pricing Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Satış Fiyatı (₺) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="85.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  İndirimli Fiyat (Opsiyonel)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="69.00"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Image URL & Preview */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Görsel URL
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... veya Supabase URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {imageUrl && (
                  <div style={{ width: '42px', height: '42px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1', flexShrink: 0 }}>
                    <Image src={imageUrl} alt="Önizleme" fill sizes="42px" style={{ objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Açıklama / Porsiyon Notu
              </label>
              <textarea
                rows={2}
                placeholder="Örn: Bol kaşar, dana sucuk, tereyağlı çıtır ekmek arasında."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Kitchen & Availability Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                <input
                  type="checkbox"
                  checked={isKitchenItem}
                  onChange={(e) => setIsKitchenItem(e.target.checked)}
                />
                <span>Mutfak Ürünü (Tost, sandviç gibi hazırlık süresi gerektirir)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: isAvailable ? '#059669' : '#DC2626' }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span>{isAvailable ? 'Satışta (Stokta Var)' : 'Tükendi (Müşteriye Kapalı)'}</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Save size={16} />
                <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Ekle'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
