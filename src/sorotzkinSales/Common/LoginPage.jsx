import React, { useState } from 'react';
import { login } from '../api';
import { Spinner } from './UI';

const MIN_SPINNER_MS = 900; // השהייה מינימלית להרגשה טבעית
// ─── LoginPage ────────────────────────────────────────────────────────────
// מוצג כ-overlay מעל האפליקציה (בדיוק כמו מודל עדכון מוצר):
//   - הרקע מטושטש ומאופל
//   - הכרטיס מרכוזי, לבן, עם border-radius
//   - אי אפשר לסגור / לברוח — אין כפתור X
// props:
//   onLogin — callback שמקבל את אובייקט המשתמש אחרי התחברות מוצלחת
const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const start = Date.now();
    try {
      await login({ password });
      // המתן לפחות MIN_SPINNER_MS לפני מעבר
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise(r => setTimeout(r, MIN_SPINNER_MS - elapsed));
      }
      onLogin({ ok: true });
      window.location.reload();
    } catch (e) {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_SPINNER_MS) {
        await new Promise(r => setTimeout(r, MIN_SPINNER_MS - elapsed));
      }
      setError(e.message || 'סיסמה שגויה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay" onClick={e => e.stopPropagation()}>
      <div className="login-card card">
        <div className="login-logo">
          <span className="login-logo__site-name">ת.ת. סורוצקין</span>
        </div>
        <h1 className="login-title">ברוך הבא</h1>
        <p className="login-subtitle">הזן סיסמה כדי להמשיך למערכת</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">סיסמה</label>
            <input
              className={`login-input${error ? ' login-input--error' : ''}`}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              autoFocus
              autoComplete="current-password"
              dir="ltr"
            />
            {/* שגיאה מתחת לשדה — טקסט פשוט בלי מסגרת */}
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><Spinner size="sm" /> מתחבר...</> : 'התחברות'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
