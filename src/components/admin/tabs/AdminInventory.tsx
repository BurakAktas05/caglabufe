'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Flame,
} from 'lucide-react';
import { ProductModal } from '../ProductModal';

interface AdminInventoryProps {
  products: Product[];
  onToggleAvailability: (productId: string, currentStatus: boolean) => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}


export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  onToggleAvailability,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialIsKitchen, setModalInitialIsKitchen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'general' | 'kitchen'>('all');

  const kitchenCount = useMemo(() => products.filter((p) => p.isKitchenItem).length, [products]);
  const generalCount = useMemo(() => products.filter((p) => !p.isKitchenItem).length, [products]);

  const dynamicCategories = useMemo(() => {
    let source = products;
    if (sectionFilter === 'kitchen') {
      source = products.filter((p) => p.isKitchenItem);
    } else if (sectionFilter === 'general') {
      source = products.filter((p) => !p.isKitchenItem);
    }
    const set = new Set(source.map((p) => p.category).filter(Boolean));
    const dynamic = Array.from(set).map((c) => ({ id: c, name: c }));
    return [{ id: 'all', name: 'Tümü' }, ...dynamic];
  }, [products, sectionFilter]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (sectionFilter === 'kitchen') {
      list = list.filter((p) => p.isKitchenItem);
    } else if (sectionFilter === 'general') {
      list = list.filter((p) => !p.isKitchenItem);
    }

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.barcode && p.barcode.includes(term)) ||
          (p.category && p.category.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
    return list;
  }, [products, sectionFilter, selectedCategory, searchTerm]);

  const handleAddNew = (isKitchen: boolean = false) => {
    setModalInitialIsKitchen(isKitchen);
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setModalInitialIsKitchen(Boolean(p.isKitchenItem));
    setIsModalOpen(true);
  };

  const handleSaveModal = (p: Product) => {
    onSaveProduct(p);
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} color="#5D3EBC" />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
              Ürün Yönetimi ({products.length} Ürün)
            </h2>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0 0' }}>
              Genel market ve sıcak mutfak ürünlerini ayrı ayrı ekleyebilir ve yönetebilirsiniz.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              minWidth: '180px',
            }}
          >
            <Search size={15} color="#6B7280" />
            <input
              type="text"
              placeholder="Ürün veya barkod ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          {/* 1. Genel Ürün Ekle Butonu */}
          <button
            onClick={() => handleAddNew(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#5D3EBC',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.25)',
              whiteSpace: 'nowrap',
            }}
            title="Normal market / kantin ürünü ekle"
          >
            <Plus size={16} />
            <span>Genel Ürün Ekle</span>
          </button>

          {/* 2. Mutfak Bölümüne Ürün Ekle Butonu */}
          <button
            onClick={() => handleAddNew(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
              whiteSpace: 'nowrap',
            }}
            title="Sıcak mutfak, tost, sandviç lezzeti ekle"
          >
            <Flame size={16} />
            <span>🥪 Mutfak Ürünü Ekle</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills (Genel Market vs Sıcak Mutfak Reyonları) */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setSectionFilter('all');
            setSelectedCategory('all');
          }}
          style={{
            padding: '7px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 800,
            backgroundColor: sectionFilter === 'all' ? '#1F2937' : '#FFFFFF',
            color: sectionFilter === 'all' ? '#FFFFFF' : '#4B5563',
            border: '1.5px solid ' + (sectionFilter === 'all' ? '#1F2937' : '#E5E7EB'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Tüm Ürünler ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSectionFilter('general');
            setSelectedCategory('all');
          }}
          style={{
            padding: '7px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 800,
            backgroundColor: sectionFilter === 'general' ? '#5D3EBC' : '#FFFFFF',
            color: sectionFilter === 'general' ? '#FFFFFF' : '#5D3EBC',
            border: '1.5px solid ' + (sectionFilter === 'general' ? '#5D3EBC' : '#DDD6FE'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Package size={14} />
          <span>Genel Market Ürünleri ({generalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSectionFilter('kitchen');
            setSelectedCategory('all');
          }}
          style={{
            padding: '7px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 800,
            backgroundColor: sectionFilter === 'kitchen' ? '#EA580C' : '#FFFFFF',
            color: sectionFilter === 'kitchen' ? '#FFFFFF' : '#EA580C',
            border: '1.5px solid ' + (sectionFilter === 'kitchen' ? '#EA580C' : '#FED7AA'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Flame size={14} />
          <span>🥪 Sıcak Mutfak Reyonu ({kitchenCount})</span>
        </button>
      </div>

      {/* Category Filter Pills - 2 Sıra / Wrap Yapısı */}
      {dynamicCategories.length > 1 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '14px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
            Kategoriler:
          </span>
          {dynamicCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? (sectionFilter === 'kitchen' ? '#EA580C' : '#5D3EBC')
                    : '#F3F4F6',
                  color: isActive ? '#FFFFFF' : '#4B5563',
                  border: '1px solid ' + (isActive ? (sectionFilter === 'kitchen' ? '#EA580C' : '#5D3EBC') : '#E5E7EB'),
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '50px 20px',
            textAlign: 'center',
            border: '1px solid #EBEBF2',
          }}
        >
          <Package size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>Ürün Bulunamadı</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
            Farklı bir arama yapabilir veya yeni ürün ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid ' + (p.isAvailable ? '#E2E8F0' : '#FECDD3'),
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                opacity: p.isAvailable ? 1 : 0.75,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #E5E7EB',
                    flexShrink: 0,
                  }}
                >
                  <Image src={p.imageUrl} alt={p.name} fill sizes="60px" style={{ objectFit: 'cover' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#191919',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {p.brand && (
                      <span style={{ backgroundColor: '#EDE9FE', color: '#5D3EBC', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                        {p.brand}
                      </span>
                    )}
                    <span style={{ fontWeight: 600 }}>{p.category}</span>
                    {p.barcode && <span style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>#{p.barcode}</span>}
                    {p.isKitchenItem && (
                      <span
                        style={{
                          backgroundColor: '#FFEDD5',
                          color: '#C2410C',
                          border: '1px solid #FDBA74',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        🥪 Sıcak Mutfak
                      </span>
                    )}
                    {p.isKitchenItem && p.prepTimeMinutes && (
                      <span style={{ color: '#EA580C', fontSize: '10px', fontWeight: 700 }}>
                        ⏱️ ~{p.prepTimeMinutes} dk
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#5D3EBC' }}>
                      ₺{p.price.toFixed(2)}
                    </span>
                    {p.discountPrice && (
                      <span style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                        ₺{p.discountPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {p.description && (
                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.35, maxHeight: '30px', overflow: 'hidden' }}>
                  {p.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                <button
                  type="button"
                  onClick={() => onToggleAvailability(p.id, p.isAvailable)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    backgroundColor: p.isAvailable ? '#ECFDF5' : '#FEF2F2',
                    color: p.isAvailable ? '#059669' : '#DC2626',
                    border: '1px solid ' + (p.isAvailable ? '#A7F3D0' : '#FECDD3'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {p.isAvailable ? <CheckCircle size={13} /> : <XCircle size={13} />}
                  <span>{p.isAvailable ? 'Satışta' : 'Tükendi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEdit(p)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Ürün Fiyatı ve Bilgilerini Düzenle"
                >
                  <Edit2 size={14} />
                </button>

                {onDeleteProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`"${p.name}" ürününü silmek istediğinize emin misiniz?`)) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECDD3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Ürünü Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          initialIsKitchen={modalInitialIsKitchen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};
