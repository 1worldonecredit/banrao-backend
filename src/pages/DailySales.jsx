import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, Clock, CheckCircle, XCircle, Gift, ChevronDown, ChevronUp, Receipt, TrendingUp, AlertOctagon, BarChart2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySales = () => {
  const [salesData, setSalesData] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [summary, setSummary] = useState({ dailyTotal: 0, monthlyTotal: 0, dailyPayout: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [expandedRows, setExpandedRows] = useState({});
  const [numberStats, setNumberStats] = useState([]);
  const [activeStatTab, setActiveStatTab] = useState('all');

  useEffect(() => {
    fetchDailySales();
    setExpandedRows({});
    
    const interval = setInterval(() => {
      fetchDailySales(true); 
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchDailySales = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-sales?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setSalesData(data.salesDetails); 
        setWinnersList(data.winners); 
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 ฟังก์ชันคำนวณสถิติ แยก THB และ LAK
  useEffect(() => {
    if (!salesData || salesData.length === 0) {
      setNumberStats([]);
      return;
    }

    const statsMap = {};
    let totalDailySalesCombined = 0; 
    const exchangeRate = 600; // สมมติเรท 1 THB = 600 LAK สำหรับคำนวณสัดส่วนความเสี่ยงรวม

    salesData.forEach(order => {
      if (!order.items) return;
      const isLAK = order.currency_code === 'LAK';

      order.items.forEach(item => {
        const key = `${item.lottery_type}-${item.selected_number}`;
        const betAmount = Number(item.price) || 0;

        let multiplier = 0;
        if (item.lottery_type === '2') multiplier = 90;
        if (item.lottery_type === '3') multiplier = 900;
        if (item.lottery_type === '4') multiplier = 7000;
        if (item.lottery_type === '6') multiplier = 400000;
        if (item.lottery_type === '8') multiplier = 1000000;

        const payoutAmount = betAmount * multiplier;

        if (!statsMap[key]) {
          statsMap[key] = {
            number: item.selected_number,
            type: item.lottery_type,
            betTHB: 0,
            betLAK: 0,
            payoutTHB: 0,
            payoutLAK: 0,
            combinedValue: 0, // ค่าสมมติในหน่วย THB เพื่อใช้เรียงลำดับ Top 10
            combinedPayoutValue: 0
          };
        }

        // แยกจับยัดใส่ THB หรือ LAK
        if (isLAK) {
          statsMap[key].betLAK += betAmount;
          statsMap[key].payoutLAK += payoutAmount;
          statsMap[key].combinedValue += (betAmount / exchangeRate);
          statsMap[key].combinedPayoutValue += (payoutAmount / exchangeRate);
          totalDailySalesCombined += (betAmount / exchangeRate);
        } else {
          statsMap[key].betTHB += betAmount;
          statsMap[key].payoutTHB += payoutAmount;
          statsMap[key].combinedValue += betAmount;
          statsMap[key].combinedPayoutValue += payoutAmount;
          totalDailySalesCombined += betAmount;
        }
      });
    });

    if (totalDailySalesCombined === 0) totalDailySalesCombined = 1;

    const statsArray = Object.values(statsMap)
      .map(stat => ({
        ...stat,
        salesPercent: (stat.combinedValue / totalDailySalesCombined) * 100,
        riskPercent: (stat.combinedPayoutValue / totalDailySalesCombined) * 100
      }))
      .sort((a, b) => b.combinedValue - a.combinedValue);

    setNumberStats(statsArray);
  }, [salesData]);

  const filteredStats = numberStats
    .filter(stat => activeStatTab === 'all' || stat.type === activeStatTab)
    .slice(0, 10);

  const toggleRow = (orderId) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ถูกรางวัล':
      case 'ถูก':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> ถูกรางวัล</span>;
      case 'ไม่ถูกรางวัล':
      case 'ไม่ถูก':
        return <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> ไม่ถูกรางวัล</span>;
      default:
        return <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> รอผลตรวจ</span>;
    }
  };

  // Helper formats
  const formatTHB = (val) => val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatLAK = (val) => val.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>รายงานยอดขายรายวัน</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            สรุปยอดซื้อและรายการถูกรางวัลประจำวัน <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>(อัปเดตอัตโนมัติทุก 1 นาที)</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Calendar size={18} color="#64748b" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #0ea5e9', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายวันนี้ (ประมาณการ)</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {formatTHB(summary.dailyTotal || 0)}</h3>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', padding: '10px', borderRadius: '50%' }}>
              <DollarSign color="#0ea5e9" size={24} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #8b5cf6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายสะสมเดือนนี้</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {formatTHB(summary.monthlyTotal || 0)}</h3>
            </div>
            <div style={{ backgroundColor: '#ede9fe', padding: '10px', borderRadius: '50%' }}>
              <Calendar color="#8b5cf6" size={24} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดจ่ายเงินรางวัลวันนี้</p>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>฿ {formatTHB(summary.dailyPayout || 0)}</h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '10px', borderRadius: '50%' }}>
              <Award color="#10b981" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 สถิติความเสี่ยงเลขขายดี (แยก THB/LAK) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <TrendingUp size={22} /> สถิติเลขขายดี และ การประเมินความเสี่ยง (Top 10)
        </h4>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
          {[
            { id: 'all', label: 'รวมทั้งหมด' },
            { id: '2', label: '2 ตัวท้าย' },
            { id: '3', label: '3 ตัวท้าย' },
            { id: '4', label: '4 ตัวท้าย' },
            { id: '6', label: '6 ตัว (ที่ 1)' },
            { id: '8', label: '8 ตัว (ซูเปอร์)' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveStatTab(tab.id)}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: activeStatTab === tab.id ? '#0ea5e9' : 'transparent', 
                color: activeStatTab === tab.id ? 'white' : '#64748b', 
                border: 'none', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {filteredStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>ยังไม่มีข้อมูลการซื้อในหมวดหมู่นี้</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '950px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
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
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{stat.number}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                        {stat.type} ตัว
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0ea5e9' }}>
                      {stat.betTHB > 0 ? formatTHB(stat.betTHB) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#8b5cf6' }}>
                      {stat.betLAK > 0 ? formatLAK(stat.betLAK) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                      {stat.payoutTHB > 0 ? formatTHB(stat.payoutTHB) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>
                      {stat.payoutLAK > 0 ? formatLAK(stat.payoutLAK) : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(stat.riskPercent, 100)}%`, height: '100%', backgroundColor: stat.riskPercent > 50 ? '#ef4444' : (stat.riskPercent > 20 ? '#f59e0b' : '#10b981') }}></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: stat.riskPercent > 50 ? '#ef4444' : '#64748b', width: '40px' }}>
                          {stat.riskPercent.toFixed(1)}%
                        </span>
                        {stat.riskPercent > 80 && <AlertOctagon size={14} color="#ef4444" title="ความเสี่ยงสูงมาก" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 รายชื่อผู้ถูกรางวัล */}
      {winnersList.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <Gift size={22} /> รายชื่อผู้ถูกรางวัลประจำวัน (เตรียมโอนเงิน)
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ผู้ซื้อ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>เลขที่ถูก</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>ยอดซื้อ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0' }}>เงินรางวัลที่ได้</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #bbf7d0', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {winnersList.map((winner, idx) => {
                  const isTHB = winner.currency_code === 'THB';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{winner.username}</td>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {winner.animal_image && <img src={winner.animal_image} alt={winner.animal_name} style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />}
                        <div>
                          <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{winner.selected_number}</span> 
                          <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({winner.lottery_type} ตัว) {winner.animal_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isTHB ? formatTHB(winner.price) : formatLAK(winner.price)} {winner.currency_code}
                      </td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold', fontSize: '16px' }}>
                        + {isTHB ? formatTHB(winner.prize_amount) : formatLAK(winner.prize_amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                          โอนเงินเข้า Wallet
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 ตารางยอดขายทั้งหมด (แบบบิล ยุบ/ขยายได้) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={22} color="#64748b" /> รายการสั่งซื้อทั้งหมด ({selectedDate})
        </h4>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : salesData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีรายการขายในวันที่เลือก</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', width: '40px' }}></th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>เวลา</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>รหัสบิล</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ผู้ซื้อ (Username)</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>จำนวนรายการ</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ยอดรวมทั้งบิล</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>สถานะบิล</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((order) => {
                  const isTHB = order.currency_code === 'THB';
                  return (
                    <React.Fragment key={order.order_id}>
                      <tr 
                        onClick={() => toggleRow(order.order_id)} 
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: expandedRows[order.order_id] ? '#f8fafc' : 'white', transition: 'all 0.2s' }}
                      >
                        <td style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                          {expandedRows[order.order_id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{order.buy_time.substring(11, 16)}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#0ea5e9' }}>#{order.order_id.toString().padStart(5, '0')}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{order.username}</td>
                        <td style={{ padding: '12px', color: '#64748b' }}><Receipt size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> {order.items.length} รายการ</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {isTHB ? formatTHB(order.total_amount) : formatLAK(order.total_amount)} <span style={{ color: '#94a3b8', fontSize: '12px' }}>{order.currency_code}</span>
                        </td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(order.order_status)}</td>
                      </tr>

                      {expandedRows[order.order_id] && (
                        <tr style={{ backgroundColor: '#fcfcfc' }}>
                          <td colSpan="7" style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                              {order.items.map((item) => (
                                <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                  
                                  {item.animal_image ? (
                                    <img src={item.animal_image} alt={item.animal_name} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '35px', height: '35px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.lottery_type}ต</span>
                                    </div>
                                  )}

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>{item.selected_number}</span>
                                      {item.animal_name && <span style={{ fontSize: '11px', color: '#64748b' }}>({item.animal_name})</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>{isTHB ? formatTHB(item.price) : formatLAK(item.price)} {order.currency_code}</span>
                                      {item.item_status === 'ถูกรางวัล' && <span style={{ color: '#16a34a', fontWeight: 'bold' }}>ถูกรางวัล!</span>}
                                    </div>
                                  </div>
                                  
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DailySales;