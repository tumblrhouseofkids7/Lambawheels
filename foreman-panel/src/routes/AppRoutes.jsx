import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import ForemanLayout from '../layouts/ForemanLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import StartShift from '../pages/StartShift';
import AddEntry from '../pages/AddEntry';
import Thakdar from '../pages/Thakdar';
import History from '../pages/History';
import Pending from '../pages/Pending';
import Profile from '../pages/Profile';
import Team from '../pages/Team';
import TotalProduction from '../pages/TotalProduction';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/pending" element={<ProtectedRoute allowedRoles={['pending']}><Pending /></ProtectedRoute>} />
      
      <Route element={<ProtectedRoute allowedRoles={['foreman']} />}>
        <Route element={<ForemanLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shift" element={<StartShift />} />
          <Route path="/add-entry" element={<AddEntry />} />
          <Route path="/thakdar" element={<Thakdar />} />
          <Route path="/history" element={<History />} />
          <Route path="/team" element={<Team />} />
          <Route path="/total-production" element={<TotalProduction />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
