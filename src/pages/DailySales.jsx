import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, Clock, CheckCircle, XCircle, Gift, ChevronDown, ChevronUp, Receipt, TrendingUp, AlertOctagon, BarChart2, Filter, ChevronLeft, RefreshCw, CalendarDays, Percent } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySales = () => {
  // 🌟 State สำหรับหน้ารวม (Card View)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [monthDates, setMonthDates] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // 🌟 State สำหรับหน้าเจาะลึก (Detail View)
  const [selectedDate, setSelectedDate] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [dailyResult, setDailyResult] = useState({ result_6: null, result_2: null });
  
  const [expandedRows, setExpandedRows] = useState({});
  const [numberStats, setNumberStats] = useState([]);
  const [activeStatTab, setActiveStatTab] = useState('all');
  const [topLimit, setTopLimit] = useState(10);

  // 🌟 ตั้งค่าเป้าหมายการจ่ายเงิน (กำไร) และเรทเงิน
  const TARGET_PERCENT = 60; // เป้าหมายคือจ่ายไม่เกิน 60% ของยอดขาย
  const EXCHANGE_RATE = 600; // เรทเงินลาว 1 THB = 600 LAK สำหรับการคำนวณกำไรรวม

  // ==========================================
  // 1. ระบบสร้างวันที่และการ์ดรายเดือน
  // ==========================================
  useEffect(() => {
    const generateDates = () => {
      const [year, month] = selectedMonth.split('-');
      const lastDay = new Date(year, month, 0).getDate();
      const dates = [];
      const todayStr = new Date().toISOString().split('T')[0];

      // สร้างวันที่ย้อนหลัง (วันปัจจุบันอยู่บนสุด)
      for (let i = lastDay; i >= 1; i--) {
        const dStr = `${year}-${month}-${i.toString().padStart(2, '0')}`;
        if (dStr > todayStr) continue; // ซ่อนวันที่ล่วงหน้า
        dates.push(dStr);
      }
      return dates;
    };

    const dates = generateDates();
    setMonthDates(dates);
    setMonthSummary({}); 
    fetchMonthSummaryData(dates);
  }, [selectedMonth]);

  const fetchMonthSummaryData = async (dates) => {
    setIsLoadingCards(true);
    const newSummary = {};
    
    // โหลดข้อมูลทีละ 5 วันเพื่อป้องกัน Server โหลดหนัก
    for (let i = 0; i < dates.length; i += 5) {
      const chunk = dates.slice(i, i + 5);
      await Promise.all(chunk.map(async (d) => {
        try {
          const res = await fetch(`${API_URL}/api/admin/daily-sales?date=${d}`);
          const data = await res.json();
          if (data.success) {
            let sTHB = 0, sLAK = 0, pTHB = 0, pLAK = 0;
            data.salesDetails.forEach(o => {
              if (o.currency_code === 'LAK') sLAK += Number(o.total_amount);
              else sTHB += Number(o.total_amount);
            });
            data.winners.forEach(w => {
              if (w.currency_code === 'LAK') pLAK += Number(w.prize_amount);
              else pTHB += Number(w.prize_amount);
            });
            newSummary[d] = {
              salesTHB: sTHB, salesLAK: sLAK, payoutTHB: pTHB, payoutLAK: pLAK,
              result_6: data.summary?.result_6 || null,
              result_2: data.summary?.result_2 || null
            };
          }
        } catch(e) { console.error("Fetch Summary Error:", e); }
      }));
      setMonthSummary(prev => ({ ...prev, ...newSummary }));
    }
    setIsLoadingCards(false);
  };

  // ==========================================
  // 2. ระบบดึงข้อมูลเจาะลึก (เมื่อคลิกการ์ด)
  // ==========================================
  useEffect(() => {
    if (selectedDate) {
      fetchDailyDetail();
      setExpandedRows({});
      const interval = setInterval(() => fetchDailyDetail(true), 60000);
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  const fetchDailyDetail = async (isSilent = false) => {
    if (!isSilent) setIsLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-sales?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setSalesData(data.salesDetails); 
        setWinnersList(data.winners); 
        setDailyResult({ result_6: data.summary?.result_6, result_2: data.summary?.result_2 });
      }
    } catch (error) {
      console.error('Error fetching daily detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 🌟 คำนวณยอดรวมในหน้าเจาะลึก
  let detailSalesTHB = 0, detailSalesLAK = 0, detailPayoutTHB = 0, detailPayoutLAK = 0;
  salesData.forEach(o => { o.currency_code === 'LAK' ? detailSalesLAK += Number(o.total_amount) || 0 : detailSalesTHB += Number(o.total_amount) || 0; });
  winnersList.forEach(w => { w.currency_code === 'LAK' ? detailPayoutLAK += Number(w.prize_amount) || 0 : detailPayoutTHB += Number(w.prize_amount) || 0; });

  // 🌟 คำนวณกำไร/ขาดทุน และ % ความเสี่ยง (ประเมินเป็น THB)
  const totalSalesConverted = detailSalesTHB + (detailSalesLAK / EXCHANGE_RATE);
  const totalPayoutConverted = detailPayoutTHB + (detailPayoutLAK / EXCHANGE_RATE);
  const totalProfitConverted = totalSalesConverted - totalPayoutConverted;
  const actualPayoutPercent = totalSalesConverted > 0 ? (totalPayoutConverted / totalSalesConverted) * 100 : 0;
  const percentDiff = actualPayoutPercent - TARGET_PERCENT; // ค่าบวก=จ่ายเกินเป้า, ค่าลบ=จ่ายต่ำกว่าเป้า (กำไรดี)

  // คำนวณสถิติความเสี่ยงเลขขายดี
  useEffect(() => {
    if (!salesData || salesData.length === 0) {
      setNumberStats([]);
      return;
    }
    const statsMap = {};
    let totalDailySalesCombined = 1; 

    salesData.forEach(order => {
      if (!order.items) return;
      const isLAK = order.currency_code === 'LAK';
      order.items.forEach(item => {
        const key = `${item.lottery_type}-${item.selected_number}`;
        const betAmount = Number(item.price) || 0;
        let multiplier = item.lottery_type === '2' ? 90 : item.lottery_type === '3' ? 900 : item.lottery_type === '4' ? 7000 : item.lottery_type === '6' ? 400000 : item.lottery_type === '8' ? 1000000 : 0;
        const payoutAmount = betAmount * multiplier;

        if (!statsMap[key]) {
          statsMap[key] = { number: item.selected_number, type: item.lottery_type, betTHB: 0, betLAK: 0, payoutTHB: 0, payoutLAK: 0, combinedValue: 0, combinedPayoutValue: 0 };
        }
        if (isLAK) {
          statsMap[key].betLAK += betAmount;
          statsMap[key].payoutLAK += payoutAmount;
          statsMap[key].combinedValue += (betAmount / EXCHANGE_RATE);
          statsMap[key].combinedPayoutValue += (payoutAmount / EXCHANGE_RATE);
          totalDailySalesCombined += (betAmount / EXCHANGE_RATE);
        } else {
          statsMap[key].betTHB += betAmount;
          statsMap[key].payoutTHB += payoutAmount;
          statsMap[key].combinedValue += betAmount;
          statsMap[key].combinedPayoutValue += payoutAmount;
          totalDailySalesCombined += betAmount;
        }
      });
    });

    const statsArray = Object.values(statsMap)
      .map(stat => ({
        ...stat,
        salesPercent: (stat.combinedValue / totalDailySalesCombined) * 100,
        riskPercent: (stat.combinedPayoutValue / totalDailySalesCombined) * 100
      }))
      .sort((a, b) => b.combinedValue - a.combinedValue);
    setNumberStats(statsArray);
  }, [salesData]);

  const filteredStats = numberStats.filter(stat => activeStatTab === 'all' || stat.type === activeStatTab).slice(0, topLimit === 'all' ? numberStats.length : Number(topLimit));
  const toggleRow = (orderId) => setExpandedRows(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  // Helper Formats
  const getStatusBadge = (status) => {
    if (['ถูกรางวัล', 'ถูก', 'Paid'].includes(status)) return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}><CheckCircle size={14} style={{display:'inline', verticalAlign:'middle'}}/> ถูกรางวัล</span>;
    if (['ไม่ถูกรางวัล', 'แพ้', 'Lose'].includes(status)) return <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}><XCircle size={14} style={{display:'inline', verticalAlign:'middle'}}/> ไม่ถูกรางวัล</span>;
    return <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}><Clock size={14} style={{display:'inline', verticalAlign:'middle'}}/> รอผลตรวจ</span>;
  };
  const formatTHB = (val) => val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatLAK = (val) => val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const fullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  // ==========================================
  // VIEW 1: แสดงรายการงวดทั้งหมดของเดือน (แบบการ์ด)
  // ==========================================
  if (!selectedDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={24} color="#0284c7" /> รายงานขาย หวยเวียดนาม (รายเดือน)
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>เลือกเดือนและปี เพื่อดูยอดขายและผลรางวัล (วันล่าสุดอยู่บนสุด)</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Calendar size={18} color="#0ea5e9" />
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }} />
            </div>
            <button onClick={() => fetchMonthSummaryData(monthDates)} style={{ padding: '9px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#64748b' }}><RefreshCw size={16} /> รีเฟรช</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {monthDates.map((date) => {
            const data = monthSummary[date];
            const isToday = date === todayStr;

            return (
              <div key={date} onClick={() => setSelectedDate(date)} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'}>
                {isToday && <div style={{ position: 'absolute', top: '12px', right: '15px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>กำลังเปิดรับ</div>}
                
                <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isToday ? '#f0fdf4' : '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isToday ? '#10b981' : '#0ea5e9' }}></div>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>งวด: {formatThaiDate(date)}</strong>
                  </div>
                </div>

                {/* 🌟 แสดงเลขที่ออกบนการ์ดเลย */}
                <div style={{ padding: '10px 15px', backgroundColor: '#fffbeb', borderBottom: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>ผลรางวัล:</span> 
                  <strong style={{ color: '#d97706', fontSize: '15px', letterSpacing: '1px' }}>
                    {data?.result_6 ? `${data.result_6} / ${data.result_2 || 'XX'}` : 'รอผลรางวัล'}
                  </strong>
                </div>

                <div style={{ padding: '20px 15px', fontSize: '14px', color: '#64748b', minHeight: '120px' }}>
                  {!data ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}><RefreshCw size={18} style={{ animation: 'spin 2s linear infinite', marginRight: '8px' }}/> กำลังโหลดยอดขาย...</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>ยอดขาย (THB):</span> <strong style={{ color: '#10b981', fontSize: '15px' }}>฿ {formatTHB(data.salesTHB)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><span>ยอดขาย (LAK):</span> <strong style={{ color: '#10b981', fontSize: '15px' }}>₭ {formatLAK(data.salesLAK)}</strong></div>
                      <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>ยอดต้องจ่าย (THB):</span> <strong style={{ color: '#ef4444' }}>฿ {formatTHB(data.payoutTHB)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ยอดต้องจ่าย (LAK):</span> <strong style={{ color: '#ef4444' }}>₭ {formatLAK(data.payoutLAK)}</strong></div>
                    </>
                  )}
                </div>
                <div style={{ padding: '12px 15px', backgroundColor: '#f0f9ff', borderTop: '1px solid #e0f2fe', color: '#0284c7', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>คลิกดูรายละเอียด กำไร & บิล</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: แสดงรายละเอียดเมื่อคลิกเข้ามาดูในวันที่นั้นๆ
  // ==========================================
  const isTodayDetail = selectedDate === new Date().toISOString().split('T')[0];
  
  return (
    <div>
      <div style={{ backgroundColor: '#075985', color: 'white', padding: '15px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 0 }}><ChevronLeft size={24} /></button>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>รายละเอียด งวดประจำวันที่ {formatThaiDate(selectedDate)}</h3>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>หวยเวียดนาม (ออกรางวัลทุกวัน)</span>
          </div>
        </div>
        <button onClick={() => fetchDailyDetail()} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}><RefreshCw size={14} /> อัปเดต</button>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '20px', border: '1px solid #e2e8f0', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        
        {/* กล่องข้อมูลพื้นฐานงวด */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '25px' }}>
          <div style={{ flex: '1 1 300px', backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#0369a1' }}>ข้อมูลประจำงวด</h4>
            <div style={{ fontSize: '15px', color: '#0c4a6e', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>วันที่:</span> <strong>{formatThaiDate(selectedDate)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>สถานะระบบ:</span> 
                {isTodayDetail ? (
                   <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>กำลังเปิดรับแทง</span>
                ) : (
                   <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>ออกผลแล้ว (ปิดรับแทง)</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #bae6fd' }}>
                <span>ผลรางวัลที่ออก:</span> 
                <strong style={{ color: '#b45309', fontSize: '18px', letterSpacing: '1px' }}>
                  {dailyResult.result_6 ? `${dailyResult.result_6} / ${dailyResult.result_2 || 'XX'}` : 'รอผลรางวัล'}
                </strong>
              </div>
            </div>
          </div>
          
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (THB)</span>
              <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{formatTHB(detailSalesTHB)} ฿</span>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (LAK)</span>
              <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{formatLAK(detailSalesLAK)} ₭</span>
            </div>
          </div>
        </div>

        {/* 🌟 สรุปกำไร/ขาดทุน และ เทียบเปอร์เซ็นต์แบบเรียลไทม์ */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} color="#0ea5e9"/> สรุปยอดเงินรวม (ประเมินเป็น THB)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>ยอดขายรวมทั้งหมด:</span>
              <strong style={{ color: '#0ea5e9', fontSize: '16px' }}>฿ {formatTHB(totalSalesConverted)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b' }}>ยอดจ่ายรางวัลทั้งหมด:</span>
              <strong style={{ color: '#ef4444', fontSize: '16px' }}>฿ {formatTHB(totalPayoutConverted)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ color: '#0f172a', fontWeight: 'bold' }}>กำไรสุทธิ:</span>
              <strong style={{ color: totalProfitConverted >= 0 ? '#10b981' : '#ef4444', fontSize: '18px' }}>
                {totalProfitConverted >= 0 ? '+' : ''}{formatTHB(totalProfitConverted)} ฿
              </strong>
            </div>
          </div>

          <div style={{ flex: '1 1 350px', backgroundColor: percentDiff <= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${percentDiff <= 0 ? '#bbf7d0' : '#fecaca'}`, padding: '20px', borderRadius: '12px' }}>
             <h4 style={{ margin: '0 0 15px 0', color: percentDiff <= 0 ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={20} /> วิเคราะห์ความเสี่ยงการจ่ายเงิน
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>เป้าหมาย (ตั้งไว้ที่)</div>
                <strong style={{ color: '#334155', fontSize: '18px' }}>{TARGET_PERCENT}%</strong>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>จ่ายรางวัลจริง (ตอนนี้)</div>
                <strong style={{ color: percentDiff <= 0 ? '#10b981' : '#ef4444', fontSize: '18px' }}>{actualPayoutPercent.toFixed(1)}%</strong>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: percentDiff <= 0 ? '#15803d' : '#b91c1c' }}>
              {percentDiff <= 0 ? (
                <span>✅ ต่ำกว่าเป้าหมายที่ตั้งไว้ {Math.abs(percentDiff).toFixed(1)}% (ระบบมีกำไร)</span>
              ) : (
                <span>⚠️ เกินเป้าหมายที่ตั้งไว้ {Math.abs(percentDiff).toFixed(1)}% (ขาดทุน/ความเสี่ยงสูง)</span>
              )}
            </div>
          </div>
        </div>

        {/* 🌟 รายชื่อผู้ถูกรางวัล (อัปเดตทุกวัน) */}
        {winnersList.length > 0 ? (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Gift size={22} /> รายชื่อผู้ถูกรางวัล (ยอดโอนเงินให้ลูกค้า)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ผู้ซื้อ (Username)</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>เลขที่ถูก</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ยอดซื้อ</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>เงินรางวัลที่ได้</th>
                  </tr>
                </thead>
                <tbody>
                  {winnersList.map((winner, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{winner.username}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {winner.animal_image && <img src={winner.animal_image} alt={winner.animal_name} style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />}
                        <div>
                          <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{winner.selected_number}</span> 
                          <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({winner.lottery_type} ตัว) {winner.animal_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{winner.currency_code === 'THB' ? formatTHB(winner.price) : formatLAK(winner.price)} {winner.currency_code}</td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold', fontSize: '16px' }}>+ {winner.currency_code === 'THB' ? formatTHB(winner.prize_amount) : formatLAK(winner.prize_amount)} {winner.currency_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', textAlign: 'center', color: '#94a3b8' }}>
            ยังไม่มีผู้ถูกรางวัลในงวดนี้ หรือระบบยังไม่ออกผล
          </div>
        )}

        {/* 🌟 สถิติความเสี่ยงเลขขายดี */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <h4 style={{ margin: 0, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}><TrendingUp size={22} /> สถิติเลขขายดี และ การประเมินความเสี่ยง</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f1f5f9', padding: '5px 15px', borderRadius: '8px' }}>
              <Filter size={16} color="#64748b" />
              <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>แสดง:</span>
              <select value={topLimit} onChange={(e) => setTopLimit(e.target.value)} style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontWeight: 'bold', color: '#0ea5e9', cursor: 'pointer' }}>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={30}>Top 30</option>
                <option value="all">ทั้งหมด</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
            {[{ id: 'all', label: 'รวมทั้งหมด' }, { id: '2', label: '2 ตัวท้าย' }, { id: '3', label: '3 ตัวท้าย' }, { id: '4', label: '4 ตัวท้าย' }, { id: '6', label: '6 ตัว (ที่ 1)' }, { id: '8', label: '8 ตัว (ซูเปอร์)' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveStatTab(tab.id)} style={{ padding: '8px 15px', backgroundColor: activeStatTab === tab.id ? '#0ea5e9' : 'transparent', color: activeStatTab === tab.id ? 'white' : '#64748b', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>{tab.label}</button>
            ))}
          </div>
          
          {filteredStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>ยังไม่มีข้อมูลการซื้อในหมวดหมู่นี้</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '950px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>ลำดับ</th>
                    <th style={{ padding: '12px' }}>เลขที่ซื้อ</th>
                    <th style={{ padding: '12px' }}>ประเภท</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ยอดซื้อ (THB)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ยอดซื้อ (LAK)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ต้องจ่าย (THB)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ต้องจ่าย (LAK)</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>อัตราความเสี่ยงรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((stat, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{stat.number}</td>
                      <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>{stat.type} ตัว</span></td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0ea5e9' }}>{stat.betTHB > 0 ? formatTHB(stat.betTHB) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#8b5cf6' }}>{stat.betLAK > 0 ? formatLAK(stat.betLAK) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>{stat.payoutTHB > 0 ? formatTHB(stat.payoutTHB) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>{stat.payoutLAK > 0 ? formatLAK(stat.payoutLAK) : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(stat.riskPercent, 100)}%`, height: '100%', backgroundColor: stat.riskPercent > 50 ? '#ef4444' : (stat.riskPercent > 20 ? '#f59e0b' : '#10b981') }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: stat.riskPercent > 50 ? '#ef4444' : '#64748b', width: '40px' }}>{stat.riskPercent.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🌟 ตารางบิลแทงหวยทั้งหมด */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={22} color="#64748b" /> รายการสั่งซื้อทั้งหมด ({formatThaiDate(selectedDate)})</h4>
          
          {isLoadingDetail ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูลบิล...</div>
          ) : salesData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีรายการขายในงวดนี้</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', width: '40px' }}></th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เวลา</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>รหัสบิล</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ซื้อ</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>จำนวนรายการ</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดรวมทั้งบิล</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>สถานะบิล</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((order) => (
                    <React.Fragment key={order.order_id}>
                      <tr onClick={() => toggleRow(order.order_id)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: expandedRows[order.order_id] ? '#f8fafc' : 'white', transition: 'all 0.2s' }}>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>{expandedRows[order.order_id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{order.buy_time.substring(11, 16)}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#0ea5e9' }}>#{order.order_id.toString().padStart(5, '0')}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{order.username}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}><Receipt size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> {order.items.length} รายการ</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{order.currency_code === 'THB' ? formatTHB(order.total_amount) : formatLAK(order.total_amount)} <span style={{ color: '#94a3b8', fontSize: '12px' }}>{order.currency_code}</span></td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(order.order_status)}</td>
                      </tr>
                      {expandedRows[order.order_id] && (
                        <tr style={{ backgroundColor: '#fcfcfc' }}>
                          <td colSpan="7" style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                              {order.items.map((item) => (
                                <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                  {item.animal_image ? <img src={item.animal_image} alt={item.animal_name} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover' }} /> : <div style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.lottery_type}ต</span></div>}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{item.selected_number}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>{order.currency_code === 'THB' ? formatTHB(item.price) : formatLAK(item.price)} {order.currency_code}</span>
                                      {['ถูกรางวัล', 'Paid', 'Win'].includes(item.item_status) && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>ถูกรางวัล!</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySales;