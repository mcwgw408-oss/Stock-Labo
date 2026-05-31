import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  CirclePlus,
  Edit3,
  History,
  PackageCheck,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { categoryOptions, loadItems, saveItems } from './storage';
import type { Importance, ShoppingListCandidate, StockDraft, StockItem, StockStatus, UsageHistory } from './types';

const emptyDraft: StockDraft = {
  name: '',
  category: 'その他',
  currentCount: 0,
  minimumCount: 0,
  reserveCount: 0,
  unit: '',
  importance: 2,
  price: 0,
  purchaseDate: '',
  startedDate: '',
  store: '',
  note: '',
  consumptionMemo: '',
};

const units = ['kg', '袋', '本', '個', 'ロール', '枚', '箱', 'パック'];

const importanceLabel: Record<Importance, string> = {
  3: '⭐⭐⭐',
  2: '⭐⭐',
  1: '⭐',
};

const importanceMeaning: Record<Importance, string> = {
  3: '必須',
  2: '推奨',
  1: '余裕あれば',
};

const getStatus = (item: StockItem): StockStatus => {
  if (item.currentCount > item.minimumCount) return 'safe';
  if (item.currentCount === item.minimumCount) return 'check';
  return 'buy';
};

const createShoppingListCandidates = (items: StockItem[]): ShoppingListCandidate[] =>
  items.filter((item) => getStatus(item) === 'buy');

const getToday = () => new Date().toISOString().slice(0, 10);

const getDurationDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.round(diff / 86_400_000);
};

const formatDate = (value: string) => value || '未記録';

const formatQuantity = (quantity: number, unit: string) => `${quantity}${unit || ''}`;

