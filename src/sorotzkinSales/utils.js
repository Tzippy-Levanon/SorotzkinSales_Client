import { useState, useEffect, useCallback } from 'react';

// ── useAsync ── Hook לטעינת נתונים אסינכרונית עם מצבי loading/error/data
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

// ── formatCurrency ── פורמט מספר למטבע ₪ ישראלי
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
};

// ── formatDate ── פורמט תאריך ISO לפורמט ישראלי (DD.MM.YYYY)
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('he-IL');
};

// ── downloadBlob ── הורדת Blob כקובץ — קורא שם מ-Content-Disposition header
export const downloadBlob = (blob, filename, response) => {
  let finalName = filename;
  if (response?.headers) {
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) finalName = decodeURIComponent(match[1]);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  a.click();
  URL.revokeObjectURL(url);
};

// ── exportToPDF ── ייצוא אלמנט HTML כ-PDF באמצעות html2pdf
export const exportToPDF = async (elementId, excelFilename) => {
  const { default: html2pdf } = await import('html2pdf.js');
  const el = document.getElementById(elementId);
  if (!el) return;

  const pdfName = excelFilename
    ? excelFilename.replace(/\.xlsx$/i, '')
    : 'דוח';

  // הסתרת אלמנטים שלא אמורים להופיע ב-PDF, חשיפת שורות נסתרות
  const hidden = el.querySelectorAll('.no-print');
  hidden.forEach(n => n.style.setProperty('display', 'none', 'important'));
  const allRows = el.querySelectorAll('.pdf-show-all');
  allRows.forEach(n => n.style.setProperty('display', '', 'important'));

  try {
    await html2pdf().set({
      margin: 10, filename: `${pdfName}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    }).from(el).save();
  } finally {
    hidden.forEach(n => n.style.removeProperty('display'));
    allRows.forEach(n => n.style.removeProperty('display'));
  }
};
