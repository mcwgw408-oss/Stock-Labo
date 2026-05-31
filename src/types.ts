export type Importance = 1 | 2 | 3;

export type StockStatus = 'buy' | 'check' | 'safe';

export type StockItem = {
  id: string;
  name: string;
  category: string;
  currentCount: number;
  minimumCount: number;
  reserveCount: number;
  unit: string;
  importance: Importance;
  price: number;
  purchaseDate: string;
  store: string;
  note: string;
  consumptionMemo: string;
  future?: {
    usedUpDate?: string;
    consumptionPeriodDays?: number;
    averageDurationDays?: number;
    nextPurchasePredictionDate?: string;
  };
};

export type StockDraft = Omit<StockItem, 'id' | 'future'>;

export type ShoppingListCandidate = Pick<
  StockItem,
  'id' | 'name' | 'category' | 'importance' | 'currentCount' | 'minimumCount' | 'unit'
>;
