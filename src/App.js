import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './sorotzkinSales/Common/Navbar';
import Routing from './sorotzkinSales/Routing/Routing';
import LoginPage from './sorotzkinSales/Common/LoginPage';
import { Toast, Spinner } from './sorotzkinSales/Common/UI';
import { getMe, logout } from './sorotzkinSales/api';
import './sorotzkinSales/Style/variables.css';
import './sorotzkinSales/Style/base.css';
import './sorotzkinSales/Style/components.css';
import './sorotzkinSales/Style/pages.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    getMe()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch (_) { }
    setUser(null);
  };

  if (!authChecked) {
    return <div className="auth-checking"><Spinner size="lg" /></div>;
  }

  return (
    <BrowserRouter>
      {/* האפליקציה תמיד מוצגת — מטושטשת כשלא מחוברים */}
      <div className={user ? '' : 'app-blurred'}>
        <Navbar user={user} onLogout={handleLogout} />
        <main className="page-wrapper">
          <div className="page-content">
            <Routing key={user?.ok} showToast={showToast} />
          </div>
        </main>
      </div>

      {/* Login overlay — מוצג מעל האפליקציה המטושטשת */}
      {!user && <LoginPage onLogin={setUser} />}

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type}
            onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </BrowserRouter>
  );
};

export default App;
