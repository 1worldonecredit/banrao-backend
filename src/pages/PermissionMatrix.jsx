import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Save, CheckSquare, Square, RefreshCw,
  FolderOpen, ChevronDown, ChevronRight, Users, Building2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const PERM_COLS = [
  { key: 'can_view', label: 'ดู (View)', color: '#0284c7' },
  { key: 'can_create', label: 'เพิ่ม (Create)', color: '#059669' },
  { key: 'can_edit', label: 'แก้ไข (Edit)', color: '#d97706' },
  { key: 'can_delete', label: 'ลบ (Delete)', color: '#dc2626' },
  { key: 'can_approve', label: 'อนุมัติ (Approve)', color: '#7c3aed' }
];

const PermissionMatrix = () => {
  // โหมดการตั้งค่า: 'TIER' (ระดับประชาชน/ธุรกิจ) | 'ORG' (หน่วยงาน/แผนก/ตำแหน่ง)
  const [targetMode, setTargetMode] = useState('TIER');

  // ข้อมูลตัวกรอง
  const [apps, setApps] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);

  // ค่าที่เลือกปัจจุบัน
  const [selectedApp, setSelectedApp] = useState('BANRAO_WEB');
  const [selectedTier, setSelectedTier] = useState('CITIZEN_FREE');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');

  // ตาราง Matrix & การพับ/กางกรุ๊ปเมนู
  const [matrixRows, setMatrixRows] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. โหลดโครงสร้างองค์กร + ระดับผู้ใช้งาน (Tiers)
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/admin/org-structure/overview`).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/user-tiers`).then((r) => r.json())
    ])
      .then(([orgData, tierData]) => {
        if (orgData.success) {
          setApps(orgData.apps || []);
          setOrgs(orgData.organizations || []);
          setDepts(orgData.departments || []);
          setPositions(orgData.positions || []);
        }
        if (tierData.success) {
          setTiers(tierData.data || []);
          if (tierData.data?.length > 0) setSelectedTier(tierData.data[0].tier_code);
        }
      })
      .catch((err) => console.error('Load metadata error:', err));
  }, []);

  // 2. โหลดตารางสิทธิ์ Matrix
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ app_code: selectedApp });
      if (targetMode === 'TIER') {
        if (selectedTier) params.append('tier_code', selectedTier);
      } else {
        if (selectedOrg) params.append('org_id', selectedOrg);
        if (selectedDept) params.append('dept_id', selectedDept);
        if (selectedPos) params.append('position_id', selectedPos);
      }

      const res = await fetch(`${API_URL}/api/admin/permission-matrix?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMatrixRows(data.data || []);
      }
    } catch (err) {
      alert('โหลดตารางสิทธิ์ไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [targetMode, selectedApp, selectedTier, selectedOrg, selectedDept, selectedPos]);

  // กรอง Dropdown แบบลูกโซ่
  const filteredOrgs = orgs.filter((o) => !o.app_code || o.app_code === selectedApp);
  const filteredDepts = selectedOrg
    ? depts.filter((d) => String(d.org_id) === String(selectedOrg))
    : depts;
  const filteredPositions = positions.filter((p) => {
    if (selectedDept) return String(p.dept_id) === String(selectedDept);
    if (selectedOrg) return String(p.org_id) === String(selectedOrg);
    return true;
  });

  // จัดกลุ่มเมนูตาม group_name
  const groupedMenus = matrixRows.reduce((acc, row) => {
    const gKey = row.group_name || 'เมนูทั่วไป';
    if (!acc[gKey]) acc[gKey] = [];
    acc[gKey].push(row);
    return acc;
  }, {});

  // ติ๊กเปลี่ยนสิทธิ์รายช่อง
  const toggleCell = (menuId, field) => {
    setMatrixRows((prev) =>
      prev.map((row) => {
        if (row.menu_id !== menuId) return row;
        const nextVal = !row[field];
        const autoView = field !== 'can_view' && nextVal ? true : row.can_view;
        return { ...row, [field]: nextVal, can_view: field === 'can_view' ? nextVal : autoView };
      })
    );
  };

  // ติ๊กทั้งแถว
  const toggleRowAll = (menuId) => {
    setMatrixRows((prev) =>
      prev.map((row) => {
        if (row.menu_id !== menuId) return row;
        const allChecked = row.can_view && row.can_create && row.can_edit && row.can_delete && row.can_approve;
        const nextVal = !allChecked;
        return { ...row, can_view: nextVal, can_create: nextVal, can_edit: nextVal, can_delete: nextVal, can_approve: nextVal };
      })
    );
  };

  // ติ๊กทั้งกรุ๊ปเมนู
  const toggleGroupAll = (groupName) => {
    const items = groupedMenus[groupName] || [];
    const allGroupChecked = items.every(
      (r) => r.can_view && r.can_create && r.can_edit && r.can_delete && r.can_approve
    );
    const nextVal = !allGroupChecked;
    const ids = new Set(items.map((r) => r.menu_id));

    setMatrixRows((prev) =>
      prev.map((row) =>
        ids.has(row.menu_id)
          ? { ...row, can_view: nextVal, can_create: nextVal, can_edit: nextVal, can_delete: nextVal, can_approve: nextVal }
          : row
      )
    );
  };

  // ติ๊กทั้งตาราง
  const setAllMatrix = (value) => {
    setMatrixRows((prev) =>
      prev.map((row) => ({
        ...row, can_view: value, can_create: value, can_edit: value, can_delete: value, can_approve: value
      }))
    );
  };

  // บันทึกสิทธิ์ Matrix
  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      const payload = {
        app_code: selectedApp,
        org_id: targetMode === 'ORG' ? (selectedOrg || null) : null,
        dept_id: targetMode === 'ORG' ? (selectedDept || null) : null,
        position_id: targetMode === 'ORG' ? (selectedPos || null) : null,
        tier_code: targetMode === 'TIER' ? (selectedTier || null) : null,
        permissions: matrixRows
      };

      const res = await fetch(`${API_URL}/api/admin/permission-matrix/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) alert('✅ ' + data.message);
      else alert('❌ ' + data.message);
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
    fontSize: '13px', fontWeight: 600, color: '#1e293b', boxSizing: 'border-box', outline: 'none'
  };

  const checkboxStyle = {
    width: '18px', height: '18px', margin: 0, cursor: 'pointer', accentColor: '#2563eb'
  };

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
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', flexShrink: 0, boxShadow: '0 6px 16px rgba(79, 70, 229, 0.3)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                กำหนดสิทธิ์การใช้งานแบบ Matrix (แยกตามกรุ๊ปเมนู)
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
                ตั้งค่าเริ่มต้นสำหรับระดับประชาชน/แพ็กเกจธุรกิจ หรือกำหนดตามโครงสร้าง หน่วยงาน → แผนก → ตำแหน่ง
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveMatrix}
            disabled={saving || loading}
            style={{
              padding: '11px 22px', borderRadius: '12px', border: 'none',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff', fontWeight: 800, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Save size={17} /> {saving ? 'กำลังบันทึก...' : 'บันทึกตารางสิทธิ์นี้'}
          </button>
        </div>

        {/* ปุ่มสลับโหมด 2 แบบ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setTargetMode('TIER')}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: targetMode === 'TIER' ? '#2563eb' : '#e2e8f0',
              color: targetMode === 'TIER' ? '#ffffff' : '#334155'
            }}
          >
            <Users size={16} /> ระดับประชาชน / แพ็กเกจธุรกิจ (Tier)
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('ORG')}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: targetMode === 'ORG' ? '#2563eb' : '#e2e8f0',
              color: targetMode === 'ORG' ? '#ffffff' : '#334155'
            }}
          >
            <Building2 size={16} /> โครงสร้างองค์กร (หน่วยงาน → แผนก → ตำแหน่ง)
          </button>
        </div>

        {/* แถบตัวกรอง */}
        <div style={{
          backgroundColor: '#f8fafc', padding: '18px', borderRadius: '16px',
          border: '1px solid #e2e8f0', marginBottom: '20px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              1. แอปพลิเคชัน (App) *
            </label>
            <select
              value={selectedApp}
              onChange={(e) => { setSelectedApp(e.target.value); setSelectedOrg(''); setSelectedDept(''); setSelectedPos(''); }}
              style={selectStyle}
            >
              {apps.map((a) => (
                <option key={a.app_code} value={a.app_code}>{a.app_name} ({a.app_code})</option>
              ))}
            </select>
          </div>

          {targetMode === 'TIER' ? (
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                2. ระดับผู้ใช้งาน / แพ็กเกจ (User Tier / Package) *
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                style={selectStyle}
              >
                {tiers.map((t) => (
                  <option key={t.tier_code} value={t.tier_code}>
                    {t.is_paid ? '💳 [ชำระเงิน] ' : t.min_community_score > 0 ? '⭐ [คะแนนชุมชน] ' : '🆓 [พื้นฐาน] '}
                    {t.tier_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  2. หน่วยงานหลัก (Organization)
                </label>
                <select value={selectedOrg} onChange={(e) => { setSelectedOrg(e.target.value); setSelectedDept(''); setSelectedPos(''); }} style={selectStyle}>
                  <option value="">-- ทุกหน่วยงาน (ส่วนกลาง) --</option>
                  {filteredOrgs.map((o) => <option key={o.org_id} value={o.org_id}>{o.org_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  3. แผนก (Department)
                </label>
                <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedPos(''); }} style={selectStyle}>
                  <option value="">-- ทุกแผนก --</option>
                  {filteredDepts.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  4. ตำแหน่ง (Position)
                </label>
                <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value)} style={selectStyle}>
                  <option value="">-- ทุกตำแหน่ง --</option>
                  {filteredPositions.map((p) => (
                    <option key={p.position_id} value={p.position_id}>{p.position_name} ({p.position_level})</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* แถบปุ่มลัด */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            พบ {Object.keys(groupedMenus).length} กรุ๊ปเมนู ({matrixRows.length} รายการ) ในแอป <span style={{ color: '#2563eb' }}>{selectedApp}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setAllMatrix(true)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckSquare size={14} /> ติ๊กทั้งหมด
            </button>
            <button type="button" onClick={() => setAllMatrix(false)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Square size={14} /> ล้างทั้งหมด
            </button>
            <button type="button" onClick={fetchMatrix} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCw size={14} /> รีโหลด
            </button>
          </div>
        </div>

        {/* ตาราง Permission Matrix แยกตามกรุ๊ปเมนู */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดตารางสิทธิ์...</div>
        ) : matrixRows.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            ยังไม่มีเมนูในแอปพลิเคชันนี้
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(groupedMenus).map(([groupName, items]) => {
              const isCollapsed = !!collapsedGroups[groupName];
              const allGroupChecked = items.every(
                (r) => r.can_view && r.can_create && r.can_edit && r.can_delete && r.can_approve
              );

              return (
                <div key={groupName} style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', overflow: 'hidden' }}>
                  {/* หัวกรุ๊ปเมนู */}
                  <div style={{
                    padding: '12px 16px', background: 'linear-gradient(90deg, #eff6ff, #f8fafc)',
                    borderBottom: isCollapsed ? 'none' : '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
                  }}>
                    <div
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                    >
                      {isCollapsed ? <ChevronRight size={18} color="#64748b" /> : <ChevronDown size={18} color="#2563eb" />}
                      <FolderOpen size={18} color="#2563eb" />
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e3a8a' }}>{groupName}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 700 }}>
                        {items.length} เมนู
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleGroupAll(groupName)}
                      style={{
                        padding: '5px 12px', borderRadius: '8px', border: '1px solid #93c5fd',
                        backgroundColor: allGroupChecked ? '#2563eb' : '#ffffff',
                        color: allGroupChecked ? '#ffffff' : '#1d4ed8',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {allGroupChecked ? '✓ เลือกทั้งกรุ๊ปแล้ว' : 'เลือกทั้งกรุ๊ป'}
                    </button>
                  </div>

                  {/* เมนูภายในกรุ๊ป */}
                  {!isCollapsed && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '10px 16px', textAlign: 'left' }}>ชื่อเมนู / เส้นทาง</th>
                            {PERM_COLS.map((col) => (
                              <th key={col.key} style={{ padding: '10px 10px', textAlign: 'center', color: col.color, fontWeight: 800 }}>
                                {col.label}
                              </th>
                            ))}
                            <th style={{ padding: '10px 10px', textAlign: 'center' }}>ทั้งแถว</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((row) => {
                            const allRowChecked = row.can_view && row.can_create && row.can_edit && row.can_delete && row.can_approve;
                            return (
                              <tr key={row.menu_id} style={{ borderBottom: '1px solid #f1f5f9', opacity: row.menu_active === false ? 0.5 : 1 }}>
                                <td style={{ padding: '11px 16px' }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.menu_name}</div>
                                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4338ca', marginTop: '2px' }}>{row.route_path}</div>
                                </td>
                                {PERM_COLS.map((col) => (
                                  <td key={col.key} style={{ padding: '11px 10px', textAlign: 'center' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(row[col.key])}
                                      onChange={() => toggleCell(row.menu_id, col.key)}
                                      style={checkboxStyle}
                                    />
                                  </td>
                                ))}
                                <td style={{ padding: '11px 10px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRowAll(row.menu_id)}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                      backgroundColor: allRowChecked ? '#dbeafe' : '#f8fafc',
                                      color: allRowChecked ? '#1d4ed8' : '#64748b',
                                      fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                                    }}
                                  >
                                    {allRowChecked ? 'ครบ' : 'เลือก'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionMatrix;