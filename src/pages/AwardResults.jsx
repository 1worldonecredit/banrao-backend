import React, { useState, useEffect } from 'react';
import { Calendar, Search, Trophy, CheckSquare, Lock, Send, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const AwardResults = () => {
  // 🌟 ฟังก์ชันตั้งค่าเริ่มต้นเป็นวันนี้ (ค.ศ.)
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [results, setResults] = useState(null);
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State สำหรับระบบโอนเงิน
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amt);

  // ดึงข้อมูลเมื่อเปลี่ยนวันที่
  useEffect(() => {
    fetchDrawResults(selectedDate);
  }, [selectedDate]);

  const fetchDrawResults = async (date) => {
    setIsLoading(true);
    setSearchTerm('');
    setAdminPassword('');
    try {
      // 🌟 ใช้ API ตัวเดียวกับหน้า OverseeThePrize ได้เลย!
      const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || null);
        const winnersList = data.winners || [];
        setWinners(winnersList);
        
        // 🌟 ตั้งค่าเริ่มต้นให้ Checked เลือกทุกคนที่รอยอดโอน
        setSelectedWinners(winnersList.map(w => w.order_item_id || w.username + w.selected_number)); 
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ระบบค้นหา (ฟิลเตอร์)
  const filteredWinners = winners.filter(w => 
    w.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.selected_number.includes(searchTerm) ||
    w.prize_amount.toString().includes(searchTerm)
  );

  // 🌟 ระบบ Checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWinners(filteredWinners.map(w => w.order_item_id || w.username + w.selected_number));
    } else {
      setSelectedWinners([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedWinners.includes(id)) {
      setSelectedWinners(selectedWinners.filter(itemId => itemId !== id));
    } else {
      setSelectedWinners([...selectedWinners, id]);
    }
  };

  const totalPayout = filteredWinners
    .filter(w => selectedWinners.includes(w.order_item_id || w.username + w.selected_number))
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);

  // 🌟 จำลองฟังก์ชันโอนเงิน
  const handleTransfer = async () => {
    if (selectedWinners.length === 0) return alert("กรุณาเลือกรายการที่ต้องการโอนเงิน");
    if (!adminPassword) return alert("กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน");
    
    // อนาคต: ตรวจสอบรหัสผ่าน / ส่ง OTP ที่นี่
    if (!window.confirm(`ยืนยันการโอนเงินจำนวน ${formatCurrency(totalPayout)} ให้กับลูกค้า ${selectedWinners.length} รายการ?`)) return;

    setIsProcessing(true);
    try {
      // อนาคต: ยิง API สั่งจ่ายเงินให้ลูกค้า
      // await fetch('/api/admin/payout-winners', { ... })
      
      setTimeout(() => {
        alert("✅ โอนเงินรางวัลให้ลูกค้าเรียบร้อยแล้ว!");
        setAdminPassword('');
        setSelectedWinners([]);
        setIsProcessing(false);
      }, 1500);
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>ประวัติการออกรางวัลและจ่ายเงิน</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        
        {/* 🌟 เครื่องมือเลือกวันที่ และ หัวข้อภาษาไทย */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
            ผลการออกรางวัลประจำงวด <span style={{ color: '#d11010' }}>{formatThaiDateFull(selectedDate)}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Calendar size={18} color="#64748b" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: 'bold', color: '#334155' }}
            />
          </div>
        </div>

        {/* 🌟 โชว์เลขที่ออกประจำงวด */}
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : !results ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            ยังไม่มีการออกรางวัลในวันที่นี้
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '25px' }}>
            {[
              { label: '8 ตัว (ซูเปอร์)', val: results.prize_8, color: '#ec4899' },
              { label: '6 ตัว (ที่ 1)', val: results.prize_6, color: '#8b5cf6' },
              { label: '4 ตัวท้าย', val: results.prize_4, color: '#f59e0b' },
              { label: '3 ตัวท้าย', val: results.prize_3, color: '#10b981' },
              { label: '2 ตัวท้าย', val: results.prize_2, color: '#3b82f6' }
            ].map(p => (
              <div key={p.label} style={{ flex: '1 1 120px', padding: '15px 10px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '120px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>{p.label}</p>
                <h2 style={{ margin: 0, color: p.color, fontSize: '28px', letterSpacing: '2px' }}>{p.val}</h2>
              </div>
            ))}
          </div>
        )}

        {/* 🌟 รายชื่อผู้ถูกรางวัล และ ระบบจัดการโอนเงิน */}
        {winners.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <Trophy size={24} /> รายชื่อผู้ถูกรางวัล ({filteredWinners.length} รายการ)
              </h4>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="ค้นหา ชื่อ, เลข, ยอดเงิน..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '250px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', width: '50px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedWinners.length === filteredWinners.length && filteredWinners.length > 0}
                        onChange={handleSelectAll}
                        style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px' }}>ผู้ใช้ (Username)</th>
                    <th style={{ padding: '12px' }}>ประเภท</th>
                    <th style={{ padding: '12px' }}>เลขที่ถูก</th>
                    <th style={{ padding: '12px' }}>ยอดซื้อ</th>
                    <th style={{ padding: '12px', color: '#166534' }}>ต้องโอนจ่าย</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWinners.map((w, idx) => {
                    const uniqueId = w.order_item_id || w.username + w.selected_number;
                    const isSelected = selectedWinners.includes(uniqueId);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelectOne(uniqueId)}
                            style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.username}</td>
                        <td style={{ padding: '12px' }}>{w.lottery_type} ตัว</td>
                        <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>{w.selected_number}</td>
                        <td style={{ padding: '12px' }}>{formatCurrency(w.price)} {w.currency_code}</td>
                        <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold', fontSize: '15px' }}>{formatCurrency(w.prize_amount)} {w.currency_code}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            รอโอนเงิน
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredWinners.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่พบข้อมูลที่ค้นหา</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 🌟 โซนยืนยันการโอนเงิน (ใส่รหัสผ่าน) */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <span style={{ color: '#b45309', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>ยอดรวมที่ต้องโอนให้ลูกค้าที่เลือก ({selectedWinners.length} รายการ):</span>
                <strong style={{ fontSize: '28px', color: '#d97706' }}>{formatCurrency(totalPayout)} THB</strong>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    placeholder="ใส่รหัสผ่าน Admin เพื่อยืนยัน" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    style={{ padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '220px', boxSizing: 'border-box' }}
                  />
                </div>
                <button 
                  onClick={handleTransfer}
                  disabled={selectedWinners.length === 0 || isProcessing}
                  style={{ 
                    backgroundColor: selectedWinners.length > 0 ? '#16a34a' : '#9ca3af', 
                    color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', 
                    cursor: selectedWinners.length > 0 ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '15px'
                  }}
                >
                  <Send size={18} /> {isProcessing ? 'กำลังโอนเงิน...' : 'โอนเงินรางวัล'}
                </button>
              </div>
            </div>
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <AlertTriangle size={14} /> * อนาคตระบบจะส่ง OTP เพื่อยืนยันการทำรายการไปยังเบอร์มือถือของผู้ดูแลระบบ
            </p>

          </div>
        )}

      </div>
    </div>
  );
};

export default AwardResults;