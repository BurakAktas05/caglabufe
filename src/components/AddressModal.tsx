'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { KARABUK_DISTRICTS, DELIVERY_PRESET_NOTES } from '@/data/karabukLocations';
import {
  getDormitories,
  getZoneForAddress,
  getClosestBranchAndZone,
  getStoreBranches,
} from '@/lib/settingsManager';
import { SelectedLocationData } from '@/components/DeliveryMap';
import {
  X,
  Building2,
  Home,
  CheckCircle2,
  Plus,
  MapPin,
  GraduationCap,
  ShieldAlert,
  Trash2,
  ArrowLeft,
  Check,
  Compass,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Dynamic import with SSR disabled to prevent Leaflet window reference errors
const DeliveryMap = dynamic(
  () => import('@/components/DeliveryMap').then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: '16px',
          color: '#64748B',
          fontSize: '13px',
          fontWeight: 700,
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '24px' }}>🗺️</span>
        <span>Karabük OpenStreetMap &amp; Şube Bölgeleri Yükleniyor...</span>
      </div>
    ),
  }
);

export const AddressModal = () => {
  const {
    isAddressModalOpen,
    setIsAddressModalOpen,
    addresses,
    selectedAddress,
    saveNewAddress,
    deleteAddress,
    setSelectedAddressId,
  } = useApp();

  // If user has 0 addresses, start directly on 'add' mode
  const [isAddingNew, setIsAddingNew] = useState(addresses.length === 0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeTab, setActiveTab] = useState<'map' | 'dormitory' | 'home'>('map');

  useEffect(() => {
    if (addresses.length === 0) {
      setIsAddingNew(true);
    }
  }, [addresses.length]);

  // Dynamic dormitories & branches from admin settings
  const dorms = useMemo(() => {
    return getDormitories().filter((d) => d.isActive);
  }, []);

  const branches = useMemo(() => {
    return getStoreBranches().filter((b) => b.isActive);
  }, []);

  // Form states for Map Pin Pick
  const [pickedMapData, setPickedMapData] = useState<SelectedLocationData | null>(null);
  const [mapAddressTitle, setMapAddressTitle] = useState('Evim');
  const [mapDistrict, setMapDistrict] = useState(KARABUK_DISTRICTS[0]);
  const [mapStreetName, setMapStreetName] = useState('');
  const [mapBuildingNumber, setMapBuildingNumber] = useState('');
  const [mapFloorNumber, setMapFloorNumber] = useState('');
  const [mapApartmentNumber, setMapApartmentNumber] = useState('');
  const [mapAddressDetail, setMapAddressDetail] = useState('');
  const [mapCourierNote, setMapCourierNote] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Form states for adding a dormitory
  const [selectedDormId, setSelectedDormId] = useState<string>(dorms[0]?.id || 'hubbi-hatun');
  const [dormPresetNote, setDormPresetNote] = useState(DELIVERY_PRESET_NOTES[0]);

  // Form states for adding a home / regular address
  const [homeTitle, setHomeTitle] = useState('100. Yıl Evim');
  const [homeDistrict, setHomeDistrict] = useState(KARABUK_DISTRICTS[0]);
  const [homeStreetName, setHomeStreetName] = useState('');
  const [homeBuildingNumber, setHomeBuildingNumber] = useState('');
  const [homeFloorNumber, setHomeFloorNumber] = useState('');
  const [homeApartmentNumber, setHomeApartmentNumber] = useState('');
  const [homeAddressDetail, setHomeAddressDetail] = useState('');
  const [courierNote, setCourierNote] = useState('');

  if (!isAddressModalOpen) return null;

  const currentDorm = dorms.find((d) => d.id === selectedDormId) || dorms[0];

  // Reverse Geocoding via OpenStreetMap Nominatim when location is picked on map
  const handleLocationPickedOnMap = (data: SelectedLocationData) => {
    setPickedMapData(data);

    // Default district from zone name if matching
    const zoneDistrict = data.zone?.name ? data.zone.name.split('&')[0].trim() : '';
    const matched = KARABUK_DISTRICTS.find(
      (d) => d.toLowerCase().includes(zoneDistrict.toLowerCase()) || zoneDistrict.toLowerCase().includes(d.toLowerCase())
    );
    if (matched) {
      setMapDistrict(matched);
    }

    // Attempt reverse geocoding to auto-fill road/street and house number
    setIsGeocoding(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}&addressdetails=1`
    )
      .then((res) => res.json())
      .then((geo) => {
        if (geo && geo.address) {
          const road =
            geo.address.road ||
            geo.address.pedestrian ||
            geo.address.street ||
            geo.address.residential ||
            '';
          const house = geo.address.house_number || '';
          const suburb =
            geo.address.suburb ||
            geo.address.neighbourhood ||
            geo.address.city_district ||
            '';

          if (road && !mapStreetName) {
            setMapStreetName(road);
          }
          if (house && !mapBuildingNumber) {
            setMapBuildingNumber(house);
          }
          if (suburb) {
            const distMatch = KARABUK_DISTRICTS.find(
              (d) =>
                d.toLowerCase().includes(suburb.toLowerCase()) ||
                suburb.toLowerCase().includes(d.toLowerCase())
            );
            if (distMatch) setMapDistrict(distMatch);
          }
          if (road && (!mapAddressTitle || mapAddressTitle === 'Evim')) {
            setMapAddressTitle(`${road} Evim`);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsGeocoding(false));
  };

  // Save address from Map Click with Mandatory Street, Building, Apartment
  const handleSaveMapAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedMapData) {
      alert('Lütfen teslimat yapılacak yerinizi harita üzerinde işaretleyiniz veya "Konumumu Bul" butonuna basınız.');
      return;
    }

    if (!mapStreetName.trim()) {
      alert('Lütfen teslimat yapılacak Cadde veya Sokak ismini giriniz (Örn: 1002. Cadde, Şafak Sokak). Kuryemizin adrese ulaşabilmesi için bu bilgi zorunludur.');
      return;
    }

    if (!mapBuildingNumber.trim()) {
      alert('Lütfen Bina No veya Apartman adını giriniz (Örn: No: 14 veya Güneş Apt.). Kuryemizin hangi binaya gideceğini bilmesi zorunludur.');
      return;
    }

    if (!mapApartmentNumber.trim()) {
      alert('Lütfen Daire / Kapı numaranızı giriniz (Örn: Daire: 6). Kuryemizin siparişi teslim edebilmesi için bu bilgi zorunludur.');
      return;
    }

    const title = mapAddressTitle.trim() || `${mapStreetName.trim()} Evim`;
    const districtName = mapDistrict.trim();

    // Construct clear, comprehensive delivery address
    const fullAddress = `${districtName}, ${mapStreetName.trim()}, Bina No: ${mapBuildingNumber.trim()}${
      mapFloorNumber.trim() ? `, Kat: ${mapFloorNumber.trim()}` : ''
    }, Daire: ${mapApartmentNumber.trim()}${
      mapAddressDetail.trim() ? ` (${mapAddressDetail.trim()})` : ''
    }`;

    saveNewAddress({
      type: 'home',
      title,
      district: districtName,
      streetName: mapStreetName.trim(),
      buildingNumber: mapBuildingNumber.trim(),
      floorNumber: mapFloorNumber.trim() || undefined,
      apartmentNumber: mapApartmentNumber.trim(),
      fullAddress,
      latitude: pickedMapData.latitude,
      longitude: pickedMapData.longitude,
      assignedBranchId: pickedMapData.branch.id,
      assignedZoneId: pickedMapData.zone.id,
      distanceKm: pickedMapData.distanceKm,
      courierNote: mapCourierNote.trim() || undefined,
      isDefault: true,
    });

    setIsAddingNew(false);
    setIsAddressModalOpen(false);
  };

  const handleSaveDormitoryAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDorm) return;

    const title = currentDorm.name;

    // Calculate nearest branch if dorm has coordinates
    let branchId = undefined;
    let distanceKm = currentDorm.distanceKm;
    if (currentDorm.latitude && currentDorm.longitude) {
      const match = getClosestBranchAndZone(currentDorm.latitude, currentDorm.longitude);
      branchId = match.branch.id;
      distanceKm = match.distanceKm;
    }

    saveNewAddress({
      type: 'dormitory',
      title,
      dormName: currentDorm.name,
      district: currentDorm.district,
      deliveryPresetNote: dormPresetNote,
      latitude: currentDorm.latitude,
      longitude: currentDorm.longitude,
      assignedBranchId: branchId,
      assignedZoneId: currentDorm.zoneId,
      distanceKm,
      isDefault: true,
    });

    setIsAddingNew(false);
    setIsAddressModalOpen(false);
  };

  const handleSaveHomeAddress = (e: React.FormEvent) => {
    e.preventDefault();

    if (!homeStreetName.trim()) {
      alert('Lütfen teslimat yapılacak Cadde veya Sokak ismini giriniz (Örn: 1002. Cadde, Şafak Sokak).');
      return;
    }

    if (!homeBuildingNumber.trim()) {
      alert('Lütfen Bina veya Apartman numarasını giriniz (Örn: No: 14 veya Güneş Apt.).');
      return;
    }

    if (!homeApartmentNumber.trim()) {
      alert('Lütfen Daire / Kapı numaranızı giriniz (Örn: Daire: 6).');
      return;
    }

    const zone = getZoneForAddress(homeDistrict);
    const title = homeTitle.trim() || `${homeStreetName.trim()} Evim`;

    const fullAddress = `${homeDistrict}, ${homeStreetName.trim()}, Bina No: ${homeBuildingNumber.trim()}${
      homeFloorNumber.trim() ? `, Kat: ${homeFloorNumber.trim()}` : ''
    }, Daire: ${homeApartmentNumber.trim()}${
      homeAddressDetail.trim() ? ` (${homeAddressDetail.trim()})` : ''
    }`;

    saveNewAddress({
      type: 'home',
      title,
      district: homeDistrict,
      streetName: homeStreetName.trim(),
      buildingNumber: homeBuildingNumber.trim(),
      floorNumber: homeFloorNumber.trim() || undefined,
      apartmentNumber: homeApartmentNumber.trim(),
      fullAddress,
      assignedZoneId: zone?.id,
      courierNote: courierNote.trim() || undefined,
      isDefault: true,
    });

    setIsAddingNew(false);
    setIsAddressModalOpen(false);
  };

  const handleSelectExistingAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsAddressModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, addressId: string, addressTitle: string) => {
    e.stopPropagation();
    if (confirm(`"${addressTitle}" adresini kayıtlı adreslerinizden silmek istediğinize emin misiniz?`)) {
      deleteAddress(addressId);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAddingNew && addresses.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#5D3EBC',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: 0,
                  marginRight: '6px',
                }}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <MapPin size={20} color="#5D3EBC" />
            )}
            <span>{isAddingNew ? 'Yeni Teslimat Adresi Ekle' : 'Kayıtlı Adreslerim'}</span>
          </div>
          <button
            className="close-btn"
            onClick={() => setIsAddressModalOpen(false)}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="sheet-body" style={{ padding: '16px 20px 24px' }}>
          {!isAddingNew ? (
            /* --- SCREEN 1: SAVED ADDRESSES LIST --- */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#4B5563' }}>
                  Teslimat yapılacak adresi seçiniz:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: viewMode === 'list' ? '#5D3EBC' : '#F1F5F9',
                      color: viewMode === 'list' ? '#FFFFFF' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    📋 Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: viewMode === 'map' ? '#5D3EBC' : '#F1F5F9',
                      color: viewMode === 'map' ? '#FFFFFF' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Compass size={13} />
                    <span>🗺️ Harita</span>
                  </button>
                </div>
              </div>

              {/* View Mode: Map vs List */}
              {viewMode === 'map' ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <DeliveryMap
                      interactive={false}
                      height="300px"
                      selectedLocation={
                        selectedAddress?.latitude && selectedAddress?.longitude
                          ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
                          : undefined
                      }
                    />
                  </div>
                  {selectedAddress && (
                    <div
                      style={{
                        backgroundColor: '#F3F0FE',
                        border: '1.5px solid #DDD6FE',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                          📍 Seçili Adres: {selectedAddress.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {selectedAddress.fullAddress || selectedAddress.district}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#F8F9FC', borderRadius: '14px', marginBottom: '16px' }}>
                  <Building2 size={36} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                    Henüz kayıtlı bir adresiniz yok
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Sipariş verebilmek için lütfen yurt veya ev adresinizi ekleyiniz.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectExistingAddress(addr.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #5D3EBC' : '1.5px solid #EBEBF2',
                          backgroundColor: isSelected ? '#F5F2FE' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          boxShadow: isSelected ? '0 4px 14px rgba(93, 62, 188, 0.08)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: isSelected ? '#5D3EBC' : '#F3F0FE',
                              color: isSelected ? '#FFFFFF' : '#5D3EBC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            {addr.type === 'dormitory' ? <GraduationCap size={20} /> : <Home size={20} />}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '14px', color: '#191919' }}>
                                {addr.title}
                              </span>
                              {isSelected && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: '#5D3EBC',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #DDD6FE',
                                    padding: '1px 7px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  ✓ Seçili
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '12px', color: '#586174', marginTop: '3px', lineHeight: 1.35 }}>
                              {addr.type === 'dormitory' ? (
                                <>
                                  <span style={{ fontWeight: 600 }}>{addr.dormName}</span>
                                  {(addr.blockNumber || addr.roomNumber) && (
                                    <span style={{ display: 'block', color: '#4B5563', marginTop: '1px' }}>
                                      {addr.blockNumber ? `${addr.blockNumber}` : ''}
                                      {addr.blockNumber && addr.roomNumber ? ' • ' : ''}
                                      {addr.roomNumber ? `Oda: ${addr.roomNumber}` : ''}
                                    </span>
                                  )}
                                  {addr.deliveryPresetNote && (
                                    <span style={{ display: 'block', color: '#5D3EBC', fontWeight: 600, marginTop: '2px' }}>
                                      📌 {addr.deliveryPresetNote}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span>{addr.fullAddress || addr.district}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {isSelected ? (
                            <CheckCircle2 size={22} color="#5D3EBC" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectExistingAddress(addr.id)}
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#5D3EBC',
                                backgroundColor: '#F3F0FE',
                                padding: '5px 12px',
                                borderRadius: '999px',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Seç
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, addr.id, addr.title)}
                            style={{
                              color: '#94A3B8',
                              background: 'none',
                              border: 'none',
                              padding: '6px',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Adresi Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Button: Add New Address */}
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsAddingNew(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '13px',
                }}
              >
                <Plus size={18} />
                <span>Yeni Adres Ekle (Harita, Yurt veya Ev)</span>
              </button>
            </div>
          ) : (
            /* --- SCREEN 2: ADD NEW ADDRESS FORM --- */
            <div>
              {/* Tab Switcher */}
              <div className="tab-switcher" style={{ margin: '0 0 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                  onClick={() => setActiveTab('map')}
                >
                  <Compass size={15} />
                  <span>🗺️ Harita ile Seç</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'dormitory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dormitory')}
                >
                  <GraduationCap size={15} />
                  <span>🎓 Öğrenci Yurdu</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  <Home size={15} />
                  <span>🏠 Manuel Adres</span>
                </button>
              </div>

              {activeTab === 'map' ? (
                /* --- TAB 1: INTERACTIVE OPENSTREETMAP PIN PICK --- */
                <div>
                  <div
                    style={{
                      backgroundColor: '#F3F0FE',
                      border: '1px solid #DDD6FE',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Compass size={20} color="#5D3EBC" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                      <strong>1. Adım:</strong> Haritada evinizin / binanızın üzerine dokununuz veya <strong>&quot;Konumumu Bul&quot;</strong> butonuna basınız. Ardından sokak, bina ve daire bilgilerinizi doldurunuz.
                    </div>
                  </div>

                  {/* OpenStreetMap Component */}
                  <div style={{ marginBottom: '16px' }}>
                    <DeliveryMap
                      interactive={true}
                      height="300px"
                      onLocationSelect={handleLocationPickedOnMap}
                    />
                  </div>

                  {/* Form fields once location is selected */}
                  {pickedMapData ? (
                    <form onSubmit={handleSaveMapAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div
                        style={{
                          backgroundColor: '#F0FDF4',
                          border: '1.5px solid #86EFAC',
                          borderRadius: '12px',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                            {isGeocoding ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </div>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#166534' }}>
                              📍 Harita Konumunuz Alındı
                            </strong>
                            <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '1px' }}>
                              {isGeocoding ? 'Sokak ve mahalle bilgisi çözümleniyor...' : 'Şimdi kuryemizin kapınızı bulabilmesi için sokak, bina ve daire bilgilerinizi giriniz:'}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            backgroundColor: '#15803D',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '8px',
                          }}
                        >
                          Konum Seçildi ✓
                        </span>
                      </div>

                      {/* Required Notice */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>
                        <AlertCircle size={14} />
                        <span>Kırmızı (*) işaretli kısımlar kurye teslimatı için ZORUNLUDUR.</span>
                      </div>

                      {/* Address Title & District */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Adres Başlığı *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: 100. Yıl Evim, Ofisim"
                            value={mapAddressTitle}
                            onChange={(e) => setMapAddressTitle(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Mahalle / Semt *</label>
                          <select
                            className="form-input"
                            value={mapDistrict}
                            onChange={(e) => setMapDistrict(e.target.value)}
                            required
                          >
                            {KARABUK_DISTRICTS.map((dst) => (
                              <option key={dst} value={dst}>
                                {dst}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Street Name (Zorunlu) & Building Number (Zorunlu) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                            Cadde / Sokak İsmi * (Zorunlu)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: 1002. Cadde veya Şafak Sokak"
                            value={mapStreetName}
                            onChange={(e) => setMapStreetName(e.target.value)}
                            required
                            style={{ borderColor: !mapStreetName ? '#FDA4AF' : undefined }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                            Bina / Apartman No * (Zorunlu)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: No: 14 veya Güneş Apt."
                            value={mapBuildingNumber}
                            onChange={(e) => setMapBuildingNumber(e.target.value)}
                            required
                            style={{ borderColor: !mapBuildingNumber ? '#FDA4AF' : undefined }}
                          />
                        </div>
                      </div>

                      {/* Floor & Apartment Number (Zorunlu) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Kat (İsteğe Bağlı)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: Kat: 2 veya 3. Kat"
                            value={mapFloorNumber}
                            onChange={(e) => setMapFloorNumber(e.target.value)}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                            Daire / Kapı No * (Zorunlu)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Örn: Daire: 6 veya No: 8"
                            value={mapApartmentNumber}
                            onChange={(e) => setMapApartmentNumber(e.target.value)}
                            required
                            style={{ borderColor: !mapApartmentNumber ? '#FDA4AF' : undefined }}
                          />
                        </div>
                      </div>

                      {/* Address Description / Landmark */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Adres Tarifi / Bina Özelliği (İsteğe Bağlı)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Örn: Şok marketin karşısındaki sarı bina, A Blok"
                          value={mapAddressDetail}
                          onChange={(e) => setMapAddressDetail(e.target.value)}
                        />
                      </div>

                      {/* Courier Delivery Note */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Kuryeye Not (İsteğe Bağlı)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Zile basmayın bebek uyuyor, gelince arayın vb."
                          value={mapCourierNote}
                          onChange={(e) => setMapCourierNote(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setIsAddingNew(false)}
                            style={{ flex: 1 }}
                          >
                            Vazgeç
                          </button>
                        )}
                        <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                          <Check size={16} />
                          <span>✓ Adresimi Kaydet ve Seç</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 16px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '14px',
                        border: '1.5px dashed #CBD5E1',
                        color: '#64748B',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <MapPin size={24} color="#5D3EBC" />
                      <div>
                        👆 Devam etmek için lütfen yukarıdaki haritada teslimat adresinize dokununuz ya da <strong>&quot;Konumumu Bul&quot;</strong> butonuna basınız.
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'dormitory' ? (
                /* --- TAB 2: DORMITORY ADD FORM --- */
                <form onSubmit={handleSaveDormitoryAddress}>
                  {/* Karabük KYK Night Rule Alert */}
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <ShieldAlert size={18} color="#5D3EBC" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', lineHeight: 1.45 }}>
                      <strong>Karabük KYK Kuralı:</strong> Yurt güvenliği gereği teslimatlar kuryemiz tarafından <u>Nizamiye / Ana Güvenlik Kapısında</u> elden yapılır.
                    </span>
                  </div>

                  {/* Dormitory Dropdown Selection */}
                  <div className="form-group">
                    <label className="form-label">Yurdunuzu Seçiniz *</label>
                    <select
                      className="form-input"
                      value={selectedDormId}
                      onChange={(e) => setSelectedDormId(e.target.value)}
                      required
                    >
                      {dorms.map((dorm) => (
                        <option key={dorm.id} value={dorm.id}>
                          {dorm.name} ({dorm.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Yurt Bilgilendirme Kutusu (Blok / Oda Gerekmez) */}
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.45 }}>
                      <strong>Yurtta blok ve oda bilgisine gerek yoktur!</strong> Kuryemiz siparişinizi yurt nizamiyesine / güvenliğine getirdiğinde sizi doğrudan telefonla arayacaktır.
                    </div>
                  </div>

                  {/* Delivery Note Presets */}
                  <div className="form-group">
                    <label className="form-label">Kurye Notu</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                      {DELIVERY_PRESET_NOTES.map((note) => (
                        <label
                          key={note}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: dormPresetNote === note ? '#F3F0FE' : '#F9FAFB',
                            border: '1px solid ' + (dormPresetNote === note ? '#DDD6FE' : '#E5E7EB'),
                            fontSize: '12px',
                            fontWeight: dormPresetNote === note ? 700 : 500,
                            color: dormPresetNote === note ? '#5D3EBC' : '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="dormPresetNote"
                            checked={dormPresetNote === note}
                            onChange={() => setDormPresetNote(note)}
                          />
                          <span>{note}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsAddingNew(false)}
                        style={{ flex: 1 }}
                      >
                        Vazgeç
                      </button>
                    )}
                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                      <Check size={16} />
                      <span>Bu Yurdu Kaydet &amp; Seç</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* --- TAB 3: HOME / REGULAR ADDRESS FORM --- */
                <form onSubmit={handleSaveHomeAddress}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#DC2626', fontWeight: 700, marginBottom: '10px' }}>
                    <AlertCircle size={14} />
                    <span>Kırmızı (*) işaretli sokak, bina ve daire bilgileri ZORUNLUDUR.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Adres Başlığı *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: 100. Yıl Evim, Ofisim"
                        value={homeTitle}
                        onChange={(e) => setHomeTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mahalle / Semt *</label>
                      <select
                        className="form-input"
                        value={homeDistrict}
                        onChange={(e) => setHomeDistrict(e.target.value)}
                        required
                      >
                        {KARABUK_DISTRICTS.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Street Name (Zorunlu) & Building Number (Zorunlu) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                        Cadde / Sokak İsmi * (Zorunlu)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: 1002. Cadde veya Şafak Sokak"
                        value={homeStreetName}
                        onChange={(e) => setHomeStreetName(e.target.value)}
                        required
                        style={{ borderColor: !homeStreetName ? '#FDA4AF' : undefined }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                        Bina / Apartman No * (Zorunlu)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: No: 14 veya Kardelen Apt."
                        value={homeBuildingNumber}
                        onChange={(e) => setHomeBuildingNumber(e.target.value)}
                        required
                        style={{ borderColor: !homeBuildingNumber ? '#FDA4AF' : undefined }}
                      />
                    </div>
                  </div>

                  {/* Floor & Apartment Number (Zorunlu) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Kat (İsteğe Bağlı)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Kat: 2 veya 3. Kat"
                        value={homeFloorNumber}
                        onChange={(e) => setHomeFloorNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#9F1239', fontWeight: 800 }}>
                        Daire / Kapı No * (Zorunlu)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Daire: 6 veya No: 8"
                        value={homeApartmentNumber}
                        onChange={(e) => setHomeApartmentNumber(e.target.value)}
                        required
                        style={{ borderColor: !homeApartmentNumber ? '#FDA4AF' : undefined }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Adres Tarifi / Ek Detay (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Örn: Şok marketin karşısındaki sarı bina, A Blok"
                      value={homeAddressDetail}
                      onChange={(e) => setHomeAddressDetail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kuryeye Not (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Zile basmayın, gelince arayın vb."
                      value={courierNote}
                      onChange={(e) => setCourierNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setIsAddingNew(false)}
                        style={{ flex: 1 }}
                      >
                        Vazgeç
                      </button>
                    )}
                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                      <Check size={16} />
                      <span>Adresi Kaydet &amp; Seç</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
