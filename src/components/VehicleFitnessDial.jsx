import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Gauge, ChevronRight } from 'lucide-react';
import { getVehicleFitnessStats } from '../services/CalculationEngine';
import { Link } from 'react-router-dom';

export default function VehicleFitnessDial({ vehicle, onOpenOdoModal, onViewDetails }) {
  if (!vehicle) return null;

  const stats = getVehicleFitnessStats(vehicle);
  const mods = vehicle.maintenance_modules || [];
  
  // Calculate SVG circular stroke
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.score / 100) * circumference;

  let strokeColor = 'var(--accent-color, #f97316)';
  if (stats.score >= 80) strokeColor = '#10b981'; // Green
  else if (stats.score >= 50) strokeColor = '#f59e0b'; // Amber / Orange
  else strokeColor = '#ef4444'; // Red

  return (
    <div className="fitness-dial-card" style={{
      background: 'var(--bg-card)',
      borderRadius: 20,
      padding: '20px 18px',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--card-shadow, 0 4px 20px rgba(0,0,0,0.06))',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/* Top section: Dial + Count badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        {/* Circular Gauge */}
        <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="104" height="104" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--border-color, rgba(255,255,255,0.08))"
              strokeWidth="8"
            />
            {/* Value ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {stats.score}%
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 2 }}>
              Vehicle Health
            </span>
          </div>
        </div>

        {/* Counter Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stats.healthyCount} Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stats.dueSoonCount} Due Soon</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stats.overdueCount} Overdue</span>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      <div style={{
        background: stats.overdueCount > 0 
          ? 'rgba(239,68,68,0.08)' 
          : stats.dueSoonCount > 0 
            ? 'rgba(245,158,11,0.08)' 
            : 'rgba(16,185,129,0.08)',
        border: stats.overdueCount > 0 
          ? '1px solid rgba(239,68,68,0.2)' 
          : stats.dueSoonCount > 0 
            ? '1px solid rgba(245,158,11,0.2)' 
            : '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.8rem',
        lineHeight: 1.4
      }}>
        {stats.overdueCount > 0 ? (
          <AlertTriangle size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
        ) : stats.dueSoonCount > 0 ? (
          <AlertCircle size={16} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
        ) : (
          <CheckCircle2 size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
        )}
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {stats.score >= 80 ? 'Great! Your vehicle looks healthy.' : stats.conditionLabel + '.'}{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{stats.nextAction}</span>
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          className="btn-orange"
          onClick={onOpenOdoModal}
          style={{
            fontSize: '0.82rem',
            padding: '10px 12px',
            justifyContent: 'center',
            borderRadius: 12
          }}
        >
          <Gauge size={14} /> Update Odometer
        </button>

        <Link
          to={`/vehicle/${vehicle.id}`}
          className="btn-secondary"
          style={{
            fontSize: '0.82rem',
            padding: '10px 12px',
            justifyContent: 'center',
            borderRadius: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
