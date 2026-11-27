import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import AdminMenuManagement from './pages/AdminMenuManagement';
import FrontendMenuManagement from './pages/FrontendMenuManagement';

import UserDataInspector from './pages/UserDataInspector';
import OrgStructureManagement from './pages/OrgStructureManagement';
import AdminVillageMaster from './pages/AdminVillageMaster';
import PermissionMatrix from './pages/PermissionMatrix';
import StaffManagement from './pages/StaffManagement';
import SuperAdminPackages from './pages/SuperAdminPackages';
import BankAndReceiptManager from './pages/BankAndReceiptManager';

// เช็กว่าล็อกอินแล้วหรือยัง   BankAndReceiptManager
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<UserManagement/>} />
          <Route path="admin-menus" element={<AdminMenuManagement/>} />
          <Route path="/data-inspector" element={<UserDataInspector />} />
          <Route path="/frontend-menus" element={<FrontendMenuManagement />} />
          <Route path="/org-structure" element={<OrgStructureManagement />} />
          <Route path="/village-master" element={<AdminVillageMaster />} />
          <Route path="/permission-matrix" element={<PermissionMatrix />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/packages" element={<SuperAdminPackages />} />
           <Route path="/bank-and-receipt-manager" element={<BankAndReceiptManager />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;