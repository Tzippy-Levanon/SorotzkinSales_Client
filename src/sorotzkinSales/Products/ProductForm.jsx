import React, { useState } from 'react';
import { Button, FormField, Input, Select } from '../Common/UI';
import AppSelect from '../Common/AppSelect';

// ─── ProductForm ──────────────────────────────────────────────────────────
// טופס הוספה/עריכה של מוצר.
// initial: מוצר קיים לעריכה (null = הוספה חדשה)
// suppliers: רשימת ספקים לbחירה
const ProductForm = ({ initial, suppliers, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    supplier_id: initial?.supplier_id || '',
    cost_price: initial?.cost_price ?? '',
    selling_price: initial?.selling_price ?? '',
    total_in_stock: initial?.total_in_stock ?? '',
    is_active: initial?.is_active ?? true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      supplier_id: Number(form.supplier_id),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      total_in_stock: Number(form.total_in_stock),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="שם מוצר" required>
        <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם המוצר" required />
      </FormField>
      <FormField label="ספק" required>
        <AppSelect
          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
          value={form.supplier_id}
          onChange={id => set('supplier_id', id)}
          placeholder="בחר ספק..."
          noOptionsMessage="אין ספקים"
        />
      </FormField>
      <div className="form-grid-2">
        <FormField label="מחיר עלות" required>
          <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0.00" required />
        </FormField>
        <FormField label="מחיר מכירה" required>
          <Input type="number" min="0" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} placeholder="0.00" required />
        </FormField>
      </div>
      <FormField label='כמות במלאי'>
        <Input type="number" min="0" value={form.total_in_stock} onChange={e => set('total_in_stock', e.target.value)} placeholder="0" />
      </FormField>
      {/* סטטוס — רק בעריכה */}
      {initial && (
        <FormField label="סטטוס">
          <AppSelect
            options={[{ value: 'true', label: 'פעיל' }, { value: 'false', label: 'לא פעיל' }]}
            value={String(form.is_active)}
            onChange={v => set('is_active', v === 'true')}
          />
        </FormField>
      )}
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? 'שומר...' : initial ? 'עדכון' : 'הוספה'}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
