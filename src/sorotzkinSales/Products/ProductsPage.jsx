import Pagination from '../Common/Pagination';
import React, { useState, useMemo } from 'react';
import { useAsync } from '../utils';
import { getProducts, addProduct, updateProduct } from '../api';
import { getSuppliers } from '../api';
import { Button, Modal, Card, EmptyState, Spinner, ConfirmDialog } from '../Common/UI';
import ProductForm from './ProductForm';
import AppSelect from '../Common/AppSelect';
import ProductsTable from './ProductsTable';

const ProductsPage = ({ showToast }) => {
  const { data: products, loading, refetch } = useAsync(getProducts);
  const { data: suppliers } = useAsync(getSuppliers);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [searchText, setSearchText] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [filterInactive, setFilterInactive] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'supplier'
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);

  const supplierMap = useMemo(() =>
    Object.fromEntries((suppliers || []).map(s => [s.id, s.name])), [suppliers]);

  // ── filtered ── מסנן מוצרים לפי חיפוש, ספק, מלאי וסטטוס
  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : (products?.data || []);
    return list.filter(p => {
      if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterSupplier && String(p.supplier_id) !== filterSupplier) return false;
      if (filterOutOfStock && p.total_in_stock > 0) return false;
      if (!filterInactive && !p.is_active) return false;
      return true;
    });
  }, [products, searchText, filterSupplier, filterOutOfStock, filterInactive]);

  // ── sorted ── ממיין לפי שם או ספק
  const sorted = useMemo(() => {
    if (sortBy === 'supplier') {
      return [...filtered].sort((a, b) => {
        const sA = supplierMap[a.supplier_id] || '';
        const sB = supplierMap[b.supplier_id] || '';
        return sA.localeCompare(sB, 'he') || a.name.localeCompare(b.name, 'he');
      });
    }
    return filtered;
  }, [filtered, sortBy, supplierMap]);

  React.useEffect(() => { setPage(1); }, [searchText, filterSupplier, filterOutOfStock, filterInactive, sortBy]);

  const totalPages = Math.max(1, Math.ceil((sorted?.length || 0) / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── handleSubmit ── שמירת מוצר חדש או עדכון קיים
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
    } catch (e) {
      const msg = e.message || '';
      const isDuplicate = msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('unique') ||
        msg.includes('_key') || msg.includes('23505');
      if (isDuplicate) {
        showToast('מוצר עם שם זה כבר קיים במלאי — לא ניתן להוסיפו שנית', 'error');
      } else {
        showToast(msg || 'שגיאה בשמירת המוצר', 'error');
      }
    }
    finally { setSubmitting(false); }
  };

  // ── handleDeactivate ── השבתת מוצר (במקום מחיקה)
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
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול מלאי</h1>
          <p className="page-subtitle">{!loading && products ? `${Array.isArray(products) ? products.length : (products?.data?.length || 0)} מוצרים במערכת` : ''}</p>
        </div>
        <Button icon="+" onClick={() => { setEditProduct(null); setModalOpen(true); }}>מוצר חדש</Button>
      </div>

      <Card className="products-filters">
        <div className="products-filters__search">
          <span className="products-filters__search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="חיפוש מוצר..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ paddingRight: '36px' }}
          />
        </div>
        <div className="products-filters__select">
          <AppSelect
            options={[{ value: '', label: 'כל הספקים' }, ...(suppliers || []).map(s => ({ value: s.id, label: s.name }))]}
            value={filterSupplier}
            onChange={id => setFilterSupplier(id)}
            placeholder="כל הספקים"
            noOptionsMessage="אין ספקים"
          />
        </div>
        <label className="products-filters__checkbox">
          <input type="checkbox" checked={filterOutOfStock} onChange={e => setFilterOutOfStock(e.target.checked)} />
          אזלו מהמלאי
        </label>
        <label className="products-filters__checkbox">
          <input type="checkbox" checked={filterInactive} onChange={e => setFilterInactive(e.target.checked)} />
          הצג לא פעילים
        </label>
        {(searchText || filterSupplier || filterOutOfStock) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchText(''); setFilterSupplier(''); setFilterOutOfStock(false); }}>
            נקה סינון
          </Button>
        )}
        <div className="products-filters__sort">
          <button className={`sort-btn${sortBy === 'name' ? ' sort-btn--active' : ''}`} onClick={() => setSortBy('name')}>א-ב</button>
          <button className={`sort-btn${sortBy === 'supplier' ? ' sort-btn--active' : ''}`} onClick={() => setSortBy('supplier')}>לפי ספק</button>
        </div>
      </Card>

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

      {!loading && <Pagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
      />}

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
