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
    <div className="app-container px-3 pt-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-link p-0 me-3" onClick={() => navigate(-1)} style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={24} />
        </button>
        <h5 className="mb-0" style={{ fontWeight: 700 }}>Add Vehicle</h5>
      </div>

      {step === 1 && (
        <div>
          <p className="text-muted small mb-3">What type of vehicle?</p>
          <div className="row g-2 mb-4">
            {VEHICLE_TYPES.map(({ label, icon: Icon }) => (
              <div key={label} className="col-4">
                <button
                  onClick={() => { set('type', label); setStep(2); }}
                  className="w-100 garage-card d-flex flex-column align-items-center py-3 gap-2"
                  style={{
                    border: form.type === label ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer', background: 'var(--bg-card)', borderRadius: 16,
                    color: 'var(--text-primary)', marginBottom: 0
                  }}
                >
                  <Icon size={26} color="var(--accent-color)" />
                  <small style={{ fontSize: '0.75rem' }}>{label}</small>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-muted small mb-3">
            <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{form.type}</span> — basic info (that's it!)
          </p>

          <div className="garage-card">
            <div className="mb-3">
              <label className="form-label small text-muted">Make <span className="text-danger">*</span></label>
              <input
                className="form-control"
                placeholder="e.g. Honda"
                value={form.make}
                onChange={e => set('make', e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="form-label small text-muted">Model <span className="text-danger">*</span></label>
              <input
                className="form-control"
                placeholder="e.g. City"
                value={form.model}
                onChange={e => set('model', e.target.value)}
              />
            </div>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small text-muted">Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.year}
                  onChange={e => set('year', e.target.value)}
                  min={1980} max={new Date().getFullYear() + 1}
                />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted">Odometer (km) <span className="text-danger">*</span></label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="45000"
                  value={form.odometer}
                  onChange={e => set('odometer', e.target.value)}
                />
              </div>
            </div>
            <small className="text-muted d-block mb-3">You can add registration, VIN, and photos later in the vehicle profile.</small>
            <button
              className="btn btn-primary w-100"
              style={{ borderRadius: 12, fontWeight: 600, padding: '0.75rem' }}
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
