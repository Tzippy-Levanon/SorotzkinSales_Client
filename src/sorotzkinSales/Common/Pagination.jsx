import React from 'react';

// ─── Pagination ─────────────────────────────────────────────────────────────
// props: page, totalPages, onChange(newPage)
const Pagination = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;

    const buildPages = () => {
        const pages = [];
        const delta = 2;
        const left = Math.max(2, page - delta);
        const right = Math.min(totalPages - 1, page + delta);

        pages.push(1);
        if (left > 2) pages.push('...');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('...');
        if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    return (
        <div className="pagination">
            <button className="pagination__btn" onClick={() => onChange(page - 1)} disabled={page === 1}>
                &#8249; הקודם
            </button>

            <div className="pagination__pages">
                {buildPages().map((p, i) =>
                    p === '...'
                        ? <span key={`dots-${i}`} className="pagination__dots">…</span>
                        : <button
                            key={p}
                            className={`pagination__page${p === page ? ' pagination__page--active' : ''}`}
                            onClick={() => onChange(p)}
                        >{p}</button>
                )}
            </div>

            <button className="pagination__btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}> הבא &#8250; </button>

        </div>
    );
};

export default Pagination;
