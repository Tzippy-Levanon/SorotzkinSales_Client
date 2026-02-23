import React, { useState } from 'react';
import InventoryReport from './InventoryReport';
import SalesReport from './SalesReport';
import SuppliersReport from './SuppliersReport';

const TABS = [
  { id: 'inventory', label: 'מלאי', icon: '📦' },
  { id: 'sales', label: 'מכירות', icon: '🏷️' },
  { id: 'suppliers', label: 'ספקים', icon: '🏢' },
];

// ─── ReportsPage ──────────────────────────────────────────────────────────
// מארגן את שלושת הדוחות בטאבים. כל דוח הוא קומפוננטה עצמאית.
const ReportsPage = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">הפקת דוחות</h1>
          <p className="page-subtitle">ייצוא לאקסל ו-PDF</p>
        </div>
      </div>
      <div className="report-tabs">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`report-tab${activeTab === tab.id ? ' report-tab--active' : ''}`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'inventory' && <InventoryReport showToast={showToast} />}
      {activeTab === 'sales' && <SalesReport showToast={showToast} />}
      {activeTab === 'suppliers' && <SuppliersReport showToast={showToast} />}
    </div>
  );
};

export default ReportsPage;
