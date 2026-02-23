import React, { useState, useMemo } from 'react';
import { useAsync } from '../utils';                              // תוקן: היה ../../hooks/useAsync
import { getProducts, addProduct, updateProduct } from '../api';     // תוקן: היה ../api/products
import { getSuppliers } from '../api';                              // תוקן: היה ../api/suppliers
import { Button, Modal, Card, EmptyState, Spinner, ConfirmDialog } from '../Common/UI';
import { formatCurrency } from '../utils';
import ProductForm from './ProductForm';
import ProductsTable from './ProductsTable';

const ProductsPage = ({ showToast }) => {
  const { data: _productsRaw, loading, refetch } = useAsync(getProducts);
  const { data: _suppliersRaw } = useAsync(getSuppliers);
  // הגנה: ודא שתמיד מערך (גם אם השרת מחזיר אובייקט/null)
  const products = Array.isArray(_productsRaw) ? _productsRaw : [];
  const suppliers = Array.isArray(_suppliersRaw) ? _suppliersRaw : [];

  const [page, setPage] = useState(1);   // דף נוכחי (pagination)
  const [searchText, setSearchText] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [filterInactive, setFilterInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);

  const filtered = useMemo(() => {
    if (!products.length && loading) return [];
    return products.filter(p => {
      if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterSupplier && String(p.supplier_id) !== filterSupplier) return false;
      if (filterOutOfStock && p.total_in_stock > 0) return false;
      if (!filterInactive && !p.is_active) return false;
      return true;
    });
  }, [products, searchText, filterSupplier, filterOutOfStock, filterInactive]);

  const supplierMap = useMemo(() =>
    Object.fromEntries((suppliers || []).map(s => [s.id, s.name])), [suppliers]);

  // ─── Pagination — 20 מוצרים לדף ────────────────────────────────────────
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / PAGE_SIZE));
  const paginated = (filtered || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // אפס לדף 1 כשמשתנה הסינון
  React.useEffect(() => { setPage(1); }, [searchText, filterSupplier, filterOutOfStock, filterInactive]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, form);
        showToast('המוצר עודכן בהצלחה');
      } else {
        await addProduct(form);
        showToast('המוצר נוסף בהצלחה');
      }
      setModalOpen(false); setEditProduct(null); refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateConfirm) return;
    try {
      await updateProduct(deactivateConfirm.id, { is_active: false });
      showToast('המוצר הועבר ללא פעיל');
      refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setDeactivateConfirm(null); }
  };

  return (
    <div>
      {/* ─── כותרת עמוד ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מלאי</h1>
          <p className="page-subtitle">{products ? `${products.length} מוצרים במערכת` : ''}</p>
        </div>
        <Button icon="+" onClick={() => { setEditProduct(null); setModalOpen(true); }}>מוצר חדש</Button>
      </div>

      {/* ─── פילטרים ─── */}
      <Card className="products-filters">
        <div className="products-filters__search">
          <span className="products-filters__search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="חיפוש לפי שם מוצר..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ paddingRight: '36px' }}
          />
        </div>
        <select
          className="form-select products-filters__select"
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
        >
          <option value="">כל הספקים</option>
          {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="products-filters__checkbox">
          <input type="checkbox" checked={filterOutOfStock} onChange={e => setFilterOutOfStock(e.target.checked)} />
          אזל מהמלאי
        </label>
        <label className="products-filters__checkbox">
          <input type="checkbox" checked={filterInactive} onChange={e => setFilterInactive(e.target.checked)} />
          הצג גם לא פעילים
        </label>
        {(searchText || filterSupplier || filterOutOfStock) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchText(''); setFilterSupplier(''); setFilterOutOfStock(false); }}>
            נקה סינון
          </Button>
        )}
      </Card>

      {/* ─── טבלה ─── */}
      {loading ? (
        <div className="loading-center"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📦" title="לא נמצאו מוצרים" description="נסה לשנות את הסינון או הוסף מוצר חדש" />
      ) : (
        <Card>
          <ProductsTable
            products={paginated}
            supplierMap={supplierMap}
            onEdit={p => { setEditProduct(p); setModalOpen(true); }}
            onDeactivate={p => setDeactivateConfirm(p)}
          />
        </Card>
      )}

      {/* ─── מודל הוספה/עריכה ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        title={editProduct ? `עריכת מוצר — ${editProduct.name}` : 'הוספת מוצר חדש'}
      >
        <ProductForm
          initial={editProduct}
          suppliers={suppliers || []}
          onSubmit={handleSubmit}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
          loading={submitting}
        />
      </Modal>

      {/* ─── אישור השבתה ─── */}
      <ConfirmDialog
        isOpen={!!deactivateConfirm}
        onClose={() => setDeactivateConfirm(null)}
        onConfirm={handleDeactivate}
        title="השבתת מוצר"
        message={`האם להשבית את "${deactivateConfirm?.name}"? המוצר לא יופיע ברשימות הבחירה למכירות.`}
        confirmLabel="השבת"
        danger
      />
    </div>
  );
};

export default ProductsPage;
