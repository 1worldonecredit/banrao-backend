import React, { useState, useEffect } from 'react';
import { Clock, Save, RefreshCw, Calendar, Edit3, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

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

  useEffect(() => {
    fetchRounds(selectedDate);
  }, [selectedDate]);

  // 🌟 ดึงข้อมูลจากตารางจริง (Database)
  const fetchRounds = async (date) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/yeeki-rounds?date=${date}`);
      const data = await res.json();
      if (data.success && data.rounds && data.rounds.length > 0) {
        setRounds(data.rounds);
      } else {
        // ถ้าฐานข้อมูลว่างเปล่า (ยังไม่เคยกดเซฟ) ให้สร้างตารางร่างขึ้นมาเตรียมไว้
        generateDefaultRounds(); 
      }
    } catch (err) {
      alert('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า API');
      generateDefaultRounds();
    } finally {
      setIsLoading(false);
    }
  };

  const generateDefaultRounds = () => {
    const arr = [];
    for (let i = 1; i <= 24; i++) {
      const hour = i - 1;
      const hStr = hour.toString().padStart(2, '0');
      arr.push({
        round_id: `new_${i}`, // ใส่ ID ชั่วคราวไปก่อน
        round_number: i,
        open_time: `${hStr}:01`,
        close_time: `${hStr}:55`,
        draw_time: `${hStr}:56`,
        status: 'Pending',
        isNew: true 
      });
    }
    setRounds(arr);
  };

  // ดึงเฉพาะเวลา HH:mm มาแสดง และแก้บั๊กเรื่อง Timezone ของ SQL Server
  const extractTime = (val) => {
    if (!val) return '';
    if (val.length <= 5) return val; 
    try {
      const cleanVal = val.replace('T', ' ').replace('Z', '');
      const d = new Date(cleanVal);
      if (isNaN(d.getTime())) return val.substring(11, 16); 
      return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    } catch (e) {
      return val.substring(0, 5);
    }
  };

  const handleEditClick = (round) => {
    setEditingId(round.round_id);
    setEditForm({
      open_time: extractTime(round.open_time),
      close_time: extractTime(round.close_time),
      draw_time: extractTime(round.draw_time)
    });
  };

  // 🌟 บันทึกการแก้ไขเวลา (เฉพาะแถวที่กด) ลง Database จริง
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
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ไม่สามารถบันทึกได้');
    }
  };

  // 🌟 บันทึกเวลาที่เซ็ตไว้ทั้ง 24 รอบ ลง Database จริงรวดเดียว
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
        fetchRounds(selectedDate); // โหลดข้อมูลจริงที่มี ID ชัดเจนจาก DB กลับมาแสดงใหม่
      } else {
        alert(`❌ บันทึกไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) {
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ API ไม่สามารถบันทึกได้');
    } finally {
      setIsLoading(false);
    }
  };

  const isTemplateMode = rounds.length > 0 && rounds[0].isNew;

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
            ระบบบังคับให้ป้อนเวลาแบบ 24 ชั่วโมง (00:00 - 23:59) เพื่อความแม่นยำสูงสุด และป้องกันการเกิดบั๊กข้ามวัน
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={30} className="spin" style={{ margin: '0 auto 10px' }} />
            กำลังโหลดข้อมูลรอบ...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '600px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px' }}>รอบที่</th>
                  <th style={{ padding: '12px' }}>เวลาเปิดรับซื้อ</th>
                  <th style={{ padding: '12px' }}>เวลาปิดรับซื้อ</th>
                  <th style={{ padding: '12px' }}>เวลาออกผลรางวัล</th>
                  <th style={{ padding: '12px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => {
                  const isEditing = editingId === round.round_id;
                  return (
                    <tr key={round.round_id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', backgroundColor: isEditing ? '#f8fafc' : 'white' }}>
                      
                      <td style={{ padding: '10px', fontWeight: '900', color: '#9d174d' }}>
                        รอบ {round.round_number}
                      </td>

                      {isEditing ? (
                        <>
                          <td style={{ padding: '10px' }}>
                            <input 
                              type="time" 
                              lang="en-GB" /* บังคับแสดง 24 ชม. */
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
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>
                            {extractTime(round.open_time)} น.
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#dc2626' }}>
                            {extractTime(round.close_time)} น.
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#d97706' }}>
                            {extractTime(round.draw_time)} น.
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