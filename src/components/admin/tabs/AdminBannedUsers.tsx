'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BannedUser, Order } from '@/types';
import {
  Ban,
  ShieldCheck,
  Plus,
  UserX,
  Search,
  Check,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  X,
  CheckCircle2,
  Info,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import { normalizePhoneNumber, formatPhoneNumber } from '@/lib/security';
import { fetchRegisteredProfiles, RegisteredProfile } from '@/lib/supabase';

interface AdminBannedUsersProps {
  bannedUsers: BannedUser[];
  orders?: Order[];
  onManualBan: (phone: string, name: string, reason: string) => Promise<void> | void;
  onUnban: (phone: string) => Promise<void> | void;
}

interface CustomerOption {
  cleanPhone: string;
  formattedPhone: string;
  name: string;
  orderCount: number;
  lastOrderDate?: string;
  totalSpent: number;
  isRegistered: boolean;
  isBanned: boolean;
}

const PRESET_REASONS = [
  'Kapıda teslim almadı / telefon açmadı',
  'Sahte / trolleme sipariş verdi',
  'Kuryeye hakaret / olumsuz davranış',
  'Sipariş verip kapıyı açmadı / adreste yok',
  'Ödeme yapmayı reddetti',
  'Sürekli keyfi sipariş iptali',
];

export const AdminBannedUsers: React.FC<AdminBannedUsersProps> = ({
  bannedUsers,
  orders = [],
  onManualBan,
  onUnban,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [registeredProfiles, setRegisteredProfiles] = useState<RegisteredProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [bannedSearch, setBannedSearch] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load registered customer profiles from Supabase profiles table
  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const profiles = await fetchRegisteredProfiles();
      setRegisteredProfiles(profiles);
    } catch {
      // ignore
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Compute canonical clean phone for the currently typed/selected phone
  const canonicalPhone = useMemo(() => normalizePhoneNumber(phone), [phone]);

  // Aggregate and deduplicate all unique customers from DB profiles and past orders
  const allCustomers = useMemo(() => {
    const map = new Map<string, CustomerOption>();

    // 1. Add from registered profiles in database
    registeredProfiles.forEach((p) => {
      const clean = normalizePhoneNumber(p.phone);
      if (!clean) return;
      map.set(clean, {
        cleanPhone: clean,
        formattedPhone: formatPhoneNumber(clean),
        name: p.fullName || 'Kayıtlı Müşteri',
        orderCount: 0,
        totalSpent: 0,
        isRegistered: true,
        isBanned: Boolean(p.isBanned) || bannedUsers.some((b) => normalizePhoneNumber(b.phone) === clean),
      });
    });

    // 2. Add or merge from orders
    orders.forEach((o) => {
      const clean = normalizePhoneNumber(o.customerPhone);
      if (!clean) return;

      const existing = map.get(clean);
      const isBanned = bannedUsers.some((b) => normalizePhoneNumber(b.phone) === clean);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += o.finalAmount;
        if (!existing.lastOrderDate || new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
          if (o.customerName && o.customerName !== 'Müşteri') {
            existing.name = o.customerName;
          }
        }
        existing.isBanned = isBanned || existing.isBanned;
      } else {
        map.set(clean, {
          cleanPhone: clean,
          formattedPhone: formatPhoneNumber(clean),
          name: o.customerName || 'Müşteri',
          orderCount: 1,
          totalSpent: o.finalAmount,
          lastOrderDate: o.createdAt,
          isRegistered: false,
          isBanned,
        });
      }
    });

    // Convert map to array and sort: active customers with recent orders first
    return Array.from(map.values()).sort((a, b) => {
      if (a.isBanned !== b.isBanned) return a.isBanned ? 1 : -1;
      return (b.orderCount || 0) - (a.orderCount || 0);
    });
  }, [registeredProfiles, orders, bannedUsers]);

  // Filtered customer list for the customer picker
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) {
      return allCustomers.slice(0, 8); // show top 8 recent/frequent customers
    }
    const q = customerSearch.toLowerCase().trim();
    const cleanQ = normalizePhoneNumber(q);

    return allCustomers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch = cleanQ ? c.cleanPhone.includes(cleanQ) : c.cleanPhone.includes(q);
      return nameMatch || phoneMatch;
    });
  }, [allCustomers, customerSearch]);

  // When admin types manually, auto-match known customer from DB
  useEffect(() => {
    if (!canonicalPhone || canonicalPhone.length < 10) return;
    const match = allCustomers.find((c) => c.cleanPhone === canonicalPhone);
    if (match && !selectedCustomer) {
      if (!name || name === 'Müşteri') {
        setName(match.name);
      }
    }
  }, [canonicalPhone, allCustomers, selectedCustomer, name]);

  // Filtered banned users list
  const filteredBannedUsers = useMemo(() => {
    if (!bannedSearch.trim()) return bannedUsers;
    const q = bannedSearch.toLowerCase().trim();
    const cleanQ = normalizePhoneNumber(q);
    return bannedUsers.filter((b) => {
      const matchName = b.name.toLowerCase().includes(q);
      const matchReason = b.reason.toLowerCase().includes(q);
      const matchPhone = cleanQ
        ? normalizePhoneNumber(b.phone).includes(cleanQ)
        : b.phone.includes(q);
      return matchName || matchReason || matchPhone;
    });
  }, [bannedUsers, bannedSearch]);

  const handleSelectCustomer = (c: CustomerOption) => {
    setSelectedCustomer(c);
    setPhone(c.formattedPhone);
    setName(c.name);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setPhone('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canonicalPhone || canonicalPhone.length < 10) {
      alert('Lütfen geçerli bir 10 haneli telefon numarası giriniz (Örn: 507 123 45 67 veya 0507 123 45 67).');
      return;
    }

    const finalReason = reason === 'Diğer' ? customReason.trim() || 'Kötü niyetli kullanım' : reason;
    const finalName = name.trim() || (selectedCustomer ? selectedCustomer.name : 'Müşteri');

    await onManualBan(canonicalPhone, finalName, finalReason);

    setSuccessMessage(
      `"${finalName}" (${formatPhoneNumber(canonicalPhone)}) kara listeye eklendi. Tüm varyasyonlar (0507, 507, +90) otomatik bloke edildi.`
    );
    setTimeout(() => setSuccessMessage(null), 6000);

    setPhone('');
    setName('');
    setSelectedCustomer(null);
    setCustomReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserX size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1F2937', margin: 0 }}>
                Kara Liste &amp; Engelli Numaralar ({bannedUsers.length})
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', marginBottom: 0 }}>
                Kötü niyetli, sahte sipariş veren veya kapıyı açmayan müşterileri DB&apos;den seçerek ya da numara yazarak engelleyebilirsiniz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProfiles}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
            }}
            title="Kayıtlı kullanıcı listesini Supabase DB'den yenile"
          >
            <RefreshCw size={14} className={isLoadingProfiles ? 'animate-spin' : ''} />
            <span>DB&apos;yi Yenile</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SECTION 1: DATABASE / REGISTERED CUSTOMER PICKER */}
        <div
          style={{
            marginTop: '22px',
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '16px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#4F46E5" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B' }}>
                Veritabanından / Sipariş Veren Müşterilerden Seç
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {allCustomers.length} Müşteri Bulundu
              </span>
            </div>

            {/* Quick search inside customer picker */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="İsim veya tel ara (Örn: 507, Mert)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{
                  padding: '7px 12px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                }}
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94A3B8',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '10px',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredCustomers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Aradığınız kriterde kayıtlı müşteri bulunamadı. Aşağıdaki formdan manuel numara girebilirsiniz.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.cleanPhone === c.cleanPhone;

                return (
                  <div
                    key={c.cleanPhone}
                    onClick={() => !c.isBanned && handleSelectCustomer(c)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#EFF6FF' : c.isBanned ? '#FEF2F2' : '#FFFFFF',
                      border: isSelected
                        ? '2px solid #3B82F6'
                        : c.isBanned
                        ? '1px dashed #FECDD3'
                        : '1px solid #E2E8F0',
                      cursor: c.isBanned ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.name}</span>
                        {c.isRegistered && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              backgroundColor: '#E0E7FF',
                              color: '#4338CA',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            Kayıtlı
                          </span>
                        )}
                      </div>

                      {c.isBanned ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#DC2626',
                            backgroundColor: '#FEE2E2',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Ban size={11} />
                          <span>Engelli</span>
                        </span>
                      ) : isSelected ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#2563EB',
                            backgroundColor: '#DBEAFE',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={12} />
                          <span>Seçildi</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(c);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#DC2626',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECDD3',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          Engelle
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{c.formattedPhone}</span>
                      <span style={{ fontSize: '10px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                        ID: {c.cleanPhone}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {c.orderCount > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <ShoppingBag size={11} color="#6366F1" />
                          <span>{c.orderCount} Sipariş (₺{c.totalSpent.toFixed(0)})</span>
                        </span>
                      )}
                      {c.lastOrderDate && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} />
                          <span>{new Date(c.lastOrderDate).toLocaleDateString('tr-TR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: BAN SUBMISSION FORM WITH REALTIME NORMALIZATION FEEDBACK */}
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: '20px',
            backgroundColor: '#FFF1F2',
            border: '1.5px dashed #FECDD3',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={15} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#9F1239' }}>
                {selectedCustomer ? 'Seçilen Müşteriyi Kara Listeye Ekle' : 'Numara Engelleme İşlemi'}
              </span>
            </div>

            {selectedCustomer && (
              <button
                type="button"
                onClick={handleClearSelection}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#9F1239',
                  backgroundColor: '#FFE4E6',
                  border: '1px solid #FDA4AF',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={12} />
                <span>Müşteri Seçimini Kaldır</span>
              </button>
            )}
          </div>

          {/* Selected Customer Pill Banner */}
          {selectedCustomer && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF' }}>
                  Seçilen DB Müşterisi: {selectedCustomer.name} • {selectedCustomer.formattedPhone}
                </span>
                <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 700 }}>
                  (Kanıtlı Sipariş Sayısı: {selectedCustomer.orderCount})
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E3A8A', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '6px' }}>
                Sistem Eşleşme No: {selectedCustomer.cleanPhone}
              </span>
            </div>
          )}

          {/* Form Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {/* Phone Input */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#881337', marginBottom: '4px' }}>
                Telefon Numarası *
              </label>
              <input
                type="text"
                placeholder="Örn: 0507 000 00 00 veya 507 000 00 00"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (selectedCustomer && normalizePhoneNumber(e.target.value) !== selectedCustomer.cleanPhone) {
                    setSelectedCustomer(null);
                  }
                }}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #FDA4AF',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* Customer Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#881337', marginBottom: '4px' }}>
                Müşteri Adı (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #FDA4AF',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  outline: 'none',
                }}
              />
            </div>

            {/* Reason Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#881337', marginBottom: '4px' }}>
                Engelleme Sebebi *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #FDA4AF',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  color: '#1F2937',
                  outline: 'none',
                  fontWeight: 600,
                }}
              >
                {PRESET_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="Diğer">Diğer (Özel Sebep Yaz)...</option>
              </select>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#E11D48',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '13px',
                  borderRadius: '10px',
                  padding: '11px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Ban size={16} />
                <span>Numarayı Engelle &amp; Kara Listeye Ekle</span>
              </button>
            </div>
          </div>

          {/* Custom Reason input if "Diğer" is selected */}
          {reason === 'Diğer' && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Özel engelleme sebebini yazınız..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #FDA4AF',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* LIVE UNIVERSAL NORMALIZATION EXPLANATION BOX */}
          {canonicalPhone && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #FECDD3',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#059669" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#065F46' }}>
                    Otomatik Prefix Eşleştirme Koruması Aktif
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Sistem Standart ID:</span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 900,
                      color: '#047857',
                      backgroundColor: '#D1FAE5',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {canonicalPhone}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                💡 <strong>Kusursuz Engelleme:</strong> Bu numara ister <strong>0{canonicalPhone}</strong>, ister{' '}
                <strong>{canonicalPhone}</strong>, ister <strong>+90 {canonicalPhone}</strong> veya boşluklu yazılarak
                girilsin; sistem hepsini standart <strong>{canonicalPhone}</strong> olarak tanır. Müşteri başındaki 0&apos;ı
                silsin veya eklesin asla engeli atlatamaz.
              </div>
            </div>
          )}
        </form>

        {/* SECTION 3: BANNED USERS LIST */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1F2937', margin: 0 }}>
              Mevcut Engelli Listesi ({filteredBannedUsers.length})
            </h3>

            {bannedUsers.length > 3 && (
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Kara listede ara..."
                  value={bannedSearch}
                  onChange={(e) => setBannedSearch(e.target.value)}
                  style={{
                    padding: '7px 12px 7px 30px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>

          {bannedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
              <ShieldCheck size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '17px', fontWeight: 900, color: '#1F2937' }}>Kara Liste Temiz</h4>
              <p style={{ fontSize: '13px', marginTop: '4px', color: '#64748B', maxWidth: '400px', margin: '6px auto 0' }}>
                Şu anda engellenmiş hiçbir numara bulunmuyor. Tüm kayıtlı öğrenciler ve müşteriler sipariş verebilir.
              </p>
            </div>
          ) : filteredBannedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13px' }}>
              Aramanıza uygun engelli numara bulunamadı.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredBannedUsers.map((b) => {
                const clean = normalizePhoneNumber(b.phone);
                const display = formatPhoneNumber(clean);

                // Check how many orders this banned user placed in the past
                const pastOrderCount = orders.filter(
                  (o) => normalizePhoneNumber(o.customerPhone) === clean
                ).length;

                return (
                  <div
                    key={b.id || clean}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #FEE2E2',
                      borderRadius: '14px',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '0 2px 6px rgba(225, 29, 72, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#FEE2E2',
                          color: '#E11D48',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <AlertOctagon size={22} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '15px', color: '#1F2937' }}>{b.name}</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#E11D48' }}>{display}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              backgroundColor: '#FFF1F2',
                              color: '#BE123C',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Format: {clean}
                          </span>
                          {pastOrderCount > 0 && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {pastOrderCount} Geçmiş Sipariş
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '3px', fontWeight: 600 }}>
                          Sebep: {b.reason} • {new Date(b.bannedAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUnban(clean)}
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #BBF7D0',
                        fontWeight: 800,
                        fontSize: '12px',
                        padding: '9px 18px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Engeli Kaldır (Affet)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
