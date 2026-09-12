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

/**
 * Calculates remaining part life percentage (0% to 100%)
 */
export const calculatePartLifePercent = (module, currentOdometer) => {
  if (!module) return 100;
  
  // If overdue, life is 0%
  if (module.status === STATUS.OVERDUE || (module.remaining_km !== null && module.remaining_km <= 0) || (module.remaining_days !== null && module.remaining_days <= 0)) {
    return 0;
  }

  let kmLife = null;
  let timeLife = null;

  if (module.interval_km && module.remaining_km !== null) {
    kmLife = Math.max(0, Math.min(100, Math.round((module.remaining_km / module.interval_km) * 100)));
  }

  if (module.interval_months && module.remaining_days !== null) {
    const totalDays = module.interval_months * 30.4375;
    timeLife = Math.max(0, Math.min(100, Math.round((module.remaining_days / totalDays) * 100)));
  }

  if (kmLife !== null && timeLife !== null) {
    return Math.min(kmLife, timeLife);
  }
  if (kmLife !== null) return kmLife;
  if (timeLife !== null) return timeLife;

  return 100;
};

/**
 * Compares KM vs Time expiry to determine which expires first
 */
export const getDualPillComparison = (module, currentOdometer) => {
  if (!module) return null;

  const hasKm = Boolean(module.interval_km && module.remaining_km !== null);
  const hasTime = Boolean(module.interval_months && module.remaining_days !== null);

  let expiresFirst = 'none';
  let explanation = '';

  if (hasKm && hasTime) {
    const kmPercent = module.interval_km > 0 ? (module.remaining_km / module.interval_km) : 1;
    const totalDays = module.interval_months * 30.4375;
    const timePercent = totalDays > 0 ? (module.remaining_days / totalDays) : 1;

    if (module.remaining_km <= 0 && module.remaining_days <= 0) {
      expiresFirst = 'both';
      explanation = `Both distance (${Math.abs(module.remaining_km).toLocaleString()} km) and time (${Math.abs(module.remaining_days)} days) limits are overdue.`;
    } else if (timePercent < kmPercent) {
      expiresFirst = 'time';
      if (module.remaining_km > 0 && module.remaining_days > 0) {
        explanation = `Even though you have ${module.remaining_km.toLocaleString()} km left, the ${module.interval_months}-month time interval is expiring in ${module.remaining_days} days.`;
      } else if (module.remaining_days <= 0) {
        explanation = `Time interval expired ${Math.abs(module.remaining_days)} days ago, even with ${module.remaining_km.toLocaleString()} km remaining.`;
      }
    } else {
      expiresFirst = 'km';
      if (module.remaining_km > 0 && module.remaining_days > 0) {
        explanation = `You have ${module.remaining_days} days left, but the distance limit will be reached first in ${module.remaining_km.toLocaleString()} km.`;
      } else if (module.remaining_km <= 0) {
        explanation = `Distance limit was reached ${Math.abs(module.remaining_km).toLocaleString()} km ago, even with ${module.remaining_days} days remaining.`;
      }
    }
  } else if (hasKm) {
    expiresFirst = 'km';
    explanation = module.remaining_km <= 0 
      ? `Distance limit is overdue by ${Math.abs(module.remaining_km).toLocaleString()} km.`
      : `${module.remaining_km.toLocaleString()} km remaining until next service.`;
  } else if (hasTime) {
    expiresFirst = 'time';
    explanation = module.remaining_days <= 0 
      ? `Time limit is overdue by ${Math.abs(module.remaining_days)} days.`
      : `${module.remaining_days} days remaining until next service.`;
  }

  return {
    expiresFirst,
    explanation,
    hasKm,
    hasTime,
    remainingKm: module.remaining_km,
    remainingDays: module.remaining_days,
    lifePercent: calculatePartLifePercent(module, currentOdometer)
  };
};

/**
 * Categorizes a maintenance item name into standard buckets
 */
export const getPartCategory = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('oil') || lower.includes('coolant') || lower.includes('fluid') || lower.includes('transmission') || lower.includes('steering')) {
    return 'Fluids';
  }
  if (lower.includes('filter') || lower.includes('air') || lower.includes('cabin') || lower.includes('fuel filter')) {
    return 'Filters';
  }
  if (lower.includes('brake') || lower.includes('pad') || lower.includes('rotor') || lower.includes('disc') || lower.includes('shoe')) {
    return 'Brakes';
  }
  if (lower.includes('spark') || lower.includes('plug') || lower.includes('belt') || lower.includes('chain') || lower.includes('engine') || lower.includes('valve') || lower.includes('battery')) {
    return 'Engine';
  }
  return 'General';
};

/**
 * Generates natural human language summary for the vehicle
 */
