import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GarageProvider } from './context/GarageContext';
import BottomNav from './components/BottomNav';
import GarageDashboard from './pages/GarageDashboard';
import Vehicles from './pages/Vehicles';
import AddVehicle from './pages/AddVehicle';
import VehicleProfile from './pages/VehicleProfile';
import AddMaintenance from './pages/AddMaintenance';
import ServiceHistory from './pages/ServiceHistory';
import Profile from './pages/Profile';

export default function App() {
  return (
    <GarageProvider>
      <BrowserRouter>
        <div className="nav-layout">
          {/* Sidebar (desktop) + Bottom nav (mobile) */}
          <BottomNav />

          {/* Main content */}
          <div className="main-content">
            <Routes>
              <Route path="/"                                element={<GarageDashboard />} />
              <Route path="/vehicles"                        element={<Vehicles />} />
              <Route path="/add-vehicle"                     element={<AddVehicle />} />
              <Route path="/vehicle/:id"                     element={<VehicleProfile />} />
              <Route path="/vehicle/:vehicleId/add-maintenance" element={<AddMaintenance />} />
              <Route path="/history"                         element={<ServiceHistory />} />
              <Route path="/profile"                         element={<Profile />} />
              <Route path="*"                                element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </GarageProvider>
  );
}
