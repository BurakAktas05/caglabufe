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
} from 'lucide-react';
import { ProductModal } from '../ProductModal';

interface AdminInventoryProps {
  products: Product[];
  onToggleAvailability: (productId: string, currentStatus: boolean) => void;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'Tümü' },
  { id: 'tost-sandvic', name: 'Tost & Sandviç' },
  { id: 'icecek', name: 'İçecekler' },
  { id: 'atistirmalik', name: 'Cips & Çerez' },
  { id: 'tatli-cikolata', name: 'Tatlı & Bisküvi' },
  { id: 'kahvalti', name: 'Kahvaltılık' },
  { id: 'temel-gida', name: 'Temel Gıda' },
  { id: 'dondurma', name: 'Dondurma' },
  { id: 'kisisel-bakim', name: 'Kişisel Bakım' },
];

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

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
    return list;
  }, [products, selectedCategory, searchTerm]);

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleSaveModal = (p: Product) => {
    onSaveProduct(p);
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
            Toplam {products.length} Ürün Listeleniyor
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              minWidth: '220px',
            }}
          >
            <Search size={15} color="#6B7280" />
            <input
              type="text"
              placeholder="Ürün adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          {/* Add New Product Button */}
          <button
            onClick={handleAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#5D3EBC',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: isActive ? '#5D3EBC' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#4B5563',
                border: '1px solid ' + (isActive ? '#5D3EBC' : '#E5E7EB'),
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

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
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                    {p.category} {p.isKitchenItem && '• Mutfak'}
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                {/* Stock Toggle */}
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

                {/* Edit Button */}
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

                {/* Optional Delete */}
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

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};
