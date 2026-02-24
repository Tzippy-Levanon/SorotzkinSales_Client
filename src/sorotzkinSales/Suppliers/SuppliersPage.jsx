import React, { useState, useMemo } from 'react';
import { useAsync } from '../utils';
import {
  getSuppliers, addSupplier, updateSupplier,
  recordStockArrival, recordPayment, uploadInvoice,
  getSupplierPayments
} from '../api';
import { getProducts } from '../api';
import { Button, Modal, FormField, Input, EmptyState, Spinner } from '../Common/UI';
import AppSelect from '../Common/AppSelect';
import { formatCurrency, formatDate } from '../utils';
import SupplierCard from './SupplierCard';
import SupplierForm from './SupplierForm';
import StockArrivalForm from './StockArrivalForm';
import PaymentForm from './PaymentForm';

const SuppliersPage = ({ showToast }) => {
  const { data: _suppliersRaw, loading, refetch } = useAsync(getSuppliers);
  const suppliers = Array.isArray(_suppliersRaw) ? _suppliersRaw
    : Array.isArray(_suppliersRaw?.data) ? _suppliersRaw.data
      : null;
  const { data: products } = useAsync(getProducts);

  const [modal, setModal] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── העלאת חשבונית ───────────────────────────────────────────────────────
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    supplier_id: '', supplier_payment_id: '', amount: '', reference_number: ''
  });
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // ─── pagination ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const totalDebt = useMemo(() => (suppliers || []).reduce((s, sup) => s + (sup.balance || 0), 0), [suppliers]);
  const totalPages = Math.max(1, Math.ceil((suppliers?.length || 0) / PAGE_SIZE));
  const paginated = (suppliers || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const closeModal = () => {
    setModal(null); setEditSupplier(null);
    setInvoiceFile(null);
    setInvoiceForm({ supplier_id: '', supplier_payment_id: '', amount: '', reference_number: '' });
    setSupplierPayments([]);
  };

  const handleSubmitSupplier = async (form) => {
    setSubmitting(true);
    try {
      if (editSupplier) {
        await updateSupplier(editSupplier.id, form);
        showToast('הספק עודכן בהצלחה');
      } else {
        await addSupplier(form);
        showToast('הספק נוסף בהצלחה');
      }
      closeModal(); refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleArrival = async (form) => {
    setSubmitting(true);
    try { await recordStockArrival(form); showToast('הגעת הסחורה נרשמה בהצלחה'); closeModal(); refetch(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handlePayment = async (form) => {
    setSubmitting(true);
    try { await recordPayment(form); showToast('התשלום נרשם בהצלחה'); closeModal(); refetch(); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  // כשנבחר ספק בטופס חשבונית — טוען את התשלומים שלו
  const handleSupplierChange = async (supplierId) => {
    setInvoiceForm(f => ({ ...f, supplier_id: supplierId, supplier_payment_id: '' }));
    if (!supplierId) { setSupplierPayments([]); return; }
    setLoadingPayments(true);
    try {
      const payments = await getSupplierPayments(supplierId);
      setSupplierPayments(Array.isArray(payments) ? payments : []);
    } catch (_) { setSupplierPayments([]); }
    finally { setLoadingPayments(false); }
  };

  const handleUploadInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.supplier_id) return showToast('יש לבחור ספק', 'error');
    if (!invoiceForm.supplier_payment_id) return showToast('יש לבחור תשלום', 'error');
    if (!invoiceFile) return showToast('יש לבחור קובץ', 'error');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', invoiceFile);
      fd.append('supplier_payment_id', invoiceForm.supplier_payment_id);
      if (invoiceForm.amount) fd.append('amount', invoiceForm.amount);
      if (invoiceForm.reference_number) fd.append('reference_number', invoiceForm.reference_number);
      await uploadInvoice(fd);
      showToast('החשבונית הועלתה בהצלחה'); closeModal();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* ─── כותרת עמוד ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול ספקים</h1>
          <p className="page-subtitle">{suppliers ? `${suppliers.length} ספקים | חוב כולל: ${formatCurrency(totalDebt)}` : ''}</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => setModal('arrival')}>📦 הגעת סחורה</Button>
          <Button variant="secondary" onClick={() => setModal('payment')}>💳 רישום תשלום</Button>
          <Button variant="secondary" onClick={() => setModal('invoice')}>📄 העלאת חשבונית</Button>
          <Button icon="+" onClick={() => setModal('add')}>ספק חדש</Button>
        </div>
      </div>

      {/* ─── גריד ספקים ─── */}
      {loading ? (
        <div className="loading-center"><Spinner size="lg" /></div>
      ) : !suppliers?.length ? (
        <EmptyState icon="🏢" title="אין ספקים" description="הוסף ספק ראשון" />
      ) : (
        <div className="suppliers-grid">
          {paginated.map(s => (
            <SupplierCard key={s.id} supplier={s} onEdit={() => { setEditSupplier(s); setModal('edit'); }} />
          ))}
        </div>
      )}

      {/* pagination */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button className="pagination__btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&#8250; הקודם</button>
          <span className="pagination__info">דף {page} מתוך {totalPages} ({(suppliers || []).length} ספקים)</span>
          <button className="pagination__btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>הבא &#8249;</button>
        </div>
      )}

      {/* ─── מודאלים ─── */}
      <Modal isOpen={modal === 'add'} onClose={closeModal} title="הוספת ספק חדש">
        <SupplierForm onSubmit={handleSubmitSupplier} onClose={closeModal} loading={submitting} />
      </Modal>
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title={`עריכת ספק — ${editSupplier?.name}`}>
        <SupplierForm initial={editSupplier} onSubmit={handleSubmitSupplier} onClose={closeModal} loading={submitting} />
      </Modal>
      <Modal isOpen={modal === 'arrival'} onClose={closeModal} title="רישום הגעת סחורה" width="680px">
        <StockArrivalForm suppliers={suppliers || []} products={products || []} onSubmit={handleArrival} onClose={closeModal} loading={submitting} />
      </Modal>
      <Modal isOpen={modal === 'payment'} onClose={closeModal} title="רישום תשלום לספק" width="500px">
        <PaymentForm suppliers={suppliers || []} onSubmit={handlePayment} onClose={closeModal} loading={submitting} />
      </Modal>

      {/* ─── העלאת חשבונית — ספק → תשלום → קובץ ─── */}
      <Modal isOpen={modal === 'invoice'} onClose={closeModal} title="העלאת חשבונית / קבלה" width="480px">
        <form onSubmit={handleUploadInvoice} noValidate>

          {/* שלב 1: בחירת ספק */}
          <FormField label="ספק" required>
            <AppSelect
              options={(suppliers || []).map(s => ({ value: s.id, label: s.name }))}
              value={invoiceForm.supplier_id}
              onChange={id => handleSupplierChange(id)}
              placeholder="בחר ספק..."
              noOptionsMessage="אין ספקים"
            />
          </FormField>

          {/* שלב 2: בחירת תשלום — מופיע רק אחרי בחירת ספק */}
          <FormField label="תשלום" required>
            {loadingPayments ? (
              <div className="invoice-payments-loading"><Spinner size="sm" /> טוען תשלומים...</div>
            ) : supplierPayments.length > 0 ? (
              <AppSelect
                options={supplierPayments.map(p => ({
                  value: p.id,
                  label: `${formatDate(p.date)} — ${formatCurrency(p.amount)}${p.payment_method?.name ? ` (${p.payment_method.name})` : ''}`
                }))}
                value={invoiceForm.supplier_payment_id}
                onChange={id => setInvoiceForm(f => ({ ...f, supplier_payment_id: id }))}
                placeholder="בחר תשלום..."
                noOptionsMessage="אין תשלומים"
              />
            ) : (
              <div className="invoice-no-payments">
                {invoiceForm.supplier_id ? 'אין תשלומים רשומים לספק זה' : 'יש לבחור ספק תחילה'}
              </div>
            )}
          </FormField>

          {/* שלב 3: קובץ + פרטים נוספים */}
          <FormField label="קובץ (PDF / תמונה / Word)" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="form-input" onChange={e => setInvoiceFile(e.target.files[0])} />
          </FormField>
          <div className="form-grid-2">
            <FormField label="סכום חשבונית">
              <Input type="number" value={invoiceForm.amount}
                onChange={e => setInvoiceForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </FormField>
            <FormField label="מספר חשבונית">
              <Input value={invoiceForm.reference_number}
                onChange={e => setInvoiceForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="מס' חשבונית" />
            </FormField>
          </div>
          <div className="form-actions">
            <Button variant="ghost" onClick={closeModal} type="button">ביטול</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'מעלה...' : 'העלה קובץ'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersPage;
