import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Car, Clock, User, PlusCircle, Wrench, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         label: 'Home',        icon: Home,        end: true },
  { to: '/vehicles', label: 'Vehicles',    icon: Car },
  { to: '/add-vehicle', label: 'Add',      icon: PlusCircle },
  { to: '/history',  label: 'Maintenance', icon: Wrench },
  { to: '/profile',  label: 'Profile',     icon: User },
];

export default function BottomNav() {
  return (
    <>
      {/* ── Sidebar (desktop ≥768px) ─────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-text">
            <span style={{ display: 'inline-block' }}>
              <span style={{ color: 'var(--accent-color)' }}>N</span>GINEBREAK
            </span>
          </div>
          <div className="logo-sub">Your Vehicle. Your Story.</div>
        </div>

        {/* Main nav links */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div className="sidebar-nav-bottom">
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* ── Bottom nav (mobile <768px) ───────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item-link${isActive ? ' active' : ''}`}
          >
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
