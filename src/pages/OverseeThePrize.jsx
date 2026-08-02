import React, { useState, useEffect } from 'react';
import { Settings, Download, Trophy, Power, PlayCircle, StopCircle, Play, Calendar, Calculator, Percent, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  const [settings, setSettings] = useState({ close_time: '17:00', open_time: '18:00', draw_time: '17:30', is_sales_open: true });
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 
  const [isProcessing, setIsProcessing] = useState(false);

  // 🌟 State สำหรับตารางเรทการจ่าย
  const [prizeRates, setPrizeRates] = useState([]);
  
  // 🌟 State สำหรับระบบจำลองความเสี่ยง
  const [simulatedNumber, setSimulatedNumber] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
  }, []);

  useEffect(() => {
    fetchDrawHistory(selectedDate);
  }, [selectedDate]);

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

  // 🌟 ดึงข้อมูลเรทจ่ายจาก Database
  const fetchPrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`);
      const data = await res.json();
      if (data.success) setPrizeRates(data.rates);
    } catch (err) { console.error('Error fetching prize rates:', err); }
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
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  // 🌟 ฟังก์ชันบันทึกเรทจ่ายที่แก้ไข
  const handleSavePrizeRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prize-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: prizeRates })
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกอัตราการจ่ายสำเร็จ!');
    } catch (err) { alert('❌ บันทึกไม่สำเร็จ'); }
  };

  // 🌟 ฟังก์ชันจำลองความเสี่ยง
  const handleAnalyzeDraw = async () => {
    if (simulatedNumber.length !== 8) return alert('กรุณากรอกเลขให้ครบ 8 หลักเพื่อความแม่นยำ');
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/analyze-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: simulatedNumber })
      });
      const data = await res.json();
      if (data.success) setAnalysisResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🌟 ฟังก์ชันสุ่มเลข 8 หลักอัตโนมัติ
  const generateRandomSimulate = () => {
    const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    setSimulatedNumber(random8);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
      {/* 🌟 ส่วนที่ 1: ตั้งเวลา (ของเดิม) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="#0ea5e9" /> ตั้งเวลาการทำงานของระบบ (ออกรางวัลอัตโนมัติตามเวลา)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <p style={{ margin: '0 0 8px 0', color: '#b91c1c', fontWeight: 'bold' }}>1. เวลาปิดรับซื้อ</p>
            <input type="time" value={settings.close_time} onChange={(e) => setSettings({ ...settings, close_time: e.target.value })} style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }} />
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <p style={{ margin: '0 0 8px 0', color: '#d97706', fontWeight: 'bold' }}>2. เวลาออกเลข (ประกาศผล)</p>
            <input type="time" value={settings.draw_time} onChange={(e) => setSettings({ ...settings, draw_time: e.target.value })} style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #fcd34d' }} />
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#15803d', fontWeight: 'bold' }}>3. เวลาเปิดรับซื้องวดถัดไป</p>
            <input type="time" value={settings.open_time} onChange={(e) => setSettings({ ...settings, open_time: e.target.value })} style={{ padding: '10px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #86efac' }} />
          </div>
        </div>
      </div>

      {/* 🌟 ส่วนที่ 2: ตั้งค่าอัตราการจ่ายรางวัล (Lottery_Prize_Rates) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Percent size={20} color="#8b5cf6" /> ปรับอัตราการจ่ายรางวัล (ตัวคูณ)
        </h4>
        <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ประเภทรางวัล</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>รายละเอียด</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>อัตราจ่าย (ตัวคูณ)</th>
              </tr>
            </thead>
            <tbody>
              {prizeRates.map((rate, index) => (
                <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{rate.lottery_type} ตัว</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{rate.description}</td>
                  <td style={{ padding: '12px' }}>
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
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '150px', fontWeight: 'bold' }}
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

      {/* 🌟 ส่วนที่ 3: ระบบจำลองความเสี่ยงก่อนออกเลข (Draw Analyzer) */}
      <div style={{ backgroundColor: '#fffbeb', padding: '25px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={24} /> วิเคราะห์ความเสี่ยงก่อนตั้งผล (Risk Analyzer)
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#d97706' }}>* คำนวณจากยอดบิลที่ลูกค้าแทงเข้ามาแล้วในวันนี้</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="กรอกเลขจำลอง 8 หลัก" 
              maxLength="8"
              value={simulatedNumber}
              onChange={(e) => setSimulatedNumber(e.target.value.replace(/\D/g, ''))}
              style={{ padding: '15px 20px', fontSize: '24px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid #fcd34d', outline: 'none', width: '280px', letterSpacing: '4px', color: '#b45309', textAlign: 'center' }}
            />
          </div>
          <button onClick={generateRandomSimulate} style={{ padding: '15px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} /> สุ่มเลขจำลอง
          </button>
          <button onClick={handleAnalyzeDraw} disabled={isAnalyzing || simulatedNumber.length !== 8} style={{ padding: '15px 30px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: (simulatedNumber.length === 8) ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
            {isAnalyzing ? 'กำลังคำนวณ...' : '🔍 วิเคราะห์เลขนี้'}
          </button>
        </div>

        {/* ผลลัพธ์การวิเคราะห์ */}
        {analysisResult && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>ผลการวิเคราะห์ ถ้าออกเลข <span style={{ color: '#dc2626', fontSize: '20px' }}>{simulatedNumber}</span></h5>
            
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
                {['8', '6', '4', '3', '2'].map((type) => {
                  const data = analysisResult.analysis.find(a => a.lottery_type === type);
                  const numSlice = type === '8' ? simulatedNumber : simulatedNumber.slice(-parseInt(type));
                  return (
                    <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{type} ตัว</td>
                      <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold', letterSpacing: '2px' }}>{numSlice}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: data ? '#16a34a' : '#94a3b8' }}>{data ? data.winner_count : 0} คน</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: data ? '#b91c1c' : '#94a3b8' }}>{formatCurrency(data ? data.total_payout : 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดขายรวมวันนี้ (ทุน)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9' }}>{formatCurrency(analysisResult.totalSales)} THB</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>ยอดจ่ายรวมถ้าออกเลขนี้ (Payout)</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0))} THB
                </span>
              </div>
            </div>
            
            {/* คำนวณ % */}
            {(() => {
              const totalPayout = analysisResult.analysis.reduce((sum, item) => sum + item.total_payout, 0);
              const riskPercent = analysisResult.totalSales > 0 ? (totalPayout / analysisResult.totalSales) * 100 : 0;
              return (
                <div style={{ marginTop: '15px', textAlign: 'center', padding: '10px', backgroundColor: riskPercent > 80 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', color: riskPercent > 80 ? '#b91c1c' : '#166534', fontWeight: 'bold' }}>
                  <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                  สัดส่วนจ่ายเงินเทียบกับยอดขาย: {riskPercent.toFixed(2)}% {riskPercent > 80 ? '(ความเสี่ยงสูงมาก กำไรน้อย/ขาดทุน)' : '(ความเสี่ยงต่ำ ระบบมีกำไร)'}
                </div>
              );
            })()}

          </div>
        )}
      </div>

      {/* 🌟 ส่วนที่ 4: ผลการออกรางวัลจริง (ของเดิม) */}
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