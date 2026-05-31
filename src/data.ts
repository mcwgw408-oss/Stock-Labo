import type { Importance, StockItem } from './types';

type InitialStockSeed = {
  name: string;
  category: string;
  importance: Importance;
  note: string;
};

const seeds: InitialStockSeed[] = [
  {
    name: 'お米',
    category: '食品',
    importance: 3,
    note: '10kg購入。何日持つか検証中。',
  },
  {
    name: 'フルグラ',
    category: '食品',
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
    name: '猫砂',
    category: 'ペット',
    importance: 3,
    note: '箱買いしたときの月使用量を確認する。',
  },
  {
    name: '冷凍うどん',
    category: '冷凍食品',
    importance: 1,
    note: 'あると便利。減り方を見ておく。',
  },
  {
    name: '歯ブラシ',
    category: '衛生用品',
    importance: 2,
    note: '家族分の交換ペースを記録する。',
  },
  {
    name: 'キッチンペーパー',
    category: '日用品',
    importance: 1,
    note: 'まとめ買いの置き場所と消費量を確認する。',
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
    store: '',
    note: seed.note,
    consumptionMemo: '',
    future: {},
  }));
