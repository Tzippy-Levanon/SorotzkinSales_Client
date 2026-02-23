import React, { useState, useMemo } from 'react';
import { Button, FormField, Input, Select } from '../Common/UI';

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <FormField label="ספק" required>
          <Select value={supplierId} onChange={e => { setSupplierId(e.target.value); setItems([{ product_id: '', quantity: 1, cost_price: '' }]); }} required>
            <option value="">בחר ספק...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>
        <FormField label="תאריך הגעה" required>
          <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} required />
        </FormField>
      </div>
      <FormField label="הערות">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות אופציונליות..." />
      </FormField>
      <p className="section-label arrival-items-label">פריטים</p>
      {items.map((item, idx) => (
        <div key={idx} className="arrival-item-row">
          <FormField label={idx === 0 ? 'מוצר' : undefined} required>
            <Select value={item.product_id} onChange={e => setItem(idx, 'product_id', e.target.value)} required disabled={!supplierId}>
              <option value="">בחר מוצר...</option>
              {supplierProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
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
