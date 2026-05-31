export type Importance = 1 | 2 | 3;

export type StockStatus = 'buy' | 'check' | 'safe';

export type StockCategory = '主食' | '冷蔵' | '冷凍' | '飲料' | '日用品' | '洗剤' | '医療' | 'その他';

export type UsageHistory = {
  id: string;
  itemName: string;
  category: StockCategory;
  quantity: number;
  unit: string;
  purchaseDate: string;
  startedDate: string;
  endedDate: string;
  durationDays: number;
  memo: string;
};

export type StockItem = {
  id: string;
  name: string;
  category: StockCategory;
  currentCount: number;
  minimumCount: number;
  reserveCount: number;
  unit: string;
  importance: Importance;
  price: number;
  purchaseDate: string;
  startedDate: string;
  endedDate: string;
  durationDays: number;
  store: string;
  note: string;
  consumptionMemo: string;
  usageHistory: UsageHistory[];
  future?: {
    usedUpDate?: string;
    consumptionPeriodDays?: number;
    averageDurationDays?: number;
    nextPurchasePredictionDate?: string;
  };
};

export type StockDraft = Omit<StockItem, 'id' | 'future' | 'endedDate' | 'durationDays' | 'usageHistory'>;

export type ShoppingListCandidate = Pick<
  StockItem,
  'id' | 'name' | 'category' | 'importance' | 'currentCount' | 'minimumCount' | 'unit'
>;
