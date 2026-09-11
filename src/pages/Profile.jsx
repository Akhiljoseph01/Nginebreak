import React, { useState, useRef, useEffect } from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import {
  isUserAdmin,
  isRealAdmin,
  getAdminViewMode,
  setAdminViewMode,
  activateAdminMode,
  deactivateAdminMode,
  getAdminSettings,
  saveAdminSettings,
} from '../utils/adminAuth';
import {
  Pencil,
  Check,
  X,
  Bell,
  BellOff,
  Moon,
  Shield,
  Trash2,
  ChevronRight,
  Car,
  Wrench,
  LogOut,
  AlertTriangle,
  Sliders,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  Zap,
  Eye,
  UserCheck,
} from 'lucide-react';

const LEVELS = [
  { min: 0,   label: 'Driver',     emoji: '🚗' },
  { min: 5,   label: 'Regular',    emoji: '🔧' },
  { min: 15,  label: 'Enthusiast', emoji: '⚡' },
  { min: 30,  label: 'Builder',    emoji: '🔩' },
  { min: 60,  label: 'Veteran',    emoji: '🏁' },
  { min: 100, label: 'Legend',     emoji: '🏆' },
];

function getLevel(n) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (n >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

// Mini toggle switch component
function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? 'var(--accent-color)' : 'var(--border-color)',
          position: 'relative',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </label>
  );
}

