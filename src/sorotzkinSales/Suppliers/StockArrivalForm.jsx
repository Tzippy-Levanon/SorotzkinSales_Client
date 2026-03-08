import React, { useState, useMemo } from 'react';
import { Button, FormField, Input, Select } from '../Common/UI';
import AppSelect from '../Common/AppSelect';

const StockArrivalForm = ({ suppliers, products, onSubmit, onClose, loading }) => {
  const [supplierId, setSupplierId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, cost_price: '' }]);

  const supplierProducts = useMemo(() =>
    (products || []).filter(p => String(p.supplier_id) === String(supplierId)),
    [products, supplierId]);

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1, cost_price: '' }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const setItem = (idx, key, val) => setItems(prev =>
    prev.map((item, j) => {
      if (j !== idx) return item;
      const updated = { ...item, [key]: val };
      if (key === 'product_id') {
        const prod = (products || []).find(p => String(p.id) === String(val));
        if (prod) updated.cost_price = prod.cost_price;
      }
      return updated;
    }));

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!supplierId) errs.supplierId = 'יש לבחור ספק';
    if (arrivalDate && arrivalDate > new Date().toISOString().split('T')[0]) {
      errs.arrivalDate = 'תאריך הגעה לא יכול להיות בעתיד';
    }
    const hasEmptyProduct = items.some(i => !i.product_id);
    if (hasEmptyProduct) errs.products = 'יש לבחור מוצר לכל פריט';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      supplier_id: Number(supplierId),
      arrival_date: arrivalDate,
      notes: notes || undefined,
      products: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity), cost_price: Number(i.cost_price) })),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <FormField label="ספק" required error={errors.supplierId}>
          <AppSelect
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            value={supplierId}
            onChange={id => { setSupplierId(id); setItems([{ product_id: '', quantity: 1, cost_price: '' }]); setErrors(e => ({ ...e, supplierId: '' })); }}
            placeholder="בחר ספק..."
            noOptionsMessage="אין ספקים"
          />
        </FormField>
        <FormField label="תאריך הגעה" required error={errors.arrivalDate}>
          <Input type="date" value={arrivalDate} onChange={e => { setArrivalDate(e.target.value); setErrors({}); }} max={new Date().toISOString().split("T")[0]} required />
        </FormField>
      </div>
      <FormField label="הערות">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות אופציונליות..." />
      </FormField>
      <p className="section-label arrival-items-label">פריטים</p>
      {items.map((item, idx) => (
        <div key={idx} className="arrival-item-row">
          <FormField label={idx === 0 ? 'מוצר' : undefined} required error={idx === 0 ? errors.products : undefined}>
            <AppSelect
              options={supplierProducts.map(p => ({ value: p.id, label: `${p.name} (מלאי: ${p.total_in_stock})` }))}
              value={item.product_id}
              onChange={id => { setItem(idx, 'product_id', id); setErrors(e => ({ ...e, products: '' })); }}
              placeholder={!supplierId ? 'יש לבחור ספק תחילה' : 'בחר מוצר...'}
              disabled={!supplierId}
              noOptionsMessage="אין מוצרים לספק זה"
            />
          </FormField>
          <FormField label={idx === 0 ? 'כמות' : undefined} required>
            <Input type="number" min="1" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} required />
          </FormField>
          <FormField label={idx === 0 ? 'מחיר עלות' : undefined} required>
            <Input type="number" min="0" step="0.01" value={item.cost_price} onChange={e => setItem(idx, 'cost_price', e.target.value)} placeholder="0.00" required />
          </FormField>
          <button type="button" className="arrival-item-row__remove btn btn--ghost btn--sm"
            onClick={() => removeItem(idx)} disabled={items.length === 1}>✕</button>
        </div>
      ))}
      <div className="arrival-totals-block">
        <Button type="button" variant="ghost" size="sm" onClick={addItem} icon="+">הוסף פריט</Button>
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? 'שומר...' : 'רשום הגעה'}</Button>
      </div>
    </form>
  );
};

export default StockArrivalForm;
