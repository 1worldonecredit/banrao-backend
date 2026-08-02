import React, { useState, useEffect } from 'react';
import { Settings, Play, Download, Trophy, Clock, Power } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  const [settings, setSettings] = useState({ close_time: '17:00:00', is_sales_open: true });
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, 8, 6, 4, 3, 2
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          close_time: data.data.close_time.substring(0, 5), // เอาแค่ HH:mm
          is_sales_open: data.data.is_sales_open
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateSettings = async (field, value) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    try {
      await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      alert('บันทึกการตั้งค่าแล้ว');
    } catch (err) { alert('เกิดข้อผิดพลาด'); }
  };

  // 🌟 ฟังก์ชันสุ่มตัวเลข และสกัดเลขท้าย
  const handleDrawNumbers = async () => {
    if (settings.is_sales_open) {
      alert('กรุณา "ปิดรับซื้อ" ก่อนทำการออกรางวัล!');
      return;
    }
    
    if (!window.confirm('ยืนยันการออกรางวัล? (การกระทำนี้จะตรวจบิลลูกค้าทั้งหมดทันที)')) return;

    setIsProcessing(true);

    // 1. สุ่มเลข 8 ตัว
    const num8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // 2. สุ่มเลข 6 ตัว
    const num6 = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. หั่นเลข 6 ตัว เอาเฉพาะส่วนท้าย
    const num4 = num6.slice(-4);
    const num3 = num6.slice(-3);
    const num2 = num6.slice(-2);

    const generatedResults = { prize_8: num8, prize_6: num6, prize_4: num4, prize_3: num3, prize_2: num2 };
    setResults(generatedResults);

    // 4. ส่งผลรางวัลไปให้ Backend ตรวจบิลและหาคนถูกรางวัล
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedResults)
      });
      const data = await res.json();
      if (data.success) {
        setWinners(data.winners);
        alert('ออกรางวัลและตรวจบิลสำเร็จ!');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 ฟังก์ชันสร้างไฟล์ PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    // รองรับภาษาไทยต้องใช้ Font พิเศษ แต่เบื้องต้นใช้ autoTable มาตรฐานไปก่อน
    doc.setFontSize(18);
    doc.text(`Winners Report - ${new Date().toLocaleDateString()}`, 14, 20);
    
    const tableColumn = ["Username", "Type", "Number", "Bet Amount", "Prize Amount", "Currency"];
    const tableRows = [];

    // ดึงเฉพาะข้อมูลใน Tab ที่เลือกอยู่มาปริ้น
    filteredWinners.forEach(w => {
      const rowData = [
        w.username,
        `${w.lottery_type} Digits`,
        w.selected_number,
        w.price,
        w.prize_amount,
        w.currency_code
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });
    
    doc.save(`winners_report_${activeTab}.pdf`);
  };

  const filteredWinners = activeTab === 'all' ? winners : winners.filter(w => w.lottery_type === activeTab);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
      {/* 🌟 โซนตั้งค่าระบบ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#0ea5e9" /> ตั้งเวลาปิดรับซื้อ
          </h4>
          <input 
            type="time" 
            value={settings.close_time}
            onChange={(e) => setSettings({ ...settings, close_time: e.target.value })}
            style={{ padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginRight: '10px' }}
          />
          <button onClick={() => handleUpdateSettings('close_time', settings.close_time)} style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>บันทึกเวลา</button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Power size={20} color={settings.is_sales_open ? '#10b981' : '#ef4444'} /> สถานะการขาย
          </h4>
          <button 
            onClick={() => handleUpdateSettings('is_sales_open', !settings.is_sales_open)}
            style={{ padding: '10px 20px', backgroundColor: settings.is_sales_open ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {settings.is_sales_open ? 'บังคับ "ปิด" รับซื้อเดี๋ยวนี้' : 'เปิดรับซื้อตามปกติ'}
          </button>
        </div>
      </div>

      {/* 🌟 โซนออกรางวัล */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>ผลการออกรางวัลประจำงวด</h3>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
          {[
            { label: '8 ตัว (ซูเปอร์)', val: results.prize_8, color: '#ec4899' },
            { label: '6 ตัว (ที่ 1)', val: results.prize_6, color: '#8b5cf6' },
            { label: '4 ตัวท้าย', val: results.prize_4, color: '#f59e0b' },
            { label: '3 ตัวท้าย', val: results.prize_3, color: '#10b981' },
            { label: '2 ตัวท้าย', val: results.prize_2, color: '#3b82f6' }
          ].map(p => (
            <div key={p.label} style={{ padding: '15px 25px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '120px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>{p.label}</p>
              <h2 style={{ margin: 0, color: p.color, fontSize: '32px', letterSpacing: '2px' }}>{p.val}</h2>
            </div>
          ))}
        </div>

        <button 
          onClick={handleDrawNumbers} 
          disabled={isProcessing}
          style={{ padding: '15px 40px', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(234, 179, 8, 0.3)' }}
        >
          {isProcessing ? 'กำลังประมวลผล...' : <><Play size={24} /> สุ่มออกรางวัล & ตรวจบิล</>}
        </button>
      </div>

      {/* 🌟 โซนผู้ชนะ & ส่งออก PDF */}
      {winners.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Trophy size={24} /> รายชื่อผู้ถูกรางวัล
            </h4>
            <button onClick={exportPDF} style={{ padding: '8px 15px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> โหลด PDF
            </button>
          </div>

          {/* เมนูย่อย (Tabs) */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
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

          {/* ตารางแสดงผู้ชนะ */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
      )}
    </div>
  );
};

export default OverseeThePrize;