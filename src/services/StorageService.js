import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { recalculateVehicleMaintenance, calculateMaintenanceStatus } from './CalculationEngine';

localforage.config({
  name: 'DigitalGarage',
  version: 1.0,
  storeName: 'garage_data'
});

const DEFAULT_DATA = {
  user: { name: 'Enthusiast' },
  vehicles: []
};

class StorageService {
  async init() {
    const data = await localforage.getItem('garage_data');
    if (!data) {
      await localforage.setItem('garage_data', DEFAULT_DATA);
    }
  }

  async getData() {
    await this.init();
    return await localforage.getItem('garage_data');
  }

  async saveData(data) {
    await localforage.setItem('garage_data', data);
  }

  async addVehicle(vehicleParams) {
    const data = await this.getData();
    const newVehicle = {
      id: uuidv4(),
      type: vehicleParams.type || 'Car',
      make: vehicleParams.make,
      model: vehicleParams.model,
      year: vehicleParams.year,
      current_odometer: parseInt(vehicleParams.odometer),
      maintenance_modules: [],
      service_history: [],
      created_at: new Date().toISOString()
    };
    
    data.vehicles.push(newVehicle);
    await this.saveData(data);
    return newVehicle;
  }

  async addMaintenanceModule(vehicleId, moduleParams) {
    const data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const newModule = {
      id: uuidv4(),
      name: moduleParams.name,
      interval_km: moduleParams.interval_km ? parseInt(moduleParams.interval_km) : null,
      interval_months: moduleParams.interval_months ? parseInt(moduleParams.interval_months) : null,
      last_service_km: moduleParams.last_service_km ? parseInt(moduleParams.last_service_km) : null,
      last_service_date: moduleParams.last_service_date || null,
      created_at: new Date().toISOString()
    };

    // Calculate initial status
    const calc = calculateMaintenanceStatus(newModule, vehicle.current_odometer);
    Object.assign(newModule, calc);

    vehicle.maintenance_modules.push(newModule);
    await this.saveData(data);
    return data;
  }

  async updateOdometer(vehicleId, newOdometer) {
    let data = await this.getData();
    data.vehicles = recalculateVehicleMaintenance(data.vehicles, vehicleId, parseInt(newOdometer));
    await this.saveData(data);
    return data;
  }

  async completeService(vehicleId, moduleId, currentOdometer, dateStr) {
    const data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const mod = vehicle.maintenance_modules.find(m => m.id === moduleId);
    if (!mod) throw new Error('Module not found');

    // Add to history
    vehicle.service_history.push({
      id: uuidv4(),
      module_id: moduleId,
      module_name: mod.name,
      odometer: parseInt(currentOdometer),
      date: dateStr,
      created_at: new Date().toISOString()
    });

    // Update module's last service info
    mod.last_service_km = parseInt(currentOdometer);
    mod.last_service_date = dateStr;

    // Recalculate
    data.vehicles = recalculateVehicleMaintenance(data.vehicles, vehicleId, vehicle.current_odometer);
    await this.saveData(data);
    return data;
  }
}

export default new StorageService();
