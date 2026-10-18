'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Order,
  OrderStatus,
  Product,
  BannedUser,
  Campaign,
  DormitoryConfig,
  DeliveryZone,
  SystemSettings,
} from '@/types';
import {
  getStoredOrders,
  getStoredProducts,
  fetchOrders,
  fetchProducts,
  updateOrderStatus,
  updateStoredProductAvailability,
  saveOrUpdateProduct,
  deleteStoredProduct,
  subscribeToOrders,
  getStoredBannedUsers,
  fetchBannedUsers,
  banUser,
  unbanUser,
} from '@/lib/supabase';
import {
  getSystemSettings,
  saveSystemSettings,
  getCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  getDormitories,
  addDormitory,
  updateDormitory,
  deleteDormitory,
  getDeliveryZones,
  addDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  fetchSystemSettings,
  subscribeToSettings,
  isStoreOpen as checkStoreIsOpen,
} from '@/lib/settingsManager';
import { audioAlert, SoundPreset } from '@/lib/audioAlert';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from '@/lib/pushNotifications';
import { DigitalReceiptModal } from '@/components/DigitalReceipt';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminOrders } from '@/components/admin/tabs/AdminOrders';
import { AdminDailyReport } from '@/components/admin/tabs/AdminDailyReport';
import { AdminInventory } from '@/components/admin/tabs/AdminInventory';
import { AdminCampaigns } from '@/components/admin/tabs/AdminCampaigns';
import { AdminZones } from '@/components/admin/tabs/AdminZones';
import { AdminSettings } from '@/components/admin/tabs/AdminSettings';
import { AdminBannedUsers } from '@/components/admin/tabs/AdminBannedUsers';
import {
  Lock,
  ArrowLeft,
  TrendingUp,
  ReceiptText,
  Package,
  MapPin,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react';
import {
  getAdminLockoutStatus,
  recordAdminLoginAttempt,
  generateAdminSessionSignature,
  verifyAdminSessionSignature,
  normalizePhoneNumber,
  formatPhoneNumber,
} from '@/lib/security';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dorms, setDorms] = useState<DormitoryConfig[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [settings, setSettingsState] = useState<SystemSettings>(getSystemSettings());
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'on_the_way' | 'delivered'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState<string>('default');

  // Admin Security Barrier
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentSettings = getSystemSettings();
      const expectedPassword = currentSettings.adminPassword || 'cagla2024';
      const storedToken = sessionStorage.getItem('caglabufe_admin_auth');
      
      if (storedToken && verifyAdminSessionSignature(storedToken, expectedPassword)) {
        setIsAuthorized(true);
      } else if (storedToken) {
        sessionStorage.removeItem('caglabufe_admin_auth');
      }

      const lockout = getAdminLockoutStatus();
      if (lockout.isLocked) {
        setLockoutRemaining(lockout.remainingSeconds);
      }

      setNotificationPerm(getNotificationPermission());
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAuthError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check brute force lockout
    const lockout = getAdminLockoutStatus();
    if (lockout.isLocked) {
      setLockoutRemaining(lockout.remainingSeconds);
      setAuthError(`Yönetici paneli kilitli! Lütfen ${lockout.remainingSeconds} saniye sonra tekrar deneyiniz.`);
      return;
    }

    const currentSettings = getSystemSettings();
    const expectedPassword = currentSettings.adminPassword || 'cagla2024';

    if (adminPasswordInput === expectedPassword) {
      recordAdminLoginAttempt(true);
      setIsAuthorized(true);
      setAuthError('');
      setLockoutRemaining(0);
      if (typeof window !== 'undefined') {
        const token = generateAdminSessionSignature(expectedPassword);
        sessionStorage.setItem('caglabufe_admin_auth', token);
      }
    } else {
      const result = recordAdminLoginAttempt(false);
      if (!result.canLogin) {
        const updatedLockout = getAdminLockoutStatus();
        setLockoutRemaining(updatedLockout.remainingSeconds);
      }
      setAuthError(result.message || 'Hatalı şifre! Lütfen kontrol edip tekrar deneyiniz.');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthorized(false);
    setAdminPasswordInput('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('caglabufe_admin_auth');
    }
  };

  // Initial Data Load & Realtime Sync
  useEffect(() => {
    setOrders(getStoredOrders());
    setProducts(getStoredProducts());
    setBannedUsers(getStoredBannedUsers());
    setCampaigns(getCampaigns());
    setDorms(getDormitories());
    setZones(getDeliveryZones());

    // Asynchronously fetch latest data from Supabase
    fetchOrders().then((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) setOrders(liveOrders);
    });
    fetchProducts().then((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) setProducts(liveProducts);
    });
    fetchBannedUsers().then((liveBanned) => {
      if (liveBanned && liveBanned.length > 0) setBannedUsers(liveBanned);
    });
    fetchSystemSettings().then((liveSettings) => {
      if (liveSettings) setSettingsState(liveSettings);
    });

    const unsubSettings = subscribeToSettings((newSettings) => {
      setSettingsState(newSettings);
    });

    const unsubscribe = subscribeToOrders((newOrUpdatedOrder) => {
      setOrders((prev) => {
        const index = prev.findIndex((o) => o.id === newOrUpdatedOrder.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = newOrUpdatedOrder;
          return updated;
        }

        if (soundEnabled) {
          const currentSet = getSystemSettings();
          audioAlert.playNewOrderSound(
            (currentSet.soundPreset as SoundPreset) || 'bell',
            currentSet.soundVolume || 0.6,
            currentSet.soundRepeatCount || 2,
            currentSet.enableVibration ?? true
          );
        }

        showLocalNotification(
          `🔔 Yeni Sipariş! #${newOrUpdatedOrder.orderNumber}`,
          `${newOrUpdatedOrder.customerName} - ₺${newOrUpdatedOrder.finalAmount.toFixed(2)} (${newOrUpdatedOrder.address.dormName || newOrUpdatedOrder.address.district})`,
          '/admin'
        );

        return [newOrUpdatedOrder, ...prev];
      });
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, [soundEnabled]);

  // Order Handlers
  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    const updated = await updateOrderStatus(orderId, nextStatus);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      audioAlert.playStatusUpdateSound();
    }
  };

  const handleToggleProduct = (productId: string, currentStatus: boolean) => {
    const updated = updateStoredProductAvailability(productId, !currentStatus);
    setProducts(updated);
  };

  const handleSaveProduct = (p: Product) => {
    const updated = saveOrUpdateProduct(p);
    setProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = deleteStoredProduct(productId);
    setProducts(updated);
  };

  // Blacklist Handlers
  const handleBanCustomer = async (phone: string, name: string) => {
    const clean = normalizePhoneNumber(phone);
    const display = formatPhoneNumber(clean);
    const reason = prompt(
      `"${name}" (${display} [Sistem No: ${clean}]) için engelleme sebebi giriniz:`,
      'Kapıda teslim almadı / telefon açmadı'
    );
    if (!reason) return;
    await banUser(clean, name, reason);
    setBannedUsers(getStoredBannedUsers());
    alert(`"${name}" (${display}) başarıyla kara listeye alındı. Tüm 0507, 507, +90 varyasyonları engellendi.`);
  };

  const handleUnbanCustomer = async (phone: string) => {
    const clean = normalizePhoneNumber(phone);
    const display = formatPhoneNumber(clean);
    if (confirm(`"${display}" numarasının engelini kaldırmak istediğinize emin misiniz?`)) {
      await unbanUser(clean);
      setBannedUsers(getStoredBannedUsers());
    }
  };

  const handleManualBan = async (phone: string, name: string, reason: string) => {
    const clean = normalizePhoneNumber(phone);
    await banUser(clean, name, reason);
    setBannedUsers(getStoredBannedUsers());
  };

  // Campaign Handlers
  const handleAddCampaign = (camp: Omit<Campaign, 'id'>) => {
    addCampaign(camp);
    setCampaigns(getCampaigns());
  };

  const handleUpdateCampaign = (id: string, updates: Partial<Campaign>) => {
    updateCampaign(id, updates);
    setCampaigns(getCampaigns());
  };

  const handleDeleteCampaign = (id: string) => {
    deleteCampaign(id);
    setCampaigns(getCampaigns());
  };

  // Zone & Dorm Handlers
  const handleAddZone = (z: Omit<DeliveryZone, 'id'>) => {
    addDeliveryZone(z);
    setZones(getDeliveryZones());
  };

  const handleUpdateZone = (id: string, updates: Partial<DeliveryZone>) => {
    updateDeliveryZone(id, updates);
    setZones(getDeliveryZones());
  };

  const handleDeleteZone = (id: string) => {
    deleteDeliveryZone(id);
    setZones(getDeliveryZones());
  };

  const handleAddDorm = (d: Omit<DormitoryConfig, 'id'>) => {
    addDormitory(d);
    setDorms(getDormitories());
  };

  const handleUpdateDorm = (id: string, updates: Partial<DormitoryConfig>) => {
    updateDormitory(id, updates);
    setDorms(getDormitories());
  };

  const handleDeleteDorm = (id: string) => {
    deleteDormitory(id);
    setDorms(getDormitories());
  };

  // Settings Handlers
  const handleSaveSettings = async (newSettings: SystemSettings) => {
    setSettingsState(newSettings);
    await saveSystemSettings(newSettings);
  };

  const currentStoreIsOpen = checkStoreIsOpen(settings);

  const handleToggleStoreOpen = async () => {
    const nextState = !currentStoreIsOpen;
    const updated: SystemSettings = {
      ...settings,
      isManualOverride: true,
      isManuallyOpen: nextState,
    };
    await handleSaveSettings(updated);
  };

  const handleTestSound = () => {
    audioAlert.playNewOrderSound(
      (settings.soundPreset as SoundPreset) || 'bell',
      settings.soundVolume || 0.6,
      1,
      Boolean(settings.enableVibration)
    );
  };

  const handleRequestPushPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPerm(granted ? 'granted' : 'denied');
    if (granted) {
      showLocalNotification('Bildirimler Açık!', 'Artık yeni siparişleri kaçırmayacaksınız.');
    }
  };

  // Computed metrics
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === 'preparing'), [orders]);

  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0d23',
          backgroundImage: 'radial-gradient(circle at 50% 25%, #2e1065 0%, #0f0d23 85%)',
          padding: '20px',
          color: '#FFFFFF',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(30, 27, 75, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '38px 28px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(93, 62, 188, 0.4)',
              color: '#FFD10D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(255, 209, 13, 0.3)',
            }}
          >
            {lockoutRemaining > 0 ? <ShieldAlert size={28} color="#EF4444" /> : <Lock size={28} />}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', marginBottom: '6px' }}>
            {lockoutRemaining > 0 ? 'Panel Güvenlik Kilidinde' : 'Çağla Büfe Sipariş Masası'}
          </h2>
          <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '24px' }}>
            {lockoutRemaining > 0
              ? `Çok fazla başarısız deneme nedeniyle giriş geçici olarak engellendi. Kalan süre: ${lockoutRemaining} sn`
              : 'Mutfak canlı sipariş ekranı ve mağaza yönetimine erişmek için yönetici şifresini giriniz.'}
          </p>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#E0E7FF', display: 'block', marginBottom: '6px' }}>
                Yönetici Şifresi
              </label>
              <input
                type="password"
                placeholder={lockoutRemaining > 0 ? 'Giriş kilitlendi...' : 'Şifrenizi yazınız...'}
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                disabled={lockoutRemaining > 0}
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: lockoutRemaining > 0 ? '1.5px solid #EF4444' : '1.5px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: lockoutRemaining > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  letterSpacing: '2px',
                  outline: 'none',
                  opacity: lockoutRemaining > 0 ? 0.6 : 1,
                }}
              />
              {authError && (
                <span style={{ fontSize: '12px', color: '#F87171', marginTop: '6px', display: 'block', fontWeight: 700 }}>
                  {authError}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={lockoutRemaining > 0}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                backgroundColor: lockoutRemaining > 0 ? '#4B5563' : '#FFD10D',
                color: lockoutRemaining > 0 ? '#9CA3AF' : '#191919',
                fontWeight: 900,
                fontSize: '15px',
                border: 'none',
                cursor: lockoutRemaining > 0 ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                boxShadow: lockoutRemaining > 0 ? 'none' : '0 4px 18px rgba(255, 209, 13, 0.3)',
              }}
            >
              {lockoutRemaining > 0 ? `Kilitli (${lockoutRemaining}s)` : 'Panele Giriş Yap'}
            </button>

            <Link
              href="/"
              style={{
                fontSize: '13px',
                color: '#94A3B8',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} />
              <span>Müşteri Sayfasına Dön</span>
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F8', display: 'flex' }}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersCount={orders.length}
        pendingOrdersCount={pendingOrders.length}
        productsCount={products.length}
        campaignsCount={campaigns.length}
        bannedCount={bannedUsers.length}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={handleAdminLogout}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        storeOpen={currentStoreIsOpen}
      />

      <div
        className="admin-main-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <AdminHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          pendingCount={pendingOrders.length}
          preparingCount={preparingOrders.length}
          onTestSound={handleTestSound}
          isStoreOpen={currentStoreIsOpen}
          onToggleStoreOpen={handleToggleStoreOpen}
          onRequestNotificationPermission={handleRequestPushPermission}
          notificationPermission={notificationPerm}
        />

        <main className="admin-content-main" style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'orders' && (
            <AdminOrders
              orders={orders}
              bannedUsers={bannedUsers}
              onStatusChange={handleStatusChange}
              onBanCustomer={handleBanCustomer}
              onOpenReceipt={(o: Order) => setReceiptOrder(o)}
              filter={orderFilter}
              onFilterChange={setOrderFilter}
            />
          )}

          {activeTab === 'daily' && <AdminDailyReport orders={orders} />}

          {activeTab === 'inventory' && (
            <AdminInventory
              products={products}
              onToggleAvailability={handleToggleProduct}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'campaigns' && (
            <AdminCampaigns
              campaigns={campaigns}
              products={products}
              onAddCampaign={handleAddCampaign}
              onUpdateCampaign={handleUpdateCampaign}
              onDeleteCampaign={handleDeleteCampaign}
            />
          )}

          {activeTab === 'zones' && (
            <AdminZones
              zones={zones}
              dorms={dorms}
              onAddZone={handleAddZone}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
              onAddDorm={handleAddDorm}
              onUpdateDorm={handleUpdateDorm}
              onDeleteDorm={handleDeleteDorm}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings settings={settings} onSave={handleSaveSettings} />
          )}

          {activeTab === 'banned' && (
            <AdminBannedUsers
              bannedUsers={bannedUsers}
              orders={orders}
              onManualBan={handleManualBan}
              onUnban={handleUnbanCustomer}
            />
          )}
        </main>
      </div>

      {receiptOrder && (
        <DigitalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Admin Mobile Bottom Dock - Instant 1-thumb tab navigation on smartphones */}
      <nav className="admin-mobile-dock">
        <button
          type="button"
          className={`admin-dock-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          aria-label="Sipariş Masası"
        >
          <div className="admin-dock-icon">
            <TrendingUp size={20} />
            {pendingOrders.length > 0 && (
              <span className="admin-dock-badge">{pendingOrders.length}</span>
            )}
          </div>
          <span>Siparişler</span>
        </button>

        <button
          type="button"
          className={`admin-dock-item ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
          aria-label="Kasa ve Z Raporu"
        >
          <div className="admin-dock-icon">
            <ReceiptText size={20} />
          </div>
          <span>Kasa / Z</span>
        </button>

        <button
          type="button"
          className={`admin-dock-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          aria-label="Ürün ve Stok Yönetimi"
        >
          <div className="admin-dock-icon">
            <Package size={20} />
          </div>
          <span>Stok</span>
        </button>

        <button
          type="button"
          className={`admin-dock-item ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
          aria-label="Bölgeler ve Yurtlar"
        >
          <div className="admin-dock-icon">
            <MapPin size={20} />
          </div>
          <span>Bölgeler</span>
        </button>

        <button
          type="button"
          className={`admin-dock-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          aria-label="Mağaza Ayarları"
        >
          <div className="admin-dock-icon">
            <SettingsIcon size={20} />
          </div>
          <span>Ayarlar</span>
        </button>
      </nav>

      <style jsx global>{`
        .admin-content-main {
          padding: 14px 12px 60px;
        }
        @media (min-width: 640px) {
          .admin-content-main {
            padding: 18px 18px 60px;
          }
        }
        @media (min-width: 1024px) {
          .admin-main-wrapper {
            margin-left: 260px !important;
          }
          .admin-content-main {
            padding: 22px 24px 60px;
          }
        }
      `}</style>
    </div>
  );
}
