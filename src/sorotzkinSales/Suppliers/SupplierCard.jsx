import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { Button, Badge, Spinner, Modal } from '../Common/UI';
import { formatCurrency, formatDate } from '../utils';
import { getSupplierPayments } from '../api';

// ─── SupplierCard ──────────────────────────────────────────────────────────────
// כרטיס ספק. לחיצה על "תצוגת תשלומים" פותחת Modal נפרד (לא מרחיב את הכרטיס),
// כך שכל הכרטיסים נשארים באותו גודל בגריד.
const SupplierCard = ({ supplier, onEdit }) => {
  const hasDebt = (supplier.balance || 0) > 0;

  // האם מודל התשלומים פתוח
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  // הנתונים שנטענו מהשרת (null = עוד לא נטענו)
  const [payments, setPayments] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);

  // Pagination בתוך המודל — 5 תשלומים לדף
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // ─── פתיחת מודל תשלומים ───────────────────────────────────────────────────
  // טוען את התשלומים מהשרת רק בפתיחה הראשונה (cache: אם payments כבר קיים — לא טוען שוב)
  const openPayments = async () => {
    setPaymentsOpen(true);
    setPage(1);
    setPayments(null); // תמיד טען מחדש — ייתכן שנוספה חשבונית
    setLoadingPay(true);
    try {
      const data = await getSupplierPayments(supplier.id);
      // מוודא שהתוצאה היא מערך (הגנה מפני תגובת שרת לא צפויה)
      setPayments(Array.isArray(data) ? data : []);
    } catch (_) {
      setPayments([]);
    } finally {
      setLoadingPay(false);
    }
  };

  // ─── חישוב pagination ─────────────────────────────────────────────────────
  const allPayments = payments || [];
  const totalPages = Math.max(1, Math.ceil(allPayments.length / PAGE_SIZE));
  const pagPayments = allPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── פתיחת חשבונית ────────────────────────────────────────────────────────
  // file_url מגיע מהשרת כנתיב יחסי (uploads/xxx.pdf).
  // בונים URL מלא לשרת כדי שהדפדפן יפתח את הקובץ ולא את ה-React Router.
  const openInvoice = (fileUrl) => {
    // אם כבר URL מלא (מתחיל ב-http) — השתמש ישירות
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      // אחרת — בנה URL מלא לשרת
      const serverBase = import.meta.env.REACR_API_URL
        ? import.meta.env.REACT_API_URL.replace('/api', '')
        : 'http://localhost:5000';
      window.open(`${serverBase}/${fileUrl}`, '_blank');
    }
  };

  return (
    <div className="card supplier-card">

      {/* ─── כותרת: שם + כפתור עריכה ──────────────────────────────────── */}
      <div className="supplier-card__header">
        <div>
          <div className="supplier-card__name">{supplier.name}</div>
          {supplier.company_name && (
            <div className="supplier-card__company">{supplier.company_name}</div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>עריכה</Button>
      </div>

      {/* ─── פרטי קשר ──────────────────────────────────────────────────── */}
      <div className="supplier-card__contacts">
        {supplier.phone && (
          <div className="supplier-card__contact-row"><span>📞</span>{supplier.phone}</div>
        )}
        {supplier.email && (
          <div className="supplier-card__contact-row"><span>✉️</span>{supplier.email}</div>
        )}
      </div>

      {/* ─── יתרת חוב ──────────────────────────────────────────────────── */}
      <div className="supplier-card__balance">
        <div className="supplier-card__balance-label">יתרת חוב</div>
        <div className="supplier-card__balance-amount">
          {formatCurrency(supplier.balance)}
        </div>
      </div>

      {/* ─── כפתור פתיחת מודל תשלומים ──────────────────────────────────── */}
      <button className="supplier-card__payments-toggle" onClick={openPayments}>
        ▼ תצוגת תשלומים
      </button>

      {/* ─── Modal תשלומים ─────────────────────────────────────────────────
          נפתח מעל האפליקציה — לא מרחיב את הכרטיס.
          כולל pagination של 5 תשלומים לדף.                               */}
      <Modal
        isOpen={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
        title={`היסטוריית תשלומים — ${supplier.name}`}
        width="680px"
      >
        {loadingPay ? (
          // טוען — מציג spinner מרכוזי
          <div className="supplier-card__payments-loading"><Spinner size="sm" /></div>

        ) : !allPayments.length ? (
          // אין תשלומים בכלל
          <div className="supplier-card__payments-empty">אין תשלומים רשומים עדיין</div>

        ) : (
          <>
            {/* ─── טבלת תשלומים ────────────────────────────────────────── */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>סכום</th>
                  <th>אמצעי תשלום</th>
                  <th>חשבונית</th>
                </tr>
              </thead>
              <tbody>
                {pagPayments.map((p, i) => (
                  <tr key={i}>
                    <td>{formatDate(p.date)}</td>
                    <td><strong>{formatCurrency(p.amount)}</strong></td>
                    <td>{p.payment_method?.name || '—'}</td>
                    <td>
                      {p.invoices?.length > 0 ? (
                        <div className="supplier-card__invoices">
                          {p.invoices.map((inv, idx) => (
                            // onClick במקום href — בונה URL מלא לשרת
                            <button
                              key={idx}
                              className="supplier-card__invoice-link"
                              onClick={() => openInvoice(inv.file_url)}
                              title={inv.reference_number || `חשבונית ${idx + 1}`}
                            >
                              📄 {inv.reference_number || `חשבונית ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="supplier-card__no-invoice">אין</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ─── Pagination — מוצג רק אם יש יותר מ-5 תשלומים ─────────── */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default SupplierCard;
