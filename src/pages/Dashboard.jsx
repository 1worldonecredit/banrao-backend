import React, { useState, useEffect } from 'react';
import {
  Users, Home, MapPin, Building2, Map,
  CheckCircle2, RefreshCw, ShieldCheck, Layers
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/dashboard/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setLastUpdated(new Date().toLocaleTimeString('th-TH'));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // คำนวณเปอร์เซ็นต์ความคืบหน้าตำบลที่มีหมู่บ้านแล้ว
  const tambonProgress = stats?.total_tambons
    ? Math.min(100, ((stats.tambons_with_villages / stats.total_tambons) * 100)).toFixed(1)
    : 0;

  // ==========================================
  // สไตล์ Glassmorphism (กระจกใสโปร่งแสง)
  // ==========================================
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '18px',
    padding: '22px',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s ease, border-color 0.2s ease'
  };

  const iconBoxStyle = (bg, color) => ({
    backgroundColor: bg,
    color: color,
    padding: '10px',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ส่วนหัวต้อนรับ + ปุ่มรีเฟรช */}
      <div style={{
        ...glassCardStyle,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(16, 185, 129, 0.12))',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            <ShieldCheck size={16} /> BAN RAO ADMIN PORTAL
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#fff' }}>
            สวัสดี, {userData?.full_name || 'ผู้ดูแลระบบ'}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
            ภาพรวมข้อมูลประชากร ครัวเรือน และโครงสร้างเขตการปกครองทั้งประเทศ
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          {lastUpdated ? `อัปเดตล่าสุด ${lastUpdated}` : 'กำลังโหลด...'}
        </button>
      </div>

      {/* แถวที่ 1: ภาพรวมประชากรและครัวเรือน */}
      <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={18} color="#60a5fa" /> ข้อมูลผู้ใช้งานและครัวเรือน
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* บัญชีผู้ใช้งาน */}
        <div style={{ ...glassCardStyle, borderTop: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>บัญชีผู้ใช้ในระบบ</span>
            <div style={iconBoxStyle('rgba(59, 130, 246, 0.2)', '#60a5fa')}><Users size={20} /></div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800' }}>
            {stats?.total_accounts?.toLocaleString() ?? '...'}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', marginLeft: '6px' }}>บัญชี</span>
          </div>
          <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> ใช้งานปกติ {stats?.active_accounts?.toLocaleString() ?? 0} บัญชี
          </div>
        </div>

        {/* จำนวนครัวเรือน */}
        <div style={{ ...glassCardStyle, borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>บ้านเลขที่ / ครัวเรือน</span>
            <div style={iconBoxStyle('rgba(16, 185, 129, 0.2)', '#34d399')}><Home size={20} /></div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800' }}>
            {stats?.total_households?.toLocaleString() ?? '...'}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', marginLeft: '6px' }}>หลังคาเรือน</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
            ข้อมูลบ้านเลขที่ที่บันทึกในระบบแล้ว
          </div>
        </div>

        {/* สมาชิกในครัวเรือน */}
        <div style={{ ...glassCardStyle, borderTop: '3px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ประชากรในครัวเรือน</span>
            <div style={iconBoxStyle('rgba(168, 85, 247, 0.2)', '#c084fc')}><Layers size={20} /></div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800' }}>
            {stats?.total_members?.toLocaleString() ?? '...'}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', marginLeft: '6px' }}>คน</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
            รวมข้อมูลสมาชิกทั้งหมดทุกหมู่บ้าน
          </div>
        </div>
      </div>

      {/* แถวที่ 2: โครงสร้างเขตการปกครอง (Master Data) */}
      <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={18} color="#fbbf24" /> โครงสร้างเขตการปกครอง (Master Data)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...glassCardStyle, borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>จังหวัดทั้งหมด</span>
            <Building2 size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{stats?.total_provinces?.toLocaleString() ?? '...'}</div>
        </div>

        <div style={{ ...glassCardStyle, borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>อำเภอทั้งหมด</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{stats?.total_amphures?.toLocaleString() ?? '...'}</div>
        </div>

        <div style={{ ...glassCardStyle, borderLeft: '4px solid #34d399' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>ตำบลทั้งหมด</span>
            <MapPin size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800' }}>{stats?.total_tambons?.toLocaleString() ?? '...'}</div>
        </div>

        <div style={{ ...glassCardStyle, borderLeft: '4px solid #fbbf24' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>หมู่บ้านในระบบ</span>
            <Home size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#fde047' }}>{stats?.total_villages?.toLocaleString() ?? '...'}</div>
        </div>
      </div>

      {/* การ์ดแถบความคืบหน้าการเพิ่มข้อมูลหมู่บ้าน */}
      <div style={glassCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
            ความคืบหน้าการเพิ่มฐานข้อมูลหมู่บ้านรายตำบล
          </span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#34d399' }}>
            {stats?.tambons_with_villages?.toLocaleString() ?? 0} / {stats?.total_tambons?.toLocaleString() ?? 0} ตำบล ({tambonProgress}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            width: `${tambonProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            borderRadius: '999px',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;