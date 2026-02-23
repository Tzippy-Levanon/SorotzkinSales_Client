import React, { useState } from 'react';
import { login } from '../api';
import { Spinner } from './UI';

// ─── LoginPage ────────────────────────────────────────────────────────────
// מוצג כ-overlay מעל האפליקציה (בדיוק כמו מודל עדכון מוצר):
//   - הרקע מטושטש ומאופל
//   - הכרטיס מרכוזי, לבן, עם border-radius
//   - אי אפשר לסגור / לברוח — אין כפתור X
// props:
//   onLogin — callback שמקבל את אובייקט המשתמש אחרי התחברות מוצלחת
const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form);
      onLogin(user);
    } catch (e) {
      setError(e.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    // overlay — מכסה את כל המסך, מונע לחיצה על מה שמאחור
    <div className="login-overlay" onClick={e => e.stopPropagation()}>

      {/* כרטיס ההתחברות — אותו סגנון כמו כרטיסי Modal של האתר */}
      <div className="login-card card">

        {/* כותרת האתר — ללא M, רק טקסט */}
        <div className="login-logo">
          <span className="login-logo__site-name">ת.ת. סורוצקין</span>
        </div>

        <h1 className="login-title">ברוך הבא</h1>
        <p className="login-subtitle">התחבר כדי להמשיך למערכת</p>

        <form onSubmit={handleSubmit} className="login-form">

          {/* שדה אימייל */}
          <div className="login-field">
            <label className="login-label">אימייל</label>
            <input
              className={`login-input${error ? ' login-input--error' : ''}`}
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          {/* שדה סיסמה */}
          <div className="login-field">
            <label className="login-label">סיסמה</label>
            <input
              className={`login-input${error ? ' login-input--error' : ''}`}
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              dir="ltr"
            />
          </div>

          {/* הודעת שגיאה */}
          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* כפתור התחברות */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
