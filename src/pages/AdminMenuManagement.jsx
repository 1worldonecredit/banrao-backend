import React, { useState, useEffect } from 'react';
import {
  Settings, Plus, Pencil, Trash2, Check, X, ShieldCheck,
  Users, Save, LayoutDashboard, User, MapPin, FileText, Circle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const ICON_OPTIONS = [
  'LayoutDashboard', 'Users', 'Settings', 'User', 'MapPin', 'ShieldCheck', 'FileText', 'Circle'
];

export default function AdminMenuManagement() {
  const [activeTab, setActiveTab] = useState('MENUS'); // 'MENUS' | 'PERMISSIONS'
  const [menus, setMenus] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State ฟอร์มเพิ่มเมนู
  const [menuName, setMenuName] = useState('');
  const [routePath, setRoutePath] = useState('');
  const [iconName, setIconName] = useState('LayoutDashboard');
  const [displayOrder, setDisplayOrder] = useState(1);

  // State แก้ไขเมนู
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // State กำหนดสิทธิ์รายบุคคล
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const token = localStorage.getItem('token');

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [menuRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/menus`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);
      if (menuRes.success) setMenus(menuRes.data || []);
      if (userRes.success) setUsers(userRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // โหลดสิทธิ์เมนูของพนักงานที่เลือก
  const handleSelectUser = async (accountId) => {
    setSelectedUserId(accountId);
    if (!accountId) {
      setSelectedMenuIds([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/user-menus/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSelectedMenuIds(data.menu_ids || []);
    } catch (err) {
      console.error(err);
    }
  };

  // เพิ่มเมนูใหม่
  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!menuName.trim() || !routePath.trim()) return alert('กรุณากรอกชื่อเมนูและ Route Path');
    const res = await fetch(`${API_URL}/api/admin/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ menu_name: menuName, route_path: routePath, icon_name: iconName, display_order: displayOrder })
    });
    const data = await res.json();
    if (data.success) {
      setMenuName('');
      setRoutePath('');
      fetchAll();
      window.dispatchEvent(new Event('menuUpdated')); // สั่ง Sidebar โหลดเมนูใหม่ทันที
    } else {
      alert('❌ ' + data.message);
    }
  };

  // บันทึกการแก้ไขเมนู
  const handleSaveEdit = async (menuId) => {
    const res = await fetch(`${API_URL}/api/admin/menus/${menuId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editData)
    });
    const data = await res.json();
    if (data.success) {
      setEditingId(null);
      fetchAll();
      window.dispatchEvent(new Event('menuUpdated'));
    } else {
      alert('❌ ' + data.message);
    }
  };

  // ลบเมนู
  const handleDeleteMenu = async (menu) => {
    if (!window.confirm(`ยืนยันการลบเมนู "${menu.menu_name}" ?`)) return;
    const res = await fetch(`${API_URL}/api/admin/menus/${menu.menu_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      fetchAll();
      window.dispatchEvent(new Event('menuUpdated'));
    }
  };

  // ติ๊กเลือก/ยกเลิกเมนูให้พนักงาน
  const toggleMenuPermission = (menuId) => {
    setSelectedMenuIds(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  // บันทึกสิทธิ์เมนูของพนักงาน
  const handleSavePermissions = async () => {
    if (!selectedUserId) return alert('กรุณาเลือกพนักงานก่อน');
    setIsSavingPerm(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user-menus/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ menu_ids: selectedMenuIds })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกสิทธิ์การใช้งานเมนูสำเร็จ!');
        window.dispatchEvent(new Event('menuUpdated'));
      } else {
        alert('❌ ' + data.message);
      }
    } finally {
      setIsSavingPerm(false);
    }
  };

  const glassStyle = {
    background: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
  };

  const tabBtn = (active) => ({
    padding: '10px 20px',
    borderRadius: '10px',
    border: active ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
    background: active ? 'rgba(22, 101, 52, 0.9)' : 'rgba(15, 23, 42, 0.85)',
    color: active ? '#86efac' : '#e2e8f0',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  });

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* หัวข้อ + ปุ่มสลับแท็บ */}
      <div style={{ ...glassStyle, padding: '20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={22} color="#60a5fa" /> จัดการเมนูและกำหนดสิทธิ์รายบุคคล
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
            เพิ่ม/แก้ไขเมนูของระบบหลังบ้าน และกำหนดว่าพนักงานคนไหนสามารถมองเห็นเมนูใดได้บ้าง
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={tabBtn(activeTab === 'MENUS')} onClick={() => setActiveTab('MENUS')}>
            <Settings size={16} /> 1. จัดการเมนู ({menus.length})
          </button>
          <button style={tabBtn(activeTab === 'PERMISSIONS')} onClick={() => setActiveTab('PERMISSIONS')}>
            <ShieldCheck size={16} /> 2. กำหนดสิทธิ์พนักงาน
          </button>
        </div>
      </div>

      {/* ================= แท็บ 1: จัดการเมนู ================= */}
      {activeTab === 'MENUS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ฟอร์มเพิ่มเมนู */}
          <form onSubmit={handleAddMenu} style={{ ...glassStyle, padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>ชื่อเมนู</label>
              <input
                type="text" placeholder="เช่น จัดการหมู่บ้าน" value={menuName} onChange={e => setMenuName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,6,23,0.8)', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Route Path</label>
              <input
                type="text" placeholder="เช่น /villages" value={routePath} onChange={e => setRoutePath(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,6,23,0.8)', color: '#93c5fd', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '160px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>ไอคอน</label>
              <select
                value={iconName} onChange={e => setIconName(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,6,23,0.8)', color: '#fff' }}
              >
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>ลำดับ</label>
              <input
                type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(2,6,23,0.8)', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> เพิ่มเมนู
            </button>
          </form>

          {/* ตารางรายการเมนู */}
          <div style={{ ...glassStyle, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(2,6,23,0.85)', color: '#e2e8f0' }}>
                  <th style={{ padding: '14px 16px', width: '70px' }}>ลำดับ</th>
                  <th style={{ padding: '14px 16px' }}>ชื่อเมนู</th>
                  <th style={{ padding: '14px 16px' }}>Route Path</th>
                  <th style={{ padding: '14px 16px' }}>ไอคอน</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {menus.map(m => {
                  const isEditing = editingId === m.menu_id;
                  return (
                    <tr key={m.menu_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                        {isEditing ? (
                          <input type="number" value={editData.display_order} onChange={e => setEditData({ ...editData, display_order: e.target.value })} style={{ width: '55px', padding: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #60a5fa' }} />
                        ) : m.display_order}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fff' }}>
                        {isEditing ? (
                          <input type="text" value={editData.menu_name} onChange={e => setEditData({ ...editData, menu_name: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #60a5fa' }} />
                        ) : m.menu_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#93c5fd' }}>
                        {isEditing ? (
                          <input type="text" value={editData.route_path} onChange={e => setEditData({ ...editData, route_path: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', background: '#0f172a', color: '#93c5fd', border: '1px solid #60a5fa' }} />
                        ) : m.route_path}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {isEditing ? (
                          <select value={editData.icon_name} onChange={e => setEditData({ ...editData, icon_name: e.target.value })} style={{ padding: '5px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #60a5fa' }}>
                            {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                          </select>
                        ) : m.icon_name}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <button onClick={() => handleSaveEdit(m.menu_id)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#475569', color: '#fff', cursor: 'pointer' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <button onClick={() => { setEditingId(m.menu_id); setEditData(m); }} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'rgba(59,130,246,0.25)', color: '#93c5fd', cursor: 'pointer' }}><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteMenu(m)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= แท็บ 2: กำหนดสิทธิ์เมนูรายบุคคล ================= */}
      {activeTab === 'PERMISSIONS' && (
        <div style={{ ...glassStyle, padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
              เลือกพนักงาน / ผู้ใช้งานที่ต้องการกำหนดสิทธิ์เมนู:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
              style={{
                width: '100%', maxWidth: '480px', padding: '11px 14px', borderRadius: '10px',
                border: '1px solid rgba(96, 165, 250, 0.5)', background: 'rgba(2, 6, 23, 0.9)', color: '#fff', fontSize: '14px'
              }}
            >
              <option value="">-- กรุณาเลือกพนักงาน --</option>
              {users.map(u => (
                <option key={u.account_id} value={u.account_id}>
                  {u.first_name} {u.last_name} ({u.username_phone})
                  {u.positions?.length > 0 ? ` — ${u.positions.map(p => p.position_name).join(', ')}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            <>
              <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                ติ๊กเลือกเมนูที่อนุญาตให้พนักงานคนนี้ใช้งานได้:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {menus.map(m => {
                  const checked = selectedMenuIds.includes(m.menu_id);
                  return (
                    <div
                      key={m.menu_id}
                      onClick={() => toggleMenuPermission(m.menu_id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: checked ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.15)',
                        background: checked ? 'rgba(22, 101, 52, 0.45)' : 'rgba(2, 6, 23, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{m.menu_name}</div>
                        <div style={{ fontSize: '12px', color: '#93c5fd', fontFamily: 'monospace' }}>{m.route_path}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: '#4ade80', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={isSavingPerm}
                style={{
                  padding: '12px 24px', borderRadius: '10px', border: 'none',
                  background: '#16a34a', color: '#fff', fontWeight: '700', fontSize: '15px',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Save size={18} /> {isSavingPerm ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์การใช้งานเมนู'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}