import Pagination from '../Common/Pagination';
import React, { useState, useMemo } from 'react';
import { getSalesReport, downloadReport, getSales } from '../api';
import { Button, ExportButtons, Card, Badge, EmptyState, Spinner, StatCard, FormField, Input } from '../Common/UI';
import AppSelect from '../Common/AppSelect';
import { formatCurrency, formatDate, downloadBlob, exportToPDF, useAsync } from '../utils';

const SalesReport = ({ showToast }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saleId, setSaleId] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [prodPage, setProdPage] = useState(1);
  const PROD_PAGE_SIZE = 15;
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'supplier'

  // ── טעינת רשימת מכירות לדרופדאון ──────────────────────────────────────
  // useAsync מפעיל את getSales בטעינה ואחסון ב-allSales.
  // כשהמנהלת בוחרת מכירה — היא בוחרת מהרשימה, לא מקלידה מזהה.
  const { data: allSales } = useAsync(getSales);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelFilename, setExcelFilename] = useState('דוח מכירות');

  const fetchReport = async () => {
    setLoading(true); setData(null);
    try {
      const params = {};
      if (saleId) params.sale_id = saleId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      setData(await getSalesReport(params));
      setPage(1);
      setProdPage(1);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleExcel = async () => {
    setExcelLoading(true);
    try {
      const qs = new URLSearchParams({ format: 'excel' });
      if (saleId) qs.set('sale_id', saleId);
      if (startDate) qs.set('startDate', startDate);
      if (endDate) qs.set('endDate', endDate);
      const { blob, response } = await downloadReport(`/reports/sales?${qs}`);
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'דוח מכירות.xlsx';
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
    try { await exportToPDF('sales-report', excelFilename); }
    catch (e) { showToast('שגיאה בייצוא PDF', 'error'); }
    finally { setPdfLoading(false); }
  };

  const isSaleDetail = !!data?.['פרטי_מכירה'];
  const saleInfo = data?.['פרטי_מכירה'];
  const summary = data?.['סיכום_כספי'];
  const products = data?.['מוצרים'] || [];
  const salesList = data?.['מכירות'] || [];

  const sortedProducts = useMemo(() => {
    if (sortBy === 'supplier') {
      return [...products].sort((a, b) =>
        (a['ספק'] || '').localeCompare(b['ספק'] || '', 'he') ||
        (a['מוצר'] || '').localeCompare(b['מוצר'] || '', 'he')
      );
    }
    return products;
  }, [products, sortBy]);

  const totalPages = Math.max(1, Math.ceil(salesList.length / PAGE_SIZE));
  const salesListPag = salesList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalProdPages = Math.max(1, Math.ceil(sortedProducts.length / PROD_PAGE_SIZE));
  const productsPag = sortedProducts.slice((prodPage - 1) * PROD_PAGE_SIZE, prodPage * PROD_PAGE_SIZE);

  return (
    <div>
      <div className="report-header">
        <div>
          <h2 className="report-header__title">דוח מכירות</h2>
          <p className="report-header__subtitle">סיכום מכירות לפי תאריכים או מכירה ספציפית</p>
        </div>
        <div className="report-header__right">
          {data && <ExportButtons
            onExcel={handleExcel}
            onPDF={handlePDF}
            excelLoading={excelLoading}
            pdfLoading={pdfLoading}
          />}
        </div>
      </div>

      {/* פילטרים */}
      <Card className="report-filters no-print">
        <div className="report-filters__row">
          <FormField label="מכירה ספציפית">
            <AppSelect
              options={[
                { value: '', label: 'כל המכירות' },
                ...(allSales || []).map(s => ({
                  value: s.id,
                  label: `${s.name} — ${formatDate(s.date)} ${s.status === 'closed' ? '🔒' : '🔓'}`
                }))
              ]}
              value={saleId}
              onChange={id => {
                setSaleId(id);
                if (id) { 
                  setStartDate(''); 
                  setEndDate(''); 
                }
              }}
              placeholder="כל המכירות"
              noOptionsMessage="אין מכירות"
            />
          </FormField>
          {/* עד תאריך מופיע ראשון בJSX כי ב-RTL הראשון מוצג בצד ימין.
              הסדר הנכון בתצוגה (מימין לשמאל): [עד תאריך] [מתאריך] */}
          <FormField label="מתאריך">
            <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setSaleId(''); }} className="report-filters__input--date" />
          </FormField>
          <FormField label="עד תאריך">
            <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setSaleId(''); }} className="report-filters__input--date" />
          </FormField>
          <Button style={{ marginRight: 'auto' }} onClick={fetchReport} disabled={loading}>
            {loading ? 'טוען...' : 'הפק דוח'}
          </Button>
        </div>
      </Card>

      {loading && <div className="loading-center"><Spinner size="lg" /></div>}

      {/* ─── רשימת מכירות ─── */}
      {data && !isSaleDetail && (
        <div id="sales-report">
          <div className="stats-grid--2">
            <StatCard label="מספר מכירות" value={data['כמות'] ?? salesList.length} />
            <StatCard label="טווח תאריכים" value={
              startDate && endDate ? `${formatDate(startDate)} — ${formatDate(endDate)}`
                : startDate ? `מ- ${formatDate(startDate)}`
                  : endDate ? `עד- ${formatDate(endDate)}`
                    : 'כל הזמנים'
            } />
          </div>
          <Card>
            <table className="data-table">
              <thead><tr><th>שם מכירה</th><th>תאריך</th><th>סטטוס</th></tr></thead>
              <tbody>
                {salesListPag.map((s, i) => (
                  <tr key={i} className="sales-list__row-clickable"
                    onClick={() => setSaleId(String(s['מזהה'] || ''))}>
                    <td><strong>{s['שם מכירה']}</strong></td>
                    <td>{s['תאריך']}</td>
                    <td><Badge variant={s['סטטוס'] === 'פתוחה לשינויים' ? 'success' : 'default'}>{s['סטטוס']}</Badge></td>
                  </tr>
                ))}
                {/* שורות נסתרות לPDF — עמודים 2+ */}
                {salesList.slice(PAGE_SIZE).map((s, i) => (
                  <tr key={`pdf-${i}`} className="pdf-show-all" style={{ display: 'none' }}>
                    <td><strong>{s['שם מכירה']}</strong></td>
                    <td>{s['תאריך']}</td>
                    <td><Badge variant={s['סטטוס'] === 'פתוחה לשינויים' ? 'success' : 'default'}>{s['סטטוס']}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="no-print">
            {!saleId && <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />}
          </div>
        </div>
      )}

      {/* ─── פרטי מכירה ─── */}
      {isSaleDetail && (
        <div id="sales-report">
          <div className="report-back-btn no-print">
            <Button size="sm" variant="ghost" onClick={() => { setData(null); setSaleId(''); }}>← חזרה לרשימה</Button>
          </div>
          <Card className="sale-info-card">
            <div className="sale-info-card__row">
              <div><div className="sale-info-card__label">שם מכירה</div><div className="sale-info-card__value sale-info-card__value--lg">{saleInfo?.['שם']}</div></div>
              <div><div className="sale-info-card__label">תאריך</div><div className="sale-info-card__value">{saleInfo?.['תאריך']}</div></div>
              <div><div className="sale-info-card__label">סטטוס</div><Badge variant={saleInfo?.['סטטוס'] === 'פתוחה לשינויים' ? 'success' : 'default'}>{saleInfo?.['סטטוס']}</Badge></div>
            </div>
          </Card>
          <div className="stats-grid--3">
            <StatCard label='סה״כ עלות' value={formatCurrency(summary?.['סה"כ מחיר עלות'])} />
            <StatCard label='סה״כ מכירות' value={formatCurrency(summary?.['סה"כ מחיר מכירה'])} />
            <StatCard label="רווח"
              value={formatCurrency(summary?.['רווח'])}
              sub={summary?.['סה"כ מחיר מכירה'] > 0 ? `${((summary['רווח'] / summary['סה"כ מחיר מכירה']) * 100).toFixed(1)}% מהמחזור` : ''} />
          </div>

          {/* כפתורי מיון — רק בתצוגה */}
          <div className="products-filters__sort no-print" style={{ marginBottom: '12px' }}>
            <button type="button" className={`sort-btn${sortBy === 'name' ? ' sort-btn--active' : ''}`} onClick={() => { setSortBy('name'); setProdPage(1); }}>א-ב</button>
            <button type="button" className={`sort-btn${sortBy === 'supplier' ? ' sort-btn--active' : ''}`} onClick={() => { setSortBy('supplier'); setProdPage(1); }}>לפי ספק</button>
          </div>

          <Card>
            <div className="table-wrap">
              {/* מכירה ספציפית — כל המוצרים, ללא pagination */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>מוצר</th>
                    <th>יצא למכירה</th>
                    <th>נמכר</th>
                    <th>חזר</th>
                    <th>עלות</th>
                    <th>מכירה</th>
                    <th>סה"כ עלות</th>
                    <th>סה"כ מכירה</th>
                    <th>רווח</th>
                  </tr>
                </thead>
                <tbody>
                  {productsPag.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p['מוצר']}</strong></td>
                      <td>{p['יצא למכירה']}</td>
                      <td>{p['נמכר']}</td>
                      <td>{p['חזר']}</td>
                      <td>{formatCurrency(p['מחיר עלות'])}</td>
                      <td>{formatCurrency(p['מחיר מכירה'])}</td>
                      <td>{formatCurrency(p['סה"כ מחיר עלות'])}</td>
                      <td>{formatCurrency(p['סה"כ מחיר מכירה'])}</td>
                      <td className={(p['רווח'] || 0) >= 0 ? 'profit--positive' : 'profit--negative'}>
                        {formatCurrency(p['רווח'])}
                      </td>
                    </tr>
                  ))}
                  {/* שורות נסתרות ל-PDF */}
                  {sortedProducts.slice(PROD_PAGE_SIZE).map((p, i) => (
                    <tr key={`pdf-${i}`} className="pdf-show-all" style={{ display: 'none' }}>
                      <td><strong>{p['מוצר']}</strong></td>
                      <td>{p['יצא למכירה']}</td>
                      <td>{p['נמכר']}</td>
                      <td>{p['חזר']}</td>
                      <td>{formatCurrency(p['מחיר עלות'])}</td>
                      <td>{formatCurrency(p['מחיר מכירה'])}</td>
                      <td>{formatCurrency(p['סה"כ מחיר עלות'])}</td>
                      <td>{formatCurrency(p['סה"כ מחיר מכירה'])}</td>
                      <td className={(p['רווח'] || 0) >= 0 ? 'profit--positive' : 'profit--negative'}>
                        {formatCurrency(p['רווח'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="no-print">
            <Pagination
              page={prodPage}
              totalPages={totalProdPages}
              onChange={setProdPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReport;
