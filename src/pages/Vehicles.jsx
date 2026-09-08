import React from 'react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { ChevronRight, Plus } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

export default function Vehicles() {
  const { vehicles } = useGarage();

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      {/* Page header */}
      <div className="page-header">
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <span className="current">Vehicles</span>
        </div>
        <h1 className="page-title">All Vehicles</h1>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h5>No vehicles yet</h5>
          <p>Add your first vehicle to get started.</p>
          <Link to="/add-vehicle" className="btn-orange">
            <Plus size={16} /> Add Vehicle
          </Link>
        </div>
      ) : (
        <>
          {vehicles.map(v => {
            const mods = v.maintenance_modules || [];
            const overdue = mods.filter(m => m.status === STATUS.OVERDUE).length;
            const dueSoon = mods.filter(m => m.status === STATUS.DUE_SOON).length;

            return (
              <Link key={v.id} to={`/vehicle/${v.id}`} className="vehicle-card-h">
                <div className="vehicle-icon-box">
                  {getVehicleIcon(v.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    {v.make} {v.model}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {v.year} · {v.type} · {v.current_odometer.toLocaleString()} km
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {overdue > 0 && <span className="badge-pill badge-danger">{overdue} overdue</span>}
                    {dueSoon > 0 && <span className="badge-pill badge-warning">{dueSoon} due soon</span>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {mods.length} scheduled · {(v.service_history || []).length} records
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            );
          })}

          <Link
            to="/add-vehicle"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px', borderRadius: 12, marginTop: 4,
              border: '1.5px dashed var(--accent-border)',
              color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: 600,
              background: 'var(--accent-light)'
            }}
          >
            <Plus size={16} /> Add Vehicle
          </Link>
        </>
      )}
    </div>
  );
}
