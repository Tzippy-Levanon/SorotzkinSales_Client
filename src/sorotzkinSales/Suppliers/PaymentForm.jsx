import React, { useState } from 'react';
import { useAsync } from '../utils';          // Hook לטעינה אסינכרונית
import { getPaymentMethods } from '../api';    // שליפת אמצעי תשלום מהשרת
import { Button, FormField, Input, Select } from '../Common/UI';
import { formatCurrency } from '../utils';

// ─── PaymentForm ──────────────────────────────────────────────────────────
// טופס לרישום תשלום לספק.
// props:
//   suppliers  — רשימת הספקים (מ-SuppliersPage)
//   onSubmit   — callback שמקבל את נתוני הטופס
//   onClose    — callback לסגירת המודל
//   loading    — האם בתהליך שמירה
const PaymentForm = ({ suppliers, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    supplier_id: '',
    amount: '',
    date: '',
    payment_method_id: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // שליפת אמצעי תשלום מהשרת — נטען אוטומטית בטעינת הקומפוננטה
  const { data: paymentMethods, loading: loadingMethods } = useAsync(getPaymentMethods);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      supplier_id: Number(form.supplier_id),
      amount: Number(form.amount),
      payment_method_id: Number(form.payment_method_id),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ─── בחירת ספק ─── */}
      <FormField label="ספק" required>
        <Select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} required>
          <option value="">בחר ספק...</option>
          {(suppliers || []).map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — חוב: {formatCurrency(s.balance)}
            </option>
          ))}
        </Select>
      </FormField>

      {/* ─── סכום ותאריך ─── */}
      <div className="form-grid-2">
        <FormField label="סכום" required>
          <Input
            type="number" min="0.01" step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0.00" required
          />
        </FormField>
        <FormField label="תאריך" required>
          <Input
            type="date" value={form.date}
            onChange={e => set('date', e.target.value)} required
          />
        </FormField>
      </div>

      {/* ─── אמצעי תשלום — נטען מהשרת ─── */}
      <FormField label="אמצעי תשלום" required>
        <Select
          value={form.payment_method_id}
          onChange={e => set('payment_method_id', e.target.value)}
          required
          disabled={loadingMethods}
        >
          <option value="">{loadingMethods ? 'טוען...' : 'בחר אמצעי תשלום...'}</option>
          {(paymentMethods || []).map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </FormField>

      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? 'רושם...' : 'רשום תשלום'}</Button>
      </div>
    </form>
  );
};

export default PaymentForm;
