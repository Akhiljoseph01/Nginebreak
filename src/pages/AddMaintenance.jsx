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

  if (!vehicle) return <div className="app-container px-3 pt-4 text-muted">Vehicle not found.</div>;

  return (
    <div className="app-container px-3 pt-4">
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-link p-0 me-3" onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h5 className="mb-0" style={{ fontWeight: 700 }}>Add Maintenance</h5>
          <small className="text-muted">{vehicle.make} {vehicle.model}</small>
        </div>
      </div>

      {/* Preset chips */}
      <p className="text-muted small mb-2">Quick select or type custom:</p>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {PRESET_ITEMS.map(p => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className="btn btn-sm"
            style={{
              borderRadius: 20,
              fontSize: '0.75rem',
              padding: '0.25rem 0.75rem',
              background: selectedPreset === p ? 'var(--accent-color)' : 'rgba(255,255,255,0.07)',
              color: selectedPreset === p ? '#fff' : 'var(--text-primary)',
              border: 'none'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <form className="garage-card" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label small text-muted">Item Name <span className="text-danger">*</span></label>
          <input className="form-control" placeholder="e.g. Engine Oil" value={form.name}
            onChange={e => { set('name', e.target.value); setSelectedPreset(''); }} required />
        </div>

        <p className="text-muted small mb-2" style={{ fontWeight: 600 }}>Remind me every:</p>
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label small text-muted">Kilometres</label>
            <input type="number" className="form-control" placeholder="2500"
              value={form.interval_km} onChange={e => set('interval_km', e.target.value)} />
          </div>
          <div className="col-6">
            <label className="form-label small text-muted">Months</label>
            <input type="number" className="form-control" placeholder="6"
              value={form.interval_months} onChange={e => set('interval_months', e.target.value)} />
          </div>
        </div>

        <p className="text-muted small mb-2" style={{ fontWeight: 600 }}>Last serviced at:</p>
        <div className="row g-2 mb-4">
          <div className="col-6">
            <label className="form-label small text-muted">Odometer (km)</label>
            <input type="number" className="form-control" placeholder={vehicle.current_odometer}
              value={form.last_service_km} onChange={e => set('last_service_km', e.target.value)} />
          </div>
          <div className="col-6">
            <label className="form-label small text-muted">Date</label>
            <input type="date" className="form-control"
              value={form.last_service_date} onChange={e => set('last_service_date', e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary w-100" type="submit" disabled={saving}
          style={{ borderRadius: 12, fontWeight: 600, padding: '0.75rem' }}>
          {saving ? 'Saving…' : '+ Add to Schedule'}
        </button>
      </form>
    </div>
  );
}
