import React, { useState, useEffect } from 'react';
import { 
  Settings, Download, Trophy, Power, PlayCircle, StopCircle, 
  Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, 
  Crosshair, DollarSign, Search, CheckCircle, Eye, X, Clock, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ManageYeeki = () => {
  // ==========================================
  // 🌟 State หลัก & ข้อมูลรอบ
  // ==========================================
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  const [settings, setSettings] = useState({
    is_auto_draw: false, 
    auto_draw_percent: 50
  });
  
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // ==========================================
  // 🌟 State ระบบวิเคราะห์ & เรท
  // ==========================================
  const [prizeRates, setPrizeRates] = useState([
    { id: 1, lottery_type: '8 ตัว (Super)', multiplier: 1000000 },
    { id: 2, lottery_type: '4 ตัวท้าย', multiplier: 6000 },
    { id: 3, lottery_type: '3 ตัวบน', multiplier: 900 },
    { id: 4, lottery_type: '3 ตัวโต๊ด', multiplier: 150 },
    { id: 5, lottery_type: '2 ตัวบน', multiplier: 90 },
    { id: 6, lottery_type: '2 ตัวล่าง', multiplier: 90 },
    { id: 7, lottery_type: 'วิ่งบน', multiplier: 3.2 },
    { id: 8, lottery_type: 'วิ่งล่าง', multiplier: 4.2 }
  ]);
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  // ยี่กีต้องใช้เลข 8 ตัวบน และ 2 ตัวล่าง
  const [simulatedTop, setSimulatedTop] = useState(''); 
  const [simulatedBottom, setSimulatedBottom] = useState(''); 
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [targetPercent, setTargetPercent] = useState(50);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);

  // ==========================================
  // 🌟 State สำหรับค้นหารายชื่อ
  // ==========================================
  const [searchNumber, setSearchNumber] = useState('');
  const [searchedBuyers, setSearchedBuyers] = useState(null); 
  const [isSearchingBuyers, setIsSearchingBuyers] = useState(false);

  const [showSimulatedUsers, setShowSimulatedUsers] = useState(false);
  const [simulatedUsersList, setSimulatedUsersList] = useState([]);
  const [simulatedUserLoading, setSimulatedUserLoading] = useState(false);

  // ==========================================
  // 🌟 ฟังก์ชัน Utilities
  // ==========================================
  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const [y, m, d] = dateStr.split('-');
    const thaiYear = parseInt(y, 10) + 543;
    const thaiMonth = months[parseInt(m, 10) - 1];
    const thaiDay = parseInt(d, 10);
    return `${thaiDay} ${thaiMonth} ${thaiYear}`;
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

  // ==========================================
  // 🌟 useEffect
  // ==========================================
  useEffect(() => {
    fetchPrizeRates(); 
    fetchExchangeRates(); 
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchRounds(selectedDate);
  }, [selectedDate]);

  // ==========================================
  // 🌟 ฟังก์ชัน ดึง/บันทึก 
  // ==========================================
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/yeeki/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          is_auto_draw: data.data.is_auto_draw || false,
          auto_draw_percent: data.data.auto_draw_percent || 50
        });
        setTargetPercent(data.data.auto_draw_percent || 50);
      }
    } catch (err) { console.error(err); }
  };

  const fetchRounds = async (date) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds?date=${date}`);
      const data = await res.json();
      if (data.success && data.rounds && data.rounds.length > 0) {
        setRounds(data.rounds);
        // เลือกแอกทีฟรอบแรกที่กำลังรอดำเนินการ
        const firstPending = data.rounds.find(r => r.status === 'Pending' || r.status === 'Open');
        setSelectedRound(firstPending || data.rounds[0]);
      } else {
        generateDefaultRounds();
      }
    } catch (err) {
      console.log('Using mock rounds');
      generateDefaultRounds();
    } finally {
      setIsProcessing(false);
    }
  };

  const generateDefaultRounds = () => {
    const arr = [];
    for (let i = 1; i <= 24; i++) {
      arr.push({
        round_id: i,
        round_number: i,
        status: i < 5 ? 'Completed' : i === 5 ? 'Open' : 'Pending',
        result_3_top: i < 5 ? '123' : null,
        result_2_bottom: i < 5 ? '99' : null
      });
    }
    setRounds(arr);
    setSelectedRound(arr[4]); // เลือกตัวที่ 5 ที่กำลัง Open
  };

  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/yeeki/prize-rates`);
      const data = await res.json();
      if (data.success && data.rates.length > 0) setPrizeRates(data.rates);
    } catch (err) { console.error(err); }
  };

  const fetchExchangeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`);
      const data = await res.json();
      if (data.success) {
        const lakRate = data.rates.find(r => r.currency_pair === 'THB_LAK');
        if (lakRate) setExchangeRateLAK(lakRate.rate);
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleAutoDraw = async (isChecked) => {
    const updated = { ...settings, is_auto_draw: isChecked, auto_draw_percent: targetPercent };
    setSettings(updated);
    try {
      await fetch(`${API_URL}/api/yeeki/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
      });
      alert(isChecked ? `✅ เปิดใช้ออกเลขอัตโนมัติ (${targetPercent}%)` : '❌ ปิดใช้งานออกเลขอัตโนมัติแล้ว');
    } catch (err) { console.log('Mock Auto Draw Toggle'); }
  };

  const handleSavePrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/yeeki/prize-rates`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ rates: prizeRates }) 
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกอัตราการจ่ายยี่กีสำเร็จ!');
    } catch (err) { alert('✅ บันทึกสำเร็จ (Mock)'); }
  };

  const handleSaveExchangeRate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ pair: 'THB_LAK', rate: exchangeRateLAK }) 
      });
      const data = await res.json();
      if (data.success) alert('✅ อัปเดตอัตราแลกเปลี่ยนสำเร็จ!');
    } catch (err) { alert('✅ บันทึกสำเร็จ (Mock)'); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน วิเคราะห์ & ออกรางวัลจริง
  // ==========================================
  const handleAnalyzeDraw = async () => {
    if (simulatedTop.length !== 8) return alert('กรุณากรอกเลขบนให้ครบ 8 หลักครับ (สำหรับแจ็คพอต และ 4,3,2 ตัวบน)');
    if (simulatedBottom.length !== 2) return alert('กรุณากรอกเลขล่างให้ครบ 2 หลักครับ');
    if (!selectedRound) return alert('กรุณาเลือกรอบที่ต้องการวิเคราะห์');

    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-yeeki-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ round_id: selectedRound.round_id, top: simulatedTop, bottom: simulatedBottom }) 
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
    } catch (err) { 
      console.log('Mocking analysis result');
      // Mock data for UI presentation
      setAnalysisResult({
        totalSales: 150000,
        analysis: [
          { lottery_type: '8 ตัว (Super)', winner_count: 0, total_payout: 0 },
          { lottery_type: '4 ตัวท้าย', winner_count: 2, total_payout: 12000 },
          { lottery_type: '3 ตัวบน', winner_count: 15, total_payout: 13500 },
          { lottery_type: '3 ตัวโต๊ด', winner_count: 40, total_payout: 6000 },
          { lottery_type: '2 ตัวบน', winner_count: 85, total_payout: 7650 },
          { lottery_type: '2 ตัวล่าง', winner_count: 120, total_payout: 10800 },
          { lottery_type: 'วิ่งบน', winner_count: 300, total_payout: 9600 },
          { lottery_type: 'วิ่งล่าง', winner_count: 450, total_payout: 18900 }
        ]
      });
    } 
    finally { setIsAnalyzing(false); }
  };

  const handleSuggestDraw = async () => {
    if (!selectedRound) return alert('กรุณาเลือกรอบที่ต้องการ');
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/suggest-yeeki-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ targetPercent, round_id: selectedRound.round_id }) 
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedTop(data.suggestedTop);
        setSimulatedBottom(data.suggestedBottom);
        setAnalysisResult({ totalSales: data.totalSales, analysis: data.analysis });
      }
    } catch (err) { 
      console.log('Mock Suggestion');
      setSimulatedTop(Math.floor(10000000 + Math.random() * 90000000).toString());
      setSimulatedBottom(Math.floor(10 + Math.random() * 90).toString());
    } 
    finally { setIsSuggesting(false); }
  };

  const handleExecuteDraw = async () => {
    if (!window.confirm(`⚠️ ยืนยันประกาศผลยี่กี รอบที่ ${selectedRound.round_number} ใช่หรือไม่?\nเลขบน: ${simulatedTop}\nเลขล่าง: ${simulatedBottom}\n\n(การกระทำนี้จะตรวจบิลทั้งหมด และแจกเงินลูกค้าทันที)`)) return;
    
    setIsExecutingDraw(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/execute-yeeki-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ round_id: selectedRound.round_id, top: simulatedTop, bottom: simulatedBottom }) 
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRounds(selectedDate);
      } else {
        alert('❌ เกิดข้อผิดพลาดในการออกรางวัล');
      }
    } catch (err) { 
        alert('✅ จำลองการออกรางวัลสำเร็จ'); 
        fetchRounds(selectedDate);
    } 
    finally { setIsExecutingDraw(false); }
  };

  const fetchSimulatedUsers = async (type, numberStr) => {
    setSimulatedUserLoading(true);
    setShowSimulatedUsers(true);
    setSimulatedUsersList([]);
    try {
      const res = await fetch(`${API_URL}/api/admin/simulate-yeeki-winners`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: selectedRound.round_id, number: numberStr, lottery_type: type })
      });
      const data = await res.json();
      if (data.success) setSimulatedUsersList(data.users);
    } catch (err) { 
      // Mock data
      setSimulatedUsersList([{ username: 'vip_user1', currency_code: 'LAK', price: 2000, estimated_prize: 180000, estimated_prize_thb: 360 }]);
    } 
    finally { setSimulatedUserLoading(false); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน ค้นหาผู้ซื้อ
  // ==========================================
  const handleSearchBuyers = async () => {
    if (!searchNumber) return alert('กรุณากรอกเลขที่ต้องการค้นหา');
    setIsSearchingBuyers(true);
    setSearchedBuyers(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/search-yeeki-buyers`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ number: searchNumber, date: selectedDate }) 
      });
      const data = await res.json();
      if (data.success) {
        setSearchedBuyers(data.buyers);
      }
    } catch (err) { console.error(err); } 
    finally { setIsSearchingBuyers(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF(); 
    doc.addFont('THSarabunNew', 'normal'); 
    doc.setFontSize(18); 
    doc.text(`Yeeki Winners Report - ${formatThaiDateFull(selectedDate)}`, 14, 20);
    const tableColumn = ["Round", "Username", "Type", "Number", "Bet Amount", "Prize Amount", "Currency"];
    const tableRows = [];
    filteredWinners.forEach(w => {
      tableRows.push([ 
        w.round_number,
        w.username, 
        w.lottery_type, 
        w.selected_number, 
        w.price, 
        w.prize_amount, 
        w.currency_code 
      ]);
    });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 }); 
    doc.save(`yeeki_winners_${selectedDate}.pdf`);
  };

  const filteredWinners = activeTab === 'all' 
    ? winners 
    : winners.filter(w => w.lottery_type === activeTab);

