import React, { useState, useMemo } from 'react';
import { Input } from '../Common/UI';
import { formatCurrency } from '../utils';   // תוקן

// ─── ProductPicker ────────────────────────────────────────────────────────
// בוחר מוצרים עם חיפוש, צ'קבוקס ובחירת כמות.
// products: רשימת מוצרים פעילים. selected: [{product_id, quantity}]. onChange: callback
const ProductPicker = ({ products, selected, onChange }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]);

  const toggle = (id) => onChange(prev =>
    prev.find(x => x.product_id === id)
      ? prev.filter(x => x.product_id !== id)
      : [...prev, { product_id: id, quantity: 1 }]);

  const setQty = (id, qty) => onChange(prev =>
    prev.map(x => x.product_id === id ? { ...x, quantity: Math.max(1, Number(qty)) } : x));

  const isSelected = (id) => selected.some(x => x.product_id === id);

  return (
    <div>
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש מוצר..." />
      <div className="product-picker__list">
        {filtered.length === 0
          ? <div className="product-picker__empty">לא נמצאו מוצרים</div>
          : filtered.map(p => {
            const sel = isSelected(p.id);
            return (
              <div key={p.id}
                className={`product-picker__item${sel ? ' product-picker__item--selected' : ''}`}
                onClick={() => toggle(p.id)}
              >
                <input type="checkbox" className="product-picker__checkbox"
                  checked={sel} onChange={() => toggle(p.id)}
                  onClick={e => e.stopPropagation()} />
                <div className="product-picker__info">
                  <div className="product-picker__name">{p.name}</div>
                  <div className="product-picker__meta">מלאי: {p.total_in_stock} | מכירה: {formatCurrency(p.selling_price)}</div>
                </div>
                {sel && (
                  <div className="product-picker__qty" onClick={e => e.stopPropagation()}>
                    <span className="product-picker__qty-label">כמות:</span>
                    <input type="number" className="product-picker__qty-input"
                      min="1" max={p.total_in_stock}
                      value={selected.find(x => x.product_id === p.id)?.quantity || 1}
                      onChange={e => setQty(p.id, e.target.value)} />
                  </div>
                )}
              </div>
            );
          })}
      </div>
      {selected.length > 0 && <div className="product-picker__count">{selected.length} מוצרים נבחרו</div>}
    </div>
  );
};

export default ProductPicker;
