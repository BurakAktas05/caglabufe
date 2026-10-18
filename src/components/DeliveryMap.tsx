'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type * as LeafletType from 'leaflet';
import { StoreBranch, DeliveryZone, DormitoryConfig } from '@/types';
import {
  getStoreBranches,
  getDeliveryZones,
  getDormitories,
  getClosestBranchAndZone,
} from '@/lib/settingsManager';
import {
  Store,
  Check,
  Crosshair,
  Undo2,
  X,
  PenTool,
} from 'lucide-react';

export interface SelectedLocationData {
  latitude: number;
  longitude: number;
  branch: StoreBranch;
  zone: DeliveryZone;
  distanceKm: number;
  estimatedMinutes: number;
  minOrderAmount: number;
  label?: string;
}

interface DeliveryMapProps {
  interactive?: boolean; // Customer mode: click to drop pin
  initialLat?: number;
  initialLng?: number;
  height?: string | number;
  onLocationSelect?: (data: SelectedLocationData) => void;
  selectedLocation?: { latitude: number; longitude: number } | null;
  showDorms?: boolean;
  isAdminView?: boolean;
  // Admin Drawing & Store Placement
  drawingMode?: 'none' | 'polygon' | 'store_pin';
  drawingZoneTitle?: string;
  onPolygonDrawn?: (coords: [number, number][]) => void;
  onStorePointPicked?: (coords: { lat: number; lng: number }) => void;
  onCancelDrawing?: () => void;
  customBranches?: StoreBranch[];
  customZones?: DeliveryZone[];
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  interactive = true,
  initialLat = 41.2120,
  initialLng = 32.6390,
  height = '380px',
  onLocationSelect,
  selectedLocation: externalSelectedLoc,
  showDorms = true,
  isAdminView = false,
  drawingMode = 'none',
  drawingZoneTitle,
  onPolygonDrawn,
  onStorePointPicked,
  onCancelDrawing,
  customBranches,
  customZones,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const customerMarkerRef = useRef<LeafletType.Marker | null>(null);
  const leafletModuleRef = useRef<typeof LeafletType | null>(null);

  // Drawing refs & layer groups
  const drawingLayerGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const polygonLayersGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const storeMarkersGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const dormMarkersGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const guideLineRef = useRef<LeafletType.Polyline | null>(null);

