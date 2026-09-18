import React, { useState, useEffect } from 'react';
import { 
  Users, Wallet, TrendingUp, TrendingDown, 
  Activity, Award, DollarSign, AlertCircle, CheckCircle 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const Dashboard = () => {
  // States สำหรับเก็บข้อมูลแต่ละหมวด
  const [userStats, setUserStats] = useState(null);
  const [finStats, setFinStats] = useState(null);
  const [lotteryStats, setLotteryStats] = useState(null);

  // ดึงข้อมูลเมื่อโหลดหน้า
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, finRes, lottoRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard/users-summary`).then(res => res.json()),
          fetch(`${API_URL}/api/admin/dashboard/financial-summary`).then(res => res.json()),
          fetch(`${API_URL}/api/admin/dashboard/lottery-summary`).then(res => res.json())
        ]);

        if (usersRes.success) setUserStats(usersRes.data);
        if (finRes.success) setFinStats(finRes.data);
        if (lottoRes.success) setLotteryStats(lottoRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
    // Refresh ทุกๆ 30 วินาที
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // 🌟 ฟังก์ชันจัดการสไตล์ Glassmorphism (กระจกโปร่งแสง)
  // ==========================================
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.08)', // พื้นหลังขาวโปร่งแสง
    backdropFilter: 'blur(16px)',            // เอฟเฟกต์กระจกเบลอ
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.15)', // ขอบการ์ดบางๆ
    borderRadius: '16px',
    padding: '24px',
    color: '#ffffff', // ตัวอักษรสีขาว
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* 🟢 แถวที่ 1: ข้อมูลผู้ใช้งาน และสกุลเงิน */}
      <h2 style={{ color: '#fff', marginBottom: '20px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>ภาพรวมผู้ใช้งาน</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* การ์ดรวมผู้ใช้ */}
        <div style={{ ...glassCardStyle, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ลูกค้าทั้งหมดในระบบ</div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px', color: '#60a5fa' }}><Users size={24} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '32px' }}>{userStats?.totalUsers?.toLocaleString() || '...'} <span style={{fontSize: '16px', color: 'rgba(255,255,255,0.5)'}}>คน</span></h3>
        </div>

        {/* การ์ดแยกสกุลเงิน */}
        <div style={{ ...glassCardStyle, borderLeft: '4px solid #10b981', gridColumn: 'span 2' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>สัดส่วนลูกค้าแยกตามสกุลเงิน</div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '10px', color: '#34d399' }}><Wallet size={24} /></div>
          </div>
          <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
             <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>เงินบาท (THB)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userStats?.currencies?.THB?.toLocaleString() || '0'} <span style={{fontSize: '12px', fontWeight: 'normal'}}>คน</span></div>
             </div>
             <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>เงินกีบ (LAK)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userStats?.currencies?.LAK?.toLocaleString() || '0'} <span style={{fontSize: '12px', fontWeight: 'normal'}}>คน</span></div>
             </div>
             <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>ดอลลาร์ (USD)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userStats?.currencies?.USD?.toLocaleString() || '0'} <span style={{fontSize: '12px', fontWeight: 'normal'}}>คน</span></div>
             </div>
          </div>
        </div>
      </div>

      {/* 🟡 แถวที่ 2: ข้อมูลการเงิน และ P2P (รายวัน) */}
      <h2 style={{ color: '#fff', marginBottom: '20px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>ธุรกรรมการเงินรายวัน (P2P)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* P2P ฝากเงิน */}
        <div style={{ ...glassCardStyle, borderTop: '4px solid #14b8a6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 'bold' }}>คำขอฝากเงิน P2P</div>
            <TrendingUp size={24} color="#2dd4bf" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><CheckCircle size={14}/> สำเร็จ</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{finStats?.p2p?.deposit?.success || '0'}</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><AlertCircle size={14}/> ไม่สำเร็จ</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{finStats?.p2p?.deposit?.failed || '0'}</div>
             </div>
             <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>ยอดรวม (THB)</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2dd4bf' }}>฿{finStats?.p2p?.deposit?.amount_thb?.toLocaleString() || '0'}</div>
             </div>
          </div>
        </div>

        {/* P2P ถอนเงิน */}
        <div style={{ ...glassCardStyle, borderTop: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 'bold' }}>คำขอถอนเงิน P2P</div>
            <TrendingDown size={24} color="#fb7185" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><CheckCircle size={14}/> สำเร็จ</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{finStats?.p2p?.withdraw?.success || '0'}</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}><AlertCircle size={14}/> ไม่สำเร็จ</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{finStats?.p2p?.withdraw?.failed || '0'}</div>
             </div>
             <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>ยอดรวม (THB)</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fb7185' }}>฿{finStats?.p2p?.withdraw?.amount_thb?.toLocaleString() || '0'}</div>
             </div>
          </div>
        </div>

      </div>

      {/* 🔴 แถวที่ 3: สถิติหวย กำไร-ขาดทุน */}
      <h2 style={{ color: '#fff', marginBottom: '20px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>สถิติยอดขายหวย และ กำไร-ขาดทุน (รายวัน)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* หวยไทย */}
        <div style={{ ...glassCardStyle, borderTop: '4px solid #facc15' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold' }}>
              <Award color="#facc15" /> หวยไทย
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ยอดขายวันนี้:</span>
              <span style={{ fontWeight: 'bold' }}>฿{lotteryStats?.thaiLottery?.sales?.toLocaleString() || '0'}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ผู้ถูกรางวัล:</span>
              <span style={{ fontWeight: 'bold', color: '#facc15' }}>{lotteryStats?.thaiLottery?.winnersCount || '0'} คน</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>กำไรสุทธิ:</span>
              <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#4ade80' }}>+฿{lotteryStats?.thaiLottery?.profit?.toLocaleString() || '0'}</span>
           </div>
        </div>

        {/* หวยลาว */}
        <div style={{ ...glassCardStyle, borderTop: '4px solid #c084fc' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold' }}>
              <Award color="#c084fc" /> หวยลาว
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ยอดขายวันนี้:</span>
              <span style={{ fontWeight: 'bold' }}>฿{lotteryStats?.laosLottery?.sales?.toLocaleString() || '0'}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ผู้ถูกรางวัล:</span>
              <span style={{ fontWeight: 'bold', color: '#c084fc' }}>{lotteryStats?.laosLottery?.winnersCount || '0'} คน</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>กำไรสุทธิ:</span>
              <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#4ade80' }}>+฿{lotteryStats?.laosLottery?.profit?.toLocaleString() || '0'}</span>
           </div>
        </div>

        {/* หวยยี่กี */}
        <div style={{ ...glassCardStyle, borderTop: '4px solid #ff7c43' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold' }}>
              <Activity color="#ff7c43" /> หวยซุปเปอร์ยี่กี
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ยอดขายวันนี้:</span>
              <span style={{ fontWeight: 'bold' }}>฿{lotteryStats?.yeekiLottery?.sales?.toLocaleString() || '0'}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>ผู้ถูกรางวัล:</span>
              <span style={{ fontWeight: 'bold', color: '#ff7c43' }}>{lotteryStats?.yeekiLottery?.winnersCount || '0'} คน</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>กำไรสุทธิ:</span>
              <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#4ade80' }}>+฿{lotteryStats?.yeekiLottery?.profit?.toLocaleString() || '0'}</span>
           </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;