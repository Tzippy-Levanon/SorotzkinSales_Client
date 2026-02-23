import React, { useEffect } from 'react';
// כל העיצוב נמצא ב-components.css — כאן רק מבנה HTML + classes

// ─── Spinner ──────────────────────────────────────────────────────────────
// גלגל טעינה מסתובב. size: 'sm' | 'md' | 'lg'
export const Spinner = ({ size = 'md' }) => (
  <div className={`spinner spinner--${size}`} />
);

// ─── Badge ────────────────────────────────────────────────────────────────
// תגית מעוגלת. variant: 'default' | 'success' | 'danger' | 'warning' | 'accent'
export const Badge = ({ children, variant = 'default' }) => (
  <span className={`badge badge--${variant}`}>{children}</span>
);

// ─── Button ───────────────────────────────────────────────────────────────
// כפתור. variant: 'primary'|'secondary'|'danger'|'success'|'ghost'
// size: 'sm'|'md'|'lg'. icon: תו לפני הטקסט (אופציונלי)
export const Button = ({ children, variant = 'primary', size, onClick, disabled, type = 'button', icon, className = '' }) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    className={['btn', `btn--${variant}`, size ? `btn--${size}` : '', className].filter(Boolean).join(' ')}
  >
    {icon && <span>{icon}</span>}
    {children}
  </button>
);

// ─── ExportButton / ExportButtons ────────────────────────────────────────
// כפתור ייצוא בודד, ו-זוג כפתורי Excel+PDF
// אייקון Excel — ירוק עם X לבן
const ExcelIcon = () => (
  <svg className="btn-export__icon" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#217346" />
    <path d="M13 12l3.5-5H14l-2 3-2-3H7.5L11 12l-3.5 5H10l2-3 2 3h2.5L13 12z" fill="white" />
  </svg>
);

// אייקון PDF — דף לבן עם מסגרת אדומה, פינה מקופלת, כיתוב PDF
const PdfIcon = () => (
  <svg className="btn-export__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* גוף הדף */}
    <path d="M5 2h10l5 5v15a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white" stroke="#E53935" strokeWidth="1.2" />
    {/* פינה מקופלת */}
    <path d="M15 2l5 5h-5V2z" fill="#FFCDD2" stroke="#E53935" strokeWidth="0.8" />
    {/* כיתוב PDF */}
    <rect x="3" y="13" width="18" height="7" rx="1" fill="#E53935" />
    <text x="12" y="18.5" fill="white" fontSize="5.5" fontWeight="800" fontFamily="Arial" textAnchor="middle">PDF</text>
  </svg>
);

export const ExportButton = ({ children, icon, onClick, disabled, loading }) => (
  <button className="btn-export" onClick={onClick} disabled={disabled || loading}>
    {loading ? <Spinner size="sm" /> : icon}
    {children}
  </button>
);

export const ExportButtons = ({ onExcel, onPDF, excelLoading, pdfLoading }) => (
  <div className="export-buttons">
    <ExportButton icon={<ExcelIcon />} onClick={onExcel} loading={excelLoading} disabled={pdfLoading}>Excel</ExportButton>
    <ExportButton icon={<PdfIcon />} onClick={onPDF} loading={pdfLoading} disabled={excelLoading}>PDF</ExportButton>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────
// קופסת תוכן עם גבול וצל. className אופציונלי להרחבה
export const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────
// כרטיס מספר/סטטיסטיקה. label=כותרת קטנה, value=ערך גדול, sub=הערה קטנה
export const StatCard = ({ label, value, sub }) => (
  <Card>
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  </Card>
);

// ─── Modal ────────────────────────────────────────────────────────────────
// חלון פופ-אפ. width: מחרוזת CSS כמו '560px'.
// לחיצה על הרקע האפור סוגרת את החלון.
export const Modal = ({ isOpen, onClose, title, children, width = '560px' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

// ─── FormField ────────────────────────────────────────────────────────────
// עוטף שדה טופס: label מעל, error מתחת. required מוסיף כוכבית.
export const FormField = ({ label, children, error, required }) => (
  <div className="form-field">
    {label && <label className={`form-label${required ? ' form-label--required' : ''}`}>{label}</label>}
    {children}
    {error && <div className="form-error">{error}</div>}
  </div>
);

// ─── Input / Select ───────────────────────────────────────────────────────
// שדות טופס — מקבלים כל props סטנדרטי של HTML (type, value, onChange, etc.)
export const Input = ({ className = '', ...props }) => <input className={`form-input ${className}`}  {...props} />;
export const Select = ({ children, className = '', ...props }) => <select className={`form-select ${className}`} {...props}>{children}</select>;

// ─── Toast ────────────────────────────────────────────────────────────────
// הודעת מערכת זמנית שנעלמת אחרי 3.5 שניות. type: 'success'|'error'|'info'
export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span>{message}</span>
      <button className="toast__close" onClick={onClose}>✕</button>
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────
// מצב ריק: אמוג'י גדול + כותרת + תיאור אופציונלי
export const EmptyState = ({ icon, title, description }) => (
  <div className="empty-state">
    <div className="empty-state__icon">{icon}</div>
    <div className="empty-state__title">{title}</div>
    {description && <div className="empty-state__description">{description}</div>}
  </div>
);

// ─── ConfirmDialog ────────────────────────────────────────────────────────
// דיאלוג "האם אתה בטוח?". danger=true הופך כפתור האישור לאדום.
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'אישור', danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} width="400px">
    <p className="confirm-dialog__message">{message}</p>
    <div className="form-actions">
      <Button variant="ghost" onClick={onClose}>ביטול</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>
);
