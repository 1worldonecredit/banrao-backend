import React, { useState, useEffect } from 'react';
import {
  Users, Search, ShieldCheck, UserCheck, UserX,
  RefreshCw, MapPin, Settings, Plus, Pencil, Trash2, Check, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const LEVEL_OPTIONS = [
  { value: 'VILLAGE', label: 'ระดับหมู่บ้าน (VILLAGE)' },
  { value: 'TAMBON', label: 'ระดับตำบล (TAMBON)' },
  { value: 'AMPHURE', label: 'ระดับอำเภอ (AMPHURE)' },
  { value: 'PROVINCE', label: 'ระดับจังหวัด (PROVINCE)' },
  { value: 'NATIONAL', label: 'ระดับประเทศ (NATIONAL)' },
  { value: 'ADMIN', label: 'ผู้ดูแลระบบ (ADMIN)' },
  { value: 'LOCAL', label: 'ทั่วไป (LOCAL)' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับ Modal จัดการตำแหน่ง (เพิ่ม / แก้ไข / ลบ)
  const [showPosModal, setShowPosModal] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [newPosLevel, setNewPosLevel] = useState('VILLAGE');
  const [editingPosId, setEditingPosId] = useState(null);
  const [editPosName, setEditPosName] = useState('');
  const [editPosLevel, setEditPosLevel] = useState('VILLAGE');
  const [isSavingPos, setIsSavingPos] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setPositions(data.positions || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isSuperAdmin = (u) => u.username_phone === '0000000000' || (u.role || '').toUpperCase() === 'SUPER_ADMIN';

  const countCitizen = users.filter(u => !isSuperAdmin(u) && (!u.positions || u.positions.length === 0)).length;
  const countSuperAdmin = users.filter(u => isSuperAdmin(u)).length;
  const countByPosition = (posId) => users.filter(u => u.positions?.some(p => p.position_id === posId)).length;

  // ==========================================
  // ฟังก์ชัน เพิ่ม / แก้ไข / ลบ ตำแหน่ง
  // ==========================================
  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!newPosName.trim()) return alert('กรุณากรอกชื่อตำแหน่ง');
    setIsSavingPos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ position_name: newPosName, position_level: newPosLevel })
      });
      const data = await res.json();
      if (data.success) {
        setNewPosName('');
        fetchUsers();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSavingPos(false);
    }
  };

  const handleSaveEditPosition = async (posId) => {
    if (!editPosName.trim()) return alert('กรุณากรอกชื่อตำแหน่ง');
    setIsSavingPos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/positions/${posId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ position_name: editPosName, position_level: editPosLevel })
      });
      const data = await res.json();
      if (data.success) {
        setEditingPosId(null);
        fetchUsers();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSavingPos(false);
    }
  };

  const handleDeletePosition = async (pos) => {
    const cnt = countByPosition(pos.position_id);
    if (cnt > 0) {
      return alert(`ไม่สามารถลบ "${pos.position_name}" ได้ เนื่องจากมีผู้ใช้งานถือตำแหน่งนี้อยู่ ${cnt} คน`);
    }
    if (!window.confirm(`ยืนยันการลบตำแหน่ง "${pos.position_name}" ?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/positions/${pos.position_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (String(selectedFilter) === String(pos.position_id)) setSelectedFilter('ALL');
        fetchUsers();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    let matchFilter = true;
    if (selectedFilter === 'CITIZEN') {
      matchFilter = !isSuperAdmin(u) && (!u.positions || u.positions.length === 0);
    } else if (selectedFilter === 'SUPER_ADMIN') {
      matchFilter = isSuperAdmin(u);
    } else if (selectedFilter !== 'ALL') {
      matchFilter = u.positions?.some(p => String(p.position_id) === String(selectedFilter));
    }

    const fullName = `${u.first_name || ''} ${u.last_name || ''} ${u.nickname || ''}`.toLowerCase();
    const phone = (u.username_phone || '').toLowerCase();
    const keyword = searchTerm.trim().toLowerCase();
    const matchSearch = !keyword || fullName.includes(keyword) || phone.includes(keyword);

    return matchFilter && matchSearch;
  });

  const glassStyle = {
    background: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
  };

  const tabStyle = (active) => ({
    padding: '8px 14px',
    borderRadius: '999px',
    border: active ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.25)',
    background: active ? 'rgba(22, 101, 52, 0.90)' : 'rgba(15, 23, 42, 0.85)',
    color: active ? '#86efac' : '#f1f5f9',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '700' : '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* หัวข้อ + ช่องค้นหา + ปุ่มจัดการตำแหน่ง */}
      <div style={{ ...glassStyle, padding: '20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
            <Users size={22} color="#60a5fa" /> จัดการผู้ใช้งานและแยกสิทธิ์ตามตำแหน่ง
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
            แสดงรายชื่อบุคคลทั้งหมดในระบบ แยกตามตำแหน่งงาน (ประชาชน, ผู้ใหญ่บ้าน, กำนัน, นายก อบต., นายอำเภอ ฯลฯ)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '9px 14px 9px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(2, 6, 23, 0.75)',
                color: '#ffffff',
                outline: 'none',
                fontSize: '14px',
                minWidth: '220px'
              }}
            />
          </div>

          <button
            onClick={() => setShowPosModal(true)}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(96, 165, 250, 0.5)',
              background: 'rgba(37, 99, 235, 0.85)', color: '#ffffff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600'
            }}
          >
            <Settings size={15} /> จัดการตำแหน่ง (เพิ่ม/แก้ไข/ลบ)
          </button>

          <button
            onClick={fetchUsers}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(30, 41, 59, 0.9)', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px'
            }}
          >
            <RefreshCw size={15} /> รีเฟรช
          </button>
        </div>
      </div>

      {/* ปุ่มกรองแยกตามตำแหน่ง (Filter Pills) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <button style={tabStyle(selectedFilter === 'ALL')} onClick={() => setSelectedFilter('ALL')}>
          ทั้งหมด ({users.length})
        </button>
        <button style={tabStyle(selectedFilter === 'SUPER_ADMIN')} onClick={() => setSelectedFilter('SUPER_ADMIN')}>
          <ShieldCheck size={14} /> Super Admin ({countSuperAdmin})
        </button>
        <button style={tabStyle(selectedFilter === 'CITIZEN')} onClick={() => setSelectedFilter('CITIZEN')}>
          ประชาชนทั่วไป ({countCitizen})
        </button>

        {positions.map(pos => {
          const cnt = countByPosition(pos.position_id);
          return (
            <button
              key={pos.position_id}
              style={tabStyle(String(selectedFilter) === String(pos.position_id))}
              onClick={() => setSelectedFilter(pos.position_id)}
            >
              {pos.position_name} ({cnt})
            </button>
          );
        })}
      </div>

      {/* ตารางรายชื่อผู้ใช้งาน */}
      <div style={{ ...glassStyle, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', background: 'rgba(2, 6, 23, 0.85)', color: '#e2e8f0' }}>
              <th style={{ padding: '14px 16px', color: '#e2e8f0' }}>#</th>
              <th style={{ padding: '14px 16px', color: '#e2e8f0' }}>ชื่อ - นามสกุล</th>
              <th style={{ padding: '14px 16px', color: '#e2e8f0' }}>เบอร์โทร / Username</th>
              <th style={{ padding: '14px 16px', color: '#e2e8f0' }}>ตำแหน่ง / สิทธิ์</th>
              <th style={{ padding: '14px 16px', color: '#e2e8f0' }}>รหัสพื้นที่</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', color: '#e2e8f0' }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                  กำลังโหลดข้อมูลผู้ใช้งาน...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                  ไม่พบข้อมูลผู้ใช้งานในกลุ่มนี้
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => (
                <tr key={u.account_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#ffffff' }}>
                    {u.first_name} {u.last_name}
                    {u.nickname && <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '6px' }}>({u.nickname})</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#93c5fd', fontWeight: '600' }}>
                    {u.username_phone}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {isSuperAdmin(u) && (
                        <span style={{ background: 'rgba(234, 179, 8, 0.25)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.5)', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                          Super Admin
                        </span>
                      )}
                      {u.positions && u.positions.length > 0 ? (
                        u.positions.map(p => (
                          <span key={p.position_id} style={{ background: 'rgba(59, 130, 246, 0.35)', color: '#bfdbfe', border: '1px solid rgba(96, 165, 250, 0.5)', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                            {p.position_name}
                          </span>
                        ))
                      ) : (
                        !isSuperAdmin(u) && (
                          <span style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#e2e8f0', padding: '3px 10px', borderRadius: '999px', fontSize: '12px' }}>
                            ประชาชนทั่วไป
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#e2e8f0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#fbbf24" /> {u.area_code || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {u.is_active ? (
                      <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                        <UserCheck size={14} /> ปกติ
                      </span>
                    ) : (
                      <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                        <UserX size={14} /> ระงับ
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================================== */}
      {/* Modal จัดการตำแหน่ง (เพิ่ม / แก้ไข / ลบ sys_positions)                */}
      {/* ===================================================================== */}
      {showPosModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            ...glassStyle,
            background: 'rgba(15, 23, 42, 0.96)',
            width: '100%', maxWidth: '680px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* หัว Modal */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="#60a5fa" /> จัดการตำแหน่งงานในระบบ ({positions.length})
              </div>
              <button onClick={() => setShowPosModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* ฟอร์มเพิ่มตำแหน่งใหม่ */}
            <form onSubmit={handleAddPosition} style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'rgba(2, 6, 23, 0.5)' }}>
              <input
                type="text"
                placeholder="ชื่อตำแหน่งใหม่ (เช่น กำนัน, สารวัตรกำนัน)..."
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                style={{ flex: '1 1 200px', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
              <select
                value={newPosLevel}
                onChange={(e) => setNewPosLevel(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                {LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button
                type="submit"
                disabled={isSavingPos}
                style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus size={16} /> เพิ่มตำแหน่ง
              </button>
            </form>

            {/* รายการตำแหน่งทั้งหมด */}
            <div style={{ overflowY: 'auto', padding: '12px 22px', flexGrow: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>ชื่อตำแหน่ง</th>
                    <th style={{ padding: '10px 8px' }}>ระดับ</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>ผู้ใช้งาน</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', width: '100px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => {
                    const isEditing = editingPosId === pos.position_id;
                    const cnt = countByPosition(pos.position_id);
                    return (
                      <tr key={pos.position_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <td style={{ padding: '10px 8px', color: '#fff', fontWeight: '500' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPosName}
                              onChange={(e) => setEditPosName(e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #60a5fa', background: '#0f172a', color: '#fff', outline: 'none' }}
                            />
                          ) : pos.position_name}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#cbd5e1', fontSize: '12px' }}>
                          {isEditing ? (
                            <select
                              value={editPosLevel}
                              onChange={(e) => setEditPosLevel(e.target.value)}
                              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #60a5fa', background: '#0f172a', color: '#fff', fontSize: '12px' }}
                            >
                              {LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.value}</option>)}
                            </select>
                          ) : pos.position_level}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: cnt > 0 ? '#4ade80' : '#64748b', fontWeight: '600' }}>
                          {cnt} คน
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button onClick={() => handleSaveEditPosition(pos.position_id)} disabled={isSavingPos} title="บันทึก" style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingPosId(null)} title="ยกเลิก" style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#475569', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button
                                onClick={() => { setEditingPosId(pos.position_id); setEditPosName(pos.position_name); setEditPosLevel(pos.position_level || 'LOCAL'); }}
                                title="แก้ไขชื่อตำแหน่ง"
                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', cursor: 'pointer', display: 'flex' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePosition(pos)}
                                title={cnt > 0 ? 'ลบไม่ได้ (มีผู้ใช้งานถือตำแหน่งนี้อยู่)' : 'ลบตำแหน่ง'}
                                style={{
                                  padding: '6px', borderRadius: '6px', border: 'none',
                                  background: cnt > 0 ? 'rgba(100, 116, 139, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                                  color: cnt > 0 ? '#64748b' : '#f87171',
                                  cursor: cnt > 0 ? 'not-allowed' : 'pointer', display: 'flex'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
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
        </div>
      )}
    </div>
  );
}