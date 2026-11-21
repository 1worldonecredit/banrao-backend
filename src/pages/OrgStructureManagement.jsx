import React, { useState, useEffect } from 'react';
import {
  Building2, AppWindow, Network, Briefcase, Plus, Edit3,
  Save, X, CheckCircle2, XCircle, GitBranch, ChevronDown, ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const LEVELS = [
  { value: 'SYSTEM', label: 'ระดับระบบส่วนกลาง (SYSTEM)' },
  { value: 'NATIONAL', label: 'ระดับประเทศ / กระทรวง (NATIONAL)' },
  { value: 'PROVINCE', label: 'ระดับจังหวัด (PROVINCE)' },
  { value: 'AMPHURE', label: 'ระดับอำเภอ (AMPHURE)' },
  { value: 'TAMBON', label: 'ระดับตำบล / อปท. (TAMBON)' },
  { value: 'VILLAGE', label: 'ระดับหมู่บ้าน (VILLAGE)' }
];

const OrgStructureManagement = () => {
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'apps' | 'orgs' | 'depts' | 'positions'
  const [loading, setLoading] = useState(true);

  const [apps, setApps] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);

  // State สำหรับพับ/กาง ในผังความเชื่อมโยง
  const [expandedApps, setExpandedApps] = useState({});
  const [expandedOrgs, setExpandedOrgs] = useState({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('orgs'); // 'apps' | 'orgs' | 'depts' | 'positions'
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
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

        // กาง App ทั้งหมดไว้เป็นค่าเริ่มต้น
        const initApps = { UNASSIGNED: true };
        (data.apps || []).forEach((a) => { initApps[a.app_code] = true; });
        setExpandedApps((prev) => (Object.keys(prev).length > 0 ? prev : initApps));
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

  // เปิด Modal โดยระบุประเภท (apps/orgs/depts/positions) และค่าเริ่มต้น (preset) ได้
  const openModal = (type, mode, item = null, preset = {}) => {
    setModalType(type);
    setModalMode(mode);
    if (type === 'apps') {
      setFormData(item ? { ...item } : { app_code: '', app_name: '', description: '', is_active: true });
    } else if (type === 'orgs') {
      setFormData(
        item
          ? { ...item, app_code: item.app_code || '' }
          : { org_name: '', org_type: 'GOVERNMENT', app_code: preset.app_code || '', is_active: true }
      );
    } else if (type === 'depts') {
      setFormData(
        item
          ? { ...item, org_id: item.org_id || '' }
          : { org_id: preset.org_id || orgs[0]?.org_id || '', department_name: '', department_type: 'GENERAL', is_active: true }
      );
    } else if (type === 'positions') {
      setFormData(
        item
          ? { ...item, org_id: item.org_id || '', dept_id: item.dept_id || '' }
          : {
              org_id: preset.org_id || orgs[0]?.org_id || '',
              dept_id: preset.dept_id || '',
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

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
    fontSize: '14px', color: '#1e293b', boxSizing: 'border-box', outline: 'none'
  };

  const labelStyle = {
    fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px'
  };

  const tabBtnStyle = (tabKey) => ({
    padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
    backgroundColor: activeTab === tabKey ? '#2563eb' : '#e2e8f0',
    color: activeTab === tabKey ? '#ffffff' : '#334155'
  });

  const renderStatus = (isActive) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
      borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      backgroundColor: isActive !== false ? '#d1fae5' : '#fee2e2',
      color: isActive !== false ? '#047857' : '#b91c1c'
    }}>
      {isActive !== false ? <><CheckCircle2 size={12} /> ใช้งาน</> : <><XCircle size={12} /> ปิดใช้งาน</>}
    </span>
  );

  const filteredDeptsForModal = formData.org_id
    ? depts.filter((d) => String(d.org_id) === String(formData.org_id))
    : depts;

  // ฟังก์ชันช่วยแสดงกิ่งของ หน่วยงาน -> แผนก -> ตำแหน่ง
  const renderOrgNode = (org) => {
    const orgDepts = depts.filter((d) => String(d.org_id) === String(org.org_id));
    const orgPositions = positions.filter((p) => String(p.org_id) === String(org.org_id));
    const directPositions = orgPositions.filter((p) => !p.dept_id);
    const isExpanded = !!expandedOrgs[org.org_id];

    return (
      <div key={org.org_id} style={{
        backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px',
        marginBottom: '10px', overflow: 'hidden'
      }}>
        {/* แถวหัวหน่วยงาน */}
        <div style={{
          padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', backgroundColor: '#f8fafc'
        }}>
          <div
            onClick={() => setExpandedOrgs((prev) => ({ ...prev, [org.org_id]: !prev[org.org_id] }))}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
          >
            {isExpanded ? <ChevronDown size={18} color="#2563eb" /> : <ChevronRight size={18} color="#64748b" />}
            <Building2 size={17} color="#0284c7" />
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{org.org_name}</span>
            <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700 }}>
              {orgDepts.length} แผนก
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '11px', fontWeight: 700 }}>
              {orgPositions.length} ตำแหน่ง
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => openModal('depts', 'add', null, { org_id: org.org_id })}
              style={{
                padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff', color: '#0f766e', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              + แผนก
            </button>
            <button
              onClick={() => openModal('positions', 'add', null, { org_id: org.org_id })}
              style={{
                padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff', color: '#4f46e5', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              + ตำแหน่ง
            </button>
            <button
              onClick={() => openModal('orgs', 'edit', org)}
              style={{ padding: '5px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#2563eb', cursor: 'pointer' }}
              title="แก้ไขหน่วยงาน"
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>

        {/* เนื้อหาด้านในหน่วยงาน (แผนก + ตำแหน่ง) */}
        {isExpanded && (
          <div style={{ padding: '12px 16px 14px 36px', borderTop: '1px solid #f1f5f9' }}>
            {orgDepts.length === 0 && directPositions.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>ยังไม่มีแผนกหรือตำแหน่งเชื่อมโยงในหน่วยงานนี้</div>
            ) : (
              <>
                {orgDepts.map((dept) => {
                  const deptPositions = positions.filter((p) => String(p.dept_id) === String(dept.department_id));
                  return (
                    <div key={dept.department_id} style={{
                      borderLeft: '3px solid #0d9488', paddingLeft: '12px', marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Network size={14} color="#0d9488" />
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{dept.department_name}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({deptPositions.length} ตำแหน่ง)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openModal('positions', 'add', null, { org_id: org.org_id, dept_id: dept.department_id })}
                            style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#4f46e5', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            + ตำแหน่ง
                          </button>
                          <button
                            onClick={() => openModal('depts', 'edit', dept)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                            title="แก้ไขแผนก"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* รายชื่อตำแหน่งในแผนก */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '6px' }}>
                        {deptPositions.length === 0 ? (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>ยังไม่มีตำแหน่ง</span>
                        ) : (
                          deptPositions.map((pos) => (
                            <span
                              key={pos.position_id}
                              onClick={() => openModal('positions', 'edit', pos)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 10px', borderRadius: '8px', backgroundColor: '#f1f5f9',
                                border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600,
                                color: '#334155', cursor: 'pointer'
                              }}
                              title="คลิกเพื่อแก้ไขตำแหน่ง"
                            >
                              <Briefcase size={12} color="#6366f1" />
                              {pos.position_name}
                              <span style={{ fontSize: '10px', color: '#64748b' }}>({pos.position_level})</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ตำแหน่งที่ผูกหน่วยงานตรงๆ (ไม่ได้ระบุแผนก) */}
                {directPositions.length > 0 && (
                  <div style={{ borderLeft: '3px solid #94a3b8', paddingLeft: '12px', marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                      ตำแหน่งกลาง (ไม่ได้ระบุแผนก) ({directPositions.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {directPositions.map((pos) => (
                        <span
                          key={pos.position_id}
                          onClick={() => openModal('positions', 'edit', pos)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', borderRadius: '8px', backgroundColor: '#fef3c7',
                            border: '1px solid #fde68a', fontSize: '12px', fontWeight: 600,
                            color: '#92400e', cursor: 'pointer'
                          }}
                        >
                          <Briefcase size={12} /> {pos.position_name} ({pos.position_level})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // รายการที่ยังไม่ผูกหน่วยงาน (เพื่อไม่ให้ตกหล่น)
  const unassignedOrgs = orgs.filter((o) => !o.app_code);
  const unassignedDepts = depts.filter((d) => !d.org_id);
  const unassignedPositions = positions.filter((p) => !p.org_id);

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
              background: 'linear-gradient(135deg, #0f766e, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', flexShrink: 0, boxShadow: '0 6px 16px rgba(2, 132, 199, 0.3)'
            }}>
              <Building2 size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                โครงสร้างองค์กรและระบบแอป (Org Structure)
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
                จัดการและดูความเชื่อมโยง แอปพลิเคชัน → หน่วยงานหลัก → แผนก → ตำแหน่ง พร้อมจำนวนเชื่อมโยงทั้งหมด
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal(activeTab === 'tree' ? 'orgs' : activeTab, 'add')}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#ffffff',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Plus size={16} /> เพิ่มรายการใหม่
          </button>
        </div>

        {/* 5 Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('tree')} style={tabBtnStyle('tree')}>
            <GitBranch size={16} /> ผังความเชื่อมโยง
          </button>
          <button onClick={() => setActiveTab('apps')} style={tabBtnStyle('apps')}>
            <AppWindow size={16} /> 1. แอปพลิเคชัน ({apps.length})
          </button>
          <button onClick={() => setActiveTab('orgs')} style={tabBtnStyle('orgs')}>
            <Building2 size={16} /> 2. หน่วยงานหลัก ({orgs.length})
          </button>
          <button onClick={() => setActiveTab('depts')} style={tabBtnStyle('depts')}>
            <Network size={16} /> 3. แผนก ({depts.length})
          </button>
          <button onClick={() => setActiveTab('positions')} style={tabBtnStyle('positions')}>
            <Briefcase size={16} /> 4. ตำแหน่ง ({positions.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : activeTab === 'tree' ? (
          /* ================= แท็บผังความเชื่อมโยง (App -> Org -> Dept -> Pos) ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {apps.map((app) => {
              const appOrgs = orgs.filter((o) => o.app_code === app.app_code);
              const appOrgIds = appOrgs.map((o) => String(o.org_id));
              const appDeptCount = depts.filter((d) => appOrgIds.includes(String(d.org_id))).length;
              const appPosCount = positions.filter((p) => appOrgIds.includes(String(p.org_id))).length;
              const isOpen = !!expandedApps[app.app_code];

              return (
                <div key={app.app_code} style={{
                  backgroundColor: 'rgba(255,255,255,0.9)', border: '1.5px solid #cbd5e1',
                  borderRadius: '18px', overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '14px 18px', background: 'linear-gradient(90deg, #eff6ff, #f8fafc)',
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    borderBottom: isOpen ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div
                      onClick={() => setExpandedApps((prev) => ({ ...prev, [app.app_code]: !prev[app.app_code] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                    >
                      {isOpen ? <ChevronDown size={20} color="#1d4ed8" /> : <ChevronRight size={20} color="#64748b" />}
                      <AppWindow size={20} color="#2563eb" />
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e3a8a' }}>{app.app_name}</span>
                        <span style={{ marginLeft: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#4338ca', fontWeight: 700 }}>
                          ({app.app_code})
                        </span>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 700 }}>
                        {appOrgs.length} หน่วยงาน | {appDeptCount} แผนก | {appPosCount} ตำแหน่ง
                      </span>
                    </div>

                    <button
                      onClick={() => openModal('orgs', 'add', null, { app_code: app.app_code })}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: 'none',
                        backgroundColor: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      + เพิ่มหน่วยงานในแอปนี้
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '14px 18px' }}>
                      {appOrgs.length === 0 ? (
                        <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>ยังไม่มีหน่วยงานหลักผูกกับแอปนี้</div>
                      ) : (
                        appOrgs.map((org) => renderOrgNode(org))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* หน่วยงานที่ยังไม่ได้ผูกกับแอปใด (ใช้ได้ทุกแอป) */}
            {unassignedOrgs.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.9)', border: '1.5px dashed #94a3b8',
                borderRadius: '18px', overflow: 'hidden'
              }}>
                <div
                  onClick={() => setExpandedApps((prev) => ({ ...prev, UNASSIGNED: !prev.UNASSIGNED }))}
                  style={{
                    padding: '14px 18px', backgroundColor: '#f8fafc', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {expandedApps.UNASSIGNED ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 800, fontSize: '14px', color: '#475569' }}>
                      🌐 หน่วยงานส่วนกลาง / ยังไม่ได้ระบุแอป ({unassignedOrgs.length} หน่วยงาน)
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>คลิกปุ่มดินสอที่หน่วยงานเพื่อผูกกับแอปได้</span>
                </div>
                {expandedApps.UNASSIGNED && (
                  <div style={{ padding: '14px 18px' }}>
                    {unassignedOrgs.map((org) => renderOrgNode(org))}
                  </div>
                )}
              </div>
            )}

            {/* แผนกหรือตำแหน่งที่ยังไม่ได้ผูกหน่วยงานเลย */}
            {(unassignedDepts.length > 0 || unassignedPositions.length > 0) && (
              <div style={{
                backgroundColor: '#fffbeb', border: '1px solid #fcd34d',
                borderRadius: '16px', padding: '16px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#92400e', marginBottom: '10px' }}>
                  ⚠️ รายการที่ยังไม่ได้ผูกหน่วยงานหลัก (คลิกเพื่อแก้ไขจับคู่)
                </div>
                {unassignedDepts.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>แผนก ({unassignedDepts.length}):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {unassignedDepts.map((d) => (
                        <span key={d.department_id} onClick={() => openModal('depts', 'edit', d)} style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #fcd34d', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          {d.department_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {unassignedPositions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>ตำแหน่ง ({unassignedPositions.length}):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {unassignedPositions.map((p) => (
                        <span key={p.position_id} onClick={() => openModal('positions', 'edit', p)} style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #fcd34d', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          {p.position_name} ({p.position_level})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================= ตารางแท็บ 1 - 4 เดิม (เพิ่มตัวนับจำนวนเชื่อมโยง) ================= */
          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {activeTab === 'apps' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>รหัสแอป</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อแอปพลิเคชัน</th>
                    <th style={{ padding: '12px 16px' }}>เชื่อมโยง</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => {
                    const orgCount = orgs.filter((o) => o.app_code === a.app_code).length;
                    return (
                      <tr key={a.app_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#4338ca' }}>{a.app_code}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{a.app_name}</td>
                        <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 700 }}>{orgCount} หน่วยงาน</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(a.is_active)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => openModal('apps', 'edit', a)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'orgs' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อหน่วยงานหลัก</th>
                    <th style={{ padding: '12px 16px' }}>แอปที่ผูก</th>
                    <th style={{ padding: '12px 16px' }}>เชื่อมโยง</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => {
                    const dCount = depts.filter((d) => String(d.org_id) === String(o.org_id)).length;
                    const pCount = positions.filter((p) => String(p.org_id) === String(o.org_id)).length;
                    return (
                      <tr key={o.org_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{o.org_id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{o.org_name}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#4338ca', fontWeight: 700 }}>
                          {o.app_code || 'ทุกแอป (ส่วนกลาง)'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>
                          {dCount} แผนก / {pCount} ตำแหน่ง
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(o.is_active)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => openModal('orgs', 'edit', o)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'depts' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อแผนก</th>
                    <th style={{ padding: '12px 16px' }}>สังกัดหน่วยงาน</th>
                    <th style={{ padding: '12px 16px' }}>เชื่อมโยง</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((d) => {
                    const pCount = positions.filter((p) => String(p.dept_id) === String(d.department_id)).length;
                    return (
                      <tr key={d.department_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{d.department_id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{d.department_name}</td>
                        <td style={{ padding: '12px 16px', color: '#4338ca', fontWeight: 600 }}>{d.org_name || 'ยังไม่ผูกหน่วยงาน'}</td>
                        <td style={{ padding: '12px 16px', color: '#6d28d9', fontWeight: 700 }}>{pCount} ตำแหน่ง</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(d.is_active)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => openModal('depts', 'edit', d)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'positions' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อตำแหน่ง</th>
                    <th style={{ padding: '12px 16px' }}>หน่วยงาน / แผนก</th>
                    <th style={{ padding: '12px 16px' }}>ระดับพื้นที่</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.position_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{p.position_id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{p.position_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#4338ca' }}>{p.org_name || 'ยังไม่ได้ผูกหน่วยงาน'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>แผนก: {p.department_name || 'ตำแหน่งกลาง'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#334155', fontSize: '11px', fontWeight: 700 }}>
                          {p.position_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(p.is_active)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => openModal('positions', 'edit', p)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ================= Modal เพิ่ม/แก้ไข ================= */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <form onSubmit={handleSave} style={{
            backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>
                {modalMode === 'edit' ? 'แก้ไขข้อมูล' : 'เพิ่มรายการใหม่'}
              </span>
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
                    <input required type="text" placeholder="เช่น บ้านเรา ร้านค้า" value={formData.app_name || ''} onChange={(e) => setFormData({ ...formData, app_name: e.target.value })} style={inputStyle} />
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
                    <input required type="text" placeholder="เช่น กระทรวงมหาดไทย, บริษัท บ้านเรา" value={formData.org_name || ''} onChange={(e) => setFormData({ ...formData, org_name: e.target.value })} style={inputStyle} />
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
                    <input required type="text" placeholder="เช่น กองคลัง, กองช่าง, ฝ่ายตรวจสอบ KYC" value={formData.department_name || ''} onChange={(e) => setFormData({ ...formData, department_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ประเภทแผนก</label>
                    <input type="text" placeholder="เช่น GENERAL, ADMIN, FINANCE" value={formData.department_type || ''} onChange={(e) => setFormData({ ...formData, department_type: e.target.value })} style={inputStyle} />
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
                    <input required type="text" placeholder="เช่น ผู้ใหญ่บ้าน, เจ้าหน้าที่การเงิน" value={formData.position_name || ''} onChange={(e) => setFormData({ ...formData, position_name: e.target.value })} style={inputStyle} />
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