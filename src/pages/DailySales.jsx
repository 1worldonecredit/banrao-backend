import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySales = () => {
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState({ dailyTotal: 0, monthlyTotal: 0, dailyPayout: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // ดึงข้อมูลเมื่อเปิดหน้า หรือเปลี่ยนวันที่
  useEffect(() => {
    fetchDailySales();
  }, [selectedDate]);

  const fetchDailySales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-sales?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setSalesData(data.salesDetails);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // แยกรายการที่ถูกรางวัลออกมา เพื่อดูง่ายๆ เวลาโอนเงิน
  const winnersList = salesData.filter(item => item.status === 'ถูกรางวัล');

  // ฟังก์ชันจัดสีสถานะบิล
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ถูกรางวัล':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> ถูกรางวัล</span>;
      case 'ไม่ถูกรางวัล':
      case 'ไม่ถูก':
        return <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> ไม่ถูกรางวัล</span>;
      default:
        return <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> รอผลตรวจ</span>;
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* 🌟 Header & Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>รายงานยอดขายรายวัน</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>สรุปยอดซื้อและรายการถูกรางวัลประจำวัน</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Calendar size={18} color="#64748b" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 'bold', cursor: 'pointer' }}
          />
        </div>
      </div>
      
      {/* 🌟 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #0ea5e9', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายวันนี้</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {summary.dailyTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '50%' }}>
              <DollarSign color="#0ea5e9" size={24} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #8b5cf6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายสะสมเดือนนี้</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {summary.monthlyTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
            </div>
            <div style={{ backgroundColor: '#ede9fe', padding: '10px', borderRadius: '50%' }}>
              <Calendar color="#8b5cf6" size={24} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดจ่ายเงินรางวัลวันนี้</p>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>฿ {summary.dailyPayout.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '10px', borderRadius: '50%' }}>
              <Award color="#10b981" size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* 🌟 รายชื่อผู้ถูกรางวัล (โชว์เฉพาะถ้ามีคนถูกรางวัล) */}
      {winnersList.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Gift size={20} /> รายชื่อผู้ถูกรางวัลประจำวัน (เตรียมโอนเงิน)
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ผู้ซื้อ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ประเภท / เลขที่ถูก</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>เงินรางวัลที่ได้</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {winnersList.map((winner, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{winner.username}</td>
                    <td style={{ padding: '12px' }}>หวย {winner.lottery_type} ตัว <span style={{ color: '#dc2626', fontWeight: 'bold', marginLeft: '5px' }}>[{winner.selected_number}]</span></td>
                    <td style={{ padding: '12px' }}>{winner.price.toLocaleString()} {winner.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {winner.prize_amount.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        โอนเงินเข้า Wallet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 ตารางยอดขายทั้งหมด */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '16px' }}>รายการซื้อหวยทั้งหมด ({selectedDate})</h4>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : salesData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีรายการขายในวันที่เลือก</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เวลาซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ซื้อ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดเงิน</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((sale) => (
                  <tr key={sale.item_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '12px', color: '#64748b' }}>{sale.buy_time}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{sale.username}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{sale.selected_number}</td>
                    <td style={{ padding: '12px' }}>{sale.lottery_type} ตัว</td>
                    <td style={{ padding: '12px' }}>{sale.price.toLocaleString()} <span style={{ color: '#94a3b8', fontSize: '12px' }}>{sale.currency_code}</span></td>
                    <td style={{ padding: '12px' }}>{getStatusBadge(sale.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DailySales;