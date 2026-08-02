import React, { useState, useEffect } from 'react';
import { Settings, Download, Trophy, Power, PlayCircle, StopCircle, Play, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const OverseeThePrize = () => {
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

  // 🌟 เพิ่ม State เลือกวันที่ (ค่าเริ่มต้นคือวันนี้แบบ ค.ศ.)
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // 🌟 ฟังก์ชันแปลง ค.ศ. เป็น วันที่ภาษาไทย พ.ศ. (เช่น 2 สิงหาคม 2569)
  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const [y, m, d] = dateStr.split('-');
    const thaiYear = parseInt(y, 10) + 543;
    const thaiMonth = months[parseInt(m, 10) - 1];
    const thaiDay = parseInt(d, 10);
    return `${thaiDay} ${thaiMonth} ${thaiYear}`;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 🌟 เมื่อเปลี่ยนวันที่ ให้ไปดึงประวัติมาโชว์
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

  // 🌟 ฟังก์ชันดึงประวัติผลรางวัลตามวันที่
  const fetchDrawHistory = async (date) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        if (data.results) {
          setResults(data.results);
        } else {
          // ถ้าไม่มีผล ให้ขึ้นขีด
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

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('THSarabunNew', 'normal');
    doc.setFontSize(18);
    // เปลี่ยนหัว PDF เป็น พ.ศ.
    doc.text(`Winners Report - ${formatThaiDateFull(selectedDate)}`, 14, 20);
    
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
    
    doc.save(`winners_report_${selectedDate}.pdf`);
  };

  const filteredWinners = activeTab === 'all' ? winners : winners.filter(w => w.lottery_type === activeTab);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>จัดการผลรางวัล (Oversee The Prize)</h2>
      
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

      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' }}>
        
        {/* 🌟 เครื่องมือเลือกวันที่ และ หัวข้อภาษาไทย */}
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
        
        {/* 🌟 ลบปุ่มกดสุ่มรางวัลทิ้งไปแล้ว ให้ระบบทำงานเอง */}
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>
          * ระบบจะทำการออกรางวัลอัตโนมัติตาม <b>"เวลาออกเลข"</b> ที่ตั้งค่าไว้ด้านบน
        </p>

      </div>

      {winners.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
    </div>
  );
};

export default OverseeThePrize;