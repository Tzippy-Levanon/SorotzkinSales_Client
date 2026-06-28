import React, { useState } from 'react';
import { useAsync } from '../utils';
import { getPaymentMethods } from '../api';
import { Button, FormField, Input } from '../Common/UI';
import AppSelect from '../Common/AppSelect';

// ── PaymentForm ── טופס רישום תשלום לספק: ספק, סכום, תאריך, אמצעי תשלום
const PaymentForm = ({ suppliers, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({ supplier_id: '', amount: '', date: '', payment_method_id: '' });

  // פונקציית עזר לעדכון שדה בודד בטופס.
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useState({});

  // ── אמצעי תשלום נטענים מהשרת (מזומן, העברה וכו')
  const { data: paymentMethods, loading: loadingMethods } = useAsync(getPaymentMethods);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.supplier_id) errs.supplier_id = 'יש לבחור ספק';
    if (!form.payment_method_id) errs.payment_method_id = 'יש לבחור אמצעי תשלום';
    if (form.date && form.date > new Date().toISOString().split('T')[0]) {
      errs.date = 'תאריך תשלום לא יכול להיות בעתיד';
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      ...form,
      supplier_id: Number(form.supplier_id),
      amount: Number(form.amount),
      payment_method_id: Number(form.payment_method_id),
    });
  };

  return (
    <form onSubmit={handleSubmit}>

      <FormField label="ספק" required error={errors.supplier_id}>
        <AppSelect
          options={(suppliers || []).map(s => ({ value: s.id, label: `${s.name} — חוב: ₪${(s.balance || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}` }))}
          value={form.supplier_id}
          onChange={id => { set('supplier_id', id); setErrors(e => ({ ...e, supplier_id: '' })); }}
          placeholder="בחר ספק..."
          noOptionsMessage="אין ספקים"
        />
      </FormField>

      <div className="form-grid-2">
        <FormField label="סכום" required>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0.00"
            required
          />
        </FormField>
        <FormField label="תאריך" required error={errors.date}>
          <Input
            type="date"
            value={form.date}
            onChange={e => { set('date', e.target.value); setErrors({}); }}
            max={new Date().toISOString().split("T")[0]}
            required
          />
        </FormField>
      </div>

      <FormField label="אמצעי תשלום" required error={errors.payment_method_id}>
        <AppSelect
          options={(paymentMethods || []).map(m => ({ value: m.id, label: m.name }))}
          value={form.payment_method_id}
          onChange={id => { set('payment_method_id', id); setErrors(e => ({ ...e, payment_method_id: '' })); }}
          placeholder={loadingMethods ? 'טוען אמצעי תשלום...' : 'בחר אמצעי תשלום...'}
          disabled={loadingMethods}
          noOptionsMessage="אין אמצעי תשלום"
        />
      </FormField>

      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'רושם...' : 'רשום תשלום'}
        </Button>
      </div>

    </form>
  );
};

export default PaymentForm;