  const [activeDrawnPoints, setActiveDrawnPoints] = useState<[number, number][]>([]);
  const [activeSelection, setActiveSelection] = useState<SelectedLocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeFocusBranchId, setActiveFocusBranchId] = useState<string | null>(null);

  // Active dataset
  const activeBranches = customBranches || getStoreBranches().filter((b) => b.isActive);
  const activeZones = customZones || getDeliveryZones().filter((z) => z.isActive);
  const activeDorms = getDormitories().filter((d) => d.isActive);

  // Location selection handler
  const handlePointPicked = useCallback(
    (lat: number, lng: number, label?: string) => {
      const match = getClosestBranchAndZone(lat, lng);
      const data: SelectedLocationData = {
        latitude: lat,
        longitude: lng,
        branch: match.branch,
        zone: match.zone,
        distanceKm: match.distanceKm,
        estimatedMinutes: match.zone.estimatedMinutes || 15,
        minOrderAmount: match.zone.minOrderAmount || 50,
        label,
      };
      setActiveSelection(data);
      if (onLocationSelect) {
        onLocationSelect(data);
      }

      // Update customer marker
      const L = leafletModuleRef.current;
      const map = mapRef.current;
      if (L && map) {
        if (!customerMarkerRef.current) {
          const customerIcon = L.divIcon({
            className: 'custom-customer-pin-wrap',
            html: `
              <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(93, 62, 188, 0.3); animation: map-pulse 1.8s infinite;"></div>
                <div style="width: 30px; height: 30px; border-radius: 50%; background: #5D3EBC; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 15px;">
                  📍
                </div>
              </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });
          customerMarkerRef.current = L.marker([lat, lng], { icon: customerIcon }).addTo(map);
        } else {
          customerMarkerRef.current.setLatLng([lat, lng]);
        }
      }
    },
    [onLocationSelect]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isCancelled = false;

    import('leaflet').then((L) => {
      if (isCancelled || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      // Fix default Leaflet icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13.5,
        zoomControl: true,
        attributionControl: false,
      });
      mapRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<span style="font-size: 9px; color: #64748B;">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></span>',
        })
        .addTo(map);

      // Layer groups
      polygonLayersGroupRef.current = L.layerGroup().addTo(map);
      storeMarkersGroupRef.current = L.layerGroup().addTo(map);
      dormMarkersGroupRef.current = L.layerGroup().addTo(map);
      drawingLayerGroupRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialLat, initialLng]);

  // Render Polygons & Layers whenever activeZones or activeBranches change
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // 1. RENDER CLEAN POLYGONS (Only for Admin visualization & management; customers see a pure clean map)
    if (polygonLayersGroupRef.current) {
      polygonLayersGroupRef.current.clearLayers();

      if (isAdminView) {
        activeZones.forEach((zone) => {
          const color = zone.hexColor || '#5D3EBC';

          if (zone.polygonCoords && zone.polygonCoords.length >= 3) {
            const poly = L.polygon(zone.polygonCoords, {
              color: color,
              weight: 2,
              opacity: 0.85,
              fillColor: color,
              fillOpacity: 0.14,
            }).addTo(polygonLayersGroupRef.current!);

            poly.bindTooltip(
              `<div style="font-weight: 800; font-size: 11px; padding: 2px;">
                <span style="color: ${color};">●</span> ${zone.name}<br/>
                <span style="color: #059669; font-weight: 900;">Min. Sepet: ${zone.minOrderAmount} ₺</span>
              </div>`,
              { sticky: true, direction: 'center' }
            );

            if (interactive && drawingMode === 'none') {
              poly.on('click', (e) => {
                handlePointPicked(e.latlng.lat, e.latlng.lng, zone.name);
              });
            }
          }
        });
      }
    }

    // 2. RENDER STORE BRANCHES
    if (storeMarkersGroupRef.current) {
      storeMarkersGroupRef.current.clearLayers();

      activeBranches.forEach((branch, idx) => {
        const pinColor = branch.color || (idx === 0 ? '#5D3EBC' : '#059669');
        const storeIcon = L.divIcon({
          className: 'custom-store-pin',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
              <div class="pulse-ring" style="background: ${pinColor}; opacity: 0.35;"></div>
              <div class="custom-store-pin-inner" style="width: 36px; height: 36px; background: ${pinColor}; color: #FFFFFF; font-size: 16px; border: 2.5px solid #FFFFFF;">
                🏪
              </div>
              <div style="position: absolute; bottom: -8px; background: #0F172A; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
                ${branch.shortName}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker([branch.latitude, branch.longitude], { icon: storeIcon }).addTo(
          storeMarkersGroupRef.current!
        );

        marker.bindPopup(`
          <div style="padding: 10px; min-width: 190px; font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: ${pinColor}; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">ŞUBE</span>
              <strong style="font-size: 13px; color: #1E293B;">${branch.name}</strong>
            </div>
            <p style="font-size: 11px; color: #64748B; margin: 3px 0 6px;">${branch.address}</p>
            <div style="font-size: 11px; color: #4B5563; background: #F8FAFC; padding: 5px 7px; border-radius: 6px; border: 1px solid #E2E8F0;">
              📞 Tel: ${branch.phone}<br/>
              🎯 Kapsama: ${branch.description}
            </div>
          </div>
        `);
      });
    }

    // 3. RENDER DORMITORIES
    if (dormMarkersGroupRef.current && showDorms) {
      dormMarkersGroupRef.current.clearLayers();

      activeDorms
        .filter((d) => d.latitude && d.longitude)
        .forEach((dorm) => {
          const isKiz = dorm.gender === 'kiz';
          const dormBg = isKiz ? '#9D174D' : '#1E40AF';

          const dormIcon = L.divIcon({
            className: 'custom-dorm-pin',
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background: ${dormBg}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #FFFFFF; font-size: 12px;">
                  🎓
                </div>
                <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: #FFFFFF; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; margin-top: 2px; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  ${dorm.name.replace('KYK ', '')}
                </div>
              </div>
            `,
            iconSize: [26, 40],
            iconAnchor: [13, 20],
          });

          const dormMarker = L.marker([dorm.latitude!, dorm.longitude!], { icon: dormIcon }).addTo(
            dormMarkersGroupRef.current!
          );

          dormMarker.on('click', () => {
            if (interactive && drawingMode === 'none') {
              handlePointPicked(dorm.latitude!, dorm.longitude!, dorm.name);
            }
          });

          dormMarker.bindTooltip(
            `<div style="font-size: 11px; font-weight: 700;">
              ${dorm.name}<br/>
              <span style="color: #64748B;">📍 ${dorm.district}</span>
            </div>`,
            { direction: 'top' }
          );
        });
    }

    if (externalSelectedLoc?.latitude && externalSelectedLoc?.longitude) {
      handlePointPicked(externalSelectedLoc.latitude, externalSelectedLoc.longitude);
    }
  }, [activeZones, activeBranches, activeDorms, showDorms, interactive, drawingMode, handlePointPicked, externalSelectedLoc]);

  // Click & MouseMove Handler on Map (Interactive Mode vs Drawing Mode vs Store Pin Mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMapClick = (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (drawingMode === 'polygon') {
        // Add vertex to active polygon
        setActiveDrawnPoints((prev) => [...prev, [lat, lng]]);
      } else if (drawingMode === 'store_pin') {
        // Report store point
        if (onStorePointPicked) {
          onStorePointPicked({ lat, lng });
        }
      } else if (interactive) {
        // Standard customer point pick
        handlePointPicked(lat, lng);
      }
    };

    // Live guide line following mouse cursor during polygon drawing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
      if (drawingMode !== 'polygon') return;
      if (activeDrawnPoints.length === 0) return;
      const L = leafletModuleRef.current;
      const group = drawingLayerGroupRef.current;
      if (!L || !group) return;

      const lastPoint = activeDrawnPoints[activeDrawnPoints.length - 1];
      const cur: [number, number] = [e.latlng.lat, e.latlng.lng];

      if (!guideLineRef.current) {
        guideLineRef.current = L.polyline([lastPoint, cur], {
          color: '#8B5CF6',
          dashArray: '5, 5',
          weight: 2,
          opacity: 0.85,
        }).addTo(group);
      } else {
        guideLineRef.current.setLatLngs([lastPoint, cur]);
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      if (guideLineRef.current) {
        guideLineRef.current.remove();
        guideLineRef.current = null;
      }
    };
  }, [drawingMode, interactive, handlePointPicked, onStorePointPicked, activeDrawnPoints]);

  // Update Drawing Layer (temporary polygon / points as user clicks)
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapRef.current;
    const group = drawingLayerGroupRef.current;
    if (!L || !map || !group) return;

    group.clearLayers();
    if (guideLineRef.current) {
      guideLineRef.current = null;
    }

    if (drawingMode === 'polygon' && activeDrawnPoints.length > 0) {
      // Draw points
      activeDrawnPoints.forEach(([lat, lng], idx) => {
        const isStartPoint = idx === 0;
        const canClose = isStartPoint && activeDrawnPoints.length >= 3;

        const pointMarker = L.circleMarker([lat, lng], {
          radius: canClose ? 9 : 6,
          color: canClose ? '#10B981' : '#5D3EBC',
          fillColor: canClose ? '#10B981' : '#FFD10D',
          fillOpacity: 1,
          weight: canClose ? 3 : 2,
        }).addTo(group);

        if (canClose) {
          pointMarker.bindTooltip('Bölgeyi Kapat ve Bitir ✓', {
            permanent: false,
            direction: 'top',
          });
          pointMarker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (activeDrawnPoints.length >= 3 && onPolygonDrawn) {
              onPolygonDrawn(activeDrawnPoints);
              setActiveDrawnPoints([]);
            }
          });
        } else {
          pointMarker.bindTooltip(String(idx + 1), {
            permanent: true,
            direction: 'top',
            className: 'point-number-tooltip',
          });
        }
      });

      // Draw lines / polygon
      if (activeDrawnPoints.length >= 2) {
        if (activeDrawnPoints.length >= 3) {
          L.polygon(activeDrawnPoints, {
            color: '#8B5CF6',
            dashArray: '4, 4',
            weight: 2.5,
            fillColor: '#8B5CF6',
            fillOpacity: 0.22,
          }).addTo(group);
        } else {
          L.polyline(activeDrawnPoints, {
            color: '#8B5CF6',
            dashArray: '4, 4',
            weight: 2.5,
          }).addTo(group);
        }
      }
    }
  }, [activeDrawnPoints, drawingMode, onPolygonDrawn]);

  // Focus on a specific branch
  const focusOnBranch = (branch: StoreBranch) => {
    if (!mapRef.current) return;
    setActiveFocusBranchId(branch.id);
    mapRef.current.flyTo([branch.latitude, branch.longitude], 15, { duration: 1.0 });
  };

  // Find My Current GPS Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15.5, { duration: 1.0 });
        }
        handlePointPicked(latitude, longitude, 'Harita Noktası');
      },
      (err) => {
        setIsLocating(false);
        alert('Konum alınamadı. Lütfen tarayıcı konum iznini kontrol ediniz veya haritada dokununuz.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Drawing Controls Handlers
  const handleUndoPoint = () => {
    setActiveDrawnPoints((prev) => prev.slice(0, -1));
  };

  const handleFinishPolygon = () => {
    if (activeDrawnPoints.length < 3) {
      alert('Bölge oluşturabilmek için haritada en az 3 nokta belirlemeniz gerekmektedir.');
      return;
    }
    if (onPolygonDrawn) {
      onPolygonDrawn(activeDrawnPoints);
    }
    setActiveDrawnPoints([]);
  };

  const handleCancel = () => {
    setActiveDrawnPoints([]);
    if (onCancelDrawing) onCancelDrawing();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        cursor: drawingMode !== 'none' ? 'crosshair' : 'default',
      }}
    >
      {/* 1. DRAWING MODE FLOATING BANNER */}
      {drawingMode === 'polygon' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1001,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            border: '1.5px solid #8B5CF6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={18} color="#A78BFA" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#FFFFFF' }}>
                {drawingZoneTitle ? `✏️ ${drawingZoneTitle}` : '✏️ Haritada Elle Bölge Çiziyorsunuz'}
              </div>
              <div style={{ fontSize: '10px', color: '#CBD5E1' }}>
                Haritada köşe noktalarına sırayla tıklayın ({activeDrawnPoints.length} nokta). {activeDrawnPoints.length >= 3 ? 'Kapatmak için 1. noktaya veya yeşil butona basınız.' : 'En az 3 köşe gereklidir.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeDrawnPoints.length > 0 && (
              <button
                type="button"
                onClick={handleUndoPoint}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Undo2 size={12} />
                <span>Geri Al</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFinishPolygon}
              disabled={activeDrawnPoints.length < 3}
              style={{
                backgroundColor: activeDrawnPoints.length >= 3 ? '#10B981' : '#475569',
                color: '#FFFFFF',
                border: activeDrawnPoints.length >= 3 ? '1.5px solid #A7F3D0' : 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: activeDrawnPoints.length >= 3 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeDrawnPoints.length >= 3 ? '0 0 14px rgba(16, 185, 129, 0.7)' : 'none',
                transform: activeDrawnPoints.length >= 3 ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Check size={13} />
              <span>✓ Bölgeyi Tamamla ({activeDrawnPoints.length}/3+)</span>
            </button>

            <button
              type="button"
              onClick={handleCancel}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={12} />
              <span>İptal</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. STORE PIN PLACEMENT MODE BANNER */}
      {drawingMode === 'store_pin' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1001,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            border: '1.5px solid #FFD10D',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} color="#FFD10D" />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>
              🏪 <strong>Dükkan Konumu Belirleme:</strong> Yeni dükkanın bulunacağı noktaya haritada tıklayınız.
            </span>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      )}

      {/* 3. NORMAL TOP MAP CONTROLS */}
      {drawingMode === 'none' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', pointerEvents: 'auto' }}>
            {activeBranches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => focusOnBranch(b)}
                style={{
                  backgroundColor: activeFocusBranchId === b.id ? b.color : 'rgba(255, 255, 255, 0.96)',
                  color: activeFocusBranchId === b.id ? '#FFFFFF' : '#1E293B',
                  border: `1.5px solid ${b.color}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Store size={13} color={activeFocusBranchId === b.id ? '#FFFFFF' : b.color} />
                <span>{b.shortName}</span>
              </button>
            ))}
          </div>

          {interactive && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              style={{
                pointerEvents: 'auto',
                backgroundColor: '#5D3EBC',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 4px 12px rgba(93, 62, 188, 0.3)',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Crosshair size={14} className={isLocating ? 'spin' : ''} />
              <span>{isLocating ? 'Aranıyor...' : 'Konumumu Bul'}</span>
            </button>
          )}
        </div>
      )}

      {/* Map DOM Element */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '340px',
        }}
      />

      {/* Floating Card: Selected Location Summary (When Customer Clicks) */}
      {interactive && drawingMode === 'none' && activeSelection && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '2px solid #5D3EBC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} />
                <span>Teslimat Konumu İşaretlendi</span>
              </span>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
              {activeSelection.label || 'Haritada Seçilen Konum'}
            </div>

            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              🚀 Kurye ile Hızlı Teslimat (~{activeSelection.estimatedMinutes} dk)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                color: '#5D3EBC',
                fontWeight: 800,
                backgroundColor: '#F3F0FE',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
            >
              Konum Belirlendi ✓
            </span>
          </div>
        </div>
      )}

      {/* Clean Legend Bar (Only shown in Admin View) */}
      {isAdminView && drawingMode === 'none' && !activeSelection && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(6px)',
            borderRadius: '10px',
            padding: '6px 10px',
            fontSize: '10px',
            color: '#475569',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 800, color: '#1E293B' }}>Bölgeler &amp; Min Sepet:</span>
          {activeZones.slice(0, 4).map((z) => (
            <span key={z.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: z.hexColor || '#10B981', display: 'inline-block' }} />
              <span>{z.name.split('(')[0].trim()} ({z.minOrderAmount} ₺)</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
