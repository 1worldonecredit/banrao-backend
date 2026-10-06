import React, { useState, useEffect } from 'react';
import { 
  Settings, Download, Trophy, Power, PlayCircle, StopCircle, 
  Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, 
  Crosshair, DollarSign, Search, CheckCircle, Eye, X, Clock 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  // ==========================================
  // 🌟 State หลัก
  // ==========================================
  const [settings, setSettings] = useState({
    close_time: '17:00',
    open_time: '18:00',
    draw_time: '17:30',
    is_sales_open: true,
    is_auto_draw: false, 
    auto_draw_percent: 50
  });
  
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // 🌟 เพิ่ม State สำหรับแท็บสกุลเงิน
  const [activeCurrencyTab, setActiveCurrencyTab] = useState('ALL'); 
  const [isProcessing, setIsProcessing] = useState(false);

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // ==========================================
  // 🌟 State ระบบวิเคราะห์ & เรท
  // ==========================================
  const [prizeRates, setPrizeRates] = useState([]);
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  const [simulatedNumber, setSimulatedNumber] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [targetPercent, setTargetPercent] = useState(50);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExecutingDraw, setIsExecutingDraw] = useState(false);

  // ==========================================
  // 🌟 State สำหรับค้นหารายชื่อคนซื้อจากเลข
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
    fetchSettings();
    fetchPrizeRates(); 
    fetchExchangeRates(); 
  }, []);

  useEffect(() => {
    fetchDrawHistory(selectedDate);
  }, [selectedDate]);
