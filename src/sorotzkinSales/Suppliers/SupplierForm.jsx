import React, { useState } from 'react';
import { Button, FormField, Input } from '../Common/UI';

const SupplierForm = ({ initial, onSubmit, onClose, loading }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    company_name: initial?.company_name || '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const errs = {};
    if (!form.phone && !form.email) {
      errs.contact = 'יש למלא לפחות טלפון או מייל';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'כתובת מייל אינה תקינה';
    }
    if (form.phone && !/^[0-9\-+\s()]{7,15}$/.test(form.phone)) {
      errs.phone = 'מספר טלפון אינו תקין';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="שם הספק" required>
        <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="שם מלא" required />
      </FormField>
      <FormField label="שם חברה">
        <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="שם החברה (אופציונלי)" />
      </FormField>
      <div className="form-grid-2">
        <FormField label="טלפון" error={errors.phone}>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" />
        </FormField>
        <FormField label="מייל" error={errors.email}>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </FormField>
      </div>
      {errors.contact && <div className="form-error" style={{ marginBottom: '8px' }}>{errors.contact}</div>}
      {errors.name && <div className="form-error" style={{ marginBottom: '8px' }}>{errors.name}</div>}
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? 'שומר...' : initial ? 'עדכון' : 'הוספה'}</Button>
      </div>
    </form>
  );
};

export default SupplierForm;
