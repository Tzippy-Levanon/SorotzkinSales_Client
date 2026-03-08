import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { useAsync } from '../utils';                                    // תוקן
import { getSales, addSale } from '../api';                              // תוקן
import { getProducts } from '../api';                              // תוקן
import { Button, Modal, FormField, Input, Card, EmptyState, Spinner } from '../Common/UI';
import SaleCard from './SaleCard';

const SalesPage = ({ showToast }) => {
  const { data: sales, loading, refetch } = useAsync(getSales);

  // Pagination — 5 מכירות לדף (כרטיסים גדולים, לא שורות קטנות)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // 10 מכירות בדף
  const totalPages = Math.max(1, Math.ceil((sales?.length || 0) / PAGE_SIZE));
  const paginated = (sales || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: products } = useAsync(getProducts);
  const [newSaleModal, setNewSaleModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedSale, setExpandedSale] = useState(null);

  const handleAddSale = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const sale = await addSale(form);
      showToast('המכירה נוצרה בהצלחה');
      setNewSaleModal(false);
      setForm({ name: '', date: '' });
      refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* ─── כותרת עמוד ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מכירות</h1>
          <p className="page-subtitle">{sales ? `${sales.length} מכירות במערכת` : ''}</p>
        </div>
        <Button icon="+" onClick={() => setNewSaleModal(true)}>מכירה חדשה</Button>
      </div>

      {/* ─── רשימת מכירות ─── */}
      {loading ? (
        <div className="loading-center"><Spinner size="lg" /></div>
      ) : !sales?.length ? (
        <EmptyState icon="🏷️" title="אין מכירות" description="צור מכירה חדשה להתחיל" />
      ) : (
        <div className="sales-list">
          {paginated.map(sale => (
            <SaleCard
              key={sale.id}
              sale={sale}
              products={products}
              showToast={showToast}
              refetch={refetch}
              isExpanded={expandedSale === sale.id}
              onToggle={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
              onCollapse={() => setExpandedSale(null)}
            />
          ))}
        </div>
      )}

      {/* ניווט דפים */}
      {!loading && <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />}

      {/* ─── מודל מכירה חדשה ─── */}
      <Modal isOpen={newSaleModal} onClose={() => setNewSaleModal(false)} title="מכירה חדשה" width="420px">
        <form onSubmit={handleAddSale}>
          <FormField label="שם המכירה" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="למשל: מכירת קיץ 2025" required />
          </FormField>
          <FormField label="תאריך" required>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </FormField>
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setNewSaleModal(false)} type="button">ביטול</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'יוצר...' : 'צור מכירה'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesPage;
