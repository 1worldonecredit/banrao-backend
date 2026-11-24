import React, { useState, useEffect } from 'react';
import {
  Building2, AppWindow, Network, Briefcase, Plus, Edit3,
  Save, X, CheckCircle2, XCircle, Columns3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const LEVELS = [
  { value: 'SYSTEM', label: 'ระดับระบบส่วนกลาง (SYSTEM)' },
  { value: 'MINISTRY', label: 'ระดับกระทรวง (MINISTRY)' },
  { value: 'DEPARTMENT', label: 'ระดับกรม (DEPARTMENT)' },
  { value: 'NATIONAL', label: 'ระดับประเทศ (NATIONAL)' },
  { value: 'PROVINCE', label: 'ระดับจังหวัด (PROVINCE)' },
  { value: 'AMPHURE', label: 'ระดับอำเภอ (AMPHURE)' },
  { value: 'MUNICIPALITY', label: 'ระดับเทศบาล (MUNICIPALITY)' },
  { value: 'TAMBON', label: 'ระดับตำบล / อปท. (TAMBON)' },
  { value: 'VILLAGE', label: 'ระดับหมู่บ้าน (VILLAGE)' }
];

const OrgStructureManagement = () => {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);

  // State สำหรับการเลือกเจาะลึก 4 ชั้น (App -> Org -> Dept -> Position)
  const [selectedApp, setSelectedApp] = useState(null);   // app_code หรือ 'UNASSIGNED'
  const [selectedOrg, setSelectedOrg] = useState(null);   // org_id
  const [selectedDept, setSelectedDept] = useState(null); // department_id หรือ 'DIRECT' (ตำแหน่งกลาง)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('orgs'); // 'apps' | 'orgs' | 'depts' | 'positions'
  const [modalMode, setModalMode] = useState('add');  // 'add' | 'edit'
  const [formData, setFormData] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/org-structure/overview`);
      const data = await res.json();
      if (data.success) {
        setApps(data.apps || []);
        setOrgs(data.organizations || []);
        setDepts(data.departments || []);
        setPositions(data.positions || []);

        // เลือกแอปแรกให้อัตโนมัติตอนเปิดหน้าครั้งแรก
        if (!selectedApp && data.apps?.length > 0) {
          setSelectedApp(data.apps[0].app_code);
        }
      }
    } catch (err) {
      alert('โหลดข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ข้อมูลที่กรองแล้วในแต่ละคอลัมน์
  const filteredOrgs = selectedApp === 'UNASSIGNED'
    ? orgs.filter((o) => !o.app_code)
    : selectedApp
      ? orgs.filter((o) => o.app_code === selectedApp)
      : [];

  const filteredDepts = selectedOrg
    ? depts.filter((d) => String(d.org_id) === String(selectedOrg))
    : [];

  const directPositionsInOrg = selectedOrg
    ? positions.filter((p) => String(p.org_id) === String(selectedOrg) && !p.dept_id)
    : [];

  const filteredPositions = !selectedOrg
    ? []
    : selectedDept === 'DIRECT'
      ? directPositionsInOrg
      : selectedDept
        ? positions.filter((p) => String(p.dept_id) === String(selectedDept))
        : [];

  // เปิด Modal พร้อมใส่ค่าเริ่มต้นตามชั้นที่เลือกอยู่
  const openModal = (type, mode, item = null, preset = {}) => {
    setModalType(type);
    setModalMode(mode);
    if (type === 'apps') {
      setFormData(item ? { ...item } : { app_code: '', app_name: '', description: '', is_active: true });
    } else if (type === 'orgs') {
      setFormData(
        item
          ? { ...item, app_code: item.app_code || '' }
          : { org_name: '', org_type: 'GOVERNMENT', app_code: preset.app_code === 'UNASSIGNED' ? '' : (preset.app_code || ''), is_active: true }
      );
    } else if (type === 'depts') {
      setFormData(
        item
          ? { ...item, org_id: item.org_id || '' }
          : { org_id: preset.org_id || selectedOrg || '', department_name: '', department_type: 'GENERAL', is_active: true }
      );
    } else if (type === 'positions') {
      setFormData(
        item
          ? { ...item, org_id: item.org_id || '', dept_id: item.dept_id || '' }
          : {
              org_id: preset.org_id || selectedOrg || '',
              dept_id: preset.dept_id === 'DIRECT' ? '' : (preset.dept_id || (selectedDept === 'DIRECT' ? '' : selectedDept) || ''),
              position_name: '',
              position_level: 'VILLAGE',
              is_active: true
            }
      );
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let url = '';
    const method = modalMode === 'edit' ? 'PUT' : 'POST';

    if (modalType === 'apps') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/apps/${formData.app_code}` : `${API_URL}/api/admin/org-structure/apps`;
    } else if (modalType === 'orgs') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/orgs/${formData.org_id}` : `${API_URL}/api/admin/org-structure/orgs`;
    } else if (modalType === 'depts') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/depts/${formData.department_id}` : `${API_URL}/api/admin/org-structure/depts`;
    } else if (modalType === 'positions') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/positions/${formData.position_id}` : `${API_URL}/api/admin/org-structure/positions`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchAll();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  // ป้ายตัวเลขบอกจำนวน (0 = สีเทา, >0 = สีฟ้า/เขียว)
  const countBadge = (count, unit) => (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
      backgroundColor: count === 0 ? '#f1f5f9' : '#dbeafe',
      color: count === 0 ? '#94a3b8' : '#1d4ed8'
    }}>
      {count} {unit}
    </span>
  );

  const colBoxStyle = {
    backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', height: '540px', overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
  };

  const colHeaderStyle = (bg) => ({
    padding: '12px 14px', backgroundColor: bg, borderBottom: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
  });

  const itemCardStyle = (isSelected) => ({
    padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
    transition: 'all 0.15s ease', display: 'flex', flexDirection: 'column', gap: '6px'
  });

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
    fontSize: '14px', color: '#1e293b', boxSizing: 'border-box', outline: 'none'
  };

  const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' };

  const filteredDeptsForModal = formData.org_id
    ? depts.filter((d) => String(d.org_id) === String(formData.org_id))
    : depts;

  const unassignedOrgsCount = orgs.filter((o) => !o.app_code).length;

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(14px)',
        borderRadius: '22px', padding: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.6)', color: '#0f172a'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Columns3 size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                จัดการโครงสร้างองค์กร 4 มิติ (เลือกเจาะลึกทีละชั้น)
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                คลิกเลือกจากซ้ายไปขวา: 1. แอปพลิเคชัน → 2. หน่วยงานหลัก → 3. แผนก → 4. ตำแหน่งงาน (แสดงจำนวนที่มีชัดเจน)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            <span>แอป: {apps.length}</span> • <span>หน่วยงาน: {orgs.length}</span> • <span>แผนก: {depts.length}</span> • <span>ตำแหน่ง: {positions.length}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดโครงสร้างองค์กร...</div>
        ) : (
          /* ================= 4 คอลัมน์เจาะลึกทีละชั้น ================= */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>

            {/* คอลัมน์ 1: แอปพลิเคชัน */}
            <div style={colBoxStyle}>
              <div style={colHeaderStyle('#eff6ff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: '#1e3a8a' }}>
                  <AppWindow size={16} /> 1. แอปพลิเคชัน ({apps.length})
                </div>
                <button onClick={() => openModal('apps', 'add')} style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                  + เพิ่ม
                </button>
              </div>
              <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {apps.map((app) => {
                  const orgCnt = orgs.filter((o) => o.app_code === app.app_code).length;
                  const isSel = selectedApp === app.app_code;
                  return (
                    <div
                      key={app.app_code}
                      onClick={() => { setSelectedApp(app.app_code); setSelectedOrg(null); setSelectedDept(null); }}
                      style={itemCardStyle(isSel)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{app.app_name}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4338ca' }}>{app.app_code}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openModal('apps', 'edit', app); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Edit3 size={14} /></button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {countBadge(orgCnt, 'หน่วยงาน')}
                        {app.is_active === false && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>ปิดใช้งาน</span>}
                      </div>
                    </div>
                  );
                })}

                {/* กลุ่มส่วนกลางที่ยังไม่ผูกแอป */}
                <div
                  onClick={() => { setSelectedApp('UNASSIGNED'); setSelectedOrg(null); setSelectedDept(null); }}
                  style={{ ...itemCardStyle(selectedApp === 'UNASSIGNED'), borderStyle: 'dashed' }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>🌐 ส่วนกลาง (ยังไม่ระบุแอป)</div>
                  <div>{countBadge(unassignedOrgsCount, 'หน่วยงาน')}</div>
                </div>
              </div>
            </div>

            {/* คอลัมน์ 2: หน่วยงานหลัก */}
            <div style={colBoxStyle}>
              <div style={colHeaderStyle('#f0f9ff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: '#0369a1' }}>
                  <Building2 size={16} /> 2. หน่วยงาน ({filteredOrgs.length})
                </div>
                <button
                  disabled={!selectedApp}
                  onClick={() => openModal('orgs', 'add', null, { app_code: selectedApp })}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: selectedApp ? '#0284c7' : '#cbd5e1', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: selectedApp ? 'pointer' : 'not-allowed' }}
                >
                  + เพิ่ม
                </button>
              </div>
              <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {!selectedApp ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>← กรุณาเลือกแอปพลิเคชันก่อน</div>
                ) : filteredOrgs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>มี 0 หน่วยงานในแอปนี้<br />กด "+ เพิ่ม" ด้านบนได้เลย</div>
                ) : (
                  filteredOrgs.map((org) => {
                    const deptCnt = depts.filter((d) => String(d.org_id) === String(org.org_id)).length;
                    const posCnt = positions.filter((p) => String(p.org_id) === String(org.org_id)).length;
                    const isSel = String(selectedOrg) === String(org.org_id);
                    return (
                      <div
                        key={org.org_id}
                        onClick={() => { setSelectedOrg(org.org_id); setSelectedDept(null); }}
                        style={itemCardStyle(isSel)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{org.org_name}</div>
                            {org.org_code && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0284c7' }}>{org.org_code}</div>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); openModal('orgs', 'edit', org); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Edit3 size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {countBadge(deptCnt, 'แผนก')}
                          {countBadge(posCnt, 'ตำแหน่ง')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* คอลัมน์ 3: แผนก */}
            <div style={colBoxStyle}>
              <div style={colHeaderStyle('#f0fdfa')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: '#0f766e' }}>
                  <Network size={16} /> 3. แผนก ({filteredDepts.length})
                </div>
                <button
                  disabled={!selectedOrg}
                  onClick={() => openModal('depts', 'add', null, { org_id: selectedOrg })}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: selectedOrg ? '#0d9488' : '#cbd5e1', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: selectedOrg ? 'pointer' : 'not-allowed' }}
                >
                  + เพิ่ม
                </button>
              </div>
              <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {!selectedOrg ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>← กรุณาเลือกหน่วยงานหลักก่อน</div>
                ) : (
                  <>
                    {filteredDepts.length === 0 && directPositionsInOrg.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>มี 0 แผนกในหน่วยงานนี้<br />กด "+ เพิ่ม" ด้านบนได้เลย</div>
                    )}
                    {filteredDepts.map((dept) => {
                      const posCnt = positions.filter((p) => String(p.dept_id) === String(dept.department_id)).length;
                      const isSel = String(selectedDept) === String(dept.department_id);
                      return (
                        <div
                          key={dept.department_id}
                          onClick={() => setSelectedDept(dept.department_id)}
                          style={itemCardStyle(isSel)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{dept.department_name}</div>
                              {dept.dept_code && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0d9488' }}>{dept.dept_code}</div>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); openModal('depts', 'edit', dept); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Edit3 size={14} /></button>
                          </div>
                          <div>{countBadge(posCnt, 'ตำแหน่ง')}</div>
                        </div>
                      );
                    })}

                    {/* ตำแหน่งกลางที่ไม่ได้ระบุแผนก */}
                    {directPositionsInOrg.length > 0 && (
                      <div
                        onClick={() => setSelectedDept('DIRECT')}
                        style={{ ...itemCardStyle(selectedDept === 'DIRECT'), borderStyle: 'dashed' }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>📌 ตำแหน่งกลาง (ไม่ระบุแผนก)</div>
                        <div>{countBadge(directPositionsInOrg.length, 'ตำแหน่ง')}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* คอลัมน์ 4: ตำแหน่งงาน */}
            <div style={colBoxStyle}>
              <div style={colHeaderStyle('#eef2ff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: '#4338ca' }}>
                  <Briefcase size={16} /> 4. ตำแหน่ง ({filteredPositions.length})
                </div>
                <button
                  disabled={!selectedOrg || !selectedDept}
                  onClick={() => openModal('positions', 'add', null, { org_id: selectedOrg, dept_id: selectedDept })}
                  style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: (selectedOrg && selectedDept) ? '#4f46e5' : '#cbd5e1', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: (selectedOrg && selectedDept) ? 'pointer' : 'not-allowed' }}
                >
                  + เพิ่ม
                </button>
              </div>
              <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {!selectedDept ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>← กรุณาเลือกแผนกก่อน</div>
                ) : filteredPositions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', marginTop: '40px' }}>มี 0 ตำแหน่งในแผนกนี้<br />กด "+ เพิ่ม" ด้านบนได้เลย</div>
                ) : (
                  filteredPositions.map((pos) => (
                    <div key={pos.position_id} style={{ ...itemCardStyle(false), cursor: 'default' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>{pos.position_name}</div>
                          {pos.pos_code && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4f46e5' }}>{pos.pos_code}</div>}
                        </div>
                        <button onClick={() => openModal('positions', 'edit', pos)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 6px', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={14} /></button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {pos.position_level}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: pos.is_active !== false ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {pos.is_active !== false ? <><CheckCircle2 size={12} /> ใช้งาน</> : <><XCircle size={12} /> ปิด</>}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ================= Modal เพิ่ม/แก้ไข ================= */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <form onSubmit={handleSave} style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{modalMode === 'edit' ? 'แก้ไขข้อมูล' : 'เพิ่มรายการใหม่'}</span>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modalType === 'apps' && (
                <>
                  <div>
                    <label style={labelStyle}>รหัสแอป (ภาษาอังกฤษตัวใหญ่) *</label>
                    <input required disabled={modalMode === 'edit'} type="text" placeholder="เช่น BANRAO_SHOP" value={formData.app_code || ''} onChange={(e) => setFormData({ ...formData, app_code: e.target.value })} style={{ ...inputStyle, backgroundColor: modalMode === 'edit' ? '#f1f5f9' : '#ffffff' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>ชื่อแอปพลิเคชัน *</label>
                    <input required type="text" value={formData.app_name || ''} onChange={(e) => setFormData({ ...formData, app_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>รายละเอียด</label>
                    <input type="text" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
                  </div>
                </>
              )}

              {modalType === 'orgs' && (
                <>
                  <div>
                    <label style={labelStyle}>เชื่อมโยงกับแอปพลิเคชัน</label>
                    <select value={formData.app_code || ''} onChange={(e) => setFormData({ ...formData, app_code: e.target.value })} style={inputStyle}>
                      <option value="">-- ส่วนกลาง (ใช้ได้ทุกแอป) --</option>
                      {apps.map((a) => <option key={a.app_code} value={a.app_code}>{a.app_name} ({a.app_code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>ชื่อหน่วยงานหลัก *</label>
                    <input required type="text" value={formData.org_name || ''} onChange={(e) => setFormData({ ...formData, org_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ประเภทหน่วยงาน</label>
                    <select value={formData.org_type || 'GOVERNMENT'} onChange={(e) => setFormData({ ...formData, org_type: e.target.value })} style={inputStyle}>
                      <option value="GOVERNMENT">หน่วยงานภาครัฐ / ท้องถิ่น (GOVERNMENT)</option>
                      <option value="INTERNAL_STAFF">พนักงานส่วนกลาง (INTERNAL_STAFF)</option>
                      <option value="PARTNER">พันธมิตร / เอกชน (PARTNER)</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === 'depts' && (
                <>
                  <div>
                    <label style={labelStyle}>สังกัดหน่วยงานหลัก</label>
                    <select value={formData.org_id || ''} onChange={(e) => setFormData({ ...formData, org_id: e.target.value })} style={inputStyle}>
                      <option value="">-- ส่วนกลาง (ไม่ระบุหน่วยงาน) --</option>
                      {orgs.map((o) => <option key={o.org_id} value={o.org_id}>{o.org_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>ชื่อแผนก *</label>
                    <input required type="text" value={formData.department_name || ''} onChange={(e) => setFormData({ ...formData, department_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ประเภทแผนก</label>
                    <input type="text" value={formData.department_type || ''} onChange={(e) => setFormData({ ...formData, department_type: e.target.value })} style={inputStyle} />
                  </div>
                </>
              )}

              {modalType === 'positions' && (
                <>
                  <div>
                    <label style={labelStyle}>สังกัดหน่วยงานหลัก</label>
                    <select value={formData.org_id || ''} onChange={(e) => setFormData({ ...formData, org_id: e.target.value, dept_id: '' })} style={inputStyle}>
                      <option value="">-- ไม่ระบุหน่วยงาน --</option>
                      {orgs.map((o) => <option key={o.org_id} value={o.org_id}>{o.org_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>สังกัดแผนก</label>
                    <select value={formData.dept_id || ''} onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })} style={inputStyle}>
                      <option value="">-- ตำแหน่งกลาง (ไม่ระบุแผนก) --</option>
                      {filteredDeptsForModal.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>ชื่อตำแหน่ง *</label>
                    <input required type="text" value={formData.position_name || ''} onChange={(e) => setFormData({ ...formData, position_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ระดับขอบเขตพื้นที่</label>
                    <select value={formData.position_level || 'VILLAGE'} onChange={(e) => setFormData({ ...formData, position_level: e.target.value })} style={inputStyle}>
                      {LEVELS.map((lv) => <option key={lv.value} value={lv.value}>{lv.label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {modalMode === 'edit' && (
                <div>
                  <label style={labelStyle}>สถานะการใช้งาน</label>
                  <select value={String(formData.is_active !== false)} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })} style={inputStyle}>
                    <option value="true">เปิดใช้งาน (Active)</option>
                    <option value="false">ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> บันทึก
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrgStructureManagement;