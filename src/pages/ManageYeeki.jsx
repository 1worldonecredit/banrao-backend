import React, { useState, useEffect } from 'react';
import { 
  Settings, Download, Trophy, Power, PlayCircle, StopCircle, 
  Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, 
  Crosshair, DollarSign, Search, CheckCircle, Eye, X, Clock, ChevronRight, Ban
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
  
  const savedDraft = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}');
  const [selectedDate, setSelectedDate] = useState(savedDraft.selectedDate || getTodayDate());
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  const [settings, setSettings] = useState({
    is_auto_draw: false, 
    auto_draw_percent: 50
  });
  
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState({ prize_8: '-', prize_4: '-', prize_3: '-', prize_2_top: '-', prize_2_bottom: '-' });
  const [now, setNow] = useState(new Date());

  // ==========================================
  // 🌟 State ระบบวิเคราะห์ & เรท
  // ==========================================
  const [prizeRates, setPrizeRates] = useState([]);
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  const [simulatedSuper, setSimulatedSuper] = useState(savedDraft.simulatedSuper || '');   
  const [simulatedTop, setSimulatedTop] = useState(savedDraft.simulatedTop || '');       
  const [simulatedBottom, setSimulatedBottom] = useState(savedDraft.simulatedBottom || ''); 
  
  const [analysisResult, setAnalysisResult] = useState(savedDraft.analysisResult || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [targetPercent, setTargetPercent] = useState(savedDraft.targetPercent || 50);
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

  const getCountdown = (targetDate) => {
    if (!targetDate) return '00:00:00';
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return '00:00:00';
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
    const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
    const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // ==========================================
  // 🌟 useEffect ต่างๆ
  // ==========================================
  useEffect(() => {
    const draft = {
      selectedDate,
      targetPercent,
      simulatedSuper,
      simulatedTop,
      simulatedBottom,
      analysisResult,
      selectedRoundId: selectedRound ? selectedRound.round_id : null
    };
    localStorage.setItem('yeekiManageDraft', JSON.stringify(draft));
  }, [selectedDate, targetPercent, simulatedSuper, simulatedTop, simulatedBottom, analysisResult, selectedRound]);

  useEffect(() => {
    fetchPrizeRates(); 
    fetchExchangeRates(); 
    fetchSettings();
  }, []);

  // 🌟 (ตัวที่คุณพี่เผลอลบไป!) ตัวสั่งให้ระบบโหลดข้อมูลรอบใหม่ทุกครั้งที่แอดมินเปลี่ยนวันที่บนปฏิทิน
  useEffect(() => {
    fetchRounds();
    fetchDrawHistory(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // 🌟 ฟังก์ชัน ดึงข้อมูลและจัดการ
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
        const draft = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}');
        if (!draft.targetPercent) setTargetPercent(data.data.auto_draw_percent || 50);
      }
    } catch (err) { console.error('Error fetching settings:', err); }
  };

  const fetchRounds = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds?date=${selectedDate}`);
      const data = await res.json();
      
      if (data.success && data.rounds && data.rounds.length > 0) {
        const dbRounds = data.rounds.map(r => ({
          round_id: r.round_id,
          round_number: r.round_number,
          openTime: new Date(r.open_time.replace(' ', 'T')),   
          closeTime: new Date(r.close_time.replace(' ', 'T')), 
          drawTime: new Date(r.draw_time.replace(' ', 'T')),   
          status: r.status 
        }));
        
        setRounds(dbRounds);
        
        const draftRoundId = JSON.parse(localStorage.getItem('yeekiManageDraft') || '{}').selectedRoundId;
        const foundDraftRound = dbRounds.find(r => r.round_id === draftRoundId);
        const firstPending = dbRounds.find(r => r.status === 'Pending' || r.status === 'Open' || r.status === 'Closed');
        
        setSelectedRound(foundDraftRound || firstPending || dbRounds[0]);
      } else {
        setRounds([]);
        setSelectedRound(null);
      }
    } catch (err) {
      console.error('Error fetching rounds:', err);
      setRounds([]);
      setSelectedRound(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchDrawHistory = async (date) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        if (data.results) {
          setResults({
            prize_8: data.results.result_8_super || '-',
            prize_4: data.results.result_4_top || '-',
            prize_3: data.results.result_3_top || '-',
            prize_2_top: data.results.result_4_top ? data.results.result_4_top.slice(-2) : '-',
            prize_2_bottom: data.results.result_2_bottom || '-'
          });
        }
        setWinners(data.winners || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/yeeki/prize-rates`);
      const data = await res.json();
      if (data.success && data.rates.length > 0) setPrizeRates(data.rates);
    } catch (err) { console.error('Error fetching prize rates:', err); }
  };

  const fetchExchangeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`);
      const data = await res.json();
      if (data.success) {
        const lakRate = data.rates.find(r => r.currency_pair === 'THB_LAK');
        if (lakRate) setExchangeRateLAK(lakRate.rate);
      }
    } catch (err) { console.error('Error fetching exchange rates:', err); }
  };

  const handleToggleAutoDraw = async (isChecked) => {
    const actionText = isChecked ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    if (!window.confirm(`⚠️ ยืนยันการ${actionText}ระบบออกเลขอัตโนมัติ ใช่หรือไม่?`)) return;

    const updated = { ...settings, is_auto_draw: isChecked, auto_draw_percent: targetPercent };
    setSettings(updated);
    try {
      const res = await fetch(`${API_URL}/api/yeeki/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
      });
      const data = await res.json();
      if (data.success) alert(isChecked ? `✅ เปิดใช้ออกเลขอัตโนมัติ (${targetPercent}%)` : '❌ ปิดใช้งานออกเลขอัตโนมัติแล้ว');
    } catch (err) { 
      console.error('Error toggling auto draw:', err); 
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ตั้งค่าออโต้');
    }
  };

  const handleSaveAutoPercent = async () => {
    if (!window.confirm(`⚠️ ยืนยันการตั้งเป้าหมายยอดจ่ายที่ ${targetPercent}% ใช่หรือไม่?\n(ระบบจะจำค่านี้ไว้ใช้เป็นเกณฑ์ในการสุ่มเลขอัตโนมัติ)`)) {
      setTargetPercent(settings.auto_draw_percent);
      return;
    }
    const updated = { ...settings, auto_draw_percent: targetPercent };
    setSettings(updated);
    try {
      const res = await fetch(`${API_URL}/api/yeeki/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
      });
      const data = await res.json();
      if (data.success) alert(`✅ บันทึกเป้าหมายที่ ${targetPercent}% เรียบร้อยแล้ว`);
    } catch (err) { console.error(err); }
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
      else alert(`❌ ไม่สามารถบันทึกได้: ${data.message}`);
    } catch (err) { 
      console.error('Error saving prize rates:', err); 
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API บันทึกเรทจ่าย');
    }
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
      else alert(`❌ ไม่สามารถบันทึกได้: ${data.message}`);
    } catch (err) { 
      console.error('Error saving exchange rate:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API อัตราแลกเปลี่ยน');
    }
  };

  const handleAnalyzeDraw = async () => {
    if (simulatedSuper.length !== 8) return alert('กรุณากรอกเลข Super Jackpot ให้ครบ 8 หลัก');
    if (simulatedTop.length !== 4) return alert('กรุณากรอกเลขบน ให้ครบ 4 หลัก');
    if (simulatedBottom.length !== 2) return alert('กรุณากรอกเลขล่างให้ครบ 2 หลัก');
    if (!selectedRound) return alert('กรุณาเลือกรอบที่ต้องการวิเคราะห์');

    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-yeeki-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          round_id: selectedRound.round_id, 
          super_number: simulatedSuper, 
          top_number: simulatedTop, 
          bottom_number: simulatedBottom 
        }) 
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
      else alert(`❌ วิเคราะห์ไม่สำเร็จ: ${data.message}`);
    } catch (err) { 
      console.error('Error analyzing draw:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API วิเคราะห์ผล');
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
        setSimulatedSuper(data.suggestedSuper);
        setSimulatedTop(data.suggestedTop);
        setSimulatedBottom(data.suggestedBottom);
        setAnalysisResult({ totalSales: data.totalSales, analysis: data.analysis });
      } else {
        alert(`❌ ไม่สามารถสุ่มเลขได้: ${data.message}`);
      }
    } catch (err) { 
      console.error('Error suggesting draw:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ระบบแนะนำเลข');
    } 
    finally { setIsSuggesting(false); }
  };

  const handleExecuteDraw = async () => {
    if (!window.confirm(`⚠️ ยืนยันประกาศผลยี่กี รอบที่ ${selectedRound.round_number} ใช่หรือไม่?\n\nแจ็คพอต 8 ตัว: ${simulatedSuper}\nเลขบน 4 ตัว: ${simulatedTop}\nเลขล่าง 2 ตัว: ${simulatedBottom}\n\n(ระบบจะตรวจบิลและแจกเงินรางวัลทันที)`)) return;
    
    setIsExecutingDraw(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/execute-yeeki-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          round_id: selectedRound.round_id, 
          super_number: simulatedSuper, 
          top_number: simulatedTop, 
          bottom_number: simulatedBottom 
        }) 
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        localStorage.removeItem('yeekiManageDraft');
        setSimulatedSuper(''); setSimulatedTop(''); setSimulatedBottom(''); setAnalysisResult(null);
        fetchRounds();
        fetchDrawHistory(selectedDate);
      } else {
        alert(`❌ ประกาศผลไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) { 
      console.error('Error executing draw:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ประกาศผลรางวัล');
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
      if (data.success) {
        setSimulatedUsersList(data.users);
      } else {
        alert(`❌ โหลดรายชื่อผู้ซื้อไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) { 
      console.error('Error fetching simulated users:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ดึงรายชื่อผู้ซื้อ');
    } 
    finally { setSimulatedUserLoading(false); }
  };

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
      } else {
        setSearchedBuyers([]);
        alert(`❌ ค้นหาไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) { 
      console.error('Error searching buyers:', err); 
      setSearchedBuyers([]);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ค้นหารายชื่อ');
    } 
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
      {/* ------------------------------------------------------------------------- */}
      {/* 1. โซนเลือกรอบของวัน (แบบการ์ด 24 รอบ เหมือนหน้าลูกค้า) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(219, 39, 119, 0.08)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#9d174d', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} /> เลือกรอบที่ต้องการจัดการ:
        </h4>
        
        {isProcessing ? (
           <div style={{ padding: '30px', textAlign: 'center', color: '#db2777' }}><RefreshCw className="spin" size={28}/></div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '15px', 
            maxHeight: '450px', // จำกัดความสูงให้มี Scrollbar (ไม่ให้หน้ายาวเกินไป)
            overflowY: 'auto', 
            padding: '5px' 
          }}>
            {rounds.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#ef4444', fontWeight: 'bold' }}>
                ไม่พบข้อมูลรอบของวันที่เลือกในระบบฐานข้อมูล
              </div>
            ) : rounds.map(r => {
              const isSelected = selectedRound?.round_id === r.round_id;
              const isCompleted = r.status === 'Completed';
              const isClosed = now > r.closeTime && !isCompleted;
              const isOpen = now >= r.openTime && now <= r.closeTime && !isCompleted;
              const isFuture = now < r.openTime && !isCompleted;

              let statusText = '';
              let statusColor = '';
              let IconComponent = Ban; 

              if (isCompleted) {
                  statusText = 'ออกผลแล้ว';
                  statusColor = '#9ca3af'; // สีเทา
                  IconComponent = CheckCircle;
              } else if (isClosed) {
                  statusText = 'หมดเวลาแทงแล้ว';
                  statusColor = '#ef4444'; // สีแดง
                  IconComponent = Ban;
              } else if (isOpen) {
                  statusText = getCountdown(r.closeTime); // แสดงเวลาถอยหลัง
                  statusColor = '#e11d48'; // สีแดงเข้ม
                  IconComponent = PlayCircle;
              } else if (isFuture) {
                  statusText = 'รอเปิดรับแทง';
                  statusColor = '#d97706'; // สีส้ม
                  IconComponent = Clock;
              }

              // ฟังก์ชันแปลงเวลา 00:00 น.
              const formatTimeOnly = (dateObj) => {
                  return dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' น.';
              };

              return (
                <div 
                  key={r.round_id}
                  onClick={() => { 
                    setSelectedRound(r); 
                    setAnalysisResult(null); setSimulatedSuper(''); setSimulatedTop(''); setSimulatedBottom(''); 
                  }}
                  style={{
                    backgroundColor: isSelected ? '#fdf2f8' : (isCompleted || isClosed) ? '#f9fafb' : 'white',
                    border: isSelected ? '2px solid #be185d' : (isCompleted || isClosed) ? '1px solid #e5e7eb' : isOpen ? '1px solid #fbcfe8' : '1px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '15px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(190, 24, 93, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    opacity: (isCompleted || isClosed) && !isSelected ? 0.7 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: isSelected ? '#be185d' : (isCompleted || isClosed) ? '#9ca3af' : '#db2777', fontWeight: 'bold', fontSize: '15px' }}>
                      <IconComponent size={18} /> รอบที่ {r.round_number}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
                      <span>เปิดขาย:</span> 
                      <span style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>{formatTimeOnly(r.openTime)}</span>
                      
                      <span>ปิดรับแทง:</span> 
                      <span style={{ textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{formatTimeOnly(r.closeTime)}</span>
                      
                      <span>ออกผล:</span> 
                      <span style={{ textAlign: 'right', color: '#d97706', fontWeight: 'bold' }}>{formatTimeOnly(r.drawTime)}</span>
                  </div>

                  <div style={{ textAlign: 'center', fontWeight: '900', fontSize: isOpen ? '18px' : '13px', color: statusColor }}>
                      {statusText}
                  </div>
                </div>
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
                <Crosshair size={26} /> ควบคุมการออกรางวัล (รอบที่ {selectedRound.round_number})
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                 <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fde68a' }}>
                    <Clock size={16} /> เหลือเวลาออกผล: {getCountdown(selectedRound.drawTime)}
                 </span>
                 <p style={{ margin: 0, color: '#d97706', fontSize: '13px' }}>
                    แยกระบบสุ่ม 3 ชุดอิสระ: ชุด 8 ตัว (Super), ชุด 4 ตัว (บน), ชุด 2 ตัว (ล่าง)
                 </p>
              </div>
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

              {/* 🌟 ปุ่มบันทึก % ถาวร */}
              <button 
                onClick={handleSaveAutoPercent} 
                style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
              >
                <Save size={16} /> บันทึก %
              </button>

              <button 
                onClick={handleSuggestDraw} disabled={isSuggesting} 
                style={{ flex: '1 1 auto', padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
              >
                <RefreshCw size={20} className={isSuggesting ? "spin" : ""} /> 
                {isSuggesting ? 'ระบบกำลังคำนวณแยกชุด...' : 'สุ่มเลขแบบแยกชุดที่ปลอดภัยที่สุด'}
              </button>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              * กด <b>"บันทึก %"</b> เพื่อให้ระบบจำค่านี้ไว้ใช้สุ่มเลขอัตโนมัติในทุกๆ รอบ
            </p>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontWeight: 'bold', color: '#7e22ce', display: 'block', marginBottom: '8px' }}>
                🏆 เลข 8 หลัก (Super Jackpot):
              </span>
              <input 
                type="tel" placeholder="XXXXXXXX" maxLength="8" 
                value={simulatedSuper} onChange={(e) => setSimulatedSuper(e.target.value.replace(/\D/g, ''))} 
                style={{ width: '100%', padding: '12px', fontSize: '22px', fontWeight: '900', borderRadius: '8px', border: '2px solid #c084fc', outline: 'none', letterSpacing: '4px', color: '#6b21a8', textAlign: 'center', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <span style={{ fontWeight: 'bold', color: '#b91c1c', display: 'block', marginBottom: '8px' }}>
                🔥 เลข 4 หลัก (รางวัลบน):
              </span>
              <input 
                type="tel" placeholder="XXXX" maxLength="4" 
                value={simulatedTop} onChange={(e) => setSimulatedTop(e.target.value.replace(/\D/g, ''))} 
                style={{ width: '100%', padding: '12px', fontSize: '22px', fontWeight: '900', borderRadius: '8px', border: '2px solid #fca5a5', outline: 'none', letterSpacing: '6px', color: '#991b1b', textAlign: 'center', boxSizing: 'border-box' }} 
              />
            </div>
            
            <div style={{ flex: '1 1 120px' }}>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>
                👇 เลข 2 หลัก (รางวัลล่าง):
              </span>
              <input 
                type="tel" placeholder="XX" maxLength="2" 
                value={simulatedBottom} onChange={(e) => setSimulatedBottom(e.target.value.replace(/\D/g, ''))} 
                style={{ width: '100%', padding: '12px', fontSize: '22px', fontWeight: '900', borderRadius: '8px', border: '2px solid #7dd3fc', outline: 'none', letterSpacing: '6px', color: '#075985', textAlign: 'center', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button 
                onClick={handleAnalyzeDraw} 
                disabled={isAnalyzing || simulatedSuper.length !== 8 || simulatedTop.length !== 4 || simulatedBottom.length !== 2} 
                style={{ padding: '15px 40px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '30px', cursor: (simulatedSuper.length === 8 && simulatedTop.length === 4 && simulatedBottom.length === 2) ? 'pointer' : 'not-allowed', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)', width: '100%', maxWidth: '300px', justifyContent: 'center' }}
              >
                {isAnalyzing ? 'กำลังประมวลผล...' : '🔍 กดเช็คยอดจ่ายทันที'}
              </button>
            </div>
          </div>

          {analysisResult && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '18px', textAlign: 'center' }}>
                จำลองผลออกรางวัล ซูเปอร์: <span style={{ color: '#7e22ce' }}>{simulatedSuper}</span> | บน: <span style={{ color: '#dc2626' }}>{simulatedTop}</span> | ล่าง: <span style={{ color: '#1d4ed8' }}>{simulatedBottom}</span>
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
                      if (simulatedSuper.length === 8 && simulatedTop.length === 4 && simulatedBottom.length === 2) {
                          if (type === '8 ตัว (Super)') numSlice = simulatedSuper;
                          if (type === '4 ตัวท้าย') numSlice = simulatedTop;
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
                          <td style={{ padding: '10px', fontWeight: '900', color: type === '8 ตัว (Super)' ? '#7e22ce' : '#334155' }}>{type}</td>
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

              {/* Modal โชว์รายชื่อ */}
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
                          {simulatedUsersList.length === 0 && (
                            <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>ไม่พบรายชื่อผู้ถูกรางวัล</td></tr>
                          )}
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
              
              {(() => {
                const totalPayout = analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0);
                const riskPercent = analysisResult.totalSales > 0 ? (totalPayout / analysisResult.totalSales) * 100 : 0;
                let alertColor = '#166534'; 
                let alertBg = '#f0fdf4'; 
                let alertText = '(ปลอดภัย ระบบมีกำไร)';

                if (riskPercent > 100) { 
                  alertColor = '#b91c1c'; alertBg = '#fef2f2'; alertText = '(ขาดทุนยับ!)'; 
                } else if (riskPercent >= 90) { 
                  alertColor = '#d97706'; alertBg = '#fffbeb'; alertText = '(กำไรน้อยมาก/เกือบเท่าทุน)'; 
                } else if (riskPercent > targetPercent) { 
                  alertColor = '#c2410c'; alertBg = '#ffedd5'; alertText = '(จ่ายสูงกว่าเป้าหมายที่ตั้ง)'; 
                }

                return ( 
                  <div style={{ marginTop: '15px', textAlign: 'center', padding: '10px', backgroundColor: alertBg, borderRadius: '8px', color: alertColor, fontWeight: 'bold', fontSize: '13px' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> 
                    สัดส่วนยอดจ่าย: {riskPercent.toFixed(2)}% {alertText}
                  </div> 
                );
              })()}

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
      {/* 4. โซนผลรางวัลประจำวัน (โชว์สถานะชัดเจน) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
            ผลการออกรางวัล งวด <span style={{ color: '#d11010' }}>{formatThaiDateFull(selectedDate)}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '5px 12px', borderRadius: '20px' }}>
            <Calendar size={16} color="#64748b" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', fontWeight: 'bold', color: '#334155' }} 
            />
          </div>
        </div>

        {isProcessing ? ( 
          <div style={{ padding: '30px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div> 
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            {[ 
              { label: '8 ตัว (Super Jackpot)', val: results.prize_8, color: '#7e22ce' }, 
              { label: '4 ตัวบน', val: results.prize_4, color: '#dc2626' }, 
              { label: '3 ตัวบน', val: results.prize_3, color: '#ea580c' }, 
              { label: '2 ตัวบน', val: results.prize_2_top, color: '#f59e0b' }, 
              { label: '2 ตัวล่าง', val: results.prize_2_bottom, color: '#1d4ed8' } 
            ].map(p => (
              <div key={p.label} style={{ flex: '1 1 120px', padding: '15px 10px', border: `2px solid ${p.color}`, borderRadius: '10px', minWidth: '120px', maxWidth: '200px', backgroundColor: '#f8fafc' }}>
                <p style={{ margin: '0 0 10px 0', color: p.color, fontSize: '13px', fontWeight: '900' }}>{p.label}</p>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', letterSpacing: '2px', fontWeight: '900' }}>{p.val}</h2>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 5. โซนตารางรายชื่อผู้ถูกรางวัล */}
      {/* ------------------------------------------------------------------------- */}
      {winners.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: '0', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
              <Trophy size={20} /> รายชื่อผู้ถูกรางวัลประจำวัน
            </h4>
            <button 
              onClick={exportPDF} 
              style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}
            >
              <Download size={16} /> โหลด PDF
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {[ 
              { id: 'all', label: 'ทั้งหมด' }, 
              { id: '8 ตัว (Super)', label: '8 ตัว (Super)' }, 
              { id: '4 ตัวท้าย', label: '4 ตัวท้าย' }, 
              { id: '3 ตัวบน', label: '3 ตัวบน' }, 
              { id: '3 ตัวโต๊ด', label: '3 ตัวโต๊ด' }, 
              { id: '2 ตัวบน', label: '2 ตัวบน' },
              { id: '2 ตัวล่าง', label: '2 ตัวล่าง' } 
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                style={{ padding: '6px 12px', backgroundColor: activeTab === tab.id ? '#0ea5e9' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748b', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px', whiteSpace: 'nowrap', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>รอบที่</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ถูก</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>ยอดซื้อ</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>เงินรางวัลที่ได้</th>
                </tr>
              </thead>
              <tbody>
                {filteredWinners.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#9d174d' }}>{w.round_number}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '10px' }}>{w.lottery_type}</td>
                    <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                    <td style={{ padding: '10px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold' }}>+ {w.prize_amount.toLocaleString()} {w.currency_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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