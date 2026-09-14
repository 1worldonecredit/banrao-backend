import React, { useState, useEffect } from 'react';
import { Calendar, Search, Trophy, CheckSquare, Lock, Send, AlertTriangle, FileText, Filter, List, Wallet, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const AwardResults = () => {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getFirstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [results, setResults] = useState(null);
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [salesData, setSalesData] = useState({ thb: 0, lak: 0 });

  const [historyStartDate, setHistoryStartDate] = useState(getFirstDayOfMonth());
  const [historyEndDate, setHistoryEndDate] = useState(getTodayDate());
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [selectedWinners, setSelectedWinners] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    try {
      const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const [y, m, d] = dateStr.split('T')[0].split('-');
      const thaiYear = parseInt(y, 10) + 543;
      const thaiMonth = months[parseInt(m, 10) - 1];
      const thaiDay = parseInt(d, 10);
      return `${thaiDay} ${thaiMonth} ${thaiYear}`;
    } catch { return dateStr; }
  };

  const formatThaiDateShort = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('T')[0].split('-');
      return `${d}/${m}/${parseInt(y, 10) + 543}`;
    } catch { return dateStr; }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

  useEffect(() => {
    fetchDrawResultsDaily(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlyHistory();
    // eslint-disable-next-line
  }, []);

  const fetchDrawResultsDaily = async (date) => {
    setIsLoading(true);
    setSearchTerm('');
    setAdminPassword('');
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-history?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || null);
        const winnersList = data.winners || [];
        setWinners(winnersList);
        setSelectedWinners(winnersList.map(w => w.order_item_id || w.username + w.selected_number)); 
        
        setSalesData({
            thb: data.total_sales_thb || 0,
            lak: data.total_sales_lak || 0
        });
      }
    } catch (err) { console.error('Error fetching daily results:', err); } 
    finally { setIsLoading(false); }
  };

  const fetchMonthlyHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-history-range?startDate=${historyStartDate}&endDate=${historyEndDate}`);
      const data = await res.json();
      if (data.success) setMonthlyHistory(data.history || []);
    } catch (err) { console.error('Error fetching monthly history:', err); } 
    finally { setIsLoadingHistory(false); }
  };

  const totalSystemPayoutTHB = winners.filter(w => w.currency_code === 'THB').reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const totalSystemPayoutLAK = winners.filter(w => w.currency_code === 'LAK' || w.currency_code === '₭').reduce((sum, w) => sum + Number(w.prize_amount), 0);

  const profitTHB = salesData.thb - totalSystemPayoutTHB;
  const profitLAK = salesData.lak - totalSystemPayoutLAK;

  const payoutPercentTHB = salesData.thb > 0 ? ((totalSystemPayoutTHB / salesData.thb) * 100).toFixed(2) : 0;
  const payoutPercentLAK = salesData.lak > 0 ? ((totalSystemPayoutLAK / salesData.lak) * 100).toFixed(2) : 0;

  const filteredWinners = winners.filter(w => 
    w.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.selected_number.includes(searchTerm) ||
    w.prize_amount.toString().includes(searchTerm)
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedWinners(filteredWinners.map(w => w.order_item_id || w.username + w.selected_number));
    else setSelectedWinners([]);
  };

  const handleSelectOne = (id) => {
    if (selectedWinners.includes(id)) setSelectedWinners(selectedWinners.filter(itemId => itemId !== id));
    else setSelectedWinners([...selectedWinners, id]);
  };

  const selectedWinnersData = filteredWinners.filter(w => selectedWinners.includes(w.order_item_id || w.username + w.selected_number));
  
  const totalTransferTHB = selectedWinnersData
    .filter(w => w.currency_code === 'THB')
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);
    
  const totalTransferLAK = selectedWinnersData
    .filter(w => w.currency_code === 'LAK' || w.currency_code === '₭')
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);

const handleTransfer = async () => {
    if (selectedWinners.length === 0) return alert("กรุณาเลือกรายการที่ต้องการโอนเงิน");
    if (!adminPassword) return alert("กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน");

    let confirmMsg = `ยืนยันการโอนเงินให้ลูกค้าที่เลือก ${selectedWinners.length} รายการ ใช่หรือไม่?\n\n`;
    if (totalTransferTHB > 0) confirmMsg += `TH ยอดเงินบาท: ${formatCurrency(totalTransferTHB)} THB\n`;
    if (totalTransferLAK > 0) confirmMsg += `LA ยอดเงินกีบ: ${formatCurrency(totalTransferLAK)} LAK\n`;

    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      // 🌟 ยิง API ไปสั่ง Backend ให้หักเงินและอัปเดตกระเป๋า
      const res = await fetch(`${API_URL}/api/admin/viet-lottery/process-payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_item_ids: selectedWinners // ส่ง ID ของบิล (item_id) ไปให้ Backend ประมวลผล
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ โอนเงินรางวัลให้ลูกค้าเรียบร้อยแล้ว!");
        setAdminPassword('');
        setSelectedWinners([]);
        // เรียกฟังก์ชันรีเฟรชข้อมูลหน้าเว็บใหม่ (เช่น fetchWinners()) 
        window.location.reload(); 
      } else {
        alert("❌ โอนเงินไม่สำเร็จ: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 🌟 ระบบ Export PDF (ปรับลบ 8 ตัวออก)
  // ==========================================
  const exportHistoryPDF = () => {
    const doc = new jsPDF();
    doc.addFont('THSarabunNew', 'normal');
    doc.setFontSize(18);
    doc.text(`Draw Results History (${formatThaiDateShort(historyStartDate)} - ${formatThaiDateShort(historyEndDate)})`, 14, 20);
    
    // ลบ "Super (8 Digits)" ออก
    const tableColumn = ["Date (พ.ศ.)", "1st Prize (6 Digits)", "4 Digits", "3 Digits", "2 Digits"];
    const tableRows = [];

    monthlyHistory.forEach(h => {
      // 🌟 บังคับหั่นเลขให้ถูกต้องเสมอ
      const p6 = h.prize_6 || (h.prize_8 ? h.prize_8.slice(-6) : '-');
      const p4 = p6 !== '-' && p6.length >= 4 ? p6.slice(-4) : (h.prize_4 || '-');
      const p3 = p6 !== '-' && p6.length >= 3 ? p6.slice(-3) : (h.prize_3 || '-');
      
      tableRows.push([
        formatThaiDateShort(h.draw_date),
        p6, p4, p3, h.prize_2 || '-'
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [14, 165, 233] } 
    });
    
    doc.save(`Draw_History_${historyStartDate}_to_${historyEndDate}.pdf`);
  };

return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '24px' }}>ประวัติการออกรางวัลและจ่ายเงิน</h2>
      
      {/* ==========================================
          โซนที่ 1: ผลรางวัลประจำวัน (ด้านบน)
      ========================================== */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
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

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : !results ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
            ยังไม่มีการออกรางวัลในวันที่นี้
          </div>
        ) : (
          <>
            {/* 🌟 กล่องแสดงตัวเลขรางวัล (ปรับหั่นเลข และลบ 8 ตัวออก) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
              {(() => {
                const main6 = results.prize_6 || (results.prize_8 ? results.prize_8.slice(-6) : '-');
                const top4 = main6 !== '-' && main6.length >= 4 ? main6.slice(-4) : (results.prize_4 || '-');
                const top3 = main6 !== '-' && main6.length >= 3 ? main6.slice(-3) : (results.prize_3 || '-');

                return [
                  { label: '6 ตัว (ที่ 1)', val: main6, color: '#8b5cf6' },
                  { label: '4 ตัวท้าย', val: top4, color: '#f59e0b' },
                  { label: '3 ตัวท้าย', val: top3, color: '#10b981' },
                  { label: '2 ตัวท้าย', val: results.prize_2 || '-', color: '#3b82f6' }
                ].map(p => (
                  <div key={p.label} style={{ flex: '1 1 150px', padding: '15px 10px', border: `2px solid ${p.color}`, borderRadius: '12px', minWidth: '150px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>{p.label}</p>
                    <h2 style={{ margin: 0, color: p.color, fontSize: '28px', letterSpacing: '2px' }}>{p.val}</h2>
                  </div>
                ));
              })()}
            </div>

            {/* โซนสรุปบัญชี ยอดขาย vs เงินรางวัล */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px', borderTop: '2px dashed #e2e8f0', paddingTop: '25px' }}>
              
              {/* บัญชีเงินบาท (THB) */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={20} color="#3b82f6"/> สรุปบัญชีเงินบาท (THB)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>ยอดขายรวม:</span>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>{formatCurrency(salesData.thb)} ฿</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b' }}>เงินรางวัลที่จ่าย:</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>- {formatCurrency(totalSystemPayoutTHB)} ฿</span>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>กำไร / ขาดทุน:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: profitTHB >= 0 ? '#16a34a' : '#ef4444' }}>
                    {profitTHB >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                      {profitTHB > 0 ? '+' : ''}{formatCurrency(profitTHB)} ฿
                    </span>
                  </div>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '10px' }}>
                  <div style={{ 
                    width: `${Math.min(payoutPercentTHB, 100)}%`, 
                    backgroundColor: payoutPercentTHB > 100 ? '#ef4444' : (payoutPercentTHB > 80 ? '#f59e0b' : '#16a34a'), 
                    height: '100%', transition: 'width 0.5s ease' 
                  }}></div>
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', textAlign: 'right', color: '#64748b' }}>
                  อัตราการจ่าย (Payout): <strong style={{ color: payoutPercentTHB > 100 ? '#ef4444' : '#334155' }}>{payoutPercentTHB}%</strong>
                </p>
              </div>

              {/* บัญชีเงินกีบ (LAK) */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={20} color="#10b981"/> สรุปบัญชีเงินกีบ (LAK)
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>ยอดขายรวม:</span>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>{formatCurrency(salesData.lak)} ₭</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#64748b' }}>เงินรางวัลที่จ่าย:</span>
                  <span style={{ fontWeight: 'bold', color: '#ef4444' }}>- {formatCurrency(totalSystemPayoutLAK)} ₭</span>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ color: '#475569', fontWeight: 'bold' }}>กำไร / ขาดทุน:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: profitLAK >= 0 ? '#16a34a' : '#ef4444' }}>
                    {profitLAK >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                      {profitLAK > 0 ? '+' : ''}{formatCurrency(profitLAK)} ₭
                    </span>
                  </div>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '10px' }}>
                  <div style={{ 
                    width: `${Math.min(payoutPercentLAK, 100)}%`, 
                    backgroundColor: payoutPercentLAK > 100 ? '#ef4444' : (payoutPercentLAK > 80 ? '#f59e0b' : '#16a34a'), 
                    height: '100%', transition: 'width 0.5s ease' 
                  }}></div>
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', textAlign: 'right', color: '#64748b' }}>
                  อัตราการจ่าย (Payout): <strong style={{ color: payoutPercentLAK > 100 ? '#ef4444' : '#334155' }}>{payoutPercentLAK}%</strong>
                </p>
              </div>

            </div>
          </>
        )}

        {/* ==========================================
            โซนที่ 2: รายชื่อผู้ถูกรางวัลประจำวัน
        ========================================== */}
        {winners.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ margin: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <Trophy size={24} /> รายชื่อผู้ถูกรางวัล ประจำวันที่ {formatThaiDateShort(selectedDate)}
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
                        <td style={{ padding: '12px' }}>{w.lottery_type}</td>
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

            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <span style={{ color: '#b45309', fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  ยอดรวมที่ต้องโอนให้ลูกค้าที่เลือก ({selectedWinners.length} รายการ):
                </span>
                <strong style={{ fontSize: '26px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {totalTransferTHB > 0 && <span>{formatCurrency(totalTransferTHB)} THB</span>}
                  
                  {totalTransferTHB > 0 && totalTransferLAK > 0 && <span style={{ color: '#fcd34d' }}>|</span>}
                  
                  {totalTransferLAK > 0 && <span>{formatCurrency(totalTransferLAK)} LAK</span>}
                  
                  {totalTransferTHB === 0 && totalTransferLAK === 0 && <span>0.00 THB</span>}
                </strong>
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

      {/* ==========================================
          โซนที่ 3: ตารางสรุปประวัติย้อนหลัง (รายเดือน)
      ========================================== */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#0ea5e9', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List size={24} /> ตารางสรุปผลการออกรางวัลย้อนหลัง
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="date" 
              value={historyStartDate} 
              onChange={(e) => setHistoryStartDate(e.target.value)} 
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
            <span>ถึง</span>
            <input 
              type="date" 
              value={historyEndDate} 
              onChange={(e) => setHistoryEndDate(e.target.value)} 
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} 
            />
            <button 
              onClick={fetchMonthlyHistory} 
              style={{ backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={16} /> กรอง
            </button>
            <button 
              onClick={exportHistoryPDF} 
              disabled={monthlyHistory.length === 0}
              style={{ backgroundColor: monthlyHistory.length > 0 ? '#0284c7' : '#9ca3af', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: monthlyHistory.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} /> โหลด PDF
            </button>
          </div>
        </div>

        {isLoadingHistory ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>กำลังโหลดข้อมูลย้อนหลัง...</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>
                  <th style={{ padding: '12px' }}>งวดวันที่ (พ.ศ.)</th>
                  {/* 🌟 ลบ 8 ตัวออก */}
                  <th style={{ padding: '12px' }}>6 ตัว (ที่ 1)</th>
                  <th style={{ padding: '12px' }}>4 ตัวท้าย</th>
                  <th style={{ padding: '12px' }}>3 ตัวท้าย</th>
                  <th style={{ padding: '12px' }}>2 ตัวท้าย</th>
                </tr>
              </thead>
              <tbody>
                {monthlyHistory.map((h, idx) => {
                  // 🌟 บังคับหั่นเลขให้ถูกต้อง และทับข้อมูลเก่าที่เพี้ยน
                  const p6 = h.prize_6 || (h.prize_8 ? h.prize_8.slice(-6) : '-');
                  const p4 = p6 !== '-' && p6.length >= 4 ? p6.slice(-4) : (h.prize_4 || '-');
                  const p3 = p6 !== '-' && p6.length >= 3 ? p6.slice(-3) : (h.prize_3 || '-');

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#475569' }}>{formatThaiDateShort(h.draw_date)}</td>
                      <td style={{ padding: '12px', color: '#8b5cf6', fontWeight: 'bold' }}>{p6}</td>
                      <td style={{ padding: '12px', color: '#f59e0b', fontWeight: 'bold' }}>{p4}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{p3}</td>
                      <td style={{ padding: '12px', color: '#3b82f6', fontWeight: 'bold' }}>{h.prize_2 || '-'}</td>
                    </tr>
                  );
                })}
                {monthlyHistory.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีประวัติการออกรางวัลในช่วงวันที่เลือก</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AwardResults;