// ==========================================
  // 🌟 ฟังก์ชัน ดึง/บันทึก 
  // ==========================================
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`);
      const data = await res.json();
      if (data.success) { 
        // ตรวจสอบโครงสร้างก่อน ถ้าใช้ data.settings ก็เปลี่ยนให้ตรง
        const settingsData = data.settings || data.data; // เผื่อเหนียวไว้ทั้งสองแบบ

        const formatTime24 = (timeStr) => timeStr ? timeStr.substring(0, 5) : '00:00';
        
        setSettings({
            close_time: formatTime24(settingsData.close_time) || '17:00',
            open_time: formatTime24(settingsData.open_time) || '18:00',
            draw_time: formatTime24(settingsData.draw_time) || '17:30',
            is_sales_open: settingsData.is_sales_open,
            is_auto_draw: settingsData.is_auto_draw || false,
            // 🌟 แก้ไขจุดอ้างอิงตรงนี้ เปลี่ยน || เป็น ?? เพื่อให้รับค่า 0 ได้
            auto_draw_percent: settingsData.auto_draw_percent ?? 50
        });
        
        // 🌟 แก้ไขจุดอ้างอิงตรงนี้ด้วย เปลี่ยน || เป็น ??
        setTargetPercent(settingsData.auto_draw_percent ?? 50);
      }
    } catch (err) { console.error('Error fetching settings:', err); }
  };

// 🌟 1. สร้างฟังก์ชันดึงข้อมูล (วางไว้ข้างนอก useEffect เพื่อให้เรียกใช้ได้จากทุกที่ ป้องกัน Error)
  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prize-rates`); 
      const data = await res.json();
      
      if (data.success && data.data) {
        setPrizeRates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch prize rates:', err);
    }
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

  const fetchDrawHistory = async (date) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        if (data.results) {
          setResults(data.results);
        } else {
          setResults({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
        }
        setWinners(data.winners || []);
      }
    } catch (err) {
      console.error('Error fetching draw history:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSettings = async (field, value) => {
    const updated = { ...settings, [field]: value };
    
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
      });
      const data = await res.json();
      
      if (data.success) {
        setSettings(updated);
        alert('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        alert(`❌ ระบบหลังบ้านแจ้ง Error: ${data.message}`);
      }
    } catch (err) { 
      console.error(err); 
      alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleToggleAutoDraw = async (isChecked) => {
    const actionText = isChecked ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    if (!window.confirm(`⚠️ ยืนยันการ${actionText}ระบบออกเลขอัตโนมัติ ใช่หรือไม่?`)) return;

    const updated = { ...settings, is_auto_draw: isChecked, auto_draw_percent: targetPercent };
    
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(updated) 
      });
      const data = await res.json();
      
      if (data.success) {
        setSettings(updated);
        alert(isChecked ? `✅ เปิดใช้งานระบบอัตโนมัติเรียบร้อย ระบบจะคุมเป้าหมายจ่ายที่ ${targetPercent}%` : '❌ ปิดใช้งานออกเลขอัตโนมัติแล้ว');
      } else {
        alert(`❌ ระบบหลังบ้านแจ้ง Error: ${data.message}`);
        fetchSettings(); // โหลดค่าเดิมกลับมา
      }
    } catch (err) { 
      console.error(err); 
      alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ (การบันทึกล้มเหลว)');
      fetchSettings(); // โหลดค่าเดิมกลับมา
    }
  };

 const handleSaveAutoPercent = async () => {
    // ดักไว้ก่อนว่าผู้ใช้กดยืนยันไหม
    const isConfirmed = window.confirm(`⚠️ ยืนยันการตั้งค่า "สัดส่วนเป้าหมายการจ่ายเงิน" เป็น ${targetPercent}% ใช่หรือไม่?\n(ระบบจะจดจำค่านี้ไว้ใช้คำนวณ)`);
    
    // ถ้าผู้ใช้กด "ยกเลิก" (Cancel)
    if (!isConfirmed) {
        // ให้เด้งสไลเดอร์กลับไปที่ค่าเดิมที่เคยบันทึกไว้ใน settings
        setTargetPercent(settings.auto_draw_percent || 50);
        return; 
    }

    // 🌟 แปลงค่าให้เป็นตัวเลข (Number) ก่อนส่ง เพื่อป้องกันบั๊กที่ส่งไปเป็น String 
    const numericPercent = Number(targetPercent);

    const updated = { ...settings, auto_draw_percent: numericPercent };

    try {
        const res = await fetch(`${API_URL}/api/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        const data = await res.json();

        if (data.success) {
            setSettings(updated);
            alert(`✅ บันทึกเป้าหมายการจ่ายเงินที่ ${numericPercent}% เรียบร้อยแล้ว (ระบบบันทึกค่าไว้แล้ว)`);
        } else {
            alert(`❌ ระบบหลังบ้านแจ้ง Error: ${data.message}`);
            // ถ้าบันทึกไม่สำเร็จ ค่อยเด้งสไลเดอร์กลับ
            setTargetPercent(settings.auto_draw_percent || 50); 
        }
    } catch (err) {
        console.error(err);
        alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ (การบันทึกล้มเหลว)');
        // ถ้าติดต่อเซิร์ฟเวอร์ไม่ได้ ก็เด้งสไลเดอร์กลับเช่นกัน
        setTargetPercent(settings.auto_draw_percent || 50); 
    }
  };
  const handleSaveAllTimes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(settings) 
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกเวลาทั้งหมดเรียบร้อยแล้ว');
      } else {
        alert(`❌ ระบบหลังบ้านแจ้ง Error: ${data.message}`);
      }
    } catch (err) { 
      console.error(err); 
      alert('❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleSavePrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ rates: prizeRates }) 
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกอัตราการจ่ายสำเร็จ!');
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน วิเคราะห์ & ออกรางวัลจริง
  // ==========================================
  const handleAnalyzeDraw = async () => {
    if (simulatedNumber.length !== 6) return alert('กรุณากรอกเลขให้ครบ 6 หลักครับ');
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ number: simulatedNumber }) 
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
    } catch (err) { console.error(err); } 
    finally { setIsAnalyzing(false); }
  };

  const handleSuggestDraw = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/suggest-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ targetPercent }) 
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedNumber(data.suggestedNumber);
        setAnalysisResult({ totalSales: data.totalSales, analysis: data.analysis });
      }
    } catch (err) { console.error(err); } 
    finally { setIsSuggesting(false); }
  };

  const handleExecuteDraw = async () => {
    if (!window.confirm(`⚠️ คำเตือน! คุณยืนยันที่จะออกรางวัลด้วยหมายเลข ${simulatedNumber} ใช่หรือไม่?\n\n(การกระทำนี้จะตรวจบิลทั้งหมดที่ค้างอยู่ และแจกเงินลูกค้าทันที)`)) return;
    
    setIsExecutingDraw(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/execute-draw`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ number6: simulatedNumber }) 
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDrawHistory(selectedDate);
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการออกรางวัล: ${data.message || ''}`);
      }
    } catch (err) { console.error(err); } 
    finally { setIsExecutingDraw(false); }
  };

  const fetchSimulatedUsers = async (type, numberStr) => {
    setSimulatedUserLoading(true);
    setShowSimulatedUsers(true);
    setSimulatedUsersList([]);
    try {
      const res = await fetch(`${API_URL}/api/admin/simulate-winners`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: numberStr, lottery_type: type })
      });
      const data = await res.json();
      if (data.success) setSimulatedUsersList(data.users);
    } catch (err) { console.error(err); } 
    finally { setSimulatedUserLoading(false); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน ค้นหาผู้ซื้อจากเลข
  // ==========================================
  const handleSearchBuyers = async () => {
    if (!searchNumber) return alert('กรุณากรอกเลขที่ต้องการค้นหา');
    setIsSearchingBuyers(true);
    setSearchedBuyers(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/search-buyers`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ number: searchNumber }) 
      });
      const data = await res.json();
      if (data.success) {
        setSearchedBuyers(data.buyers);
      } else {
        alert('เกิดข้อผิดพลาดในการค้นหา');
      }
    } catch (err) { console.error(err); } 
    finally { setIsSearchingBuyers(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF(); 
    doc.addFont('THSarabunNew', 'normal'); 
    doc.setFontSize(18); 
    doc.text(`Winners Report - ${formatThaiDateFull(selectedDate)}`, 14, 20);
    const tableColumn = ["Username", "Type", "Number", "Bet Amount", "Prize Amount", "Currency"];
    const tableRows = [];
    filteredWinners.forEach(w => {
      tableRows.push([ 
        w.username, 
        `${w.lottery_type} Digits`, 
        w.selected_number, 
        w.price, 
        w.prize_amount, 
        w.currency_code 
      ]);
    });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 }); 
    doc.save(`winners_report_${selectedDate}.pdf`);
  };

  // 🌟🌟 จัดเรียงข้อมูลผู้ถูกรางวัล (กรองเลข, กรองสกุลเงิน, เรียงลำดับจากมากไปน้อย)
  const filteredWinners = winners
    .filter(w => activeTab === 'all' || w.lottery_type === activeTab)
    .filter(w => activeCurrencyTab === 'ALL' || w.currency_code === activeCurrencyTab)
    .sort((a, b) => {
      if (a.lottery_type < b.lottery_type) return -1;
      if (a.lottery_type > b.lottery_type) return 1;
      return b.prize_amount - a.prize_amount;
    });

