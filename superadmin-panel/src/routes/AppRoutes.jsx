import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import UserManagement from '../pages/UserManagement';
import Reports from '../pages/Reports';
import TotalProduction from '../pages/TotalProduction';
import Attendance from '../pages/Attendance';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import useAuthStore from '../store/useAuthStore';
import Dispatch from '../pages/Dispatch';
import ContractorSalary from '../pages/ContractorSalary';
import SalarySheet from '../pages/SalarySheet';
import AdvanceLedger from '../pages/AdvanceLedger';
import LabourThakdarReport from '../pages/LabourThakdarReport';

const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/total-production" element={<TotalProduction />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/contractor-salary" element={<ContractorSalary />} />
          <Route path="/salary-sheet" element={<SalarySheet />} />
          <Route path="/advances" element={<AdvanceLedger />} />
          <Route path="/labour-report" element={<LabourThakdarReport />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-red-600">403</h1>
            <p className="text-xl text-gray-700">Unauthorized Access</p>
            <button onClick={() => window.location.href = '/'} className="text-purple-600 underline">Return to Dashboard</button>
          </div>
        </div>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
