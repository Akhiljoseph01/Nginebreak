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

  // Filter history by active tab
  const filteredHistory = allHistory.filter(h => {
    if (activeFilter === 'All') return true;
    return (h.module_name || '').toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="app-container" style={{ paddingTop: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Page header */}
      <div className="page-header">
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <span className="current">Maintenance</span>
        </div>
        <h1 className="page-title">Maintenance</h1>
      </div>

      {/* Filter tabs - smooth horizontal touch scroll without expanding parent */}
      <div
        className="h-scroll"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          maxWidth: '100%',
          marginBottom: 20,
          scrollbarWidth: 'none',
          paddingBottom: 4,
        }}
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`chip${activeFilter === tab ? ' active' : ''}`}
            style={{ flexShrink: 0 }}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredHistory.length === 0 ? (
        <div
          className="empty-state"
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '40px 16px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="empty-icon" style={{ fontSize: '3.2rem', marginBottom: 14 }}>📋</div>
          <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            {activeFilter === 'All' ? 'No service records yet' : `No ${activeFilter} service records`}
          </h5>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto', lineHeight: 1.45 }}>
            Mark a maintenance item as done to start your vehicle service history.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
          {/* Timeline line */}
          <div className="timeline-line" />

          {filteredHistory.map((h) => (
            <div key={h.id} style={{ display: 'flex', gap: 12, marginBottom: 12, position: 'relative', zIndex: 1 }}>
              {/* Timeline dot */}
              <div className="timeline-dot" style={{ flexShrink: 0 }}>✓</div>

              {/* Card */}
              <div className="garage-card" style={{ flex: 1, minWidth: 0, marginBottom: 0, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ minWidth: '130px', flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {h.module_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {h.vehicleIcon} {h.vehicleName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                      {h.odometer ? h.odometer.toLocaleString() : '—'} km
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
