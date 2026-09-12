import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Car,
  Clock,
  User,
  PlusCircle,
  Wrench,
  Settings,
  Users,
  Warehouse,
  Hammer,
  Compass
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { to: '/',            label: 'Home',        icon: Home,        end: true },
  { to: '/vehicles',    label: 'Vehicles',    icon: Car },
  { to: '/history',     label: 'Maintenance', icon: Wrench },
  { to: '/history',     label: 'History',     icon: Clock },
];

const COMING_SOON_ITEMS = [
  { label: 'Community',      icon: Users },
  { label: 'Virtual Garage', icon: Warehouse },
  { label: 'Builds',         icon: Hammer },
  { label: 'Discover',       icon: Compass },
];

const MOBILE_NAV_ITEMS = [
  { to: '/',            label: 'Home',        icon: Home,        end: true },
  { to: '/vehicles',    label: 'Vehicles',    icon: Car },
  { to: '/add-vehicle', label: 'Add',         icon: PlusCircle },
  { to: '/history',     label: 'Maintenance', icon: Wrench },
  { to: '/profile',     label: 'Profile',     icon: User },
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
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Home size={18} />
            Home
          </NavLink>
          <NavLink
            to="/vehicles"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Car size={18} />
            Vehicles
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Wrench size={18} />
            Maintenance
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Clock size={18} />
            History
          </NavLink>

          {/* Coming Soon Features */}
          <div style={{ margin: '14px 0 8px', padding: '0 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            More Features
          </div>
          {COMING_SOON_ITEMS.map(({ label, icon: Icon }) => (
            <div key={label} className="sidebar-link coming-soon-link" style={{ opacity: 0.65, cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={17} />
                <span>{label}</span>
              </div>
              <span style={{ fontSize: '0.6rem', padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontWeight: 600 }}>
                SOON
              </span>
            </div>
          ))}

          <div style={{ margin: '14px 0 8px', padding: '0 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account
          </div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <User size={18} />
            Profile
          </NavLink>
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
        {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to + label}
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
