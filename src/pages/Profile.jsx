import React from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { User, Shield, Car, Wrench } from 'lucide-react';

const LEVELS = [
  { min: 0,  label: 'Driver',     desc: 'Just getting started' },
  { min: 5,  label: 'Regular',    desc: 'Building good habits' },
  { min: 15, label: 'Enthusiast', desc: 'Knows every bolt' },
  { min: 30, label: 'Builder',    desc: 'Modifies and maintains' },
  { min: 60, label: 'Veteran',    desc: 'Years on the road' },
  { min: 100,label: 'Legend',     desc: 'A true gearhead' },
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
  const totalModules = vehicles.reduce((a, v) => a + (v.maintenance_modules?.length || 0), 0);
  const totalRecords = vehicles.reduce((a, v) => a + (v.service_history?.length || 0), 0);
  const totalOverdue = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.OVERDUE).length || 0), 0);

  const level = getLevel(totalRecords);
  const nextLevel = LEVELS[Math.min(level.index + 1, LEVELS.length - 1)];
  const progress = nextLevel.min > 0 ? Math.min((totalRecords / nextLevel.min) * 100, 100) : 100;

  return (
    <div className="app-container px-3 pt-4">
      <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Profile</h5>

      {/* Profile card */}
      <div className="garage-card mb-3" style={{ background: 'linear-gradient(135deg, #1e2a3a, #1a1a2e)', textAlign: 'center', padding: '2rem 1.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem', fontWeight: 700, color: '#fff'
        }}>
          {user.name?.[0]?.toUpperCase() || 'G'}
        </div>
        <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{user.name}</h5>
        <div style={{
          display: 'inline-block', padding: '0.25rem 0.75rem',
          background: 'rgba(59,130,246,0.15)', color: 'var(--accent-color)',
          borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem'
        }}>
          🏆 Level {level.index + 1} — {level.label}
        </div>
        <p className="text-muted small mb-2">{level.desc}</p>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 10, transition: 'width 0.6s ease' }} />
        </div>
        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
          {totalRecords} / {nextLevel.min} service records to next level
        </small>
      </div>

      {/* Stats grid */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="garage-card text-center py-3 mb-0">
            <Car size={20} style={{ color: 'var(--accent-color)', marginBottom: 4 }} />
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalVehicles}</div>
            <small className="text-muted">Vehicles</small>
          </div>
        </div>
        <div className="col-6">
          <div className="garage-card text-center py-3 mb-0">
            <Wrench size={20} style={{ color: 'var(--accent-color)', marginBottom: 4 }} />
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalModules}</div>
            <small className="text-muted">Maintenance Items</small>
          </div>
        </div>
        <div className="col-6">
          <div className="garage-card text-center py-3 mb-0">
            <Shield size={20} style={{ color: 'var(--success-color)', marginBottom: 4 }} />
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalRecords}</div>
            <small className="text-muted">Services Done</small>
          </div>
        </div>
        <div className="col-6">
          <div className="garage-card text-center py-3 mb-0">
            <User size={20} style={{ color: totalOverdue > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', marginBottom: 4 }} />
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: totalOverdue > 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{totalOverdue}</div>
            <small className="text-muted">Overdue Items</small>
          </div>
        </div>
      </div>

      {/* Levels progression */}
      <div className="garage-card">
        <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>Enthusiast Levels</h6>
        {LEVELS.map((lv, i) => (
          <div key={lv.label} className="d-flex align-items-center gap-3 mb-2">
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: i <= level.index ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: i <= level.index ? '#fff' : 'var(--text-secondary)'
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: i === level.index ? 700 : 400, fontSize: '0.85rem', color: i <= level.index ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {lv.label} {i === level.index && '← You'}
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{lv.min} service records</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
