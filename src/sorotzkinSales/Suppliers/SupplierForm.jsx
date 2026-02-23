import React, { useState } from 'react';
import { Button, FormField, Input } from '../Common/UI';

const SupplierForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    company_name: initial?.company_name || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <FormField label="שם הספק" required>
        <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם מלא" required />
      </FormField>
      <FormField label="שם חברה">
        <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="שם החברה (אופציונלי)" />
      </FormField>
      <div className="form-grid-2">
        <FormField label="טלפון">
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" />
        </FormField>
        <FormField label="מייל">
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </FormField>
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? 'שומר...' : initial ? 'עדכון' : 'הוספה'}</Button>
      </div>
    </form>
  );
};

export default SupplierForm;
