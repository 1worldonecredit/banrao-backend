import React, { useState, useEffect } from 'react';
// 🌟 เพิ่ม Icon UserCheck และ MapPin สำหรับกล่องทดสอบ DB
import { ArrowDownCircle, ArrowUpCircle, UserCheck, MapPin } from 'lucide-react'; 
const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const Dashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);
  
  // 🌟 1. สร้าง State สำหรับรับค่า ชื่อ และ ประเทศ จาก Database
  const [dbTestName, setDbTestName] = useState('กำลังโหลด...');
  const [dbTestCountry, setDbTestCountry] = useState('กำลังโหลด...');

  useEffect(() => {
    // โหลดแค่ "จำนวน" มาโชว์ในกล่อง Dashboard (โค้ดเดิมของคุณ)
    fetch(`${API_URL}/api/admin/pending-deposits`)
      .then(res => res.json())
      .then(data => { 
        if (data.success) setPendingCount(data.transactions.length); 
      })
      .catch(err => console.error("Error fetching pending deposits:", err));

    // 🌟 2. ฟังก์ชันทดสอบดึง ชื่อ และ ประเทศ จาก Database
    fetch(`${API_URL}/api/admin/test-db-connection`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // นำ firstname และ lastname มารวมกัน
          const fullName = `${data.data.firstname || ''} ${data.data.lastname || ''}`.trim();
          setDbTestName(fullName !== '' ? fullName : 'ไม่มีชื่อในระบบ');
          setDbTestCountry(data.data.country || 'ไม่ระบุประเทศ');
        } else {
          setDbTestName('ไม่พบข้อมูล');
          setDbTestCountry('ไม่พบข้อมูล');
        }
      })
      .catch(err => {
        console.error("Error testing DB connection:", err);
        setDbTestName('เชื่อมต่อ DB ล้มเหลว');
        setDbTestCountry('เชื่อมต่อ DB ล้มเหลว');
      });
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#ecefe7' }}>ภาพรวมระบบ (Overview)</h2>
      
      {/* 🌟 3. กล่อง UI แสดงผลลัพธ์การทดสอบ Database */}
      <div style={{ backgroundColor: '#f0fdf4', padding: '15px 20px', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', gap: '30px', marginBottom: '25px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold' }}>
          <UserCheck size={20} /> ทดสอบดึงชื่อ DB: <span style={{ color: '#15803d', fontWeight: 'normal' }}>{dbTestName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold' }}>
          <MapPin size={20} /> ประเทศ: <span style={{ color: '#15803d', fontWeight: 'normal' }}>{dbTestCountry}</span>
        </div>
      </div>

      {/* 🌟 ปรับ gridTemplateColumns ให้เป็น Responsive (หดตามจออัตโนมัติ) (โค้ดเดิมของคุณ) */}
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