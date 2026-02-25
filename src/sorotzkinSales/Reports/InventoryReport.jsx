import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { getInventoryReport, downloadReport } from '../api';           // תוקן
import { Button, ExportButtons, Card, Badge, EmptyState, Spinner, StatCard } from '../Common/UI';
import { formatCurrency, downloadBlob, exportToPDF } from '../utils'; // תוקן

const InventoryReport = ({ showToast }) => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15; // 15 שורות בדף לדוחות
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try { setData(await getInventoryReport()); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleExcel = async () => {
    setExcelLoading(true);
    try { downloadBlob(await downloadReport('/reports/inventory?format=excel'), 'דוח_מלאי.xlsx'); }
    catch (e) { showToast('שגיאה בייצוא Excel', 'error'); }
    finally { setExcelLoading(false); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportToPDF('inventory-report', 'דוח_מלאי'); }
    catch (e) { showToast('שגיאה בייצוא PDF', 'error'); }
    finally { setPdfLoading(false); }
  };

  // מה השרת מחזיר: { 'תאריך', 'סה"כ מוצרים', 'סה"כ ערך מלאי', 'מוצרים במלאי': [...] }
  const inventory = data?.['מוצרים במלאי'] || [];
  const totalPages = Math.max(1, Math.ceil(inventory.length / PAGE_SIZE));
  const inventoryPag = inventory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="report-header">
        <div>
          <h2 className="report-header__title">דוח מצב מלאי</h2>
          <p className="report-header__subtitle">כל המוצרים עם הכמות וערך המלאי</p>
        </div>
        <div className="report-header__right">
          {data && <ExportButtons onExcel={handleExcel} onPDF={handlePDF} excelLoading={excelLoading} pdfLoading={pdfLoading} />}
          <Button onClick={fetchReport} disabled={loading}>{loading ? 'טוען...' : 'הפק דוח'}</Button>
        </div>
      </div>

      {!data && !loading && <EmptyState icon="📦" title="לחץ על 'הפק דוח' להצגת נתוני המלאי" />}
      {loading && <div className="loading-center"><Spinner size="lg" /></div>}

      {data && (
        <div id="inventory-report">
          <div className="stats-grid--3">
            <StatCard label="סה״כ מוצרים" value={data['סה"כ מוצרים'] ?? '—'} />
            <StatCard label="שווי מלאי כולל" value={formatCurrency(data['סה"כ ערך מלאי'])} />
            <StatCard label="תאריך דוח" value={data['תאריך'] || '—'} />
          </div>
          <Card>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>שם מוצר</th><th>כמות במלאי</th><th>מחיר עלות</th><th>שווי מלאי</th><th>סטטוס</th></tr>
                </thead>
                <tbody>
                  {inventoryPag.map((p, i) => {
                    const qty = p['כמות במלאי'];
                    const cost = p['מחיר עלות'];
                    return (
                      <tr key={i}>
                        <td><strong>{p['שם מוצר']}</strong></td>
                        <td><strong className={qty === 0 ? 'products-table__stock--zero' : ''}>{qty}</strong></td>
                        <td>{formatCurrency(cost)}</td>
                        <td><strong>{formatCurrency(qty * (cost || 0))}</strong></td>
                        <td><Badge variant={p['סטטוס'] === 'פעיל' ? 'success' : 'danger'}>{p['סטטוס']}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* pagination לדוח מלאי */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
