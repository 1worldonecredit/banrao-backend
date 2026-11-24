import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, CheckCircle, ArrowRightLeft,
  Edit3, Trash2, KeyRound, X, Building2, ShieldCheck, RefreshCw
} from 'lucide-react';

import { getPagePermissions } from '../utils/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

// แท็บ 7 ระดับการปกครอง / องค์กร
const SCOPE_LEVELS = [
  { code: 'ALL', label: 'ทั้งหมด' },
  { code: 'VILLAGE', label: 'หมู่บ้าน' },
  { code: 'TAMBON', label: 'ตำบล' },
  { code: 'MUNICIPALITY', label: 'เทศบาล' },
  { code: 'AMPHURE', label: 'อำเภอ' },
  { code: 'PROVINCE', label: 'จังหวัด' },
  { code: 'DEPARTMENT', label: 'ระดับกรม' },
  { code: 'MINISTRY', label: 'ระดับกระทรวง' }
];

const STATUS_BADGE = {
  PENDING: { label: 'รออนุมัติ', bg: '#fef3c7', color: '#b45309' },
  ACTIVE: { label: 'ตำแหน่งปัจจุบัน', bg: '#dcfce7', color: '#15803d' },
  TRANSFERRED: { label: 'ย้าย/ปรับตำแหน่งแล้ว', bg: '#e0f2fe', color: '#0369a1' },
  INACTIVE: { label: 'พ้นสภาพ', bg: '#fee2e2', color: '#b91c1c' }
};


