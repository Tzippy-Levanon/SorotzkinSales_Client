import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/products', label: 'מלאי', icon: '◈' },
  { to: '/sales', label: 'מכירות', icon: '◆' },
  { to: '/suppliers', label: 'ספקים', icon: '◇' },
  { to: '/reports', label: 'דוחות', icon: '◉' },
];

const Navbar = ({ onLogout }) => (
  <nav className="navbar">
    <NavLink to="/" className="navbar__logo">
      <span className="navbar__logo-text">אתר ניהולי — ת.ת. סורוצקין</span>
    </NavLink>
    <div className="navbar__links">
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>
          <span className="navbar__link-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </div>
    <div className="navbar__user">
      <button className="navbar__logout" onClick={onLogout}>יציאה</button>
    </div>
  </nav>
);

export default Navbar;
