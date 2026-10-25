'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, ProductCategory } from '@/types';
import { X, Save, Package, Flame, Clock } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';

interface ProductModalProps {
  product: Product | null;
  initialIsKitchen?: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const KITCHEN_CATEGORIES = [
  'Tost & Sıcak Lezzetler',
  'Sandviç',
  'Sıcak Sandviç',
  'Burger & Sıcak Atıştırmalık',
  'Gözleme',
  'Dürüm',
  'Büfe',
];

const GENERAL_CATEGORIES = [
  'Çikolata',
  'Bisküvi',
  'Kek',
  'Gofret',
  'Cips',
  'Kola',
  'Soğuk Çay',
  'Enerji İçeceği',
  'Hazır Noodle',
  'Şampuan',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  initialIsKitchen = false,
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
  const [isKitchenItem, setIsKitchenItem] = useState(initialIsKitchen);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
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
      setPrepTimeMinutes(product.prepTimeMinutes ? product.prepTimeMinutes.toString() : '20');
      setIsAvailable(product.isAvailable);
    } else {
      setId('');
      setName('');
      setBrand('');
      setBarcode('');
      const isKitchen = Boolean(initialIsKitchen);
      setIsKitchenItem(isKitchen);
      setCategory(isKitchen ? 'Tost & Sıcak Lezzetler' : 'Çikolata');
      setPrice('');
      setDiscountPrice('');
      setImageUrl(isKitchen ? '/categories/hot-tost-hero.jpg' : '');
      setDescription('');
      setUnit(isKitchen ? 'Porsiyon' : 'Adet');
      setPrepTimeMinutes('20');
      setIsAvailable(true);
    }
  }, [product, initialIsKitchen]);

  const selectGeneralMode = () => {
    setIsKitchenItem(false);
    if (category === 'Tost & Sıcak Lezzetler' || category === 'Sandviç') {
      setCategory('Çikolata');
    }
    if (unit === 'Porsiyon') setUnit('Adet');
  };

  const selectKitchenMode = () => {
    setIsKitchenItem(true);
    if (!category || category === 'Çikolata') {
      setCategory('Tost & Sıcak Lezzetler');
    }
    if (unit === 'Adet') setUnit('Porsiyon');
    if (!imageUrl || imageUrl.includes('unsplash')) {
      setImageUrl('/categories/hot-tost-hero.jpg');
    }
  };

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
      imageUrl: imageUrl.trim() || (isKitchenItem ? '/categories/hot-tost-hero.jpg' : 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60'),
      description: description.trim(),
      unit,
      isKitchenItem,
      prepTimeMinutes: isKitchenItem ? (parseInt(prepTimeMinutes, 10) || 20) : undefined,
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
            padding: '16px 22px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: isKitchenItem ? '#FFF7ED' : '#F8F9FA',
            transition: 'background-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: isKitchenItem ? '#FFEDD5' : '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isKitchenItem ? <Flame size={20} color="#EA580C" /> : <Package size={20} color="#5D3EBC" />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: isKitchenItem ? '#9A3412' : '#1F2937', margin: 0 }}>
                {isEditing
                  ? `Ürünü Düzenle: ${product?.name}`
                  : isKitchenItem
                  ? '🥪 Sıcak Mutfak Bölümüne Ürün Ekle'
                  : '📦 Yeni Genel Market Ürünü Ekle'}
              </h3>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0 0' }}>
                {isKitchenItem
                  ? 'Tost, sandviç, sıcak büfe ve hazırlık lezzetleri'
                  : 'Paketli atıştırmalık, içecek, temel market ve kantin ürünleri'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Segmented Reyon Selector */}
            <div
              style={{
                backgroundColor: isKitchenItem ? '#FFF7ED' : '#F9FAFB',
                padding: '12px',
                borderRadius: '14px',
                border: isKitchenItem ? '1.5px solid #FDBA74' : '1.5px solid #E5E7EB',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151' }}>
                  ÜRÜNÜN EKLENECEĞİ REYON / BÖLÜM *
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isKitchenItem ? '#C2410C' : '#5D3EBC',
                    backgroundColor: isKitchenItem ? '#FFEDD5' : '#EDE9FE',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {isKitchenItem ? '🔥 Sıcak Mutfak Reyonu' : '🛒 Genel Market Reyonları'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={selectGeneralMode}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: !isKitchenItem ? '2px solid #5D3EBC' : '1px solid #D1D5DB',
                    backgroundColor: !isKitchenItem ? '#5D3EBC' : '#FFFFFF',
                    color: !isKitchenItem ? '#FFFFFF' : '#4B5563',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: !isKitchenItem ? '0 2px 8px rgba(93, 62, 188, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Package size={16} />
                  <span>Genel Market Ürünü</span>
                </button>

                <button
                  type="button"
                  onClick={selectKitchenMode}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: isKitchenItem ? '2px solid #EA580C' : '1px solid #D1D5DB',
                    backgroundColor: isKitchenItem ? '#EA580C' : '#FFFFFF',
                    color: isKitchenItem ? '#FFFFFF' : '#4B5563',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: isKitchenItem ? '0 2px 8px rgba(234, 88, 12, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Flame size={16} />
                  <span>🥪 Sıcak Mutfak Ürünü</span>
                </button>
              </div>

              {isKitchenItem && (
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#9A3412', fontWeight: 600, lineHeight: 1.4 }}>
                  Bu ürün vitrinde turuncu sıcak temalı &quot;Sıcak Mutfak &amp; Tostlar&quot; reyonunda listelenir. Sipariş alındığında mutfak ekranına düşer.
                </p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                {isKitchenItem ? 'Tost / Sandviç / Lezzet Adı *' : 'Ürün Adı *'}
              </label>
              <input
                type="text"
                placeholder={isKitchenItem ? 'Örn: Kaşarlı Sucuklu Tost, Soğuk Sandviç, Ayvalık Tostu' : 'Örn: Coca Cola 1L, Indomie Hazır Noodle, Red Bull 250ml'}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Brand & Barcode Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Marka {isKitchenItem ? '(Mutfakta Boş Bırakılabilir)' : '(Opsiyonel)'}
                </label>
                <input
                  type="text"
                  placeholder={isKitchenItem ? 'Boş bırakabilirsiniz' : 'Örn: Eti, Ülker, Haribo'}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Barkod {isKitchenItem ? '(Opsiyonel)' : '(BenimPOS)'}
                </label>
                <input
                  type="text"
                  placeholder={isKitchenItem ? 'Mutfak için isteğe bağlı' : 'Örn: 8690526095226'}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Category + Quick Chips */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>
                  Kategori *
                </label>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>Önerilerden seçebilirsiniz</span>
              </div>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => {
                  const val = e.target.value as ProductCategory;
                  setCategory(val);
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
                  boxSizing: 'border-box',
                }}
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>

              {/* Quick Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {(isKitchenItem ? KITCHEN_CATEGORIES : GENERAL_CATEGORIES).map((catName) => (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setCategory(catName)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: category === catName ? (isKitchenItem ? '#EA580C' : '#5D3EBC') : '#F3F4F6',
                      color: category === catName ? '#FFFFFF' : '#4B5563',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {catName}
                  </button>
                ))}
              </div>
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Kitchen Prep Time & Unit Row */}
            <div style={{ display: 'grid', gridTemplateColumns: isKitchenItem ? '1fr 1fr' : '1fr', gap: '12px' }}>
              {isKitchenItem && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#EA580C', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Clock size={14} />
                    <span>Hazırlık Süresi (Dakika)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Örn: 20"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #FDBA74',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#FFF7ED',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Birim / Porsiyon Notu
                </label>
                <input
                  type="text"
                  placeholder={isKitchenItem ? 'Örn: Porsiyon, Yarım Ekmek, Tam Ekmek' : 'Örn: Adet, Kutu, Paket, 1L'}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                  type="text"
                  placeholder={isKitchenItem ? '/categories/hot-tost-hero.jpg veya URL' : 'https://... veya Supabase URL'}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
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
                {isKitchenItem ? 'İçerik & Malzeme Açıklaması' : 'Açıklama / Ürün Notu'}
              </label>
              <textarea
                rows={2}
                placeholder={isKitchenItem ? 'Örn: Bol kaşar peyniri, dana sucuk, tereyağlı çıtır ekmek arasında turşu ile servis edilir.' : 'Örn: Serinletici soğuk içecek, 250ml kutu.'}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Availability Checkbox */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: isAvailable ? '#059669' : '#DC2626' }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span>{isAvailable ? 'Satışta (Stokta Var / Sipariş Alınabilir)' : 'Tükendi (Müşteriye Kapalı)'}</span>
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
                  backgroundColor: isKitchenItem ? '#EA580C' : '#5D3EBC',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isKitchenItem ? '0 4px 12px rgba(234, 88, 12, 0.3)' : '0 4px 12px rgba(93, 62, 188, 0.3)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Save size={16} />
                <span>
                  {isEditing
                    ? 'Değişiklikleri Kaydet'
                    : isKitchenItem
                    ? '🥪 Mutfak Ürününü Ekle'
                    : '📦 Genel Ürünü Ekle'}
                </span>
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
