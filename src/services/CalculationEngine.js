import { addMonths, differenceInDays, parseISO } from 'date-fns';

export const STATUS = {
  OVERDUE: 'OVERDUE',
  DUE: 'DUE',
  DUE_SOON: 'DUE_SOON',
  UPCOMING: 'UPCOMING',
  COMPLETED: 'COMPLETED' // Used for historical records
};

const DUE_SOON_KM_THRESHOLD = 500;
const DUE_SOON_DAYS_THRESHOLD = 30;

/**
 * Calculates the maintenance status based on mileage and time.
 * @param {Object} module The maintenance module configuration
 * @param {number} currentOdometer The current vehicle odometer
 * @param {Date|string} currentDate The current date
 * @returns {Object} The calculation result including status and remaining values
 */
export const calculateMaintenanceStatus = (module, currentOdometer, currentDate = new Date()) => {
  if (!module.last_service_km && !module.last_service_date) {
    return {
      status: STATUS.UPCOMING,
      message: 'Never serviced',
      remaining_km: null,
      remaining_days: null
    };
  }

  let kmStatus = null;
  let timeStatus = null;
  let remainingKm = null;
  let remainingDays = null;
  let nextDueKm = null;
  let nextDueDate = null;

  // 1. Mileage Calculation
  if (module.interval_km && module.last_service_km) {
    nextDueKm = module.last_service_km + module.interval_km;
    remainingKm = nextDueKm - currentOdometer;

    if (remainingKm <= 0) {
      kmStatus = STATUS.OVERDUE;
    } else if (remainingKm <= DUE_SOON_KM_THRESHOLD) {
      kmStatus = STATUS.DUE_SOON;
    } else {
      kmStatus = STATUS.UPCOMING;
    }
  }

  // 2. Time Calculation
  if (module.interval_months && module.last_service_date) {
    const lastDate = typeof module.last_service_date === 'string' ? parseISO(module.last_service_date) : module.last_service_date;
    const currDate = typeof currentDate === 'string' ? parseISO(currentDate) : currentDate;
    
    nextDueDate = addMonths(lastDate, module.interval_months);
    remainingDays = differenceInDays(nextDueDate, currDate);

    if (remainingDays <= 0) {
      timeStatus = STATUS.OVERDUE;
    } else if (remainingDays <= DUE_SOON_DAYS_THRESHOLD) {
      timeStatus = STATUS.DUE_SOON;
    } else {
      timeStatus = STATUS.UPCOMING;
    }
  }

  // 3. Determine overall status ("Whichever comes first")
  let finalStatus = STATUS.UPCOMING;
  
  // If either is overdue, it's overdue
  if (kmStatus === STATUS.OVERDUE || timeStatus === STATUS.OVERDUE) {
    finalStatus = STATUS.OVERDUE;
  } 
  // Else if either is due soon, it's due soon
  else if (kmStatus === STATUS.DUE_SOON || timeStatus === STATUS.DUE_SOON) {
    finalStatus = STATUS.DUE_SOON;
  }

  return {
    status: finalStatus,
    remaining_km: remainingKm,
    remaining_days: remainingDays,
    next_due_km: nextDueKm,
    next_due_date: nextDueDate,
    km_status: kmStatus,
    time_status: timeStatus
  };
};

/**
 * Recalculates all maintenance modules for a vehicle given a new odometer reading
 */
export const recalculateVehicleMaintenance = (vehicles, vehicleId, newOdometer) => {
  // Pure logic to be used by the store/reducer
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return vehicles;

  const updatedModules = vehicle.maintenance_modules.map(mod => {
    const calc = calculateMaintenanceStatus(mod, newOdometer);
    return { ...mod, ...calc };
  });

  return vehicles.map(v => 
    v.id === vehicleId 
      ? { ...v, current_odometer: newOdometer, maintenance_modules: updatedModules }
      : v
  );
};
