import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import PageRouter from './pages/PageRouter';

// ==========================================
// 🛡️ ระบบป้องกัน (Protected Route Guard)
// ==========================================
// คอมโพเนนต์นี้จะทำหน้าที่เป็น "ยาม" ตรวจสอบการ Login
const ProtectedRoute = ({ children }) => {
  // สมมติว่าตอน Login สำเร็จ คุณเก็บ Token ไว้ชื่อ 'token'
  // (ถ้าโปรเจกต์คุณใช้ชื่ออื่น เช่น 'user_token' ให้เปลี่ยนให้ตรงกันนะครับ)
  const isAuthenticated = localStorage.getItem('token') !== null;

  // ถ้าไม่ได้ Login ให้เตะกลับไปที่หน้า /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้า Login แล้ว ก็อนุญาตให้เข้าไปหน้าย่อยๆ (children) ได้ตามปกติ
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* หน้าแรกบังคับไปหน้า Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* หน้า Login (เป็นหน้าสาธารณะ ไม่ต้องมีใครคุ้มกัน) */}
        <Route path="/login" element={<Login />} />
        
        {/* 🌟 จุดสำคัญ: เอา ProtectedRoute มาครอบ AdminLayout ไว้ */}
        <Route 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* หน้าต่างๆ ภายในระบบจะถูกป้องกันทั้งหมดด้วยยามที่ชื่อ ProtectedRoute */}
          <Route path="*" element={<PageRouter />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;