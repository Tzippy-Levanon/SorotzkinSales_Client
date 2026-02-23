import React, { useState, useMemo } from 'react';
import { Button, Badge, Modal, Spinner } from '../Common/UI';
import { formatDate, formatCurrency } from '../utils';
import { addProductsToSale, closeSale, getSaleDetail } from '../api';
import ProductPicker from './ProductPicker';
import CloseSaleForm from './CloseSaleForm';

const SaleCard = ({ sale, products, showToast, refetch, isExpanded, onToggle }) => {
  const [addModal, setAddModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [saleItems, setSaleItems] = useState(null);
  const [saleDetail, setSaleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOpen = sale.status === 'open';
  const activeProducts = useMemo(() => (products || []).filter(p => p.is_active), [products]);

  const handleToggle = async () => {
    onToggle();
    // טוען פרטים רק בפתיחה, ורק אם עוד לא נטענו
    if (!isExpanded && !saleDetail) {
      setDetailLoading(true);
      try {
        const data = await getSaleDetail(sale.id);
        setSaleDetail(data);
      } catch (_) {
        setSaleDetail({ error: true });
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const fetchAndOpenClose = async () => {
    setLoading(true);
    try {
      const data = saleDetail || await getSaleDetail(sale.id);
      const rawProducts = data['מוצרים'] || [];
      if (!rawProducts.length) return showToast('אין מוצרים משויכים למכירה זו', 'error');
      const items = rawProducts
        .map(p => {
          const match = (products || []).find(prod => prod.name === p['מוצר']);
          return {
            product_id: match?.id ?? null,
            opening_stock: (p['נמכר'] || 0) + (p['חזר'] || 0),
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

  const handleAddProducts = async () => {
    if (!selectedProducts.length) return showToast('יש לבחור לפחות מוצר אחד', 'error');
    setLoading(true);
    try {
      await addProductsToSale(sale.id, selectedProducts);
      showToast('המוצרים נוספו בהצלחה');
      setAddModal(false); setSelectedProducts([]);
      const data = await getSaleDetail(sale.id);
      setSaleDetail(data);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleCloseSale = async (saleId, prods) => {
    setLoading(true);
    try {
      await closeSale(saleId, prods);
      showToast('המכירה נסגרה בהצלחה');
      setCloseModal(false); refetch();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const saleProducts = saleDetail?.['מוצרים'] || [];
  const summary = saleDetail?.['סיכום_כספי'] || saleDetail?.['סיכום_כספי'];

  return (
    <div className="card sale-card">
      {/* ─── שורת כותרת ─── */}
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

      {/* ─── פאנל פרטים ─── */}
      {isExpanded && (
        <div className="sale-detail">
          {/* כפתורי פעולה */}
          {isOpen && (
            <div className="sale-detail__actions">
              <Button size="sm" variant="secondary" onClick={() => setAddModal(true)}>+ הוסף מוצרים</Button>
              <Button size="sm" variant="success" onClick={fetchAndOpenClose} disabled={loading}>
                {loading ? 'טוען...' : '🔒 סגור מכירה'}
              </Button>
            </div>
          )}

          {/* ─── תוכן: spinner / ריק / טבלה ─── */}
          {detailLoading ? (
            // מציג spinner בזמן הטעינה — לא הודעת שגיאה
            <div className="sale-detail__loading">
              <Spinner size="sm" />
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {saleProducts.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p['מוצר']}</strong></td>
                      <td>{(p['נמכר'] || 0) + (p['חזר'] || 0)}</td>
                      {!isOpen && <td>{p['נמכר'] ?? '—'}</td>}
                      {!isOpen && <td>{p['חזר'] ?? '—'}</td>}
                      {!isOpen && <td>{p['סה"כ מחיר עלות'] != null ? formatCurrency(p['סה"כ מחיר עלות']) : '—'}</td>}
                      {!isOpen && <td>{p['סה"כ מחיר מכירה'] != null ? formatCurrency(p['סה"כ מחיר מכירה']) : '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isOpen && summary && (
                <div className="sale-detail__summary">
                  <span>סה"כ הכנסה: <strong>{formatCurrency(summary['סה"כ מחיר מכירה'])}</strong></span>
                  <span>רווח: <strong className="profit--positive">{formatCurrency(summary['רווח'])}</strong></span>
                </div>
              )}
            </div>
          ) : saleDetail && !saleDetail.error ? (
            // טעינה הסתיימה ואין מוצרים — זה אמיתי
            <div className="sale-detail__empty">אין מוצרים משויכים למכירה זו עדיין</div>
          ) : null /* לא מציגים כלום אם טרם טענו */}
        </div>
      )}

      {/* מודל הוספת מוצרים */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setSelectedProducts([]); }}
        title={`הוספת מוצרים — ${sale.name}`} width="620px">
        <ProductPicker products={activeProducts} selected={selectedProducts} onChange={setSelectedProducts} />
        <div className="form-actions sale-card__form-actions">
          <Button variant="ghost" onClick={() => { setAddModal(false); setSelectedProducts([]); }}>ביטול</Button>
          <Button onClick={handleAddProducts} disabled={loading || !selectedProducts.length}>
            {loading ? 'מוסיף...' : 'הוסף מוצרים'}
          </Button>
        </div>
      </Modal>

      {/* מודל סגירת מכירה */}
      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)}
        title={`סגירת מכירה — ${sale.name}`} width="580px">
        {saleItems && (
          <CloseSaleForm saleId={sale.id} saleItems={saleItems}
            onSubmit={handleCloseSale} onClose={() => setCloseModal(false)} loading={loading} />
        )}
      </Modal>
    </div>
  );
};

export default SaleCard;
