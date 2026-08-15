import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Clock, CheckCircle2, AlertCircle, RefreshCw, Printer, TrendingUp, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySaleThaiNumber = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/sales-report`);
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // อัปเดตเวลาทุก 1 วินาทีสำหรับตัวนับถอยหลัง
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันคำนวณเวลานับถอยหลัง
  const getCountdown = (targetDate) => {
    const diff = new Date(targetDate) - currentTime;
    if (diff <= 0) return 'ถึงเวลาแล้ว';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    let str = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return d > 0 ? `${d} วัน ${str}` : str;
  };

  // ฟังก์ชันออกรายงาน PDF (ใช้ระบบ Print ของ Browser ซึ่งเสถียรและสวยงาม)
  const handleExportPDF = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }} className="print-container">
      
      {/* 🌟 ซ่อน Style นี้เมื่อสั่งพิมพ์ PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ccc !important; break-inside: avoid; margin-bottom: 20px; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }} className="no-print">
        <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={28} color="#0ea5e9" /> รายงานยอดขายหวยรัฐบาลไทย
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchReports} style={{ padding: '10px 15px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
            <RefreshCw size={16} /> รีเฟรช
          </button>
          <button onClick={handleExportPDF} style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
            <Printer size={16} /> บันทึก PDF / พิมพ์
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><RefreshCw className="spin" size={40} color="#0ea5e9" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {reports.map((report) => {
            const isCompleted = report.status === 'Completed';
            const isClosed = currentTime > new Date(report.close_time) && !isCompleted;
            const isOpen = currentTime >= new Date(report.open_time) && currentTime <= new Date(report.close_time) && !isCompleted;
            const isWaitingNext = currentTime < new Date(report.open_time);

            const profitTHB = report.total_sales_thb - report.total_payout_thb;
            const profitLAK = report.total_sales_lak - report.total_payout_lak;

            return (
              <div key={report.round_id} className="print-card" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                
                {/* 🌟 Header & Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px' }}>งวดประจำวันที่: {report.round_number}</h3>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#64748b' }}>
                      <span><strong style={{color:'#334155'}}>เปิดรับ:</strong> {formatDate(report.open_time)}</span>
                      <span><strong style={{color:'#ef4444'}}>ปิดรับ:</strong> {formatDate(report.close_time)}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    {isCompleted ? (
                      <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '8px 15px', borderRadius: '8px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
                        <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} /> ตรวจผลรางวัลแล้ว
                      </div>
                    ) : (
                      <div style={{ backgroundColor: isOpen ? '#f0f9ff' : isClosed ? '#fffbeb' : '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid', borderColor: isOpen ? '#bae6fd' : isClosed ? '#fde68a' : '#e2e8f0', minWidth: '200px' }}>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>
                          {isOpen ? 'เหลือเวลาปิดรับแทง' : isClosed ? 'รอประกาศผลรางวัล' : 'รอเปิดรอบถัดไปในอีก'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: isOpen ? '#0284c7' : isClosed ? '#d97706' : '#475569', fontSize: '18px', fontWeight: '900' }}>
                          <Clock size={20} /> {isOpen ? getCountdown(report.close_time) : isClosed ? getCountdown(report.draw_time) : getCountdown(report.open_time)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🌟 ผลรางวัล (แสดงเมื่อออกผลแล้ว) */}
                {isCompleted && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '30px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>รางวัลที่ 1</span>
                      <strong style={{ fontSize: '24px', color: '#b91c1c', letterSpacing: '2px' }}>{report.result_6}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>เลขท้าย 2 ตัว</span>
                      <strong style={{ fontSize: '24px', color: '#1d4ed8', letterSpacing: '2px' }}>{report.result_2_bottom}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  
                  {/* 🇹🇭 ยอดขายคนไทย (THB) */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
                      🇹🇭 ยอดขาย (THB - บาท)
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>ยอดซื้อรวม:</span>
                      <strong style={{ color: '#0284c7', fontSize: '16px' }}>{report.total_sales_thb.toLocaleString()} ฿</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>จ่ายรางวัล:</span>
                      <strong style={{ color: '#ef4444', fontSize: '16px' }}>- {report.total_payout_thb.toLocaleString()} ฿</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#334155', fontWeight: 'bold' }}>กำไร/ขาดทุน สุทธิ:</span>
                      <strong style={{ color: profitTHB >= 0 ? '#16a34a' : '#ef4444', fontSize: '18px' }}>
                        {profitTHB >= 0 ? '+' : ''}{profitTHB.toLocaleString()} ฿
                      </strong>
                    </div>
                  </div>

                  {/* 🇱🇦 ยอดขายคนลาว (LAK) */}
                  <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #ef4444', paddingBottom: '8px' }}>
                      🇱🇦 ยอดขาย (LAK - กีบ)
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>ยอดซื้อรวม:</span>
                      <strong style={{ color: '#0284c7', fontSize: '16px' }}>{report.total_sales_lak.toLocaleString()} ₭</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>จ่ายรางวัล:</span>
                      <strong style={{ color: '#ef4444', fontSize: '16px' }}>- {report.total_payout_lak.toLocaleString()} ₭</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#334155', fontWeight: 'bold' }}>กำไร/ขาดทุน สุทธิ:</span>
                      <strong style={{ color: profitLAK >= 0 ? '#16a34a' : '#ef4444', fontSize: '18px' }}>
                        {profitLAK >= 0 ? '+' : ''}{profitLAK.toLocaleString()} ₭
                      </strong>
                    </div>
                  </div>

                  {/* 📊 สถิติภาพรวม */}
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '15px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #16a34a', paddingBottom: '8px' }}>
                      <Users size={18} /> สถิติการตรวจรางวัล
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>ถูกรางวัล</span>
                        <strong style={{ color: '#16a34a', fontSize: '20px' }}>{report.winners_count} <span style={{fontSize:'12px'}}>รายการ</span></strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>ไม่ถูกรางวัล</span>
                        <strong style={{ color: '#ef4444', fontSize: '20px' }}>{report.lost_count} <span style={{fontSize:'12px'}}>รายการ</span></strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>รอผลตรวจ</span>
                        <strong style={{ color: '#d97706', fontSize: '20px' }}>{report.pending_count} <span style={{fontSize:'12px'}}>รายการ</span></strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#64748b', fontSize: '12px' }}>ยอดแทงรวมทั้งหมด</span>
                        <strong style={{ color: '#0f172a', fontSize: '20px' }}>{report.total_tickets} <span style={{fontSize:'12px'}}>รายการ</span></strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
          
          {reports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
              <h3>ยังไม่มีข้อมูลรายงานยอดขาย</h3>
              <p>ระบบจะแสดงรายงานเมื่อมีการสร้างงวดหวยไทย</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySaleThaiNumber;