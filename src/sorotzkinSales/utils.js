import { useState, useEffect, useCallback } from 'react';

// ─── useAsync ─────────────────────────────────────────────────────────────
// Hook לטעינת נתונים אסינכרונית — מחליף useState+useEffect+try/catch בכל דף.
// שימוש: const { data, loading, error, refetch } = useAsync(getProducts);
export const useAsync = (asyncFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await asyncFn()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);
  return { data, loading, error, refetch: execute };
};

// מפרמט מספר לפורמט ₪ ישראלי. דוגמה: 1500 → ‎₪‎1,500.00
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
};

// מפרמט תאריך ISO לפורמט ישראלי. דוגמה: "2025-06-01" → "1.6.2025"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('he-IL');
};

// מוריד Blob (קובץ Excel/PDF) למחשב המשתמש
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// מייצא אלמנט HTML כ-PDF (מחייב: npm install html2pdf.js)
export const exportToPDF = async (elementId, filename) => {
  const { default: html2pdf } = await import('html2pdf.js');
  const el = document.getElementById(elementId);
  if (!el) return;
  await html2pdf().set({
    margin: 10, filename: `${filename}.pdf`,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  }).from(el).save();
};
