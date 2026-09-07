import React from 'react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { ChevronRight } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

export default function Vehicles() {
  const { vehicles } = useGarage();

  return (
    <div className="app-container px-3 pt-4">
      <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>All Vehicles</h5>
      {vehicles.length === 0 ? (
        <div className="garage-card text-center py-4">
          <p className="text-muted mb-3">No vehicles yet.</p>
          <Link to="/add-vehicle" className="btn btn-primary" style={{ borderRadius: 10 }}>Add Vehicle</Link>
        </div>
      ) : (
        vehicles.map(v => {
          const mods = v.maintenance_modules || [];
          const overdue = mods.filter(m => m.status === STATUS.OVERDUE).length;
          const dueSoon = mods.filter(m => m.status === STATUS.DUE_SOON).length;
          return (
            <Link key={v.id} to={`/vehicle/${v.id}`} style={{ textDecoration: 'none' }}>
              <div className="garage-card">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '2.2rem' }}>{getVehicleIcon(v.type)}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.make} {v.model}</div>
                      <small className="text-muted">{v.year} · {v.type}</small>
                      <div><small className="text-muted">{v.current_odometer.toLocaleString()} km</small></div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {overdue > 0 && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>🔴 {overdue}</span>}
                    {dueSoon > 0 && <span style={{ color: 'var(--warning-color)', fontSize: '0.75rem' }}>🟡 {dueSoon}</span>}
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </div>
                <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted">{mods.length} scheduled items</span>
                  <span className="text-muted">· {(v.service_history || []).length} service records</span>
                </div>
              </div>
            </Link>
          );
        })
      )}
      <Link to="/add-vehicle" className="btn w-100"
        style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-color)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 12, fontWeight: 600, marginTop: 4 }}>
        + Add Vehicle
      </Link>
    </div>
  );
}