function App() {
  const [items, setItems] = useState<StockItem[]>(() => loadItems());
  const [draft, setDraft] = useState<StockDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<'all' | Importance>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesImportance = importanceFilter === 'all' || item.importance === importanceFilter;
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesImportance && matchesCategory;
      }),
    [categoryFilter, importanceFilter, items],
  );

  const groupedItems = useMemo(
    () => ({
      buy: filteredItems.filter((item) => getStatus(item) === 'buy'),
      check: filteredItems.filter((item) => getStatus(item) === 'check'),
      safe: filteredItems.filter((item) => getStatus(item) === 'safe'),
    }),
    [filteredItems],
  );

  const allHistory = useMemo(
    () =>
      items
        .flatMap((item) => item.usageHistory)
        .sort((a, b) => b.endedDate.localeCompare(a.endedDate)),
    [items],
  );

  const averageRows = useMemo(() => {
    const grouped = new Map<string, UsageHistory[]>();
    allHistory.forEach((entry) => {
      const key = `${entry.itemName}-${entry.unit}`;
      grouped.set(key, [...(grouped.get(key) || []), entry]);
    });

    return Array.from(grouped.entries())
      .map(([key, entries]) => {
        const total = entries.reduce((sum, entry) => sum + entry.durationDays, 0);
        return {
          key,
          name: entries[0].itemName,
          unit: entries[0].unit,
          count: entries.length,
          average: entries.length > 0 ? Math.round(total / entries.length) : 0,
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
  }, [allHistory]);

  const buyCountAll = items.filter((item) => getStatus(item) === 'buy').length;
  const topPriorityBuyCount = items.filter((item) => getStatus(item) === 'buy' && item.importance === 3).length;
  const shoppingListCandidates = createShoppingListCandidates(items);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const updateDraft = <Key extends keyof StockDraft>(key: Key, value: StockDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanDraft: StockDraft = {
      ...draft,
      name: draft.name.trim(),
      unit: draft.unit.trim(),
      store: draft.store.trim(),
      note: draft.note.trim(),
      consumptionMemo: draft.consumptionMemo.trim(),
    };

    if (!cleanDraft.name) return;

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? { ...item, ...cleanDraft } : item)));
    } else {
      setItems((current) => [
        {
          id: crypto.randomUUID(),
          ...cleanDraft,
          endedDate: '',
          durationDays: 0,
          usageHistory: [],
          future: {},
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const startEdit = (item: StockItem) => {
    const { id: _id, future: _future, endedDate: _endedDate, durationDays: _durationDays, usageHistory: _history, ...nextDraft } = item;
    setDraft(nextDraft);
    setEditingId(item.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  const finishItem = (item: StockItem) => {
    const endedDate = getToday();
    const startedDate = item.startedDate || item.purchaseDate || endedDate;
    const durationDays = getDurationDays(startedDate, endedDate);
    const historyEntry: UsageHistory = {
      id: crypto.randomUUID(),
      itemName: item.name,
      category: item.category,
      quantity: item.currentCount,
      unit: item.unit,
      purchaseDate: item.purchaseDate,
      startedDate,
      endedDate,
      durationDays,
      memo: item.consumptionMemo || item.note,
    };

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              currentCount: 0,
              startedDate,
              endedDate,
              durationDays,
              usageHistory: [historyEntry, ...currentItem.usageHistory],
              future: {
                ...currentItem.future,
                usedUpDate: endedDate,
                consumptionPeriodDays: durationDays,
              },
            }
          : currentItem,
      ),
    );
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">購入タイミングを予測できるストック管理へ</p>
          <h1>ストック管理Labo</h1>
        </div>
        <button className="primary-action" type="button" onClick={() => setIsFormOpen(true)}>
          <CirclePlus size={20} aria-hidden="true" />
          <span>追加</span>
        </button>
      </header>

      <section className="summary-grid" aria-label="在庫サマリー">
        <div className="summary-card danger">
          <div className="summary-title">🔴 今月買う候補</div>
          <strong>{buyCountAll}件</strong>
          <span>うち⭐⭐⭐ {topPriorityBuyCount}件</span>
        </div>
        <div className="summary-card warning">
          <div className="summary-title">🟡 そろそろ確認</div>
          <strong>{items.filter((item) => getStatus(item) === 'check').length}件</strong>
          <span>最低必要数と同じ</span>
        </div>
        <div className="summary-card calm">
          <div className="summary-title">🟢 安心</div>
          <strong>{items.filter((item) => getStatus(item) === 'safe').length}件</strong>
          <span>最低必要数より多い</span>
        </div>
      </section>

      {isFormOpen && (
        <section className="editor-panel" aria-label={editingId ? '在庫を編集' : '在庫を追加'}>
          <div className="section-heading">
            <h2>{editingId ? '在庫を編集' : '在庫を追加'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="フォームを閉じる">
              <X size={18} />
            </button>
          </div>

          <form className="stock-form" onSubmit={handleSubmit}>
            <label>
              商品名
              <input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required />
            </label>
            <label>
              カテゴリ
              <select value={draft.category} onChange={(event) => updateDraft('category', event.target.value as StockDraft['category'])}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              現在数
              <input
                type="number"
                min="0"
                step="1"
                value={draft.currentCount}
                onChange={(event) => updateDraft('currentCount', Number(event.target.value))}
              />
            </label>
            <label>
              最低必要数
              <input
                type="number"
                min="0"
                step="1"
                value={draft.minimumCount}
                onChange={(event) => updateDraft('minimumCount', Number(event.target.value))}
              />
            </label>
            <label>
              予備数
              <input
                type="number"
                min="0"
                step="1"
                value={draft.reserveCount}
                onChange={(event) => updateDraft('reserveCount', Number(event.target.value))}
              />
            </label>
            <label>
              単位
              <select value={draft.unit} onChange={(event) => updateDraft('unit', event.target.value)}>
                <option value="">未設定</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              重要度
              <select
                value={draft.importance}
                onChange={(event) => updateDraft('importance', Number(event.target.value) as Importance)}
              >
                <option value={3}>⭐⭐⭐ 必須</option>
                <option value={2}>⭐⭐ 推奨</option>
                <option value={1}>⭐ 余裕あれば</option>
              </select>
            </label>
            <label>
              価格
              <input
                type="number"
                min="0"
                step="1"
                value={draft.price}
                onChange={(event) => updateDraft('price', Number(event.target.value))}
              />
            </label>
            <label>
              購入日
              <input
                type="date"
                value={draft.purchaseDate}
                onChange={(event) => updateDraft('purchaseDate', event.target.value)}
              />
            </label>
            <label>
              使用開始日
              <input
                type="date"
                value={draft.startedDate}
                onChange={(event) => updateDraft('startedDate', event.target.value)}
              />
            </label>
            <label>
              購入店
              <input value={draft.store} onChange={(event) => updateDraft('store', event.target.value)} />
            </label>
            <label className="wide-field">
              備考
              <textarea value={draft.note} onChange={(event) => updateDraft('note', event.target.value)} rows={3} />
            </label>
            <label className="wide-field">
              消費メモ
              <textarea
                value={draft.consumptionMemo}
                onChange={(event) => updateDraft('consumptionMemo', event.target.value)}
                rows={3}
              />
            </label>
            <div className="form-actions">
              <button className="secondary-action" type="button" onClick={resetForm}>
                キャンセル
              </button>
              <button className="primary-action" type="submit">
                <Save size={18} aria-hidden="true" />
                <span>{editingId ? '保存' : '追加'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="filters" aria-label="フィルター">
        <div className="segmented-control" aria-label="重要度フィルター">
          {(['all', 3, 2, 1] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={importanceFilter === value ? 'active' : ''}
              onClick={() => setImportanceFilter(value)}
            >
              {value === 'all' ? 'すべて' : importanceLabel[value]}
            </button>
          ))}
        </div>
        <label className="category-filter">
          カテゴリ
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">すべて</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="status-sections" aria-label="在庫状態">
        <StatusSection
          title="🔴 買う候補"
          tone="danger"
          icon={<CircleAlert size={18} />}
          items={groupedItems.buy}
          onEdit={startEdit}
          onDelete={removeItem}
          onFinish={finishItem}
        />
        <StatusSection
          title="🟡 そろそろ確認"
          tone="warning"
          icon={<PackageCheck size={18} />}
          items={groupedItems.check}
          onEdit={startEdit}
          onDelete={removeItem}
          onFinish={finishItem}
        />
        <StatusSection
          title="🟢 安心"
          tone="calm"
          icon={<CheckCircle2 size={18} />}
          items={groupedItems.safe}
          onEdit={startEdit}
          onDelete={removeItem}
          onFinish={finishItem}
        />
      </section>

      <HistorySection history={allHistory} averages={averageRows} />

      <footer className="app-footer">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>買い物リスト連携候補: {shoppingListCandidates.length}件</span>
      </footer>
    </main>
  );
}

type StatusSectionProps = {
  title: string;
  tone: 'danger' | 'warning' | 'calm';
  icon: ReactNode;
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
  onFinish: (item: StockItem) => void;
};

function StatusSection({ title, tone, icon, items, onEdit, onDelete, onFinish }: StatusSectionProps) {
  return (
    <section className={`stock-section ${tone}`}>
      <div className="section-heading">
        <h2>
          {icon}
          {title}
        </h2>
        <span>{items.length}件</span>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">該当する在庫はありません。</p>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <article className="stock-card" key={item.id}>
              <div className="stock-card-main">
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {importanceLabel[item.importance]} {importanceMeaning[item.importance]} / {item.category}
                  </p>
                </div>
                <div className="quantity-pill">
                  {formatQuantity(item.currentCount, item.unit)}
                  <span>/ 最低 {formatQuantity(item.minimumCount, item.unit)}</span>
                </div>
              </div>
              <dl className="date-grid">
                <div>
                  <dt>購入日</dt>
                  <dd>{formatDate(item.purchaseDate)}</dd>
                </div>
                <div>
                  <dt>使用開始日</dt>
                  <dd>{formatDate(item.startedDate)}</dd>
                </div>
                <div>
                  <dt>前回終了</dt>
                  <dd>{item.endedDate ? `${item.endedDate} / ${item.durationDays}日` : '未記録'}</dd>
                </div>
              </dl>
              {(item.note || item.consumptionMemo) && (
                <div className="memo-block">
                  {item.note && <p>{item.note}</p>}
                  {item.consumptionMemo && <p>{item.consumptionMemo}</p>}
                </div>
              )}
              <div className="card-actions">
                <button type="button" onClick={() => onFinish(item)}>
                  <CalendarCheck size={16} aria-hidden="true" />
                  <span>終了</span>
                </button>
                <button type="button" onClick={() => onEdit(item)}>
                  <Edit3 size={16} aria-hidden="true" />
                  <span>編集</span>
                </button>
                <button type="button" onClick={() => onDelete(item.id)}>
                  <Trash2 size={16} aria-hidden="true" />
                  <span>削除</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

type HistorySectionProps = {
  history: UsageHistory[];
  averages: Array<{
    key: string;
    name: string;
    unit: string;
    count: number;
    average: number;
  }>;
};

function HistorySection({ history, averages }: HistorySectionProps) {
  return (
    <section className="history-section" aria-label="使用履歴">
      <div className="section-heading">
        <h2>
          <History size={18} aria-hidden="true" />
          使用履歴
        </h2>
        <span>{history.length}件</span>
      </div>

      {averages.length > 0 && (
        <div className="average-list" aria-label="平均使用日数">
          {averages.map((row) => (
            <div className="average-card" key={row.key}>
              <strong>{row.name}</strong>
              <span>
                平均 {row.average}日 / {row.count}回
              </span>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <p className="empty-state">終了ボタンを押すと、ここに使用日数の履歴が残ります。</p>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <article className="history-row" key={entry.id}>
              <div>
                <h3>
                  {entry.itemName} {formatQuantity(entry.quantity, entry.unit)}
                </h3>
                <p>
                  {entry.startedDate} → {entry.endedDate}
                </p>
              </div>
              <strong>{entry.durationDays}日</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default App;
