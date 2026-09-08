import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { Car, Bike, Truck, Bus, Zap, HelpCircle, ChevronLeft } from 'lucide-react';

const VEHICLE_TYPES = [
  { label: 'Car',        icon: Car },
  { label: 'Motorcycle', icon: Bike },
  { label: 'Scooter',    icon: Bike },
  { label: 'SUV',        icon: Car },
  { label: 'Van',        icon: Truck },
  { label: 'Bus',        icon: Bus },
  { label: 'Truck',      icon: Truck },
  { label: 'EV',         icon: Zap },
  { label: 'Other',      icon: HelpCircle },
];

export default function AddVehicle() {
  const navigate = useNavigate();
  const { addVehicle, setActiveVehicle } = useGarage();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'Car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    odometer: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.odometer) return;
    setSaving(true);
    const vehicle = await addVehicle(form);
    setActiveVehicle(vehicle.id);
    setSaving(false);
    navigate(`/vehicle/${vehicle.id}`);
  };

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
          <h1 className="page-title" style={{ fontSize: '1.3rem' }}>Add Vehicle</h1>
        </div>
      </div>

      {step === 1 && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
            What type of vehicle?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {VEHICLE_TYPES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { set('type', label); setStep(2); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 8px', borderRadius: 12, cursor: 'pointer',
                  background: form.type === label ? 'var(--accent-light)' : 'var(--bg-card)',
                  border: form.type === label ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
                  color: 'var(--text-primary)', transition: 'all 0.15s ease'
                }}
              >
                <Icon size={24} color={form.type === label ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{form.type}</span> — basic info
          </p>

          <div className="garage-card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                Make <span style={{ color: 'var(--danger-color)' }}>*</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g. Honda"
                value={form.make}
                onChange={e => set('make', e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                Model <span style={{ color: 'var(--danger-color)' }}>*</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g. City"
                value={form.model}
                onChange={e => set('model', e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.year}
                  onChange={e => set('year', e.target.value)}
                  min={1980} max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                  Odometer (km) <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="45000"
                  value={form.odometer}
                  onChange={e => set('odometer', e.target.value)}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              You can add registration, VIN, and photos later in the vehicle profile.
            </p>
            <button
              className="btn-orange"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={handleSubmit}
              disabled={saving || !form.make || !form.model || !form.odometer}
            >
              {saving ? 'Adding…' : '🚗 Add to Garage'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
