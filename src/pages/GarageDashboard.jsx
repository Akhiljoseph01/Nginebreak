import React from 'react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { Plus, AlertTriangle, ChevronRight } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

function getWorstStatus(modules) {
  if (modules.some(m => m.status === STATUS.OVERDUE)) return STATUS.OVERDUE;
  if (modules.some(m => m.status === STATUS.DUE_SOON)) return STATUS.DUE_SOON;
  return STATUS.UPCOMING;
}

function VehicleRow({ vehicle }) {
  const mods = vehicle.maintenance_modules || [];
  const overdue = mods.filter(m => m.status === STATUS.OVERDUE).length;
  const dueSoon = mods.filter(m => m.status === STATUS.DUE_SOON).length;
  const worst = getWorstStatus(mods);

  const borderColor = worst === STATUS.OVERDUE ? 'var(--danger-color)'
    : worst === STATUS.DUE_SOON ? 'var(--warning-color)'
    : 'transparent';

  return (
    <Link to={`/vehicle/${vehicle.id}`} style={{ textDecoration: 'none' }}>
      <div className="garage-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '2rem' }}>{getVehicleIcon(vehicle.type)}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{vehicle.make} {vehicle.model}</div>
              <small className="text-muted">{vehicle.year} · {vehicle.current_odometer.toLocaleString()} km</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {overdue > 0 && (
              <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger-color)', borderRadius: 20, fontSize: '0.7rem' }}>
                🔴 {overdue}
              </span>
            )}
            {dueSoon > 0 && (
              <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning-color)', borderRadius: 20, fontSize: '0.7rem' }}>
                🟡 {dueSoon}
              </span>
            )}
            {mods.length === 0 && <small className="text-muted" style={{ fontSize: '0.72rem' }}>No schedule</small>}
            <ChevronRight size={16} className="text-muted" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GarageDashboard() {
  const { vehicles, user, loading } = useGarage();

  const totalModules = vehicles.reduce((a, v) => a + (v.maintenance_modules?.length || 0), 0);
  const totalOverdue = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.OVERDUE).length || 0), 0);
  const totalDueSoon = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.DUE_SOON).length || 0), 0);

  if (loading) return (
    <div className="app-container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="text-muted">Loading your garage…</div>
    </div>
  );

  return (
    <div className="app-container px-3 pt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div>
          <h4 style={{ fontWeight: 800, marginBottom: 0 }}>My Garage</h4>
          <small className="text-muted">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</small>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1rem', color: '#fff'
        }}>
          {user.name?.[0]?.toUpperCase() || 'G'}
        </div>
      </div>

      {/* Alert banner if anything overdue */}
      {totalOverdue > 0 && (
        <div className="d-flex align-items-center gap-2 p-2 mb-3 mt-2"
          style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
          <small style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
            {totalOverdue} item{totalOverdue !== 1 ? 's' : ''} overdue across your garage
          </small>
        </div>
      )}

      {/* Stats */}
      {vehicles.length > 0 && (
        <div className="row g-2 mb-3">
          <div className="col-4">
            <div className="garage-card text-center py-2 mb-0">
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{vehicles.length}</div>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Vehicles</small>
            </div>
          </div>
          <div className="col-4">
            <div className="garage-card text-center py-2 mb-0">
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalModules}</div>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Services</small>
            </div>
          </div>
          <div className="col-4">
            <div className="garage-card text-center py-2 mb-0">
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: totalDueSoon > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}>
                {totalDueSoon}
              </div>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Due Soon</small>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏎️</div>
          <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Your garage is empty</h5>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Add your first vehicle to start tracking maintenance.
          </p>
          <Link to="/add-vehicle" className="btn btn-primary" style={{ borderRadius: 12, fontWeight: 600, padding: '0.75rem 2rem' }}>
            <Plus size={18} style={{ marginRight: 6 }} />
            Add Vehicle
          </Link>
        </div>
      ) : (
        <>
          {vehicles.map(v => <VehicleRow key={v.id} vehicle={v} />)}
          <Link to="/add-vehicle" className="btn w-100 mb-3"
            style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-color)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 12, fontWeight: 600 }}>
            <Plus size={16} style={{ marginRight: 6 }} /> Add Another Vehicle
          </Link>
        </>
      )}
    </div>
  );
}
