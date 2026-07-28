import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Building, Briefcase, 
  ShieldCheck, Ban, Edit, DollarSign, Link, Filter
} from 'lucide-react';

const AddSystemUser = () => {
  // State สำหรับควบคุมแท็บ
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'structure', 'permissions'
  
  // State สำหรับค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterPos, setFilterPos] = useState('');

  // ---------------------------------------------------------
  // ข้อมูลจำลอง (Mock Data)
  // ---------------------------------------------------------
  const mockUsers = [
    { id: 1, name: 'สมชาย แอดมินใจดี', pic: 'https://ui-avatars.com/api/?name=สมชาย&background=0D8ABC&color=fff', dept: 'ผู้บริหาร (Executive)', pos: 'CEO', tenure: '2 ปี 5 เดือน', status: 'Active' },
    { id: 2, name: 'สมหญิง การเงิน', pic: 'https://ui-avatars.com/api/?name=สมหญิง&background=22c55e&color=fff', dept: 'การเงิน (Finance)', pos: 'หัวหน้าฝ่ายบัญชี', tenure: '1 ปี 2 เดือน', status: 'Active' },
    { id: 3, name: 'จอห์น ซัพพอร์ต', pic: 'https://ui-avatars.com/api/?name=John&background=f59e0b&color=fff', dept: 'บริการลูกค้า (CS)', pos: 'พนักงานซัพพอร์ต', tenure: '8 เดือน', status: 'Active' },
    { id: 4, name: 'มานี ไอที', pic: 'https://ui-avatars.com/api/?name=มานี&background=ef4444&color=fff', dept: 'เทคโนโลยี (IT)', pos: 'Programmer', tenure: '3 ปี 1 เดือน', status: 'Blocked' },
  ];

  // ---------------------------------------------------------
  // UI Components
  // ---------------------------------------------------------

  // 1. แท็บ: รายชื่อพนักงานทั้งหมด
  const renderUserList = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* ส่วนค้นหา (Filters) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input type="text" placeholder="ค้นหาชื่อพนักงาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#475569' }}>
            <option value="">ทุกแผนก</option>
            <option value="Executive">ผู้บริหาร</option>
            <option value="Finance">การเงิน</option>
            <option value="CS">บริการลูกค้า</option>
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <select value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', color: '#475569' }}>
            <option value="">ทุกตำแหน่ง</option>
            <option value="Manager">ผู้จัดการ</option>
            <option value="Staff">พนักงานทั่วไป</option>
          </select>
        </div>
      </div>

      {/* ตารางข้อมูล */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '14px' }}>
              <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>พนักงาน</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>แผนก & ตำแหน่ง</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>อายุงาน</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0', transition: '0.2s', backgroundColor: 'white' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={u.pic} alt="profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{u.name}</div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '14px' }}>{u.dept}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{u.pos}</div>
                </td>
                <td style={{ padding: '15px', color: '#475569', fontSize: '14px' }}>{u.tenure}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.status === 'Active' ? '#dcfce7' : '#fee2e2', color: u.status === 'Active' ? '#16a34a' : '#dc2626' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={{ padding: '6px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', title: 'ย้ายแผนก/เลื่อนตำแหน่ง' }}><Briefcase size={16} /></button>
                    <button style={{ padding: '6px', backgroundColor: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', title: 'ปรับเงินเดือน' }}><DollarSign size={16} /></button>
                    <button style={{ padding: '6px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '6px', cursor: 'pointer', title: 'แก้ไขสิทธิ์' }}><ShieldCheck size={16} /></button>
                    <button style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', title: 'บล็อกผู้ใช้' }}><Ban size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 2. แท็บ: เพิ่มพนักงานใหม่
  const renderAddUser = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* กล่องส่งลิงก์ให้พนักงานกรอกเอง (Pre-employment form) */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px dashed #94a3b8', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
            <Link size={30} color="#4f46e5" />
          </div>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>ส่งฟอร์มให้พนักงานกรอกข้อมูล</h4>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>ให้ผู้สมัครหรือพนักงานใหม่กรอกประวัติส่วนตัว, รูปถ่าย และแนบเอกสารด้วยตนเอง</p>
          <button style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>คัดลอกลิงก์ฟอร์มใบสมัคร</button>
        </div>

        {/* ฟอร์มแอดมินกรอกเอง */}
        <div style={{ flex: '2 1 400px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>แอดมินเพิ่มข้อมูลเข้าสู่ระบบโดยตรง</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ชื่อ-นามสกุล</label>
              <input type="text" placeholder="ระบุชื่อพนักงาน" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>Username (ใช้เข้าสู่ระบบ)</label>
              <input type="text" placeholder="ระบุ Username" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>แผนก</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                <option>-- เลือกแผนก --</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ตำแหน่ง</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}>
                <option>-- เลือกตำแหน่ง --</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>วันที่เริ่มงาน</label>
              <input type="date" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>เงินเดือนเริ่มต้น</label>
              <input type="number" placeholder="ระบุตัวเลข" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูลพนักงาน</button>
        </div>
      </div>
    </div>
  );

  // 3. แท็บ: โครงสร้าง (แผนก/ตำแหน่ง)
  const renderStructure = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>จัดการ แผนกงาน, ตำแหน่งงาน, หน้าที่ และตั้งค่าฐานเงินเดือนประจำตำแหน่ง</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1' }}><Building size={18}/> แผนกงาน (Departments)</h4>
          <button style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', background: 'transparent', color: '#64748b', borderRadius: '6px', cursor: 'pointer' }}>+ เพิ่มแผนกใหม่</button>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}><Briefcase size={18}/> ตำแหน่งงาน (Positions)</h4>
          <button style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', background: 'transparent', color: '#64748b', borderRadius: '6px', cursor: 'pointer' }}>+ เพิ่มตำแหน่งใหม่</button>
        </div>
      </div>
    </div>
  );

  // 4. แท็บ: จัดการสิทธิ์ (Checkbox)
  const renderPermissions = () => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>กำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของระบบ (เลือกผู้ใช้ที่ต้องการก่อน)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
        {['จัดการบัญชีธนาคารระบบ', 'จัดการผู้ใช้งานระบบ', 'จัดการสินค้า', 'จัดการลูกค้า', 'ตรวจสอบบัญชีลูกค้า', 'แจ้งฝาก-ถอน'].map((perm, idx) => (
          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#334155' }}>
            <input type="checkbox" style={{ width: '18px', height: '18px' }} /> {perm}
          </label>
        ))}
      </div>
      <button style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกสิทธิ์การใช้งาน</button>
    </div>
  );

  return (
    <div>
      {/* ส่วน Header และ ตัวเลขผู้ใช้งาน */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>จัดการพนักงาน & โครงสร้างระบบ</h2>
        <div style={{ backgroundColor: '#eff6ff', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #bfdbfe' }}>
          <div style={{ backgroundColor: '#3b82f6', padding: '10px', borderRadius: '50%', color: 'white' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>พนักงานทั้งหมดในระบบ</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>4 <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>คน</span></div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* ปุ่มเลือก Tab */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('list')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'list' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'list' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px' }}>
            <Users size={18} /> รายชื่อพนักงาน
          </button>
          <button onClick={() => setActiveTab('add')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'add' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'add' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px' }}>
            <UserPlus size={18} /> เพิ่มพนักงานใหม่
          </button>
          <button onClick={() => setActiveTab('structure')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'structure' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'structure' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px' }}>
            <Building size={18} /> โครงสร้างองค์กร
          </button>
          <button onClick={() => setActiveTab('permissions')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'permissions' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'permissions' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px' }}>
            <ShieldCheck size={18} /> สิทธิ์การใช้งาน
          </button>
        </div>

        {/* พื้นที่แสดงผลเนื้อหาของ Tab */}
        <div style={{ padding: '25px' }}>
          {activeTab === 'list' && renderUserList()}
          {activeTab === 'add' && renderAddUser()}
          {activeTab === 'structure' && renderStructure()}
          {activeTab === 'permissions' && renderPermissions()}
        </div>

      </div>
    </div>
  );
};

export default AddSystemUser;