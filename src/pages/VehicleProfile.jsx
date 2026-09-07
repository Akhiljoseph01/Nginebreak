import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import MaintenanceCard from '../components/MaintenanceCard';
import { STATUS } from '../services/CalculationEngine';
import { ChevronLeft, Plus, Gauge } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

export default function VehicleProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, updateOdometer } = useGarage();
  const vehicle = vehicles.find(v => v.id === id);

  const [showOdoUpdate, setShowOdoUpdate] = useState(false);
  const [newOdo, setNewOdo] = useState('');
  const [saving, setSaving] = useState(false);

  if (!vehicle) return <div className="app-container px-3 pt-4 text-muted">Vehicle not found.</div>;

  const mods = vehicle.maintenance_modules || [];
  const overdue  = mods.filter(m => m.status === STATUS.OVERDUE);
  const dueSoon  = mods.filter(m => m.status === STATUS.DUE_SOON);
  const upcoming = mods.filter(m => m.status === STATUS.UPCOMING);

  const handleOdoUpdate = async (e) => {
    e.preventDefault();
    if (!newOdo || parseInt(newOdo) <= vehicle.current_odometer) {
      alert('New odometer must be greater than current reading.');
      return;
    }
    setSaving(true);
    await updateOdometer(id, parseInt(newOdo));
    setSaving(false);
    setNewOdo('');
    setShowOdoUpdate(false);
  };

  return (
    <div className="app-container px-3 pt-3">
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={24} />
        </button>
        <h5 className="mb-0" style={{ fontWeight: 700 }}>{getVehicleIcon(vehicle.type)} {vehicle.make} {vehicle.model}</h5>
      </div>

      {/* Vehicle summary card */}
      <div className="garage-card mb-3" style={{ background: 'linear-gradient(135deg, #1e2a3a, #1a1a2e)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div style={{ fontSize: '2rem' }}>{getVehicleIcon(vehicle.type)}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{vehicle.make} {vehicle.model}</div>
            <small className="text-muted">{vehicle.year} · {vehicle.type}</small>
          </div>
          <div className="text-end">
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>
              {vehicle.current_odometer.toLocaleString()}
            </div>
            <small className="text-muted">km</small>
          </div>
        </div>

        {/* Odometer update */}
        <button
          className="btn btn-sm w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-color)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10 }}
          onClick={() => setShowOdoUpdate(s => !s)}
        >
          <Gauge size={16} />
          Update Odometer
        </button>

        {showOdoUpdate && (
          <form onSubmit={handleOdoUpdate} className="mt-3 d-flex gap-2">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder={`Current: ${vehicle.current_odometer.toLocaleString()} km`}
              value={newOdo}
              onChange={e => setNewOdo(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              {saving ? '…' : 'Update'}
            </button>
          </form>
        )}
      </div>

      {/* Stats row */}
      <div className="row g-2 mb-3">
        <div className="col-4">
          <div className="garage-card text-center py-2 mb-0" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger-color)' }}>{overdue.length}</div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Overdue</small>
          </div>
        </div>
        <div className="col-4">
          <div className="garage-card text-center py-2 mb-0" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--warning-color)' }}>{dueSoon.length}</div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Due Soon</small>
          </div>
        </div>
        <div className="col-4">
          <div className="garage-card text-center py-2 mb-0" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success-color)' }}>{upcoming.length}</div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>OK</small>
          </div>
        </div>
      </div>

      {/* Maintenance sections */}
      {mods.length === 0 ? (
        <div className="garage-card text-center py-4">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔧</div>
          <p className="text-muted mb-3">No maintenance scheduled yet.</p>
          <Link to={`/vehicle/${id}/add-maintenance`} className="btn btn-primary" style={{ borderRadius: 10 }}>
            Add First Service Item
          </Link>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="status-dot status-danger"></span>
                <small style={{ fontWeight: 600, color: 'var(--danger-color)' }}>OVERDUE ({overdue.length})</small>
              </div>
              {overdue.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
            </>
          )}
          {dueSoon.length > 0 && (
            <>
              <div className="d-flex align-items-center gap-2 mb-2 mt-2">
                <span className="status-dot status-warning"></span>
                <small style={{ fontWeight: 600, color: 'var(--warning-color)' }}>DUE SOON ({dueSoon.length})</small>
              </div>
              {dueSoon.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <div className="d-flex align-items-center gap-2 mb-2 mt-2">
                <span className="status-dot status-success"></span>
                <small style={{ fontWeight: 600, color: 'var(--success-color)' }}>ALL GOOD ({upcoming.length})</small>
              </div>
              {upcoming.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
            </>
          )}
        </>
      )}

      {/* Add maintenance FAB */}
      <Link
        to={`/vehicle/${id}/add-maintenance`}
        className="btn d-flex align-items-center gap-2"
        style={{
          position: 'fixed', bottom: 80, right: 20,
          background: 'var(--accent-color)', color: '#fff',
          borderRadius: 50, padding: '0.75rem 1.2rem',
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          fontWeight: 600, zIndex: 999, fontSize: '0.85rem'
        }}
      >
        <Plus size={18} /> Add Service
      </Link>
    </div>
  );
}
