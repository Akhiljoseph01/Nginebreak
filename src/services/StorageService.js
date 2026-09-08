import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { recalculateVehicleMaintenance, calculateMaintenanceStatus } from './CalculationEngine';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

  // ==========================================
  // Get Data (Supabase with Local Cache Fallback)
  // ==========================================
  async getData() {
    await this.init();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: dbVehicles, error: vErr } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: true });

        if (vErr) throw vErr;

        if (dbVehicles) {
          const { data: dbModules } = await supabase
            .from('maintenance_modules')
            .select('*');

          const { data: dbHistory } = await supabase
            .from('service_history')
            .select('*')
            .order('date', { ascending: false });

          const assembledVehicles = dbVehicles.map(veh => {
            const rawModules = (dbModules || []).filter(m => m.vehicle_id === veh.id);
            const rawHistory = (dbHistory || []).filter(h => h.vehicle_id === veh.id);

            const modules = rawModules.map(mod => {
              const calc = calculateMaintenanceStatus(mod, veh.current_odometer);
              return { ...mod, ...calc };
            });

            return {
              ...veh,
              media: veh.media || [],
              maintenance_modules: modules,
              service_history: rawHistory
            };
          });

          const cloudData = {
            user: { name: 'Enthusiast' },
            vehicles: assembledVehicles
          };

          // Update local cache
          await localforage.setItem('garage_data', cloudData);
          return cloudData;
        }
      } catch (err) {
        console.warn('[StorageService] Supabase sync failed, falling back to local cache:', err.message);
      }
    }

    // Fallback: Local Storage
    return (await localforage.getItem('garage_data')) || DEFAULT_DATA;
  }

  async saveData(data) {
    await localforage.setItem('garage_data', data);
  }

  // ==========================================
  // Add Vehicle
  // ==========================================
  async addVehicle(vehicleParams) {
    const newVehicleId = uuidv4();
    const newVehicle = {
      id: newVehicleId,
      type: vehicleParams.type || 'Car',
      make: vehicleParams.make,
      model: vehicleParams.model,
      year: parseInt(vehicleParams.year),
      current_odometer: parseInt(vehicleParams.odometer) || 0,
      maintenance_modules: [],
      service_history: [],
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('vehicles').insert([{
          id: newVehicle.id,
          type: newVehicle.type,
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          current_odometer: newVehicle.current_odometer
        }]);
        if (error) console.error('[StorageService] Supabase insert error:', error.message);
      } catch (err) {
        console.error('[StorageService] Supabase vehicle insert failed:', err.message);
      }
    }

    // Always update local cache
    const data = await this.getData();
    data.vehicles.push(newVehicle);
    await this.saveData(data);
    return newVehicle;
  }

  // ==========================================
  // Add Maintenance Module
  // ==========================================
  async addMaintenanceModule(vehicleId, moduleParams) {
    const moduleId = uuidv4();
    const newModule = {
      id: moduleId,
      vehicle_id: vehicleId,
      name: moduleParams.name,
      interval_km: moduleParams.interval_km ? parseInt(moduleParams.interval_km) : null,
      interval_months: moduleParams.interval_months ? parseInt(moduleParams.interval_months) : null,
      last_service_km: moduleParams.last_service_km ? parseInt(moduleParams.last_service_km) : null,
      last_service_date: moduleParams.last_service_date || null,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('maintenance_modules').insert([newModule]);
        if (error) console.error('[StorageService] Supabase module insert error:', error.message);
      } catch (err) {
        console.error('[StorageService] Supabase module insert failed:', err.message);
      }
    }

    const data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const calc = calculateMaintenanceStatus(newModule, vehicle.current_odometer);
    Object.assign(newModule, calc);

    // Prevent duplicate push if cloud fetch already populated it
    if (!vehicle.maintenance_modules.some(m => m.id === moduleId)) {
      vehicle.maintenance_modules.push(newModule);
    }
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Update Odometer
  // ==========================================
  async updateOdometer(vehicleId, newOdometer) {
    const odo = parseInt(newOdometer);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .update({ current_odometer: odo, updated_at: new Date().toISOString() })
          .eq('id', vehicleId);
        if (error) console.error('[StorageService] Supabase update odometer error:', error.message);
      } catch (err) {
        console.error('[StorageService] Supabase update odometer failed:', err.message);
      }
    }

    let data = await this.getData();
    data.vehicles = recalculateVehicleMaintenance(data.vehicles, vehicleId, odo);
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Complete Service
  // ==========================================
  async completeService(vehicleId, moduleId, currentOdometer, dateStr) {
    const odo = parseInt(currentOdometer);
    const historyId = uuidv4();

    let data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const mod = vehicle.maintenance_modules.find(m => m.id === moduleId);
    if (!mod) throw new Error('Module not found');

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Insert service history
        await supabase.from('service_history').insert([{
          id: historyId,
          vehicle_id: vehicleId,
          module_id: moduleId,
          module_name: mod.name,
          odometer: odo,
          date: dateStr
        }]);

        // 2. Update module last serviced info
        await supabase
          .from('maintenance_modules')
          .update({
            last_service_km: odo,
            last_service_date: dateStr
          })
          .eq('id', moduleId);
      } catch (err) {
        console.error('[StorageService] Supabase completeService failed:', err.message);
      }
    }

    // Add to history in local cache
    vehicle.service_history.push({
      id: historyId,
      module_id: moduleId,
      module_name: mod.name,
      odometer: odo,
      date: dateStr,
      created_at: new Date().toISOString()
    });

    mod.last_service_km = odo;
    mod.last_service_date = dateStr;

    data.vehicles = recalculateVehicleMaintenance(data.vehicles, vehicleId, vehicle.current_odometer);
    await this.saveData(data);
    return data;
  }

  // ==========================================
  // Vehicle Media (Photos & Invoices)
  // ==========================================
  async addVehicleMedia(vehicleId, mediaItem) {
    const data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    if (!vehicle.media) vehicle.media = [];
    vehicle.media.push(mediaItem);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('vehicles')
          .update({ media: vehicle.media, updated_at: new Date().toISOString() })
          .eq('id', vehicleId);
      } catch (err) {
        console.error('[StorageService] Supabase media update error:', err.message);
      }
    }

    await this.saveData(data);
    return data;
  }

  async removeVehicleMedia(vehicleId, mediaId) {
    const data = await this.getData();
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    vehicle.media = (vehicle.media || []).filter(m => m.id !== mediaId);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('vehicles')
          .update({ media: vehicle.media, updated_at: new Date().toISOString() })
          .eq('id', vehicleId);
      } catch (err) {
        console.error('[StorageService] Supabase media remove error:', err.message);
      }
    }

    await this.saveData(data);
    return data;
  }
}

export default new StorageService();
