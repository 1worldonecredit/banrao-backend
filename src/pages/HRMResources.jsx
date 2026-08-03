import React, { useState, useEffect } from 'react';
import { Building2, Network, Briefcase, Plus, Save, Trash2, Edit, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const HRMResources = () => {
  const [activeTab, setActiveTab] = useState('branches'); // 'branches', 'departments', 'positions'
  const [isLoading, setIsLoading] = useState(false);

  // States สำหรับเก็บข้อมูลที่ดึงมา
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // States สำหรับฟอร์มเพิ่มข้อมูล
  const [branchForm, setBranchForm] = useState({ branch_code: '', branch_name: '', country_code: 'TH' });
  const [deptForm, setDeptForm] = useState({ dept_code: '', dept_name: '' });
  const [positionForm, setPositionForm] = useState({ position_code: '', position_name: '', dept_code: '', base_salary: '', hourly_rate: '', ot_multiplier: '1.5' });

  // ฟังก์ชันจำลองการโหลดข้อมูล (เดี๋ยวเราค่อยไปทำฝั่ง Backend รับรับ)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 🌟 อนาคตเปลี่ยนเป็น Fetch API ของจริง
      // const res = await fetch(`${API_URL}/api/hrm/master-data`);
      // const data = await res.json();
      
      // ข้อมูลจำลองเพื่อให้เห็นภาพ
      setBranches([{ branch_code: 'BKK01', branch_name: 'สำนักงานใหญ่ กรุงเทพฯ', country_code: 'TH' }]);
      setDepartments([{ dept_code: 'IT', dept_name: 'Information Technology' }, { dept_code: 'HR', dept_name: 'Human Resources' }]);
      setPositions([{ position_code: 'DEV01', position_name: 'Senior Developer', dept_code: 'IT', base_salary: 50000, hourly_rate: 300, ot_multiplier: 1.5 }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // สไตล์สำหรับ Tab
  const tabStyle = (isActive) => ({
    padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
    borderBottom: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
    color: isActive ? '#0ea5e9' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', backgroundColor: isActive ? '#f0f9ff' : 'transparent'
  });

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={28} color="#0ea5e9" /> ระบบจัดการข้อมูลองค์กร (Master Data)
        </h2>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
          <RefreshCw size={16} /> รีเฟรช
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        
        {/* 🌟 Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div onClick={() => setActiveTab('branches')} style={tabStyle(activeTab === 'branches')}>
            <Building2 size={18} /> 1. สาขา (Branches)
          </div>
          <div onClick={() => setActiveTab('departments')} style={tabStyle(activeTab === 'departments')}>
            <Network size={18} /> 2. แผนก (Departments)
          </div>
          <div onClick={() => setActiveTab('positions')} style={tabStyle(activeTab === 'positions')}>
            <Briefcase size={18} /> 3. ตำแหน่ง (Positions)
          </div>
        </div>

        <div style={{ padding: '25px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูลโครงสร้างองค์กร...</div>
          ) : (
            <>
              {/* ========================================== */}
              {/* 🌟 ส่วนที่ 1: จัดการสาขา (Branches) */}
              {/* ========================================== */}
              {activeTab === 'branches' && (
                <div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> เพิ่มสาขาใหม่</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <input type="text" placeholder="รหัสสาขา (เช่น BKK01)" value={branchForm.branch_code} onChange={e => setBranchForm({...branchForm, branch_code: e.target.value.toUpperCase()})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="ชื่อสาขา" value={branchForm.branch_name} onChange={e => setBranchForm({...branchForm, branch_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <select value={branchForm.country_code} onChange={e => setBranchForm({...branchForm, country_code: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="TH">ไทย (TH)</option>
                        <option value="LA">ลาว (LA)</option>
                      </select>
                      <button style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}><Save size={16} /> บันทึกสาขา</button>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '12px' }}>รหัสสาขา</th><th style={{ padding: '12px' }}>ชื่อสาขา</th><th style={{ padding: '12px' }}>ประเทศ</th><th style={{ padding: '12px', width:'100px' }}>จัดการ</th></tr></thead>
                    <tbody>
                      {branches.map(b => (
                        <tr key={b.branch_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#0ea5e9' }}>{b.branch_code}</td>
                          <td style={{ padding: '12px' }}>{b.branch_name}</td>
                          <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{b.country_code}</span></td>
                          <td style={{ padding: '12px' }}><button style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={18}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ========================================== */}
              {/* 🌟 ส่วนที่ 2: จัดการแผนก (Departments) */}
              {/* ========================================== */}
              {activeTab === 'departments' && (
                <div>
                   <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> เพิ่มแผนกใหม่</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <input type="text" placeholder="รหัสแผนก (เช่น IT)" value={deptForm.dept_code} onChange={e => setDeptForm({...deptForm, dept_code: e.target.value.toUpperCase()})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1 }} />
                      <input type="text" placeholder="ชื่อแผนก (เช่น Information Technology)" value={deptForm.dept_name} onChange={e => setDeptForm({...deptForm, dept_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 2 }} />
                      <button style={{ backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', padding: '0 20px', cursor: 'pointer' }}><Save size={16} /> บันทึก</button>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '12px' }}>รหัสแผนก</th><th style={{ padding: '12px' }}>ชื่อแผนก</th><th style={{ padding: '12px', width:'100px' }}>จัดการ</th></tr></thead>
                    <tbody>
                      {departments.map(d => (
                        <tr key={d.dept_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#d97706' }}>{d.dept_code}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{d.dept_name}</td>
                          <td style={{ padding: '12px' }}><button style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={18}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ========================================== */}
              {/* 🌟 ส่วนที่ 3: จัดการตำแหน่งและเงินเดือน (Positions) */}
              {/* ========================================== */}
              {activeTab === 'positions' && (
                <div>
                   <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> เพิ่มตำแหน่งงานและฐานเงินเดือน</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <input type="text" placeholder="รหัสตำแหน่ง (เช่น DEV01)" value={positionForm.position_code} onChange={e => setPositionForm({...positionForm, position_code: e.target.value.toUpperCase()})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="ชื่อตำแหน่ง" value={positionForm.position_name} onChange={e => setPositionForm({...positionForm, position_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <select value={positionForm.dept_code} onChange={e => setPositionForm({...positionForm, dept_code: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">-- เลือกสังกัดแผนก --</option>
                        {departments.map(d => <option key={d.dept_code} value={d.dept_code}>{d.dept_name}</option>)}
                      </select>
                      <input type="number" placeholder="ฐานเงินเดือน (Base Salary)" value={positionForm.base_salary} onChange={e => setPositionForm({...positionForm, base_salary: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="ค่าล่วงเวลา (OT Multiplier) เช่น 1.5" value={positionForm.ot_multiplier} onChange={e => setPositionForm({...positionForm, ot_multiplier: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <button style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={16} /> บันทึกตำแหน่ง</button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                      <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '12px' }}>รหัสตำแหน่ง</th><th style={{ padding: '12px' }}>ชื่อตำแหน่ง</th><th style={{ padding: '12px' }}>สังกัดแผนก</th><th style={{ padding: '12px' }}>ฐานเงินเดือน</th><th style={{ padding: '12px' }}>เรท OT</th><th style={{ padding: '12px', width:'100px' }}>จัดการ</th></tr></thead>
                      <tbody>
                        {positions.map(p => (
                          <tr key={p.position_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#7c3aed' }}>{p.position_code}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.position_name}</td>
                            <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{p.dept_code}</span></td>
                            <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>฿{Number(p.base_salary).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>x {p.ot_multiplier}</td>
                            <td style={{ padding: '12px' }}><button style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={18}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRMResources;