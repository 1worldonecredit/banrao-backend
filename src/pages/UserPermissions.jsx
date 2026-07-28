import React, { useState } from 'react';
import { ShieldCheck, Save, User, CheckCircle2, AlertCircle } from 'lucide-react';

const UserPermissions = () => {
  const [selectedUser, setSelectedUser] = useState('');
  
  // Mockup: รายชื่อพนักงานสำหรับเลือกเพื่อกำหนดสิทธิ์
  const users = [
    { id: 'EMP-2607001', name: 'สมชาย แอดมินใจดี', role: 'Super Admin' },
    { id: 'EMP-2607002', name: 'สมหญิง การเงิน', role: 'Finance' },
    { id: 'EMP-2607003', name: 'จอห์น ซัพพอร์ต', role: 'CS' },
  ];

  // Mockup: สิทธิ์การใช้งานเริ่มต้น (State)
  const [permissions, setPermissions] = useState({
    dashboard: true,
    sysBanks: false,
    sysUsers: false,
    products: false,
    customers: false,
    customerAccounts: false,
    deposits: false,
    withdrawals: false
  });

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!selectedUser) {
      alert('กรุณาเลือกพนักงานก่อนบันทึกสิทธิ์');
      return;
    }
    alert('บันทึกสิทธิ์การใช้งานเรียบร้อยแล้ว!');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={28} color="#f87171" /> กำหนดสิทธิ์การใช้งาน (Permissions)
        </h2>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '25px' }}>
        
        {/* ส่วนที่ 1: เลือกพนักงาน */}
        <div style={{ marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>
            <User size={18} /> เลือกพนักงานที่ต้องการแก้ไขสิทธิ์
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ flex: '1 1 300px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#475569' }}
            >
              <option value="">-- กรุณาเลือกพนักงาน --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.id} : {u.name} ({u.role})</option>
              ))}
            </select>
            
            {selectedUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                <CheckCircle2 size={18} /> กำลังแก้ไขสิทธิ์ของ: {users.find(u => u.id === selectedUser)?.name}
              </div>
            )}
          </div>
        </div>

        {/* ส่วนที่ 2: Checkbox กำหนดสิทธิ์ */}
        <div style={{ opacity: selectedUser ? 1 : 0.5, pointerEvents: selectedUser ? 'auto' : 'none', transition: '0.3s' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>เลือกเมนูที่อนุญาตให้เข้าถึง</h4>
          
          {!selectedUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '15px', fontSize: '14px' }}>
              <AlertCircle size={16} /> โปรดเลือกพนักงานด้านบนก่อนทำรายการ
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            
            {/* รายการสิทธิ์ */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.dashboard} onChange={() => handleToggle('dashboard')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>แผงควบคุม (Dashboard)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.sysBanks} onChange={() => handleToggle('sysBanks')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>จัดการบัญชีธนาคารระบบ</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.sysUsers} onChange={() => handleToggle('sysUsers')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>จัดการผู้ใช้งานระบบ (HR)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.products} onChange={() => handleToggle('products')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>จัดการสินค้า</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.customers} onChange={() => handleToggle('customers')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>จัดการลูกค้า</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.customerAccounts} onChange={() => handleToggle('customerAccounts')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>ตรวจสอบบัญชีลูกค้า</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.deposits} onChange={() => handleToggle('deposits')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>แจ้งการโอนเงิน (ฝาก)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input type="checkbox" checked={permissions.withdrawals} onChange={() => handleToggle('withdrawals')} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> 
              <span style={{ color: '#334155', fontWeight: '500' }}>แจ้งการถอนเงิน</span>
            </label>

          </div>

          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              <Save size={20} /> บันทึกสิทธิ์การใช้งาน
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;