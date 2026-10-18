'use client';

import React, { useState } from 'react';
import { BannedUser } from '@/types';
import { Ban, ShieldCheck, Plus, UserX } from 'lucide-react';

interface AdminBannedUsersProps {
  bannedUsers: BannedUser[];
  onManualBan: (phone: string, name: string, reason: string) => void;
  onUnban: (phone: string) => void;
}

export const AdminBannedUsers: React.FC<AdminBannedUsersProps> = ({
  bannedUsers,
  onManualBan,
  onUnban,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('Kapıda teslim almadı / telefon açmadı');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    onManualBan(phone.trim(), name.trim() || 'Müşteri', reason.trim());
    setPhone('');
    setName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <UserX size={22} color="#DC2626" />
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#1F2937', margin: 0 }}>
            Kara Liste &amp; Engelli Numaralar ({bannedUsers.length})
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          Bu listede yer alan telefon numaraları sepete ürün ekleyip sipariş veremez. Kötü niyetli veya sahte sipariş veren numaraları buradan engelleyebilirsiniz.
        </p>

        {/* Manual Ban Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#FFF1F2',
            border: '1.5px dashed #FECDD3',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#9F1239', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} />
            <span>Manuel Numara Engelle</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <input
              type="text"
              placeholder="Telefon (Örn: 0530 000 00 00)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #FDA4AF', fontSize: '13px', backgroundColor: '#FFFFFF' }}
            />
            <input
              type="text"
              placeholder="Müşteri Adı (Opsiyonel)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #FDA4AF', fontSize: '13px', backgroundColor: '#FFFFFF' }}
            />
            <input
              type="text"
              placeholder="Engelleme Sebebi"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #FDA4AF', fontSize: '13px', backgroundColor: '#FFFFFF' }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '13px',
                borderRadius: '8px',
                padding: '9px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Ban size={15} />
              <span>Engelle</span>
            </button>
          </div>
        </form>

        {/* List */}
        {bannedUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
            <ShieldCheck size={40} color="#10B981" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>Kara Liste Temiz</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Şu anda engellenmiş hiçbir numara bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bannedUsers.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FEE2E2',
                  borderRadius: '12px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#FEE2E2',
                      color: '#E11D48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Ban size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#1F2937' }}>{b.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#E11D48' }}>{b.phone}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '2px', fontWeight: 600 }}>
                      Sebep: {b.reason} • {new Date(b.bannedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUnban(b.phone)}
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    border: '1px solid #BBF7D0',
                    fontWeight: 800,
                    fontSize: '12px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Engeli Kaldır</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
