import React, { useState } from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

function getStatusBorderColor(status) {
  if (status === STATUS.OVERDUE)  return 'var(--danger-color)';
  if (status === STATUS.DUE_SOON) return 'var(--warning-color)';
  return 'var(--border-color)';
}

function getStatusIconBg(status) {
  if (status === STATUS.OVERDUE)  return 'rgba(239,68,68,0.08)';
  if (status === STATUS.DUE_SOON) return 'rgba(245,158,11,0.08)';
  return 'rgba(16,185,129,0.08)';
}

function formatRemaining(mod) {
  const parts = [];
  if (mod.interval_km && mod.remaining_km !== null) {
    if (mod.remaining_km <= 0) {
      parts.push(`Overdue by ${Math.abs(mod.remaining_km).toLocaleString()} km`);
    } else {
      parts.push(`${mod.remaining_km.toLocaleString()} km remaining`);
    }
  }
  if (mod.interval_months && mod.remaining_days !== null) {
    if (mod.remaining_days <= 0) {
      parts.push(`${Math.abs(mod.remaining_days)} days overdue`);
    } else {
      parts.push(`${mod.remaining_days} days remaining`);
    }
  }
  return parts.join(' · ');
}

export default function MaintenanceCard({ mod, vehicleId, currentOdometer }) {
  const { completeService } = useGarage();
  const [expanded, setExpanded] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completedOdo, setCompletedOdo] = useState(currentOdometer);
  const [completedDate, setCompletedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const borderColor = getStatusBorderColor(mod.status);
  const iconBg = getStatusIconBg(mod.status);

  const handleComplete = async (e) => {
    e.preventDefault();
    setSaving(true);
    await completeService(vehicleId, mod.id, completedOdo, completedDate);
    setSaving(false);
    setShowComplete(false);
  };

  return (
    <div
      className="garage-card"
      style={{ borderLeft: `3px solid ${borderColor}`, padding: '12px 14px', cursor: 'pointer' }}
    >
      {/* Main row */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          {/* Icon box */}
          <div style={{
            width: 38, height: 38, borderRadius: 8, background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0
          }}>
            🔧
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {mod.name}
              </span>
              <StatusBadge status={mod.status} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {formatRemaining(mod)}
            </div>
            {mod.next_due_km && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Due at {mod.next_due_km.toLocaleString()} km
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <button
            style={{
              background: 'rgba(16,185,129,0.08)', color: 'var(--success-color)',
              border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8,
              padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}
            onClick={(e) => { e.stopPropagation(); setShowComplete(s => !s); }}
          >
            <CheckCircle size={13} /> Done
          </button>
          {expanded
            ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8
        }}>
          {mod.interval_km && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Interval </span>
              <strong style={{ color: 'var(--text-primary)' }}>{mod.interval_km.toLocaleString()} km</strong>
            </div>
          )}
          {mod.interval_months && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Time </span>
              <strong style={{ color: 'var(--text-primary)' }}>Every {mod.interval_months}mo</strong>
            </div>
          )}
          {mod.last_service_km && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last at </span>
              <strong style={{ color: 'var(--text-primary)' }}>{mod.last_service_km.toLocaleString()} km</strong>
            </div>
          )}
          {mod.last_service_date && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last date </span>
              <strong style={{ color: 'var(--text-primary)' }}>{format(new Date(mod.last_service_date), 'dd MMM yy')}</strong>
            </div>
          )}
        </div>
      )}

      {/* Complete service form */}
      {showComplete && (
        <form
          onSubmit={handleComplete}
          style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Odometer (km)</label>
              <input
                type="number"
                className="form-control"
                value={completedOdo}
                onChange={e => setCompletedOdo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Date</label>
              <input
                type="date"
                className="form-control"
                value={completedDate}
                onChange={e => setCompletedDate(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-orange"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {saving ? 'Saving…' : '✓ Confirm Service Done'}
          </button>
        </form>
      )}
    </div>
  );
}
