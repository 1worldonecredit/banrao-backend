import React, { useState, useEffect } from 'react';
import { Trophy, Clock, History, Calendar, Search, CheckCircle2, Lock, Unlock, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ThaiLotteryResults = () => {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'history'
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State สำหรับกรอกผล
  const [number6, setNumber6] = useState('');
  const [number2bot, setNumber2bot] = useState('');

  // Filter State สำหรับประวัติ
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchRounds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/rounds`);
      const data = await res.json();
      if (data.success) setRounds(data.rounds);
    } catch (err) {
      console.error('Error fetching rounds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
    // อัปเดตเวลาทุกวินาที
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // หา "งวดปัจจุบัน" ที่กำลังรอประกาศผล (ดึงงวดที่ยังไม่ออกผล และเวลาใกล้ที่สุด)
  const pendingRounds = rounds.filter(r => r.status !== 'Completed').sort((a, b) => new Date(a.draw_time) - new Date(b.draw_time));
  const targetRound = pendingRounds.length > 0 ? pendingRounds[0] : null;

  // 🌟 ดึงเวลาปิดรับแทง และคำนวณเวลาล็อก (ปิดรับแทง + 2 ชั่วโมง)
  const closeTime = targetRound ? new Date(targetRound.close_time) : new Date();
  const lockTime = new Date(closeTime.getTime() + (2 * 60 * 60 * 1000)); // บวก 2 ชั่วโมง

  // 🌟 ปลดล็อกเฉพาะช่วง: "หลังปิดรับแทง" จนถึง "ก่อนหมดเวลา 2 ชั่วโมง"
  const isReadyToDraw = targetRound ? (currentTime >= closeTime && currentTime <= lockTime) : false;

  // 🌟 ฟังก์ชันนับถอยหลัง (ฉลาดขึ้น แบ่งเป็น 3 ระยะ)
  const getCountdownText = () => {
    if (!targetRound) return '';
    let targetDate;
    
    if (currentTime < closeTime) {
      targetDate = closeTime; // ระยะที่ 1: รอนับถอยหลังเพื่อปลดล็อกช่องคีย์
    } else if (currentTime >= closeTime && currentTime <= lockTime) {
      targetDate = lockTime; // ระยะที่ 2: รอนับถอยหลังหมดเวลาคีย์ (2 ชม.)
    } else {
      return 'หมดเวลาคีย์ผลแล้ว'; // ระยะที่ 3: เกิน 2 ชม. ล็อกปิดตาย
    }

    const diff = targetDate - currentTime;
    if (diff <= 0) return 'หมดเวลาคีย์ผลแล้ว';
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    let str = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return d > 0 ? `${d} วัน ${str}` : str;
  };

  const handleExecuteDraw = async () => {
    if (!isReadyToDraw) return alert('ยังไม่ถึงเวลาประกาศผลครับ');
    if (number6.length !== 6) return alert('กรุณากรอก รางวัลที่ 1 ให้ครบ 6 หลัก');
    if (number2bot.length !== 2) return alert('กรุณากรอก เลขท้าย 2 ตัว ให้ครบ 2 หลัก');
    if (!targetRound) return;

    if (!window.confirm(`⚠️ ยืนยันประกาศผลหวยไทย งวด ${targetRound.round_number} \n\nรางวัลที่ 1: ${number6} \nเลขท้าย 2 ตัว: ${number2bot} \n\nระบบจะตัดเงินและจ่ายค่าคอมมิชชันให้ผู้ถูกรางวัลทันที ยืนยันหรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/execute-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: targetRound.round_id, number6, number2bot })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNumber6(''); setNumber2bot('');
        fetchRounds(); // รีเฟรชข้อมูล
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`);
      }
    } catch (err) {
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsProcessing(false);
    }
  };

  // คัดกรองประวัติออกรางวัลตามเดือนและปี
  const historyRounds = rounds.filter(r => {
    if (r.status !== 'Completed') return false;
    const drawDate = new Date(r.draw_time);
    const matchMonth = selectedMonth === 'all' || (drawDate.getMonth() + 1).toString() === selectedMonth;
    const matchYear = selectedYear === 'all' || drawDate.getFullYear().toString() === selectedYear;
    return matchMonth && matchYear;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const months = [
    { val: '1', label: 'มกราคม' }, { val: '2', label: 'กุมภาพันธ์' }, { val: '3', label: 'มีนาคม' },
    { val: '4', label: 'เมษายน' }, { val: '5', label: 'พฤษภาคม' }, { val: '6', label: 'มิถุนายน' },
    { val: '7', label: 'กรกฎาคม' }, { val: '8', label: 'สิงหาคม' }, { val: '9', label: 'กันยายน' },
    { val: '10', label: 'ตุลาคม' }, { val: '11', label: 'พฤศจิกายน' }, { val: '12', label: 'ธันวาคม' }
  ];
  const years = ['2024', '2025', '2026', '2027'];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy size={28} color="#10b981" /> จัดการผลรางวัลหวยไทย
      </h2>

      {/* ========================================== */}
      {/* 🌟 Tabs Menu */}
      {/* ========================================== */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        <button onClick={() => setActiveTab('draw')} style={{ flex: 1, minWidth: '150px', padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s', backgroundColor: activeTab === 'draw' ? '#10b981' : '#e2e8f0', color: activeTab === 'draw' ? 'white' : '#64748b', boxShadow: activeTab === 'draw' ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none' }}>
          <Clock size={18} /> รอประกาศผล
        </button>
        <button onClick={() => setActiveTab('history')} style={{ flex: 1, minWidth: '150px', padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s', backgroundColor: activeTab === 'history' ? '#0ea5e9' : '#e2e8f0', color: activeTab === 'history' ? 'white' : '#64748b', boxShadow: activeTab === 'history' ? '0 4px 10px rgba(14, 165, 233, 0.3)' : 'none' }}>
          <History size={18} /> ประวัติการออกรางวัล
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><RefreshCw className="spin" size={40} color="#10b981" /></div>
      ) : activeTab === 'draw' ? (
        /* ========================================== */
        /* 🌟 แท็บ: รอประกาศผล (Smart Lock Form) */
        /* ========================================== */
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {!targetRound ? (
            <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={60} color="#cbd5e1" style={{ margin: '0 auto 15px auto' }} />
              <h3 style={{ color: '#475569', margin: '0 0 10px 0' }}>ออกผลครบทุกงวดแล้ว</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>ไม่มีงวดที่รอประกาศผลในขณะนี้</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderTop: isReadyToDraw ? '5px solid #10b981' : '5px solid #f59e0b', transition: 'all 0.5s' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e2e8f0' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px' }}>งวดประจำวันที่</h3>
                <h2 style={{ margin: '0 0 15px 0', color: '#10b981', fontSize: '28px' }}>{targetRound.round_number}</h2>
                
                {/* 🌟 นาฬิกานับถอยหลังอัจฉริยะ */}
                <div style={{ backgroundColor: isReadyToDraw ? '#f0fdf4' : '#fffbeb', padding: '15px', borderRadius: '12px', display: 'inline-block', minWidth: '250px', border: isReadyToDraw ? '1px solid #bbf7d0' : '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: isReadyToDraw ? '#16a34a' : '#d97706', fontWeight: 'bold', marginBottom: '5px' }}>
                    {isReadyToDraw ? <Unlock size={20} /> : <Lock size={20} />}
                    {isReadyToDraw ? 'เปิดระบบกรอกผลรางวัล' : 'รอเวลาออกผล (ระบบล็อก)'}
                  </div>
                  <strong style={{ fontSize: '24px', color: isReadyToDraw ? '#15803d' : '#b45309', letterSpacing: '1px' }}>
                    {getCountdown(targetRound.draw_time)}
                  </strong>
                </div>
              </div>

              {/* 🌟 ฟอร์มกรอกเลข (จะโดนล็อกถ้าไม่ถึงเวลา) */}
              <div style={{ opacity: isReadyToDraw ? 1 : 0.4, pointerEvents: isReadyToDraw ? 'auto' : 'none', filter: isReadyToDraw ? 'none' : 'grayscale(50%)', transition: 'all 0.5s' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#b91c1c', fontSize: '15px', textAlign: 'center' }}>รางวัลที่ 1 (6 หลัก)</label>
                  <input type="tel" maxLength="6" value={number6} onChange={(e) => setNumber6(e.target.value.replace(/\D/g, ''))} disabled={!isReadyToDraw} placeholder="XXXXXX" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #fca5a5', boxSizing: 'border-box', fontSize: '32px', fontWeight: '900', letterSpacing: '8px', textAlign: 'center', color: '#b91c1c', backgroundColor: '#fef2f2', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1d4ed8', fontSize: '15px', textAlign: 'center' }}>เลขท้าย 2 ตัว (ล่าง)</label>
                  <input type="tel" maxLength="2" value={number2bot} onChange={(e) => setNumber2bot(e.target.value.replace(/\D/g, ''))} disabled={!isReadyToDraw} placeholder="XX" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #93c5fd', boxSizing: 'border-box', fontSize: '32px', fontWeight: '900', letterSpacing: '8px', textAlign: 'center', color: '#1d4ed8', backgroundColor: '#eff6ff', outline: 'none' }} />
                </div>

                <button onClick={handleExecuteDraw} disabled={!isReadyToDraw || isProcessing} style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: isReadyToDraw ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '18px', boxShadow: isReadyToDraw ? '0 6px 15px rgba(16, 185, 129, 0.4)' : 'none' }}>
                  {isProcessing ? <RefreshCw className="spin" size={24} /> : <Trophy size={24} />} ยืนยันประกาศผลและจ่ายเงินทันที
                </button>
              </div>

            </div>
          )}
        </div>
      ) : (
        /* ========================================== */
        /* 🌟 แท็บ: ประวัติการออกรางวัล (History) */
        /* ========================================== */
        <div>
          {/* ตัวกรอง (Filter) */}
          <div style={{ backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 'bold' }}>
              <Calendar size={20} color="#0ea5e9" /> ค้นหาประวัติ:
            </div>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', minWidth: '120px' }}>
              <option value="all">ทุกเดือน</option>
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', minWidth: '100px' }}>
              <option value="all">ทุกปี</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchRounds} style={{ padding: '10px 15px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <Search size={16} /> ค้นหา
            </button>
          </div>

          {/* รายการผลหวย */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {historyRounds.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                <History size={48} style={{ margin: '0 auto 15px auto', opacity: 0.3 }} />
                <h3>ไม่พบประวัติการออกรางวัล</h3>
                <p>ในเดือนและปีที่ท่านเลือก</p>
              </div>
            ) : (
              historyRounds.map(r => (
                <div key={r.round_id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a', fontSize: '15px' }}>{r.round_number}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(r.draw_time)}</span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>รางวัลที่ 1</span>
                      <strong style={{ fontSize: '26px', color: '#b91c1c', letterSpacing: '2px' }}>{r.result_6}</strong>
                    </div>
                    <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>เลขท้าย 2 ตัว</span>
                      <strong style={{ fontSize: '26px', color: '#1d4ed8', letterSpacing: '2px' }}>{r.result_2_bottom}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThaiLotteryResults;