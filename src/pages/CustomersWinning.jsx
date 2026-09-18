import React, { useState, useEffect } from 'react';
import { Calendar, Search, Trophy, DollarSign, User, CheckCircle, AlertCircle, Printer, X, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';
const EXCHANGE_RATE = 620; // เรทเงินกีบสำหรับคำนวณกำไรสุทธิเป็น THB

const CustomersWinning = () => {
  // ==========================================
  // 🌟 1. State จัดการข้อมูล
  // ==========================================
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [monthData, setMonthData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // สำหรับ Popup Modal
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  // ==========================================
  // 🌟 2. ฟังก์ชันจัดรูปแบบการแสดงผล
  // ==========================================
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const formatTHB = (val) => Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatLAK = (val) => Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // ==========================================
  // 🌟 3. ดึงข้อมูลสรุปรายวันเป็นเดือน (ยอดขาย + ยอดจ่าย + รายชื่อ)
  // ==========================================
  const fetchMonthSummary = async () => {
    setIsLoading(true);
    const [year, month] = selectedMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    
    let daysArray = [];
    for (let i = lastDay; i >= 1; i--) {
      const dStr = `${year}-${month}-${i.toString().padStart(2, '0')}`;
      if (dStr <= todayStr) daysArray.push(dStr);
    }

    const newData = [];
    // ดึงข้อมูลทีละ 5 วันเพื่อไม่ให้เซิร์ฟเวอร์โหลดหนักเกินไป
    for (let i = 0; i < daysArray.length; i += 5) {
      const chunk = daysArray.slice(i, i + 5);
      const results = await Promise.all(chunk.map(async (date) => {
        try {
          // ใช้ API draw-history เพราะมีทั้งยอดขาย ยอดจ่าย และ winners ครบในเส้นเดียว
          const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
          const data = await res.json();
          if (data.success) {
            let pTHB = 0, pLAK = 0;
            const winners = data.winners || [];
            winners.forEach(w => {
              if (w.currency_code === 'LAK' || w.currency_code === '₭') pLAK += Number(w.prize_amount) || 0;
              else pTHB += Number(w.prize_amount) || 0;
            });

            return {
              date,
              salesTHB: Number(data.total_sales_thb) || 0,
              salesLAK: Number(data.total_sales_lak) || 0,
              payoutTHB: pTHB,
              payoutLAK: pLAK,
              winners: winners
            };
          }
        } catch(e) { console.error(e); }
        return null;
      }));
      newData.push(...results.filter(r => r !== null));
    }
    
    setMonthData(newData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMonthSummary();
  }, [selectedMonth]);

  // ==========================================
  // 🌟 4. คำนวณกำไร/ขาดทุน สำหรับ Card
  // ==========================================
  const calculateProfit = (data) => {
    const totalSales = data.salesTHB + (data.salesLAK / EXCHANGE_RATE);
    const totalPayout = data.payoutTHB + (data.payoutLAK / EXCHANGE_RATE);
    const profit = totalSales - totalPayout;
    const profitPercent = totalSales > 0 ? (profit / totalSales) * 100 : 0;
    
    return { totalSales, totalPayout, profit, profitPercent };
  };

  // ==========================================
  // 🌟 5. จัดการ Dynamic Tabs (โชว์เฉพาะประเภทที่มีคนถูก)
  // ==========================================
  const getDynamicTabs = (winners) => {
    const types = new Set(winners.map(w => w.lottery_type));
    return ['ทั้งหมด', ...Array.from(types)];
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // ==========================================
  // 🌟 6. UI หน้าจอแสดงผล
  // ==========================================
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* 🌟 CSS พิเศษสำหรับซ่อนสิ่งที่ไม่จำเป็นตอนพิมพ์ PDF */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-modal, #printable-modal * { visibility: visible; }
            #printable-modal { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0; margin: 0; }
            .no-print { display: none !important; }
            /* ปรับสีตารางตอนพิมพ์ให้ชัดขึ้น */
            #printable-modal th { background-color: #f1f5f9 !important; color: #000 !important; }
          }
        `}
      </style>

      {/* --- ส่วนหัว เลือกเดือน --- */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
            <Trophy size={28} color="#eab308" /> รายงานสรุปรางวัล (หวยเวียดนาม)
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>คลิกที่การ์ดเพื่อดูรายชื่อผู้ถูกรางวัล และสรุปกำไรขาดทุน</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'white', padding: '8px 15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <CalendarDays size={20} color="#3b82f6" />
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ border: 'none', outline: 'none', fontWeight: 'bold', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px' }}
          />
        </div>
      </div>

      {/* --- ส่วน Card รายวัน --- */}
      <div className="no-print">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>กำลังคำนวณสรุปยอด...</div>
        ) : monthData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '12px' }}>ไม่มีข้อมูลในเดือนนี้</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {monthData.map((data, index) => {
              const { profit, profitPercent } = calculateProfit(data);
              const isProfit = profit >= 0;

              return (
                <div 
                  key={index} 
                  onClick={() => { setSelectedCard(data); setActiveTab('ทั้งหมด'); }}
                  style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* หัว Card */}
                  <div style={{ backgroundColor: isProfit ? '#0f766e' : '#9f1239', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px' }}>งวด {formatThaiDate(data.date)}</strong>
                    <span style={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{data.winners.length} บิลที่ถูก</span>
                  </div>
                  
                  {/* เนื้อหา Card */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>ยอดขายรวม:</span>
                      <strong style={{ color: '#334155' }}>฿ {formatTHB(data.salesTHB + (data.salesLAK / EXCHANGE_RATE))}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>ยอดจ่ายรางวัล:</span>
                      <strong style={{ color: '#ef4444' }}>฿ {formatTHB(data.payoutTHB + (data.payoutLAK / EXCHANGE_RATE))}</strong>
                    </div>
                    
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#1e293b', fontWeight: 'bold' }}>กำไร/ขาดทุน</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', color: isProfit ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '18px' }}>
                          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                          {isProfit ? '+' : ''}{formatTHB(profit)} ฿
                        </div>
                        <div style={{ fontSize: '12px', color: isProfit ? '#059669' : '#dc2626' }}>
                          ({isProfit ? '+' : ''}{profitPercent.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🌟 Popup Modal แสดงรายชื่อผู้ถูกรางวัล */}
      {/* ========================================== */}
      {selectedCard && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          <div id="printable-modal" style={{ backgroundColor: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div className="no-print" style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={24} color="#eab308" /> รายชื่อผู้ถูกรางวัล งวด {formatThaiDate(selectedCard.date)}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handlePrintPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 15px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Printer size={16} /> ส่งออก PDF
                </button>
                <button onClick={() => setSelectedCard(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '5px' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content (ตารางและแท็บ) */}
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              
              {/* ซ่อนเฉพาะบนจอโชว์ แต่โชว์ใน PDF เป็นหัวกระดาษ */}
              <div style={{ display: 'none' }} className="print-header">
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>รายงานผู้ถูกรางวัล หวยเวียดนาม งวดประจำวันที่ {formatThaiDate(selectedCard.date)}</h2>
              </div>

              {selectedCard.winners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                  <p>ไม่พบผู้ถูกรางวัลในงวดนี้</p>
                </div>
              ) : (
                <>
                  {/* Dynamic Tabs กรองประเภทหวย (โชว์เฉพาะที่มีคนถูก) */}
                  <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {getDynamicTabs(selectedCard.winners).map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        style={{
                          padding: '6px 16px',
                          border: activeTab === type ? 'none' : '1px solid #e2e8f0',
                          backgroundColor: activeTab === type ? '#3b82f6' : 'white',
                          color: activeTab === type ? 'white' : '#64748b',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontWeight: activeTab === type ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* ตารางรายชื่อ */}
                  <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        <tr>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #cbd5e1' }}>ผู้ใช้ (Username)</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #cbd5e1' }}>ประเภทหวย</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #cbd5e1' }}>เลขที่ถูก</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #cbd5e1' }}>ยอดแทง</th>
                          <th style={{ padding: '12px 15px', borderBottom: '2px solid #cbd5e1' }}>รางวัลที่ได้รับ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCard.winners
                          .filter(w => activeTab === 'ทั้งหมด' || w.lottery_type === activeTab)
                          .map((winner, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '12px 15px', color: '#1e293b', fontWeight: 'bold' }}>{winner.username || '-'}</td>
                            <td style={{ padding: '12px 15px', color: '#64748b' }}>{winner.lottery_type}</td>
                            <td style={{ padding: '12px 15px', color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{winner.selected_number}</td>
                            <td style={{ padding: '12px 15px', color: '#64748b' }}>
                              {formatTHB(winner.price)} {winner.currency_code}
                            </td>
                            <td style={{ padding: '12px 15px', color: '#16a34a', fontWeight: 'bold' }}>
                              + {formatTHB(winner.prize_amount)} {winner.currency_code}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomersWinning;