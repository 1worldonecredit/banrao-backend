import React, { useState } from 'react';
import { Users, UserPlus, Search, Briefcase, ShieldCheck, Ban, DollarSign, Link } from 'lucide-react';

const EmployeeList = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // ข้อมูลจำลอง (Mock Data) อิงตามโครงสร้าง DB ใหม่
  const mockUsers = [
    { id: 'EMP-2607001', name: 'สมชาย แอดมินใจดี', branch: 'สำนักงานใหญ่ (กทม.)', dept: 'ผู้บริหาร (Executive)', pos: 'CEO', type: 'Full-Time', status: 'Active' },
    { id: 'EMP-2607002', name: 'สมหญิง การเงิน', branch: 'สำนักงานใหญ่ (กทม.)', dept: 'การเงิน (Finance)', pos: 'หัวหน้าฝ่ายบัญชี', type: 'Full-Time', status: 'Active' },
    { id: 'EMP-2607003', name: 'จอห์น ซัพพอร์ต', branch: 'สาขาเวียงจันทน์', dept: 'บริการลูกค้า (CS)', pos: 'พนักงานซัพพอร์ต', type: 'Part-Time', status: 'Active' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>จัดการพนักงาน (Employees)</h2>
        <div style={{ backgroundColor: '#eff6ff', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #bfdbfe' }}>
          <div style={{ backgroundColor: '#3b82f6', padding: '10px', borderRadius: '50%', color: 'white' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>พนักงานทั้งหมด</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{mockUsers.length} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>คน</span></div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* แท็บเมนู */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <button onClick={() => setActiveTab('list')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'list' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'list' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Users size={18} /> รายชื่อพนักงาน
          </button>
          <button onClick={() => setActiveTab('add')} style={{ flex: '1', padding: '15px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'add' ? '3px solid #f87171' : '3px solid transparent', color: activeTab === 'add' ? '#f87171' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <UserPlus size={18} /> เพิ่มพนักงานใหม่
          </button>
        </div>

        <div style={{ padding: '25px' }}>
          {/* TAB 1: รายชื่อพนักงาน */}
          {activeTab === 'list' && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: '1 1 250px', position: 'relative' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input type="text" placeholder="ค้นหารหัส หรือชื่อพนักงาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="">ทุกสาขา</option>
                  </select>
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="">ทุกแผนก</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '14px' }}>
                      <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>รหัส/พนักงาน</th>
                      <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>สาขา & แผนก</th>
                      <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>ตำแหน่ง & ประเภท</th>
                      <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                      <th style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>{u.id}</div>
                          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{u.name}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ color: '#0f766e', fontWeight: 'bold', fontSize: '14px' }}>{u.branch}</div>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>{u.dept}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '14px' }}>{u.pos}</div>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>{u.type}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#16a34a' }}>{u.status}</span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button style={{ padding: '6px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="ย้ายแผนก/ตำแหน่ง"><Briefcase size={16} /></button>
                            <button style={{ padding: '6px', backgroundColor: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="ปรับเงินเดือน"><DollarSign size={16} /></button>
                            <button style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="ระงับ/บล็อก"><Ban size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: เพิ่มพนักงานใหม่ */}
          {activeTab === 'add' && (
            <div style={{ animation: 'fadeIn 0.3s', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px dashed #94a3b8', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' }}>
                  <Link size={30} color="#4f46e5" />
                </div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>ฟอร์มรับสมัครงาน (Self-Register)</h4>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>ส่งลิงก์นี้ให้พนักงานใหม่กรอกประวัติ และอัปโหลดเอกสารด้วยตนเองเพื่อลดภาระ HR</p>
                <button style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>คัดลอกลิงก์ฟอร์ม</button>
              </div>

              <div style={{ flex: '2 1 400px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>HR เพิ่มข้อมูลพนักงานโดยตรง</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {/* ฟอร์มกรอกข้อมูล */}
                  {['รหัสพนักงาน (Auto)', 'ชื่อ', 'นามสกุล', 'Username', 'รหัสผ่าน'].map(label => (
                    <div key={label}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>{label}</label>
                      <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>สาขา (ประจำการ)</label>
                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><option>-- เลือกสาขา --</option></select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ตำแหน่ง</label>
                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}><option>-- เลือกตำแหน่ง --</option></select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ประเภทการจ้าง</label>
                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <option>รายเดือน (Full-Time)</option>
                      <option>รายชั่วโมง (Part-Time)</option>
                    </select>
                  </div>
                </div>
                <button style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกข้อมูล</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;