// จัดรูปแบบเลขบัตรประชาชนไทยอัตโนมัติ: X-XXXX-XXXXX-XX-X
const formatThaiId = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12, 13)}`;
};

const StaffManagement = () => {
  const adminUser = JSON.parse(localStorage.getItem('userData') || '{}');
  const myAccountId = adminUser.account_id || adminUser.id || null;

  // ดึงสิทธิ์ของหน้านี้ตั้งแต่ตอน Login
  const perms = getPagePermissions('/staff-management');


  // =========================================================================
  // 1. State ตัวกรอง Dropdown 4 ชั้น (หน่วยงาน -> แผนก -> ตำแหน่ง -> รายชื่อ)
  // =========================================================================
  const [activeScope, setActiveScope] = useState('ALL');
  const [orgs, setOrgs] = useState([]);
  const [filterDepts, setFilterDepts] = useState([]);
  const [filterPositions, setFilterPositions] = useState([]);

  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================================================================
  // 2. State สำหรับ Modal เพิ่ม / แก้ไข / ย้ายตำแหน่ง / อนุมัติ PIN / เปลี่ยน PIN
  // =========================================================================
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' | 'EDIT' | 'TRANSFER'
    // เช็กว่าใน Modal ปัจจุบันสามารถพิมพ์แก้ไข Text Box ได้หรือไม่
  const isFormReadOnly =
    (modalMode === 'ADD' && !perms.canCreate) ||
    ((modalMode === 'EDIT' || modalMode === 'TRANSFER') && !perms.canEdit);


  const [targetRow, setTargetRow] = useState(null);

  const [modalDepts, setModalDepts] = useState([]);
  const [modalPositions, setModalPositions] = useState([]);
  const [lookupStatus, setLookupStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    national_id: '', first_name: '', last_name: '', nickname: '', phone: '', email: '',
    profile_id: null, account_id: null,
    org_id: '', department_id: '', position_id: '',
    scope_level: 'VILLAGE', area_code: 'TH', area_name: '', note: '', pin_code: ''
  });

  // Modal อนุมัติด้วย PIN
  const [approveModal, setApproveModal] = useState({ open: false, row: null, pin: '' });
  // Modal เปลี่ยนรหัส PIN ส่วนตัว
  const [pinModal, setPinModal] = useState({ open: false, old_pin: '', new_pin: '' });

  // =========================================================================
  // 🔄 โหลดรายชื่อหน่วยงานเริ่มต้น
  // =========================================================================
  useEffect(() => {
    fetch(`${API_URL}/api/hr/orgs`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setOrgs(res.data || []); })
      .catch(console.error);
  }, []);

  // เมื่อเปลี่ยนหน่วยงานในตัวกรอง -> ดึงแผนก
  const handleFilterOrgChange = async (orgId) => {
    setSelectedOrg(orgId);
    setSelectedDept('');
    setSelectedPos('');
    setFilterDepts([]);
    setFilterPositions([]);
    if (!orgId) return;
    const res = await fetch(`${API_URL}/api/hr/departments/${orgId}`).then((r) => r.json()).catch(() => ({}));
    if (res.success) setFilterDepts(res.data || []);
  };

  // เมื่อเปลี่ยนแผนกในตัวกรอง -> ดึงตำแหน่ง
  const handleFilterDeptChange = async (deptId) => {
    setSelectedDept(deptId);
    setSelectedPos('');
    setFilterPositions([]);
    if (!deptId) return;
    const res = await fetch(`${API_URL}/api/hr/positions/${deptId}`).then((r) => r.json()).catch(() => ({}));
    if (res.success) setFilterPositions(res.data || []);
  };

  // โหลดรายชื่อบุคลากรตามตัวกรองทั้งหมด
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeScope !== 'ALL') params.append('scope_level', activeScope);
      if (selectedOrg) params.append('org_id', selectedOrg);
      if (selectedDept) params.append('department_id', selectedDept);
      if (selectedPos) params.append('position_id', selectedPos);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchText.trim()) params.append('search', searchText.trim());

      const res = await fetch(`${API_URL}/api/hr/assignments?${params.toString()}`).then((r) => r.json());
      if (res.success) setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [activeScope, selectedOrg, selectedDept, selectedPos, statusFilter]);

  // =========================================================================
  // 🔍 ค้นหาจากเลขบัตรประชาชน 13 หลักใน Modal
  // =========================================================================
  const handleLookupNationalId = async () => {
    const clean = form.national_id.replace(/\D/g, '');
    if (clean.length !== 13) return alert('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก');
    setLookupStatus('กำลังค้นหา...');
    try {
      const res = await fetch(`${API_URL}/api/hr/lookup-national-id/${clean}`).then((r) => r.json());
      if (res.success && res.data) {
        const d = res.data;
        setForm((prev) => ({
          ...prev,
          national_id: formatThaiId(clean),
          first_name: d.first_name || prev.first_name,
          last_name: d.last_name || prev.last_name,
          nickname: d.nickname || prev.nickname,
          phone: d.phone || prev.phone,
          email: d.email || prev.email,
          profile_id: d.profile_id || null,
          account_id: d.account_id || null
        }));
        if (res.source === 'HR_EMPLOYEE') {
          setLookupStatus(`✅ พบบุคลากรเดิม (${d.emp_code}) ตำแหน่งปัจจุบัน: ${d.position_name || '-'}`);
        } else {
          setLookupStatus('✅ พบข้อมูลประชาชนในระบบ ดึงชื่อ-นามสกุลมาให้แล้ว');
        }
      } else {
        setLookupStatus('ℹ️ ยังไม่พบเลขบัตรนี้ในระบบ สามารถกรอกข้อมูลเพื่อเพิ่มใหม่ได้เลย');
      }
    } catch (err) {
      setLookupStatus('❌ ค้นหาไม่สำเร็จ');
    }
  };

  // เปลี่ยนหน่วยงาน/แผนกใน Modal (Cascading)
  const handleModalOrgChange = async (orgId) => {
    setForm((prev) => ({ ...prev, org_id: orgId, department_id: '', position_id: '' }));
    setModalDepts([]);
    setModalPositions([]);
    if (!orgId) return;
    const res = await fetch(`${API_URL}/api/hr/departments/${orgId}`).then((r) => r.json()).catch(() => ({}));
    if (res.success) setModalDepts(res.data || []);
  };

  const handleModalDeptChange = async (deptId) => {
    setForm((prev) => ({ ...prev, department_id: deptId, position_id: '' }));
    setModalPositions([]);
    if (!deptId) return;
    const res = await fetch(`${API_URL}/api/hr/positions/${deptId}`).then((r) => r.json()).catch(() => ({}));
    if (res.success) setModalPositions(res.data || []);
  };

  // เปิด Modal เพิ่มใหม่ / แก้ไข / ย้ายตำแหน่ง
  const openAddModal = () => {
    setModalMode('ADD');
    setTargetRow(null);
    setLookupStatus('');
    setModalDepts([]);
    setModalPositions([]);
    setForm({
      national_id: '', first_name: '', last_name: '', nickname: '', phone: '', email: '',
      profile_id: null, account_id: null,
      org_id: selectedOrg || '', department_id: '', position_id: '',
      scope_level: activeScope !== 'ALL' ? activeScope : 'VILLAGE',
      area_code: 'TH', area_name: '', note: '', pin_code: ''
    });
    if (selectedOrg) handleModalOrgChange(selectedOrg);
    setFormModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode('EDIT');
    setTargetRow(row);
    setLookupStatus('');
    setForm({
      national_id: row.national_id,
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      nickname: row.nickname || '',
      phone: row.phone || '',
      email: row.email || '',
      org_id: row.org_id,
      department_id: row.department_id,
      position_id: row.position_id,
      scope_level: row.scope_level || 'VILLAGE',
      area_code: row.area_code || 'TH',
      area_name: row.area_name || '',
      note: row.note || '',
      pin_code: ''
    });
    setFormModalOpen(true);
  };

  const openTransferModal = async (row) => {
    setModalMode('TRANSFER');
    setTargetRow(row);
    setLookupStatus('');
    setForm({
      national_id: row.national_id,
      first_name: row.first_name,
      last_name: row.last_name,
      org_id: row.org_id,
      department_id: '',
      position_id: '',
      scope_level: row.scope_level || 'VILLAGE',
      area_code: row.area_code || 'TH',
      area_name: row.area_name || '',
      note: '',
      pin_code: ''
    });
    await handleModalOrgChange(row.org_id);
    setFormModalOpen(true);
  };

  // บันทึกฟอร์ม (ADD / EDIT / TRANSFER)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (modalMode === 'ADD') {
        res = await fetch(`${API_URL}/api/hr/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }).then((r) => r.json());
      } else if (modalMode === 'EDIT') {
        res = await fetch(`${API_URL}/api/hr/assignments/${targetRow.assignment_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }).then((r) => r.json());
      } else if (modalMode === 'TRANSFER') {
        res = await fetch(`${API_URL}/api/hr/assignments/${targetRow.emp_id}/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, approver_id: myAccountId })
        }).then((r) => r.json());
      }

      if (res.success) {
        alert('✅ ' + res.message);
        setFormModalOpen(false);
        fetchAssignments();
      } else {
        alert('❌ ' + res.message);
      }
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ยืนยันอนุมัติด้วยรหัส PIN (ค่าเริ่มต้น 123456)
  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveModal.pin.trim()) return alert('กรุณากรอกรหัส PIN อนุมัติ');
    const res = await fetch(`${API_URL}/api/hr/assignments/${approveModal.row.assignment_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin_code: approveModal.pin, approver_id: myAccountId })
    }).then((r) => r.json()).catch(() => ({}));

    if (res.success) {
      alert('✅ ' + res.message);
      setApproveModal({ open: false, row: null, pin: '' });
      fetchAssignments();
    } else {
      alert('❌ ' + (res.message || 'รหัส PIN ไม่ถูกต้อง'));
    }
  };

  // ลบแบบ Soft Delete
  const handleSoftDelete = async (row) => {
    if (!window.confirm(`ต้องการปิดใช้งานตำแหน่งของ "${row.first_name} ${row.last_name}" ใช่หรือไม่? (ไม่ลบข้อมูลจริง)`)) return;
    const res = await fetch(`${API_URL}/api/hr/assignments/${row.assignment_id}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => ({}));
    if (res.success) {
      alert('✅ ' + res.message);
      fetchAssignments();
    }
  };

  // เปลี่ยนรหัส PIN ส่วนตัว
  const handleChangePin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/hr/approval-pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: myAccountId, old_pin: pinModal.old_pin, new_pin: pinModal.new_pin })
    }).then((r) => r.json()).catch(() => ({}));
    if (res.success) {
      alert('✅ ' + res.message);
      setPinModal({ open: false, old_pin: '', new_pin: '' });
    } else {
      alert('❌ ' + (res.message || 'เปลี่ยนรหัส PIN ไม่สำเร็จ'));
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#f8fafc',
    color: '#0f172a', fontSize: '13.5px', boxSizing: 'border-box', outline: 'none'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1380px', margin: '0 auto', color: '#0f172a' }}>
      {/* ส่วนหัวหน้าจอ */}
     {/* ส่วนหัวหน้าจอ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        marginBottom: '18px', backgroundColor: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(10px)',
        padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '10px', borderRadius: '14px', display: 'flex' }}>
            <Users size={24} />
          </div>
            {/* แถบแสดงสิทธิ์การใช้งานของบัญชีที่ล็อกอิน */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
        backgroundColor: 'rgba(255,255,255,0.92)', padding: '10px 16px',
        borderRadius: '12px', marginBottom: '14px', fontSize: '12px', fontWeight: 700,
        border: '1px solid #e2e8f0'
      }}>
        <span style={{ color: '#475569' }}>สิทธิ์ของคุณในหน้านี้:</span>
        {[
          { label: 'ดูข้อมูล', ok: perms.canView },
          { label: 'เพิ่มใหม่', ok: perms.canCreate },
          { label: 'แก้ไข / ย้าย', ok: perms.canEdit },
          { label: 'ลบ (Soft Delete)', ok: perms.canDelete },
          { label: 'อนุมัติ (PIN)', ok: perms.canApprove }
        ].map((item) => (
          <span
            key={item.label}
            style={{
              padding: '3px 10px', borderRadius: '999px',
              backgroundColor: item.ok ? '#dcfce7' : '#f1f5f9',
              color: item.ok ? '#15803d' : '#94a3b8',
              border: item.ok ? '1px solid #86efac' : '1px solid #e2e8f0'
            }}
          >
            {item.ok ? '✓' : '✕'} {item.label}
          </span>
        ))}
      </div>


          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>จัดการบุคลากรและตำแหน่งงาน (7 ระดับ)</h2>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>โครงสร้างเชื่อมโยง หน่วยงาน → แผนก → ตำแหน่ง → บุคลากร (เลขบัตรไม่ซ้ำซ้อน)</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPinModal({ open: true, old_pin: '', new_pin: '' })}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <KeyRound size={16} color="#d97706" /> เปลี่ยนรหัส PIN อนุมัติ
          </button>
            <button
            type="button"
            disabled={!perms.canCreate}
            onClick={openAddModal}
            title={perms.canCreate ? 'เพิ่มบุคลากรใหม่' : 'คุณไม่มีสิทธิ์เพิ่มข้อมูล'}
            style={{
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: perms.canCreate ? '#2563eb' : '#cbd5e1',
              color: '#fff', fontWeight: 700, fontSize: '13.5px',
              cursor: perms.canCreate ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Plus size={18} /> เพิ่มบุคลากร / บรรจุตำแหน่ง
          </button>
        </div>
      </div>

      {/* แท็บแบ่ง 7 ระดับ (หมู่บ้าน / ตำบล / เทศบาล / อำเภอ / จังหวัด / กรม / กระทรวง) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
        {SCOPE_LEVELS.map((lv) => {
          const active = activeScope === lv.code;
          return (
            <button
              key={lv.code}
              type="button"
              onClick={() => setActiveScope(lv.code)}
              style={{
                padding: '8px 16px', borderRadius: '999px', border: active ? 'none' : '1px solid #cbd5e1',
                backgroundColor: active ? '#1e40af' : '#ffffff',
                color: active ? '#ffffff' : '#334155',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {lv.label}
            </button>
          );
        })}
      </div>

      {/* กล่องตัวกรอง Dropdown 4 ชั้น (หน่วยงาน -> แผนก -> ตำแหน่ง + ค้นหา) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>1. สังกัดหน่วยงานหลัก</label>
            <select value={selectedOrg} onChange={(e) => handleFilterOrgChange(e.target.value)} style={inputStyle}>
              <option value="">-- ทุกหน่วยงาน --</option>
              {orgs.map((o) => <option key={o.org_id} value={o.org_id}>[{o.org_code}] {o.org_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>2. สังกัดแผนก</label>
            <select value={selectedDept} onChange={(e) => handleFilterDeptChange(e.target.value)} disabled={!selectedOrg} style={inputStyle}>
              <option value="">-- ทุกแผนก --</option>
              {filterDepts.map((d) => <option key={d.department_id} value={d.department_id}>[{d.dept_code}] {d.department_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>3. ตำแหน่งงาน</label>
            <select value={selectedPos} onChange={(e) => setSelectedPos(e.target.value)} disabled={!selectedDept} style={inputStyle}>
              <option value="">-- ทุกตำแหน่ง --</option>
              {filterPositions.map((p) => <option key={p.position_id} value={p.position_id}>[{p.pos_code}] {p.position_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>สถานะตำแหน่ง</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="ALL">ทุกสถานะ</option>
              <option value="PENDING">รออนุมัติ</option>
              <option value="ACTIVE">ตำแหน่งปัจจุบัน</option>
              <option value="TRANSFERRED">ย้าย/ปรับตำแหน่งแล้ว</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>ค้นหา (ชื่อ / เลขบัตร / รหัสพนักงาน)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="พิมพ์คำค้นหา..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAssignments()}
                style={inputStyle}
              />
              <button type="button" onClick={fetchAssignments} style={{ padding: '0 12px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}>
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ตารางแสดงรายชื่อบุคลากร */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '960px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 14px' }}>รหัสพนักงาน / เลขบัตร</th>
              <th style={{ padding: '12px 14px' }}>ชื่อ - นามสกุล</th>
              <th style={{ padding: '12px 14px' }}>หน่วยงาน / แผนก / ตำแหน่ง</th>
              <th style={{ padding: '12px 14px' }}>ระดับ / พื้นที่ (Area Code)</th>
              <th style={{ padding: '12px 14px' }}>สถานะ</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>กำลังโหลดข้อมูล...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>ยังไม่มีรายชื่อบุคลากรในเงื่อนไขที่เลือก</td></tr>
            ) : (
              assignments.map((row) => {
                const badge = STATUS_BADGE[row.status] || STATUS_BADGE.PENDING;
                const scopeLabel = SCOPE_LEVELS.find((s) => s.code === row.scope_level)?.label || row.scope_level;
                return (
                  <tr key={row.assignment_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>{row.emp_code}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{formatThaiId(row.national_id)}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{row.first_name} {row.last_name} {row.nickname ? `(${row.nickname})` : ''}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{row.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>[{row.pos_code}] {row.position_name}</div>
                      <div style={{ fontSize: '11.5px', color: '#475569' }}>[{row.org_code}] {row.org_name} • [{row.dept_code}] {row.department_name}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '999px' }}>{scopeLabel}</span>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>[{row.area_code}] {row.area_name || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                       {row.status === 'PENDING' && perms.canApprove && (
                          <button type="button" onClick={() => setApproveModal({ open: true, row, pin: '' })} title="อนุมัติด้วยรหัส PIN" style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> อนุมัติ
                          </button>
                        )}
                        {perms.canEdit && (
                          <button type="button" onClick={() => openTransferModal(row)} title="ย้าย / ปรับตำแหน่ง" style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRightLeft size={14} /> ย้าย/ปรับ
                          </button>
                        )}
                        <button type="button" onClick={() => openEditModal(row)} title={perms.canEdit ? 'แก้ไข' : 'ดูรายละเอียด (อ่านอย่างเดียว)'} style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' }}>
                          <Edit3 size={14} />
                        </button>
                        {perms.canDelete && (
                          <button type="button" onClick={() => handleSoftDelete(row)} title="ปิดใช้งาน (Soft Delete)" style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openTransferModal(row)}
                          title="ย้าย / ปรับตำแหน่ง"
                          style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <ArrowRightLeft size={14} /> ย้าย/ปรับ
                        </button>
                        <button type="button" onClick={() => openEditModal(row)} title="แก้ไข" style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' }}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => handleSoftDelete(row)} title="ปิดใช้งาน (Soft Delete)" style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================================================================= */}
      {/* Modal 1: เพิ่มใหม่ / แก้ไข / ย้าย-ปรับตำแหน่ง */}
      {/* ================================================================= */}
      {formModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <form onSubmit={handleSubmitForm} style={{ backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#2563eb', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>
                {modalMode === 'ADD' ? 'เพิ่มบุคลากร / บรรจุตำแหน่งใหม่' : modalMode === 'EDIT' ? 'แก้ไขข้อมูลบุคลากร' : `ย้าย / ปรับตำแหน่ง: ${targetRow?.first_name} ${targetRow?.last_name}`}
              </span>
              <button type="button" onClick={() => setFormModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* ค้นหาเลขบัตรประชาชน 13 หลัก (เฉพาะโหมด ADD) */}
              {modalMode === 'ADD' && (
                <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: '6px' }}>เลขบัตรประชาชน 13 หลัก * (ห้ามซ้ำซ้อน)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      <input
  required
  maxLength={17}
  type="text"
  inputMode="numeric"
  placeholder="X-XXXX-XXXXX-XX-X"
  value={form.national_id}
  onChange={(e) => setForm({ ...form, national_id: formatThaiId(e.target.value) })}
  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '1px' }}
/>
                    <button type="button" onClick={handleLookupNationalId} style={{ padding: '0 14px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      ค้นหา
                    </button>
                  </div>
                  {lookupStatus && <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginTop: '6px', fontWeight: 600 }}>{lookupStatus}</div>}
                </div>
              )}

              {/* ข้อมูลส่วนตัว (แสดงใน ADD และ EDIT) */}
              {modalMode !== 'TRANSFER' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ชื่อจริง *</label>
                    <input required type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>นามสกุล *</label>
                    <input required type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ชื่อเล่น</label>
                    <input type="text" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>เบอร์โทรศัพท์</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* โครงสร้าง 4 มิติ (แสดงใน ADD และ TRANSFER) */}
              {modalMode !== 'EDIT' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>สังกัดหน่วยงานหลัก *</label>
                    <select required value={form.org_id} onChange={(e) => handleModalOrgChange(e.target.value)} style={inputStyle}>
                      <option value="">-- เลือกหน่วยงาน --</option>
                      {orgs.map((o) => <option key={o.org_id} value={o.org_id}>[{o.org_code}] {o.org_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>สังกัดแผนก *</label>
                    <select required value={form.department_id} onChange={(e) => handleModalDeptChange(e.target.value)} disabled={!form.org_id} style={inputStyle}>
                      <option value="">-- เลือกแผนก --</option>
                      {modalDepts.map((d) => <option key={d.department_id} value={d.department_id}>[{d.dept_code}] {d.department_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ตำแหน่งงาน *</label>
                    <select required value={form.position_id} onChange={(e) => setForm({ ...form, position_id: e.target.value })} disabled={!form.department_id} style={inputStyle}>
                      <option value="">-- เลือกตำแหน่ง --</option>
                      {modalPositions.map((p) => <option key={p.position_id} value={p.position_id}>[{p.pos_code}] {p.position_name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* ระดับพื้นที่ 7 ระดับ & Area Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ระดับพื้นที่ *</label>
                  <select required value={form.scope_level} onChange={(e) => setForm({ ...form, scope_level: e.target.value })} style={inputStyle}>
                    {SCOPE_LEVELS.filter((s) => s.code !== 'ALL').map((s) => (
                      <option key={s.code} value={s.code}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>รหัสพื้นที่ (Area Code)</label>
                  <input type="text" placeholder="เช่น TH, 67, 670104" value={form.area_code} onChange={(e) => setForm({ ...form, area_code: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ชื่อพื้นที่รับผิดชอบ</label>
                <input type="text" placeholder="เช่น หมู่ 6 บ้านขมวด ต.นายม / เทศบาลเมืองเพชรบูรณ์ / ส่วนกลาง" value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>หมายเหตุคำสั่ง</label>
                <input type="text" placeholder="เช่น คำสั่งแต่งตั้งที่ ... / ย้ายตามคำร้อง" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={inputStyle} />
              </div>

              {/* ช่องใส่ PIN กรณีโหมด TRANSFER และต้องการอนุมัติทันที */}
              {modalMode === 'TRANSFER' && (
                <div style={{ backgroundColor: '#fef3c7', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', display: 'block', marginBottom: '4px' }}>รหัส PIN อนุมัติทันที (เว้นว่างไว้เพื่อส่งเป็นสถานะรออนุมัติ)</label>
                  <input type="password" placeholder="ค่าเริ่มต้น 123456" value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} style={inputStyle} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setFormModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal 2: ยืนยันรหัส PIN อนุมัติตำแหน่ง (ค่าเริ่มต้น 123456) */}
      {/* ================================================================= */}
      {approveModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <form onSubmit={handleConfirmApprove} style={{ backgroundColor: '#fff', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#059669' }}>
              <ShieldCheck size={22} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>ยืนยันรหัส PIN อนุมัติตำแหน่ง</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: 0 }}>
              อนุมัติ <strong>{approveModal.row?.first_name} {approveModal.row?.last_name}</strong> เป็นตำแหน่ง <strong>{approveModal.row?.position_name}</strong>
            </p>
            <input
              required
              type="password"
              placeholder="กรอกรหัส PIN (ค่าเริ่มต้น 123456)"
              value={approveModal.pin}
              onChange={(e) => setApproveModal({ ...approveModal, pin: e.target.value })}
              style={{ ...inputStyle, marginBottom: '14px', textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setApproveModal({ open: false, row: null, pin: '' })} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>ยืนยันอนุมัติ</button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* Modal 3: เปลี่ยนรหัส PIN อนุมัติส่วนตัว */}
      {/* ================================================================= */}
      {pinModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <form onSubmit={handleChangePin} style={{ backgroundColor: '#fff', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800 }}>เปลี่ยนรหัส PIN อนุมัติส่วนตัว</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <input required type="password" placeholder="รหัส PIN เดิม (ค่าเริ่มต้น 123456)" value={pinModal.old_pin} onChange={(e) => setPinModal({ ...pinModal, old_pin: e.target.value })} style={inputStyle} />
              <input required type="password" placeholder="รหัส PIN ใหม่ (อย่างน้อย 4 หลัก)" value={pinModal.new_pin} onChange={(e) => setPinModal({ ...pinModal, new_pin: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setPinModal({ open: false, old_pin: '', new_pin: '' })} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>บันทึกรหัสใหม่</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;