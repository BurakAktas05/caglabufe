'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DeliveryZone, DormitoryConfig, StoreBranch } from '@/types';
import {
  MapPin,
  Building2,
  Plus,
  Trash2,
  Navigation,
  Store,
  Zap,
  CloudRain,
  Moon,
  ExternalLink,
  Edit2,
  Check,
  X,
  Compass,
  Layers,
  PenTool,
} from 'lucide-react';
import {
  getSystemSettings,
  getGoogleMapsDormUrl,
  getGoogleMapsStoreUrl,
  getStoreBranches,
  saveStoreBranches,
  addStoreBranch,
  updateStoreBranch,
  deleteStoreBranch,
} from '@/lib/settingsManager';

const DeliveryMap = dynamic(
  () => import('@/components/DeliveryMap').then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          color: '#94A3B8',
          fontSize: '13px',
          fontWeight: 700,
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '26px' }}>🗺️</span>
        <span>Karabük OpenStreetMap &amp; Şube Kapsama Haritası Yükleniyor...</span>
      </div>
    ),
  }
);

interface AdminZonesProps {
  zones: DeliveryZone[];
  dorms: DormitoryConfig[];
  onAddZone: (zone: Omit<DeliveryZone, 'id'>) => void;
  onUpdateZone: (id: string, updates: Partial<DeliveryZone>) => void;
  onDeleteZone: (id: string) => void;
  onAddDorm: (dorm: Omit<DormitoryConfig, 'id'>) => void;
  onUpdateDorm: (id: string, updates: Partial<DormitoryConfig>) => void;
  onDeleteDorm: (id: string) => void;
}

