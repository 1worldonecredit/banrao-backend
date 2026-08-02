import React, { useState, useEffect } from 'react';
import { Settings, Download, Trophy, Power, PlayCircle, StopCircle, Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, Crosshair, DollarSign, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  // ==========================================
  // 🌟 State เดิมของคุณ (ตั้งเวลา, ผลรางวัล)
  // ==========================================
  const [settings, setSettings] = useState({
    close_time: '17:00',
    open_time: '18:00',
    draw_time: '17:30',
    is_sales_open: true
  });
  
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // ==========================================
  // 🌟 State ใหม่ (เรทเงิน, เรทจ่าย, วิเคราะห์ความเสี่ยง)
  // ==========================================
  const [prizeRates, setPrizeRates] = useState([]);
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  const [simulatedNumber, setSimulatedNumber] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [targetPercent, setTargetPercent] = useState(50);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // ==========================================
  // 🌟 State สำหรับค้นหารายชื่อคนซื้อจากเลข (ระบบใหม่)
  // ==========================================
  const [searchNumber, setSearchNumber] = useState('');
  const [searchedBuyers, setSearchedBuyers] = useState(null); // ใช้ null เพื่อให้รู้ว่ายังไม่ได้ค้นหา
  const [isSearchingBuyers, setIsSearchingBuyers] = useState(false);

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
  // 🌟 useEffect สำหรับโหลดข้อมูลเริ่มต้น
  // ==========================================
  useEffect(() => {
    fetchSettings();
    fetchPrizeRates(); // ดึงอัตราจ่าย
    fetchExchangeRates(); // ดึงเรทแลกเปลี่ยน
  }, []);

  useEffect(() => {
    fetchDrawHistory(selectedDate);
  }, [selectedDate]);

  // ==========================================
  // 🌟 ฟังก์ชัน ดึง/บันทึก ข้อมูลต่างๆ
  // ==========================================
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          close_time: data.data.close_time || '17:00',
          open_time: data.data.open_time || '18:00',
          draw_time: data.data.draw_time || '17:30',
          is_sales_open: data.data.is_sales_open
        });
      }
    } catch (err) { console.error('Error fetching settings:', err); }
  };

  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`);
      const data = await res.json();
      if (data.success) setPrizeRates(data.rates);
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

  // --- บันทึก ---
  const handleUpdateSettings = async (field, value) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    try {
      await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated)
      });
      alert('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการบันทึก'); }
  };

  const handleSaveAllTimes = async () => {
    try {
      await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
      });
      alert('✅ บันทึกเวลาทั้งหมดเรียบร้อยแล้ว');
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการบันทึกเวลา'); }
  };

  const handleSavePrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates: prizeRates })
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกอัตราการจ่ายสำเร็จ!');
    } catch (err) { alert('❌ บันทึกไม่สำเร็จ'); }
  };

  const handleSaveExchangeRate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair: 'THB_LAK', rate: exchangeRateLAK })
      });
      const data = await res.json();
      if (data.success) alert('✅ อัปเดตอัตราแลกเปลี่ยนสำเร็จ! (มีผลกับการคำนวณทันที)');
    } catch (err) { alert('❌ อัปเดตไม่สำเร็จ'); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน วิเคราะห์ความเสี่ยง (เฉพาะเลข 6 ตัวตามสั่ง)
  // ==========================================
  const handleAnalyzeDraw = async () => {
    if (simulatedNumber.length !== 6) return alert('กรุณากรอกเลขให้ครบ 6 หลักครับ');
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-draw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: simulatedNumber })
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const handleSuggestDraw = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/suggest-draw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPercent })
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedNumber(data.suggestedNumber);
        setAnalysisResult({ totalSales: data.totalSales, analysis: data.analysis });
      }
    } catch (err) { console.error(err); } finally { setIsSuggesting(false); }
  };

  // ==========================================
  // 🌟 ฟังก์ชัน ค้นหาคนซื้อจากเลข (ระบบใหม่)
  // ==========================================
  const handleSearchBuyers = async () => {
    if (!searchNumber) return alert('กรุณากรอกเลขที่ต้องการค้นหา');
    setIsSearchingBuyers(true);
    setSearchedBuyers(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/search-buyers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: searchNumber })
      });
      const data = await res.json();
      if (data.success) {
        setSearchedBuyers(data.buyers);
      }
    } catch (err) { console.error(err); } finally { setIsSearchingBuyers(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('THSarabunNew', 'normal');
    doc.setFontSize(18);
    doc.text(`Winners Report - ${formatThaiDateFull(selectedDate)}`, 14, 20);
    
    const tableColumn = ["Username", "Type", "Number", "Bet Amount", "Prize Amount", "Currency"];
    const tableRows = [];

    filteredWinners.forEach(w => {
      const rowData = [ w.username, `${w.lottery_type} Digits`, w.selected_number, w.price, w.prize_amount, w.currency_code ];
      tableRows.push(rowData);
    });

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`winners_report_${selectedDate}.pdf`);
  };

  const filteredWinners = activeTab === 'all' ? winners : winners.filter(w => w.lottery_type === activeTab);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
      {/* ------------------------------------------------------------------------- */}
      {/* 1. โซนตั้งเวลา (โค้ดเก่าของคุณ 100%) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="#0ea5e9" /> ตั้งเวลาการทำงานของระบบ (ออกรางวัลอัตโนมัติตามเวลา)
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <p style={{ margin: '0 0 8px 0', color: '#b91c1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><StopCircle size={16} /> 1. เวลาปิดรับซื้อ</p>
            <input
              type="time"
              value={settings.close_time}
              onChange={(e) => setSettings({ ...settings, close_time: e.target.value })}
              style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #fca5a5', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ padding: '15px', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <p style={{ margin: '0 0 8px 0', color: '#d97706', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><PlayCircle size={16} /> 2. เวลาออกเลข (ประกาศผล)</p>
            <input
              type="time"
              value={settings.draw_time}
              onChange={(e) => setSettings({ ...settings, draw_time: e.target.value })}
              style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #fcd34d', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#15803d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><Play size={16} /> 3. เวลาเปิดรับซื้อ (งวดถัดไป)</p>
            <input
              type="time"
              value={settings.open_time}
              onChange={(e) => setSettings({ ...settings, open_time: e.target.value })}
              style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #86efac', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <button onClick={handleSaveAllTimes} style={{ padding: '12px 25px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            💾 บันทึกเวลาทั้งหมด
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>สถานะระบบตอนนี้:</span>
            <button
              onClick={() => handleUpdateSettings('is_sales_open', !settings.is_sales_open)}
              style={{ padding: '12px 20px', backgroundColor: settings.is_sales_open ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Power size={18} /> {settings.is_sales_open ? 'บังคับ "ปิด" รับซื้อเดี๋ยวนี้' : 'เปิดรับซื้อตามปกติ'}
            </button>
          </div>
        </div>
      </div>


      {/* ------------------------------------------------------------------------- */}
      {/* 2. โซนตั้งค่าเรทเงิน & อัตราจ่าย (ที่แทรกเพิ่มเข้ามาใหม่) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* อัตราแลกเปลี่ยน */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#15803d" /> อัตราแลกเปลี่ยน (LAK เป็น THB)
          </h4>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>ใช้สำหรับประเมินยอดขายและยอดจ่ายในหน้าวิเคราะห์ความเสี่ยง</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>1 THB = </span>
            <input 
              type="number" 
              value={exchangeRateLAK} 
              onChange={(e) => setExchangeRateLAK(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px', fontWeight: 'bold', fontSize: '16px' }}
            />
            <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>LAK</span>
          </div>
          <button onClick={handleSaveExchangeRate} style={{ padding: '10px 20px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={18} /> บันทึกเรทแลกเปลี่ยน
          </button>
        </div>

        {/* อัตราการจ่ายรางวัล */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#8b5cf6" /> ปรับอัตราการจ่ายรางวัล (ตัวคูณ)
          </h4>
          <div style={{ overflowX: 'auto', marginBottom: '15px', maxHeight: '180px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>รางวัล</th>
                  <th style={{ padding: '8px', borderBottom: '2px solid #e2e8f0' }}>อัตราจ่าย (ตัวคูณ)</th>
                </tr>
              </thead>
              <tbody>
                {prizeRates.filter(r => r.lottery_type !== '8').map((rate, index) => (
                  <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>{rate.lottery_type} ตัว</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>X</span>
                        <input 
                          type="number" 
                          value={rate.multiplier} 
                          onChange={(e) => {
                            const newRates = [...prizeRates];
                            const rateIndex = newRates.findIndex(r => r.id === rate.id);
                            newRates[rateIndex].multiplier = e.target.value;
                            setPrizeRates(newRates);
                          }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px', fontWeight: 'bold' }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleSavePrizeRates} style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={18} /> บันทึกอัตราจ่าย
          </button>
        </div>

      </div>


      {/* ------------------------------------------------------------------------- */}
      {/* 3. โซนวิเคราะห์ความเสี่ยง 0-100% (เลข 6 ตัว) ที่แทรกเพิ่มเข้ามาใหม่ */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: '#fffbeb', padding: '25px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair size={24} /> วิเคราะห์ความเสี่ยงก่อนตั้งผล (ดึงข้อมูลเฉพาะรอบที่เปิดรับซื้อล่าสุด)
        </h4>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            1. ให้ระบบคำนวณและสุ่มเลข (คุมยอดจ่ายให้ไม่เกินเป้าหมาย)
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="range" min="0" max="100" 
              value={targetPercent} 
              onChange={(e) => setTargetPercent(e.target.value)} 
              style={{ width: '200px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 'bold', color: '#d97706', fontSize: '20px', width: '60px' }}>{targetPercent}%</span>
            <button 
              onClick={handleSuggestDraw} disabled={isSuggesting}
              style={{ padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} className={isSuggesting ? "spin" : ""} /> 
              {isSuggesting ? 'กำลังค้นหาเลข...' : 'สุ่มหาเลขที่ยอดจ่ายไม่เกินกำหนด'}
            </button>
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>* เลื่อนไปที่ 0% ถ่ายอดขายน้อยและไม่อยากจ่ายเลย (ระบบกินเรียบ)</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontWeight: 'bold', color: '#334155' }}>2. หรือลองกรอกเลขเอง:</span>
          <input 
            type="text" placeholder="เลข 6 หลัก" maxLength="6"
            value={simulatedNumber}
            onChange={(e) => setSimulatedNumber(e.target.value.replace(/\D/g, ''))}
            style={{ padding: '12px 20px', fontSize: '22px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid #fcd34d', outline: 'none', width: '200px', letterSpacing: '4px', color: '#b45309', textAlign: 'center' }}
          />
          <button onClick={handleAnalyzeDraw} disabled={isAnalyzing || simulatedNumber.length !== 6} style={{ padding: '12px 25px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: (simulatedNumber.length === 6) ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isAnalyzing ? 'กำลังวิเคราะห์...' : '🔍 เช็คยอดจ่ายเลขนี้'}
          </button>
        </div>

        {analysisResult && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>
              ผลการวิเคราะห์ยอดบิลทั้งหมด ถ้าตั้งผลเป็น <span style={{ color: '#dc2626', fontSize: '22px', borderBottom: '2px dashed #dc2626' }}>{simulatedNumber}</span>
            </h5>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>รางวัล</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>เลขที่ถูก</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>จำนวนคนถูก</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>ยอดจ่ายรางวัล (THB)</th>
                </tr>
              </thead>
              <tbody>
                {['6', '4', '3', '2'].map((type) => {
                  const data = analysisResult.analysis.find(a => a.lottery_type === type);
                  const numSlice = simulatedNumber.slice(-parseInt(type));
                  return (
                    <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{type} ตัว</td>
                      <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold', letterSpacing: '2px' }}>{numSlice}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: data && data.winner_count > 0 ? '#16a34a' : '#94a3b8' }}>{data ? data.winner_count : 0} คน</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: data && data.winner_count > 0 ? '#b91c1c' : '#94a3b8' }}>{formatCurrency(data ? data.total_payout : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดขายรวมวันนี้ (เทียบค่า THB แล้ว)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>{formatCurrency(analysisResult.totalSales)} THB</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดจ่ายรวมถ้าออกเลขนี้ (Payout)</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0))} THB
                </span>
              </div>
            </div>
            
            {/* 🌟 อัปเดตตรรกะข้อความกำไรตามที่คุณสั่ง */}
            {(() => {
              const totalPayout = analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0);
              const riskPercent = analysisResult.totalSales > 0 ? (totalPayout / analysisResult.totalSales) * 100 : 0;
              let alertColor = '#166534'; 
              let alertBg = '#f0fdf4'; 
              let alertText = '(ปลอดภัย ระบบมีกำไร)';

              if (riskPercent > 100) { 
                alertColor = '#b91c1c'; alertBg = '#fef2f2'; alertText = '(ขาดทุนยับ!)'; 
              } else if (riskPercent >= 90) { 
                // 🌟 ถ้าแตะ 90% ขึ้นไป ถือว่ากำไรน้อยมาก จะไม่บอกว่าปลอดภัยแล้ว
                alertColor = '#d97706'; alertBg = '#fffbeb'; alertText = '(กำไรน้อยมาก/เกือบเท่าทุน)'; 
              } else if (riskPercent > targetPercent) { 
                alertColor = '#c2410c'; alertBg = '#ffedd5'; alertText = '(ยอดจ่ายสูงกว่าเป้าหมายที่ตั้งไว้)'; 
              }

              return (
                <div style={{ marginTop: '15px', textAlign: 'center', padding: '12px', backgroundColor: alertBg, borderRadius: '8px', color: alertColor, fontWeight: 'bold' }}>
                  <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                  สัดส่วนยอดจ่าย: {riskPercent.toFixed(2)}% {alertText}
                </div>
              );
            })()}
          </div>
        )}
      </div>


      {/* ------------------------------------------------------------------------- */}
      {/* 4. โซนผลรางวัลประจำวัน (โค้ดเก่าของคุณ 100%) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '22px' }}>
            ผลการออกรางวัลประจำงวดวันที่ <span style={{ color: '#d11010' }}>{formatThaiDateFull(selectedDate)}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '5px 15px', borderRadius: '20px' }}>
            <Calendar size={18} color="#64748b" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: 'bold', color: '#334155' }}
            />
          </div>
        </div>

        {isProcessing ? (
          <div style={{ padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
            {[
              { label: '8 ตัว (ซูเปอร์)', val: results.prize_8, color: '#ec4899' },
              { label: '6 ตัว (ที่ 1)', val: results.prize_6, color: '#8b5cf6' },
              { label: '4 ตัวท้าย', val: results.prize_4, color: '#f59e0b' },
              { label: '3 ตัวท้าย', val: results.prize_3, color: '#10b981' },
              { label: '2 ตัวท้าย', val: results.prize_2, color: '#3b82f6' }
            ].map(p => (
              <div key={p.label} style={{ flex: '1 1 120px', padding: '15px 10px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '120px', maxWidth: '200px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>{p.label}</p>
                <h2 style={{ margin: 0, color: p.color, fontSize: '32px', letterSpacing: '1px' }}>{p.val}</h2>
              </div>
            ))}
          </div>
        )}
        
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>
          * ระบบจะทำการออกรางวัลอัตโนมัติตาม <b>"เวลาออกเลข"</b> ที่ตั้งค่าไว้ด้านบน
        </p>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 5. โซนตารางรายชื่อผู้ถูกรางวัล (โค้ดเก่าของคุณ 100%) */}
      {/* ------------------------------------------------------------------------- */}
      {winners.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Trophy size={24} /> รายชื่อผู้ถูกรางวัล (งวด {formatThaiDateFull(selectedDate)})
            </h4>
            <button onClick={exportPDF} style={{ padding: '10px 20px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Download size={18} /> โหลดไฟล์ PDF
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: '8', label: 'รางวัล 8 ตัว' },
              { id: '6', label: 'รางวัล 6 ตัว' },
              { id: '4', label: '4 ตัวท้าย' },
              { id: '3', label: '3 ตัวท้าย' },
              { id: '2', label: '2 ตัวท้าย' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: '8px 15px', backgroundColor: activeTab === tab.id ? '#0ea5e9' : 'transparent', color: activeTab === tab.id ? 'white' : '#64748b', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ถูก</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เงินรางวัลที่ได้รับ</th>
                </tr>
              </thead>
              <tbody>
                {filteredWinners.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '12px' }}>{w.lottery_type} ตัว</td>
                    <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                    <td style={{ padding: '12px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {w.prize_amount.toLocaleString()} {w.currency_code}</td>
                  </tr>
                ))}
                {filteredWinners.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีผู้ถูกรางวัลในหมวดนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 6. โซนค้นหารายชื่อคนซื้อตามเลขที่ระบุ (เพิ่มเข้ามาใหม่ล่าสุด ตามที่คุณสั่ง) */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={20} color="#0ea5e9" /> ค้นหาข้อมูลผู้ซื้อจากหมายเลข (อิงจากเวลาเปิด-ปิดรับซื้อรอบล่าสุด)
        </h4>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="กรอกตัวเลขที่ต้องการค้นหา" 
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
            style={{ padding: '10px 15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }}
          />
          <button 
            onClick={handleSearchBuyers} 
            disabled={isSearchingBuyers}
            style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSearchingBuyers ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>

        {/* 🌟 ไม่ค้นหา ไม่แสดงอะไรเลย (ตามคำสั่ง) */}
        {searchedBuyers !== null && (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ใช้ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ประเภท</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เลขที่ซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>จะได้รางวัล (ถ้าถูก)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เวลาซื้อ</th>
                </tr>
              </thead>
              <tbody>
                {searchedBuyers.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                    <td style={{ padding: '12px' }}>{w.lottery_type} ตัว</td>
                    <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                    <td style={{ padding: '12px' }}>{w.price.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {w.estimated_prize.toLocaleString()} {w.currency_code}</td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>{new Date(w.created_at).toLocaleString('th-TH')}</td>
                  </tr>
                ))}
                {searchedBuyers.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่พบรายการซื้อหมายเลข "{searchNumber}" ในรอบบิลนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OverseeThePrize;