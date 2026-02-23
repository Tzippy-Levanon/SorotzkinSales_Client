const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TIMEOUT_MS = 12000;

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `שגיאה: ${res.status}`);
  return data;
};

const handleNetworkError = (e) => {
  if (e.name === 'AbortError') throw new Error('הבקשה אורכת יותר מדי זמן');
  if (!navigator.onLine) throw new Error('אין חיבור לאינטרנט');
  throw new Error('השרת אינו זמין — נסה שוב');
};

const api = {
  get: (path) => fetchWithTimeout(`${BASE_URL}${path}`).then(handleResponse).catch(handleNetworkError),
  post: (path, body) => fetchWithTimeout(`${BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse).catch(handleNetworkError),
  patch: (path, body) => fetchWithTimeout(`${BASE_URL}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse).catch(handleNetworkError),
  postForm: (path, fd) => fetchWithTimeout(`${BASE_URL}${path}`, { method: 'POST', body: fd }).then(handleResponse).catch(handleNetworkError),
};

export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout', {});
export const getMe = () => api.get('/auth/me');

export const getProducts = () => api.get('/products');
export const addProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);

export const getSales = () => api.get('/sales');
export const addSale = (data) => api.post('/sales', data);
export const addProductsToSale = (saleId, products) => api.post(`/sales/addProductsToSale/${saleId}/products`, { products });
export const closeSale = (saleId, products) => api.patch(`/sales/${saleId}/products`, { products });
export const getSaleDetail = (saleId) => api.get(`/reports/sales?sale_id=${saleId}`);

export const getSuppliers = () => api.get('/suppliers');
export const addSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.patch(`/suppliers/${id}`, data);
export const recordStockArrival = (data) => api.post('/suppliers/recordStockArrival', data);
export const recordPayment = (data) => api.post('/suppliers/recordPayment', data);
export const uploadInvoice = (fd) => api.postForm('/suppliers/uploadInvoice', fd);
export const getPaymentMethods = () => api.get('/payment_methods');
export const getSupplierPayments = (supplierId) => api.get(`/suppliers/${supplierId}/payments`);

export const getInventoryReport = () => api.get('/reports/inventory');
export const getSalesReport = (params = {}) => api.get(`/reports/sales?${new URLSearchParams(params)}`);
export const getSuppliersReport = () => api.get('/reports/suppliers');

export const downloadReport = async (path) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 30000);
  const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal }).finally(() => clearTimeout(id));
  if (!res.ok) throw new Error('שגיאה בהורדת הדוח');
  return res.blob();
};
