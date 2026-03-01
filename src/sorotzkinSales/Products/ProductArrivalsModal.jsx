import React, { useState } from 'react';
import { Modal, Spinner } from '../Common/UI';
import Pagination from '../Common/Pagination';
import { formatDate, formatCurrency, useAsync } from '../utils';
import { getProductArrivals } from '../api';

const ProductArrivalsModal = ({ productId, productName, isOpen, onClose }) => {
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    const { data: arrivals, loading } = useAsync(
        () => productId ? getProductArrivals(productId) : Promise.resolve([]),
        [productId]
    );

    // איפוס לדף 1 כשפותחים מוצר חדש
    React.useEffect(() => { setPage(1); }, [productId]);

    const allArrivals = arrivals || [];
    const totalArrived = allArrivals.reduce((sum, a) => sum + (a.quantity || 0), 0);
    const totalPages = Math.max(1, Math.ceil(allArrivals.length / PAGE_SIZE));
    const paginated = allArrivals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`היסטוריית הגעות — ${productName}`} width="600px">
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                    <Spinner size="sm" />
                </div>
            ) : !allArrivals.length ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    אין הגעות רשומות עבור מוצר זה
                </div>
            ) : (
                <>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>תאריך</th>
                                <th>ספק</th>
                                <th>כמות</th>
                                <th>מחיר עלות</th>
                                <th>הערות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((a, i) => (
                                <tr key={i}>
                                    <td>{formatDate(a.date)}</td>
                                    <td>{a.supplier}</td>
                                    <td><strong>{a.quantity}</strong></td>
                                    <td>{formatCurrency(a.cost_price)}</td>
                                    <td>{a.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '12px' }}>
                        סה"כ הגיע: <strong>{totalArrived} יחידות</strong>
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onChange={setPage}
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

export default ProductArrivalsModal;
