import React from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { User, Shield, Car, Wrench } from 'lucide-react';

const LEVELS = [
  { min: 0,   label: 'Driver',     desc: 'Just getting started' },
  { min: 5,   label: 'Regular',    desc: 'Building good habits' },
  { min: 15,  label: 'Enthusiast', desc: 'Knows every bolt' },
  { min: 30,  label: 'Builder',    desc: 'Modifies and maintains' },
  { min: 60,  label: 'Veteran',    desc: 'Years on the road' },
  { min: 100, label: 'Legend',     desc: 'A true gearhead' },
];

function getLevel(totalRecords) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalRecords >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

export default function Profile() {
  const { vehicles, user } = useGarage();

  const totalVehicles = vehicles.length;
  const totalModules  = vehicles.reduce((a, v) => a + (v.maintenance_modules?.length || 0), 0);
  const totalRecords  = vehicles.reduce((a, v) => a + (v.service_history?.length || 0), 0);
  const totalOverdue  = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.OVERDUE).length || 0), 0);

  const level      = getLevel(totalRecords);
  const nextLevel  = LEVELS[Math.min(level.index + 1, LEVELS.length - 1)];
  const progress   = nextLevel.min > 0 ? Math.min((totalRecords / nextLevel.min) * 100, 100) : 100;

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      {/* ── Profile card ────────────────────────────────── */}
      <div className="garage-card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
          background: 'linear-gradient(135deg, #FF4D00, #FF8A50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 700, color: '#fff'
        }}>
          {user.name?.[0]?.toUpperCase() || 'G'}
        </div>

        <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          {user.name}
        </h3>

        {/* Level badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '5px 12px', borderRadius: 20,
          background: 'var(--accent-light)', color: 'var(--accent-color)',
          fontSize: '0.78rem', fontWeight: 700, marginBottom: 14
        }}>
          🏆 Level {level.index + 1} — {level.label}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 14 }}>
          {level.desc}
        </p>

        {/* Progress bar */}
        <div className="progress-bar-orange" style={{ marginBottom: 6 }}>
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {totalRecords} / {nextLevel.min} service records to next level
        </span>
      </div>

      {/* ── Stats grid ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 12px' }}>
          <Car size={20} style={{ color: 'var(--accent-color)', marginBottom: 6 }} />
          <div className="stat-number">{totalVehicles}</div>
          <div className="stat-label">Vehicles</div>
        </div>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 12px' }}>
          <Wrench size={20} style={{ color: 'var(--accent-color)', marginBottom: 6 }} />
          <div className="stat-number">{totalModules}</div>
          <div className="stat-label">Maintenance Items</div>
        </div>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 12px' }}>
          <Shield size={20} style={{ color: 'var(--success-color)', marginBottom: 6 }} />
          <div className="stat-number">{totalRecords}</div>
          <div className="stat-label">Services Done</div>
        </div>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 12px' }}>
          <User size={20} style={{ color: totalOverdue > 0 ? 'var(--danger-color)' : 'var(--text-muted)', marginBottom: 6 }} />
          <div className="stat-number" style={{ color: totalOverdue > 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>
            {totalOverdue}
          </div>
          <div className="stat-label">Overdue Items</div>
        </div>
      </div>

      {/* ── Levels progression ──────────────────────────── */}
      <div className="garage-card" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--text-primary)' }}>
          Enthusiast Levels
        </h3>
        {LEVELS.map((lv, i) => (
          <div key={lv.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {/* Level number */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: i <= level.index ? 'linear-gradient(135deg, #FF4D00, #FF8A50)' : 'var(--bg-page)',
              border: i <= level.index ? 'none' : '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              color: i <= level.index ? '#fff' : 'var(--text-muted)'
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: i === level.index ? 700 : 500,
                fontSize: '0.85rem',
                color: i <= level.index ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {lv.label} {i === level.index && <span style={{ color: 'var(--accent-color)' }}>← You</span>}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {lv.min} service records
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
