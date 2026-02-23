import React, { useState, useMemo } from 'react';
import { useAsync } from '../utils';                                       // תוקן
import {
  getSuppliers, addSupplier, updateSupplier,
  recordStockArrival, recordPayment, uploadInvoice,
  getSupplierPayments
} from '../api'; // תוקן
import { getProducts } from '../api';                                      // תוקן
import { Button, Modal, FormField, Input, Select, Card, EmptyState, Spinner } from '../Common/UI';
import { formatCurrency, formatDate } from '../utils';
import SupplierCard from './SupplierCard';
import SupplierForm from './SupplierForm';
import StockArrivalForm from './StockArrivalForm';
import PaymentForm from './PaymentForm';

const SuppliersPage = ({ showToast }) => {
  const { data: _suppliersRaw, loading, refetch } = useAsync(getSuppliers);
  // הגנה מפני מקרה שהשרת מחזיר אובייקט במקום מערך
  const suppliers = Array.isArray(_suppliersRaw) ? _suppliersRaw
    : Array.isArray(_suppliersRaw?.data) ? _suppliersRaw.data
      : null;
  const { data: products } = useAsync(getProducts);

  const [modal, setModal] = useState(null); // 'add'|'edit'|'arrival'|'payment'|'invoice'
  const [editSupplier, setEditSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({ supplier_id: '', supplier_payment_id: '', amount: '', reference_number: '' });
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const closeModal = () => { setModal(null); setEditSupplier(null); };

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

  // כשנבחר ספק — טוען את רשימת התשלומים שלו
  const handleSupplierChange = async (supplierId) => {
    setInvoiceForm(f => ({ ...f, supplier_id: supplierId, supplier_payment_id: '' }));
    if (!supplierId) { setSupplierPayments([]); return; }
    setLoadingPayments(true);
    try {
      const payments = await getSupplierPayments(supplierId);
      setSupplierPayments(payments || []);
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
      if (invoiceForm.supplier_payment_id) fd.append('supplier_payment_id', invoiceForm.supplier_payment_id);
      if (invoiceForm.amount) fd.append('amount', invoiceForm.amount);
      if (invoiceForm.reference_number) fd.append('reference_number', invoiceForm.reference_number);
      await uploadInvoice(fd);
      showToast('החשבונית הועלתה בהצלחה'); closeModal();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const totalDebt = useMemo(() => (suppliers || []).reduce((s, sup) => s + (sup.balance || 0), 0), [suppliers]);

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
          {suppliers.map(s => (
            <SupplierCard key={s.id} supplier={s} onEdit={() => { setEditSupplier(s); setModal('edit'); }} />
          ))}
        </div>
      )}

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
      <Modal isOpen={modal === 'invoice'} onClose={closeModal} title="העלאת חשבונית / קבלה" width="480px">
        <form onSubmit={handleUploadInvoice}>
          {/* ─── בחירת ספק ─── */}
          <FormField label="ספק" required>
            <Select
              value={invoiceForm.supplier_id || ''}
              onChange={e => handleSupplierChange(e.target.value)}
              required
            >
              <option value="">בחר ספק...</option>
              {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          {/* ─── בחירת תשלום — dropdown לפי הספק שנבחר ─── */}
          <FormField label="תשלום" required>
            {loadingPayments ? (
              <div className="invoice-payments-loading"><Spinner size="sm" /> טוען תשלומים...</div>
            ) : supplierPayments.length > 0 ? (
              <Select
                value={invoiceForm.supplier_payment_id}
                onChange={e => setInvoiceForm(f => ({ ...f, supplier_payment_id: e.target.value }))}
                required
              >
                <option value="">בחר תשלום...</option>
                {supplierPayments.map(p => (
                  <option key={p.id} value={p.id}>
                    {formatDate(p.date)} — {formatCurrency(p.amount)}
                    {p.payment_method?.name ? ` (${p.payment_method.name})` : ''}
                  </option>
                ))}
              </Select>
            ) : (
              <div className="invoice-no-payments">
                {invoiceForm.supplier_id ? 'אין תשלומים רשומים לספק זה' : 'יש לבחור ספק תחילה'}
              </div>
            )}
          </FormField>
          <FormField label="קובץ (PDF / תמונה / Word)" required>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="form-input" onChange={e => setInvoiceFile(e.target.files[0])} />
          </FormField>
          <div className="form-grid-2">
            <FormField label="סכום חשבונית">
              <Input type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </FormField>
            <FormField label="מספר חשבונית">
              <Input value={invoiceForm.reference_number} onChange={e => setInvoiceForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="מס' חשבונית" />
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
