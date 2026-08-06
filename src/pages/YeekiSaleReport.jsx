import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle, Wallet, Users, Trophy, Ban, PlayCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const YeekiSaleReport = () => {
  const [roundsData, setRoundsData] = useState([]);
  const [overallTotal, setOverallTotal] = useState({ thb: 0, lak: 0 });
  const [activeRoundTotal, setActiveRoundTotal] = useState({ thb: 0, lak: 0 });
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki/sales-report`);
      const data = await res.json();
      
      if (data.success) {
        setRoundsData(data.rounds);
        setOverallTotal(data.overallTotal);
        setActiveRoundTotal(data.activeRoundTotal);
        
        // ถ้ายากโหลดครั้งแรก ให้หาแท็บที่กำลังเปิดรับแทงอยู่เป็นค่าเริ่มต้น
        if (isLoading) {
          const currentOpen = data.rounds.find(r => r.status === 'open' || r.status === 'upcoming');
          if (currentOpen) setActiveTab(currentOpen.round_number);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // สั่งให้ดึงข้อมูลใหม่ทุกๆ 10 วินาที (Real-time)
    const interval = setInterval(fetchReportData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const currentRound = roundsData.find(r => r.round_number === activeTab);

  return (
    <div style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={28} color="#db2777" /> รายงานขาย หวยจับยี่กี (เรียลไทม์)
        </h2>
        <button onClick={fetchReportData} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </div>
      
      {/* ========================================== */}
      {/* 🌟 ส่วนที่ 1: กล่องสรุปยอดขาย (Top Summary) */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        {/* ยอดรวมทั้งวัน */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #db2777', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายรวมวันนี้ (ทุกรอบ)</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
              <h3 style={{ margin: 0, color: '#9d174d', fontSize: '24px' }}>{formatCurrency(overallTotal.thb)} ฿</h3>
              <h3 style={{ margin: '5px 0 0 0', color: '#be185d', fontSize: '18px' }}>{formatCurrency(overallTotal.lak)} ₭</h3>
            </div>
            <Wallet size={36} color="#fbcfe8" />
          </div>
        </div>

        {/* ยอดรวมรอบที่กำลังเปิด */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายรอบที่กำลังเปิดรับแทง</p>
          {activeRoundTotal.thb > 0 || activeRoundTotal.lak > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <h3 style={{ margin: 0, color: '#047857', fontSize: '24px' }}>{formatCurrency(activeRoundTotal.thb)} ฿</h3>
                <h3 style={{ margin: '5px 0 0 0', color: '#059669', fontSize: '18px' }}>{formatCurrency(activeRoundTotal.lak)} ₭</h3>
              </div>
              <PlayCircle size={36} color="#d1fae5" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', height: '50px', color: '#94a3b8', fontSize: '14px' }}>
              กำลังรอเปิดรอบใหม่ หรือยังไม่มียอดขาย
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>กำลังโหลดข้อมูลรายงาน...</div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          
          {/* ========================================== */}
          {/* 🌟 ส่วนที่ 2: แถบ Tabs 24 รอบ */}
          {/* ========================================== */}
          <div style={{ display: 'flex', overflowX: 'auto', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 10px 0 10px', scrollbarWidth: 'thin' }}>
            {roundsData.map((r) => (
              <button
                key={r.round_number}
                onClick={() => setActiveTab(r.round_number)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === r.round_number ? 'white' : 'transparent',
                  border: 'none',
                  borderTopLeftRadius: '8px',
                  borderTopRightRadius: '8px',
                  borderTop: activeTab === r.round_number ? '3px solid #db2777' : '3px solid transparent',
                  borderLeft: activeTab === r.round_number ? '1px solid #e2e8f0' : 'none',
                  borderRight: activeTab === r.round_number ? '1px solid #e2e8f0' : 'none',
                  color: activeTab === r.round_number ? '#db2777' : '#64748b',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                รอบที่ {r.round_number}
                <span style={{ fontSize: '10px', color: r.status === 'open' ? '#10b981' : r.status === 'ended' ? '#ef4444' : '#94a3b8', padding: '2px 6px', borderRadius: '10px', backgroundColor: r.status === 'open' ? '#d1fae5' : r.status === 'ended' ? '#fee2e2' : '#f1f5f9' }}>
                  {r.status === 'open' ? 'เปิดรับ' : r.status === 'ended' ? 'ปิดแล้ว' : 'รอเปิด'}
                </span>
              </button>
            ))}
          </div>

          {/* ========================================== */}
          {/* 🌟 ส่วนที่ 3: เนื้อหาของแต่ละรอบ (ตารางและผลรางวัล) */}
          {/* ========================================== */}
          {currentRound && (
            <div style={{ padding: '20px' }}>
              
              {/* ข้อมูลหัวรอบ และ ผลรางวัล */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', backgroundColor: '#fdf2f8', padding: '15px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#9d174d' }}>ข้อมูลรอบที่ {currentRound.round_number}</h3>
                  <div style={{ fontSize: '13px', color: '#475569', display: 'flex', gap: '20px' }}>
                    <span>เวลาเปิด: <strong>{currentRound.open_time}</strong></span>
                    <span>ปิดรับแทง: <strong style={{ color: '#ef4444' }}>{currentRound.close_time}</strong></span>
                    <span>เวลาออกผล: <strong>{currentRound.draw_time}</strong></span>
                  </div>
                </div>

                {currentRound.status === 'ended' && currentRound.winning_result ? (
                  <div style={{ backgroundColor: '#fffbeb', padding: '10px 20px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>ผลรางวัลที่ออก</p>
                    <h2 style={{ margin: 0, color: '#d97706', letterSpacing: '2px' }}>{currentRound.winning_result}</h2>
                  </div>
                ) : currentRound.status === 'open' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold' }}>
                    <PlayCircle size={20} /> กำลังเปิดรับแทง...
                  </div>
                ) : (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 'bold' }}>
                    <Clock size={20} /> ยังไม่ออกผลรางวัล
                  </div>
                )}
              </div>

              {/* สรุปยอดขายของรอบนี้ */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0369a1', fontWeight: 'bold' }}>ยอดขายรอบนี้ (THB)</span>
                  <span style={{ color: '#0284c7', fontSize: '20px', fontWeight: '900' }}>{formatCurrency(currentRound.total_thb)} ฿</span>
                </div>
                <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขายรอบนี้ (LAK)</span>
                  <span style={{ color: '#15803d', fontSize: '20px', fontWeight: '900' }}>{formatCurrency(currentRound.total_lak)} ₭</span>
                </div>
              </div>

              {/* ตารางรายการบิล */}
              <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> รายการสั่งซื้อ (บิลลูกค้า)
              </h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '12px', width: '15%' }}>ผู้ใช้ (Username)</th>
                      <th style={{ padding: '12px', width: '20%' }}>ประเภท</th>
                      <th style={{ padding: '12px', width: '15%' }}>ตัวเลข</th>
                      <th style={{ padding: '12px', width: '15%', textAlign: 'right' }}>ราคา</th>
                      <th style={{ padding: '12px', width: '15%', textAlign: 'center' }}>สกุลเงิน</th>
                      <th style={{ padding: '12px', width: '20%', textAlign: 'center' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRound.orders && currentRound.orders.length > 0 ? (
                      currentRound.orders.map((order, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{order.username}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{order.type}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                              {order.number}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#111' }}>
                            {formatCurrency(order.price)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', backgroundColor: order.currency === 'THB' ? '#e0f2fe' : '#dcfce7', color: order.currency === 'THB' ? '#0369a1' : '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {order.currency}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: order.status === 'Completed' || order.status === 'Win' ? '#10b981' : order.status === 'Lose' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                              {order.status === 'Win' ? '🎉 ถูกรางวัล' : order.status === 'Lose' ? 'ไม่ถูกรางวัล' : order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          ยังไม่มีรายการสั่งซื้อในรอบนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default YeekiSaleReport;