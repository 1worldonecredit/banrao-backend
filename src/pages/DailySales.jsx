import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, Clock, CheckCircle, XCircle, Gift, ChevronDown, ChevronUp, Receipt } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DailySales = () => {
  const [salesData, setSalesData] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [summary, setSummary] = useState({ dailyTotal: 0, monthlyTotal: 0, dailyPayout: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🌟 State สำหรับเก็บว่าบิลไหนกำลังถูกกดขยายดูอยู่บ้าง
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchDailySales();
    setExpandedRows({}); // เคลียร์การพับบิลเมื่อเปลี่ยนวัน
  }, [selectedDate]);

  const fetchDailySales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-sales?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setSalesData(data.salesDetails); // ข้อมูลที่เป็นบิลจัดกลุ่มมาแล้ว
        setWinnersList(data.winners); // คนที่ถูกรางวัล
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันกด ขยาย/พับ บิล
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

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* 🌟 Header & Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>รายงานยอดขายรายวัน</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>สรุปยอดซื้อและรายการถูกรางวัลประจำวัน</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Calendar size={18} color="#64748b" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 'bold', cursor: 'pointer' }}
          />
        </div>
      </div>
      
      {/* 🌟 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #0ea5e9', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>ยอดขายวันนี้</p>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {summary.dailyTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
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
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>฿ {summary.monthlyTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
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
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>฿ {summary.dailyPayout.toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '10px', borderRadius: '50%' }}>
              <Award color="#10b981" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 รายชื่อผู้ถูกรางวัล */}
      {winnersList.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px', border: '1px solid #bbf7d0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Gift size={20} /> รายชื่อผู้ถูกรางวัลประจำวัน (เตรียมโอนเงิน)
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
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
                {winnersList.map((winner, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{winner.username}</td>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {winner.animal_image && <img src={winner.animal_image} alt={winner.animal_name} style={{ width: '25px', height: '25px', borderRadius: '4px', objectFit: 'cover' }} />}
                      <div>
                        <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '16px' }}>{winner.selected_number}</span> 
                        <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>({winner.lottery_type} ตัว) {winner.animal_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{winner.price.toLocaleString()} {winner.currency_code}</td>
                    <td style={{ padding: '12px', color: '#16a34a', fontWeight: 'bold' }}>+ {winner.prize_amount.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        โอนเงินเข้า Wallet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 ตารางยอดขายทั้งหมด (แบบบิล ยุบ/ขยายได้) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '16px' }}>รายการสั่งซื้อทั้งหมด ({selectedDate})</h4>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : salesData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีรายการขายในวันที่เลือก</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
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
                {salesData.map((order) => (
                  <React.Fragment key={order.order_id}>
                    
                    {/* 🟢 บรรทัดหลัก (บิล) */}
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
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{order.total_amount.toLocaleString()} <span style={{ color: '#94a3b8', fontSize: '12px' }}>{order.currency_code}</span></td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(order.order_status)}</td>
                    </tr>

                    {/* 🟡 บรรทัดขยาย (แสดงเลขที่ซื้อในบิล) */}
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
                                    <span>{item.price.toLocaleString()} {order.currency_code}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DailySales;