return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>
        จัดการผลรางวัล (Oversee The Prize)
      </h2>
      
      {/* ------------------------------------------------------------------------- */}
      {/* 1. โซนตั้งเวลา */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Settings size={20} color="#0ea5e9" /> 
          ตั้งเวลาการทำงานของระบบ (ออกรางวัลอัตโนมัติตามเวลา)
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          
          {/* 1. เวลาปิดรับซื้อ */}
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <p style={{ margin: '0 0 8px 0', color: '#b91c1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StopCircle size={16} /> 1. เวลาปิดรับซื้อ
            </p>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <select 
                value={settings.close_time.split(':')[0] || '17'} 
                onChange={(e) => setSettings({ ...settings, close_time: `${e.target.value}:${settings.close_time.split(':')[1] || '00'}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: 'white', outline: 'none' }}
              >
                {[...Array(24)].map((_,i) => <option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} น.</option>)}
              </select>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#b91c1c' }}>:</span>
              <select 
                value={settings.close_time.split(':')[1] || '00'} 
                onChange={(e) => setSettings({ ...settings, close_time: `${settings.close_time.split(':')[0] || '17'}:${e.target.value}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: 'white', outline: 'none' }}
              >
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m} นาที</option>)}
              </select>
            </div>
          </div>

          {/* 2. เวลาออกเลข */}
          <div style={{ padding: '15px', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <p style={{ margin: '0 0 8px 0', color: '#d97706', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlayCircle size={16} /> 2. เวลาออกเลข (ประกาศผล)
            </p>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <select 
                value={settings.draw_time.split(':')[0] || '17'} 
                onChange={(e) => setSettings({ ...settings, draw_time: `${e.target.value}:${settings.draw_time.split(':')[1] || '00'}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #fcd34d', backgroundColor: 'white', outline: 'none' }}
              >
                {[...Array(24)].map((_,i) => <option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} น.</option>)}
              </select>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#d97706' }}>:</span>
              <select 
                value={settings.draw_time.split(':')[1] || '00'} 
                onChange={(e) => setSettings({ ...settings, draw_time: `${settings.draw_time.split(':')[0] || '17'}:${e.target.value}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #fcd34d', backgroundColor: 'white', outline: 'none' }}
              >
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m} นาที</option>)}
              </select>
            </div>
          </div>

          {/* 3. เวลาเปิดรับซื้อ */}
          <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#15803d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={16} /> 3. เวลาเปิดรับซื้อ (งวดถัดไป)
            </p>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <select 
                value={settings.open_time.split(':')[0] || '18'} 
                onChange={(e) => setSettings({ ...settings, open_time: `${e.target.value}:${settings.open_time.split(':')[1] || '00'}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #86efac', backgroundColor: 'white', outline: 'none' }}
              >
                {[...Array(24)].map((_,i) => <option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} น.</option>)}
              </select>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#15803d' }}>:</span>
              <select 
                value={settings.open_time.split(':')[1] || '00'} 
                onChange={(e) => setSettings({ ...settings, open_time: `${settings.open_time.split(':')[0] || '18'}:${e.target.value}` })}
                style={{ padding: '10px', width: '100%', fontSize: '15px', borderRadius: '8px', border: '1px solid #86efac', backgroundColor: 'white', outline: 'none' }}
              >
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m} นาที</option>)}
              </select>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
          <button 
            onClick={handleSaveAllTimes} 
            style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            💾 บันทึกเวลาทั้งหมด
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>
              สถานะระบบตอนนี้:
            </span>
            <button 
              onClick={() => handleUpdateSettings('is_sales_open', !settings.is_sales_open)} 
              style={{ padding: '10px 20px', backgroundColor: settings.is_sales_open ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Power size={18} /> 
              {settings.is_sales_open ? 'บังคับ "ปิด" รับซื้อเดี๋ยวนี้' : 'เปิดรับซื้อตามปกติ'}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. โซนตั้งค่าเรทเงิน & อัตราจ่าย */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* อัตราแลกเปลี่ยน */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#15803d" /> 
            อัตราแลกเปลี่ยน (LAK เป็น THB)
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', backgroundColor: '#f0fdf4', padding: '10px 15px', borderRadius: '8px', border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
              1 THB = 
            </span>
            <input 
              type="number" 
              value={exchangeRateLAK} 
              onChange={(e) => setExchangeRateLAK(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px', fontWeight: 'bold', fontSize: '16px' }} 
            />
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
              LAK
            </span>
          </div>
          <button 
            onClick={handleSaveExchangeRate} 
            style={{ padding: '10px 20px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={18} /> บันทึกเรทแลกเปลี่ยน
          </button>
        </div>

        {/* อัตราการจ่ายรางวัล */}
        {/* อัตราการจ่ายรางวัล */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#8b5cf6" /> 
            ปรับอัตราการจ่ายรางวัล (ตัวคูณ)
          </h4>
          <div style={{ overflowX: 'auto', marginBottom: '15px', maxHeight: '250px' }}> {/* 🌟 เพิ่มความสูงให้โชว์ครบ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>รางวัล</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>อัตราจ่าย (ตัวคูณ)</th>
                </tr>
              </thead>
              <tbody>
                {/* 🌟 เอา .filter(r => r.lottery_type !== '8') ออก เพื่อให้แสดงครบทุกรายการ */}
                {prizeRates.map((rate, index) => {
                  // 🌟 จัดรูปแบบชื่อให้สวยงามตามประเภทที่ดึงมาจาก Database
                  let displayName = rate.lottery_type;
                  if (['2', '3', '4', '6'].includes(rate.lottery_type)) {
                      displayName = `${rate.lottery_type} ตัว`;
                  }
                  
                  return (
                    <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>
                        {displayName}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>X</span>
                          <input 
                            type="number" 
                            step="0.01" // 🌟 เพิ่ม step เพื่อให้รองรับทศนิยมของเลขวิ่ง (เช่น 3.2, 4.2)
                            value={rate.multiplier} 
                            onChange={(e) => { 
                              const newRates = [...prizeRates]; 
                              newRates[index].multiplier = e.target.value; 
                              setPrizeRates(newRates); 
                            }} 
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '90px', fontWeight: 'bold' }} 
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <button 
            onClick={handleSavePrizeRates} // 🌟 ใช้ฟังก์ชันเดิมที่คุณวิทยามีอยู่แล้วได้เลยครับ!
            style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={18} /> บันทึกอัตราจ่าย
          </button>
        </div>

      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 3. โซนวิเคราะห์ความเสี่ยง และ ตั้งค่า AUTO-DRAW 🌟 */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={24} /> วิเคราะห์ความเสี่ยง และ ตั้งผลการออกรางวัล
          </h4>
          
          {/* 🌟 Checkbox เปิดระบบอัตโนมัติ */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: settings.is_auto_draw ? '#10b981' : '#e2e8f0', color: settings.is_auto_draw ? 'white' : '#475569', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' }}>
            <input 
              type="checkbox" 
              checked={settings.is_auto_draw} 
              onChange={(e) => handleToggleAutoDraw(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <Clock size={16} /> 
            {settings.is_auto_draw ? `ระบบออโต้ทำงาน (เป้า ${settings.auto_draw_percent}%)` : 'เปิดระบบออกเลขอัตโนมัติ'}
          </label>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#334155' }}>
            1. ให้ระบบแนะนำเลข (คุมยอดจ่ายให้ไม่เกินเป้าหมาย)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="range" min="0" max="100" 
              value={targetPercent} 
              onChange={(e) => setTargetPercent(e.target.value)} 
              style={{ flex: '1 1 150px', cursor: 'pointer', maxWidth: '300px' }} 
            />
            <span style={{ fontWeight: 'bold', color: '#d97706', fontSize: '18px', width: '50px' }}>
              {targetPercent}%
            </span>

            {/* 🌟 ปุ่มบันทึก % การสุ่ม (ค้างค่าถาวร) */}
            <button 
              onClick={handleSaveAutoPercent} 
              style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
            >
              <Save size={14} /> บันทึก %
            </button>

            <button 
              onClick={handleSuggestDraw} 
              disabled={isSuggesting} 
              style={{ flex: '1 1 auto', padding: '10px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <RefreshCw size={18} className={isSuggesting ? "spin" : ""} /> 
              {isSuggesting ? 'กำลังค้นหา...' : 'สุ่มหาเลข'}
            </button>
          </div>

          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            * หากตั้งค่า % แล้วกด <b>"บันทึก %"</b> ระบบจะจำค่านี้ไว้ถาวร และใช้คุมยอดจ่ายเมื่อออโต้ทำงาน
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontWeight: 'bold', color: '#334155' }}>
            2. ลองกรอกเลขเอง:
          </span>
          <input 
            type="text" placeholder="เลข 6 หลัก" maxLength="6" 
            value={simulatedNumber} 
            onChange={(e) => setSimulatedNumber(e.target.value.replace(/\D/g, ''))} 
            style={{ flex: '1 1 150px', padding: '10px 15px', fontSize: '20px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid #fcd34d', outline: 'none', letterSpacing: '2px', color: '#b45309', textAlign: 'center', maxWidth: '200px' }} 
          />
          <button 
            onClick={handleAnalyzeDraw} 
            disabled={isAnalyzing || simulatedNumber.length !== 6} 
            style={{ flex: '1 1 auto', padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: (simulatedNumber.length === 6) ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isAnalyzing ? 'วิเคราะห์...' : '🔍 เช็คยอดจ่าย'}
          </button>
        </div>

        {analysisResult && (
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '15px' }}>
              ผลการวิเคราะห์ยอดบิลทั้งหมด ถ้าตั้งผลเป็น 
              <span style={{ color: '#dc2626', fontSize: '20px', borderBottom: '2px dashed #dc2626', marginLeft: '8px' }}>
                {simulatedNumber}
              </span>
            </h5>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '15px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>รางวัล</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>เลขที่ถูก</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>จำนวนคนถูก</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>ยอดจ่ายรางวัล (THB)</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>ดูรายชื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {['6', '4', '3', '2'].map((type) => {
                    const data = analysisResult.analysis.find(a => a.lottery_type === type);
                    const numSlice = simulatedNumber.slice(-parseInt(type));
                    return (
                      <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>
                          {type} ตัว
                        </td>
                        <td style={{ padding: '8px', color: '#dc2626', fontWeight: 'bold', letterSpacing: '1px' }}>
                          {numSlice}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: data && data.winner_count > 0 ? '#16a34a' : '#94a3b8' }}>
                          {data ? data.winner_count : 0} คน
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: data && data.winner_count > 0 ? '#b91c1c' : '#94a3b8' }}>
                          {formatCurrency(data ? data.total_payout : 0)}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {data && data.winner_count > 0 && (
                            <button 
                              onClick={() => fetchSimulatedUsers(type, numSlice)} 
                              style={{ padding: '4px 10px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}
                            >
                              <Eye size={14} /> ตรวจสอบ
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
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                    รายชื่อผู้ที่ซื้อเลขนี้
                  </h4>
                  <button onClick={() => setShowSimulatedUsers(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <X size={20} />
                  </button>
                </div>
                {simulatedUserLoading ? ( 
                  <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>กำลังโหลด...</div> 
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                          <th style={{ padding: '6px' }}>Username</th>
                          <th style={{ padding: '6px' }}>สกุลเงิน</th>
                          <th style={{ padding: '6px' }}>ยอดแทง</th>
                          <th style={{ padding: '6px', color: '#b91c1c' }}>รางวัล (สกุลเดิม)</th>
                          <th style={{ padding: '6px', color: '#0ea5e9' }}>เทียบเป็น THB</th> 
                        </tr>
                      </thead>
                      <tbody>
                        {simulatedUsersList.map((u, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px', fontWeight: 'bold' }}>{u.username}</td>
                            <td style={{ padding: '6px' }}>{u.currency_code}</td>
                            <td style={{ padding: '6px' }}>{u.price.toLocaleString()}</td>
                            <td style={{ padding: '6px', fontWeight: 'bold', color: '#b91c1c' }}>{u.estimated_prize.toLocaleString()}</td>
                            <td style={{ padding: '6px', fontWeight: 'bold', color: '#0ea5e9' }}>
                              {Number(u.estimated_prize_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>ยอดขายรวม (เทียบ THB)</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0ea5e9' }}>
                  {formatCurrency(analysisResult.totalSales)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>ยอดจ่ายรวม (Payout)</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0))}
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

            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
              <button 
                onClick={handleExecuteDraw} 
                disabled={isExecutingDraw} 
                style={{ padding: '12px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.3)', width: '100%', justifyContent: 'center' }}
              >
                <CheckCircle size={20} /> 
                {isExecutingDraw ? 'กำลังประมวลผล...' : `ยืนยันใช้ผลเลข ${simulatedNumber}`}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 4. โซนผลรางวัลประจำวัน */}
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
              { label: '8 ตัว (ซูเปอร์)', val: results.prize_8, color: '#ec4899' }, 
              { label: '6 ตัว (ที่ 1)', val: results.prize_6, color: '#8b5cf6' }, 
              { label: '4 ตัวท้าย', val: results.prize_4, color: '#f59e0b' }, 
              { label: '3 ตัวท้าย', val: results.prize_3, color: '#10b981' }, 
              { label: '2 ตัวท้าย', val: results.prize_2, color: '#3b82f6' } 
            ].map(p => (
              <div key={p.label} style={{ flex: '1 1 100px', padding: '12px 8px', border: `2px solid ${p.color}`, borderRadius: '10px', minWidth: '100px', maxWidth: '150px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>{p.label}</p>
                <h2 style={{ margin: 0, color: p.color, fontSize: '26px', letterSpacing: '1px' }}>{p.val}</h2>
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
              <Trophy size={20} /> รายชื่อผู้ถูกรางวัล
            </h4>
            <button 
              onClick={exportPDF} 
              style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}
            >
              <Download size={16} /> โหลด PDF
            </button>
          </div>

          {/* 🌟 เพิ่มปุ่มกรองสกุลเงิน (Currency Tabs) ด้านบน */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {['ALL', 'THB', 'LAK'].map(curr => (
              <button 
                key={curr}
                onClick={() => setActiveCurrencyTab(curr)}
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: activeCurrencyTab === curr ? '#10b981' : '#f1f5f9', 
                  color: activeCurrencyTab === curr ? 'white' : '#64748b', 
                  border: 'none', 
                  borderRadius: '20px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '12px' 
                }}
              >
                {curr === 'ALL' ? 'สกุลเงินทั้งหมด' : `สกุลเงิน ${curr}`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {[ 
              { id: 'all', label: 'ทั้งหมด' }, 
              { id: '8', label: '8 ตัว' }, 
              { id: '6', label: '6 ตัว' }, 
              { id: '4', label: '4 ตัว' }, 
              { id: '3', label: '3 ตัว' }, 
              { id: '2', label: '2 ตัว' } 
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
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '10px' }}>{w.lottery_type} ตัว</td>
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
      {/* 6. โซนค้นหารายชื่อคนซื้อตามเลขที่ระบุ */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Search size={20} color="#0ea5e9" /> ค้นหาข้อมูลผู้ซื้อจากหมายเลข (อิงตามเวลาเปิด-ปิดรับซื้อ)
        </h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input 
            type="text" placeholder="กรอกตัวเลขที่ต้องการค้นหา" 
            value={searchNumber} 
            onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))} 
            style={{ flex: '1 1 200px', padding: '10px 15px', fontSize: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
          />
          <button 
            onClick={handleSearchBuyers} 
            disabled={isSearchingBuyers} 
            style={{ flex: '0 0 auto', padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSearchingBuyers ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>

        {searchedBuyers !== null && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px', whiteSpace: 'nowrap', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px' }}>ผู้ใช้</th>
                  <th style={{ padding: '10px' }}>ประเภท</th>
                  <th style={{ padding: '10px' }}>เลขที่ซื้อ</th>
                  <th style={{ padding: '10px' }}>ยอดซื้อ</th>
                  <th style={{ padding: '10px' }}>รางวัล (สกุลเดิม)</th>
                  <th style={{ padding: '10px', color: '#0ea5e9' }}>เทียบเป็น THB</th>
                  <th style={{ padding: '10px' }}>เวลาซื้อ</th>
                </tr>
              </thead>
              <tbody>
                {searchedBuyers.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '10px' }}>{w.lottery_type} ตัว</td>
                    <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                    <td style={{ padding: '10px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '10px', color: '#16a34a', fontWeight: 'bold' }}>+ {w.estimated_prize.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '10px', color: '#0ea5e9', fontWeight: 'bold' }}>
                      {Number(w.estimated_prize_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '11px' }}>{new Date(w.created_at).toLocaleString('th-TH')}</td>
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

export default OverseeThePrize;