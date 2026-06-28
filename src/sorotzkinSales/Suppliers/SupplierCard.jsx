import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { Button, Spinner, Modal } from '../Common/UI';
import { formatCurrency, formatDate } from '../utils';
import { getSupplierPayments } from '../api';

// ── SupplierCard ── כרטיס ספק עם פרטי קשר, יתרת חוב ומודל היסטוריית תשלומים
const SupplierCard = ({ supplier, onEdit }) => {
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [payments, setPayments] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  // ── openPayments ── טוען תשלומים מהשרת בכל פתיחה (מרענן תמיד)
  const openPayments = async () => {
    setPaymentsOpen(true);
    setPage(1);
    setPayments(null);
    setLoadingPay(true);
    try {
      const data = await getSupplierPayments(supplier.id);
      setPayments(Array.isArray(data) ? data : []);
    } catch (_) {
      setPayments([]);
    } finally {
      setLoadingPay(false);
    }
  };

  const allPayments = payments || [];
  const totalPages = Math.max(1, Math.ceil(allPayments.length / PAGE_SIZE));
  const pagPayments = allPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── openInvoice ── פותח קובץ חשבונית — URL מלא או יחסי לשרת
  const openInvoice = (fileUrl) => {
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      const serverBase = import.meta.env.REACR_API_URL
        ? import.meta.env.REACT_API_URL.replace('/api', '')
        : 'http://localhost:5000';
      window.open(`${serverBase}/${fileUrl}`, '_blank');
    }
  };

  return (
    <div className="card supplier-card">
      <div className="supplier-card__header">
        <div>
          <div className="supplier-card__name">{supplier.name}</div>
          {supplier.company_name && (
            <div className="supplier-card__company">{supplier.company_name}</div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>עריכה</Button>
      </div>
      <div className="supplier-card__contacts">
        {supplier.phone && (
          <div className="supplier-card__contact-row"><span>📞</span>{supplier.phone}</div>
        )}
        {supplier.email && (
          <div className="supplier-card__contact-row"><span>✉️</span>{supplier.email}</div>
        )}
      </div>
      <div className="supplier-card__balance">
        <div className="supplier-card__balance-label">יתרת חוב</div>
        <div className="supplier-card__balance-amount">
          {formatCurrency(supplier.balance)}
        </div>
      </div>
      <button className="supplier-card__payments-toggle" onClick={openPayments}>
        ▼ תצוגת תשלומים
      </button>

      <Modal
        isOpen={paymentsOpen}
        onClose={() => setPaymentsOpen(false)}
        title={`היסטוריית תשלומים — ${supplier.name}`}
        width="680px"
      >
        {loadingPay ? (
          <div className="supplier-card__payments-loading"><Spinner size="sm" /></div>

        ) : !allPayments.length ? (
          <div className="supplier-card__payments-empty">אין תשלומים רשומים עדיין</div>

        ) : (
          <>
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
