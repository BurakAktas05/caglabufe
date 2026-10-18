'use client';

import React, { useState } from 'react';
import { DeliveryZone, DormitoryConfig } from '@/types';
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
} from 'lucide-react';
import {
  getSystemSettings,
  getGoogleMapsDormUrl,
  getGoogleMapsStoreUrl,
} from '@/lib/settingsManager';

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

  // Zone Form State
  const [zoneName, setZoneName] = useState('');
  const [zoneMinOrder, setZoneMinOrder] = useState('50');
  const [zoneFee, setZoneFee] = useState('10');
  const [zoneFreeThreshold, setZoneFreeThreshold] = useState('120');
  const [zoneMinutes, setZoneMinutes] = useState('15');
  const [zoneRing, setZoneRing] = useState<1 | 2 | 3 | 4>(1);

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

  const handleAddZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    const ringColors: Record<1 | 2 | 3 | 4, string> = {
      1: '#10B981',
      2: '#8B5CF6',
      3: '#F59E0B',
      4: '#EF4444',
    };
    const ringDistances: Record<1 | 2 | 3 | 4, number> = {
      1: 1.2,
      2: 2.8,
      3: 4.8,
      4: 7.2,
    };

    onAddZone({
      name: zoneName.trim(),
      minOrderAmount: Number(zoneMinOrder) || 50,
      deliveryFee: Number(zoneFee) || 10,
      freeDeliveryThreshold: Number(zoneFreeThreshold) || 120,
      estimatedMinutes: Number(zoneMinutes) || 15,
      isActive: true,
      hexRing: zoneRing,
      radiusKm: ringDistances[zoneRing],
      hexColor: ringColors[zoneRing],
    });
    setZoneName('');
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
        {/* Store Location Anchor */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 209, 13, 0.15)',
                border: '1px solid #FFD10D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFD10D',
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                  {settings.storeName || 'Çağla Büfe & Market'}
                </h2>
                <span
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Merkez Üs
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#CBD5E1' }}>
                📍 {settings.storeAddress || '100. Yıl Mah. 1003. Cad. No:12 Karabük'} • Koordinat: 41.2065° K, 32.6285° D
              </p>
            </div>
          </div>

          <a
            href={storeMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFD10D',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={15} />
            <span>Dükkan Konumunu Maps&apos;te Aç</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Visual Hexagonal Rings Layout */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#F1F5F9' }}>
                ⬡ Dükkan Merkezli Altıgen / Mesafe Halkaları & Dinamik Tarifeler
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                Dükkanınızdan uzaklaştıkça kurye mesafesine göre sipariş alt limiti ve getirme ücreti otomatik kademelendirilir.
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
                title="Tüm halkaları standart fiyata sıfırla"
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

          {/* 4 Rings Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '12px',
            }}
          >
            {[
              {
                ring: 1 as const,
                title: 'Halka 1: Çekirdek Bölge',
                range: '0 - 1.5 km',
                coverage: '100. Yıl Mah., Kampüs Kapısı, Özel Akademi',
                color: '#10B981',
                bg: 'rgba(16, 185, 129, 0.1)',
                border: 'rgba(16, 185, 129, 0.3)',
              },
              {
                ring: 2 as const,
                title: 'Halka 2: KYK Yurtları',
                range: '1.5 - 3.5 km',
                coverage: 'Hubbi Hatun KYK, Edebali KYK, Demir Çelik',
                color: '#8B5CF6',
                bg: 'rgba(139, 92, 246, 0.1)',
                border: 'rgba(139, 92, 246, 0.3)',
              },
              {
                ring: 3 as const,
                title: 'Halka 3: Çevre Mahalleler',
                range: '3.5 - 5.5 km',
                coverage: 'Şirinevler, 5000 Evler, Soğuksu',
                color: '#F59E0B',
                bg: 'rgba(245, 158, 11, 0.1)',
                border: 'rgba(245, 158, 11, 0.3)',
              },
              {
                ring: 4 as const,
                title: 'Halka 4: Genişletilmiş / Özel',
                range: '5.5 - 8+ km',
                coverage: 'Safranbolu, Karabük Merkez',
                color: '#EF4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                border: 'rgba(239, 68, 68, 0.3)',
              },
            ].map((layer) => {
              const matchedZone = zones.find((z) => (z.hexRing || 1) === layer.ring) || zones[layer.ring - 1];

              return (
                <div
                  key={layer.ring}
                  style={{
                    backgroundColor: layer.bg,
                    border: `1px solid ${layer.border}`,
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
                          color: layer.color,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>⬡ Halka {layer.ring}</span>
                        <span>•</span>
                        <span>{layer.range}</span>
                      </span>
                      {matchedZone && (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                          ~{matchedZone.estimatedMinutes} dk
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                      {layer.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', lineHeight: 1.3 }}>
                      {layer.coverage}
                    </div>
                  </div>

                  {matchedZone && (
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
                        <div style={{ color: '#94A3B8' }}>Min. Sipariş:</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFD10D' }}>
                          ₺{matchedZone.minOrderAmount}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#94A3B8' }}>Getirme Ücreti:</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#38BDF8' }}>
                          ₺{matchedZone.deliveryFee}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#94A3B8' }}>Ücretsiz:</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ADE80' }}>
                          ₺{matchedZone.freeDeliveryThreshold}+
                        </div>
                      </div>
                    </div>
                  )}
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

        {/* Add Zone Form */}
        <form
          onSubmit={handleAddZoneSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
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
            placeholder="Bölge Adı (Örn: 100. Yıl)"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            required
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <select
            value={zoneRing}
            onChange={(e) => setZoneRing(Number(e.target.value) as 1 | 2 | 3 | 4)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
          >
            <option value="1">⬡ Halka 1 (0-1.5 km)</option>
            <option value="2">⬡ Halka 2 (1.5-3.5 km)</option>
            <option value="3">⬡ Halka 3 (3.5-5.5 km)</option>
            <option value="4">⬡ Halka 4 (5.5+ km)</option>
          </select>
          <input
            type="number"
            placeholder="Min. Tutar (TL)"
            value={zoneMinOrder}
            onChange={(e) => setZoneMinOrder(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <input
            type="number"
            placeholder="Getirme Ücreti (TL)"
            value={zoneFee}
            onChange={(e) => setZoneFee(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <input
            type="number"
            placeholder="Ücretsiz Eşik (TL)"
            value={zoneFreeThreshold}
            onChange={(e) => setZoneFreeThreshold(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <input
            type="number"
            placeholder="Tahmini Süre (dk)"
            value={zoneMinutes}
            onChange={(e) => setZoneMinutes(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#5D3EBC',
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
            <span>Bölge Ekle</span>
          </button>
        </form>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
