import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, MapPin, Search, Wallet, PieChart, CheckCircle2, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const PrizeTransferReport = () => {
  // ฟังก์ชันหาวันนี้ (YYYY-MM-DD)
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [countryTab, setCountryTab] = useState('all'); // 'all', 'Thailand', 'Laos'
  
  const [data, setData] = useState({
    monthly: { sales: 0, profit: 0 },
    period: { sales: 0, prizes: 0, profit: 0 },
    winners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, country: countryTab })
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลใหม่ทุกครั้งที่โหลดหน้าแรก หรือเปลี่ยนแท็บประเทศ
  useEffect(() => {
    fetchReport();
  }, [countryTab]);

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy size={28} color="#d97706" /> สรุปผลประกอบการและยอดผู้ถูกรางวัล
      </h2>
      
      {/* 🌟 1. กล่องสถิติสะสมรายเดือน (Monthly Stats) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', borderLeft: '6px solid #0ea5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายสะสม (เดือนนี้)</p>
              <h3 style={{ margin: 0, color: '#0ea5e9', fontSize: '28px' }}>{formatCurrency(data.monthly.sales)} <span style={{fontSize:'16px'}}>THB</span></h3>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '50%' }}>
              <TrendingUp size={28} color="#0ea5e9" />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', borderLeft: `6px solid ${data.monthly.profit >= 0 ? '#10b981' : '#ef4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>กำไรสุทธิสะสม (เดือนนี้)</p>
              <h3 style={{ margin: 0, color: data.monthly.profit >= 0 ? '#10b981' : '#ef4444', fontSize: '28px' }}>
                {formatCurrency(data.monthly.profit)} <span style={{fontSize:'16px'}}>THB</span>
              </h3>
            </div>
            <div style={{ backgroundColor: data.monthly.profit >= 0 ? '#dcfce7' : '#fee2e2', padding: '12px', borderRadius: '50%' }}>
              <Wallet size={28} color={data.monthly.profit >= 0 ? '#10b981' : '#ef4444'} />
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 2. ตัวกรอง ค้นหาวันที่ และ แท็บประเทศ */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold', fontSize: '14px' }}>
              <Calendar size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> 
              เลือกช่วงเวลาที่ต้องการดู
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }} 
              />
              <span style={{ color: '#94a3b8' }}>ถึง</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }} 
              />
              <button 
                onClick={fetchReport}
                disabled={isLoading}
                style={{ padding: '10px 20px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Search size={16} /> {isLoading ? 'กำลังโหลด...' : 'ค้นหา'}
              </button>
            </div>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
            {[ 
              { id: 'all', label: 'ทั้งหมด (All)', icon: <PieChart size={16} /> }, 
              { id: 'Thailand', label: 'ประเทศไทย (TH)', icon: <MapPin size={16} /> }, 
              { id: 'Laos', label: 'สปป.ลาว (LAK)', icon: <MapPin size={16} /> } 
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setCountryTab(tab.id)} 
                style={{ 
                  padding: '10px 18px', 
                  backgroundColor: countryTab === tab.id ? '#0ea5e9' : '#f1f5f9', 
                  color: countryTab === tab.id ? 'white' : '#64748b', 
                  border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                  display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🌟 3. สรุปยอดตามช่วงเวลาที่ค้นหา (Selected Period Stats) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: '#15803d', fontSize: '13px', fontWeight: 'bold' }}>ยอดขาย (ช่วงเวลาที่เลือก)</p>
          <h4 style={{ margin: 0, color: '#16a34a', fontSize: '22px' }}>{formatCurrency(data.period.sales)} ฿</h4>
        </div>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: '#b91c1c', fontSize: '13px', fontWeight: 'bold' }}>จ่ายรางวัล (ช่วงเวลาที่เลือก)</p>
          <h4 style={{ margin: 0, color: '#dc2626', fontSize: '22px' }}>- {formatCurrency(data.period.prizes)} ฿</h4>
        </div>
        <div style={{ backgroundColor: data.period.profit >= 0 ? '#fffbeb' : '#f1f5f9', border: `1px solid ${data.period.profit >= 0 ? '#fde68a' : '#cbd5e1'}`, padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 5px 0', color: data.period.profit >= 0 ? '#b45309' : '#475569', fontSize: '13px', fontWeight: 'bold' }}>คงเหลือกำไร (ช่วงเวลาที่เลือก)</p>
          <h4 style={{ margin: 0, color: data.period.profit >= 0 ? '#d97706' : '#64748b', fontSize: '22px' }}>{formatCurrency(data.period.profit)} ฿</h4>
        </div>
      </div>

      {/* 🌟 4. ตารางรายชื่อผู้ถูกรางวัล */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={20} color="#16a34a" /> รายชื่อลูกค้าที่ถูกรางวัล ({data.winners.length} รายการ)
        </h4>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px', whiteSpace: 'nowrap', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>วันที่ซื้อ</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้ (Username)</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ประเทศ</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ถูก</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ยอดแทง</th>
                <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>รับเงินรางวัล (เทียบ THB)</th>
              </tr>
            </thead>
            <tbody>
              {data.winners.length > 0 ? data.winners.map((w, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '12px 15px', color: '#64748b' }}>{new Date(w.created_at).toLocaleString('th-TH')}</td>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#1e293b' }}>{w.username}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ backgroundColor: w.country === 'Thailand' ? '#dbeafe' : '#fce7f3', color: w.country === 'Thailand' ? '#1d4ed8' : '#be185d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {w.country === 'Thailand' ? '🇹🇭 ไทย' : '🇱🇦 ลาว'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>{w.lottery_type} ตัว</td>
                  <td style={{ padding: '12px 15px', color: '#dc2626', fontWeight: 'bold', letterSpacing: '1px' }}>{w.selected_number}</td>
                  <td style={{ padding: '12px 15px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                  <td style={{ padding: '12px 15px', color: '#16a34a', fontWeight: 'bold' }}>
                    + {formatCurrency(w.prize_thb)} ฿
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <Search size={40} style={{ opacity: 0.2, margin: '0 auto 10px', display: 'block' }} />
                    ไม่พบข้อมูลผู้ถูกรางวัลในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PrizeTransferReport;