return (
    <div style={{ padding: '20px', backgroundColor: '#fdf2f8', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#9d174d', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={28} /> บริหารหวยจับยี่กี (Yeeki VIP)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #fbcfe8', boxShadow: '0 2px 5px rgba(219, 39, 119, 0.1)' }}>
          <Calendar size={20} color="#db2777" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={{ border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '15px', color: '#831843', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 1. โซนเลือกรอบของวัน (Scrollable Pills) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(219, 39, 119, 0.08)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9d174d', fontSize: '15px' }}>เลือกรอบที่ต้องการจัดการ:</h4>
        
        {isProcessing ? (
           <div style={{ padding: '20px', textAlign: 'center', color: '#db2777' }}><RefreshCw className="spin" size={24}/></div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
            {rounds.map(r => {
              const isSelected = selectedRound?.round_id === r.round_id;
              const isCompleted = r.status === 'Completed';
              return (
                <button 
                  key={r.round_id}
                  onClick={() => { setSelectedRound(r); setAnalysisResult(null); setSimulatedTop(''); setSimulatedBottom(''); }}
                  style={{ 
                    padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s',
                    backgroundColor: isSelected ? '#be185d' : isCompleted ? '#f1f5f9' : '#fdf2f8',
                    color: isSelected ? 'white' : isCompleted ? '#64748b' : '#db2777',
                    border: isSelected ? 'none' : isCompleted ? '1px solid #e2e8f0' : '1px solid #fbcfe8',
                    boxShadow: isSelected ? '0 4px 10px rgba(190, 24, 93, 0.3)' : 'none'
                  }}
                >
                  รอบที่ {r.round_number} {isCompleted ? '(ออกผลแล้ว)' : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. โซนตั้งค่าเรทเงิน & อัตราจ่าย */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* อัตราแลกเปลี่ยน */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#15803d" /> อัตราแลกเปลี่ยน (LAK เป็น THB)
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', backgroundColor: '#f0fdf4', padding: '10px 15px', borderRadius: '8px', border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>1 THB = </span>
            <input 
              type="number" 
              value={exchangeRateLAK} 
              onChange={(e) => setExchangeRateLAK(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px', fontWeight: 'bold', fontSize: '16px', outline: 'none' }} 
            />
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>LAK</span>
          </div>
          <button onClick={handleSaveExchangeRate} style={{ padding: '10px 20px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={18} /> บันทึกเรทแลกเปลี่ยน
          </button>
        </div>

        {/* อัตราการจ่ายรางวัล */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#8b5cf6" /> ปรับอัตราการจ่ายยี่กี (ตัวคูณ)
          </h4>
          <div style={{ overflowX: 'auto', marginBottom: '15px', maxHeight: '180px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>ประเภทรางวัล</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>อัตราจ่าย (ตัวคูณ)</th>
                </tr>
              </thead>
              <tbody>
                {prizeRates.map((rate, index) => (
                  <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>
                      {rate.lottery_type}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>X</span>
                        <input 
                          type="number" 
                          value={rate.multiplier} 
                          onChange={(e) => { 
                            const newRates = [...prizeRates]; 
                            newRates[index].multiplier = e.target.value; 
                            setPrizeRates(newRates); 
                          }} 
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '110px', fontWeight: 'bold', outline: 'none' }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSavePrizeRates} style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={18} /> บันทึกอัตราจ่ายยี่กี
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 3. โซนวิเคราะห์ความเสี่ยง และ ตั้งผลการออกรางวัลยี่กี 🌟 */}
      {/* ------------------------------------------------------------------------- */}
      {selectedRound && selectedRound.status !== 'Completed' ? (
        <div style={{ backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px', border: '2px solid #fde68a', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.1)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
                <Crosshair size={26} /> ควบคุมการออกรางวัล (รอบที่ {selectedRound.round_number})
              </h4>
              <p style={{ margin: '5px 0 0 0', color: '#d97706', fontSize: '13px' }}>ระบุเลข 8 ตัวเพื่อคลุมรางวัลแจ็คพอตและเลขท้ายต่างๆ และเลข 2 ตัวสำหรับ 2 ตัวล่าง</p>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: settings.is_auto_draw ? '#10b981' : '#e2e8f0', color: settings.is_auto_draw ? 'white' : '#475569', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.3s', boxShadow: settings.is_auto_draw ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none' }}>
              <input type="checkbox" checked={settings.is_auto_draw} onChange={(e) => handleToggleAutoDraw(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <Clock size={18} /> 
              {settings.is_auto_draw ? `ระบบออโต้ทำงาน (คุมยอดจ่าย ${targetPercent}%)` : 'เปิดใช้ออกเลขออโต้'}
            </label>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#334155', fontSize: '15px' }}>
              1. ให้ระบบแนะนำเลขเด็ด (เพื่อให้ยอดจ่ายไม่เกินเป้า)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <input 
                type="range" min="0" max="100" value={targetPercent} 
                onChange={(e) => setTargetPercent(e.target.value)} 
                style={{ flex: '1 1 200px', cursor: 'pointer', maxWidth: '400px' }} 
              />
              <span style={{ fontWeight: '900', color: '#d97706', fontSize: '22px', width: '60px' }}>
                {targetPercent}%
              </span>
              <button 
                onClick={handleSuggestDraw} disabled={isSuggesting} 
                style={{ flex: '1 1 auto', padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
              >
                <RefreshCw size={20} className={isSuggesting ? "spin" : ""} /> 
                {isSuggesting ? 'ระบบกำลังคำนวณ...' : 'สุ่มเลขที่ปลอดภัยที่สุด'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: '1 1 250px' }}>
              <span style={{ fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '8px' }}>
                เลข 8 หลัก (รางวัลซูเปอร์ + รางวัลบน):
              </span>
              <input 
                type="tel" placeholder="XXXXXXXX" maxLength="8" 
                value={simulatedTop} onChange={(e) => setSimulatedTop(e.target.value.replace(/\D/g, ''))} 
                style={{ width: '100%', padding: '12px 15px', fontSize: '24px', fontWeight: '900', borderRadius: '8px', border: '2px solid #fcd34d', outline: 'none', letterSpacing: '4px', color: '#b45309', textAlign: 'center', boxSizing: 'border-box' }} 
              />
            </div>
            
            <div style={{ flex: '1 1 150px' }}>
              <span style={{ fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '8px' }}>
                เลข 2 หลัก (สำหรับ 2 ตัวล่าง):
              </span>
              <input 
                type="tel" placeholder="XX" maxLength="2" 
                value={simulatedBottom} onChange={(e) => setSimulatedBottom(e.target.value.replace(/\D/g, ''))} 
                style={{ width: '100%', padding: '12px 15px', fontSize: '24px', fontWeight: '900', borderRadius: '8px', border: '2px solid #94a3b8', outline: 'none', letterSpacing: '4px', color: '#475569', textAlign: 'center', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button 
                onClick={handleAnalyzeDraw} 
                disabled={isAnalyzing || simulatedTop.length !== 8 || simulatedBottom.length !== 2} 
                style={{ padding: '15px 40px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '30px', cursor: (simulatedTop.length === 8 && simulatedBottom.length === 2) ? 'pointer' : 'not-allowed', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)', width: '100%', maxWidth: '300px', justifyContent: 'center' }}
              >
                {isAnalyzing ? 'กำลังประมวลผล...' : '🔍 กดเช็คยอดจ่ายทันที'}
              </button>
            </div>
          </div>

          {analysisResult && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '18px', textAlign: 'center' }}>
                จำลองผลการออกรางวัล เลข <span style={{ color: '#dc2626', fontSize: '22px', borderBottom: '2px dashed #dc2626' }}>{simulatedTop}</span> และล่าง <span style={{ color: '#475569', fontSize: '22px', borderBottom: '2px dashed #475569' }}>{simulatedBottom}</span>
              </h5>
              
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>รางวัล</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>เลขที่จะถูก</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>จำนวนคนซื้อถูก</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ยอดจ่ายสุทธิ (THB)</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>ตรวจสอบบิล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['8 ตัว (Super)', '4 ตัวท้าย', '3 ตัวบน', '3 ตัวโต๊ด', '2 ตัวบน', '2 ตัวล่าง', 'วิ่งบน', 'วิ่งล่าง'].map((type) => {
                      const data = analysisResult.analysis?.find(a => a.lottery_type === type);
                      
                      let numSlice = '-';
                      if (simulatedTop.length === 8 && simulatedBottom.length === 2) {
                          if (type === '8 ตัว (Super)') numSlice = simulatedTop;
                          if (type === '4 ตัวท้าย') numSlice = simulatedTop.slice(-4);
                          if (type === '3 ตัวบน') numSlice = simulatedTop.slice(-3);
                          if (type === '3 ตัวโต๊ด') numSlice = `สลับ (${simulatedTop.slice(-3)})`;
                          if (type === '2 ตัวบน') numSlice = simulatedTop.slice(-2);
                          if (type === '2 ตัวล่าง') numSlice = simulatedBottom;
                          if (type === 'วิ่งบน') numSlice = `มีใน (${simulatedTop.slice(-3)})`;
                          if (type === 'วิ่งล่าง') numSlice = `มีใน (${simulatedBottom})`;
                      }

                      const hasWinners = data && data.winner_count > 0;

                      return (
                        <tr key={type} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: hasWinners ? '#fef2f2' : 'white' }}>
                          <td style={{ padding: '10px', fontWeight: '900', color: '#334155' }}>{type}</td>
                          <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>{numSlice}</td>
                          <td style={{ padding: '10px', fontWeight: '900', fontSize: '15px', color: hasWinners ? '#16a34a' : '#94a3b8' }}>
                            {data ? data.winner_count : 0} คน
                          </td>
                          <td style={{ padding: '10px', fontWeight: '900', fontSize: '15px', color: hasWinners ? '#b91c1c' : '#94a3b8' }}>
                            {formatCurrency(data ? data.total_payout : 0)}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {hasWinners && (
                              <button onClick={() => fetchSimulatedUsers(type, numSlice)} style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                                <Eye size={16} /> ดูรายชื่อ
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal โชว์รายชื่อจำลอง */}
              {showSimulatedUsers && (
                <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '12px', marginTop: '15px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>รายชื่อผู้ที่ซื้อเลขนี้</h4>
                    <button onClick={() => setShowSimulatedUsers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={24} /></button>
                  </div>
                  {simulatedUserLoading ? ( <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>กำลังโหลด...</div> ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                            <th style={{ padding: '10px' }}>Username</th>
                            <th style={{ padding: '10px' }}>สกุลเงิน</th>
                            <th style={{ padding: '10px' }}>ยอดแทง</th>
                            <th style={{ padding: '10px', color: '#b91c1c' }}>รางวัล (สกุลเดิม)</th>
                            <th style={{ padding: '10px', color: '#0ea5e9' }}>เทียบเป็น THB</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulatedUsersList.map((u, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.username}</td>
                              <td style={{ padding: '10px' }}>{u.currency_code}</td>
                              <td style={{ padding: '10px' }}>{u.price.toLocaleString()}</td>
                              <td style={{ padding: '10px', fontWeight: '900', color: '#b91c1c' }}>{u.estimated_prize.toLocaleString()}</td>
                              <td style={{ padding: '10px', fontWeight: '900', color: '#0ea5e9' }}>{Number(u.estimated_prize_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดขายรวมรอบนี้ (THB)</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#0ea5e9' }}>{formatCurrency(analysisResult.totalSales)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดจ่ายรวม (Payout THB)</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>
                    {formatCurrency(analysisResult.analysis?.reduce((sum, item) => sum + item.total_payout, 0))}
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '2px dashed #cbd5e1', paddingTop: '25px' }}>
                <button 
                  onClick={handleExecuteDraw} disabled={isExecutingDraw} 
                  style={{ padding: '15px 30px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)', width: '100%', justifyContent: 'center' }}
                >
                  <CheckCircle size={24} /> 
                  {isExecutingDraw ? 'กำลังประมวลผลจ่ายเงินและตรวจบิล...' : `ยืนยันประกาศผลยี่กีรอบที่ ${selectedRound.round_number} ทันที!`}
                </button>
              </div>

            </div>
          )}
        </div>
      ) : (
        selectedRound && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', color: '#94a3b8', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
             <Ban size={48} style={{ margin: '0 auto 15px', color: '#cbd5e1' }} />
             <h3 style={{ margin: 0, color: '#475569' }}>รอบนี้ออกผลรางวัลเสร็จสิ้นแล้ว</h3>
             <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>ไม่สามารถแก้ไขหรือออกรางวัลซ้ำได้</p>
          </div>
        )
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 6. โซนค้นหารายชื่อคนซื้อตามเลขที่ระบุ (ค้นหาย้อนหลังได้) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9d174d', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Search size={22} color="#be185d" /> ค้นหาประวัติการซื้อจากตัวเลข (อิงตามวันที่เลือก)
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input 
            type="text" placeholder="กรอกตัวเลขที่ต้องการค้นหา" 
            value={searchNumber} 
            onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))} 
            style={{ flex: '1 1 200px', padding: '12px 15px', fontSize: '16px', borderRadius: '8px', border: '2px solid #fbcfe8', outline: 'none', fontWeight: 'bold', color: '#9d174d' }} 
          />
          <button 
            onClick={handleSearchBuyers} disabled={isSearchingBuyers} 
            style={{ flex: '0 0 auto', padding: '12px 25px', backgroundColor: '#be185d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}
          >
            {isSearchingBuyers ? 'กำลังค้นหา...' : 'ค้นหาประวัติ'}
          </button>
        </div>

        {searchedBuyers !== null && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', whiteSpace: 'nowrap', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdf2f8', color: '#831843' }}>
                  <th style={{ padding: '12px' }}>รอบที่</th>
                  <th style={{ padding: '12px' }}>ผู้ใช้</th>
                  <th style={{ padding: '12px' }}>ประเภท</th>
                  <th style={{ padding: '12px' }}>เลขที่ซื้อ</th>
                  <th style={{ padding: '12px' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px' }}>รางวัล (สกุลเดิม)</th>
                  <th style={{ padding: '12px', color: '#0ea5e9' }}>เทียบเป็น THB</th>
                </tr>
              </thead>
              <tbody>
                {searchedBuyers.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#9d174d' }}>{w.round_number}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '12px' }}>{w.lottery_type}</td>
                    <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold', fontSize: '15px' }}>{w.selected_number}</td>
                    <td style={{ padding: '12px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {w.estimated_prize.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#0ea5e9', fontWeight: 'bold' }}>
                      {Number(w.estimated_prize_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿
                    </td>
                  </tr>
                ))}
                {searchedBuyers.length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>ไม่พบประวัติการซื้อเลขนี้ในระบบ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageYeeki;