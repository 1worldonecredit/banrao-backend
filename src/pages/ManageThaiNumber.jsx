import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Clock, Trophy, CheckCircle, Ban, PlayCircle, RefreshCw, AlertTriangle, Edit, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ManageThaiNumber = () => {
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State สำหรับสร้างงวดใหม่
  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [drawDate, setDrawDate] = useState('');

  // Form State สำหรับประกาศผล
  const [selectedRound, setSelectedRound] = useState(null);
  const [number6, setNumber6] = useState('');
  const [number2bot, setNumber2bot] = useState('');

  // 🌟 State สำหรับระบบ "แก้ไขงวด"
  const [editingRoundId, setEditingRoundId] = useState(null);
  const [editFormData, setEditFormData] = useState({ round_number: '', open_time: '', close_time: '', draw_time: '' });

  const fetchRounds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/rounds`);
      const data = await res.json();
      if (data.success) setRounds(data.rounds);
    } catch (err) {
      console.error('Error fetching Thai rounds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const handleCreateRound = async (e) => {
    e.preventDefault();
    if (!newRoundTitle || !openDate || !closeDate || !drawDate) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    
    if (!window.confirm(`ยืนยันการเปิดรับแทงหวยไทย: งวด ${newRoundTitle} ใช่หรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/create-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_number: newRoundTitle, open_time: openDate, close_time: closeDate, draw_time: drawDate })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNewRoundTitle(''); setOpenDate(''); setCloseDate(''); setDrawDate('');
        fetchRounds();
      } else {
        alert(`❌ ไม่สำเร็จ: ${data.message}`);
      }
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsProcessing(false); }
  };

  const startEdit = (round) => {
    setEditingRoundId(round.round_id);
    setEditFormData({
      round_number: round.round_number,
      open_time: round.open_time.substring(0, 16),
      close_time: round.close_time.substring(0, 16),
      draw_time: round.draw_time.substring(0, 16)
    });
  };

  const handleSaveEdit = async (round_id) => {
    if (!editFormData.round_number || !editFormData.open_time || !editFormData.close_time || !editFormData.draw_time) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/edit-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id, ...editFormData })
      });
      const data = await res.json();
      if (data.success) {
        setEditingRoundId(null);
        fetchRounds();
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`);
      }
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsProcessing(false); }
  };

  const handleExecuteDraw = async () => {
    if (number6.length !== 6) return alert('กรุณากรอก รางวัลที่ 1 ให้ครบ 6 หลัก');
    if (number2bot.length !== 2) return alert('กรุณากรอก เลขท้าย 2 ตัว ให้ครบ 2 หลัก');
    if (!selectedRound) return alert('กรุณาเลือกรวดที่ต้องการประกาศผล');

    if (!window.confirm(`⚠️ ยืนยันประกาศผลหวยไทย งวด ${selectedRound.round_number} \n\nรางวัลที่ 1: ${number6} \nเลขท้าย 2 ตัว: ${number2bot} \n\nระบบจะตัดเงินและจ่ายผู้ถูกรางวัลอัตโนมัติ ยืนยันหรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/execute-draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: selectedRound.round_id, number6, number2bot })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNumber6(''); setNumber2bot(''); setSelectedRound(null);
        fetchRounds();
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`);
      }
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsProcessing(false); }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f9ff', minHeight: '100vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy size={28} /> จัดการหวยรัฐบาลไทย
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* ============================== */}
        {/* ฟอร์มเปิดงวดใหม่ */}
        {/* ============================== */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #0ea5e9' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <PlusCircle size={22} color="#0ea5e9" /> เปิดรับแทงงวดใหม่
          </h4>
          <form onSubmit={handleCreateRound}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>ชื่องวด (เช่น 16 สิงหาคม 2569)</label>
              <input type="text" required value={newRoundTitle} onChange={(e) => setNewRoundTitle(e.target.value)} placeholder="ระบุชื่องวด..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            {/* 🌟 เติม lang="th-TH" เพื่อบังคับเบราว์เซอร์ให้แสดงปฏิทินภาษาไทย */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#16a34a', fontSize: '14px' }}>เวลา เปิดรับแทง</label>
              <input type="datetime-local" lang="th-TH" required value={openDate} onChange={(e) => setOpenDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>เวลา ปิดรับแทง</label>
              <input type="datetime-local" lang="th-TH" required value={closeDate} onChange={(e) => setCloseDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d97706', fontSize: '14px' }}>เวลา ประกาศผล</label>
              <input type="datetime-local" lang="th-TH" required value={drawDate} onChange={(e) => setDrawDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              {isProcessing ? <RefreshCw className="spin" size={20} /> : <Save size={20} />} บันทึกเปิดรับแทง
            </button>
          </form>
        </div>

        {/* ============================== */}
        {/* ฟอร์มประกาศผลรางวัล */}
        {/* ============================== */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: selectedRound ? '4px solid #10b981' : '4px solid #cbd5e1', opacity: selectedRound ? 1 : 0.6 }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <CheckCircle size={22} color={selectedRound ? "#10b981" : "#94a3b8"} /> กรอกผลรางวัลและจ่ายเงิน
          </h4>
          
          {!selectedRound ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Clock size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
              <p>คลิกเลือกงวดที่ "ปิดรับแทงแล้ว" ด้านล่าง<br/>เพื่อกรอกผลรางวัล</p>
            </div>
          ) : (
            <div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                <strong style={{ color: '#166534', display: 'block', fontSize: '16px' }}>ประกาศผล: งวด {selectedRound.round_number}</strong>
                <span style={{ fontSize: '13px', color: '#15803d' }}>ระบบจะจ่ายเงินและค่าคอมมิชชันให้อัตโนมัติ</span>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#b91c1c', fontSize: '14px' }}>รางวัลที่ 1 (6 หลัก)</label>
                <input type="tel" maxLength="6" value={number6} onChange={(e) => setNumber6(e.target.value.replace(/\D/g, ''))} placeholder="XXXXXX" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #fca5a5', boxSizing: 'border-box', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textAlign: 'center', color: '#b91c1c' }} />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1d4ed8', fontSize: '14px' }}>เลขท้าย 2 ตัว (ล่าง)</label>
                <input type="tel" maxLength="2" value={number2bot} onChange={(e) => setNumber2bot(e.target.value.replace(/\D/g, ''))} placeholder="XX" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #93c5fd', boxSizing: 'border-box', fontSize: '24px', fontWeight: 'bold', letterSpacing: '4px', textAlign: 'center', color: '#1d4ed8' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setSelectedRound(null)} style={{ flex: '1', padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                <button onClick={handleExecuteDraw} disabled={isProcessing} style={{ flex: '2', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}>
                  {isProcessing ? <RefreshCw className="spin" size={20} /> : <Trophy size={20} />} ยืนยันจ่ายเงินทันที
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>ประวัติและงวดหวยไทยทั้งหมด</h3>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}><RefreshCw className="spin" size={30} color="#0ea5e9" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
          {rounds.map(r => {
            const isCompleted = r.status === 'Completed';
            const isClosed = new Date() > new Date(r.close_time) && !isCompleted;
            const isOpen = new Date() >= new Date(r.open_time) && new Date() <= new Date(r.close_time) && !isCompleted;
            const isEditing = editingRoundId === r.round_id;
            
            return (
              <div key={r.round_id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
                
                <div style={{ padding: '15px', backgroundColor: isCompleted ? '#f0fdf4' : isClosed ? '#fef2f2' : isOpen ? '#f0f9ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0f172a', fontSize: '16px' }}>งวด: {r.round_number}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isCompleted ? <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ออกผลแล้ว</span> :
                     isClosed ? <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>รอประกาศผล</span> :
                     isOpen ? <span style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>กำลังเปิดรับแทง</span> :
                     <span style={{ backgroundColor: '#d97706', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>รอเปิดขาย</span>}
                    
                    {!isCompleted && !isEditing && (
                      <button onClick={() => startEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="แก้ไขงวดนี้">
                        <Edit size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div style={{ padding: '15px', backgroundColor: '#fffbeb' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ชื่องวด:</label>
                      <input type="text" value={editFormData.round_number} onChange={e => setEditFormData({...editFormData, round_number: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    {/* 🌟 เติม lang="th-TH" ในโหมดแก้ไขด้วย */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>เปิดรับ:</label>
                      <input type="datetime-local" lang="th-TH" value={editFormData.open_time} onChange={e => setEditFormData({...editFormData, open_time: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>ปิดรับ:</label>
                      <input type="datetime-local" lang="th-TH" value={editFormData.close_time} onChange={e => setEditFormData({...editFormData, close_time: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>ประกาศผล:</label>
                      <input type="datetime-local" lang="th-TH" value={editFormData.draw_time} onChange={e => setEditFormData({...editFormData, draw_time: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingRoundId(null)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#cbd5e1', color: '#334155', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                      <button onClick={() => handleSaveEdit(r.round_id)} disabled={isProcessing} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                        {isProcessing ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} บันทึก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '15px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>เปิดรับแทง:</span> <strong>{formatDate(r.open_time)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ปิดรับแทง:</span> <strong style={{ color: '#ef4444' }}>{formatDate(r.close_time)}</strong></div>
                    
                    {isCompleted ? (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                          <div><span style={{ display: 'block', fontSize: '11px' }}>รางวัลที่ 1</span><strong style={{ fontSize: '20px', color: '#b91c1c' }}>{r.result_6}</strong></div>
                          <div><span style={{ display: 'block', fontSize: '11px' }}>เลขท้าย 2 ตัว</span><strong style={{ fontSize: '20px', color: '#1d4ed8' }}>{r.result_2_bottom}</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '15px' }}>
                        <button 
                          onClick={() => setSelectedRound(r)} 
                          disabled={!isClosed && !isCompleted}
                          style={{ width: '100%', padding: '10px', backgroundColor: isClosed ? '#10b981' : '#e2e8f0', color: isClosed ? 'white' : '#94a3b8', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isClosed ? 'pointer' : 'not-allowed' }}
                        >
                          {isClosed ? 'คลิกเพื่อประกาศผลรางวัล' : 'ยังไม่ถึงเวลาประกาศผล'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {rounds.length === 0 && <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีการเปิดงวดหวยไทย</div>}
        </div>
      )}
    </div>
  );
};

export default ManageThaiNumber;