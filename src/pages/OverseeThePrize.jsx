import React, { useState, useEffect } from 'react';
import { Settings, Play, Download, Trophy, Clock, Power, PlayCircle, StopCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
  // 🌟 เพิ่ม State รองรับเวลาทั้ง 3 ช่วง
  const [settings, setSettings] = useState({ 
    close_time: '17:00:00', 
    open_time: '18:00:00',
    draw_time: '17:30:00',
    is_sales_open: true 
  });
  
  const [results, setResults] = useState({ prize_8: '-', prize_6: '-', prize_4: '-', prize_3: '-', prize_2: '-' });
  const [winners, setWinners] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); 
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
          close_time: data.data.close_time ? data.data.close_time.substring(0, 5) : '17:00',
          open_time: data.data.open_time ? data.data.open_time.substring(0, 5) : '18:00',
          draw_time: data.data.draw_time ? data.data.draw_time.substring(0, 5) : '17:30',
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
      alert('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการบันทึก'); }
  };

  // ฟังก์ชันบันทึกเวลาพร้อมกันทั้งหมด
  const handleSaveAllTimes = async () => {
    try {
      await fetch(`${API_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('✅ บันทึกเวลาทั้งหมดเรียบร้อยแล้ว');
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการบันทึกเวลา'); }
  };

  const handleDrawNumbers = async () => {
    if (settings.is_sales_open) {
      alert('⚠️ กรุณา "บังคับปิดรับซื้อ" ก่อนทำการออกรางวัล!');
      return;
    }
    
    if (!window.confirm('ยืนยันการออกรางวัล? (ระบบจะตรวจบิลลูกค้าทั้งหมดทันที)')) return;

    setIsProcessing(true);

    const num8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    const num6 = Math.floor(100000 + Math.random() * 900000).toString();
    const num4 = num6.slice(-4);
    const num3 = num6.slice(-3);
    const num2 = num6.slice(-2);

    const generatedResults = { prize_8: num8, prize_6: num6, prize_4: num4, prize_3: num3, prize_2: num2 };
    setResults(generatedResults);

    try {
      const res = await fetch(`${API_URL}/api/admin/draw-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedResults)
      });
      const data = await res.json();
      if (data.success) {
        setWinners(data.winners);
        alert('🎉 ออกรางวัลและตรวจบิลสำเร็จ!');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Winners Report - ${new Date().toLocaleDateString()}`, 14, 20);
    
    const tableColumn = ["Username", "Type", "Number", "Bet Amount", "Prize Amount", "Currency"];
    const tableRows = [];

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
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
      {/* 🌟 โซนตั้งค่าระบบ (จัด Layout เป็น Grid ให้สวย และ Responsive) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="#0ea5e9" /> ตั้งเวลาการทำงานของระบบ
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

      {/* 🌟 โซนออกรางวัล (แก้ปัญหาจอล้นด้วย flexWrap: 'wrap') */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>ผลการออกรางวัลประจำงวด</h3>
        
        {/* 🌟 แก้ไข: เพิ่ม flexWrap เพื่อให้กล่องไหลลงมาอัตโนมัติเมื่อจอเล็ก ไม่ล้นออกข้าง */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Trophy size={24} /> รายชื่อผู้ถูกรางวัล
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
    </div>
  );
};

export default OverseeThePrize;