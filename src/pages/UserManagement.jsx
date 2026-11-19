import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, UserCheck, UserX, RefreshCw, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // =========================================================================
  // ✨ จุดที่ 1: ปรับความทึบของ "การ์ดและกล่องตาราง" (Glassmorphism)
  // =========================================================================
  const glassStyle = {
    // เดิม: 'rgba(255, 255, 255, 0.08)' (ใสมากจนลายพื้นหลังกวนสายตา)
    // ใหม่: ใช้สีกรมท่าเข้ม (15, 23, 42) ผสมความทึบ 0.88 (88%)
    // 💡 ตัวอย่างการปรับเอง: แก้เลขตัวสุดท้าย (0.00 = ใสสนิท, 1.00 = ทึบสนิท)
    //    - อยากใสขึ้นนิดหน่อย  -> 'rgba(15, 23, 42, 0.75)'
    //    - อยากทึบเกือบสนิท   -> 'rgba(15, 23, 42, 0.95)'
    background: 'rgba(15, 23, 42, 0.88)',

    // 💡 ตัวอย่างการปรับความเบลอของกระจก: เลขยิ่งเยอะยิ่งเบลอ (เช่น blur(8px) หรือ blur(24px))
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)', // สีเส้นขอบกล่อง
    borderRadius: '16px',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
  };

  // =========================================================================
  // ✨ จุดที่ 2: ปรับความทึบของ "ปุ่มกรองตำแหน่ง" (Filter Pills)
  // =========================================================================
  const tabStyle = (active) => ({
    padding: '8px 14px',
    borderRadius: '999px',
    border: active ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.25)',

    // เดิม: 'rgba(255,255,255,0.06)' (โปร่งใสเกินไป)
    // ใหม่: ปรับพื้นหลังปุ่มให้ทึบ 0.85 เพื่อให้อ่านชื่อตำแหน่งชัดแม้พื้นหลังมีลาย
    // 💡 ตัวอย่างการปรับเอง:
    //    - ปุ่มที่เลือก (active)     -> 'rgba(22, 101, 52, 0.90)' (เขียวเข้มทึบ 90%)
    //    - ปุ่มที่ยังไม่เลือก (ปกติ)   -> 'rgba(15, 23, 42, 0.85)' (กรมท่าเข้มทึบ 85%)
    background: active ? 'rgba(22, 101, 52, 0.90)' : 'rgba(15, 23, 42, 0.85)',

    color: active ? '#86efac' : '#f1f5f9', // สีตัวอักษรบนปุ่ม (สว่างขึ้น)
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
      
      {/* หัวข้อ + ช่องค้นหา */}
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
                background: 'rgba(2, 6, 23, 0.75)', // พื้นหลังช่องค้นหาสีเข้มอ่านง่าย
                color: '#ffffff',
                outline: 'none',
                fontSize: '14px',
                minWidth: '220px'
              }}
            />
          </div>
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
            {/* ========================================================================= */}
            {/* ✨ จุดที่ 3: ปรับพื้นหลังและสีตัวอักษร "หัวตาราง" ให้สว่างอ่านง่าย           */}
            {/* 💡 ตัวอย่างการปรับเอง: แก้ color เป็น '#ffffff' (ขาวล้วน) หรือ '#93c5fd' (ฟ้าอ่อน) */}
            {/* ========================================================================= */}
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

                  {/* ✨ จุดที่ 4: บังคับสีชื่อ-นามสกุลเป็นสีขาวสว่าง (#ffffff) กันโดน CSS หลักทับเป็นสีดำ */}
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
    </div>
  );
}