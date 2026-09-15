import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, Clock, CheckCircle, XCircle, Gift, ChevronDown, ChevronUp, Receipt, TrendingUp, AlertOctagon, BarChart2, Filter, ChevronLeft, RefreshCw, CalendarDays, Percent } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySales = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [monthDates, setMonthDates] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [dailyResult, setDailyResult] = useState({ result_6: null, result_2: null });
  const [actualSales, setActualSales] = useState({ thb: 0, lak: 0 });
  
  const [expandedRows, setExpandedRows] = useState({});
  const [numberStats, setNumberStats] = useState([]);
  const [activeStatTab, setActiveStatTab] = useState('all');
  const [topLimit, setTopLimit] = useState(10);

  const [drawTimeSetting, setDrawTimeSetting] = useState({ hour: 17, minute: 0 });
  const [now, setNow] = useState(new Date());

  const [selectedWinners, setSelectedWinners] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const TARGET_PERCENT = 100; 
  const EXCHANGE_RATE = 620;  

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTimeSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/time-settings`);
        const data = await res.json();
        if (data.success && data.draw_time) {
          const [h, m] = data.draw_time.split(':');
          setDrawTimeSetting({ hour: parseInt(h), minute: parseInt(m) });
        }
      } catch (err) {}
    };
    fetchTimeSettings();
  }, []);

  useEffect(() => {
    const generateDates = () => {
      const [year, month] = selectedMonth.split('-');
      const lastDay = new Date(year, month, 0).getDate();
      const dates = [];
      const todayStr = new Date().toISOString().split('T')[0];

      for (let i = lastDay; i >= 1; i--) {
        const dStr = `${year}-${month}-${i.toString().padStart(2, '0')}`;
        if (dStr > todayStr) continue; 
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
    for (let i = 0; i < dates.length; i += 5) {
      const chunk = dates.slice(i, i + 5);
      await Promise.all(chunk.map(async (d) => {
        try {
          const res = await fetch(`${API_URL}/api/admin/draw-history?date=${d}`);
          const data = await res.json();
          if (data.success) {
            let pTHB = 0, pLAK = 0;
            if (data.winners) {
              data.winners.forEach(w => {
                if (w.currency_code === 'LAK' || w.currency_code === '₭') pLAK += Number(w.prize_amount) || 0;
                else pTHB += Number(w.prize_amount) || 0;
              });
            }
            newSummary[d] = {
              salesTHB: data.total_sales_thb || 0,
              salesLAK: data.total_sales_lak || 0,
              payoutTHB: pTHB, payoutLAK: pLAK,
              result_6: data.results?.prize_6 || null, result_2: data.results?.prize_2 || null
            };
          }
        } catch(e) {}
      }));
      setMonthSummary(prev => ({ ...prev, ...newSummary }));
    }
    setIsLoadingCards(false);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchDailyDetail();
      setExpandedRows({});
      setSelectedWinners([]); 
      setAdminPassword('');
      const interval = setInterval(() => fetchDailyDetail(true), 60000);
      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  const fetchDailyDetail = async (isSilent = false) => {
    if (!isSilent) setIsLoadingDetail(true);
    try {
      const salesRes = await fetch(`${API_URL}/api/admin/daily-sales?date=${selectedDate}`);
      const salesDataObj = await salesRes.json();
      
      const histRes = await fetch(`${API_URL}/api/admin/draw-history?date=${selectedDate}`);
      const histDataObj = await histRes.json();

      if (salesDataObj.success) setSalesData(salesDataObj.salesDetails || []); 
      if (histDataObj.success) {
        setWinnersList(histDataObj.winners || []); 
        setDailyResult({ result_6: histDataObj.results?.prize_6 || null, result_2: histDataObj.results?.prize_2 || null });
        setActualSales({ thb: Number(histDataObj.total_sales_thb) || 0, lak: Number(histDataObj.total_sales_lak) || 0 });
      }
    } catch (error) {
      console.error('Error fetching daily detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  let detailPayoutTHB = 0, detailPayoutLAK = 0;
  winnersList.forEach(w => { w.currency_code === 'LAK' ? detailPayoutLAK += Number(w.prize_amount) || 0 : detailPayoutTHB += Number(w.prize_amount) || 0; });

  const totalSalesConverted = actualSales.thb + (actualSales.lak / EXCHANGE_RATE);
  const totalPayoutConverted = detailPayoutTHB + (detailPayoutLAK / EXCHANGE_RATE);
  const totalProfitConverted = totalSalesConverted - totalPayoutConverted;
  const actualPayoutPercent = totalSalesConverted > 0 ? (totalPayoutConverted / totalSalesConverted) * 100 : 0;
  const percentDiff = actualPayoutPercent - TARGET_PERCENT; 

  useEffect(() => {
    if (!salesData || salesData.length === 0) {
      setNumberStats([]); return;
    }
    const statsMap = {};
    let totalDailySalesCombined = 1; 

    salesData.forEach(order => {
      if (!order.items) return;
      const isLAK = order.currency_code === 'LAK';
      order.items.forEach(item => {
        const key = `${item.lottery_type}-${item.selected_number}`;
        const betAmount = Number(item.price) || 0;
        let multiplier = item.lottery_type === '2' ? 120 : item.lottery_type === '3' ? 1500 : item.lottery_type === '4' ? 10000 : item.lottery_type === '6' ? 100000 : item.lottery_type === '8' ? 1000000 : 0;
        const payoutAmount = betAmount * multiplier;

        if (!statsMap[key]) {
          statsMap[key] = { number: item.selected_number, type: item.lottery_type, betTHB: 0, betLAK: 0, payoutTHB: 0, payoutLAK: 0, combinedValue: 0, combinedPayoutValue: 0 };
        }
        if (isLAK) {
          statsMap[key].betLAK += betAmount; statsMap[key].payoutLAK += payoutAmount;
          statsMap[key].combinedValue += (betAmount / EXCHANGE_RATE); statsMap[key].combinedPayoutValue += (payoutAmount / EXCHANGE_RATE);
          totalDailySalesCombined += (betAmount / EXCHANGE_RATE);
        } else {
          statsMap[key].betTHB += betAmount; statsMap[key].payoutTHB += payoutAmount;
          statsMap[key].combinedValue += betAmount; statsMap[key].combinedPayoutValue += payoutAmount;
          totalDailySalesCombined += betAmount;
        }
      });
    });

    const statsArray = Object.values(statsMap).map(stat => ({ ...stat, salesPercent: (stat.combinedValue / totalDailySalesCombined) * 100, riskPercent: (stat.combinedPayoutValue / totalDailySalesCombined) * 100 })).sort((a, b) => b.combinedValue - a.combinedValue);
    setNumberStats(statsArray);
  }, [salesData]);

  const filteredStats = numberStats.filter(stat => activeStatTab === 'all' || stat.type === activeStatTab).slice(0, topLimit === 'all' ? numberStats.length : Number(topLimit));
  const toggleRow = (orderId) => setExpandedRows(prev => ({ ...prev, [orderId]: !prev[orderId] }));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const unpaids = winnersList.filter(w => !['Paid', 'โอนแล้ว'].includes(w.status)).map(w => w.order_item_id);
      setSelectedWinners(unpaids);
    } else {
      setSelectedWinners([]);
    }
  };

  const handleSelectWinner = (itemId) => {
    setSelectedWinners(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const selectedWinnersData = winnersList.filter(w => selectedWinners.includes(w.order_item_id));
  const totalTransferTHB = selectedWinnersData.filter(w => w.currency_code === 'THB').reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const totalTransferLAK = selectedWinnersData.filter(w => w.currency_code === 'LAK' || w.currency_code === '₭').reduce((sum, w) => sum + Number(w.prize_amount), 0);

  // 🌟 ฟังก์ชันโอนเงินที่มีการส่งรหัสผ่าน
  const handleTransfer = async () => {
    if (selectedWinners.length === 0) return alert("กรุณาเลือกรายการที่ต้องการโอนเงิน");
    if (!adminPassword) return alert("กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อยืนยัน");

    let confirmMsg = `ยืนยันการโอนเงินให้ลูกค้าที่เลือก ${selectedWinners.length} รายการ ใช่หรือไม่?\n\n`;
    if (totalTransferTHB > 0) confirmMsg += `ยอดเงินบาท: ${formatTHB(totalTransferTHB)} THB\n`;
    if (totalTransferLAK > 0) confirmMsg += `ยอดเงินกีบ: ${formatLAK(totalTransferLAK)} LAK\n`;

    if (!window.confirm(confirmMsg)) return;

  
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/viet-lottery/process-payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_item_ids: selectedWinners,
          admin_password: adminPassword // ส่งรหัสผ่านไปเช็คที่ Backend
        })
      });
      const data = await res.json();

      if (data.success) {
        alert("✅ โอนเงินรางวัลให้ลูกค้าเรียบร้อยแล้ว!");
        setAdminPassword('');
        setSelectedWinners([]);
        fetchDailyDetail(true); 
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

  const getStatusBadge = (status) => {
    if (['ถูกรางวัล', 'ถูก', 'ชนะ'].includes(status)) return <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>รอโอนเงิน</span>;
    if (['Paid', 'โอนแล้ว'].includes(status)) return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}><CheckCircle size={14} style={{display:'inline', verticalAlign:'middle'}}/> โอนแล้ว</span>;
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

  const getDrawCountdown = (targetDateStr) => {
    if (!targetDateStr) return null;
    const drawTime = new Date(targetDateStr);
    drawTime.setHours(drawTimeSetting.hour, drawTimeSetting.minute, 0, 0); 

    const diff = drawTime - now;
    const isToday = now.toISOString().split('T')[0] === targetDateStr;

    if (diff <= 0) {
      if (isToday) return <span style={{ color: '#0284c7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }}/> ⏳ กำลังประมวลผลออกรางวัลอัตโนมัติ...</span>;
      return <span style={{ color: '#64748b' }}>ออกผลรางวัลแล้ว</span>;
    }

    if (isToday) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return <span style={{ color: '#f59e0b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={16}/> ระบบจะออกรางวัลในอีก: {h} ชม. {m} นาที {s} วิ</span>;
    }
    return null;
  };

  if (!selectedDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    return (
      <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><CalendarDays size={24} color="#0284c7" /> รายงานขาย หวยเวียดนาม (รายเดือน)</h2>
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
                {isToday && <div style={{ position: 'absolute', top: '12px', right: '15px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>เปิดรับแทง</div>}
                <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isToday ? '#f0fdf4' : '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isToday ? '#10b981' : '#0ea5e9' }}></div>
                    <strong style={{ color: '#334155', fontSize: '15px' }}>งวด: {formatThaiDate(date)}</strong>
                  </div>
                </div>
                <div style={{ padding: '10px 15px', backgroundColor: '#fffbeb', borderBottom: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>ผลรางวัล:</span> 
                  <strong style={{ color: '#d97706', fontSize: '15px', letterSpacing: '1px' }}>{data?.result_6 ? `${data.result_6} / ${data.result_2 || 'XX'}` : 'ยังไม่ออกรางวัล'}</strong>
                </div>
                {isToday && !data?.result_6 && (<div style={{ padding: '8px 15px', backgroundColor: '#f0f9ff', borderBottom: '1px solid #e0f2fe', textAlign: 'center' }}>{getDrawCountdown(date)}</div>)}
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
                <div style={{ padding: '12px 15px', backgroundColor: '#f0f9ff', borderTop: '1px solid #e0f2fe', color: '#0284c7', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>คลิกดูรายละเอียด กำไร & โอนเงิน</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
const isTodayDetail = selectedDate === new Date().toISOString().split('T')[0];
  const unpaidsCount = winnersList.filter(w => !['Paid', 'โอนแล้ว'].includes(w.status)).length;
  
  // 🌟 ฟังก์ชันช่วยแสดงเวลา สำหรับหวยเวียดนาม (เทียบกับ drawTimeSetting)
  const formatVietTime = (dateStr, type) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2);
    
    let h = '00', m = '00';
    if (type === 'open') {
      h = '00'; m = '00'; // เปิดขาย (สมมติเริ่มเที่ยงคืน)
    } else {
      h = drawTimeSetting.hour.toString().padStart(2, '0');
      m = drawTimeSetting.minute.toString().padStart(2, '0');
    }
    return `${day} ${month} ${year} (${h}:${m} น.)`;
  };

  return (
    <div>
      {/* 🌟 1. Header เปลี่ยนเป็นสีแดงเข้ม (เหมือนหวยไทย) */}
      <div style={{ backgroundColor: '#9f1239', color: 'white', padding: '15px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 0 }}><ChevronLeft size={24} /></button>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>รายละเอียด งวด {formatThaiDate(selectedDate)}</h3>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>สถานะ: {isTodayDetail && !dailyResult.result_6 ? 'กำลังดำเนินการ (เปิดรับแทง)' : 'ประกาศผลแล้ว'}</span>
          </div>
        </div>
        <button onClick={() => fetchDailyDetail()} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}><RefreshCw size={14} /> อัปเดต</button>
      </div>

      {/* 🌟 2. พื้นหลังคอนเทนต์เปลี่ยนเป็นสีขาว (เหมือนหวยไทย) */}
      <div style={{ backgroundColor: 'white', padding: '20px', border: '1px solid #e2e8f0', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        
        {/* 🌟 3. กล่องเวลา และ กล่องผลรางวัล (ดึงดีไซน์ แดง-เหลือง จากหวยไทย) */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '25px' }}>
          <div style={{ flex: '1 1 300px', backgroundColor: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#be123c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              เวลาของรอบนี้
              {isTodayDetail && !dailyResult.result_6 && (
                 <div style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecdd3', color: '#be123c' }}>
                   {getDrawCountdown(selectedDate)}
                 </div>
              )}
            </h4>
            <div style={{ fontSize: '14px', color: '#4c0519', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>เปิดขาย:</span> <strong>{formatVietTime(selectedDate, 'open')}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ปิดรับแทง:</span> <strong style={{ color: '#e11d48' }}>{formatVietTime(selectedDate, 'close')}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ออกผล:</span> <strong>{formatVietTime(selectedDate, 'draw')}</strong></div>
            </div>
          </div>
          
          <div style={{ flex: '1 1 300px', backgroundColor: '#fdfbf7', padding: '20px', borderRadius: '12px', border: '1px solid #fef08a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#a16207', marginBottom: '10px' }}>ผลรางวัลที่ออก</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04', letterSpacing: '2px' }}>
              {dailyResult.result_6 ? `${dailyResult.result_6} / ${dailyResult.result_2 || 'XX'}` : 'XX / XX'}
            </div>
            <span style={{ fontSize: '12px', color: '#a16207', marginTop: '5px' }}>(รางวัลที่ 1 / 2 ตัวล่าง)</span>
          </div>
        </div>

        {/* 🌟 4. กล่องยอดขาย (ดึงดีไซน์ สีเขียว จากหวยไทย) */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (THB)</span>
            <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{formatTHB(actualSales.thb)} ฿</span>
          </div>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#166534', fontWeight: 'bold' }}>ยอดขาย (LAK)</span>
            <span style={{ color: '#15803d', fontSize: '20px', fontWeight: 'bold' }}>{formatLAK(actualSales.lak)} ₭</span>
          </div>
        </div>

        {/* --- สิ้นสุดการดึงดีไซน์หวยไทย --- ด้านล่างนี้คือฟีเจอร์ของเวียดนาม (ปรับสีพื้นหลังให้เข้ากัน) --- */}

        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} color="#0ea5e9"/> สรุปยอดเงินรวม (ประเมินเป็น THB)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#64748b' }}>ยอดขายรวมทั้งหมด:</span><strong style={{ color: '#0ea5e9', fontSize: '16px' }}>฿ {formatTHB(totalSalesConverted)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#64748b' }}>ยอดจ่ายรางวัลทั้งหมด:</span><strong style={{ color: '#ef4444', fontSize: '16px' }}>฿ {formatTHB(totalPayoutConverted)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}><span style={{ color: '#0f172a', fontWeight: 'bold' }}>กำไรสุทธิ:</span><strong style={{ color: totalProfitConverted >= 0 ? '#10b981' : '#ef4444', fontSize: '18px' }}>{totalProfitConverted >= 0 ? '+' : ''}{formatTHB(totalProfitConverted)} ฿</strong></div>
          </div>
          <div style={{ flex: '1 1 350px', backgroundColor: percentDiff <= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${percentDiff <= 0 ? '#bbf7d0' : '#fecaca'}`, padding: '20px', borderRadius: '12px' }}>
             <h4 style={{ margin: '0 0 15px 0', color: percentDiff <= 0 ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={20} /> วิเคราะห์ความเสี่ยงการจ่ายเงิน</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>เป้าหมาย (ตั้งไว้ที่)</div><strong style={{ color: '#334155', fontSize: '18px' }}>{TARGET_PERCENT}%</strong></div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>จ่ายรางวัลจริง (ตอนนี้)</div><strong style={{ color: percentDiff <= 0 ? '#10b981' : '#ef4444', fontSize: '18px' }}>{actualPayoutPercent.toFixed(1)}%</strong></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: percentDiff <= 0 ? '#15803d' : '#b91c1c' }}>{percentDiff <= 0 ? <span>✅ ต่ำกว่าเป้าหมายที่ตั้งไว้ {Math.abs(percentDiff).toFixed(1)}% (ระบบมีกำไร)</span> : <span>⚠️ เกินเป้าหมายที่ตั้งไว้ {Math.abs(percentDiff).toFixed(1)}% (ขาดทุน/ความเสี่ยงสูง)</span>}</div>
          </div>
        </div>

        {winnersList.length > 0 ? (
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Gift size={22} /> รายชื่อผู้ถูกรางวัล ประจำวันที่ {formatThaiDate(selectedDate)}
            </h4>
            
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0fdf4', color: '#166534', borderBottom: '2px solid #bbf7d0' }}>
                    <th style={{ padding: '12px', width: '40px' }}>
                      <input type="checkbox" onChange={handleSelectAll} checked={selectedWinners.length > 0 && selectedWinners.length === unpaidsCount} disabled={unpaidsCount === 0} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    </th>
                    <th style={{ padding: '12px' }}>ผู้ซื้อ (Username)</th>
                    <th style={{ padding: '12px' }}>เลขที่ถูก</th>
                    <th style={{ padding: '12px' }}>ยอดซื้อ</th>
                    <th style={{ padding: '12px' }}>ต้องโอนจ่าย</th>
                    <th style={{ padding: '12px' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {winnersList.map((winner, idx) => {
                    const isPaid = ['Paid', 'โอนแล้ว'].includes(winner.status);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: isPaid ? '#f1f5f9' : 'white' }}>
                        <td style={{ padding: '12px' }}>
                          <input type="checkbox" checked={selectedWinners.includes(winner.order_item_id)} onChange={() => handleSelectWinner(winner.order_item_id)} disabled={isPaid} style={{ width: '16px', height: '16px', cursor: isPaid ? 'not-allowed' : 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold', opacity: isPaid ? 0.6 : 1 }}>{winner.username}</td>
                        <td style={{ padding: '12px', opacity: isPaid ? 0.6 : 1 }}>
                          <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{winner.selected_number}</span> 
                          <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({winner.lottery_type} ตัว)</span>
                        </td>
                        <td style={{ padding: '12px', opacity: isPaid ? 0.6 : 1 }}>{winner.currency_code === 'THB' ? formatTHB(winner.price) : formatLAK(winner.price)} {winner.currency_code}</td>
                        <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold', opacity: isPaid ? 0.6 : 1 }}>+ {winner.currency_code === 'THB' ? formatTHB(winner.prize_amount) : formatLAK(winner.prize_amount)} {winner.currency_code}</td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(winner.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unpaidsCount > 0 && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#b45309', fontWeight: 'bold' }}>ยอดรวมที่ต้องโอนให้ลูกค้าที่เลือก ({selectedWinners.length} รายการ):</p>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  {totalTransferTHB > 0 && <h3 style={{ margin: 0, color: '#d97706', fontSize: '24px' }}>{formatTHB(totalTransferTHB)} THB</h3>}
                  {totalTransferLAK > 0 && <h3 style={{ margin: 0, color: '#d97706', fontSize: '24px' }}>{formatLAK(totalTransferLAK)} LAK</h3>}
                  {totalTransferTHB === 0 && totalTransferLAK === 0 && <h3 style={{ margin: 0, color: '#d97706', fontSize: '24px' }}>0.00</h3>}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', flex: '1 1 200px', maxWidth: '300px' }}>
                    <AlertOctagon size={16} color="#9ca3af" style={{ marginRight: '8px' }}/>
                    <input type="password" placeholder="ใส่รหัสผ่าน Admin เพื่อยืนยัน" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }} />
                  </div>
                  <button onClick={handleTransfer} disabled={isProcessing || selectedWinners.length === 0} style={{ backgroundColor: selectedWinners.length > 0 ? '#10b981' : '#9ca3af', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: selectedWinners.length > 0 && !isProcessing ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    {isProcessing ? <RefreshCw size={18} style={{ animation: 'spin 2s linear infinite' }} /> : <Award size={18} />}
                    {isProcessing ? 'กำลังโอนเงิน...' : 'โอนเงินรางวัล'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', textAlign: 'center', color: '#94a3b8' }}>
            ยังไม่มีผู้ถูกรางวัลในงวดนี้ หรือระบบยังไม่ออกผล
          </div>
        )}

        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <h4 style={{ margin: 0, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}><TrendingUp size={22} /> สถิติเลขขายดี และ การประเมินความเสี่ยง</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '5px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
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
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
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
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
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

        <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={22} color="#64748b" /> รายการสั่งซื้อทั้งหมด ({formatThaiDate(selectedDate)})</h4>
          
          {isLoadingDetail ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูลบิล...</div>
          ) : salesData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีรายการขายในงวดนี้</div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', width: '40px' }}></th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>เวลา</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>รหัสบิล</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>ผู้ซื้อ</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>จำนวนรายการ</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>ยอดรวมทั้งบิล</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1' }}>สถานะบิล</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((order) => (
                    <React.Fragment key={order.order_id}>
                      <tr onClick={() => toggleRow(order.order_id)} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: expandedRows[order.order_id] ? '#f1f5f9' : 'white', transition: 'all 0.2s' }}>
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
                                  {item.animal_image ? <img src={item.animal_image} alt={item.animal_name} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover' }} /> : <div style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.lottery_type}</span></div>}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{item.selected_number}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>{order.currency_code === 'THB' ? formatTHB(item.price) : formatLAK(item.price)} {order.currency_code}</span>
                                      {['ถูกรางวัล', 'Paid', 'Win', 'ชนะ'].includes(item.item_status) && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>ถูกรางวัล!</span>}
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