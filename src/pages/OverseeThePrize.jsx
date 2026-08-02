import React, { useState, useEffect } from 'react';
import { Settings, Download, Trophy, Power, PlayCircle, StopCircle, Play, Calendar, Calculator, Save, RefreshCw, AlertTriangle, Crosshair, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  const [settings, setSettings] = useState({ close_time: '17:00', open_time: '18:00', draw_time: '17:30', is_sales_open: true });
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [prizeRates, setPrizeRates] = useState([]);
  
  // 🌟 State สำหรับเรทแลกเปลี่ยนเงิน
  const [exchangeRateLAK, setExchangeRateLAK] = useState(0);

  // 🌟 State สำหรับระบบจำลองความเสี่ยง
  const [simulatedNumber, setSimulatedNumber] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🌟 State สำหรับระบบตั้งเป้าหมาย (0-100%)
  const [targetPercent, setTargetPercent] = useState(50);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${parseInt(y, 10) + 543}`;
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

  useEffect(() => { 
    fetchSettings(); 
    fetchPrizeRates(); 
    fetchExchangeRates(); // ดึงเรทเงินตอนเปิดหน้า
  }, []);

  useEffect(() => { fetchDrawHistory(selectedDate); }, [selectedDate]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          close_time: data.data.close_time || '17:00', open_time: data.data.open_time || '18:00',
          draw_time: data.data.draw_time || '17:30', is_sales_open: data.data.is_sales_open
        });
      }
    } catch (err) {}
  };

  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`);
      const data = await res.json();
      if (data.success) setPrizeRates(data.rates);
    } catch (err) {}
  };

  // 🌟 ดึงเรทแลกเปลี่ยนเงิน (THB_LAK)
  const fetchExchangeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`);
      const data = await res.json();
      if (data.success) {
        const lakRate = data.rates.find(r => r.currency_pair === 'THB_LAK');
        if (lakRate) setExchangeRateLAK(lakRate.rate);
      }
    } catch (err) {}
  };

  const fetchDrawHistory = async (date) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || { prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
        setWinners(data.winners || []);
      }
    } catch (err) {} finally { setIsProcessing(false); }
  };

  const handleSavePrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: prizeRates })
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกอัตราการจ่ายสำเร็จ!');
    } catch (err) { alert('❌ บันทึกไม่สำเร็จ'); }
  };

  // 🌟 อัปเดตเรทแลกเปลี่ยนเงิน LAK
  const handleSaveExchangeRate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/exchange-rates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair: 'THB_LAK', rate: exchangeRateLAK })
      });
      const data = await res.json();
      if (data.success) alert('✅ อัปเดตเรทเงิน กีบ (LAK) สำเร็จ! (มีผลกับการคำนวณความเสี่ยงทันที)');
    } catch (err) { alert('❌ อัปเดตไม่สำเร็จ'); }
  };

  // 🌟 ฟังก์ชันวิเคราะห์เลขแบบกำหนดเอง (พิมพ์เอง)
  const handleAnalyzeDraw = async () => {
    if (simulatedNumber.length !== 6) return alert('กรุณากรอกเลขให้ครบ 6 หลัก');
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-draw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: simulatedNumber })
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
    } catch (err) {} finally { setIsAnalyzing(false); }
  };

  // 🌟 ฟังก์ชันให้ระบบคำนวณและเสนอเลขตาม % ที่กำหนด
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
    } catch (err) {} finally { setIsSuggesting(false); }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
      {/* 🌟 โซนตั้งค่าเรทต่างๆ (จัด Grid ให้อยู่คู่กัน) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* กล่องตั้งเรทเงิน */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#15803d" /> อัตราแลกเปลี่ยนเงินปัจจุบัน (ใช้แปลงค่า LAK เป็น THB)
          </h4>
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
            <Save size={18} /> บันทึกเรทเงิน
          </button>
        </div>

        {/* กล่องตั้งเรทตัวคูณ */}
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

      {/* 🌟 โซนจำลองและคุมงบประมาณ (มีระบบแถบเลื่อน 0-100%) */}
      <div style={{ backgroundColor: '#fffbeb', padding: '25px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair size={24} /> วิเคราะห์และคุมงบประมาณก่อนออกเลข (วิเคราะห์เฉพาะเลข 6 ตัว)
        </h4>

        {/* ระบบตั้ง % */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            1. ให้ระบบแนะนำเลข (คุมยอดจ่ายให้ไม่เกินเป้าหมาย)
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
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748b' }}>* เลื่อนแถบไปที่ 0% ถ้ายอดขายคุณน้อยมาก และไม่อยากจ่ายให้ใครถูกเลย (ระบบกินเรียบ)</p>
        </div>

        {/* ระบบกรอกเอง */}
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

        {/* ผลลัพธ์การวิเคราะห์ */}
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
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>ยอดจ่ายรางวัล (แปลงเป็น THB)</th>
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
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดขายรวมวันนี้ (แปลงเป็น THB)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>{formatCurrency(analysisResult.totalSales)} THB</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดจ่ายรวมถ้าออกเลขนี้ (Payout)</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0))} THB
                </span>
              </div>
            </div>
            
            {(() => {
              const totalPayout = analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0);
              const riskPercent = analysisResult.totalSales > 0 ? (totalPayout / analysisResult.totalSales) * 100 : 0;
              return (
                <div style={{ marginTop: '15px', textAlign: 'center', padding: '12px', backgroundColor: riskPercent > targetPercent ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', color: riskPercent > targetPercent ? '#b91c1c' : '#166534', fontWeight: 'bold' }}>
                  <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                  สัดส่วนยอดจ่าย: {riskPercent.toFixed(2)}% {riskPercent > 100 ? '(ขาดทุนยับ!)' : (riskPercent > targetPercent ? '(ยอดจ่ายสูงกว่าเป้าหมายที่ตั้งไว้)' : '(ปลอดภัย ระบบมีกำไร)')}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 🌟 ส่วนที่ 4: ผลการออกรางวัลจริง */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '20px' }}>ผลการออกรางวัลจริง งวดวันที่ <span style={{ color: '#d11010' }}>{formatThaiDateFull(selectedDate)}</span></h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
          {[
            { label: '8 ตัว (ซูเปอร์)', val: results.prize_8, color: '#ec4899' },
            { label: '6 ตัว (ที่ 1)', val: results.prize_6, color: '#8b5cf6' },
            { label: '4 ตัวท้าย', val: results.prize_4, color: '#f59e0b' },
            { label: '3 ตัวท้าย', val: results.prize_3, color: '#10b981' },
            { label: '2 ตัวท้าย', val: results.prize_2, color: '#3b82f6' }
          ].map(p => (
            <div key={p.label} style={{ flex: '1 1 120px', padding: '15px 10px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '120px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>{p.label}</p>
              <h2 style={{ margin: 0, color: p.color, fontSize: '32px', letterSpacing: '1px' }}>{p.val}</h2>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OverseeThePrize;