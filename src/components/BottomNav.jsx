import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Car, PlusCircle, Clock, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`} end>
        <Home size={22} />
        <span>Garage</span>
      </NavLink>
      <NavLink to="/vehicles" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
        <Car size={22} />
        <span>Vehicles</span>
      </NavLink>
      <NavLink to="/add-vehicle" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
        <PlusCircle size={22} />
        <span>Add</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
        <Clock size={22} />
        <span>History</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
