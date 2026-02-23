import React, { useState } from 'react';
import { getSuppliersReport, downloadReport } from '../api';          // תוקן
import { Button, ExportButtons, Card, EmptyState, Spinner, StatCard } from '../Common/UI';
import { formatCurrency, downloadBlob, exportToPDF } from '../utils'; // תוקן

const SuppliersReport = ({ showToast }) => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try { setData(await getSuppliersReport()); }
    catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleExcel = async () => {
    setExcelLoading(true);
    try { downloadBlob(await downloadReport('/reports/suppliers?format=excel'), 'דוח_ספקים.xlsx'); }
    catch (e) { showToast('שגיאה בייצוא Excel', 'error'); }
    finally { setExcelLoading(false); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportToPDF('suppliers-report', 'דוח_ספקים'); }
    catch (e) { showToast('שגיאה בייצוא PDF', 'error'); }
    finally { setPdfLoading(false); }
  };

  const suppliers = data?.['ספקים'] || [];
  const totalPages = Math.max(1, Math.ceil(suppliers.length / PAGE_SIZE));
  const suppliersPag = suppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="report-header">
        <div>
          <h2 className="report-header__title">דוח ספקים</h2>
          <p className="report-header__subtitle">ריכוז חובות ויתרות לכל הספקים</p>
        </div>
        <div className="report-header__right">
          {data && <ExportButtons onExcel={handleExcel} onPDF={handlePDF} excelLoading={excelLoading} pdfLoading={pdfLoading} />}
          <Button onClick={fetchReport} disabled={loading}>{loading ? 'טוען...' : 'הפק דוח'}</Button>
        </div>
      </div>

      {!data && !loading && <EmptyState icon="🏢" title="לחץ על 'הפק דוח' להצגת נתוני הספקים" />}
      {loading && <div className="loading-center"><Spinner size="lg" /></div>}

      {data && (
        <div id="suppliers-report">
          <div className="stats-grid--2">
            <StatCard label="מספר ספקים" value={suppliers.length} />
            <StatCard label='סה״כ חובות' value={formatCurrency(data['סה"כ חוב כללי'])} />
          </div>
          <Card>
            <table className="data-table">
              <thead><tr><th>שם ספק</th><th>שם חברה</th><th>טלפון</th><th>מייל</th><th>יתרת חוב</th></tr></thead>
              <tbody>
                {suppliersPag.map((s, i) => (
                  <tr key={i}>
                    <td><strong>{s['שם ספק']}</strong></td>
                    <td className="suppliers-table__company">{s['שם חברה'] || '—'}</td>
                    <td>{s['טלפון'] || '—'}</td>
                    <td>{s['מייל'] || '—'}</td>
                    <td className={(s['יתרת חוב'] || 0) > 0 ? 'debt--owed' : ''}>
                      {formatCurrency(s['יתרת חוב'])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination__btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&#8249; הקודם</button>
              <span className="pagination__info">דף {page} מתוך {totalPages} ({suppliers.length} ספקים)</span>
              <button className="pagination__btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>הבא &#8250;</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuppliersReport;
