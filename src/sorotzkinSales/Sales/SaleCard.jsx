import Pagination from '../Common/Pagination';
import Swal from 'sweetalert2';
import React, { useState, useMemo } from 'react';
import { Button, Badge, Modal, Spinner } from '../Common/UI';
import { formatDate, formatCurrency } from '../utils';
import { addProductsToSale, closeSale, getSaleDetail, removeSaleItem, deleteSale } from '../api';
import ProductPicker from './ProductPicker';
import CloseSaleForm from './CloseSaleForm';

const SaleCard = ({ sale, products, showToast, refetch, isExpanded, onToggle, onCollapse }) => {
  const [addModal, setAddModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saleItems, setSaleItems] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOpen = sale.status === 'open';
  const [prodPage, setProdPage] = useState(1);
  const PROD_PAGE_SIZE = 10;

  const activeProducts = useMemo(() => (products || []).filter(p => p.is_active), [products]);

  // supplierMap נבנה מהמוצרים — מועבר ל-ProductPicker ו-CloseSaleForm למיון לפי ספק
  const supplierMap = useMemo(() => {
    const map = {};
    (products || []).forEach(p => {
      if (p.supplier_id && p.supplier_name) map[p.supplier_id] = p.supplier_name;
    });
    return map;
  }, [products]);

  React.useEffect(() => { if (!isExpanded) setProdPage(1); }, [isExpanded]);

  const handleToggle = async () => {
    onToggle();
    if (!isExpanded && !saleDetail) {
      try {
        const data = await getSaleDetail(sale.id);
        setSaleDetail(data);
      } catch (_) { }
    }
  };

  const fetchAndOpenClose = async () => {
    setLoading(true);
    try {
      const data = await getSaleDetail(sale.id);
      const rawProducts = data['מוצרים'] || [];
      if (!rawProducts.length) return showToast('אין מוצרים משויכים למכירה זו', 'error');
      const items = rawProducts
        .map(p => {
          const match = (products || []).find(prod => prod.name === p['מוצר']);
          return {
            product_id: match?.id ?? null,
            opening_stock: (p['יצא למכירה'] || 0),
            products: { name: p['מוצר'] }
          };
        })
        .filter(i => i.product_id !== null);
      if (!items.length) return showToast('לא ניתן לזהות את המוצרים במכירה', 'error');
      setSaleItems(items);
      setCloseModal(true);
    } catch (e) { showToast(e.message || 'שגיאה בטעינת פריטי המכירה', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteSale = async () => {
    const result = await Swal.fire({
      title: 'מחיקת מכירה',
      text: `האם למחוק את "${sale.name}"? פעולה זו אינה הפיכה.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      await deleteSale(sale.id);
      showToast('המכירה נמחקה בהצלחה');
      refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleRemoveProduct = async (productName) => {
    const result = await Swal.fire({
      title: 'הסרת מוצר',
      text: `האם להסיר את "${productName}" מהמכירה?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'הסר',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;
    setLoading(true);

    try {
      const prod = (products || []).find(p => p.name === productName);
      if (!prod) return showToast('לא נמצא המוצר', 'error');
      await removeSaleItem(sale.id, prod.id);
      showToast('המוצר הוסר מהמכירה');
      const data = await getSaleDetail(sale.id);
      setSaleDetail(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleAddProducts = async () => {
    if (!selectedProducts.length) return showToast('יש לבחור לפחות מוצר אחד', 'error');
    setLoading(true);

    try {
      await addProductsToSale(sale.id, selectedProducts);
      showToast('המוצרים נוספו בהצלחה');
      setAddModal(false); setSelectedProducts([]);
      const data = await getSaleDetail(sale.id);
      setSaleDetail(data);
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('חוסר במלאי')) {
        const prodMatch = msg.match(/מוצר (\d+)/);
        const stockMatch = msg.match(/במלאי: (\d+)/);
        const prodName = prodMatch
          ? (products || []).find(p => p.id === Number(prodMatch[1]))?.name || `מוצר ${prodMatch[1]}`
          : 'מוצר';
        showToast(`אין מספיק מלאי עבור "${prodName}"${stockMatch ? ` — נותר: ${stockMatch[1]}` : ''}`, 'error');
      } else {
        showToast(msg || 'שגיאה בהוספת המוצרים', 'error');
      }
    }
    finally { setLoading(false); }
  };

  const handleCloseSale = async (saleId, prods) => {
    setLoading(true);
    try {
      await closeSale(saleId, prods);
      showToast('המכירה נסגרה בהצלחה');
      setCloseModal(false);
      setSaleDetail(null);
      onCollapse?.();
      refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const saleProducts = saleDetail?.['מוצרים'] || [];
  const summary = saleDetail?.['סיכום_כספי'];
  const totalProdPages = Math.max(1, Math.ceil(saleProducts.length / PROD_PAGE_SIZE));
  const prodPaginated = saleProducts.slice((prodPage - 1) * PROD_PAGE_SIZE, prodPage * PROD_PAGE_SIZE);

  return (
    <div className="card sale-card">
      <div className="sale-card__header" onClick={handleToggle}>
        <div className="sale-card__info">
          <div className={`sale-card__icon sale-card__icon--${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? '🔓' : '🔒'}
          </div>
          <div>
            <div className="sale-card__name">{sale.name}</div>
            <div className="sale-card__date">{formatDate(sale.date)}</div>
          </div>
        </div>
        <div className="sale-card__meta">
          <Badge variant={isOpen ? 'success' : 'default'}>{isOpen ? 'פתוחה' : 'סגורה'}</Badge>
          <span className={`sale-card__chevron${isExpanded ? ' sale-card__chevron--open' : ''}`}>▼</span>
        </div>
      </div>

      {/* ─── פאנל פרטים נפתח ─── */}
      {isExpanded && (
        <div className="sale-detail">
          {/* כפתורי פעולה — רק למכירה פתוחה */}
          {isOpen && (
            <div className="sale-detail__actions">
              <Button size="sm" variant="secondary" onClick={() => setAddModal(true)}>+ הוסף מוצרים</Button>
              <Button size="sm" variant="success" onClick={fetchAndOpenClose} disabled={loading}>
                {loading ? 'טוען...' : '🔒 סגור מכירה'}
              </Button>
              <Button size="sm" variant="danger" onClick={handleDeleteSale} disabled={loading}>
                🗑 מחק מכירה
              </Button>
            </div>
          )}

          {detailLoading ? (
            <div className="sale-detail__loading"><Spinner size="sm" /></div>
          ) : saleProducts.length > 0 ? (
            <div className="sale-detail__products">
              <div className="sale-detail__products-title">מוצרים במכירה</div>
              <table className="data-table sale-detail__table">
                <thead>
                  <tr>
                    <th>מוצר</th>
                    <th>כמות התחלתית</th>
                    {!isOpen && <th>נמכר</th>}
                    {!isOpen && <th>חזר</th>}
                    {!isOpen && <th>סה"כ עלות</th>}
                    {!isOpen && <th>סה"כ הכנסה</th>}
                    {isOpen && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {prodPaginated.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p['מוצר']}</strong></td>
                      <td>{p['יצא למכירה'] ?? (p['נמכר'] || 0) + (p['חזר'] || 0)}</td>
                      {!isOpen && <td>{p['נמכר'] ?? '—'}</td>}
                      {!isOpen && <td>{p['חזר'] ?? '—'}</td>}
                      {!isOpen && <td>{p['סה"כ מחיר עלות'] != null ? formatCurrency(p['סה"כ מחיר עלות']) : '—'}</td>}
                      {!isOpen && <td>{p['סה"כ מחיר מכירה'] != null ? formatCurrency(p['סה"כ מחיר מכירה']) : '—'}</td>}
                      {isOpen && (
                        <td>
                          <button type="button" className="sale-item__remove-btn"
                            onClick={() => handleRemoveProduct(p['מוצר'])}
                            title="הסר מוצר מהמכירה">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={prodPage}
                totalPages={totalProdPages}
                onChange={setProdPage}
              />
              
              {/* סיכום כספי — רק למכירה סגורה */}
              {!isOpen && summary && (
                <div className="sale-detail__summary">
                  <span>סה"כ הכנסה: <strong>{formatCurrency(summary['סה"כ מחיר מכירה'])}</strong></span>
                  <span>רווח: <strong className="profit--positive">{formatCurrency(summary['רווח'])}</strong></span>
                </div>
              )}
            </div>
          ) : saleDetail && !saleDetail.error ? (
            <div className="sale-detail__empty">אין מוצרים משויכים למכירה זו עדיין</div>
          ) : 'טוען פריטים...'}
        </div>
      )}

      {/* ─── מודל הוספת מוצרים ─── */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setSelectedProducts([]); }}
        title={`הוספת מוצרים — ${sale.name}`} width="620px">
        <ProductPicker
          products={activeProducts}
          selected={selectedProducts}
          onChange={setSelectedProducts}
          supplierMap={supplierMap}
        />
        <div className="form-actions sale-card__form-actions">
          <Button variant="ghost" onClick={() => { setAddModal(false); setSelectedProducts([]); }}>ביטול</Button>
          <Button onClick={handleAddProducts} disabled={loading || !selectedProducts.length}>
            {loading ? 'מוסיף...' : 'הוסף מוצרים'}
          </Button>
        </div>
      </Modal>

      {/* ─── מודל סגירת מכירה ─── */}
      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)}
        title={`סגירת מכירה — ${sale.name}`} width="580px">
        {saleItems && (
          <CloseSaleForm
            saleId={sale.id}
            saleItems={saleItems}
            products={products}
            onSubmit={handleCloseSale}
            onClose={() => setCloseModal(false)}
            loading={loading}
            supplierMap={supplierMap}
          />
        )}
      </Modal>
    </div>
  );
};

export default SaleCard;
