import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProductsPage from '../Products/ProductsPage';
import SalesPage from '../Sales/SalesPage';
import SuppliersPage from '../Suppliers/SuppliersPage';
import ReportsPage from '../Reports/ReportsPage';

// ─── Routing ─────────────────────────────────────────────────────────────
// מגדיר את כל נתיבי ה-URL באפליקציה.
// showToast מועברת לכל דף כדי שיוכלו להציג הודעות מערכת.
const Routing = ({ showToast }) => (
  <Routes>
    <Route path="/" element={<Navigate to="/products" replace />} />
    <Route path="/products" element={<ProductsPage showToast={showToast} />} />
    <Route path="/sales" element={<SalesPage showToast={showToast} />} />
    <Route path="/suppliers" element={<SuppliersPage showToast={showToast} />} />
    <Route path="/reports" element={<ReportsPage showToast={showToast} />} />
    <Route path="*" element={<Navigate to="/products" replace />} />
  </Routes>
);

export default Routing;
