import React, { useState } from 'react';
import { Button } from '../Common/UI';

// ─── CloseSaleForm ────────────────────────────────────────────────────────
// טופס סגירת מכירה — מזין כמות שנותרה לכל מוצר ומחשב כמה נמכר.
// saleId: מזהה המכירה. saleItems: [{product_id, opening_stock, products:{name}}]
const CloseSaleForm = ({ saleId, saleItems, onSubmit, onClose, loading }) => {
  const [remaining, setRemaining] = useState(
    Object.fromEntries(saleItems.map(i => [i.product_id, i.opening_stock]))
  );

  const setR = (id, val) =>
    setRemaining(r => ({
      ...r,
      [id]: Math.max(0, Math.min(Number(val), saleItems.find(i => i.product_id === id)?.opening_stock ?? Infinity))
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(saleId, saleItems.map(i => ({ product_id: i.product_id, remaining_quantity: remaining[i.product_id] ?? 0 })));
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="close-sale__hint">הכנס את כמות הפריטים שנותרו (לא נמכרו) בסיום המכירה:</p>
      <div className="close-sale__list">
        {saleItems.map(item => (
          <div key={item.product_id} className="close-sale__item">
            <div>
              <div className="close-sale__item-name">{item.products?.name}</div>
              <div className="close-sale__item-sub">יצא למכירה: {item.opening_stock}</div>
            </div>
            <div className="close-sale__remaining">
              <span className="close-sale__remaining-label">נותר:</span>
              <input type="number" className="close-sale__remaining-input"
                min="0" max={item.opening_stock}
                value={remaining[item.product_id] ?? 0}
                onChange={e => setR(item.product_id, e.target.value)} />
              <span className="close-sale__sold">
                נמכר: {item.opening_stock - (remaining[item.product_id] ?? 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" variant="success" disabled={loading}>{loading ? 'סוגר...' : 'סגור מכירה'}</Button>
      </div>
    </form>
  );
};

export default CloseSaleForm;