export const getVehicleSummary = (vehicle) => {
  if (!vehicle) return { type: 'healthy', text: 'No vehicle data available.' };

  const mods = vehicle.maintenance_modules || [];
  if (mods.length === 0) {
    return {
      type: 'healthy',
      text: 'All systems are healthy. No active maintenance scheduled yet.'
    };
  }

  const overdueMods = mods.filter(m => m.status === STATUS.OVERDUE);
  if (overdueMods.length > 0) {
    const first = overdueMods[0];
    const reason = first.remaining_km !== null && first.remaining_km <= 0 
      ? `${Math.abs(first.remaining_km).toLocaleString()} km past due` 
      : `${Math.abs(first.remaining_days || 0)} days past due`;
    return {
      type: 'overdue',
      text: `Immediate attention needed: ${first.name} is overdue (${reason}).`,
      highlightPart: first.name
    };
  }

  const dueSoonMods = mods.filter(m => m.status === STATUS.DUE_SOON);
  if (dueSoonMods.length > 0) {
    const first = dueSoonMods[0];
    let timing = '';
    if (first.remaining_km !== null && first.remaining_km > 0) {
      timing = `in approx. ${first.remaining_km.toLocaleString()} km`;
    }
    if (first.remaining_days !== null && first.remaining_days > 0) {
      timing = timing ? `${timing} or ${first.remaining_days} days` : `in approx. ${first.remaining_days} days`;
    }
    return {
      type: 'due_soon',
      text: `Service due soon: ${first.name} ${timing || 'shortly'}.`,
      highlightPart: first.name
    };
  }

  // Find the closest upcoming module
  const sorted = [...mods].sort((a, b) => {
    const lifeA = calculatePartLifePercent(a, vehicle.current_odometer);
    const lifeB = calculatePartLifePercent(b, vehicle.current_odometer);
    return lifeA - lifeB;
  });

  const nextMod = sorted[0];
  let timing = '';
  if (nextMod?.remaining_km !== null && nextMod?.remaining_km > 0) {
    timing = `in approx. ${nextMod.remaining_km.toLocaleString()} km`;
  }
  if (nextMod?.remaining_days !== null && nextMod?.remaining_days > 0) {
    timing = timing ? `${timing} or ${nextMod.remaining_days} days` : `in approx. ${nextMod.remaining_days} days`;
  }

  return {
    type: 'healthy',
    text: nextMod 
      ? `All systems are healthy. Your next service is ${nextMod.name} ${timing}.` 
      : 'All systems are healthy.',
    highlightPart: nextMod?.name
  };
};

/**
 * Calculates fitness dial score (0-100%) and breakdown counters
 */
export const getVehicleFitnessStats = (vehicle) => {
  if (!vehicle) {
    return {
      score: 100,
      conditionLabel: 'Great Condition',
      healthyCount: 0,
      dueSoonCount: 0,
      overdueCount: 0,
      totalCount: 0,
      nextAction: 'All parts in top shape.'
    };
  }

  const mods = vehicle.maintenance_modules || [];
  if (mods.length === 0) {
    return {
      score: 100,
      conditionLabel: 'Great Condition',
      healthyCount: 0,
      dueSoonCount: 0,
      overdueCount: 0,
      totalCount: 0,
      nextAction: 'Add maintenance schedules to track vehicle health.'
    };
  }

  const overdue = mods.filter(m => m.status === STATUS.OVERDUE);
  const dueSoon = mods.filter(m => m.status === STATUS.DUE_SOON);
  const healthy = mods.filter(m => m.status === STATUS.UPCOMING || (!m.status && m.remaining_km > 500));

  // Weighted score calculation: Overdue loses 100%, Due Soon loses 50%
  const total = mods.length;
  const healthRatio = (healthy.length + (dueSoon.length * 0.5)) / total;
  const score = Math.max(0, Math.min(100, Math.round(healthRatio * 100)));

  let conditionLabel = 'Great Condition';
  if (score < 50 || overdue.length > 0) {
    conditionLabel = 'Attention Needed';
  } else if (score < 80 || dueSoon.length > 0) {
    conditionLabel = 'Service Due Soon';
  }

  let nextAction = 'All parts in top shape.';
  if (overdue.length > 0) {
    const first = overdue[0];
    const diff = first.remaining_km !== null ? `${Math.abs(first.remaining_km).toLocaleString()} km overdue` : `${Math.abs(first.remaining_days)} days overdue`;
    nextAction = `Immediate: ${first.name} is ${diff}.`;
  } else if (dueSoon.length > 0) {
    const first = dueSoon[0];
    const timing = first.remaining_km ? `${first.remaining_km.toLocaleString()} km` : `${first.remaining_days} days`;
    nextAction = `Next action: ${first.name} in ${timing}.`;
  } else if (mods.length > 0) {
    const sorted = [...mods].sort((a, b) => (a.remaining_km || 999999) - (b.remaining_km || 999999));
    const nextMod = sorted[0];
    const timing = nextMod.remaining_km ? `${nextMod.remaining_km.toLocaleString()} km` : `${nextMod.remaining_days} days`;
    nextAction = `Next action: ${nextMod.name} in ${timing}.`;
  }

  return {
    score,
    conditionLabel,
    healthyCount: healthy.length,
    dueSoonCount: dueSoon.length,
    overdueCount: overdue.length,
    totalCount: total,
    nextAction
  };
};
