import { createInitialItems } from './data';
import type { StockCategory, StockItem, UsageHistory } from './types';

const STORAGE_KEY = 'stock-labo-items-v1';

export const categoryOptions: StockCategory[] = ['主食', '冷蔵', '冷凍', '飲料', '日用品', '洗剤', '医療', 'その他'];

const categoryMap: Record<string, StockCategory> = {
  食品: '主食',
  冷凍食品: '冷凍',
  衛生用品: '日用品',
  ペット: 'その他',
  主食: '主食',
  冷蔵: '冷蔵',
  冷凍: '冷凍',
  飲料: '飲料',
  日用品: '日用品',
  洗剤: '洗剤',
  医療: '医療',
  その他: 'その他',
};

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

const normalizeCategory = (category: unknown): StockCategory => {
  if (typeof category !== 'string') return 'その他';
  return categoryMap[category] || 'その他';
};

const normalizeHistory = (history: unknown): UsageHistory[] => {
  if (!Array.isArray(history)) return [];

  return history.map((entry) => ({
    id: entry.id || crypto.randomUUID(),
    itemName: entry.itemName || '',
    category: normalizeCategory(entry.category),
    quantity: Number(entry.quantity || 0),
    unit: entry.unit || '',
    purchaseDate: entry.purchaseDate || '',
    startedDate: entry.startedDate || '',
    endedDate: entry.endedDate || '',
    durationDays: Number(entry.durationDays || 0),
    memo: entry.memo || '',
  }));
};

const normalizeItem = (item: Partial<StockItem>): StockItem => ({
  id: item.id || crypto.randomUUID(),
  name: item.name || '',
  category: normalizeCategory(item.category),
  currentCount: Number(item.currentCount || 0),
  minimumCount: Number(item.minimumCount || 0),
  reserveCount: Number(item.reserveCount || 0),
  unit: item.unit || '',
  importance: item.importance === 1 || item.importance === 2 || item.importance === 3 ? item.importance : 1,
  price: Number(item.price || 0),
  purchaseDate: item.purchaseDate || '',
  startedDate: item.startedDate || '',
  endedDate: item.endedDate || item.future?.usedUpDate || '',
  durationDays: Number(item.durationDays || item.future?.consumptionPeriodDays || 0),
  store: item.store || '',
  note: item.note || '',
  consumptionMemo: item.consumptionMemo || '',
  usageHistory: normalizeHistory(item.usageHistory),
  future: item.future || {},
});
