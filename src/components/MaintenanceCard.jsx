import React, { useState } from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

function getStatusColor(status) {
  if (status === STATUS.OVERDUE) return 'var(--danger-color)';
  if (status === STATUS.DUE_SOON) return 'var(--warning-color)';
  return 'var(--success-color)';
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

  const borderColor = getStatusColor(mod.status);

  const handleComplete = async (e) => {
    e.preventDefault();
    setSaving(true);
    await completeService(vehicleId, mod.id, completedOdo, completedDate);
    setSaving(false);
    setShowComplete(false);
  };

  return (
    <div className="garage-card" style={{ borderLeft: `3px solid ${borderColor}`, padding: '1rem 1rem' }}>
      <div className="d-flex justify-content-between align-items-start" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mod.name}</span>
            <StatusBadge status={mod.status} />
          </div>
          <small className="text-muted">{formatRemaining(mod)}</small>
          {mod.next_due_km && (
            <div><small className="text-muted">Due at {mod.next_due_km.toLocaleString()} km</small></div>
          )}
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success-color)', border: 'none', borderRadius: 8, padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            onClick={(e) => { e.stopPropagation(); setShowComplete(s => !s); }}
          >
            <CheckCircle size={14} style={{ marginRight: 4 }} />Done
          </button>
          {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
          <div className="row g-2">
            {mod.interval_km && <div className="col-6"><span className="text-muted">Interval:</span> <strong>{mod.interval_km.toLocaleString()} km</strong></div>}
            {mod.interval_months && <div className="col-6"><span className="text-muted">Time:</span> <strong>Every {mod.interval_months}mo</strong></div>}
            {mod.last_service_km && <div className="col-6"><span className="text-muted">Last at:</span> <strong>{mod.last_service_km.toLocaleString()} km</strong></div>}
            {mod.last_service_date && <div className="col-6"><span className="text-muted">Last date:</span> <strong>{format(new Date(mod.last_service_date), 'dd MMM yy')}</strong></div>}
          </div>
        </div>
      )}

      {showComplete && (
        <form onSubmit={handleComplete} className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small text-muted mb-1">Odometer (km)</label>
              <input type="number" className="form-control form-control-sm" value={completedOdo}
                onChange={e => setCompletedOdo(e.target.value)} required />
            </div>
            <div className="col-6">
              <label className="form-label small text-muted mb-1">Date</label>
              <input type="date" className="form-control form-control-sm" value={completedDate}
                onChange={e => setCompletedDate(e.target.value)} required />
            </div>
          </div>
          <button className="btn btn-sm w-100 mt-2" type="submit" disabled={saving}
            style={{ background: 'var(--success-color)', color: '#fff', border: 'none', borderRadius: 8 }}>
            {saving ? 'Saving…' : 'Confirm Service Done'}
          </button>
        </form>
      )}
    </div>
  );
}