export const AdminZones: React.FC<AdminZonesProps> = ({
  zones,
  dorms,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  onAddDorm,
  onUpdateDorm,
  onDeleteDorm,
}) => {
  const settings = getSystemSettings();

  // Dynamic Branches State
  const [branches, setBranches] = useState<StoreBranch[]>(getStoreBranches());

  // Map Mode: 'none' | 'polygon' (elle çizim) | 'store_pin' (dükkan konumu seçimi)
  const [mapMode, setMapMode] = useState<'none' | 'polygon' | 'store_pin'>('none');
  const [redrawingZone, setRedrawingZone] = useState<DeliveryZone | null>(null);

  // Polygon Modal State
  const [isPolyModalOpen, setIsPolyModalOpen] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<[number, number][] | null>(null);
  const [polyName, setPolyName] = useState('');
  const [polyMinOrder, setPolyMinOrder] = useState('60');
  const [polyFee, setPolyFee] = useState('15');
  const [polyFreeThreshold, setPolyFreeThreshold] = useState('150');
  const [polyMinutes, setPolyMinutes] = useState('18');
  const [polyColor, setPolyColor] = useState('#8B5CF6');

  // Store Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [placedStoreCoords, setPlacedStoreCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeShortName, setStoreShortName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('0542 000 7878');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeColor, setStoreColor] = useState('#5D3EBC');

  // Dorm Form State
  const [dormName, setDormName] = useState('');
  const [dormDistrict, setDormDistrict] = useState('Demir Çelik Kampüsü');
  const [dormGender, setDormGender] = useState<'kiz' | 'erkek' | 'karma'>('karma');
  const [dormBlocks, setDormBlocks] = useState('A Blok, B Blok, C Blok');
  const [dormZoneId, setDormZoneId] = useState('');
  const [dormDistanceKm, setDormDistanceKm] = useState('2.4');

  // Inline Editing Zone State
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editMinOrder, setEditMinOrder] = useState<number>(50);
  const [editFee, setEditFee] = useState<number>(10);
  const [editFreeThreshold, setEditFreeThreshold] = useState<number>(120);
  const [editMinutes, setEditMinutes] = useState<number>(15);

  const startEditZone = (z: DeliveryZone) => {
    setEditingZoneId(z.id);
    setEditMinOrder(z.minOrderAmount);
    setEditFee(z.deliveryFee);
    setEditFreeThreshold(z.freeDeliveryThreshold);
    setEditMinutes(z.estimatedMinutes);
  };

  const saveEditZone = (id: string) => {
    onUpdateZone(id, {
      minOrderAmount: editMinOrder,
      deliveryFee: editFee,
      freeDeliveryThreshold: editFreeThreshold,
      estimatedMinutes: editMinutes,
    });
    setEditingZoneId(null);
  };

  const handleAddDormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dormName.trim()) return;
    const blocksArray = dormBlocks
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    onAddDorm({
      name: dormName.trim(),
      district: dormDistrict.trim() || 'Demir Çelik Kampüsü',
      gender: dormGender,
      blocks: blocksArray.length > 0 ? blocksArray : ['Ana Blok'],
      zoneId: dormZoneId || (zones[0]?.id || 'zone-kyk-yurtlari'),
      isActive: true,
      distanceKm: Number(dormDistanceKm) || 2.4,
      mapsQuery: `${dormName.trim()}, Karabük`,
    });
    setDormName('');
  };

  // Tariff Presets Handlers
  const applyPreset = (preset: 'standard' | 'student' | 'rain' | 'night') => {
    zones.forEach((z) => {
      const ring = z.hexRing || 1;
      if (preset === 'standard') {
        const standardMap: Record<1 | 2 | 3 | 4, { min: number; fee: number; minTime: number }> = {
          1: { min: 50, fee: 10, minTime: 12 },
          2: { min: 60, fee: 15, minTime: 18 },
          3: { min: 80, fee: 20, minTime: 25 },
          4: { min: 120, fee: 30, minTime: 35 },
        };
        const s = standardMap[ring];
        onUpdateZone(z.id, { minOrderAmount: s.min, deliveryFee: s.fee, estimatedMinutes: s.minTime });
      } else if (preset === 'student') {
        if (ring === 2) {
          // KYK student discount
          onUpdateZone(z.id, { minOrderAmount: 40, deliveryFee: 5, freeDeliveryThreshold: 100 });
        } else if (ring === 1) {
          onUpdateZone(z.id, { minOrderAmount: 40, deliveryFee: 5 });
        }
      } else if (preset === 'rain') {
        // Bad weather +10 TL fee, +10 mins courier safety margin
        onUpdateZone(z.id, {
          deliveryFee: z.deliveryFee + 10,
          estimatedMinutes: z.estimatedMinutes + 10,
        });
      } else if (preset === 'night') {
        // Night rush minimum basket +15 TL
        onUpdateZone(z.id, {
          minOrderAmount: z.minOrderAmount + 15,
        });
      }
    });
  };

  // --- POLYGON DRAWING & STORE PLACEMENT HANDLERS ---
  const handlePolygonDrawn = (coords: [number, number][]) => {
    if (redrawingZone) {
      onUpdateZone(redrawingZone.id, {
        polygonCoords: coords,
      });
      alert(`"${redrawingZone.name}" bölgesinin harita sınırları başarıyla güncellendi!`);
      setRedrawingZone(null);
      setMapMode('none');
      return;
    }
    setDrawnCoords(coords);
    setPolyName(`Özel Bölge ${zones.length + 1}`);
    setIsPolyModalOpen(true);
  };

  const handleSaveDrawnPolygonZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawnCoords || drawnCoords.length < 3) return;

    onAddZone({
      name: polyName.trim(),
      minOrderAmount: Number(polyMinOrder) || 60,
      deliveryFee: Number(polyFee) || 15,
      freeDeliveryThreshold: Number(polyFreeThreshold) || 150,
      estimatedMinutes: Number(polyMinutes) || 18,
      isActive: true,
      hexColor: polyColor,
      polygonCoords: drawnCoords,
    });

    setIsPolyModalOpen(false);
    setDrawnCoords(null);
    setMapMode('none');
    alert(`"${polyName.trim()}" bölgesi başarıyla kaydedildi! Harita üzerinde canlı olarak görebilirsiniz.`);
  };

  const handleStorePointPicked = (coords: { lat: number; lng: number }) => {
    setPlacedStoreCoords(coords);
    const nextIdx = branches.length + 1;
    setStoreName(`${nextIdx}. Şube`);
    setStoreShortName(`${nextIdx}. Şube`);
    setStoreAddress('Karabük');
    setIsStoreModalOpen(true);
  };

  const handleSaveNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placedStoreCoords) return;

    const newBranch = addStoreBranch({
      name: storeName.trim(),
      shortName: storeShortName.trim() || storeName.trim(),
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      description: storeDesc.trim() || 'Hızlı Büfe & Market Teslimatı',
      color: storeColor,
      latitude: placedStoreCoords.lat,
      longitude: placedStoreCoords.lng,
      isActive: true,
    });

    setBranches(getStoreBranches());
    setIsStoreModalOpen(false);
    setPlacedStoreCoords(null);
    setMapMode('none');
    alert(`"${newBranch.name}" başarıyla eklendi ve haritada işaretlendi!`);
  };

  const handleDeleteStoreBranch = (id: string, name: string) => {
    if (confirm(`"${name}" dükkanını sistemden silmek istediğinize emin misiniz?`)) {
      deleteStoreBranch(id);
      setBranches(getStoreBranches());
    }
  };

  const handleToggleStoreBranch = (id: string, currentActive: boolean) => {
    updateStoreBranch(id, { isActive: !currentActive });
    setBranches(getStoreBranches());
  };

  const storeMapsUrl = getGoogleMapsStoreUrl(settings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. STORE BASE & HEXAGONAL RADAR GEOFENCE DASHBOARD */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0e0c24 0%, #171338 50%, #201a4e 100%)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          color: '#FFFFFF',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Dükkan / Şube Odak Noktaları */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={22} color="#FFD10D" />
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  Market Şubeleri &amp; Kapsama Ağı ({branches.length} Dükkan)
                </h2>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Müşteri adresleri en yakın şubeye ve belirlediğiniz teslimat bölgelerine otomatik atanır.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMapMode(mapMode === 'store_pin' ? 'none' : 'store_pin');
                if (mapMode !== 'store_pin') {
                  alert('Harita üzerinde yeni dükkanınızın bulunacağı konuma tıklayınız.');
                }
              }}
              style={{
                backgroundColor: mapMode === 'store_pin' ? '#FFD10D' : 'rgba(255, 209, 13, 0.15)',
                color: mapMode === 'store_pin' ? '#191919' : '#FFD10D',
                border: '1.5px solid #FFD10D',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              <Store size={15} />
              <span>{mapMode === 'store_pin' ? '✕ Seçimi İptal Et' : '➕ Haritada Yeni Dükkan Ekle'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: '12px' }}>
            {branches.map((branch, idx) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name}, ${branch.address}`)}`;
              return (
                <div
                  key={branch.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: `1.5px solid ${branch.color}60`,
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          backgroundColor: branch.color,
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        ŞUBE {idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStoreBranch(branch.id, branch.isActive)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: branch.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: branch.isActive ? '#34D399' : '#F87171',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {branch.isActive ? '● Aktif' : '○ Pasif'}
                        </button>
                        {branches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStoreBranch(branch.id, branch.name)}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '6px',
                              color: '#F87171',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            title="Dükkanı Sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px' }}>
                      {branch.name}
                    </div>

                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      📍 {branch.address}
                    </div>

                    <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '6px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                      🎯 {branch.description} • Koordinat: {branch.latitude}° K, {branch.longitude}° D
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#FFD10D', fontWeight: 700 }}>
                      📞 {branch.phone}
                    </span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#93C5FD',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Haritada Aç</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canlı OpenStreetMap Radar ve Elle Bölge Çizim Görünümü */}
        <div id="admin-delivery-map-anchor" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#A78BFA" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#F1F5F9' }}>
                🗺️ OpenStreetMap Haritası &amp; Canlı Bölge Poligonları
              </h3>
            </div>

            {/* Map Action Buttons: Elle Çiz & Dükkan Ekle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setRedrawingZone(null);
                  setMapMode(mapMode === 'polygon' ? 'none' : 'polygon');
                }}
                style={{
                  backgroundColor: mapMode === 'polygon' ? '#8B5CF6' : 'rgba(139, 92, 246, 0.25)',
                  color: '#FFFFFF',
                  border: '1.5px solid #8B5CF6',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: mapMode === 'polygon' ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                }}
              >
                <PenTool size={14} />
                <span>{mapMode === 'polygon' ? '✕ Çizim Modundan Çık' : '✏️ Haritada Elle Bölge Çiz'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMapMode(mapMode === 'store_pin' ? 'none' : 'store_pin');
                }}
                style={{
                  backgroundColor: mapMode === 'store_pin' ? '#FFD10D' : 'rgba(255, 209, 13, 0.2)',
                  color: mapMode === 'store_pin' ? '#191919' : '#FFD10D',
                  border: '1.5px solid #FFD10D',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: mapMode === 'store_pin' ? '0 0 12px rgba(255, 209, 13, 0.5)' : 'none',
                }}
              >
                <Store size={14} />
                <span>{mapMode === 'store_pin' ? '✕ İptal' : '🏪 Dükkan Konumu Seç'}</span>
              </button>
            </div>
          </div>

          {/* Bölge Çizim Rehberi (Çakışmalar & Boş Alanlar) */}
          <div
            style={{
              backgroundColor: 'rgba(30, 27, 75, 0.65)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '14px',
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#CBD5E1',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontWeight: 800, color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎯</span>
                <span>Bölgeler Çakışırsa (İç İçe Geçerse):</span>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                İki poligon üst üste bindiğinde (örn. 100. Yıl içine çizilen KYK Yurtları Kampüsü), sistem <strong>daha küçük ve özel olan bölgeyi</strong> otomatik olarak önceliklendirir.
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 800, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span>
                <span>Boş Kalan Çizilmemiş Alanlar:</span>
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                Her sokağı tek tek çizmek zorunda değilsiniz! Poligon dışındaki boşluklara tıklayan müşteriler için dükkandan olan km mesafesine göre sistem <strong>otomatik mesafe halkası tarifesi</strong> uygular.
              </span>
            </div>
          </div>

          {/* Interactive DeliveryMap (Polygons, no messy concentric overlapping circles) */}
          <DeliveryMap
            interactive={true}
            isAdminView={true}
            height="420px"
            drawingMode={mapMode}
            drawingZoneTitle={redrawingZone ? `"${redrawingZone.name}" Bölgesinin Sınırlarını Yeniden Çiziyorsunuz` : undefined}
            onPolygonDrawn={handlePolygonDrawn}
            onStorePointPicked={handleStorePointPicked}
            onCancelDrawing={() => {
              setMapMode('none');
              setRedrawingZone(null);
            }}
            customBranches={branches}
            customZones={zones}
            showDorms={true}
          />
        </div>

        {/* MODAL: Çizilen Bölgeyi Kaydetme Formu */}
        {isPolyModalOpen && drawnCoords && (
          <div
            style={{
              backgroundColor: '#1E1B4B',
              border: '2px solid #8B5CF6',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenTool size={20} color="#A78BFA" />
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  🎨 Haritada Çizdiğiniz Bölgeyi Adlandırın ({drawnCoords.length} Köşeli Alan)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPolyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDrawnPolygonZone} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Bölge Adı</label>
                <input
                  type="text"
                  placeholder="Örn: 5000 Evler & Soğuksu"
                  value={polyName}
                  onChange={(e) => setPolyName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Min. Sepet Tutarı (TL)</label>
                <input
                  type="number"
                  value={polyMinOrder}
                  onChange={(e) => setPolyMinOrder(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Getirme Ücreti (TL)</label>
                <input
                  type="number"
                  value={polyFee}
                  onChange={(e) => setPolyFee(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Ücretsiz Teslimat Eşiği (TL)</label>
                <input
                  type="number"
                  value={polyFreeThreshold}
                  onChange={(e) => setPolyFreeThreshold(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tahmini Süre (dk)</label>
                <input
                  type="number"
                  value={polyMinutes}
                  onChange={(e) => setPolyMinutes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Harita Rengi</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '38px' }}>
                  {['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPolyColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: polyColor === c ? '3px solid #FFFFFF' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsPolyModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: 'transparent', color: '#CBD5E1', cursor: 'pointer', fontWeight: 700 }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#8B5CF6', color: '#FFFFFF', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>✓ Bu Çizilen Bölgeyi Sisteme Ekle</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: Yeni Dükkan / Şube Kaydetme Formu */}
        {isStoreModalOpen && placedStoreCoords && (
          <div
            style={{
              backgroundColor: '#1C1917',
              border: '2px solid #FFD10D',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} color="#FFD10D" />
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  ✓ Yeni Dükkan / Şube Konumu Belirlendi ({placedStoreCoords.lat.toFixed(4)}, {placedStoreCoords.lng.toFixed(4)})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStore} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Dükkan / Şube Tam Adı</label>
                <input
                  type="text"
                  placeholder="Örn: 3. Şube: 5000 Evler Çarşı"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kısa İsim (Harita Rozeti)</label>
                <input
                  type="text"
                  placeholder="Örn: 3. Şube (5000 Evler)"
                  value={storeShortName}
                  onChange={(e) => setStoreShortName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Açık Adres</label>
                <input
                  type="text"
                  placeholder="Örn: 5000 Evler 75. Yıl Cad. No:14"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Telefon Numarası</label>
                <input
                  type="text"
                  placeholder="0542 000 0000"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kapsama / Odak Notu</label>
                <input
                  type="text"
                  placeholder="Örn: 5000 Evler, Soğuksu ve Sanayi bölgesi"
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Dükkan İkon Rengi</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '38px' }}>
                  {['#5D3EBC', '#059669', '#DC2626', '#D97706', '#2563EB'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStoreColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: storeColor === c ? '3px solid #FFFFFF' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #4B5563', backgroundColor: 'transparent', color: '#CBD5E1', cursor: 'pointer', fontWeight: 700 }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#FFD10D', color: '#191919', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>✓ Dükkanı Sisteme Kaydet &amp; Haritaya Ekle</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visual Hexagonal Rings Layout */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#F1F5F9' }}>
                ⚡ Hızlı Fiyat &amp; Teslimat Modları (Tüm Çizili Bölgelere Toplu Uygula)
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                Tüm teslimat bölgelerinizin minimum sepet ve getirme ücretlerini tek tıkla standart, öğrenci dostu veya kötü hava moduna uyarlayın.
              </p>
            </div>

            {/* Quick Tariff Mode Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => applyPreset('standard')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Tüm bölgeleri standart fiyatlara al"
              >
                <Zap size={12} color="#FBBF24" />
                <span>Standart</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('student')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(139, 92, 246, 0.25)',
                  color: '#C4B5FD',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="KYK yurtlarına 40 TL alt limit ve 5 TL sembolik kurye uygula"
              >
                <span>🎓 Öğrenci Dostu</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('rain')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  color: '#93C5FD',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Kötü havada kurye güvenliği: +10 TL ve +10 dk teslimat süresi"
              >
                <CloudRain size={12} color="#60A5FA" />
                <span>Yağmur/Fırtına</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('night')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Gece sipariş yığılmasını dengelemek için +15 TL min sepet"
              >
                <Moon size={12} color="#F87171" />
                <span>Gece Yoğun Saat</span>
              </button>
            </div>
          </div>

          {/* Active Drawn Zones Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '12px',
            }}
          >
            {zones.map((z) => {
              const color = z.hexColor || '#8B5CF6';
              return (
                <div
                  key={z.id}
                  style={{
                    backgroundColor: `${color}15`,
                    border: `1px solid ${color}40`,
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          color: color,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {z.polygonCoords ? (
                          <>
                            <PenTool size={10} />
                            <span>Haritada Çizili ({z.polygonCoords.length} Köşe)</span>
                          </>
                        ) : (
                          <span>Kapsama Bölgesi</span>
                        )}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        ~{z.estimatedMinutes} dk
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                      {z.name}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ color: '#94A3B8' }}>Min. Sepet:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFD10D' }}>
                        ₺{z.minOrderAmount}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8' }}>Getirme:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8' }}>
                        ₺{z.deliveryFee}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8' }}>Ücretsiz:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ADE80' }}>
                        ₺{z.freeDeliveryThreshold}+
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. DELIVERY ZONES LIST & MANAGEMENT */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#5D3EBC" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
              Teslimat Bölgeleri ({zones.length})
            </h3>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Her bölge için minimum sipariş tutarı, getirme ücreti, ücretsiz eşik ve tahmini varış süresini düzenleyin.
        </p>

        {/* Draw New Zone Banner & Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F5F3FF',
            border: '2px dashed #8B5CF6',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PenTool size={20} color="#6D28D9" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#4C1D95' }}>
                ✏️ Haritada Çizerek Yeni Bölge Ekle
              </h4>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6D28D9' }}>
              Artık koordinat veya mesafe yazmanıza gerek yok! Yukarıdaki haritada bölgenizin sınırlarına tıklayarak doğrudan çizebilirsiniz.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRedrawingZone(null);
              setMapMode('polygon');
              const el = document.getElementById('admin-delivery-map-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{
              backgroundColor: '#6D28D9',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(109, 40, 217, 0.25)',
            }}
          >
            <PenTool size={15} />
            <span>Haritada Çizmeye Başla</span>
          </button>
        </div>

        {/* Zones List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {zones.map((z) => {
            const isEditing = editingZoneId === z.id;
            const ring = z.hexRing || 1;
            const ringColor = z.hexColor || (ring === 1 ? '#10B981' : ring === 2 ? '#8B5CF6' : ring === 3 ? '#F59E0B' : '#EF4444');
            const zoneMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${z.name}, Karabük`)}`;

            return (
              <div
                key={z.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isEditing ? '2px solid #5D3EBC' : '1px solid #EBEBF2',
                  backgroundColor: z.isActive ? '#FFFFFF' : '#F9FAFB',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {z.polygonCoords && z.polygonCoords.length >= 3 ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${ringColor}20`,
                          color: ringColor,
                          border: `1px solid ${ringColor}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <PenTool size={11} />
                        <span>Haritada Çizili Poligon ({z.polygonCoords.length} Köşe)</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${ringColor}15`,
                          color: ringColor,
                          border: `1px solid ${ringColor}40`,
                        }}
                      >
                        ⬡ Halka {ring} ({z.radiusKm || (ring * 1.5)} km)
                      </span>
                    )}
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#191919' }}>{z.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <a
                      href={zoneMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Bölgeyi Google Maps'te Gör"
                    >
                      <Navigation size={12} />
                      <span>Haritada Gör</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setRedrawingZone(z);
                        setMapMode('polygon');
                        const el = document.getElementById('admin-delivery-map-anchor');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#EDE9FE',
                        color: '#6D28D9',
                        border: '1px solid #DDD6FE',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Bu bölgenin sınırlarını harita üzerinde yeniden çiz"
                    >
                      <PenTool size={12} />
                      <span>Haritada Yeniden Çiz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => (isEditing ? saveEditZone(z.id) : startEditZone(z))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isEditing ? '#5D3EBC' : '#F1F5F9',
                        color: isEditing ? '#FFFFFF' : '#475569',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                      <span>{isEditing ? 'Kaydet' : 'Düzenle'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateZone(z.id, { isActive: !z.isActive })}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: z.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: z.isActive ? '#15803D' : '#B91C1C',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {z.isActive ? 'Aktif' : 'Pasif'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${z.name}" bölgesini silmek istiyor musunuz?`)) {
                          onDeleteZone(z.id);
                        }
                      }}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        color: '#B91C1C',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECDD3',
                        cursor: 'pointer',
                      }}
                      title="Bölgeyi Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Values Display or Inline Edit Form */}
                {isEditing ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                      gap: '8px',
                      backgroundColor: '#F8FAFC',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Min. Tutar (TL):</label>
                      <input
                        type="number"
                        value={editMinOrder}
                        onChange={(e) => setEditMinOrder(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Getirme Ücreti (TL):</label>
                      <input
                        type="number"
                        value={editFee}
                        onChange={(e) => setEditFee(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Ücretsiz Eşik (TL):</label>
                      <input
                        type="number"
                        value={editFreeThreshold}
                        onChange={(e) => setEditFreeThreshold(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Tahmini Süre (dk):</label>
                      <input
                        type="number"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <span>
                      Min. Sipariş: <strong style={{ color: '#191919' }}>₺{z.minOrderAmount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Getirme: <strong style={{ color: '#191919' }}>₺{z.deliveryFee}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Ücretsiz Eşik: <strong style={{ color: '#10B981' }}>₺{z.freeDeliveryThreshold}+</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Varış: <strong style={{ color: '#5D3EBC' }}>~{z.estimatedMinutes} dk</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. KARABÜK KYK YURTLARI LIST & NAVIGATION */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Building2 size={20} color="#10B981" />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
            Karabük KYK Yurtları ({dorms.length})
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Öğrencilerin sipariş verirken seçtiği yurtlar, bloklar ve kuryelerin tek tıkla yönlendirildiği Google Maps navigasyon kayıtları.
        </p>

        {/* Add Dorm Form */}
        <form
          onSubmit={handleAddDormSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: '10px',
            marginBottom: '18px',
            backgroundColor: '#F8FAFC',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <input
            type="text"
            placeholder="Yurt Adı (Örn: Hubbi Hatun KYK)"
            value={dormName}
            onChange={(e) => setDormName(e.target.value)}
            required
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <input
            type="text"
            placeholder="Semt (Örn: Kampüs)"
            value={dormDistrict}
            onChange={(e) => setDormDistrict(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <select
            value={dormGender}
            onChange={(e) => setDormGender(e.target.value as 'kiz' | 'erkek' | 'karma')}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
          >
            <option value="kiz">Kız Yurdu</option>
            <option value="erkek">Erkek Yurdu</option>
            <option value="karma">Karma Yurt</option>
          </select>
          <input
            type="text"
            placeholder="Bloklar (Örn: A Blok, B Blok)"
            value={dormBlocks}
            onChange={(e) => setDormBlocks(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <input
            type="number"
            step="0.1"
            placeholder="Mesafe (km)"
            value={dormDistanceKm}
            onChange={(e) => setDormDistanceKm(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <select
            value={dormZoneId}
            onChange={(e) => setDormZoneId(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
          >
            <option value="">Teslimat Bölgesi Seç</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
            }}
          >
            <Plus size={15} />
            <span>Yurt Ekle</span>
          </button>
        </form>

        {/* Dorms Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
          {dorms.map((d) => {
            const dormMapsNavUrl = getGoogleMapsDormUrl(d);
            const parentZone = zones.find((z) => z.id === d.zoneId);

            return (
              <div
                key={d.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #EBEBF2',
                  backgroundColor: d.isActive ? '#FFFFFF' : '#F9FAFB',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#191919' }}>{d.name}</div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: d.gender === 'kiz' ? '#FCE7F3' : d.gender === 'erkek' ? '#DBEAFE' : '#EDE9FE',
                        color: d.gender === 'kiz' ? '#9D174D' : d.gender === 'erkek' ? '#1E40AF' : '#5B21B6',
                        flexShrink: 0,
                      }}
                    >
                      {d.gender === 'kiz' ? 'Kız' : d.gender === 'erkek' ? 'Erkek' : 'Karma'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#047857',
                        backgroundColor: '#ECFDF5',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      ⬡ {d.distanceKm || '2.4'} km mesafede
                    </span>

                    {parentZone && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#4B5563',
                          backgroundColor: '#F3F4F6',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {parentZone.name.split('(')[0].trim()}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                    {d.district} • Bloklar: {d.blocks.join(', ')}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px dashed #F1F5F9',
                    paddingTop: '8px',
                    gap: '6px',
                  }}
                >
                  <a
                    href={dormMapsNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#047857',
                      backgroundColor: '#D1FAE5',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      border: '1px solid #A7F3D0',
                    }}
                    title="Google Maps Yol Tarifi Başlat"
                  >
                    <Navigation size={12} />
                    <span>Yol Tarifi</span>
                  </a>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onUpdateDorm(d.id, { isActive: !d.isActive })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: d.isActive ? '#DCFCE7' : '#FEE2E2',
                        color: d.isActive ? '#15803D' : '#B91C1C',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {d.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${d.name}" yurdunu silmek istiyor musunuz?`)) {
                          onDeleteDorm(d.id);
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: '#B91C1C',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECDD3',
                        cursor: 'pointer',
                      }}
                      title="Yurdu Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
