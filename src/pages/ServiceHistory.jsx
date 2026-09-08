import React, { useState } from 'react';
import { useGarage } from '../context/GarageContext';
import { format } from 'date-fns';
import { Clock, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

const FILTER_TABS = ['All', 'Engine', 'Fluids', 'Filters', 'Brakes', 'Tyres', 'Electrical', 'Exterior', 'General', 'Custom'];

export default function ServiceHistory() {
  const { vehicles } = useGarage();
  const [activeFilter, setActiveFilter] = useState('All');

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
    <div className="app-container" style={{ paddingTop: 0 }}>
      {/* Page header */}
      <div className="page-header">
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <span className="current">Maintenance</span>
        </div>
        <h1 className="page-title">Maintenance</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, scrollbarWidth: 'none', paddingBottom: 2 }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`chip${activeFilter === tab ? ' active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {allHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h5>No service records yet</h5>
          <p>Mark a maintenance item as done to start your history.</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div className="timeline-line" />

          {allHistory.map((h) => (
            <div key={h.id} style={{ display: 'flex', gap: 14, marginBottom: 10, position: 'relative', zIndex: 1 }}>
              {/* Timeline dot */}
              <div className="timeline-dot">✓</div>

              {/* Card */}
              <div className="garage-card" style={{ flex: 1, marginBottom: 0, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {h.module_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {h.vehicleIcon} {h.vehicleName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                      {h.odometer.toLocaleString()} km
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {h.date ? format(new Date(h.date), 'dd MMM yyyy') : '—'}
                    </div>
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
