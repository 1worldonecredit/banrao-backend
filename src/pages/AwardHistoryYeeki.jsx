import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, Search, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const AwardHistoryYeeki = () => {
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [selectedDate]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/yeeki/history?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.data)) {
            setHistoryData(data.data);
        } else if (Array.isArray(data)) {
            setHistoryData(data);
        } else {
            setHistoryData([]);
        }
      } else {
        console.error("Failed to fetch history");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCorrectTime = (timeStr) => {
    if (!timeStr) return '-';
    const cleanStr = timeStr.endsWith('Z') ? timeStr.slice(0, -1) : timeStr;
    return new Date(cleanStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const NumberBadge = ({ number, color, bg }) => (
    <span style={{ 
      display: 'inline-block', 
      padding: '6px 12px', 
      backgroundColor: bg, 
      color: color, 
      borderRadius: '8px', 
      fontWeight: 'bold',
      letterSpacing: '2px',
      fontSize: '15px',
      border: `1px solid ${color}40`
    }}>
      {number || '-'}
    </span>
  );

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy color="#f59e0b" size={28} /> ประวัติการออกเลขจับยี่กี
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="#64748b" />
            <span style={{ fontWeight: 'bold', color: '#475569' }}>เลือกวันที่:</span>
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#334155', flexGrow: 1, maxWidth: '250px' }}
          />
          <button 
            onClick={fetchHistory}
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Search size={18} /> ค้นหา
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#334155' }}>ผลการออกรางวัลประจำวันที่ {selectedDate}</h4>
          <span style={{ fontSize: '14px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
            ทั้งหมด {historyData.length} รอบ
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '14px' }}>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>รอบที่</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>เวลา</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>6 ตัว</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>4 ตัวท้าย</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>3 ตัวบน</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>2 ตัวบน</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>2 ตัวล่าง</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{ padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</td></tr>
              ) : historyData.length > 0 ? (
                historyData.map((round) => {
                  
                  // 🌟 บังคับหั่นเลขทุกตัวจากฐาน 6 ตัวเท่านั้น! เพื่อให้เป็นชุดเดียวกัน
                  let res6 = '-';
                  let res4 = '-';
                  let res3 = '-';
                  let res2top = '-';
                  let res2bot = '-';

                  if (round.result_8_super && round.result_8_super !== '-') {
                      res6 = String(round.result_8_super).slice(-6);
                      res4 = res6.slice(-4);
                      res3 = res6.slice(-3);
                      res2top = res6.slice(-2);
                  } else if (round.result_4_top && round.result_4_top !== '-') {
                      res4 = String(round.result_4_top).slice(-4);
                      res3 = res4.slice(-3);
                      res2top = res4.slice(-2);
                  }

                  if (round.result_2_bottom && round.result_2_bottom !== '-') {
                      res2bot = String(round.result_2_bottom).slice(-2);
                  }

                  return (
                    <tr key={round.round_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#334155' }}>{round.round_number}</td>
                      
                      <td style={{ padding: '15px', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <Clock size={14} /> {formatCorrectTime(round.draw_time)}
                        </div>
                      </td>
                      
                      <td style={{ padding: '15px' }}>
                        <NumberBadge number={res6} color="#8b5cf6" bg="#ede9fe" />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <NumberBadge number={res4} color="#ec4899" bg="#fce7f3" />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <NumberBadge number={res3} color="#ef4444" bg="#fee2e2" />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <NumberBadge number={res2top} color="#f59e0b" bg="#fef3c7" />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <NumberBadge number={res2bot} color="#0ea5e9" bg="#e0f2fe" />
                      </td>

                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: round.status === 'Completed' ? '#dcfce7' : '#f1f5f9',
                          color: round.status === 'Completed' ? '#16a34a' : '#64748b'
                        }}>
                          {round.status === 'Completed' ? 'ออกผลแล้ว' : 'รอออกผล'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '50px', color: '#94a3b8', textAlign: 'center' }}>
                    <AlertCircle size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                    <div>ไม่มีข้อมูลการออกรางวัลในวันที่เลือก</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwardHistoryYeeki;