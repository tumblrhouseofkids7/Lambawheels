import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AccountantLayout from '../layouts/AccountantLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import LabourManagement from '../pages/LabourManagement';
import SalarySheet from '../pages/SalarySheet';
import Dispatch from '../pages/Dispatch';
import AdvanceLedger from '../pages/AdvanceLedger';
import AccountProfile from '../pages/AccountProfile';
import ContractorSalary from '../pages/ContractorSalary';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AccountantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="labour" element={<LabourManagement />} />
        <Route path="salary" element={<SalarySheet />} />
        <Route path="advances" element={<AdvanceLedger />} />
        <Route path="dispatch" element={<Dispatch />} />
        <Route path="contractor-salary" element={<ContractorSalary />} />
        <Route path="profile" element={<AccountProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
