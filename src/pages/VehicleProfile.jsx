import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import MaintenanceCard from '../components/MaintenanceCard';
import { STATUS } from '../services/CalculationEngine';
import { ChevronLeft, Plus, Gauge, Edit3, UploadCloud, Image as ImageIcon, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { uploadVehiclePhoto, formatBytes } from '../utils/imageOptimizer';

function getVehicleIcon(type) {
  const map = { Motorcycle: '🏍️', Scooter: '🛵', EV: '⚡', Bus: '🚌', Truck: '🚛', Van: '🚐', SUV: '🚙' };
  return map[type] || '🚗';
}

const TABS = ['Overview', 'Maintenance', 'History', 'Build', 'Media'];

const CATEGORIES = [
  { label: 'Engine',     emoji: '⚙️' },
  { label: 'Fluids',     emoji: '🛢️' },
  { label: 'Filters',    emoji: '🔲' },
  { label: 'Brakes',     emoji: '🛑' },
  { label: 'Tyres',      emoji: '🛞' },
  { label: 'Electrical', emoji: '⚡' },
  { label: 'Exterior',   emoji: '🚗' },
  { label: 'General',    emoji: '🔧' },
  { label: 'Custom',     emoji: '⭐' },
];

export default function VehicleProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, updateOdometer, addVehicleMedia, removeVehicleMedia } = useGarage();
  const vehicle = vehicles.find(v => v.id === id);

  const [activeTab, setActiveTab] = useState('Overview');
  const [showOdoUpdate, setShowOdoUpdate] = useState(false);
  const [newOdo, setNewOdo] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = React.useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadSuccess(null);
      const result = await uploadVehiclePhoto(file, id);

      const mediaItem = {
        id: (Date.now() + Math.random()).toString(),
        url: result.url,
        name: file.name.replace(/\.[^/.]+$/, ''),
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        savedPercent: result.savedPercent,
        created_at: new Date().toISOString()
      };

      await addVehicleMedia(id, mediaItem);
      setUploadSuccess(`Optimized! ${formatBytes(result.originalSize)} ➔ ${formatBytes(result.optimizedSize)} (${result.savedPercent}% space saved)`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!vehicle) return (
    <div className="app-container" style={{ paddingTop: 40 }}>
      <p style={{ color: 'var(--text-muted)' }}>Vehicle not found.</p>
    </div>
  );

  const mods     = vehicle.maintenance_modules || [];
  const overdue  = mods.filter(m => m.status === STATUS.OVERDUE);
  const dueSoon  = mods.filter(m => m.status === STATUS.DUE_SOON);
  const upcoming = mods.filter(m => m.status === STATUS.UPCOMING);

  // Health score: percentage of items NOT overdue
  const healthScore = mods.length > 0
    ? Math.round(((mods.length - overdue.length) / mods.length) * 100)
    : 100;

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
    <div className="app-container" style={{ paddingTop: 0 }}>

      {/* ── Breadcrumb + back ──────────────────────────── */}
      <div style={{ paddingTop: 16, marginBottom: 12 }}>
        <div className="breadcrumb-nav">
          <Link to="/vehicles">Vehicles</Link>
          <span className="sep">›</span>
          <span className="current">{vehicle.make} {vehicle.model}</span>
        </div>
      </div>

      {/* ── Vehicle header card ────────────────────────── */}
      <div className="garage-card" style={{ padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {vehicle.make} {vehicle.model}
            </h1>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="verified-badge">Verified Vehicle</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              {vehicle.year} · {vehicle.type} · {vehicle.current_odometer.toLocaleString()} km
            </div>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            onClick={() => setShowOdoUpdate(s => !s)}
          >
            <Edit3 size={14} /> Edit Vehicle
          </button>
        </div>

        {/* Odometer update form */}
        {showOdoUpdate && (
          <form onSubmit={handleOdoUpdate} style={{
            marginTop: 14, paddingTop: 14,
            borderTop: '1px solid var(--border-color)',
            display: 'flex', gap: 10, alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ marginBottom: 4, display: 'block', fontSize: '0.75rem' }}>
                New odometer reading (km)
              </label>
              <input
                type="number"
                className="form-control"
                placeholder={`Current: ${vehicle.current_odometer.toLocaleString()} km`}
                value={newOdo}
                onChange={e => setNewOdo(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" disabled={saving} className="btn-orange" style={{ whiteSpace: 'nowrap' }}>
              {saving ? '…' : 'Update'}
            </button>
          </form>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-item${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview tab ───────────────────────────────── */}
      {activeTab === 'Overview' && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-number" style={{ color: 'var(--accent-color)' }}>{healthScore}%</div>
              <div className="stat-label">Maintenance Health</div>
            </div>
            <div className="stat-card">
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                {overdue.length > 0 ? overdue[0].name : dueSoon.length > 0 ? dueSoon[0].name : '—'}
              </div>
              <div className="stat-label">Next Maintenance</div>
            </div>
            <div className="stat-card">
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                {(vehicle.service_history || []).length > 0
                  ? `${vehicle.service_history.length} records`
                  : '—'
                }
              </div>
              <div className="stat-label">Last Service</div>
            </div>
          </div>

          {/* Category chips */}
          <div className="section-label">Categories</div>
          <div className="category-grid" style={{ marginBottom: 24 }}>
            {CATEGORIES.map(c => (
              <div key={c.label} className="category-chip">
                <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                {c.label}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Maintenance tab (or shown within overview) ─── */}
      {(activeTab === 'Overview' || activeTab === 'Maintenance') && (
        <>
          {mods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <h5>No maintenance scheduled yet</h5>
              <p>Add your first service item to start tracking.</p>
              <Link to={`/vehicle/${id}/add-maintenance`} className="btn-orange">
                Add First Service Item
              </Link>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className="status-dot status-danger" />
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--danger-color)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Overdue ({overdue.length})
                    </span>
                  </div>
                  {overdue.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
                </>
              )}
              {dueSoon.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: overdue.length > 0 ? 16 : 0 }}>
                    <span className="status-dot status-warning" />
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--warning-color)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Due Soon ({dueSoon.length})
                    </span>
                  </div>
                  {dueSoon.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
                </>
              )}
              {upcoming.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: (overdue.length > 0 || dueSoon.length > 0) ? 16 : 0 }}>
                    <span className="status-dot status-success" />
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--success-color)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      All Good ({upcoming.length})
                    </span>
                  </div>
                  {upcoming.map(m => <MaintenanceCard key={m.id} mod={m} vehicleId={id} currentOdometer={vehicle.current_odometer} />)}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── History tab ────────────────────────────────── */}
      {activeTab === 'History' && (
        <div>
          {(vehicle.service_history || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h5>No service records</h5>
              <p>Complete a maintenance item to start your history.</p>
            </div>
          ) : (
            vehicle.service_history.map(h => (
              <div key={h.id} className="maint-item">
                <div className="maint-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{h.module_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.date || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-color)' }}>
                    {h.odometer.toLocaleString()} km
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Media tab ──────────────────────────────────── */}
      {activeTab === 'Media' && (
        <div>
          {/* Space Saving Info Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.05) 0%, rgba(255, 77, 0, 0.02) 100%)',
            border: '1px solid rgba(255, 77, 0, 0.18)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              background: 'var(--accent-color)',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Space-Saving Mode Active
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-color)', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                  Lossless 1920px WebP
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                Photos are automatically processed on your device into high-resolution WebP format. Visual quality remains 100% sharp and crisp while cutting storage weight by ~95%.
              </div>
            </div>
          </div>

          {/* Upload Button & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Vehicle Gallery & Documents
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {(vehicle.media || []).length} items uploaded
              </span>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <button
                className="btn-orange"
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={16} />
                {uploading ? 'Optimizing & Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>

          {/* Upload success notification */}
          {uploadSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#065f46',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} color="var(--success-color)" />
              {uploadSuccess}
            </div>
          )}

          {/* Photos Grid */}
          {(vehicle.media || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 20px' }}>
              <div className="empty-icon">📷</div>
              <h5>No photos added yet</h5>
              <p>Upload vehicle pictures, receipts, or inspection photos. They will be stored in crisp, space-saving format.</p>
              <button
                className="btn-orange"
                style={{ marginTop: 10 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload First Photo
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16
            }}>
              {(vehicle.media || []).map(m => (
                <div key={m.id} className="garage-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={m.url}
                    alt={m.name || 'Vehicle photo'}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    loading="lazy"
                  />
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name || 'Vehicle Photo'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)', fontWeight: 700, background: 'rgba(255, 77, 0, 0.08)', padding: '2px 6px', borderRadius: 4 }}>
                        {m.optimizedSize ? formatBytes(m.optimizedSize) : 'Optimized'} {m.savedPercent ? `(${m.savedPercent}% saved)` : ''}
                      </span>
                      <button
                        onClick={() => removeVehicleMedia(id, m.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 4
                        }}
                        title="Delete photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Build tab placeholder ────────────── */}
      {activeTab === 'Build' && (
        <div className="empty-state">
          <div className="empty-icon">🛠️</div>
          <h5>Build coming soon</h5>
          <p>This feature will be available in a future update.</p>
        </div>
      )}

      {/* ── FAB ────────────────────────────────────────── */}
      <Link
        to={`/vehicle/${id}/add-maintenance`}
        className="btn-orange"
        style={{
          position: 'fixed', bottom: 80, right: 20,
          borderRadius: 50, padding: '12px 18px',
          boxShadow: '0 4px 20px rgba(255,77,0,0.35)',
          zIndex: 999, fontSize: '0.85rem'
        }}
      >
        <Plus size={16} /> Add Service
      </Link>
    </div>
  );
}
