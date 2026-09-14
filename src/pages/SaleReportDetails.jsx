import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const SaleReportDetails = () => {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ดึงข้อมูลสรุปทุกงวดตอนเปิดหน้า
  const fetchRounds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/sales-report`);
      const data = await res.json();
      if (data.success) {
        setRounds(data.reports);
      }
    } catch (error) {
      console.error('Error fetching rounds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลบิลเมื่อคลิกเลือกงวด
  const fetchRoundDetails = async (roundId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/round-details/${roundId}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching round details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const handleSelectRound = (round) => {
    setSelectedRound(round);
    fetchRoundDetails(round.round_id);
  };

  const handleBack = () => {
    setSelectedRound(null);
    setTickets([]);
  };

  // 🌟 ฟังก์ชัน: แปลงเวลาเป็นรูปแบบไทย (เช่น 14 ก.ย. 69 | 15:00 น.)
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2); // เอาแค่ 2 ตัวท้าย เช่น 69
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} (${h}:${m} น.)`;
  };

  // 🌟 ฟังก์ชัน: แปลงชื่องวดที่เป็นตัวเลข 20260914 ให้เป็น "14 กันยายน 2569"
  const formatRoundTitle = (round) => {
    const name = round.round_name || round.round_number;
    // ถ้าชื่อเป็นตัวเลขล้วนๆ (เช่น 20260914) ให้ดึงวันที่จาก draw_time มาแปลงเป็นชื่อไทยแบบเต็ม
    if (/^\d+$/.test(name) && round.draw_time) {
      const d = new Date(round.draw_time);
      const fullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    }
    return name; // ถ้าชื่อปกติ (เช่น ออยพับงาบ) ก็ให้แสดงเหมือนเดิม
  };

  // ----------------------------------------------------
  // หน้า 1: แสดงรายการงวดทั้งหมด (แบบการ์ด)
  // ----------------------------------------------------
  if (!selectedRound) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={24} color="#ef4444" /> รายงานขาย หวยไทย
          </h2>
          <button onClick={fetchRounds} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <RefreshCw size={16} /> รีเฟรช
          </button>
        </div>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {rounds.map((round) => (
              <div 
                key={round.round_id} 
                onClick={() => handleSelectRound(round)}
                style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'}
              >
                <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: round.status === 'Completed' ? '#10b981' : '#f59e0b' }}></div>
                    <strong style={{ color: '#334155' }}>งวด: {formatRoundTitle(round)}</strong>
                  </div>
                </div>
                <div style={{ padding: '15px', fontSize: '13px', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>เปิดขาย:</span> <span>{formatTime(round.open_time)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>ปิดรับแทง:</span> <span style={{ color: '#ef4444' }}>{formatTime(round.close_time)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ยอดขาย (THB):</span> <strong style={{ color: '#10b981' }}>฿ {Number(round.total_sales_thb).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>ยอดขาย (LAK):</span> <strong style={{ color: '#10b981' }}>₭ {Number(round.total_sales_lak).toLocaleString()}</strong>
                  </div>
                </div>
                <div style={{ padding: '12px 15px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  คลิกดูผลรางวัล & ยอดขาย
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // หน้า 2: แสดงรายละเอียดเมื่อคลิกเข้ามาดูในงวดนั้นๆ
  // ----------------------------------------------------
  return (
    <div>
      <div style={{ backgroundColor: '#9f1239', color: 'white', padding: '15px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 0 }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>รายละเอียด งวด {formatRoundTitle(selectedRound)}</h3>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>สถานะ: {selectedRound.status === 'Completed' ? 'ประกาศผลแล้ว' : 'กำลังดำเนินการ'}</span>
          </div>
        </div>
        <button onClick={() => fetchRoundDetails(selectedRound.round_id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
          <RefreshCw size={14} /> อัปเดต
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', border: '1px solid #e2e8f0', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        
        {/* กล่องสรุปเวลาและผลรางวัล */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '25px' }}>
          <div style={{ flex: '1 1 300px', backgroundColor: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#be123c' }}>เวลาของรอบนี้</h4>
            <div style={{ fontSize: '14px', color: '#4c0519', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>เปิดขาย:</span> <strong>{formatTime(selectedRound.open_time)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ปิดรับแทง:</span> <strong style={{ color: '#e11d48' }}>{formatTime(selectedRound.close_time)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ออกผล:</span> <strong>{formatTime(selectedRound.draw_time)}</strong></div>
            </div>
          </div>
          
          <div style={{ flex: '1 1 300px', backgroundColor: '#fdfbf7', padding: '20px', borderRadius: '12px', border: '1px solid #fef08a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#a16207', marginBottom: '10px' }}>ผลรางวัลที่ออก</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04', letterSpacing: '2px' }}>
              {selectedRound.result_6 ? `${selectedRound.result_6} / ${selectedRound.result_2_bottom}` : 'XX / XX'}
            </div>
            <span style={{ fontSize: '12px', color: '#a16207', marginTop: '5px' }}>(รางวัลที่ 1 / 2 ตัวล่าง)</span>
          </div>
        </div>

        {/* กล่องสรุปยอดขาย */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (THB)</span>
            <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{Number(selectedRound.total_sales_thb).toLocaleString()} ฿</span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (LAK)</span>
            <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{Number(selectedRound.total_sales_lak).toLocaleString()} ₭</span>
          </div>
        </div>

        {/* ตารางรายการสั่งซื้อ */}
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', marginBottom: '15px' }}>
          รายการสั่งซื้อ ({tickets.length} รายการ)
        </h4>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>กำลังโหลดข้อมูลบิล...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ผู้ใช้</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ประเภท</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ตัวเลข</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ราคา</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>สกุลเงิน</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', color: '#94a3b8' }}>ยังไม่มีรายการสั่งซื้อในงวดนี้</td></tr>
                ) : (
                  tickets.map((t, idx) => {
                    let statusColor = '#64748b';
                    let statusText = t.status;
                    if (['ชนะ', 'Win', 'Paid'].includes(t.status)) { statusColor = '#10b981'; statusText = 'ถูกรางวัล'; }
                    else if (['แพ้', 'Lose'].includes(t.status)) { statusColor = '#ef4444'; statusText = 'ไม่ถูกรางวัล'; }
                    else if (['รอผล', 'Pending', 'รอผลตรวจ'].includes(t.status)) { statusColor = '#f59e0b'; statusText = 'รอผล'; }

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#334155', fontWeight: 'bold' }}>{t.username || 'No Name'}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{t.lottery_type}</td>
                        <td style={{ padding: '12px', color: '#e11d48', fontWeight: 'bold' }}>{t.selected_number}</td>
                        <td style={{ padding: '12px', color: '#334155' }}>{Number(t.price).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ backgroundColor: t.currency_code === 'THB' ? '#e0f2fe' : '#dcfce3', color: t.currency_code === 'THB' ? '#0284c7' : '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {t.currency_code}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: statusColor, fontWeight: 'bold' }}>{statusText}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleReportDetails;