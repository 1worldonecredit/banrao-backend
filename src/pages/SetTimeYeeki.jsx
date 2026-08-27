import React, { useState, useEffect } from 'react';
import { Clock, Save, RefreshCw, Calendar, Edit3, CheckCircle2, XCircle, AlertTriangle, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const SetTimeYeeki = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [now, setNow] = useState(new Date()); 

  const lastCheckedDateRef = React.useRef(new Date().getDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);

      if (currentTime.getDate() !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentTime.getDate(); 
        
        const newDateStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
        setSelectedDate(newDateStr); 

        const arr = [];
        for (let i = 1; i <= 24; i++) {
          const hour = i - 1;
          const hStr = hour.toString().padStart(2, '0');
          arr.push({
            round_id: `new_${i}`,
            round_number: i,
            open_time: `${hStr}:01`,
            close_time: `${hStr}:55`,
            draw_time: `${hStr}:56`,
            status: 'Pending',
            isNew: true 
          });
        }
        setRounds(arr);

        fetch(`${API_URL}/api/admin/yeeki-rounds/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: newDateStr, rounds: arr })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('✅ ระบบบันทึกข้อมูลรอบเวลา 00:00 น. สำเร็จ!');
            window.location.reload(); 
          }
        })
        .catch(err => console.error('Midnight auto-save failed:', err));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const extractTime = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && val.length <= 5 && val.includes(':')) return val; 
    try {
      const cleanVal = val.replace('T', ' ').replace('Z', '');
      const d = new Date(cleanVal);
      if (isNaN(d.getTime())) return val.substring(11, 16); 
      return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    } catch (e) {
      return val.substring(0, 5);
    }
  };

  // 🌟 1. ดึงข้อมูลด้วย API ของ Admin และเพิ่ม Dependency ให้ปฏิทินทำงานได้ 100%
  const fetchRounds = async () => {
    setIsLoading(true);
    try {
      // แก้มาใช้ API สำหรับ Admin โดยส่งวันที่จากปฏิทินไปด้วย
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds?date=${selectedDate}`);
      const data = await res.json();
      if (data.success && data.rounds && data.rounds.length > 0) {
        const formattedRounds = data.rounds.map(r => ({
          ...r,
          open_time: extractTime(r.open_time),
          close_time: extractTime(r.close_time),
          draw_time: extractTime(r.draw_time),
          isNew: false 
        }));
        setRounds(formattedRounds);
      } else {
        generateDefaultRounds(); 
      }
    } catch (err) {
      console.error('Error fetching rounds:', err);
      alert('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า API');
      generateDefaultRounds();
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลใหม่ทุกครั้งที่แอดมินเปลี่ยนวันที่บนปฏิทิน
  useEffect(() => {
    fetchRounds();
  }, [selectedDate]);

  const generateDefaultRounds = () => {
    const arr = [];
    for (let i = 1; i <= 24; i++) {
      const hour = i - 1;
      const hStr = hour.toString().padStart(2, '0');
      arr.push({
        round_id: `new_${i}`,
        round_number: i,
        open_time: `${hStr}:01`,
        close_time: `${hStr}:55`,
        draw_time: `${hStr}:56`,
        status: 'Pending',
        isNew: true 
      });
    }
    setRounds(arr);

    fetch(`${API_URL}/api/admin/yeeki-rounds/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, rounds: arr })
    }).catch(err => console.error("Auto-save on initialize failed:", err));
  };

  const handleEditClick = (round) => {
    setEditingId(round.round_id);
    setEditForm({
      open_time: round.open_time, 
      close_time: round.close_time,
      draw_time: round.draw_time
    });
  };

  const handleSaveRow = async (round) => {
    if (round.isNew) {
      alert('⚠️ กรุณากด "บันทึกใช้งานทั้ง 24 รอบ" ด้านบนก่อน เพื่อสร้างข้อมูลทั้งหมดลงระบบเป็นครั้งแรกครับ');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds/${round.round_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, draw_date: selectedDate })
      });
      const data = await res.json();
      
      if (data.success) {
        setRounds(rounds.map(r => r.round_id === round.round_id ? { ...r, ...editForm } : r));
        setEditingId(null);
        alert('✅ อัปเดตเวลาสำเร็จ');
      } else {
        alert(`❌ อัปเดตไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ไม่สามารถบันทึกได้');
    }
  };

  const handleSaveAll = async () => {
    if(!window.confirm(`ยืนยันการสร้าง/บันทึกตารางเวลาทั้ง 24 รอบของวันที่ ${selectedDate} ลงฐานข้อมูลจริงใช่หรือไม่?`)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, rounds })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ บันทึกข้อมูลตารางเวลาทั้งหมดลงฐานข้อมูลเรียบร้อยแล้ว!');
        fetchRounds(); 
      } else {
        alert(`❌ บันทึกไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ไม่สามารถบันทึกได้');
    } finally {
      setIsLoading(false);
    }
  };

  const isTemplateMode = rounds.length > 0 && rounds[0].isNew;

  // 🌟 2. อัปเกรดความฉลาดของแอดมิน: คำนวณ 12 รอบ (แบบเดียวกับหน้าลูกค้าเป๊ะๆ) ก่อน Render
  let openCount = 0;
  const processedRounds = rounds.map(round => {
    if (round.isNew || !round.open_time || !round.close_time || !round.draw_time) {
      return { ...round, displayStatus: 'new' };
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [closeH, closeM] = round.close_time.split(':').map(Number);
    const closeDate = new Date(year, month - 1, day, closeH, closeM, 0);
    const [drawH, drawM] = round.draw_time.split(':').map(Number);
    const drawDate = new Date(year, month - 1, day, drawH, drawM, 0);
    
    // ถ้าเวลาปัจจุบันเลยเวลาออกผลไปแล้ว
    if (now > drawDate) {
      return { ...round, displayStatus: 'ended', closeDate };
    } 
    // ถ้าเวลาปัจจุบันอยู่ระหว่างการ ปิดรับแทง -> รอออกผล
    if (now >= closeDate && now <= drawDate) {
      return { ...round, displayStatus: 'waiting', closeDate };
    }
    
    // ถ้ายังไม่หมดเวลา ให้นับสิทธิ์เป็น "เปิดรับแทง" ได้ 12 รอบ!
    if (openCount < 12) {
      openCount++;
      return { ...round, displayStatus: 'open', closeDate };
    }

    return { ...round, displayStatus: 'upcoming', closeDate };
  });

  const getRoundStatus = (round) => {
    if (round.displayStatus === 'new') return { text: 'ยังไม่บันทึกข้อมูล/เวลาไม่ครบ', color: '#94a3b8', bgColor: '#f1f5f9' };
    if (round.displayStatus === 'ended') return { text: 'หมดเวลา (ออกผลแล้ว)', color: '#ef4444', bgColor: '#fef2f2' };
    if (round.displayStatus === 'waiting') return { text: 'ปิดรับแทง (รอออกผล)', color: '#d97706', bgColor: '#fffbeb' };
    
    if (round.displayStatus === 'open') {
      const diff = round.closeDate - now;
      if (diff <= 0) return { text: 'กำลังประมวลผล...', color: '#d97706', bgColor: '#fffbeb' };
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      return { text: `🟢 กำลังเปิดขาย (${h}:${m}:${s})`, color: '#16a34a', bgColor: '#f0fdf4' };
    }
    
    return { text: 'รอเปิดรับแทง', color: '#475569', bgColor: '#f8fafc' };
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, color: '#9d174d', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={28} /> ตั้งเวลารอบหวย (จับยี่กี)
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <Calendar size={20} color="#475569" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={{ border: 'none', outline: 'none', fontWeight: 'bold', fontSize: '15px', color: '#1e293b', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#0ea5e9" /> ตารางรอบประจำวันที่: {selectedDate}
            {isTemplateMode && <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'normal', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '12px' }}>*ยังไม่ได้บันทึกลงฐานข้อมูล</span>}
          </h4>
          <button 
            onClick={handleSaveAll}
            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}
          >
            <Save size={18} /> บันทึกใช้งานทั้ง 24 รอบ
          </button>
        </div>

        <div style={{ backgroundColor: '#fffbeb', padding: '10px 15px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#d97706" />
          <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>
            ระบบบังคับให้ป้อนเวลาแบบ 24 ชั่วโมง (00:00 - 23:59) เพื่อความแม่นยำสูงสุด
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={30} className="spin" style={{ margin: '0 auto 10px' }} />
            กำลังโหลดข้อมูลรอบ...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '700px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px' }}>รอบที่</th>
                  <th style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Activity size={16} color="#0ea5e9" /> สถานะปัจจุบัน
                    </div>
                  </th>
                  <th style={{ padding: '12px' }}>เวลาเปิดรับซื้อ</th>
                  <th style={{ padding: '12px' }}>เวลาปิดรับซื้อ</th>
                  <th style={{ padding: '12px' }}>เวลาออกผลรางวัล</th>
                  <th style={{ padding: '12px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {/* 🌟 เปลี่ยนจาก rounds.map เป็น processedRounds.map เพื่อเรียกใช้ข้อมูลที่คำนวณแล้ว */}
                {processedRounds.map((round) => {
                  const isEditing = editingId === round.round_id;
                  const statusInfo = getRoundStatus(round); 
                  
                  return (
                    <tr key={round.round_id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: isEditing ? '#f8fafc' : 'white' }}>
                      
                      <td style={{ padding: '10px', fontWeight: '900', color: '#9d174d', fontSize: '15px' }}>
                        รอบ {round.round_number}
                      </td>

                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          backgroundColor: statusInfo.bgColor, 
                          color: statusInfo.color, 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 'bold',
                          border: `1px solid ${statusInfo.color}40`,
                          display: 'inline-block'
                        }}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {isEditing ? (
                        <>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="time" 
                              lang="en-GB" 
                              value={editForm.open_time} 
                              onChange={(e) => setEditForm({...editForm, open_time: e.target.value})}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '2px solid #16a34a', outline: 'none', fontWeight: 'bold', color: '#16a34a', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="time" 
                              lang="en-GB" 
                              value={editForm.close_time} 
                              onChange={(e) => setEditForm({...editForm, close_time: e.target.value})}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '2px solid #dc2626', outline: 'none', fontWeight: 'bold', color: '#dc2626', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="time" 
                              lang="en-GB" 
                              value={editForm.draw_time} 
                              onChange={(e) => setEditForm({...editForm, draw_time: e.target.value})}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '2px solid #d97706', outline: 'none', fontWeight: 'bold', color: '#d97706', textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button onClick={() => handleSaveRow(round)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <CheckCircle2 size={18} />
                              </button>
                              <button onClick={() => setEditingId(null)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a', fontSize: '14px' }}>
                            {round.open_time} น.
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>
                            {round.close_time} น.
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#d97706', fontSize: '14px' }}>
                            {round.draw_time} น.
                          </td>
                          <td style={{ padding: '10px' }}>
                            <button 
                              onClick={() => handleEditClick(round)} 
                              style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto', fontSize: '13px' }}
                            >
                              <Edit3 size={14} /> แก้ไข
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
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

export default SetTimeYeeki;