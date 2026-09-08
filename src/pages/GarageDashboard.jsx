import React from 'react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { STATUS } from '../services/CalculationEngine';
import { Plus, Bell, ChevronRight, AlertTriangle } from 'lucide-react';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

function getWorstStatus(modules) {
  if (modules.some(m => m.status === STATUS.OVERDUE))  return STATUS.OVERDUE;
  if (modules.some(m => m.status === STATUS.DUE_SOON)) return STATUS.DUE_SOON;
  return STATUS.UPCOMING;
}

function VehicleCard({ vehicle }) {
  const mods   = vehicle.maintenance_modules || [];
  const overdue  = mods.filter(m => m.status === STATUS.OVERDUE).length;
  const dueSoon  = mods.filter(m => m.status === STATUS.DUE_SOON).length;
  const worst    = getWorstStatus(mods);

  const borderColor = worst === STATUS.OVERDUE  ? 'var(--danger-color)'
    : worst === STATUS.DUE_SOON ? 'var(--warning-color)'
    : 'var(--border-color)';

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="vehicle-card-h"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="vehicle-icon-box">
        {getVehicleIcon(vehicle.type)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
          {vehicle.make} {vehicle.model}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {vehicle.year} · {vehicle.current_odometer.toLocaleString()} km
        </div>
        {(overdue > 0 || dueSoon > 0) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {overdue > 0 && (
              <span className="badge-pill badge-danger">{overdue} overdue</span>
            )}
            {dueSoon > 0 && (
              <span className="badge-pill badge-warning">{dueSoon} due soon</span>
            )}
          </div>
        )}
        {mods.length === 0 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No schedule</span>
        )}
      </div>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </Link>
  );
}

function NextUpItem({ mod, vehicleName }) {
  const isOverdue  = mod.status === STATUS.OVERDUE;
  const isDueSoon  = mod.status === STATUS.DUE_SOON;

  const iconBg = isOverdue  ? 'rgba(239,68,68,0.08)'
    : isDueSoon ? 'rgba(245,158,11,0.08)'
    : 'rgba(16,185,129,0.08)';

  const textColor = isOverdue  ? 'var(--danger-color)'
    : isDueSoon ? 'var(--warning-color)'
    : 'var(--text-muted)';

  const pillCls = isOverdue ? 'badge-pill badge-danger'
    : isDueSoon ? 'badge-pill badge-warning'
    : 'badge-pill badge-success';

  const pillText = isOverdue ? 'Due Soon' : isDueSoon ? 'Upcoming' : 'OK';

  const remaining = mod.remaining_km != null
    ? `${Math.abs(mod.remaining_km).toLocaleString()} km remaining`
    : mod.remaining_days != null
    ? `${Math.abs(mod.remaining_days)} days remaining`
    : '';

  return (
    <div className="maint-item">
      <div className="maint-icon" style={{ background: iconBg }}>🔧</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>
          {mod.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {vehicleName} · {remaining}
        </div>
      </div>
      <span className={pillCls}>{pillText}</span>
    </div>
  );
}

export default function GarageDashboard() {
  const { vehicles, user, loading } = useGarage();

  const totalModules = vehicles.reduce((a, v) => a + (v.maintenance_modules?.length || 0), 0);
  const totalOverdue = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.OVERDUE).length || 0), 0);
  const totalDueSoon = vehicles.reduce((a, v) => a + (v.maintenance_modules?.filter(m => m.status === STATUS.DUE_SOON).length || 0), 0);

  // Collect "next up" items (overdue + due soon, up to 3)
  const nextUpItems = vehicles.flatMap(v =>
    (v.maintenance_modules || [])
      .filter(m => m.status === STATUS.OVERDUE || m.status === STATUS.DUE_SOON)
      .map(m => ({ ...m, vehicleName: `${v.make} ${v.model}` }))
  ).slice(0, 3);

  if (loading) return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading your garage…</div>
    </div>
  );

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="top-bar">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
            My Garage
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Good morning, {user.name?.split(' ')[0] || 'Driver'} 👋
          </h1>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Here's what's happening in your garage today.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <Bell size={20} />
          </button>
          <div className="avatar">{user.name?.[0]?.toUpperCase() || 'G'}</div>
        </div>
      </div>

      {/* ── Overdue alert ─────────────────────────────── */}
      {totalOverdue > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 16, borderRadius: 10,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)'
        }}>
          <AlertTriangle size={15} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
          <span style={{ color: 'var(--danger-color)', fontSize: '0.82rem', fontWeight: 600 }}>
            {totalOverdue} item{totalOverdue !== 1 ? 's' : ''} overdue across your garage
          </span>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────── */}
      {vehicles.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Link to="/add-vehicle" className="btn-orange" style={{ flex: 1, justifyContent: 'center' }}>
            <Plus size={16} /> Add Vehicle
          </Link>
          <Link to="/history" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            Update Odometer
          </Link>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────── */}
      {vehicles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-number">{vehicles.length}</div>
            <div className="stat-label">Vehicles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalModules}</div>
            <div className="stat-label">Services</div>
          </div>
          <div className="stat-card">
            <div
              className="stat-number"
              style={{ color: totalDueSoon > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}
            >
              {totalDueSoon}
            </div>
            <div className="stat-label">Due Soon</div>
          </div>
        </div>
      )}

      {/* ── Your Garage ───────────────────────────────── */}
      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏎️</div>
          <h5>Your garage is empty</h5>
          <p>Add your first vehicle to start tracking maintenance.</p>
          <Link to="/add-vehicle" className="btn-orange">
            <Plus size={16} /> Add Vehicle
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Your Garage
            </h2>
            <Link to="/vehicles" style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}

          <Link
            to="/add-vehicle"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px', borderRadius: 12, marginBottom: 24,
              border: '1.5px dashed var(--accent-border)',
              color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: 600,
              background: 'var(--accent-light)'
            }}
          >
            <Plus size={16} /> Add Another Vehicle
          </Link>

          {/* ── Next Up ─────────────────────────────── */}
          {nextUpItems.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Next Up
                </h2>
                <Link to="/history" style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              {nextUpItems.map(m => (
                <NextUpItem key={m.id} mod={m} vehicleName={m.vehicleName} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
