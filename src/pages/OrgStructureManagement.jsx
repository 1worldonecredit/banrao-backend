import React, { useState, useEffect } from 'react';
import {
  Building2, AppWindow, Network, Briefcase, Plus, Edit3,
  Save, X, CheckCircle2, XCircle
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
  const [activeTab, setActiveTab] = useState('orgs'); // 'apps' | 'orgs' | 'depts' | 'positions'
  const [loading, setLoading] = useState(true);

  const [apps, setApps] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [depts, setDepts] = useState([]);
  const [positions, setPositions] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
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

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    if (activeTab === 'apps') {
      setFormData(item ? { ...item } : { app_code: '', app_name: '', description: '', is_active: true });
    } else if (activeTab === 'orgs') {
      setFormData(item ? { ...item } : { org_name: '', org_type: 'GOVERNMENT', is_active: true });
    } else if (activeTab === 'depts') {
      setFormData(item ? { ...item, org_id: item.org_id || '' } : { org_id: orgs[0]?.org_id || '', department_name: '', department_type: 'GENERAL', is_active: true });
    } else if (activeTab === 'positions') {
      setFormData(item ? { ...item, org_id: item.org_id || '', dept_id: item.dept_id || '' } : { org_id: orgs[0]?.org_id || '', dept_id: '', position_name: '', position_level: 'VILLAGE', is_active: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let url = '';
    let method = modalMode === 'edit' ? 'PUT' : 'POST';

    if (activeTab === 'apps') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/apps/${formData.app_code}` : `${API_URL}/api/admin/org-structure/apps`;
    } else if (activeTab === 'orgs') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/orgs/${formData.org_id}` : `${API_URL}/api/admin/org-structure/orgs`;
    } else if (activeTab === 'depts') {
      url = modalMode === 'edit' ? `${API_URL}/api/admin/org-structure/depts/${formData.department_id}` : `${API_URL}/api/admin/org-structure/depts`;
    } else if (activeTab === 'positions') {
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
    padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '13px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
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

  // กรองแผนกตามหน่วยงานที่เลือกใน Modal ตำแหน่ง
  const filteredDeptsForModal = formData.org_id
    ? depts.filter((d) => String(d.org_id) === String(formData.org_id))
    : depts;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
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
                จัดการแอปพลิเคชัน → หน่วยงานหลัก → แผนก → ตำแหน่ง เพื่อรองรับการกำหนดสิทธิ์อย่างละเอียด
              </p>
            </div>
          </div>

          <button
            onClick={() => openModal('add')}
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

        {/* 4 Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
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
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {/* ตารางที่ 1: แอปพลิเคชัน */}
            {activeTab === 'apps' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>รหัสแอป (app_code)</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อแอปพลิเคชัน</th>
                    <th style={{ padding: '12px 16px' }}>รายละเอียด</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.app_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#4338ca' }}>{a.app_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{a.app_name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{a.description || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(a.is_active)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => openModal('edit', a)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ตารางที่ 2: หน่วยงานหลัก */}
            {activeTab === 'orgs' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อหน่วยงานหลัก</th>
                    <th style={{ padding: '12px 16px' }}>ประเภท</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.org_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{o.org_id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{o.org_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700 }}>
                          {o.org_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(o.is_active)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => openModal('edit', o)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ตารางที่ 3: แผนก */}
            {activeTab === 'depts' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>ชื่อแผนก</th>
                    <th style={{ padding: '12px 16px' }}>สังกัดหน่วยงาน</th>
                    <th style={{ padding: '12px 16px' }}>ประเภทแผนก</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>สถานะ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>แก้ไข</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d.department_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748b' }}>#{d.department_id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{d.department_name}</td>
                      <td style={{ padding: '12px 16px', color: '#4338ca', fontWeight: 600 }}>{d.org_name || 'ส่วนกลาง (ยังไม่ผูกหน่วยงาน)'}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.department_type || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{renderStatus(d.is_active)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => openModal('edit', d)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ตารางที่ 4: ตำแหน่ง */}
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
                        <button onClick={() => openModal('edit', p)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}><Edit3 size={16} /></button>
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
              {/* ฟอร์มแอป */}
              {activeTab === 'apps' && (
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

              {/* ฟอร์มหน่วยงาน */}
              {activeTab === 'orgs' && (
                <>
                  <div>
                    <label style={labelStyle}>ชื่อหน่วยงานหลัก *</label>
                    <input required type="text" placeholder="เช่น ฝ่ายปกครอง, อบต., บริษัท บ้านเรา" value={formData.org_name || ''} onChange={(e) => setFormData({ ...formData, org_name: e.target.value })} style={inputStyle} />
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

              {/* ฟอร์มแผนก */}
              {activeTab === 'depts' && (
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

              {/* ฟอร์มตำแหน่ง */}
              {activeTab === 'positions' && (
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

              {/* สถานะเปิด/ปิด (เฉพาะตอนแก้ไข) */}
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