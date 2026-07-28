import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Lock, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // บันทึกข้อมูลพนักงานลงเครื่อง
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // พาไปหน้า Dashboard (ถ้า Router คุณตั้งหน้าหลักเป็น / ให้เปลี่ยนจาก /dashboard เป็น / ได้เลย)
        navigate('/dashboard'); 
      } else {
        // ดึงข้อความแจ้งเตือนจาก API มาแสดง (data.message)
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้');
    } finally {
      setIsLoading(false);
    }
  };

  // กรองให้พิมพ์ได้เฉพาะตัวอักษรภาษาอังกฤษและตัวเลข
  const handleUsernameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setUsername(value);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', padding: '16px', borderRadius: '50%', marginBottom: '15px' }}>
            <ShieldAlert size={40} color="#2563eb" />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '24px' }}>Admin Portal</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>ระบบจัดการหลังบ้าน SALAPI</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>รหัสพนักงาน / Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                value={username} 
                onChange={handleUsernameChange}
                placeholder="กรอกชื่อผู้ใช้งาน" 
                required 
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#334155', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>รหัสผ่าน</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="กรอกรหัสผ่าน" 
                required 
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#334155', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', backgroundColor: isLoading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }}
          >
            {isLoading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

      </div>
    </div>
  );
}