import { createInitialItems } from './data';
import type { StockItem } from './types';

const STORAGE_KEY = 'stock-labo-items-v1';

export const loadItems = (): StockItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialItems();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return createInitialItems();
    }

    return parsed.map(normalizeItem);
  } catch {
    return createInitialItems();
  }
};

export const saveItems = (items: StockItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const normalizeItem = (item: Partial<StockItem>): StockItem => ({
  id: item.id || crypto.randomUUID(),
  name: item.name || '',
  category: item.category || '未分類',
  currentCount: Number(item.currentCount || 0),
  minimumCount: Number(item.minimumCount || 0),
  reserveCount: Number(item.reserveCount || 0),
  unit: item.unit || '',
  importance: item.importance === 1 || item.importance === 2 || item.importance === 3 ? item.importance : 1,
  price: Number(item.price || 0),
  purchaseDate: item.purchaseDate || '',
  store: item.store || '',
  note: item.note || '',
  consumptionMemo: item.consumptionMemo || '',
  future: item.future || {},
});
