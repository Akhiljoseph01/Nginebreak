import React from 'react';
import { useGarage } from '../context/GarageContext';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

export default function ServiceHistory() {
  const { vehicles } = useGarage();

  // Flatten all history across all vehicles with vehicle info attached
  const allHistory = vehicles.flatMap(v =>
    (v.service_history || []).map(h => ({
      ...h,
      vehicleName: `${v.make} ${v.model}`,
      vehicleIcon: getVehicleIcon(v.type),
      vehicleId: v.id
    }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="app-container px-3 pt-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <Clock size={22} style={{ color: 'var(--accent-color)' }} />
        <h5 className="mb-0" style={{ fontWeight: 700 }}>Service History</h5>
      </div>

      {allHistory.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p className="text-muted">No service records yet.</p>
          <small className="text-muted">Mark a maintenance item as done to start your history.</small>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 19, top: 0, bottom: 0,
            width: 2, background: 'rgba(255,255,255,0.07)', zIndex: 0
          }} />

          {allHistory.map((h, i) => (
            <div key={h.id} className="d-flex gap-3 mb-3" style={{ position: 'relative', zIndex: 1 }}>
              {/* Circle */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(16,185,129,0.15)', border: '2px solid var(--success-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem'
              }}>
                ✓
              </div>

              <div className="garage-card flex-grow-1" style={{ padding: '0.75rem 1rem', marginBottom: 0 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{h.module_name}</div>
                    <small className="text-muted">{h.vehicleIcon} {h.vehicleName}</small>
                  </div>
                  <div className="text-end">
                    <div style={{ fontWeight: 600, color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                      {h.odometer.toLocaleString()} km
                    </div>
                    <small className="text-muted">
                      {h.date ? format(new Date(h.date), 'dd MMM yyyy') : '—'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
