import React, { useState, useRef } from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
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
function SettingRow({ icon: Icon, label, desc, right }) {
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
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

export default function Profile() {
  const { vehicles, user, logout } = useGarage();

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
  const [displayName, setDisplayName] = useState(user?.name || 'Enthusiast');
  const [nameInput, setNameInput] = useState(displayName);

  // Settings toggles (UI-only, no backend)
  const [notifService, setNotifService]   = useState(true);
  const [notifOverdue, setNotifOverdue]   = useState(true);
  const [notifUpdates, setNotifUpdates]   = useState(false);
  const [darkMode, setDarkMode]           = useState(false);

  const nameRef = useRef();

  const handleEditSave = () => {
    if (nameInput.trim()) setDisplayName(nameInput.trim());
    setEditMode(false);
  };

  const handleEditCancel = () => {
    setNameInput(displayName);
    setEditMode(false);
  };

  // Derived initials
  const initials = displayName?.[0]?.toUpperCase() || 'G';

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>

      {/* ── Page header ───────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1 className="page-title">Profile</h1>
      </div>

      {/* ── Profile card ──────────────────────────────── */}
      <div
        className="garage-card"
        style={{ padding: '22px 18px 18px', marginBottom: 12 }}
      >
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF4D00, #FF8A50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(255,77,0,0.3)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {displayName}
                </div>
                <button
                  onClick={() => { setNameInput(displayName); setEditMode(true); }}
                  title="Edit name"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 3,
                    display: 'flex',
                    borderRadius: 6,
                    transition: 'color 0.15s ease',
                  }}
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            {/* Level chip — compact */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 4,
                padding: '2px 9px 2px 6px',
                borderRadius: 20,
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <span style={{ fontSize: '0.78rem' }}>{level.emoji}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--accent-color)',
                  letterSpacing: '0.01em',
                }}
              >
                {level.label}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar — compact */}
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

      {/* ── Stats strip — inline ──────────────────────────── */}
      <div
        className="garage-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '14px 8px',
          marginBottom: 12,
          gap: 0,
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
              borderRight: label !== 'Overdue' ? '1px solid var(--border-color)' : 'none',
            }}
          >
            <Icon size={16} style={{ color }} />
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {value}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Settings ──────────────────────────────────────── */}
      <div className="garage-card" style={{ padding: '16px 18px', marginBottom: 12 }}>
        <div
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Settings
        </div>

        <SettingRow
          icon={Bell}
          label="Service Reminders"
          desc="Notify when a maintenance is due"
          right={
            <Toggle
              id="notif-service"
              checked={notifService}
              onChange={e => setNotifService(e.target.checked)}
            />
          }
        />
        <SettingRow
          icon={AlertTriangle}
          label="Overdue Alerts"
          desc="Alert when past scheduled service"
          right={
            <Toggle
              id="notif-overdue"
              checked={notifOverdue}
              onChange={e => setNotifOverdue(e.target.checked)}
            />
          }
        />
        <SettingRow
          icon={BellOff}
          label="App Updates"
          desc="News and feature announcements"
          right={
            <Toggle
              id="notif-updates"
              checked={notifUpdates}
              onChange={e => setNotifUpdates(e.target.checked)}
            />
          }
        />
        <SettingRow
          icon={Moon}
          label="Dark Mode"
          desc="Coming soon"
          right={
            <Toggle
              id="dark-mode"
              checked={darkMode}
              onChange={e => setDarkMode(e.target.checked)}
            />
          }
        />
        {/* Privacy — link-style, no action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '13px 0',
            cursor: 'default',
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
            <Shield size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Privacy & Data
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
              Your data stays on your device
            </div>
          </div>
          <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────── */}
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

        {/* Delete account — visual only */}
        <button
          onClick={() => alert('Account deletion will be available in a future update.')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0 0',
            textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger-color)',
            }}
          >
            <Trash2 size={15} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger-color)' }}>
              Delete Account
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Permanently remove your data
            </div>
          </div>
        </button>
      </div>

      {/* Tiny version tag */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          NGINEBREAK · MVP v0.1.0
        </span>
      </div>
    </div>
  );
}
