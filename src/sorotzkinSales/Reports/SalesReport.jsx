import Pagination from '../Common/Pagination';
import React, { useState } from 'react';
import { getSalesReport, downloadReport, getSales } from '../api';              // תוקן
import { Button, ExportButtons, Card, Badge, EmptyState, Spinner, StatCard, FormField, Input } from '../Common/UI';
import AppSelect from '../Common/AppSelect';
import { formatCurrency, formatDate, downloadBlob, exportToPDF, useAsync } from '../utils'; // תוקן

const SalesReport = ({ showToast }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saleId, setSaleId] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // ── טעינת רשימת מכירות לדרופדאון ──────────────────────────────────────
  // useAsync מפעיל את getSales בטעינה ואחסון ב-allSales.
  // כשהמנהלת בוחרת מכירה — היא בוחרת מהרשימה, לא מקלידה מזהה.
  const { data: allSales } = useAsync(getSales);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const params = {};
      if (saleId) params.sale_id = saleId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await getSalesReport(params);
      setData(result);
      setPage(1); // איפוס לדף 1 בכל הפקת דוח חדשה
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
      downloadBlob(await downloadReport(`/reports/sales?${qs}`), 'דוח_מכירות.xlsx');
    } catch (e) { showToast('שגיאה בייצוא Excel', 'error'); }
    finally { setExcelLoading(false); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportToPDF('sales-report', 'דוח_מכירות'); }
    catch (e) { showToast('שגיאה בייצוא PDF', 'error'); }
    finally { setPdfLoading(false); }
  };

  const isSaleDetail = !!data?.['פרטי_מכירה'];
  const saleInfo = data?.['פרטי_מכירה'];
  const summary = data?.['סיכום_כספי'];
  const products = data?.['מוצרים'] || [];
  const salesList = data?.['מכירות'] || [];
  const totalPages = Math.max(1, Math.ceil(salesList.length / PAGE_SIZE));
  const salesListPag = salesList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="report-header">
        <div>
          <h2 className="report-header__title">דוח מכירות</h2>
          <p className="report-header__subtitle">סיכום מכירות לפי תאריכים או מכירה ספציפית</p>
        </div>
        <div className="report-header__right">
          {data && <ExportButtons onExcel={handleExcel} onPDF={handlePDF} excelLoading={excelLoading} pdfLoading={pdfLoading} />}
        </div>
      </div>

      {/* ─── פילטרים ─── */}
      <Card className="report-filters">
        <div className="report-filters__row">
          {/* בחירת מכירה ספציפית — דרופדאון במקום שדה ID */}
          {/* allSales נטען ברקע; כשמבחרים מכירה — saleId מתעדכן */}
          <FormField label="מכירה ספציפית">
            <AppSelect
              options={[
                { value: '', label: '                     כל המכירות' },
                ...(allSales || []).map(s => ({
                  value: s.id,
                  label: `${s.name} — ${formatDate(s.date)} ${s.status === 'closed' ? '🔒' : '🔓'}`
                }))
              ]}
              value={saleId}
              onChange={id => {
                setSaleId(id);
                if (id) { setStartDate(''); setEndDate(''); }
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
          {/* הכפתור עם margin-right: auto דוחף אותו לקצה השורה (שמאל ב-RTL = סוף) */}
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
            {/* מציג את טווח התאריכים שנבחר.
                אם שני תאריכים: "X — Y"
                אם רק התחלה:   "מ-X"
                אם רק סיום:    "עד Y"
                אם כלום:       "כל הזמנים" */}
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
              </tbody>
            </table>
          </Card>

          {/* pagination לרשימת מכירות — מוצג רק כשאין מכירה ספציפית נבחרת */}
          {!saleId && <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />}
        </div>
      )}

      {/* ─── פרטי מכירה ─── */}
      {isSaleDetail && (
        <div id="sales-report">
          <div className="report-back-btn">
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
          <Card>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>מוצר</th><th>נמכר</th><th>חזר</th><th>עלות</th><th>מכירה</th><th>סה"כ עלות</th><th>סה"כ מכירה</th><th>רווח</th></tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p['מוצר']}</strong></td>
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
        </div>
      )}
    </div>
  );
};

export default SalesReport;
