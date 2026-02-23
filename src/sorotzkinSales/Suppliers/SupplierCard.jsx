import React, { useState } from 'react';
import { Button, Badge, Spinner } from '../Common/UI';
import { formatCurrency, formatDate } from '../utils';
import { getSupplierPayments } from '../api';

// ─── SupplierCard ─────────────────────────────────────────────────────────
// כרטיס ספק עם אפשרות לפתוח היסטוריית תשלומים + הורדת חשבוניות
const SupplierCard = ({ supplier, onEdit }) => {
  const hasDebt = (supplier.balance || 0) > 0;
  const [showPayments, setShowPayments] = useState(false);
  const [payments, setPayments] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);

  const togglePayments = async () => {
    if (showPayments) { setShowPayments(false); return; }
    setShowPayments(true);
    if (payments) return; // כבר טעון
    setLoadingPay(true);
    try {
      const data = await getSupplierPayments(supplier.id);
      setPayments(data);
    } catch (_) {
      setPayments([]);
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="card supplier-card">
      {/* ─── כותרת כרטיס ─── */}
      <div className="supplier-card__header">
        <div>
          <div className="supplier-card__name">{supplier.name}</div>
          {supplier.company_name && (
            <div className="supplier-card__company">{supplier.company_name}</div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>עריכה</Button>
      </div>

      {/* ─── פרטי קשר ─── */}
      <div className="supplier-card__contacts">
        {supplier.phone && (
          <div className="supplier-card__contact-row">
            <span>📞</span>{supplier.phone}
          </div>
        )}
        {supplier.email && (
          <div className="supplier-card__contact-row">
            <span>✉️</span>{supplier.email}
          </div>
        )}
      </div>

      {/* ─── יתרת חוב ─── */}
      <div className={`supplier-card__balance ${hasDebt ? 'supplier-card__balance--owed' : 'supplier-card__balance--clear'}`}>
        <div className="supplier-card__balance-label">יתרת חוב</div>
        <div className={`supplier-card__balance-amount ${hasDebt ? 'supplier-card__balance-amount--owed' : 'supplier-card__balance-amount--clear'}`}>
          {formatCurrency(supplier.balance)}
        </div>
      </div>

      {/* ─── כפתור היסטוריית תשלומים ─── */}
      <button className="supplier-card__payments-toggle" onClick={togglePayments}>
        {showPayments ? '▲ הסתר תשלומים' : '▼ תצוגת תשלומים'}
      </button>

      {/* ─── פאנל תשלומים ─── */}
      {showPayments && (
        <div className="supplier-card__payments">
          {loadingPay ? (
            <div className="supplier-card__payments-loading"><Spinner size="sm" /></div>
          ) : !payments?.length ? (
            <div className="supplier-card__payments-empty">אין תשלומים רשומים</div>
          ) : (
            <table className="data-table supplier-card__payments-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>סכום</th>
                  <th>אמצעי תשלום</th>
                  <th>חשבונית</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td>{formatDate(p.date)}</td>
                    <td><strong>{formatCurrency(p.amount)}</strong></td>
                    <td>{p.payment_method?.name || '—'}</td>
                    <td>
                      {p.invoices?.length > 0 ? (
                        <div className="supplier-card__invoices">
                          {p.invoices.map((inv, idx) => (
                            <a
                              key={idx}
                              href={inv.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="supplier-card__invoice-link"
                              title={inv.reference_number ? `חשבונית ${inv.reference_number}` : `חשבונית ${idx + 1}`}
                            >
                              📄 {inv.reference_number || `חשבונית ${idx + 1}`}
                            </a>
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
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierCard;
