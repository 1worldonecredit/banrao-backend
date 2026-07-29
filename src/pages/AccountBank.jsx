import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Search, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const AccountBank = () => {
  const [bankRequests, setBankRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, Pending, Approved, Rejected

  // สมมติว่าเราดึงชื่อแอดมินที่ Login อยู่จาก localStorage
  const currentAdminName = "ซุปเปอร์ ผู้ดูแลระบบ"; 

  // 1. ดึงข้อมูลเมื่อเปิดหน้าจอ
// 1. ดึงข้อมูลเมื่อเปิดหน้าจอ & ตั้งค่า Auto-refresh
  useEffect(() => {
    fetchBankRequests(); // ดึงทันทีเมื่อเปิดหน้า
    
    // ตั้งเวลาให้แอบไปดึงข้อมูลใหม่ทุกๆ 10 วินาที (10000 มิลลิวินาที)
    const intervalId = setInterval(() => {
      fetchBankRequests();
    }, 10000); 

    // ทำลายวงจรเมื่อเปลี่ยนไปหน้าอื่น (ประหยัดแรม)
    return () => clearInterval(intervalId);
  }, []);

  const fetchBankRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/user-banks`);
      const result = await response.json();
      if (result.success) {
        setBankRequests(result.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. ฟังก์ชันตรวจสอบ (อนุมัติ / ปฏิเสธ)
  const handleUpdateStatus = async (id, userId, newStatus, accountName) => {
    let reason = accountName; // แนบชื่อบัญชีไปในแจ้งเตือน
    
    // ถ้าไม่ผ่าน ให้แอดมินพิมพ์เหตุผลแจ้งลูกค้า
    if (newStatus === 'Rejected') {
      const promptReason = window.prompt("ระบุเหตุผลที่ไม่ผ่าน (เพื่อแจ้งลูกค้า):", "ชื่อบัญชีไม่ตรงกับชื่อที่ลงทะเบียน");
      if (promptReason === null) return; // กดยกเลิก
      reason = promptReason;
    } else {
      const confirmApprove = window.confirm(`ยืนยันการอนุมัติบัญชีของ ${accountName} ใช่หรือไม่?`);
      if (!confirmApprove) return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/user-banks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          user_id: userId,
          admin_name: currentAdminName,
          reject_reason: reason
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert("บันทึกผลการตรวจสอบและแจ้งเตือนลูกค้าสำเร็จ!");
        fetchBankRequests(); // โหลดข้อมูลใหม่
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // ==========================================
  // การคำนวณ Dashboard (KPIs)
  // ==========================================
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    totalNewToday: bankRequests.filter(r => r.created_at && r.created_at.startsWith(today)).length,
    approved: bankRequests.filter(r => r.status === 'Approved').length,
    pending: bankRequests.filter(r => r.status === 'Pending').length,
  };

  // การกรองข้อมูลตาราง
  const filteredRequests = bankRequests.filter(req => {
    const matchFilter = filter === 'all' || req.status === filter;
    const matchSearch = (req.account_name || '').includes(searchTerm) || (req.account_number || '').includes(searchTerm);
    return matchFilter && matchSearch;
  });

  if (loading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      
      {/* 🌟 Header */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard size={28} color="#3b82f6" /> ตรวจสอบคำขอเพิ่มบัญชีธนาคาร
        </h2>
        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          ผู้ตรวจสอบระบบ: <strong style={{ color: '#0f172a' }}>{currentAdminName}</strong>
        </p>
      </div>

     {/* 🌟 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#2563eb', fontSize: '13px', fontWeight: 'bold' }}>คำขอใหม่ (วันนี้)</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '5px' }}>{stats.totalNewToday} <span style={{fontSize:'13px', fontWeight:'normal'}}>รายการ</span></div>
        </div>
        <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <div style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold' }}>รอตรวจสอบ (Pending)</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#92400e', marginTop: '5px' }}>{stats.pending} <span style={{fontSize:'13px', fontWeight:'normal'}}>รายการ</span></div>
        </div>
        <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <div style={{ color: '#16a34a', fontSize: '13px', fontWeight: 'bold' }}>ตรวจผ่านแล้ว (Approved)</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#14532d', marginTop: '5px' }}>{stats.approved} <span style={{fontSize:'13px', fontWeight:'normal'}}>รายการ</span></div>
        </div>
      </div>

      {/* 🌟 ตารางข้อมูล */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: filter === 'all' ? '#1e293b' : 'white', color: filter === 'all' ? 'white' : 'black', cursor: 'pointer' }}>ทั้งหมด</button>
            <button onClick={() => setFilter('Pending')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fde68a', background: filter === 'Pending' ? '#f59e0b' : 'white', color: filter === 'Pending' ? 'white' : 'black', cursor: 'pointer' }}>รอตรวจสอบ</button>
            <button onClick={() => setFilter('Approved')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', background: filter === 'Approved' ? '#10b981' : 'white', color: filter === 'Approved' ? 'white' : 'black', cursor: 'pointer' }}>ผ่าน</button>
            <button onClick={() => setFilter('Rejected')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', background: filter === 'Rejected' ? '#ef4444' : 'white', color: filter === 'Rejected' ? 'white' : 'black', cursor: 'pointer' }}>ไม่ผ่าน</button>
          </div>
          
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อบัญชี หรือ เลขบัญชี..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>ชื่อลูกค้า</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>ข้อมูลบัญชี (ชื่อ/เลขที่)</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>วันที่ทำรายการ</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>การตรวจสอบ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map(req => (
                <tr key={req.user_bank_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{req.firstname} {req.lastname}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>User ID: {req.user_id}</div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{req.account_name}</div>
                    <div style={{ color: '#475569' }}>{req.account_number} ({req.currency_code})</div>
                  </td>
                  <td style={{ padding: '15px', color: '#64748b' }}>
                    {new Date(req.created_at).toLocaleString('th-TH')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {req.status === 'Pending' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}><AlertCircle size={12} style={{marginRight:'4px'}}/> รอตรวจ</span>}
                    {req.status === 'Approved' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#d1fae5', color: '#059669', fontSize: '12px', fontWeight: 'bold' }}><CheckCircle size={12} style={{marginRight:'4px'}}/> ผ่าน</span>}
                    {req.status === 'Rejected' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}><XCircle size={12} style={{marginRight:'4px'}}/> ไม่ผ่าน</span>}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {req.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleUpdateStatus(req.user_bank_id, req.user_id, 'Approved', req.account_name)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> ผ่าน
                        </button>
                        <button onClick={() => handleUpdateStatus(req.user_bank_id, req.user_id, 'Rejected', req.account_name)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} /> ไม่ผ่าน
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>ตรวจแล้ว</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>ไม่มีรายการคำขอในสถานะนี้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountBank;