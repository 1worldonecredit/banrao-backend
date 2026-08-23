import React, { useState, useEffect } from 'react';
import { Building2, Network, Briefcase, Plus, Save, Trash2, RefreshCw, ChevronDown, ChevronUp, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const HRMResources = () => {
  const [activeTab, setActiveTab] = useState('branches'); 
  const [isLoading, setIsLoading] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [branchForm, setBranchForm] = useState({ branch_code: '', branch_name: '', country_code: 'TH' });
  const [deptForm, setDeptForm] = useState({ dept_code: '', dept_name: '' });
  const [positionForm, setPositionForm] = useState({ position_code: '', position_name: '', dept_code: '', base_salary: '', hourly_rate: '', ot_multiplier: '1.5' });

  // 🌟 State สำหรับเปิด/ปิด แถวรายละเอียดของแต่ละแผนก
  const [expandedDept, setExpandedDept] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/hrm/master-data`);
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches || []);
        setDepartments(data.departments || []);
        setPositions(data.positions || []);
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (type, formData, setFormFn, initialForm) => {
    try {
      const res = await fetch(`${API_URL}/api/hrm/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกข้อมูลสำเร็จ');
        setFormFn(initialForm); 
        fetchData(); 
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleDelete = async (type, code) => {
    if (!window.confirm(`ยืนยันการลบรหัส: ${code} หรือไม่?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/hrm/${type}/${code}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const toggleDept = (deptCode) => {
      setExpandedDept(expandedDept === deptCode ? null : deptCode);
  };

  // 🌟 ฟังก์ชันนับจำนวนตำแหน่งในแผนก
  const countPositionsInDept = (deptCode) => {
      return positions.filter(p => p.dept_code === deptCode).length;
  };

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
        
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
          <div onClick={() => setActiveTab('branches')} style={tabStyle(activeTab === 'branches')}><Building2 size={18} /> 1. สาขา ({branches.length})</div>
          <div onClick={() => setActiveTab('departments')} style={tabStyle(activeTab === 'departments')}><Network size={18} /> 2. แผนกและตำแหน่ง ({departments.length})</div>
          {/* ซ่อนแท็บ Position แบบเดี่ยวๆ ไปเลย เพราะเราจะเอามารวมกับแผนกแล้ว */}
        </div>

        <div style={{ padding: '25px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              {/* ==================== BRANCHES ==================== */}
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
                      <button onClick={() => handleSave('branch', branchForm, setBranchForm, { branch_code: '', branch_name: '', country_code: 'TH' })} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', padding: '10px' }}>
                        <Save size={16} /> บันทึกสาขา
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                      <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '12px' }}>รหัสสาขา</th><th style={{ padding: '12px' }}>ชื่อสาขา</th><th style={{ padding: '12px' }}>ประเทศ</th><th style={{ padding: '12px', width:'80px', textAlign: 'center' }}>จัดการ</th></tr></thead>
                      <tbody>
                        {branches.map(b => (
                          <tr key={b.branch_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#0ea5e9' }}>{b.branch_code}</td>
                            <td style={{ padding: '12px' }}>{b.branch_name}</td>
                            <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{b.country_code}</span></td>
                            <td style={{ padding: '12px', textAlign: 'center' }}><button onClick={() => handleDelete('branch', b.branch_code)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={18}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== DEPARTMENTS & POSITIONS (รวมกัน) ==================== */}
              {activeTab === 'departments' && (
                <div>
                   {/* 🌟 ฟอร์มเพิ่มแผนก */}
                   <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> เพิ่มแผนกใหม่ (Department)</h4>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <input type="text" placeholder="รหัสแผนก (เช่น IT)" value={deptForm.dept_code} onChange={e => setDeptForm({...deptForm, dept_code: e.target.value.toUpperCase()})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="ชื่อแผนก (เช่น Information Technology)" value={deptForm.dept_name} onChange={e => setDeptForm({...deptForm, dept_name: e.target.value})} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <button onClick={() => handleSave('department', deptForm, setDeptForm, { dept_code: '', dept_name: '' })} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', padding: '10px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                        <Save size={16} /> บันทึกแผนก
                      </button>
                    </div>
                  </div>

                  {/* 🌟 ฟอร์มเพิ่มตำแหน่ง (เชื่อมกับแผนก) */}
                  <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> เพิ่มตำแหน่งงานในแผนก (Position)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '15px' }}>
                      <select value={positionForm.dept_code} onChange={e => setPositionForm({...positionForm, dept_code: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="">-- เลือกสังกัดแผนก --</option>
                        {departments.map(d => <option key={d.dept_code} value={d.dept_code}>{d.dept_name}</option>)}
                      </select>
                      <input type="text" placeholder="รหัสตำแหน่ง (เช่น DEV)" value={positionForm.position_code} onChange={e => setPositionForm({...positionForm, position_code: e.target.value.toUpperCase()})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="ชื่อตำแหน่ง" value={positionForm.position_name} onChange={e => setPositionForm({...positionForm, position_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      
                      {/* ซ่อนช่องเงินเดือนไปเลย */}
                      <input type="hidden" value={positionForm.base_salary} />
                      <input type="hidden" value={positionForm.hourly_rate} />
                      
                      <button onClick={() => handleSave('position', positionForm, setPositionForm, { position_code: '', position_name: '', dept_code: '', base_salary: '0', hourly_rate: '0', ot_multiplier: '1.5' })} style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '10px' }}>
                        <Save size={16} /> บันทึกตำแหน่ง
                      </button>
                    </div>
                  </div>

                  {/* 🌟 ตารางแสดงแผนก (คลิกเพื่อขยายดูตำแหน่งได้) */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                          <th style={{ padding: '12px', width: '40px' }}></th>
                          <th style={{ padding: '12px' }}>รหัสแผนก</th>
                          <th style={{ padding: '12px' }}>ชื่อแผนก</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>จำนวนตำแหน่ง</th>
                          <th style={{ padding: '12px', width:'80px', textAlign: 'center' }}>ลบแผนก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(d => (
                          <React.Fragment key={d.dept_code}>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: expandedDept === d.dept_code ? '#f0f9ff' : 'white', transition: '0.2s' }}>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => toggleDept(d.dept_code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}>
                                  {expandedDept === d.dept_code ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 'bold', color: '#d97706' }}>{d.dept_code}</td>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{d.dept_name}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                  {countPositionsInDept(d.dept_code)} ตำแหน่ง
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => handleDelete('dept', d.dept_code)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={18}/></button>
                              </td>
                            </tr>
                            
                            {/* 🌟 แสดงตำแหน่งลูกๆ เมื่อถูกขยาย */}
                            {expandedDept === d.dept_code && (
                              <tr>
                                <td colSpan="5" style={{ padding: 0 }}>
                                  <div style={{ backgroundColor: '#f8fafc', padding: '15px 15px 15px 50px', borderBottom: '1px solid #e2e8f0' }}>
                                    
                                    {positions.filter(p => p.dept_code === d.dept_code).length > 0 ? (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <thead>
                                          <tr style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                                            <th style={{ padding: '10px' }}>รหัสตำแหน่ง</th>
                                            <th style={{ padding: '10px' }}>ชื่อตำแหน่ง</th>
                                            <th style={{ padding: '10px', width: '80px', textAlign: 'center' }}>ลบตำแหน่ง</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {positions.filter(p => p.dept_code === d.dept_code).map(p => (
                                            <tr key={p.position_code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '10px', fontWeight: 'bold', color: '#7c3aed' }}>{p.position_code}</td>
                                              <td style={{ padding: '10px' }}>{p.position_name}</td>
                                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button onClick={() => handleDelete('position', p.position_code)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer' }}><Trash2 size={16}/></button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>-- ยังไม่มีตำแหน่งงานในแผนกนี้ --</div>
                                    )}

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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