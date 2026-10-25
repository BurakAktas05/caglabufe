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
import { normalizeTurkish, smartMatchProducts } from '@/lib/searchEngine';

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

interface DisambiguationOption {
  id: string;
  name: string;
  subText?: string;
  currentPrice?: number;
  isAvailable?: boolean;
  minOrderAmount?: number;
}

interface DisambiguationData {
  type: 'product_price' | 'product_stock' | 'dorm_select' | 'amount_select';
  targetId?: string;
  targetName?: string;
  newPrice?: number;
  newDiscountPrice?: number;
  minOrderAmount?: number;
  isAvailable?: boolean;
  options: DisambiguationOption[];
}

interface LocalActionResult {
  summary: string;
  isQuestion?: boolean;
  disambiguation?: DisambiguationData;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionSummary?: string;
  disambiguation?: DisambiguationData;
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
      text: 'Selam! Ben Çağla Operasyon Asistanınız. Kuryeyken veya dükkandayken sesli ya da yazılı komut verebilirsiniz. Örneğin:\n• "Hubbi Hatun\'a giden son siparişi teslim edildi yap"\n• "500g yoğurt fiyatını 200 TL yap"\n• "Yurdun min tutarını artır"\n• "Dükkanı hemen aç"',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);



  const handleSelectDisambiguation = (
    data: DisambiguationData,
    chosen: DisambiguationOption
  ) => {
    if (data.type === 'dorm_select') {
      const dormId = chosen.id;
      const dormName = chosen.name;
      const targetMin = data.minOrderAmount;

      if (targetMin !== undefined && targetMin > 0) {
        if (dormId === 'all_kyk') {
          const kykZone = zones.find(
            (z) => z.id === 'zone-kyk-yurtlari' || normalizeTurkish(z.name).includes('kyk') || normalizeTurkish(z.name).includes('yurt')
          );
          if (kykZone) {
            onUpdateZone(kykZone.id, { minOrderAmount: targetMin });
          }
          dorms.forEach((d) => {
            if (d.zoneId === 'zone-kyk-yurtlari' && d.minOrderAmount) {
              onUpdateDorm(d.id, { minOrderAmount: targetMin });
            }
          });
          const confirmMsg: ChatMessage = {
            id: 'cfm_' + Date.now(),
            sender: 'assistant',
            text: `İşlem tamamlandı: Tüm KYK Yurtları seçildi.`,
            actionSummary: `✅ Tüm KYK Yurtları teslimat bölgesi minimum sepet tutarı ₺${targetMin} olarak güncellendi.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, confirmMsg]);
        } else {
          onUpdateDorm(dormId, { minOrderAmount: targetMin });
          const confirmMsg: ChatMessage = {
            id: 'cfm_' + Date.now(),
            sender: 'assistant',
            text: `İşlem tamamlandı: "${dormName}" seçildi.`,
            actionSummary: `✅ "${dormName}" yurduna özel minimum sepet tutarı ₺${targetMin} olarak güncellendi.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, confirmMsg]);
        }
      } else {
        const currentMin = chosen.minOrderAmount || 60;
        const askAmountMsg: ChatMessage = {
          id: 'ask_' + Date.now(),
          sender: 'assistant',
          text: `❓ "${dormName}" için yeni minimum sepet tutarını belirleyin (Mevcut: ₺${currentMin}):`,
          disambiguation: {
            type: 'amount_select',
            targetId: dormId,
            targetName: dormName,
            options: [
              { id: 'inc_15', name: `+₺15 Artır`, minOrderAmount: currentMin + 15 },
              { id: 'inc_25', name: `+₺25 Artır`, minOrderAmount: currentMin + 25 },
              { id: 'inc_50', name: `+₺50 Artır`, minOrderAmount: currentMin + 50 },
              { id: 'set_100', name: `₺100 Yap`, minOrderAmount: 100 },
              { id: 'set_150', name: `₺150 Yap`, minOrderAmount: 150 },
              { id: 'set_200', name: `₺200 Yap`, minOrderAmount: 200 },
            ].filter((opt) => opt.minOrderAmount !== currentMin),
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, askAmountMsg]);
      }
      return;
    }

    if (data.type === 'amount_select') {
      const dormId = data.targetId;
      const dormName = data.targetName || 'Yurt';
      const targetMin = chosen.minOrderAmount;
      if (!targetMin) return;

      if (dormId === 'all_kyk') {
        const kykZone = zones.find(
          (z) => z.id === 'zone-kyk-yurtlari' || normalizeTurkish(z.name).includes('kyk') || normalizeTurkish(z.name).includes('yurt')
        );
        if (kykZone) {
          onUpdateZone(kykZone.id, { minOrderAmount: targetMin });
        }
        dorms.forEach((d) => {
          if (d.zoneId === 'zone-kyk-yurtlari' && d.minOrderAmount) {
            onUpdateDorm(d.id, { minOrderAmount: targetMin });
          }
        });
        const confirmMsg: ChatMessage = {
          id: 'cfm_' + Date.now(),
          sender: 'assistant',
          text: `İşlem tamamlandı: Tüm KYK Yurtları seçildi.`,
          actionSummary: `✅ Tüm KYK Yurtları teslimat bölgesi minimum sepet tutarı ₺${targetMin} olarak güncellendi.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      } else if (dormId) {
        onUpdateDorm(dormId, { minOrderAmount: targetMin });
        const confirmMsg: ChatMessage = {
          id: 'cfm_' + Date.now(),
          sender: 'assistant',
          text: `İşlem tamamlandı: "${dormName}" seçildi.`,
          actionSummary: `✅ "${dormName}" yurduna özel minimum sepet tutarı ₺${targetMin} olarak güncellendi.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
      return;
    }

    const fullProd = products.find((p) => p.id === chosen.id);
    if (!fullProd) return;

    if (data.type === 'product_price' && data.newPrice !== undefined) {
      const updated: Product = {
        ...fullProd,
        price: data.newPrice,
        discountPrice: data.newDiscountPrice !== undefined ? data.newDiscountPrice : fullProd.discountPrice,
      };
      onSaveProduct(updated);

      const confirmMsg: ChatMessage = {
        id: 'cfm_' + Date.now(),
        sender: 'assistant',
        text: `İşlem onaylandı: "${fullProd.name}" seçildi.`,
        actionSummary: `✅ "${fullProd.name}" fiyatı ₺${data.newPrice} olarak güncellendi.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } else if (data.type === 'product_stock') {
      onToggleProductAvailability(fullProd.id, fullProd.isAvailable);
      const confirmMsg: ChatMessage = {
        id: 'cfm_' + Date.now(),
        sender: 'assistant',
        text: `İşlem onaylandı: "${fullProd.name}" seçildi.`,
        actionSummary: `✅ "${fullProd.name}" ürünü ${data.isAvailable ? 'Satışta' : 'Tükendi'} olarak işaretlendi.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }
  };

  const executeActionLocally = (action: { tool: string; arguments: any }): LocalActionResult => {
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
        return {
          summary: `✅ #${matchedOrder.orderNumber || matchedOrder.id.slice(-4)} (${matchedOrder.customerName} - ${matchedOrder.address?.dormName || matchedOrder.address?.title}) durumu "${statusMap[args.newStatus] || args.newStatus}" yapıldı.`,
        };
      } else {
        return {
          summary: `⚠️ "${args.orderIdentifier}" ile eşleşen aktif bir sipariş bulunamadı.`,
        };
      }
    }

    if (tool === 'update_product_price') {
      const rawQ = (args.productQuery || '').trim();
      
      // Smart matching with flavor/category separation (e.g. 'yoğurt' matches real yogurts, not chips)
      const matches = smartMatchProducts(products, args.productId || rawQ);

      if (matches.length === 1) {
        const matchedProd = matches[0];
        const updated: Product = {
          ...matchedProd,
          price: Number(args.newPrice) || matchedProd.price,
          discountPrice: args.newDiscountPrice ? Number(args.newDiscountPrice) : matchedProd.discountPrice,
        };
        onSaveProduct(updated);
        return {
          summary: `✅ "${matchedProd.name}" fiyatı ₺${args.newPrice}${args.newDiscountPrice ? ` (İndirimli: ₺${args.newDiscountPrice})` : ''} olarak güncellendi.`,
        };
      } else if (matches.length > 1) {
        return {
          summary: `❓ "${args.productQuery}" ile eşleşen ${matches.length} farklı ürün bulundu. Hangisinin fiyatını ₺${args.newPrice} yapmak istiyorsunuz?`,
          isQuestion: true,
          disambiguation: {
            type: 'product_price',
            newPrice: Number(args.newPrice),
            newDiscountPrice: args.newDiscountPrice ? Number(args.newDiscountPrice) : undefined,
            options: matches.slice(0, 8).map((p) => ({
              id: p.id,
              name: p.name,
              currentPrice: p.price,
            })),
          },
        };
      } else {
        return {
          summary: `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`,
        };
      }
    }

    if (tool === 'toggle_product_stock') {
      const rawQ = (args.productQuery || '').trim();
      const matches = smartMatchProducts(products, args.productId || rawQ);

      if (matches.length === 1) {
        const matchedProd = matches[0];
        onToggleProductAvailability(matchedProd.id, matchedProd.isAvailable);
        return {
          summary: `✅ "${matchedProd.name}" ürünü ${args.isAvailable ? 'Satışta (Stokta)' : 'Tükendi'} olarak işaretlendi.`,
        };
      } else if (matches.length > 1) {
        return {
          summary: `❓ "${args.productQuery}" ile eşleşen ${matches.length} farklı ürün bulundu. Hangisinin durumunu ${args.isAvailable ? 'Satışta' : 'Tükendi'} yapmak istiyorsunuz?`,
          isQuestion: true,
          disambiguation: {
            type: 'product_stock',
            isAvailable: Boolean(args.isAvailable),
            options: matches.slice(0, 8).map((p) => ({
              id: p.id,
              name: p.name,
              isAvailable: p.isAvailable,
            })),
          },
        };
      } else {
        return {
          summary: `⚠️ "${args.productQuery}" isimli ürün bulunamadı.`,
        };
      }
    }

    if (tool === 'update_zone_min_order') {
      const zName = (args.zoneName || '').toLowerCase();
      const normZName = normalizeTurkish(zName);
      const isDormZone = normZName.includes('yurt') || normZName.includes('kyk') || normZName === '';
      const matchedZone = zones.find((z) => {
        const zn = normalizeTurkish(z.name);
        if (isDormZone) return zn.includes('kyk') || zn.includes('yurt') || z.id === 'zone-kyk-yurtlari';
        return zn.includes(normZName);
      }) || (isDormZone ? zones.find((z) => z.id === 'zone-kyk-yurtlari') : undefined);

      if (matchedZone) {
        const currentMin = matchedZone.minOrderAmount || 60;
        let targetMin = Number(args.minOrderAmount);
        if (!targetMin || isNaN(targetMin) || targetMin <= 0) {
          targetMin = currentMin + 10;
        }

        onUpdateZone(matchedZone.id, {
          minOrderAmount: targetMin,
          deliveryFee: args.deliveryFee ? Number(args.deliveryFee) : matchedZone.deliveryFee,
        });
        return {
          summary: `✅ "${matchedZone.name}" bölgesi min sepet tutarı ₺${targetMin} olarak güncellendi.`,
        };
      } else {
        return {
          summary: `⚠️ "${args.zoneName}" isimli teslimat bölgesi bulunamadı.`,
        };
      }
    }

    if (tool === 'update_dorm_override') {
      const rawDName = (args.dormName || '').trim();
      const normDName = normalizeTurkish(rawDName);
      const kykZone = zones.find(
        (z) => z.id === 'zone-kyk-yurtlari' || normalizeTurkish(z.name).includes('kyk') || normalizeTurkish(z.name).includes('yurt')
      );
      const currentZoneMin = kykZone?.minOrderAmount || 60;
      const targetAmount = args.minOrderAmount ? Number(args.minOrderAmount) : undefined;

      // 1. Kullanıcı açıkça "tüm yurtlar", "hepsi", "tüm kyk" dediyse:
      const isAllDormsExplicit =
        normDName.includes('tum yurt') ||
        normDName.includes('butun yurt') ||
        normDName.includes('heps') ||
        normDName.includes('kyk bolge');

      if (isAllDormsExplicit) {
        if (targetAmount && targetAmount > 0) {
          if (kykZone) onUpdateZone(kykZone.id, { minOrderAmount: targetAmount });
          dorms.forEach((d) => {
            if (d.zoneId === 'zone-kyk-yurtlari' && d.minOrderAmount) {
              onUpdateDorm(d.id, { minOrderAmount: targetAmount });
            }
          });
          return {
            summary: `✅ Tüm KYK Yurtları teslimat bölgesi minimum sepet tutarı ₺${targetAmount} olarak güncellendi.`,
          };
        } else {
          return {
            summary: `❓ Tüm KYK Yurtları için hedef minimum sepet tutarını belirleyin (Mevcut: ₺${currentZoneMin}):`,
            isQuestion: true,
            disambiguation: {
              type: 'amount_select',
              targetId: 'all_kyk',
              targetName: 'Tüm KYK Yurtları',
              options: [
                { id: 'inc_15', name: '+₺15 Artır', minOrderAmount: currentZoneMin + 15 },
                { id: 'inc_25', name: '+₺25 Artır', minOrderAmount: currentZoneMin + 25 },
                { id: 'inc_50', name: '+₺50 Artır', minOrderAmount: currentZoneMin + 50 },
                { id: 'set_100', name: '₺100 Yap', minOrderAmount: 100 },
                { id: 'set_150', name: '₺150 Yap', minOrderAmount: 150 },
                { id: 'set_200', name: '₺200 Yap', minOrderAmount: 200 },
              ].filter((o) => o.minOrderAmount !== currentZoneMin),
            },
          };
        }
      }

      // 2. Belirli bir yurt adı söylenmiş mi kontrol et (dinamik, hardcoded isim yok):
      let matchedDorm: DormitoryConfig | undefined;
      if (rawDName && rawDName !== 'secim_gerekli' && rawDName !== 'yurt' && rawDName !== 'yurdun') {
        matchedDorm = dorms.find((d) => {
          const normFullName = normalizeTurkish(d.name);
          const normId = normalizeTurkish(d.id.replace(/-/g, ' '));
          const specificKeywords = normFullName
            .split(' ')
            .filter((w) => !['kyk', 'ogrenci', 'yurdu', 'kiz', 'erkek'].includes(w) && w.length >= 3);

          return (
            specificKeywords.some((kw) => normDName.includes(kw)) ||
            normFullName.includes(normDName) ||
            normDName.includes(normId) ||
            normDName.includes(normFullName)
          );
        });
      }

      // 3. Eğer belirli bir yurt bulunduysa:
      if (matchedDorm) {
        const currentMin =
          matchedDorm.minOrderAmount ||
          zones.find((z) => z.id === matchedDorm.zoneId)?.minOrderAmount ||
          currentZoneMin;

        if (targetAmount && targetAmount > 0) {
          onUpdateDorm(matchedDorm.id, {
            minOrderAmount: targetAmount,
            discountPercentage:
              args.discountPercentage !== undefined
                ? Number(args.discountPercentage)
                : matchedDorm.discountPercentage,
            specialNote: args.specialNote || matchedDorm.specialNote,
          });

          return {
            summary: `✅ "${matchedDorm.name}" yurduna özel minimum sepet tutarı ₺${targetAmount} olarak güncellendi.${
              args.discountPercentage ? ` (İndirim: %${args.discountPercentage})` : ''
            }`,
          };
        } else {
          return {
            summary: `❓ "${matchedDorm.name}" için hedef minimum sepet tutarını belirleyin (Mevcut: ₺${currentMin}):`,
            isQuestion: true,
            disambiguation: {
              type: 'amount_select',
              targetId: matchedDorm.id,
              targetName: matchedDorm.name,
              options: [
                { id: 'inc_15', name: '+₺15 Artır', minOrderAmount: currentMin + 15 },
                { id: 'inc_25', name: '+₺25 Artır', minOrderAmount: currentMin + 25 },
                { id: 'inc_50', name: '+₺50 Artır', minOrderAmount: currentMin + 50 },
                { id: 'set_100', name: '₺100 Yap', minOrderAmount: 100 },
                { id: 'set_150', name: '₺150 Yap', minOrderAmount: 150 },
                { id: 'set_200', name: '₺200 Yap', minOrderAmount: 200 },
              ].filter((o) => o.minOrderAmount !== currentMin),
            },
          };
        }
      }

      // 4. Belirli bir yurt söylenmemiş ("yurdun min sepetini artır", "yurt sepetini 200 yap" vb.):
      // KESİNLİKLE TAHMİN ETME, KULLANICIYA TÜM YURTLARI LİSTELE!
      return {
        summary: `❓ Hangi yurdun minimum sepet tutarını ${targetAmount ? `₺${targetAmount}` : 'güncellemek'} istiyorsunuz?`,
        isQuestion: true,
        disambiguation: {
          type: 'dorm_select',
          minOrderAmount: targetAmount,
          options: [
            {
              id: 'all_kyk',
              name: '🏢 Tüm KYK Yurtları (Genel Bölge)',
              subText: `Mevcut: ₺${currentZoneMin}`,
              minOrderAmount: currentZoneMin,
            },
            ...dorms.map((d) => {
              const currentMin = d.minOrderAmount || currentZoneMin;
              return {
                id: d.id,
                name: d.name,
                subText: `Mevcut: ₺${currentMin}`,
                minOrderAmount: currentMin,
              };
            }),
          ],
        },
      };
    }

    if (tool === 'toggle_store_status') {
      onToggleStoreOpen(Boolean(args.isOpen));
      return {
        summary: `✅ Dükkan durumu ${args.isOpen ? 'AÇIK (Sipariş alınıyor)' : 'KAPALI (Sipariş alımı durduruldu)'} olarak güncellendi.`,
      };
    }

    return {
      summary: `İşlem tamamlandı: ${tool}`,
    };
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

      let localRes: LocalActionResult | null = null;
      if (data.actionTaken) {
        localRes = executeActionLocally(data.actionTaken);
      } else {
        // Fallback for direct Turkish operational phrases if tool call was omitted by LLM
        const normPrompt = normalizeTurkish(textToSend);
        const numMatch = textToSend.match(/\b\d+(\.\d+)?\b/);
        const extractedAmount = numMatch ? Number(numMatch[0]) : undefined;

        // Yurt kontrolü (Hubbi, Bahaddin, Edebali vb.)
        const mentionedDorm = dorms.find((d) => {
          const normD = normalizeTurkish(d.name);
          const specific = normD.split(' ').filter((w) => !['kyk', 'ogrenci', 'yurdu', 'kiz', 'erkek'].includes(w) && w.length >= 3);
          return specific.some((kw) => normPrompt.includes(kw));
        });

        if (
          (normPrompt.includes('yurt') || normPrompt.includes('kyk') || mentionedDorm) &&
          (normPrompt.includes('artir') || normPrompt.includes('yukselt') || normPrompt.includes('zam') || normPrompt.includes('min') || normPrompt.includes('sepet') || normPrompt.includes('yap'))
        ) {
          localRes = executeActionLocally({
            tool: 'update_dorm_override',
            arguments: {
              dormName: mentionedDorm ? mentionedDorm.name : 'secim_gerekli',
              minOrderAmount: extractedAmount,
            },
          });
        }

        // Ürün fiyat güncelleme fallback'i (örn: "Yoğurt fiyatını 200 TL yap")
        if (
          !localRes &&
          extractedAmount &&
          (normPrompt.includes('fiyat') || normPrompt.includes('tl') || normPrompt.includes('lira') || normPrompt.includes('zam') || normPrompt.includes('yap'))
        ) {
          const productMatches = smartMatchProducts(products, textToSend);
          if (productMatches.length > 0) {
            localRes = executeActionLocally({
              tool: 'update_product_price',
              arguments: {
                productQuery: textToSend,
                newPrice: extractedAmount,
              },
            });
          }
        }

        // Ürün stok durumu fallback'i (örn: "Kola tükendi", "Red Bull stokta")
        if (
          !localRes &&
          (normPrompt.includes('tukendi') || normPrompt.includes('bitti') || normPrompt.includes('stokta') || normPrompt.includes('satista') || normPrompt.includes('yok'))
        ) {
          const isAvail = normPrompt.includes('stokta') || normPrompt.includes('satista');
          const productMatches = smartMatchProducts(products, textToSend);
          if (productMatches.length > 0) {
            localRes = executeActionLocally({
              tool: 'toggle_product_stock',
              arguments: {
                productQuery: textToSend,
                isAvailable: isAvail,
              },
            });
          }
        }
      }

      const assistantMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        text: localRes?.isQuestion ? localRes.summary : (data.assistantMessage || 'İşleminiz tamamlandı.'),
        actionSummary: localRes && !localRes.isQuestion ? localRes.summary : undefined,
        disambiguation: localRes?.disambiguation,
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

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tarayıcınız sesli komut algılamayı desteklemiyor. Google Chrome, Microsoft Edge veya Apple Safari kullanabilirsiniz.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let recognizedText = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            recognizedText += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        const currentText = (recognizedText || interim).trim();
        if (currentText) {
          setPrompt(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Speech Recognition Error]', event.error);
        setIsListening(false);
        recognitionRef.current = null;
        if (event.error === 'not-allowed') {
          alert('Mikrofon erişim izni verilmedi. Lütfen tarayıcınızın adres çubuğundaki kilit simgesine tıklayarak mikrofon iznine "İzin Ver" seçeneğini aktif edin.');
        } else if (event.error === 'network') {
          alert('Ses tanıma servisi için internet bağlantısı gerekiyor.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        const textToSubmit = recognizedText.trim();
        if (textToSubmit) {
          handleSend(textToSubmit);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[Speech Start Error]', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const quickPrompts = [
    { label: '🚀 Hubbi Hatun son siparişi teslim et', text: 'Hubbi Hatun yurduna giden son siparişi teslim edildi yap' },
    { label: '📈 Yurdun min tutarını artır (+10₺)', text: 'Yurdun min tutarını artır' },
    { label: '🥛 Yoğurt fiyatını güncelle (Seçim)', text: 'Yoğurt fiyatını 200 TL yap' },
    { label: '🏪 Dükkanı hemen aç', text: 'Çağla Büfe dükkanını hemen aç' },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="admin-ai-fab-btn"
          title="Çağla Asistan (Sesli & Yazılı Operasyon Komutları)"
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} color="#FFFFFF" />
          </div>
          <div className="admin-ai-fab-text" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>Çağla Asistan</span>
              <span style={{ fontSize: '9px', backgroundColor: '#10B981', color: '#064E3B', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Operasyon &amp; Kurye</div>
          </div>
        </button>
      )}

      {/* Assistant Modal / Console */}
      {isOpen && (
        <div className={`admin-ai-modal ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
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
                  flexShrink: 0,
                }}
              >
                <Sparkles size={17} color="#FFFFFF" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Çağla Asistan</span>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                </h4>
                <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#94A3B8' }}>
                  Kurye &amp; Operasyon Yönetimi
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
                  padding: '6px',
                  borderRadius: '6px',
                }}
                title={isMinimized ? 'Genişlet' : 'Küçült'}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
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
                  padding: '6px',
                  borderRadius: '6px',
                }}
                title="Kapat"
              >
                <X size={18} />
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

                      {/* Interactive Disambiguation Options if multiple products matched */}
                      {m.disambiguation && m.disambiguation.options && m.disambiguation.options.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '6px',
                            padding: '10px',
                            borderRadius: '12px',
                            backgroundColor: '#0F172A',
                            border: '1.5px solid #6366F1',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>
                              {m.disambiguation?.type === 'dorm_select'
                                ? '👉 Lütfen işlem yapılacak yurdu seçin:'
                                : m.disambiguation?.type === 'amount_select'
                                ? '👉 Hedef minimum sepet tutarını seçin:'
                                : '👉 Lütfen hedef ürünü seçin:'}
                            </span>
                          </div>
                          {m.disambiguation.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectDisambiguation(m.disambiguation!, opt)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                backgroundColor: '#1E293B',
                                border: '1px solid #334155',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#312E81';
                                e.currentTarget.style.borderColor = '#818CF8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#1E293B';
                                e.currentTarget.style.borderColor = '#334155';
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{opt.name}</span>
                              {m.disambiguation?.type === 'product_price' && (
                                <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  ₺{opt.currentPrice} → ₺{m.disambiguation.newPrice}
                                </span>
                              )}
                              {m.disambiguation?.type === 'product_stock' && (
                                <span style={{ fontSize: '11px', color: m.disambiguation.isAvailable ? '#34D399' : '#EF4444', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {m.disambiguation.isAvailable ? 'Satışta Yap' : 'Tükendi Yap'}
                                </span>
                              )}
                              {m.disambiguation?.type === 'dorm_select' && (
                                <span style={{ fontSize: '11px', color: '#818CF8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  {opt.subText || `₺${opt.minOrderAmount}`}
                                  {m.disambiguation.minOrderAmount ? ` → ₺${m.disambiguation.minOrderAmount}` : ''}
                                </span>
                              )}
                              {m.disambiguation?.type === 'amount_select' && (
                                <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  ₺{opt.minOrderAmount}
                                </span>
                              )}
                            </button>
                          ))}
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

              {/* Active Voice Listening Banner */}
              {isListening && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderTop: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#FCA5A5',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#EF4444',
                        boxShadow: '0 0 8px #EF4444',
                        display: 'inline-block',
                      }}
                    />
                    <span>🎙️ Dinleniyor... Komutunuzu söyleyin (bitince otomatik algılanır)</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Durdur
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#1E293B',
                  borderTop: isListening ? 'none' : '1px solid #334155',
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
                    backgroundColor: isListening ? '#DC2626' : '#334155',
                    color: '#FFFFFF',
                    border: isListening ? '2px solid #FCA5A5' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.7)' : 'none',
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

      {/* Responsive Styles for Floating Assistant */}
      <style jsx global>{`
        .admin-ai-fab-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 9999px;
          background-color: #0F172A;
          color: #FFFFFF;
          border: 1.5px solid #334155;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4), 0 0 20px rgba(93, 62, 188, 0.35);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
        }
        .admin-ai-fab-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 28px rgba(93, 62, 188, 0.5);
        }

        .admin-ai-modal {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          width: 430px;
          max-width: calc(100vw - 32px);
          height: 570px;
          max-height: calc(100vh - 48px);
          background-color: #0F172A;
          border-radius: 20px;
          border: 1.5px solid #334155;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(93, 62, 188, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: height 0.25s ease, width 0.25s ease;
        }
        .admin-ai-modal.minimized {
          width: 300px;
          height: 56px;
        }

        @media (max-width: 640px) {
          .admin-ai-fab-btn {
            bottom: 74px !important; /* Safely above the 60px bottom dock */
            right: 14px !important;
            padding: 0 !important;
            width: 48px !important;
            height: 48px !important;
            border-radius: 50% !important;
            justify-content: center !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(93, 62, 188, 0.5) !important;
          }
          .admin-ai-fab-text {
            display: none !important;
          }
          .admin-ai-modal {
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 72vh !important;
            max-height: 82vh !important;
            border-radius: 20px 20px 0 0 !important;
            border-bottom: none !important;
          }
          .admin-ai-modal.minimized {
            bottom: 64px !important;
            left: 10px !important;
            right: 10px !important;
            width: calc(100% - 20px) !important;
            height: 50px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </>
  );
};
