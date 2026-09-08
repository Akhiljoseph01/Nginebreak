import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { ChevronLeft } from 'lucide-react';

const PRESET_ITEMS = [
  'Engine Oil', 'Oil Filter', 'Air Filter', 'Cabin Filter', 'Brake Inspection',
  'Brake Fluid', 'Coolant', 'Spark Plug', 'Chain Lubrication', 'Chain Replacement',
  'Tyre Pressure', 'Tyre Rotation', 'Wheel Alignment', 'Battery Check',
  'Wiper Blade', 'General Service', 'Car Wash', 'PUC', 'Insurance', 'Registration'
];

export default function AddMaintenance() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { addMaintenanceModule, vehicles } = useGarage();
  const vehicle = vehicles.find(v => v.id === vehicleId);

  const [form, setForm] = useState({
    name: '',
    interval_km: '',
    interval_months: '',
    last_service_km: vehicle?.current_odometer || '',
    last_service_date: new Date().toISOString().slice(0, 10)
  });
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreset = (name) => {
    setSelectedPreset(name);
    set('name', name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (!form.interval_km && !form.interval_months) {
      alert('Please set at least one interval (km or months).');
      return;
    }
    setSaving(true);
    await addMaintenanceModule(vehicleId, form);
    setSaving(false);
    navigate(`/vehicle/${vehicleId}`);
  };

  if (!vehicle) return (
    <div className="app-container" style={{ paddingTop: 40 }}>
      <p style={{ color: 'var(--text-muted)' }}>Vehicle not found.</p>
    </div>
  );

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.3rem' }}>Add Maintenance</h1>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {vehicle.make} {vehicle.model}
            </div>
          </div>
        </div>
      </div>

      {/* Preset chips */}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 10 }}>
        Quick select or type custom:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {PRESET_ITEMS.map(p => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={`chip${selectedPreset === p ? ' active' : ''}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Form */}
      <form className="garage-card" style={{ padding: '20px' }} onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
            Item Name <span style={{ color: 'var(--danger-color)' }}>*</span>
          </label>
          <input
            className="form-control"
            placeholder="e.g. Engine Oil"
            value={form.name}
            onChange={e => { set('name', e.target.value); setSelectedPreset(''); }}
            required
          />
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 10 }}>
          Remind me every:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Kilometres</label>
            <input
              type="number" className="form-control" placeholder="2500"
              value={form.interval_km} onChange={e => set('interval_km', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Months</label>
            <input
              type="number" className="form-control" placeholder="6"
              value={form.interval_months} onChange={e => set('interval_months', e.target.value)}
            />
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, marginBottom: 10 }}>
          Last serviced at:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Odometer (km)</label>
            <input
              type="number" className="form-control" placeholder={vehicle.current_odometer}
              value={form.last_service_km} onChange={e => set('last_service_km', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Date</label>
            <input
              type="date" className="form-control"
              value={form.last_service_date} onChange={e => set('last_service_date', e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-orange"
          type="submit"
          disabled={saving}
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          {saving ? 'Saving…' : '+ Add to Schedule'}
        </button>
      </form>
    </div>
  );
}
