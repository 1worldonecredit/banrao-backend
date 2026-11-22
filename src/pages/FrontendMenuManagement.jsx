import React, { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit3, Save, X, Shield,
  Eye, EyeOff, FolderPlus, ListTree, Users, AppWindow
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const FrontendMenuManagement = () => {
  const [activeTab, setActiveTab] = useState('menus'); // 'menus' | 'groups'
  const [loading, setLoading] = useState(true);

  const [apps, setApps] = useState([]);
  const [groups, setGroups] = useState([]);
  const [menus, setMenus] = useState([]);
  const [positions, setPositions] = useState([]);

  const [selectedApp, setSelectedApp] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('ALL');

  // Form State สำหรับกรุ๊ปเมนู
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupForm, setGroupForm] = useState({ app_code: '', group_name: '', display_order: 1, is_active: true });

  // Form State สำหรับเมนูย่อย
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({
    app_code: '',
    group_id: '',
    menu_name: '',
    route_path: '',
    icon_name: 'Activity',
    display_order: 1,
    is_active: true,
    selected_roles: []
  });

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/frontend-menus/overview`);
      const data = await res.json();
      if (data.success) {
        const fetchedApps = data.apps || [];
        setApps(fetchedApps);
        setGroups(data.groups || []);
        setMenus(data.menus || []);
        setPositions(data.positions || []);

        // ตั้งค่าแอปเริ่มต้นจากฐานข้อมูลจริง (ไม่ฝัง Mockup)
        setSelectedApp((prev) => prev || fetchedApps[0]?.app_code || '');
      }
    } catch (err) {
      alert('โหลดข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // กรองกรุ๊ปและเมนูตามแอปที่เลือก
  const appGroups = groups.filter((g) => (g.app_code || 'BANRAO_WEB') === selectedApp);
  const appMenus = menus.filter((m) => (m.app_code || 'BANRAO_WEB') === selectedApp);
  const filteredMenus = filterGroupId === 'ALL'
    ? appMenus
    : appMenus.filter((m) => String(m.group_id) === String(filterGroupId));

  // ==========================
  // จัดการกรุ๊ปเมนู (Soft Delete)
  // ==========================
  const openAddGroup = () => {
    setEditingGroupId(null);
    setGroupForm({ app_code: selectedApp, group_name: '', display_order: appGroups.length + 1, is_active: true });
    setGroupModalOpen(true);
  };

  const openEditGroup = (g) => {
    setEditingGroupId(g.group_id);
    setGroupForm({
      app_code: g.app_code || selectedApp,
      group_name: g.group_name || '',
      display_order: g.display_order || 1,
      is_active: g.is_active !== false
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    const url = editingGroupId
      ? `${API_URL}/api/admin/frontend-menu-groups/${editingGroupId}`
      : `${API_URL}/api/admin/frontend-menu-groups`;
    const method = editingGroupId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm)
      });
      const data = await res.json();
      if (data.success) {
        setGroupModalOpen(false);
        fetchOverview();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleToggleGroupActive = async (g) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/frontend-menu-groups/${g.group_id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: g.is_active === false })
      });
      const data = await res.json();
      if (data.success) fetchOverview();
    } catch (err) {
      alert('❌ เปลี่ยนสถานะกรุ๊ปไม่สำเร็จ');
    }
  };

  // ==========================
  // จัดการเมนูย่อย (Soft Delete)
  // ==========================
  const openAddMenu = () => {
    setEditingMenuId(null);
    const activeGroups = appGroups.filter((g) => g.is_active !== false);
    setMenuForm({
      app_code: selectedApp,
      group_id: activeGroups[0]?.group_id || appGroups[0]?.group_id || '',
      menu_name: '',
      route_path: '',
      icon_name: 'Activity',
      display_order: appMenus.length + 1,
      is_active: true,
      selected_roles: []
    });
    setMenuModalOpen(true);
  };

  const openEditMenu = (m) => {
    setEditingMenuId(m.menu_id);
    const roles = Array.isArray(m.selected_roles) ? m.selected_roles : [];
    setMenuForm({
      app_code: m.app_code || selectedApp,
      group_id: m.group_id || '',
      menu_name: m.menu_name || '',
      route_path: m.route_path || m.path || '',
      icon_name: m.icon_name || 'Activity',
      display_order: m.display_order || 1,
      is_active: m.is_active !== false,
      selected_roles: roles
    });
    setMenuModalOpen(true);
  };

  const toggleRoleSelection = (posId) => {
    setMenuForm((prev) => {
      const exists = prev.selected_roles.some((r) => String(r) === String(posId));
      return {
        ...prev,
        selected_roles: exists
          ? prev.selected_roles.filter((r) => String(r) !== String(posId))
          : [...prev.selected_roles, posId]
      };
    });
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    const url = editingMenuId
      ? `${API_URL}/api/admin/frontend-menus/${editingMenuId}`
      : `${API_URL}/api/admin/frontend-menus`;
    const method = editingMenuId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm)
      });
      const data = await res.json();
      if (data.success) {
        setMenuModalOpen(false);
        fetchOverview();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleToggleMenuActive = async (m) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/frontend-menus/${m.menu_id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: m.is_active === false })
      });
      const data = await res.json();
      if (data.success) fetchOverview();
    } catch (err) {
      alert('❌ เปลี่ยนสถานะเมนูไม่สำเร็จ');
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
    fontSize: '14px', color: '#1e293b', boxSizing: 'border-box', outline: 'none'
  };

  // กรุ๊ปเมนูเฉพาะแอปที่เลือกใน Modal
  const modalAppGroups = groups.filter((g) => (g.app_code || 'BANRAO_WEB') === menuForm.app_code);

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        color: '#1e293b'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', paddingBottom: '20px', marginBottom: '20px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', flexShrink: 0, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
            }}>
              <Layers size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                ศูนย์กลางจัดการกรุ๊ปและเมนูทุกแอป (Master Menus)
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
                แยกจัดการเมนูตามแอปพลิเคชัน (ใช้ระบบเปิด-ปิดสถานะแทนการลบถาวร เพื่อความปลอดภัยของข้อมูล)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={openAddGroup} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderPlus size={16} /> เพิ่มกรุ๊ปเมนู
            </button>
            <button onClick={openAddMenu} style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
              <Plus size={16} /> เพิ่มเมนูย่อยใหม่
            </button>
          </div>
        </div>

        {/* แถบเลือกแอปพลิเคชัน (ดึงจาก sys_apps จริง) */}
        <div style={{
          backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '16px',
          border: '1px solid #e2e8f0', marginBottom: '18px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
            <AppWindow size={18} color="#2563eb" /> เลือกแอปพลิเคชัน:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {apps.map((app) => {
              const active = selectedApp === app.app_code;
              return (
                <button
                  key={app.app_code}
                  type="button"
                  onClick={() => { setSelectedApp(app.app_code); setFilterGroupId('ALL'); }}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: active ? '#eff6ff' : '#ffffff',
                    color: active ? '#1d4ed8' : '#475569'
                  }}
                >
                  {app.app_name} <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.75 }}>({app.app_code})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('menus')}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: activeTab === 'menus' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'menus' ? '#ffffff' : '#475569'
            }}
          >
            <ListTree size={16} /> เมนูย่อย ({appMenus.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            style={{
              padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: activeTab === 'groups' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'groups' ? '#ffffff' : '#475569'
            }}
          >
            <Layers size={16} /> กรุ๊ปเมนู ({appGroups.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : activeTab === 'menus' ? (
          <div>
            {/* ตัวกรองตามกรุ๊ป */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setFilterGroupId('ALL')}
                style={{
                  padding: '6px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  backgroundColor: filterGroupId === 'ALL' ? '#1e293b' : '#ffffff',
                  color: filterGroupId === 'ALL' ? '#ffffff' : '#475569'
                }}
              >
                ทั้งหมด ({appMenus.length})
              </button>
              {appGroups.map((g) => (
                <button
                  key={g.group_id}
                  onClick={() => setFilterGroupId(g.group_id)}
                  style={{
                    padding: '6px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    backgroundColor: String(filterGroupId) === String(g.group_id) ? '#1e293b' : '#ffffff',
                    color: String(filterGroupId) === String(g.group_id) ? '#ffffff' : '#475569',
                    opacity: g.is_active === false ? 0.5 : 1
                  }}
                >
                  {g.group_name} {g.is_active === false ? '(ปิด)' : ''}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ลำดับ</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อเมนู / กรุ๊ป</th>
                    <th style={{ padding: '12px 16px' }}>เส้นทาง (Route)</th>
                    <th style={{ padding: '12px 16px' }}>สิทธิ์พื้นฐาน</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ (Soft Delete)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenus.map((m) => {
                    const roles = Array.isArray(m.selected_roles) ? m.selected_roles : [];
                    return (
                      <tr key={m.menu_id} style={{ borderBottom: '1px solid #f1f5f9', opacity: m.is_active === false ? 0.5 : 1 }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{m.display_order || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.menu_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📁 {m.group_name || 'ไม่ระบุกรุ๊ป'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#4338ca', fontWeight: 600 }}>
                          {m.route_path || m.path}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {roles.length === 0 ? (
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700 }}>
                              🌐 ทุกคน / กำหนดใน Matrix
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {roles.map((r, i) => {
                                const posObj = positions.find((p) => String(p.position_id) === String(r) || p.position_name === r);
                                return (
                                  <span key={i} style={{ padding: '3px 10px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                                    {posObj ? posObj.position_name : r}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleMenuActive(m)}
                            style={{
                              padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                              fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px',
                              backgroundColor: m.is_active !== false ? '#d1fae5' : '#fee2e2',
                              color: m.is_active !== false ? '#047857' : '#b91c1c'
                            }}
                          >
                            {m.is_active !== false ? <><Eye size={13} /> เปิดใช้งาน</> : <><EyeOff size={13} /> ปิดใช้งาน</>}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => openEditMenu(m)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} title="แก้ไข">
                            <Edit3 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {appGroups.map((g) => {
              const count = appMenus.filter((m) => m.group_id === g.group_id).length;
              return (
                <div key={g.group_id} style={{
                  backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px',
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: g.is_active === false ? 0.55 : 1
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>ลำดับที่ {g.display_order || 1}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{g.group_name}</div>
                    <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>มีเมนูย่อย {count} รายการ</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleToggleGroupActive(g)}
                      style={{
                        padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700,
                        backgroundColor: g.is_active !== false ? '#d1fae5' : '#fee2e2',
                        color: g.is_active !== false ? '#047857' : '#b91c1c'
                      }}
                    >
                      {g.is_active !== false ? 'เปิด' : 'ปิด'}
                    </button>
                    <button onClick={() => openEditGroup(g)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#2563eb', cursor: 'pointer' }}>
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไข กรุ๊ปเมนู */}
      {groupModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <form onSubmit={handleSaveGroup} style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{editingGroupId ? 'แก้ไขกรุ๊ปเมนู' : 'เพิ่มกรุ๊ปเมนูใหม่'}</span>
              <button type="button" onClick={() => setGroupModalOpen(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>แอปพลิเคชัน *</label>
                <select required value={groupForm.app_code} onChange={(e) => setGroupForm({ ...groupForm, app_code: e.target.value })} style={inputStyle}>
                  {apps.map((a) => <option key={a.app_code} value={a.app_code}>{a.app_name} ({a.app_code})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ชื่อกรุ๊ปเมนู *</label>
                <input required type="text" placeholder="เช่น เมนูพื้นฐานประชาชน, ระบบร้านค้า" value={groupForm.group_name} onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ลำดับการแสดงผล</label>
                <input type="number" value={groupForm.display_order} onChange={(e) => setGroupForm({ ...groupForm, display_order: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setGroupModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> บันทึก
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไข เมนูย่อย */}
      {menuModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <form onSubmit={handleSaveMenu} style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{editingMenuId ? 'แก้ไขเมนูย่อย' : 'สร้างเมนูย่อยใหม่'}</span>
              <button type="button" onClick={() => setMenuModalOpen(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>แอปพลิเคชัน *</label>
                  <select required value={menuForm.app_code} onChange={(e) => setMenuForm({ ...menuForm, app_code: e.target.value, group_id: '' })} style={inputStyle}>
                    {apps.map((a) => <option key={a.app_code} value={a.app_code}>{a.app_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>กรุ๊ปเมนู *</label>
                  <select required value={menuForm.group_id} onChange={(e) => setMenuForm({ ...menuForm, group_id: e.target.value })} style={inputStyle}>
                    <option value="">-- เลือกกรุ๊ปเมนู --</option>
                    {modalAppGroups.map((g) => <option key={g.group_id} value={g.group_id}>{g.group_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ชื่อเมนู *</label>
                <input required type="text" placeholder="เช่น จัดการร้านค้า/สถานที่ของฉัน" value={menuForm.menu_name} onChange={(e) => setMenuForm({ ...menuForm, menu_name: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>เส้นทาง (Route Path) *</label>
                  <input required type="text" placeholder="/my-places" value={menuForm.route_path} onChange={(e) => setMenuForm({ ...menuForm, route_path: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ชื่อไอคอน (Lucide)</label>
                  <input type="text" placeholder="Activity" value={menuForm.icon_name} onChange={(e) => setMenuForm({ ...menuForm, icon_name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ลำดับ</label>
                  <input type="number" value={menuForm.display_order} onChange={(e) => setMenuForm({ ...menuForm, display_order: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={15} /> สิทธิ์พื้นฐาน (หรือไปกำหนดละเอียดในหน้า Matrix)
                  </span>
                  <button type="button" onClick={() => setMenuForm({ ...menuForm, selected_roles: [] })} style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #0284c7', backgroundColor: menuForm.selected_roles.length === 0 ? '#0284c7' : '#ffffff', color: menuForm.selected_roles.length === 0 ? '#ffffff' : '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> ทุกคน / ใช้ Matrix
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '8px' }}>
                  {positions.map((pos) => {
                    const checked = menuForm.selected_roles.some((r) => String(r) === String(pos.position_id) || r === pos.position_name);
                    return (
                      <label key={pos.position_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '10px', border: checked ? '1.5px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: checked ? '#eff6ff' : '#ffffff', color: checked ? '#1e40af' : '#1e293b', fontSize: '12px', fontWeight: checked ? 700 : 600, cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRoleSelection(pos.position_id)} style={{ width: '16px', height: '16px', margin: 0, flexShrink: 0, accentColor: '#2563eb', cursor: 'pointer' }} />
                        <span style={{ color: 'inherit' }}>{pos.position_name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setMenuModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> บันทึกข้อมูล
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FrontendMenuManagement;