import Swal from 'sweetalert2';
import React, { useState } from 'react';
import { Button } from '../Common/UI';

// ─── CloseSaleForm ────────────────────────────────────────────────────────
// טופס סגירת מכירה — מזין כמות שנותרה לכל מוצר ומחשב כמה נמכר.
// saleId: מזהה המכירה. saleItems: [{product_id, opening_stock, products:{name}}]
const CloseSaleForm = ({ saleId, saleItems, onSubmit, onClose, loading, products }) => {
  const [remaining, setRemaining] = useState(
    Object.fromEntries(saleItems.map(i => [i.product_id, i.opening_stock]))
  );

  const setR = (id, val) =>
    setRemaining(r => ({
      ...r,
      [id]: Math.max(0, Math.min(Number(val), saleItems.find(i => i.product_id === id)?.opening_stock ?? Infinity))
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // בדיקת חוסר מלאי
    const warnings = [];
    saleItems.forEach(item => {
      const rem = remaining[item.product_id] ?? 0;
      const sold = item.opening_stock - rem;
      const inStock = (products || []).find(p => p.id === item.product_id)?.total_in_stock ?? 0;
      if (sold > inStock) {
        warnings.push(`<li><strong>${item.products?.name}</strong> — נמכר: ${sold}, זמין במלאי: ${inStock}</li>`);
      }
    });

    if (warnings.length > 0) {
      const result = await Swal.fire({
        title: 'שים לב — חוסר מלאי',
        html: `<p>הפריטים הבאים חורגים מהמלאי הקיים. המלאי יעודכן ל-0 עבורם:</p><ul style="text-align:right;margin-top:8px">${warnings.join('')}</ul>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'המשך בכל זאת',
        cancelButtonText: 'חזרה לטופס',
        confirmButtonColor: '#b8972a',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
      });
      
      if (!result.isConfirmed) return;
    }

    onSubmit(saleId, saleItems.map(i => ({ product_id: i.product_id, remaining_quantity: remaining[i.product_id] ?? 0 })));
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="close-sale__hint">הכנס את כמות הפריטים שנותרו (לא נמכרו) בסיום המכירה:</p>
      <div className="close-sale__list">
        {saleItems.map(item => (
          <div key={item.product_id} className="close-sale__item">
            <div>
              <div className="close-sale__item-name">{item.products?.name}</div>
              <div className="close-sale__item-sub">יצא למכירה: {item.opening_stock}</div>
            </div>
            <div className="close-sale__remaining">
              <span className="close-sale__remaining-label">נותר:</span>
              <input type="number" className="close-sale__remaining-input"
                min="0" max={item.opening_stock}
                value={remaining[item.product_id] ?? 0}
                onChange={e => setR(item.product_id, e.target.value)} />
              <span className="close-sale__sold">
                נמכר: {item.opening_stock - (remaining[item.product_id] ?? 0)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <Button variant="ghost" onClick={onClose} type="button">ביטול</Button>
        <Button type="submit" variant="success" disabled={loading}>{loading ? 'סוגר...' : 'סגור מכירה'}</Button>
      </div>
    </form>
  );
};

export default CloseSaleForm;
