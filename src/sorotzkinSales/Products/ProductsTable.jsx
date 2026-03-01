import React, { useState } from 'react';
import { Button, Badge } from '../Common/UI';
import { formatCurrency } from '../utils';
import ProductArrivalsModal from './ProductArrivalsModal';

const ProductsTable = ({ products, supplierMap, onEdit, onDeactivate }) => {
  const [arrivalsProduct, setArrivalsProduct] = useState(null);
  
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם מוצר</th>
              <th>ספק</th>
              <th>מחיר עלות</th>
              <th>מחיר מכירה</th>
              <th>מלאי</th>
              <th>סטטוס</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={p.is_active ? '' : 'products-table__row--inactive'}>
                <td className="products-table__name">{p.name}</td>
                <td className="products-table__supplier">{supplierMap[p.supplier_id] || '—'}</td>
                <td>{formatCurrency(p.cost_price)}</td>
                <td className="products-table__price--bold">{formatCurrency(p.selling_price)}</td>
                <td>
                  <span className={`products-table__stock ${p.total_in_stock === 0 ? 'products-table__stock--zero' : ''}`}>{p.total_in_stock}</span>
                </td>
                <td>
                  <Badge variant={p.is_active ? 'success' : 'danger'}>
                    {p.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </td>
                <td>
                  <div className="products-table__actions">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>עריכה</Button>
                    <Button size="sm" variant="secondary" onClick={() => setArrivalsProduct(p)}>הגעות</Button>
                    {p.is_active && (
                      <Button size="sm" variant="danger" onClick={() => onDeactivate(p)}>השבת</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProductArrivalsModal
        isOpen={!!arrivalsProduct}
        onClose={() => setArrivalsProduct(null)}
        productId={arrivalsProduct?.id}
        productName={arrivalsProduct?.name || ''}
      />
    </>
  );
};

export default ProductsTable;