// A single settings row
function SettingRow({ icon: Icon, label, desc, right, badge }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 0',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: 'var(--bg-page)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--text-secondary)',
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {label}
          </span>
          {badge && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(249, 115, 22, 0.15)',
                color: 'var(--accent-color)',
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {desc && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

export default function Profile() {
  const { vehicles, user, currentUser, logout } = useGarage();

  // Admin status, view mode, and settings
  const [isRealAdminUser, setIsRealAdminUser] = useState(() => isRealAdmin(currentUser));
  const [isAdminView, setIsAdminView] = useState(() => isUserAdmin(currentUser));
  const [adminViewMode, setAdminViewModeState] = useState(() => getAdminViewMode());
  const [adminSettings, setAdminSettings] = useState(() => getAdminSettings());

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredInput, setAdminCredInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Sync admin state
  useEffect(() => {
    setIsRealAdminUser(isRealAdmin(currentUser));
    setIsAdminView(isUserAdmin(currentUser));
    setAdminViewModeState(getAdminViewMode());

    const handleStateChange = () => {
      setIsRealAdminUser(isRealAdmin(currentUser));
      setIsAdminView(isUserAdmin(currentUser));
      setAdminViewModeState(getAdminViewMode());
      setAdminSettings(getAdminSettings());
    };
    window.addEventListener('admin_state_changed', handleStateChange);
    window.addEventListener('admin_settings_changed', handleStateChange);
    return () => {
      window.removeEventListener('admin_state_changed', handleStateChange);
      window.removeEventListener('admin_settings_changed', handleStateChange);
    };
  }, [currentUser]);

  // Handler to update an admin setting
  const updateSetting = (key, val) => {
    const updated = saveAdminSettings({ [key]: val });
    setAdminSettings(updated);
  };

  // Handler to toggle role view mode (Admin View vs User View preview)
  const handleSwitchViewMode = (mode) => {
    setAdminViewMode(mode);
  };

  // Stats
  const totalVehicles = vehicles.length;
  const totalModules  = vehicles.reduce((a, v) => a + (v.maintenance_modules?.length || 0), 0);
  const totalRecords  = vehicles.reduce((a, v) => a + (v.service_history?.length || 0), 0);
  const totalOverdue  = vehicles.reduce(
    (a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.OVERDUE).length || 0),
    0
  );

  const level     = getLevel(totalRecords);
  const nextLevel = LEVELS[Math.min(level.index + 1, LEVELS.length - 1)];
  const progress  = nextLevel.min > 0 ? Math.min((totalRecords / nextLevel.min) * 100, 100) : 100;

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || (isAdminView ? 'System Admin' : 'Enthusiast'));
  const [nameInput, setNameInput] = useState(displayName);

  const nameRef = useRef();

  const handleEditSave = () => {
    if (nameInput.trim()) setDisplayName(nameInput.trim());
    setEditMode(false);
  };

  const handleEditCancel = () => {
    setNameInput(displayName);
    setEditMode(false);
  };

  const handleAdminAuthSubmit = (e) => {
    e.preventDefault();
    setAdminError('');
    const res = activateAdminMode(adminCredInput);
    if (res.success) {
      setAdminSuccess('Admin privileges unlocked!');
      setTimeout(() => {
        setAdminSuccess('');
        setShowAdminLogin(false);
        setAdminCredInput('');
      }, 1000);
    } else {
      setAdminError(res.error || 'Invalid credentials');
    }
  };

  const handleDeactivateAdmin = () => {
    deactivateAdminMode();
  };

  // Derived initials
  const initials = isAdminView ? 'A' : (displayName?.[0]?.toUpperCase() || 'G');

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>

      {/* ── Page header ───────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="page-title">{isAdminView ? 'Admin Profile' : 'Profile'}</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isAdminView ? 'System Administration & Global Controls' : 'Personal garage & driver stats'}
          </p>
        </div>
        {isRealAdminUser && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))',
              border: '1px solid var(--accent-color)',
              color: 'var(--accent-color)',
              letterSpacing: '0.04em',
            }}
          >
            <Shield size={12} /> {isAdminView ? 'ADMIN VIEW' : 'PREVIEW MODE'}
          </span>
        )}
      </div>

      {/* ── ADMIN ROLE VIEW SWITCHER (Admin Exclusive) ── */}
      {isRealAdminUser && (
        <div
          className="garage-card"
          style={{
            padding: '14px 16px',
            marginBottom: 12,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(245,158,11,0.03) 100%)',
            border: '1px solid rgba(249,115,22,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={15} /> Admin Role View Switcher
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: adminViewMode === 'admin' ? 'var(--accent-color)' : 'var(--bg-page)', color: adminViewMode === 'admin' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              {adminViewMode === 'admin' ? '🛡️ Admin Mode Active' : '👁️ Standard User Preview'}
            </span>
          </div>

          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            {adminViewMode === 'admin'
              ? 'You are currently in Admin View with full system switching controls visible.'
              : 'You are currently previewing the app as a Standard User to test the regular driver interface.'}
          </p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSwitchViewMode('admin')}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '9px 12px',
                borderRadius: 8,
                border: adminViewMode === 'admin' ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: adminViewMode === 'admin' ? 'rgba(249,115,22,0.15)' : 'var(--bg-card)',
                color: adminViewMode === 'admin' ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Shield size={14} /> Admin View
            </button>

            <button
              onClick={() => handleSwitchViewMode('user')}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '9px 12px',
                borderRadius: 8,
                border: adminViewMode === 'user' ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: adminViewMode === 'user' ? 'rgba(249,115,22,0.15)' : 'var(--bg-card)',
                color: adminViewMode === 'user' ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Eye size={14} /> Switch to User View
            </button>
          </div>
        </div>
      )}

      {/* ── Profile card ──────────────────────────────── */}
      <div
        className="garage-card"
        style={{
          padding: '22px 18px 18px',
          marginBottom: 12,
          border: isAdminView ? '1px solid rgba(249,115,22,0.35)' : '1px solid var(--border-color)',
          background: isAdminView ? 'linear-gradient(180deg, rgba(249,115,22,0.03) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
        }}
      >
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: isAdminView
                ? 'linear-gradient(135deg, #FF4D00, #F59E0B)'
                : 'linear-gradient(135deg, #FF4D00, #FF8A50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
              boxShadow: isAdminView ? '0 4px 18px rgba(245,158,11,0.35)' : '0 4px 14px rgba(255,77,0,0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            {initials}
          </div>

          {/* Name + level */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={nameRef}
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEditSave()}
                  style={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: '1.5px solid var(--accent-color)',
                    borderRadius: 8,
                    padding: '5px 10px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  maxLength={32}
                />
                <button
                  onClick={handleEditSave}
                  style={{
                    background: 'var(--accent-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: 8,
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  <button
                    onClick={() => { setEditMode(true); setNameInput(displayName); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 2,
                      display: 'flex',
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {isAdminView ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--accent-color)',
                        background: 'rgba(249,115,22,0.12)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      🛡️ System Administrator
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {level.emoji} {level.label}
                    </span>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {currentUser?.email || 'Local Garage'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Level progress */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {totalRecords} / {nextLevel.min} services
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Next: {nextLevel.label} {nextLevel.emoji}
            </span>
          </div>
          <div
            style={{
              height: 5,
              background: 'var(--bg-page)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #FF4D00, #FF8A50)',
                borderRadius: 4,
                width: `${progress}%`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Stats strip — responsive grid ─────────────────── */}
      <div
        className="garage-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
          padding: '14px 6px',
          marginBottom: 12,
          gap: 4,
        }}
      >
        {[
          { label: 'Vehicles',  value: totalVehicles, icon: Car,           color: 'var(--accent-color)' },
          { label: 'Schedules', value: totalModules,  icon: Wrench,        color: 'var(--info-color)' },
          { label: 'Services',  value: totalRecords,  icon: Check,         color: 'var(--success-color)' },
          { label: 'Overdue',   value: totalOverdue,  icon: AlertTriangle, color: totalOverdue > 0 ? 'var(--danger-color)' : 'var(--text-muted)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '0 4px',
            }}
          >
            <Icon size={16} style={{ color }} />
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {value}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── ADMIN-ONLY SWITCHING OPTIONS ──────────────────── */}
      {isAdminView ? (
        <div
          className="garage-card"
          style={{
            padding: '16px 18px',
            marginBottom: 12,
            border: '1px solid rgba(249,115,22,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sliders size={13} />
              Admin Switching Options (Exclusive)
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(249,115,22,0.1)',
                color: 'var(--accent-color)',
                fontWeight: 600,
              }}
            >
              SUPERUSER ONLY
            </span>
          </div>

          {/* 1. Image Optimizer Mode Switch */}
          <SettingRow
            icon={Zap}
            label="Image Optimizer: 1MP Ultra-Saver"
            badge={adminSettings.imageOptimizationMode === 'saver' ? '1MP Active' : '1920px Full HD'}
            desc={
              adminSettings.imageOptimizationMode === 'saver'
                ? 'Compresses photos to ~1MP (~50KB-80KB WebP) to save Supabase free tier storage'
                : 'Compresses photos to 1920px Full HD (~100KB-160KB WebP)'
            }
            right={
              <Toggle
                id="toggle-image-saver"
                checked={adminSettings.imageOptimizationMode === 'saver'}
                onChange={e =>
                  updateSetting('imageOptimizationMode', e.target.checked ? 'saver' : 'standard')
                }
              />
            }
          />

          {/* 2. Service Reminders Switch */}
          <SettingRow
            icon={Bell}
            label="Service Reminders"
            desc="Global background reminder notifications"
            right={
              <Toggle
                id="notif-service"
                checked={adminSettings.notifService}
                onChange={e => updateSetting('notifService', e.target.checked)}
              />
            }
          />

          {/* 3. Overdue Alerts Switch */}
          <SettingRow
            icon={AlertTriangle}
            label="Overdue Alerts"
            desc="Broadcast urgent alerts when service is overdue"
            right={
              <Toggle
                id="notif-overdue"
                checked={adminSettings.notifOverdue}
                onChange={e => updateSetting('notifOverdue', e.target.checked)}
              />
            }
          />

          {/* 4. App Updates Switch */}
          <SettingRow
            icon={BellOff}
            label="App Updates & Broadcasts"
            desc="Notify garage members about new app versions"
            right={
              <Toggle
                id="notif-updates"
                checked={adminSettings.notifUpdates}
                onChange={e => updateSetting('notifUpdates', e.target.checked)}
              />
            }
          />

          {/* 5. Dark Mode Switch */}
          <SettingRow
            icon={Moon}
            label="Dark Mode"
            desc="Toggle UI theme mode preference"
            right={
              <Toggle
                id="dark-mode"
                checked={adminSettings.darkMode}
                onChange={e => updateSetting('darkMode', e.target.checked)}
              />
            }
          />

          {/* 6. System Maintenance Mode Switch */}
          <SettingRow
            icon={Database}
            label="Maintenance / Read-Only Mode"
            badge={adminSettings.maintenanceMode ? 'ACTIVE' : null}
            desc="Lock vehicle edits during database migrations"
            right={
              <Toggle
                id="system-maintenance"
                checked={adminSettings.maintenanceMode}
                onChange={e => updateSetting('maintenanceMode', e.target.checked)}
              />
            }
          />

          {/* 7. Beta & Staging Feature Flag Switch */}
          <SettingRow
            icon={Cpu}
            label="Beta & Staging Feature Flag"
            badge={adminSettings.betaTestingMode ? 'BETA ACTIVE' : null}
            desc="Unlock experimental features for Admin & internal testers"
            right={
              <Toggle
                id="beta-testing"
                checked={adminSettings.betaTestingMode}
                onChange={e => updateSetting('betaTestingMode', e.target.checked)}
              />
            }
          />

          {/* Deactivate Admin Mode button */}
          <div style={{ paddingTop: 14, textAlign: 'right' }}>
            <button
              onClick={handleDeactivateAdmin}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Exit Admin Mode
            </button>
          </div>
        </div>
      ) : (
        /* Regular User View: Switching options are hidden! */
        <div
          className="garage-card"
          style={{
            padding: '14px 18px',
            marginBottom: 12,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} color="var(--text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                System Settings Managed by Admin
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                System-wide switches and storage rules are configured by the project administrator.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Danger & Auth Zone ───────────────────────────── */}
      <div className="garage-card" style={{ padding: '14px 18px', marginBottom: 24 }}>
        {/* Sign out */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)',
            }}
          >
            <LogOut size={15} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-color)' }}>
            Sign Out
          </span>
        </button>

        {/* Admin Unlock Modal / Row */}
        {!isRealAdminUser && (
          <div style={{ paddingTop: 10 }}>
            {!showAdminLogin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Key size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Unlock Admin Profile
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Enter credentials or PIN to access admin switching options
                  </div>
                </div>
              </button>
            ) : (
              <form onSubmit={handleAdminAuthSubmit} style={{ paddingTop: 6 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Enter Admin Credential or PIN:
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <input
                    type="password"
                    placeholder="Admin PIN (e.g. admin2026 or email)"
                    value={adminCredInput}
                    onChange={e => setAdminCredInput(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      minWidth: '160px',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-orange"
                    style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setAdminError(''); }}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
                {adminError && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginBottom: 6 }}>
                    {adminError}
                  </div>
                )}
                {adminSuccess && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginBottom: 6 }}>
                    {adminSuccess}
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>

      {/* Tiny version tag */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          NGINEBREAK · {isAdminView ? 'ADMIN CONSOLE ACTIVE' : 'MVP v0.1.0'}
        </span>
      </div>
    </div>
  );
}
