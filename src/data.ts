import type { Importance, StockCategory, StockItem } from './types';

type InitialStockSeed = {
  name: string;
  category: StockCategory;
  importance: Importance;
  note: string;
};

const seeds: InitialStockSeed[] = [
  {
    name: 'お米',
    category: '主食',
    importance: 3,
    note: '10kg購入。何日持つか検証中。',
  },
  {
    name: 'フルグラ',
    category: '主食',
    importance: 2,
    note: '8個購入。月何個使うか確認中。',
  },
  {
    name: 'ダストバッグ',
    category: '日用品',
    importance: 3,
    note: '前回は約5か月。',
  },
  {
    name: 'シャンプー',
    category: '日用品',
    importance: 2,
    note: '月1回まとめ買い候補。',
  },
  {
    name: 'トイレットペーパー',
    category: '日用品',
    importance: 3,
    note: 'ロール数と持続日数を確認したい。',
  },
  {
    name: '洗濯洗剤',
    category: '洗剤',
    importance: 3,
    note: '詰め替えまとめ買いの消費ペースを記録する。',
  },
  {
    name: '常備薬',
    category: '医療',
    importance: 3,
    note: '使用期限と補充タイミングを確認する。',
  },
  {
    name: '冷凍うどん',
    category: '冷凍',
    importance: 1,
    note: 'あると便利。減り方を見ておく。',
  },
  {
    name: 'ヨーグルト',
    category: '冷蔵',
    importance: 2,
    note: '何日ペースでなくなるか確認したい。',
  },
  {
    name: '水',
    category: '飲料',
    importance: 3,
    note: '箱買いしたときの消費ペースを記録する。',
  },
];

export const createInitialItems = (): StockItem[] =>
  seeds.map((seed, index) => ({
    id: `initial-${index + 1}`,
    name: seed.name,
    category: seed.category,
    currentCount: 0,
    minimumCount: 0,
    reserveCount: 0,
    unit: '',
    importance: seed.importance,
    price: 0,
    purchaseDate: '',
    startedDate: '',
    endedDate: '',
    durationDays: 0,
    store: '',
    note: seed.note,
    consumptionMemo: '',
    usageHistory: [],
    future: {},
  }));
