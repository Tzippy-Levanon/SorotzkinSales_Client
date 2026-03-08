import React, { useState } from 'react';

// useAsync — Hook שמפשט טעינת נתונים מהשרת:
// במקום לכתוב useState + useEffect + try/catch בכל מקום,
// פשוט קוראים: const { data, loading } = useAsync(someApiFunction)
import { useAsync } from '../utils';

// getPaymentMethods — פונקציה מה-API שמבצעת GET /api/payment_methods
// ומחזירה מערך כמו: [{ id: 1, name: 'מזומן' }, { id: 2, name: 'העברה בנקאית' }, ...]
import { getPaymentMethods } from '../api';

// ייבוא קומפוננטות UI משותפות של האתר
import { Button, FormField, Input } from '../Common/UI';
import AppSelect from '../Common/AppSelect';

// formatCurrency — הופך מספר למחרוזת מטבע: 1500 → "₪1,500.00"
import { formatCurrency } from '../utils';

// ─── PaymentForm ───────────────────────────────────────────────────────────────
// טופס לרישום תשלום לספק.
// props:
//   suppliers  — מערך ספקים [{ id, name, balance }] לבחירה בדרופדאון
//   onSubmit   — callback שנקרא עם נתוני הטופס אחרי שליחה
//   onClose    — callback לסגירת המודל (לחיצת ביטול)
//   loading    — האם השרת עדיין מעבד (מסתיר כפתור שליחה)
const PaymentForm = ({ suppliers, onSubmit, onClose, loading }) => {

  // form — אובייקט המחזיק את ערכי כל שדות הטופס.
  // בכל שינוי בשדה — מעדכנים את המפתח המתאים בלי לאפס את השאר (spread: {...f, [k]:v})
  const [form, setForm] = useState({
    supplier_id: '',   // מזהה הספק שנבחר
    amount: '',   // סכום התשלום
    date: '',   // תאריך התשלום
    payment_method_id: '',   // מזהה אמצעי התשלום שנבחר
  });

  // פונקציית עזר לעדכון שדה בודד בטופס.
  // set('amount', '500') → form.amount = '500', שאר השדות נשמרים
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── טעינת אמצעי תשלום ────────────────────────────────────────────────────
  // useAsync מפעיל את getPaymentMethods() אוטומטית כשהקומפוננטה נטענת.
  // paymentMethods   — המערך שהשרת החזיר (null בתחילה, עד שהבקשה חוזרת)
  // loadingMethods   — true בזמן שהבקשה בדרך, false אחרי שחזרה
  const { data: paymentMethods, loading: loadingMethods } = useAsync(getPaymentMethods);

  // ── שליחת הטופס ──────────────────────────────────────────────────────────
  // e.preventDefault() מונע טעינה מחדש של הדף (התנהגות ברירת מחדל של form)
  // Number() ממיר את מחרוזות הטופס למספרים כי ה-DB מצפה ל-integer/numeric
  const [errors, setErrors] = useState({});

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

      {/* ─── בחירת ספק ─────────────────────────────────────────────────── */}
      {/* מציג את כל הספקים עם שמם וחובם הנוכחי */}
      <FormField label="ספק" required error={errors.supplier_id}>
        <AppSelect
          options={(suppliers || []).map(s => ({ value: s.id, label: `${s.name} — חוב: ₪${(s.balance || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}` }))}
          value={form.supplier_id}
          onChange={id => { set('supplier_id', id); setErrors(e => ({ ...e, supplier_id: '' })); }}
          placeholder="בחר ספק..."
          noOptionsMessage="אין ספקים"
        />
      </FormField>

      {/* ─── סכום ותאריך בשורה אחת ─────────────────────────────────────── */}
      {/* form-grid-2 מסדר שני שדות זה לצד זה */}
      <div className="form-grid-2">
        <FormField label="סכום" required>
          <Input
            type="number"
            min="0.01"      /* מינימום 1 אגורה */
            step="0.01"     /* מאפשר אגורות */
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

      {/* ─── אמצעי תשלום ────────────────────────────────────────────────── */}
      {/* הרשימה נטענת מהשרת (getPaymentMethods).
          בזמן הטעינה — הדרופדאון מושבת ומציג "טוען..."
          אחרי הטעינה — מציג את כל האפשרויות מה-DB */}
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

      {/* ─── כפתורי פעולה ───────────────────────────────────────────────── */}
      {/* form-actions מסדר את הכפתורים בשורה עם רווח ביניהם */}
      <div className="form-actions">
        {/* ביטול — סוגר את המודל בלי לשלוח */}
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        {/* שליחה — מושבת בזמן שהשרת מעבד (loading=true) */}
        <Button type="submit" disabled={loading}>
          {loading ? 'רושם...' : 'רשום תשלום'}
        </Button>
      </div>

    </form>
  );
};

export default PaymentForm;
