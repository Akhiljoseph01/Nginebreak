import React, { useState } from 'react';
import { useGarage } from '../context/GarageContext';
import { STATUS, calculatePartLifePercent } from '../services/CalculationEngine';
import StatusBadge from './StatusBadge';
import DualPillModal from './DualPillModal';
import { format } from 'date-fns';
import { CheckCircle, ChevronRight, Gauge, Clock } from 'lucide-react';

function getPartEmoji(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('oil')) return '🛢️';
  if (lower.includes('brake')) return '🛑';
  if (lower.includes('filter') || lower.includes('air')) return '💨';
  if (lower.includes('coolant')) return '🧪';
  if (lower.includes('tyre') || lower.includes('tire')) return '🛞';
  if (lower.includes('spark') || lower.includes('battery')) return '⚡';
  if (lower.includes('chain') || lower.includes('belt')) return '⚙️';
  return '🔧';
}

function getLifeColor(percent, status) {
  if (status === STATUS.OVERDUE || percent <= 0) return 'var(--danger-color, #ef4444)';
  if (status === STATUS.DUE_SOON || percent <= 30) return 'var(--warning-color, #f59e0b)';
  return 'var(--success-color, #10b981)';
}

export default function MaintenanceCard({ mod, vehicleId, currentOdometer, vehicle }) {
  const { completeService } = useGarage();
  const [showDualModal, setShowDualModal] = useState(false);
  const [showQuickComplete, setShowQuickComplete] = useState(false);
  const [completedOdo, setCompletedOdo] = useState(currentOdometer || 0);
  const [completedDate, setCompletedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const lifePercent = calculatePartLifePercent(mod, currentOdometer);
  const lifeColor = getLifeColor(lifePercent, mod.status);

  // Subtitle format
  let subtitle = '';
  if (mod.status === STATUS.OVERDUE) {
    if (mod.remaining_km !== null && mod.remaining_km <= 0) {
      subtitle = `Overdue by ${Math.abs(mod.remaining_km).toLocaleString()} km!`;
    } else if (mod.remaining_days !== null && mod.remaining_days <= 0) {
      subtitle = `Overdue by ${Math.abs(mod.remaining_days)} days!`;
    } else {
      subtitle = 'Overdue for service';
    }
  } else {
    const parts = [];
    if (mod.remaining_km !== null && mod.remaining_km > 0) {
      parts.push(`${mod.remaining_km.toLocaleString()} km remaining`);
    }
    if (mod.remaining_days !== null && mod.remaining_days > 0) {
      if (mod.remaining_days > 60) {
        parts.push(`~${Math.round(mod.remaining_days / 30.4)} months`);
      } else if (mod.remaining_days <= 30) {
        parts.push(`Service soon (${mod.remaining_days}d)`);
      } else {
        parts.push(`~${mod.remaining_days} days`);
      }
    }
    subtitle = parts.join(' • ') || 'Scheduled';
  }

  const handleQuickComplete = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await completeService(vehicleId, mod.id, parseInt(completedOdo), completedDate);
      setShowQuickComplete(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentVehicleObj = vehicle || { id: vehicleId, current_odometer: currentOdometer };

  return (
    <>
      <div
        className="maintenance-battery-card"
        onClick={() => setShowDualModal(true)}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          padding: '14px 16px',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          marginBottom: 10
        }}
      >
        {/* Top row: Icon + Name + Life % badge + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{getPartEmoji(mod.name)}</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {mod.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.82rem',
                color: lifeColor,
                background: mod.status === STATUS.OVERDUE 
                  ? 'rgba(239,68,68,0.1)' 
                  : mod.status === STATUS.DUE_SOON 
                    ? 'rgba(245,158,11,0.1)' 
                    : 'rgba(16,185,129,0.1)',
                padding: '2px 8px',
                borderRadius: 8
              }}
            >
              {lifePercent}% Life
            </span>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Battery / Progress Bar */}
        <div
          style={{
            height: 6,
            width: '100%',
            background: 'var(--border-color, rgba(255,255,255,0.08))',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 8
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(4, lifePercent)}%`,
              background: lifeColor,
              borderRadius: 6,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>

        {/* Bottom row: Subtitle info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: mod.status === STATUS.OVERDUE ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: mod.status === STATUS.OVERDUE ? 600 : 400 }}>
            {subtitle}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickComplete(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 6
            }}
          >
            ✓ Done
          </button>
        </div>

        {/* Inline quick completion if triggered */}
        {showQuickComplete && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <form onSubmit={handleQuickComplete} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '0.8rem', padding: '6px 10px', width: 110 }}
                placeholder="Odo km"
                value={completedOdo}
                onChange={e => setCompletedOdo(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="btn-orange"
                style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              >
                {saving ? 'Saving…' : '✓ Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickComplete(false)}
                className="btn-secondary"
                style={{ fontSize: '0.76rem', padding: '6px 10px' }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Option 2 Dual Pill Detail Modal */}
      {showDualModal && (
        <DualPillModal
          mod={mod}
          vehicle={currentVehicleObj}
          onClose={() => setShowDualModal(false)}
        />
      )}
    </>
  );
}
