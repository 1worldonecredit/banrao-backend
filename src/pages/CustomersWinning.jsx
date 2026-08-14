import React, { useState, useEffect } from 'react';
import { Calendar, Search, Trophy, DollarSign, User, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CustomersWinning = () => {
  // ==========================================
  // 🌟 1. State จัดการข้อมูล
  // ==========================================
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  // ประเภทหวยสำหรับทำปุ่ม Tab
  const lotteryTypes = ['ทั้งหมด', '6 ตัว', '4 ตัวท้าย', '3 ตัวบน', '3 ตัวโต๊ด', '2 ตัวบน', '2 ตัวล่าง', 'วิ่งบน', 'วิ่งล่าง'];

  // ==========================================
  // 🌟 2. ดึงข้อมูลจาก API (ย้อนหลังตามวันที่)
  // ==========================================
  const fetchWinners = async (date) => {
    setIsLoading(true);
    try {
      // ⚠️ หมายเหตุ: รบกวนเจ้านายเตรียม API เส้นนี้ที่ Backend สำหรับดึงข้อมูลรายชื่อคนถูกรางวัลหวยเวียดนามตามวันที่นะครับ
      const response = await fetch(`${API_URL}/api/admin/vietnam-winners?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setWinners(data.winners || []);
      } else {
        setWinners([]);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
      setWinners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners(selectedDate);
  }, [selectedDate]);

  // ==========================================
  // 🌟 3. คำนวณและกรองข้อมูล
  // ==========================================
  const filteredWinners = activeTab === 'ทั้งหมด' 
    ? winners 
    : winners.filter(w => w.lottery_type === activeTab);

  const totalPayoutTHB = filteredWinners
    .filter(w => w.currency_code === 'THB')
    .reduce((sum, w) => sum + (Number(w.prize_amount) || 0), 0);
    
  const totalPayoutLAK = filteredWinners
    .filter(w => w.currency_code === 'LAK')
    .reduce((sum, w) => sum + (Number(w.prize_amount) || 0), 0);

  // ==========================================
  // 🌟 4. UI หน้าจอแสดงผล
  // ==========================================
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ส่วนหัวและตัวเลือกวันที่ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={28} color="#eab308" />
          รายงานลูกค้าถูกรางวัล (หวยเวียดนาม)
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ color: '#475569', fontWeight: 'bold' }}>เลือกวันที่:</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px 8px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => fetchWinners(selectedDate)}
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Search size={16} /> ค้นหา
          </button>
        </div>
      </div>

      {/* กล่องสรุปยอดรวม */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#22c55e', padding: '12px', borderRadius: '50%' }}>
            <User size={24} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, color: '#166534', fontSize: '14px' }}>จำนวนผู้ชนะ (ตามหมวดที่เลือก)</p>
            <h3 style={{ margin: '5px 0 0 0', color: '#15803d', fontSize: '24px' }}>{filteredWinners.length} <span style={{fontSize:'16px'}}>บิล</span></h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef08a', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#eab308', padding: '12px', borderRadius: '50%' }}>
            <DollarSign size={24} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, color: '#854d0e', fontSize: '14px' }}>ยอดจ่ายรางวัลรวม</p>
            <h3 style={{ margin: '5px 0 0 0', color: '#a16207', fontSize: '20px' }}>
              {new Intl.NumberFormat('th-TH').format(totalPayoutTHB)} THB 
              <span style={{ margin: '0 10px', color: '#d97706' }}>|</span> 
              {new Intl.NumberFormat('th-TH').format(totalPayoutLAK)} LAK
            </h3>
          </div>
        </div>
      </div>

      {/* ส่วนเนื้อหาหลัก */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* แถบ Tabs สำหรับกรองประเภทรางวัล */}
        <div style={{ display: 'flex', gap: '10px', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', overflowX: 'auto' }}>
          {lotteryTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              style={{
                padding: '8px 16px',
                border: activeTab === type ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                backgroundColor: activeTab === type ? '#eff6ff' : 'white',
                color: activeTab === type ? '#2563eb' : '#64748b',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: activeTab === type ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ตารางแสดงรายชื่อ */}
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              กำลังโหลดข้อมูล...
            </div>
          ) : filteredWinners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={40} color="#cbd5e1" />
              <p>ไม่พบรายชื่อผู้ถูกรางวัลในวันที่ {selectedDate}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px' }}>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้ (Username)</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ประเภทหวย</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ถูก</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>ยอดแทง</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0' }}>รางวัลที่ได้รับ</th>
                  <th style={{ padding: '12px 15px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredWinners.map((winner, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px', color: '#1e293b', fontWeight: '500' }}>{winner.username || '-'}</td>
                    <td style={{ padding: '15px', color: '#64748b' }}>{winner.lottery_type}</td>
                    <td style={{ padding: '15px', color: '#ef4444', fontWeight: 'bold' }}>{winner.selected_number}</td>
                    <td style={{ padding: '15px', color: '#64748b' }}>
                      {new Intl.NumberFormat('th-TH').format(winner.price)} {winner.currency_code}
                    </td>
                    <td style={{ padding: '15px', color: '#16a34a', fontWeight: 'bold' }}>
                      + {new Intl.NumberFormat('th-TH').format(winner.prize_amount)} {winner.currency_code}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        <CheckCircle size={12} /> {winner.status || 'จ่ายแล้ว'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomersWinning;