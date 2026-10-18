import { CategoryInfo, Product } from '@/types';

// Excel'den yüklenecek kategoriler için hazır liste
export const CATEGORIES: CategoryInfo[] = [];

// Canlı veritabanı bağlantısı (Supabase) kullanıldığı için ürünler doğrudan veritabanından çekilir.
export const INITIAL_PRODUCTS: Product[] = [];
