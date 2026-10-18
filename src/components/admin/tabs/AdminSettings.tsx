'use client';

import React, { useState } from 'react';
import { SystemSettings } from '@/types';
import {
  Clock,
  Phone,
  Volume2,
  MessageSquare,
  ShieldCheck,
  Save,
  Megaphone,
} from 'lucide-react';
import { audioAlert, SoundPreset } from '@/lib/audioAlert';

interface AdminSettingsProps {
  settings: SystemSettings;
  onSave: (newSettings: SystemSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings: initialSettings,
  onSave,
}) => {
  const [settings, setSettings] = useState<SystemSettings>({
    ...initialSettings,
    storeName: initialSettings.storeName || 'Çağla Büfe & Market',
    announcementText: initialSettings.announcementText || '🛵 Karabük & KYK Yurtlarına 20-30 dakikada hızlı teslimat! Soğuk içecek, çikolata, cips ve market ihtiyaçları kapınızda.',
    isAnnouncementActive: initialSettings.isAnnouncementActive ?? true,
    defaultDeliveryFee: initialSettings.defaultDeliveryFee ?? 15,
    soundPreset: initialSettings.soundPreset || 'bell',
    soundVolume: initialSettings.soundVolume ?? 0.6,
    soundRepeatCount: initialSettings.soundRepeatCount ?? 2,
    enableVibration: initialSettings.enableVibration ?? true,
    templateOrderReceived: initialSettings.templateOrderReceived || 'Siparişiniz alındı! #{orderNumber} nolu siparişiniz onaylandı.',
    templateOrderPreparing: initialSettings.templateOrderPreparing || 'Mutfakta hazırlanıyor! #{orderNumber} nolu siparişiniz fırından çıkmak üzere.',
    templateOrderOnTheWay: initialSettings.templateOrderOnTheWay || 'Kuryemiz yola çıktı! #{orderNumber} nolu siparişiniz ~10-15 dk içinde kapınızda.',
    templateOrderDelivered: initialSettings.templateOrderDelivered || 'Siparişiniz teslim edildi! Afiyet olsun, Çağla Büfe keyifli geceler diler.',
    templateWhatsApp: initialSettings.templateWhatsApp || 'Merhaba Çağla Büfe, {orderNumber} nolu {totalAmount} TL tutarındaki siparişim hakkında bilgi alabilir miyim?',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestSelectedSound = () => {
    audioAlert.playNewOrderSound(
      (settings.soundPreset as SoundPreset) || 'bell',
      settings.soundVolume || 0.6,
      1,
      Boolean(settings.enableVibration)
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {savedSuccess && (
        <div
          style={{
            backgroundColor: '#DCFCE7',
            border: '1.5px solid #86EFAC',
            color: '#15803D',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={18} />
          <span>Tüm ayarlar başarıyla güncellendi ve kaydedildi!</span>
        </div>
      )}

      {/* Store Branding & Dynamic Live Announcement Banner */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1.5px solid #FDE68A', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Megaphone size={18} color="#D97706" />
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>Mağaza Adı &amp; Canlı Duyuru Bandı</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
              İşletme / Mağaza Adı
            </label>
            <input
              type="text"
              placeholder="Çağla Büfe & Market"
              value={settings.storeName || ''}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                Canlı Duyuru Metni (Tüm sayfalarda üstte görünür)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.isAnnouncementActive ?? true}
                  onChange={(e) => setSettings({ ...settings, isAnnouncementActive: e.target.checked })}
                />
                <span>Aktif</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="🛵 Karabük & KYK Yurtlarına 20-30 dakikada sıcak teslimat!"
              value={settings.announcementText || ''}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Working Hours & Status */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={18} color="#5D3EBC" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>Çalışma Saatleri &amp; Durum</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Açılış Saati
                </label>
                <input
                  type="time"
                  value={settings.storeOpenTime}
                  onChange={(e) => setSettings({ ...settings, storeOpenTime: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Kapanış Saati (Gece)
                </label>
                <input
                  type="time"
                  value={settings.storeCloseTime}
                  onChange={(e) => setSettings({ ...settings, storeCloseTime: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Kapalıyken Gösterilecek Mesaj
              </label>
              <textarea
                rows={2}
                value={settings.closedMessage}
                onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', resize: 'none' }}
              />
            </div>

            <div style={{ padding: '12px', backgroundColor: '#F8F9FA', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={settings.isManualOverride}
                  onChange={(e) => setSettings({ ...settings, isManualOverride: e.target.checked })}
                />
                <span>Manuel Kontrol Aktif (Saatleri yok say)</span>
              </label>

              {settings.isManualOverride && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, isManualOverride: true, isManuallyOpen: true };
                      setSettings(updated);
                      onSave(updated);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      backgroundColor: settings.isManuallyOpen ? '#10B981' : '#E5E7EB',
                      color: settings.isManuallyOpen ? '#FFFFFF' : '#4B5563',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Mağazayı Açık Tut
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, isManualOverride: true, isManuallyOpen: false };
                      setSettings(updated);
                      onSave(updated);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      backgroundColor: !settings.isManuallyOpen ? '#EF4444' : '#E5E7EB',
                      color: !settings.isManuallyOpen ? '#FFFFFF' : '#4B5563',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Mağazayı Kapat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Sound & Audio Alerts */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1.5px solid #DDD6FE' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="#5D3EBC" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
                Sipariş Bildirim Sesi Ayarları
              </h3>
            </div>
            <button
              type="button"
              onClick={handleTestSelectedSound}
              style={{
                backgroundColor: '#5D3EBC',
                color: '#FFFFFF',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Volume2 size={14} />
              <span>Dene</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Zil Melodisi Seçimi
              </label>
              <select
                value={settings.soundPreset || 'bell'}
                onChange={(e) => setSettings({ ...settings, soundPreset: e.target.value as SoundPreset })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="bell">🔔 Getir / Trendyol Tarzı Canlı Üç Ton (Önerilen)</option>
                <option value="siren">🚨 Mutfak Acil Dikkat Alarmı (Kesik İki Ton)</option>
                <option value="chime">✨ Kristal Resepsiyon İki Ton (Yumuşak Melodi)</option>
                <option value="gentle">🎵 Ding Marimba (Tek Yumuşak Ping)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Zil Ses Seviyesi (Volume)
                </label>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#5D3EBC' }}>
                  %{Math.round((settings.soundVolume || 0.6) * 100)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.soundVolume || 0.6}
                onChange={(e) => setSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Yeni Siparişte Kaç Kez Çalsın?
              </label>
              <select
                value={settings.soundRepeatCount || 2}
                onChange={(e) => setSettings({ ...settings, soundRepeatCount: parseInt(e.target.value, 10) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value={1}>1 Kez Çalsın</option>
                <option value={2}>2 Kez Art Arda Çalsın (Standart)</option>
                <option value={3}>3 Kez Çalsın (Yoğun Mutfak İçin)</option>
                <option value={5}>5 Kez Çalsın (Uykuyu Bölme Modu)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#374151' }}>
              <input
                type="checkbox"
                checked={settings.enableVibration ?? true}
                onChange={(e) => setSettings({ ...settings, enableVibration: e.target.checked })}
              />
              <span>Cihaz Titreşimi (Destekleyen telefon & tabletlerde sarsıntı üret)</span>
            </label>
          </div>
        </div>

        {/* Contact Numbers */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Phone size={18} color="#10B981" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>İletişim & Büfe Bilgileri</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Büfe Telefonu (Aramalar için)
              </label>
              <input
                type="text"
                placeholder="0542 000 7878"
                value={settings.storePhone || ''}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                WhatsApp Sipariş Hattı (Ülke kodu ile: 90542...)
              </label>
              <input
                type="text"
                placeholder="905420007878"
                value={settings.storeWhatsApp || ''}
                onChange={(e) => setSettings({ ...settings, storeWhatsApp: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Büfe Açık Adresi
              </label>
              <input
                type="text"
                placeholder="100. Yıl Mah. 1003. Cad. No:12 Karabük"
                value={settings.storeAddress || ''}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Varsayılan Min. Sepet (₺)
                </label>
                <input
                  type="number"
                  value={settings.defaultMinOrder}
                  onChange={(e) => setSettings({ ...settings, defaultMinOrder: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Paket Teslimat Ücreti (₺)
                </label>
                <input
                  type="number"
                  value={settings.defaultDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Ücretsiz Teslimat Eşiği (₺)
                </label>
                <input
                  type="number"
                  value={settings.defaultFreeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, defaultFreeDeliveryThreshold: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Notification Message Templates */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <MessageSquare size={18} color="#2563EB" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>
              Bildirim & WhatsApp Şablonları
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
            Kullanabileceğiniz değişkenler: <code>{'{orderNumber}'}</code>, <code>{'{customerName}'}</code>, <code>{'{totalAmount}'}</code>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '2px' }}>
                1. Sipariş Alındı Bildirimi
              </label>
              <input
                type="text"
                value={settings.templateOrderReceived || ''}
                onChange={(e) => setSettings({ ...settings, templateOrderReceived: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '2px' }}>
                2. Hazırlanıyor Bildirimi
              </label>
              <input
                type="text"
                value={settings.templateOrderPreparing || ''}
                onChange={(e) => setSettings({ ...settings, templateOrderPreparing: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '2px' }}>
                3. Kurye Yola Çıktı Bildirimi
              </label>
              <input
                type="text"
                value={settings.templateOrderOnTheWay || ''}
                onChange={(e) => setSettings({ ...settings, templateOrderOnTheWay: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '2px' }}>
                4. Teslim Edildi Bildirimi
              </label>
              <input
                type="text"
                value={settings.templateOrderDelivered || ''}
                onChange={(e) => setSettings({ ...settings, templateOrderDelivered: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '2px' }}>
                5. WhatsApp İletişim Şablonu
              </label>
              <input
                type="text"
                value={settings.templateWhatsApp || ''}
                onChange={(e) => setSettings({ ...settings, templateWhatsApp: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        {/* Admin Password & Security */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={18} color="#DC2626" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>Yönetici Güvenliği</h3>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
              Admin Giriş Şifresi
            </label>
            <input
              type="password"
              value={settings.adminPassword}
              onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
            />
            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
              Varsayılan: <code>cagla2024</code>. Canlıya alırken güçlü bir şifre belirleyiniz.
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
        <button
          type="submit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#5D3EBC',
            color: '#FFFFFF',
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(93, 62, 188, 0.3)',
          }}
        >
          <Save size={18} />
          <span>Tüm Ayarları Kaydet</span>
        </button>
      </div>
    </form>
  );
};
