'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Package,
  Bike,
  Building2,
  Store,
  ChevronDown,
  Minimize2,
  Maximize2,
  Bot,
} from 'lucide-react';
import { Order, Product, DeliveryZone, DormitoryConfig, SystemSettings } from '@/types';

interface AdminAIAssistantProps {
  orders: Order[];
  products: Product[];
  zones: DeliveryZone[];
  dorms: DormitoryConfig[];
  settings: SystemSettings;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onSaveProduct: (product: Product) => void;
  onToggleProductAvailability: (productId: string, currentStatus: boolean) => void;
  onUpdateZone: (id: string, updates: Partial<DeliveryZone>) => void;
  onUpdateDorm: (id: string, updates: Partial<DormitoryConfig>) => void;
  onToggleStoreOpen: (nextState: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionSummary?: string;
  timestamp: string;
}

export const AdminAIAssistant: React.FC<AdminAIAssistantProps> = ({
  orders,
  products,
  zones,
  dorms,
  settings,
  onStatusChange,
  onSaveProduct,
  onToggleProductAvailability,
  onUpdateZone,
  onUpdateDorm,
  onToggleStoreOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Selam! Ben Çağla AI Operasyon Ajanınız. Kuryeyken veya dükkandayken sesli ya da yazılı komut verebilirsiniz. Örneğin:\n• "Hubbi Hatun\'a giden son siparişi teslim edildi yap"\n• "500g yoğurt fiyatını 200 TL yap"\n• "KYK Yurtları min sepeti 80 TL yap"\n• "Dükkanı hemen aç"',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Recognition (Speech to Text)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setPrompt(transcript);
            handleSend(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız sesli komut algılamayı desteklemiyor (Chrome veya Safari önerilir).');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const executeActionLocally = (action: { tool: string; arguments: any }): string => {
    const { tool, arguments: args } = action;

    if (tool === 'update_order_status') {
      const ident = (args.orderIdentifier || '').toLowerCase();
      let matchedOrder: Order | undefined;

      if (ident.includes('son') || ident.includes('last')) {
        // Find latest order matching location or just latest pending/on_the_way
        if (ident.includes('hubbi')) {
          matchedOrder = orders.find((o) =>
            (o.address?.dormName || o.address?.title || '').toLowerCase().includes('hubbi')
          );
        } else if (ident.includes('bahaddin')) {
          matchedOrder = orders.find((o) =>
            (o.address?.dormName || o.address?.title || '').toLowerCase().includes('bahaddin')
          );
        } else {
          matchedOrder = orders[0];
        }
      } else {
        matchedOrder = orders.find((o) => {
          const num = o.orderNumber?.toLowerCase() || '';
          const name = o.customerName?.toLowerCase() || '';
          const dorm = (o.address?.dormName || o.address?.title || '').toLowerCase();
          return (
            num.includes(ident) ||
            name.includes(ident) ||
            dorm.includes(ident) ||
            o.id.toLowerCase().includes(ident)
          );
        });
      }

      if (matchedOrder) {
        onStatusChange(matchedOrder.id, args.newStatus);
        const statusMap: Record<string, string> = {
          preparing: 'Hazırlanıyor',
          on_the_way: 'Kurye Yolda',
          delivered: 'Teslim Edildi',
          cancelled: 'İptal Edildi',
        };
        return `✅ #${matchedOrder.orderNumber || matchedOrder.id.slice(-4)} (${matchedOrder.customerName} - ${matchedOrder.address?.dormName || matchedOrder.address?.title}) durumu "${statusMap[args.newStatus] || args.newStatus}" yapıldı.`;
      } else {
        return `⚠️ "${args.orderIdentifier}" ile eşleşen aktif bir sipariş bulunamadı.`;
      }
    }

    if (tool === 'update_product_price') {
      const q = (args.productQuery || '').toLowerCase();
      const matchedProd = products.find(
        (p) => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
      );

      if (matchedProd) {
        const updated: Product = {
          ...matchedProd,
          price: Number(args.newPrice) || matchedProd.price,
          discountPrice: args.newDiscountPrice ? Number(args.newDiscountPrice) : matchedProd.discountPrice,
        };
        onSaveProduct(updated);
        return `✅ "${matchedProd.name}" fiyatı ₺${args.newPrice}${args.newDiscountPrice ? ` (İndirimli: ₺${args.newDiscountPrice})` : ''} olarak güncellendi.`;
      } else {
        return `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`;
      }
    }

    if (tool === 'toggle_product_stock') {
      const q = (args.productQuery || '').toLowerCase();
      const matchedProd = products.find((p) => p.name.toLowerCase().includes(q));

      if (matchedProd) {
        onToggleProductAvailability(matchedProd.id, matchedProd.isAvailable);
        return `✅ "${matchedProd.name}" ürünü ${args.isAvailable ? 'Satışta (Stokta)' : 'Tükendi'} olarak işaretlendi.`;
      } else {
        return `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`;
      }
    }

    if (tool === 'update_zone_min_order') {
      const zName = (args.zoneName || '').toLowerCase();
      const matchedZone = zones.find((z) => z.name.toLowerCase().includes(zName));

      if (matchedZone) {
        onUpdateZone(matchedZone.id, {
          minOrderAmount: Number(args.minOrderAmount) || matchedZone.minOrderAmount,
          deliveryFee: args.deliveryFee ? Number(args.deliveryFee) : matchedZone.deliveryFee,
        });
        return `✅ "${matchedZone.name}" bölgesi min sepet tutarı ₺${args.minOrderAmount} olarak güncellendi.`;
      } else {
        return `⚠️ "${args.zoneName}" isimli teslimat bölgesi bulunamadı.`;
      }
    }

    if (tool === 'update_dorm_override') {
      const dName = (args.dormName || '').toLowerCase();
      const matchedDorm = dorms.find((d) => d.name.toLowerCase().includes(dName));

      if (matchedDorm) {
        onUpdateDorm(matchedDorm.id, {
          minOrderAmount: args.minOrderAmount ? Number(args.minOrderAmount) : matchedDorm.minOrderAmount,
          discountPercentage: args.discountPercentage !== undefined ? Number(args.discountPercentage) : matchedDorm.discountPercentage,
          specialNote: args.specialNote || matchedDorm.specialNote,
        });
        return `✅ "${matchedDorm.name}" yurduna özel min sepet: ₺${args.minOrderAmount || 'varsayılan'}, indirim: %${args.discountPercentage || 0} tanımlandı.`;
      } else {
        return `⚠️ "${args.dormName}" isimli yurt bulunamadı.`;
      }
    }

    if (tool === 'toggle_store_status') {
      onToggleStoreOpen(Boolean(args.isOpen));
      return `✅ Dükkan durumu ${args.isOpen ? 'AÇIK (Sipariş alınıyor)' : 'KAPALI (Sipariş alımı durduruldu)'} olarak güncellendi.`;
    }

    return `İşlem tamamlandı: ${tool}`;
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          context: {
            orders,
            products,
            zones,
            dorms,
            settings,
          },
        }),
      });

      const data = await res.json();

      let actionLog = '';
      if (data.actionTaken) {
        actionLog = executeActionLocally(data.actionTaken);
      }

      const assistantMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        text: data.assistantMessage || 'İşleminiz tamamlandı.',
        actionSummary: actionLog,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'Üzgünüm, komut işlenirken bir bağlantı hatası oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🚀 Hubbi Hatun son siparişi teslim edildi yap', text: 'Hubbi Hatun yurduna giden son siparişi teslim edildi yap' },
    { label: '🥛 Yoğurt fiyatını 200 TL yap', text: 'Yoğurt fiyatını 200 TL yap' },
    { label: '🏢 KYK Yurtları min sepeti 80 TL yap', text: 'KYK Yurtları bölgesinin min sepet tutarını 80 TL yap' },
    { label: '🏪 Dükkanı hemen aç', text: 'Çağla Büfe dükkanını hemen aç' },
  ];

  return (
    <>
      {/* Floating Railway-Style Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '24px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: '1.5px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), 0 0 20px rgba(93, 62, 188, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(93, 62, 188, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.4), 0 0 20px rgba(93, 62, 188, 0.4)';
          }}
          title="Çağla Railway AI Asistanını Aç (Sesli & Yazılı Operasyon Komutları)"
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
            }}
          >
            <Sparkles size={16} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>Çağla AI Ajanı</span>
              <span style={{ fontSize: '9px', backgroundColor: '#10B981', color: '#064E3B', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Railway tarzı otonom asistan</div>
          </div>
        </button>
      )}

      {/* Railway Agent Modal / Console */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            width: isMinimized ? '320px' : '440px',
            maxWidth: 'calc(100vw - 32px)',
            height: isMinimized ? '58px' : '580px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: '#0F172A',
            borderRadius: '20px',
            border: '1.5px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(93, 62, 188, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.25s ease, width 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isMinimized ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (isMinimized) setIsMinimized(false);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED, #10B981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={17} color="#FFFFFF" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Çağla Operasyon Ajanı</span>
                  <span style={{ fontSize: '9px', backgroundColor: '#10B98120', color: '#34D399', border: '1px solid #10B98140', padding: '1px 5px', borderRadius: '4px' }}>
                    GPT-4o
                  </span>
                </h4>
                <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#94A3B8' }}>
                  Kurye &amp; Yönetim Sesli Komut Sistemi
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
                title={isMinimized ? 'Genişlet' : 'Küçült'}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
                title="Kapat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: isUser ? '#5D3EBC' : '#1E293B',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          lineHeight: '1.45',
                          whiteSpace: 'pre-wrap',
                          border: isUser ? 'none' : '1px solid #334155',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      >
                        {m.text}
                      </div>

                      {/* Action summary badge if action was taken */}
                      {m.actionSummary && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            backgroundColor: '#064E3B',
                            color: '#6EE7B7',
                            border: '1px solid #059669',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <CheckCircle2 size={14} color="#34D399" />
                          <span>{m.actionSummary}</span>
                        </div>
                      )}

                      <span style={{ fontSize: '9px', color: '#64748B', alignSelf: isUser ? 'flex-end' : 'flex-start', margin: '0 4px' }}>
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })}

                {loading && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#1E293B', borderRadius: '16px', color: '#94A3B8', fontSize: '12px', border: '1px solid #334155' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'ping 1s infinite' }} />
                    <span>Komut işleniyor &amp; sistem güncelleniyor...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid #1E293B',
                  backgroundColor: '#0B132B',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(qp.text);
                      handleSend(qp.text);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '14px',
                      backgroundColor: '#1E293B',
                      color: '#CBD5E1',
                      border: '1px solid #334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1E293B';
                      e.currentTarget.style.color = '#CBD5E1';
                    }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#1E293B',
                  borderTop: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: isListening ? '#EF4444' : '#334155',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    animation: isListening ? 'pulse 1s infinite' : 'none',
                  }}
                  title={isListening ? 'Dinleniyor... (Durdurmak için tıklayın)' : 'Sesli Komut Ver (Mikrofon)'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <input
                  type="text"
                  placeholder={isListening ? '🎙️ Konuşun, dinleniyor...' : 'Örn: Hubbi Hatun son siparişi teslim et...'}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    backgroundColor: '#0F172A',
                    border: isListening ? '1.5px solid #EF4444' : '1px solid #475569',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: prompt.trim() ? '#5D3EBC' : '#334155',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: prompt.trim() && !loading ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                    flexShrink: 0,
                  }}
                  title="Komutu Gönder"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
