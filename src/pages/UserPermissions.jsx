import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, User, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const UserPermissions = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  
  // เก็บ ID ของเมนูที่โดนติ๊กเลือกไว้
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. ดึงรายชื่อ Roles ตอนโหลดหน้า
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/roles`);
        const data = await res.json();
        if (data.success) {
          setRoles(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch roles', err);
      }
    };
    fetchRoles();
  }, []);

  // 2. ดึงเมนูทั้งหมด และสิทธิ์เก่าของ Role เมื่อมีการเลือก Role
  useEffect(() => {
    if (!selectedRole) {
      setAllMenus([]);
      setSelectedMenuIds([]);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/permissions/${selectedRole}`);
        const data = await res.json();
        if (data.success) {
          setAllMenus(data.allMenus);
          setSelectedMenuIds(data.allowedMenuIds);
        }
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      }
    };
    fetchPermissions();
  }, [selectedRole]);

  // ฟังก์ชันสลับการติ๊ก Checkbox
  const handleToggle = (menuId) => {
    setSelectedMenuIds(prev => {
      if (prev.includes(menuId)) {
        // ถ้ามีอยู่แล้วให้เอาออก
        return prev.filter(id => id !== menuId);
      } else {
        // ถ้าไม่มีให้เพิ่มเข้าไป
        return [...prev, menuId];
      }
    });
  };

  // 3. ฟังก์ชันบันทึก
  const handleSave = async () => {
    if (!selectedRole) {
      alert('กรุณาเลือก Role ที่ต้องการบันทึกสิทธิ์');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole,
          menuIds: selectedMenuIds
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ บันทึกสิทธิ์การใช้งานเรียบร้อยแล้ว!');
        // 🌟 ยิง Event แจ้งเตือน Sidebar ให้ Reload เมนูใหม่แบบ Real-time
        window.dispatchEvent(new Event('menuUpdated')); 
      } else {
        alert('❌ เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={28} color="#f87171" /> กำหนดสิทธิ์การใช้งานตามระดับผู้ใช้ (Role)
        </h2>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '25px' }}>
        
        {/* ส่วนที่ 1: เลือก Role */}
        <div style={{ marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>
            <User size={18} /> เลือกระดับผู้ใช้งาน (Role)
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ flex: '1 1 300px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#475569' }}
            >
              <option value="">-- กรุณาเลือกระดับ Role --</option>
              {roles.map(r => (
                <option key={r.role_id} value={r.role_id}>Role ID {r.role_id} : {r.role_name}</option>
              ))}
            </select>
            
            {selectedRole && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                <CheckCircle2 size={18} /> กำลังแก้ไขสิทธิ์ของ: {roles.find(r => String(r.role_id) === String(selectedRole))?.role_name}
              </div>
            )}
          </div>
        </div>

        {/* ส่วนที่ 2: Checkbox เมนูทั้งหมด */}
        <div style={{ opacity: selectedRole ? 1 : 0.5, pointerEvents: selectedRole ? 'auto' : 'none', transition: '0.3s' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>เลือกเมนูที่อนุญาตให้เข้าถึง</h4>
          
          {!selectedRole && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '15px', fontSize: '14px' }}>
              <AlertCircle size={16} /> โปรดเลือก Role ด้านบนก่อนทำรายการ
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            
            {/* วนลูปวาดเมนูจากตาราง system_menus จริง */}
            {allMenus.length > 0 ? allMenus.map(menu => (
              <label key={menu.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <input 
                  type="checkbox" 
                  checked={selectedMenuIds.includes(menu.id)} 
                  onChange={() => handleToggle(menu.id)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                /> 
                <span style={{ color: '#334155', fontWeight: '500' }}>
                  {menu.title} {menu.parent_id && <span style={{fontSize:'12px', color:'#94a3b8'}}>(เมนูย่อย)</span>}
                </span>
              </label>
            )) : (
               <div style={{ color: '#94a3b8' }}>ไม่มีข้อมูลเมนูในระบบ หรือคุณยังไม่ได้เลือก Role</div>
            )}

          </div>

          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', 
                backgroundColor: isSaving ? '#93c5fd' : '#2563eb', 
                color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                fontSize: '15px', cursor: isSaving ? 'not-allowed' : 'pointer', 
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' 
              }}
            >
              <Save size={20} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์การใช้งาน'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;