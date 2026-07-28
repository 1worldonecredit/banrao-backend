import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import PageRouter from './pages/PageRouter'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* 🌟 จุดสำคัญ: ต้องเป็น AdminLayout ครอบ PageRouter เท่านั้น */}
        <Route element={<AdminLayout />}>
          <Route path="*" element={<PageRouter />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;