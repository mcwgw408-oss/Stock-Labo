import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, CirclePlus, Edit3, PackageCheck, Save, Trash2, X } from 'lucide-react';
import { loadItems, saveItems } from './storage';
import type { Importance, ShoppingListCandidate, StockDraft, StockItem, StockStatus } from './types';

const emptyDraft: StockDraft = {
  name: '',
  category: '',
  currentCount: 0,
  minimumCount: 0,
  reserveCount: 0,
  unit: '',
  importance: 2,
  price: 0,
  purchaseDate: '',
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

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort()],
    [items],
  );

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
      category: draft.category.trim() || '未分類',
      unit: draft.unit.trim(),
      store: draft.store.trim(),
      note: draft.note.trim(),
      consumptionMemo: draft.consumptionMemo.trim(),
    };

    if (!cleanDraft.name) return;

    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? { ...item, ...cleanDraft } : item)));
    } else {
      setItems((current) => [{ id: crypto.randomUUID(), ...cleanDraft, future: {} }, ...current]);
    }

    resetForm();
  };

  const startEdit = (item: StockItem) => {
    const { id: _id, future: _future, ...nextDraft } = item;
    setDraft(nextDraft);
    setEditingId(item.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">まとめ買いの持ち具合を見える化</p>
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
              <input value={draft.category} onChange={(event) => updateDraft('category', event.target.value)} />
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
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'すべて' : category}
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
        />
        <StatusSection
          title="🟡 そろそろ確認"
          tone="warning"
          icon={<PackageCheck size={18} />}
          items={groupedItems.check}
          onEdit={startEdit}
          onDelete={removeItem}
        />
        <section className="safe-section">
          <div className="section-heading">
            <h2>🟢 安心</h2>
            <span>{groupedItems.safe.length}件</span>
          </div>
        </section>
      </section>

      <footer className="app-footer">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>買い物リスト連携候補: {shoppingListCandidates.length}件</span>
      </footer>
    </main>
  );
}

type StatusSectionProps = {
  title: string;
  tone: 'danger' | 'warning';
  icon: ReactNode;
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
};

function StatusSection({ title, tone, icon, items, onEdit, onDelete }: StatusSectionProps) {
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
                  {item.currentCount}
                  {item.unit || ''}
                  <span>/ 最低 {item.minimumCount}</span>
                </div>
              </div>
              {(item.note || item.consumptionMemo) && (
                <div className="memo-block">
                  {item.note && <p>{item.note}</p>}
                  {item.consumptionMemo && <p>{item.consumptionMemo}</p>}
                </div>
              )}
              <div className="card-actions">
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

export default App;
