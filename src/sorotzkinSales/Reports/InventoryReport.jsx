import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { getInventoryReport, downloadReport } from '../api';
import { Button, ExportButtons, Card, Badge, EmptyState, Spinner, StatCard } from '../Common/UI';
import { formatCurrency, downloadBlob, exportToPDF } from '../utils';

const InventoryReport = ({ showToast }) => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelFilename, setExcelFilename] = useState('דוח מלאי');

  const fetchReport = async () => {
    setLoading(true);
    try { setData(await getInventoryReport()); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleExcel = async () => {
    setExcelLoading(true);
    try {
      const { blob, response } = await downloadReport('/reports/inventory?format=excel');
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'דוח מלאי.xlsx';
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = decodeURIComponent(match[1]);
      }
      setExcelFilename(filename.replace(/\.xlsx$/i, ''));
      downloadBlob(blob, filename, response);
    } catch (e) { showToast('שגיאה בייצוא Excel', 'error'); }
    finally { setExcelLoading(false); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportToPDF('inventory-report', excelFilename); }
    catch (e) { showToast('שגיאה בייצוא PDF', 'error'); }
    finally { setPdfLoading(false); }
  };

  const inventory = data?.['מוצרים במלאי'] || [];
  const totalPages = Math.max(1, Math.ceil(inventory.length / PAGE_SIZE));
  const inventoryPag = inventory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const InventoryRow = ({ p, hidden = false }) => {
    const qty = p['כמות במלאי'];
    const cost = p['מחיר עלות'];
    return (
      <tr className={hidden ? 'pdf-show-all' : ''} style={hidden ? { display: 'none' } : {}}>
        <td><strong>{p['שם מוצר']}</strong></td>
        <td><strong className={qty === 0 ? 'products-table__stock--zero' : ''}>{qty}</strong></td>
        <td>{formatCurrency(cost)}</td>
        <td><strong>{formatCurrency(qty * (cost || 0))}</strong></td>
        <td><Badge variant={p['סטטוס'] === 'פעיל' ? 'success' : 'danger'}>{p['סטטוס']}</Badge></td>
      </tr>
    );
  };

  return (
    <div>
      <div className="report-header">
        <div>
          <h2 className="report-header__title">דוח מצב מלאי</h2>
          <p className="report-header__subtitle">כל המוצרים עם הכמות וערך המלאי</p>
        </div>
        <div className="report-header__right">
          {data && <ExportButtons
            onExcel={handleExcel}
            onPDF={handlePDF}
            excelLoading={excelLoading}
            pdfLoading={pdfLoading}
          />}
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
                  {inventoryPag.map((p, i) => <InventoryRow key={i} p={p} />)}
                  {inventory.slice(PAGE_SIZE).map((p, i) => <InventoryRow key={`pdf-${i}`} p={p} hidden />)}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="no-print">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
