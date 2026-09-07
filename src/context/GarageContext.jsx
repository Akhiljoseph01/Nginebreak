import React, { createContext, useContext, useReducer, useEffect } from 'react';
import StorageService from '../services/StorageService';

const GarageContext = createContext();

const initialState = {
  vehicles: [],
  user: { name: 'Enthusiast' },
  loading: true,
  activeVehicleId: null
};

function garageReducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, vehicles: action.data.vehicles, user: action.data.user, loading: false };
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.vehicles };
    case 'SET_ACTIVE_VEHICLE':
      return { ...state, activeVehicleId: action.id };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    default:
      return state;
  }
}

export function GarageProvider({ children }) {
  const [state, dispatch] = useReducer(garageReducer, initialState);

  useEffect(() => {
    (async () => {
      const data = await StorageService.getData();
      dispatch({ type: 'LOAD_DATA', data });
    })();
  }, []);

  const addVehicle = async (params) => {
    await StorageService.addVehicle(params);
    const data = await StorageService.getData();
    dispatch({ type: 'LOAD_DATA', data });
    return data.vehicles[data.vehicles.length - 1];
  };

  const addMaintenanceModule = async (vehicleId, params) => {
    const data = await StorageService.addMaintenanceModule(vehicleId, params);
    dispatch({ type: 'SET_VEHICLES', vehicles: data.vehicles });
  };

  const updateOdometer = async (vehicleId, newOdometer) => {
    const data = await StorageService.updateOdometer(vehicleId, newOdometer);
    dispatch({ type: 'SET_VEHICLES', vehicles: data.vehicles });
  };

  const completeService = async (vehicleId, moduleId, odometer, date) => {
    const data = await StorageService.completeService(vehicleId, moduleId, odometer, date);
    dispatch({ type: 'SET_VEHICLES', vehicles: data.vehicles });
  };

  const setActiveVehicle = (id) => dispatch({ type: 'SET_ACTIVE_VEHICLE', id });

  return (
    <GarageContext.Provider value={{ ...state, addVehicle, addMaintenanceModule, updateOdometer, completeService, setActiveVehicle }}>
      {children}
    </GarageContext.Provider>
  );
}

export const useGarage = () => useContext(GarageContext);
