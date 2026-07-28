import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // โหลดแค่ "จำนวน" มาโชว์ในกล่อง Dashboard
    fetch(`${API_URL}/api/admin/pending-deposits`)
      .then(res => res.json())
      .then(data => { 
        if (data.success) setPendingCount(data.transactions.length); 
      })
      .catch(err => console.error("Error fetching pending deposits:", err));
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>ภาพรวมระบบ (Overview)</h2>
      
      {/* 🌟 ปรับ gridTemplateColumns ให้เป็น Responsive (หดตามจออัตโนมัติ) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '10px', color: '#16a34a' }}><ArrowDownCircle size={32} /></div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>รอตรวจสอบฝากเงิน</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#1e293b' }}>{pendingCount} <span style={{fontSize:'16px', color:'#94a3b8'}}>รายการ</span></h3>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '10px', color: '#dc2626' }}><ArrowUpCircle size={32} /></div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>คำขอถอนเงิน</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#1e293b' }}>0 <span style={{fontSize:'16px', color:'#94a3b8'}}>รายการ</span></h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;