import React, { useState, useEffect } from 'react';
import { Building2, Network, Briefcase, Plus, Save, Edit3, RefreshCw, ChevronDown, ChevronUp, Users, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const HRMResources = () => {
  const [activeTab, setActiveTab] = useState('branches'); 
  const [isLoading, setIsLoading] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // 🌟 Form States (เพิ่ม job_responsibilities เข้ามา)
  const [branchForm, setBranchForm] = useState({ branch_code: '', branch_name: '', country_code: 'TH' });
  const [deptForm, setDeptForm] = useState({ dept_code: '', dept_name: '' });
  const [positionForm, setPositionForm] = useState({ position_code: '', position_name: '', dept_code: '', base_salary: '', job_responsibilities: '' });

  const [editingBranch, setEditingBranch] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
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

  const handleSave = async (type, formData, setFormFn, initialForm, setEditingFn) => {
    if (type === 'branch' && !formData.branch_name) return alert('กรุณากรอกชื่อสาขา');
    if (type === 'department' && !formData.dept_name) return alert('กรุณากรอกชื่อแผนก');
    if (type === 'position' && (!formData.position_name || !formData.dept_code || !formData.base_salary)) return alert('กรุณากรอกข้อมูลตำแหน่งให้ครบ');

    try {
      const res = await fetch(`${API_URL}/api/hrm/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ บันทึกสำเร็จ! ${data.new_code ? `รหัสใหม่คือ: ${data.new_code}` : ''}`);
        setFormFn(initialForm); 
        if(setEditingFn) setEditingFn(null); 
        fetchData(); 
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const startEditBranch = (b) => {
    setEditingBranch(b.branch_code);
    setBranchForm({ branch_code: b.branch_code, branch_name: b.branch_name, country_code: b.country_code });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditDept = (d) => {
    setEditingDept(d.dept_code);
    setDeptForm({ dept_code: d.dept_code, dept_name: d.dept_name });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditPosition = (p) => {
    setEditingPosition(p.position_code);
    // 🌟 ดึงข้อมูลความรับผิดชอบมาแสดงตอนกดแก้ไข
    setPositionForm({ 
        position_code: p.position_code, 
        position_name: p.position_name, 
        dept_code: p.dept_code, 
        base_salary: p.base_salary,
        job_responsibilities: p.job_responsibilities || '' 
    });
    setExpandedDept(p.dept_code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDept = (deptCode) => {
      setExpandedDept(expandedDept === deptCode ? null : deptCode);
  };

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
        </div>

        <div style={{ padding: '25px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              {/* ==================== BRANCHES ==================== */}
              {activeTab === 'branches' && (
                <div>
                  <div style={{ backgroundColor: editingBranch ? '#fffbeb' : '#f0fdf4', border: `1px solid ${editingBranch ? '#fde68a' : '#bbf7d0'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: editingBranch ? '#d97706' : '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editingBranch ? <><Edit3 size={18} /> กำลังแก้ไขสาขา: {editingBranch}</> : <><Plus size={18} /> เพิ่มสาขาใหม่</>}
                        </h4>
                        {editingBranch && (
                            <button onClick={() => { setEditingBranch(null); setBranchForm({ branch_code: '', branch_name: '', country_code: 'TH' }); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}><X size={14}/> ยกเลิกการแก้ไข</button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <input type="text" placeholder="รหัสสาขา (Auto)" value={branchForm.branch_code} onChange={e => setBranchForm({...branchForm, branch_code: e.target.value.toUpperCase()})} disabled={!editingBranch} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', cursor: 'not-allowed', display: editingBranch ? 'block' : 'none' }} />
                      <input type="text" placeholder="ชื่อสาขา" value={branchForm.branch_name} onChange={e => setBranchForm({...branchForm, branch_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <select value={branchForm.country_code} onChange={e => setBranchForm({...branchForm, country_code: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="TH">ไทย (TH)</option>
                        <option value="LA">ลาว (LA)</option>
                      </select>
                      <button onClick={() => handleSave('branch', branchForm, setBranchForm, { branch_code: '', branch_name: '', country_code: 'TH' }, setEditingBranch)} style={{ backgroundColor: editingBranch ? '#d97706' : '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', padding: '10px' }}>
                        <Save size={16} /> {editingBranch ? 'บันทึกการแก้ไข' : 'บันทึกสาขาใหม่'}
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                      <thead><tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}><th style={{ padding: '12px' }}>รหัสสาขา</th><th style={{ padding: '12px' }}>ชื่อสาขา</th><th style={{ padding: '12px' }}>ประเทศ</th><th style={{ padding: '12px', width:'80px', textAlign: 'center' }}>แก้ไข</th></tr></thead>
                      <tbody>
                        {branches.map(b => (
                          <tr key={b.branch_code} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: editingBranch === b.branch_code ? '#fef3c7' : 'white' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#0ea5e9' }}>{b.branch_code}</td>
                            <td style={{ padding: '12px' }}>{b.branch_name}</td>
                            <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{b.country_code}</span></td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => startEditBranch(b)} style={{ background:'none', border:'none', color:'#eab308', cursor:'pointer' }}><Edit3 size={18}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== DEPARTMENTS & POSITIONS ==================== */}
              {activeTab === 'departments' && (
                <div>
                   
                   {/* 🌟 ฟอร์มเพิ่ม/แก้ไข แผนก */}
                   <div style={{ backgroundColor: editingDept ? '#f3e8ff' : '#fffbeb', border: `1px solid ${editingDept ? '#e9d5ff' : '#fde68a'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: editingDept ? '#7e22ce' : '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editingDept ? <><Edit3 size={18} /> กำลังแก้ไขแผนก: {editingDept}</> : <><Plus size={18} /> เพิ่มแผนกใหม่ (ระบบสร้างรหัสให้อัตโนมัติ)</>}
                        </h4>
                        {editingDept && (
                            <button onClick={() => { setEditingDept(null); setDeptForm({ dept_code: '', dept_name: '' }); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}><X size={14}/> ยกเลิกการแก้ไข</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <input type="text" placeholder="รหัสแผนก" value={deptForm.dept_code} disabled style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', cursor: 'not-allowed', display: editingDept ? 'block' : 'none' }} />
                      <input type="text" placeholder="ชื่อแผนก" value={deptForm.dept_name} onChange={e => setDeptForm({...deptForm, dept_name: e.target.value})} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <button onClick={() => handleSave('department', deptForm, setDeptForm, { dept_code: '', dept_name: '' }, setEditingDept)} style={{ backgroundColor: editingDept ? '#7e22ce' : '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', padding: '10px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                        <Save size={16} /> {editingDept ? 'บันทึกการแก้ไข' : 'บันทึกแผนกใหม่'}
                      </button>
                    </div>
                  </div>

                  {/* 🌟 ฟอร์มเพิ่ม/แก้ไข ตำแหน่ง */}
                  <div style={{ backgroundColor: editingPosition ? '#e0f2fe' : '#f5f3ff', border: `1px solid ${editingPosition ? '#bae6fd' : '#ddd6fe'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: editingPosition ? '#0369a1' : '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {editingPosition ? <><Edit3 size={18} /> กำลังแก้ไขตำแหน่ง: {editingPosition}</> : <><Plus size={18} /> เพิ่มตำแหน่งงานในแผนก (ระบบสร้างรหัสให้อัตโนมัติ)</>}
                        </h4>
                        {editingPosition && (
                            <button onClick={() => { setEditingPosition(null); setPositionForm({ position_code: '', position_name: '', dept_code: '', base_salary: '', job_responsibilities: '' }); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}><X size={14}/> ยกเลิกการแก้ไข</button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'center' }}>
                      <select value={positionForm.dept_code} onChange={e => setPositionForm({...positionForm, dept_code: e.target.value})} disabled={editingPosition !== null} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: editingPosition ? '#e2e8f0' : 'white' }}>
                        <option value="">-- เลือกสังกัดแผนก --</option>
                        {departments.map(d => <option key={d.dept_code} value={d.dept_code}>{d.dept_name}</option>)}
                      </select>
                      
                      <input type="text" placeholder="รหัสตำแหน่ง" value={positionForm.position_code} disabled style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', display: editingPosition ? 'block' : 'none' }} />
                      <input type="text" placeholder="ชื่อตำแหน่ง" value={positionForm.position_name} onChange={e => setPositionForm({...positionForm, position_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="number" placeholder="เงินเดือนเริ่มต้น" value={positionForm.base_salary} onChange={e => setPositionForm({...positionForm, base_salary: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      
                      {/* 🌟 ช่องกรอก หน้าที่ความรับผิดชอบ (ยาวเต็มบรรทัด) */}
                      <textarea 
                        placeholder="หน้าที่ความรับผิดชอบ (เช่น พัฒนาระบบ, ดูแลเซิร์ฟเวอร์, ประสานงานลูกค้า)" 
                        value={positionForm.job_responsibilities} 
                        onChange={e => setPositionForm({...positionForm, job_responsibilities: e.target.value})} 
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', gridColumn: '1 / -1', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }} 
                      />

                      <button onClick={() => handleSave('position', positionForm, setPositionForm, { position_code: '', position_name: '', dept_code: '', base_salary: '', job_responsibilities: '' }, setEditingPosition)} style={{ gridColumn: '1 / -1', backgroundColor: editingPosition ? '#0284c7' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', padding: '12px' }}>
                        <Save size={16} /> {editingPosition ? 'บันทึกการแก้ไข' : 'บันทึกตำแหน่งใหม่'}
                      </button>
                    </div>
                  </div>

                  {/* 🌟 ตารางแสดงแผนกและตำแหน่ง */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                          <th style={{ padding: '12px', width: '40px' }}></th>
                          <th style={{ padding: '12px' }}>รหัสแผนก</th>
                          <th style={{ padding: '12px' }}>ชื่อแผนก</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>จำนวนตำแหน่ง</th>
                          <th style={{ padding: '12px', width:'80px', textAlign: 'center' }}>แก้ไข</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(d => (
                          <React.Fragment key={d.dept_code}>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: expandedDept === d.dept_code ? '#f0f9ff' : (editingDept === d.dept_code ? '#f3e8ff' : 'white'), transition: '0.2s' }}>
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
                                <button onClick={() => startEditDept(d)} style={{ background:'none', border:'none', color:'#eab308', cursor:'pointer' }}><Edit3 size={18}/></button>
                              </td>
                            </tr>
                            
                            {expandedDept === d.dept_code && (
                              <tr>
                                <td colSpan="5" style={{ padding: 0 }}>
                                  <div style={{ backgroundColor: '#f8fafc', padding: '15px 15px 15px 50px', borderBottom: '1px solid #e2e8f0' }}>
                                    
                                    {positions.filter(p => p.dept_code === d.dept_code).length > 0 ? (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <thead>
                                          <tr style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                                            <th style={{ padding: '10px', width: '15%' }}>รหัสตำแหน่ง</th>
                                            <th style={{ padding: '10px', width: '45%' }}>ชื่อตำแหน่ง / ความรับผิดชอบ</th>
                                            <th style={{ padding: '10px', width: '20%' }}>เงินเดือนเริ่มต้น</th>
                                            <th style={{ padding: '10px', width: '20%', textAlign: 'center' }}>แก้ไข</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {positions.filter(p => p.dept_code === d.dept_code).map(p => (
                                            <tr key={p.position_code} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: editingPosition === p.position_code ? '#e0f2fe' : 'white' }}>
                                              <td style={{ padding: '10px', fontWeight: 'bold', color: '#7c3aed', verticalAlign: 'top' }}>{p.position_code}</td>
                                              <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{p.position_name}</div>
                                                  {p.job_responsibilities && (
                                                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                                                          {p.job_responsibilities}
                                                      </div>
                                                  )}
                                              </td>
                                              <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold', verticalAlign: 'top' }}>{Number(p.base_salary).toLocaleString()}</td>
                                              <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <button onClick={() => startEditPosition(p)} style={{ background:'none', border:'none', color:'#eab308', cursor:'pointer' }}><Edit3 size={16}/></button>
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