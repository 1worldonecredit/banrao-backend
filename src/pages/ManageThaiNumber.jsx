import React, { useState, useEffect } from 'react';
import { PlusCircle, Save, Clock, Trophy, CheckCircle, RefreshCw, XCircle, Users, CheckSquare, Square } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

// ==========================================
// 🌟 Component: ตัวเลือกวันเวลาแบบไทย 100% (รักษาของเดิมไว้)
// ==========================================
const ThaiDateTimePicker = ({ value, onChange }) => {
  const current = value ? new Date(value) : new Date();

  useEffect(() => {
    if (!value) updateDateString(current);
  }, []);

  const updateDateString = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}T${hh}:${mins}`);
  };

  const handleChange = (type, val) => {
    const d = new Date(current);
    if (type === 'date') d.setDate(val);
    if (type === 'month') d.setMonth(val);
    if (type === 'year') d.setFullYear(val);
    if (type === 'hour') d.setHours(val);
    if (type === 'minute') d.setMinutes(val);
    updateDateString(d);
  };

  const selectStyle = {
    padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff',
    color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '14px'
  };

  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <select value={current.getDate()} onChange={(e) => handleChange('date', e.target.value)} style={selectStyle}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{String(d).padStart(2, '0')}</option>)}
      </select>
      <select value={current.getMonth()} onChange={(e) => handleChange('month', e.target.value)} style={selectStyle}>
        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
      <select value={current.getFullYear()} onChange={(e) => handleChange('year', e.target.value)} style={selectStyle}>
        {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y + 543}</option>)}
      </select>
      <span style={{ margin: '0 4px', color: '#475569', fontWeight: 'bold', fontSize: '13px' }}>เวลา</span>
      <select value={current.getHours()} onChange={(e) => handleChange('hour', e.target.value)} style={{ ...selectStyle, backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
        {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
      </select>
      <span style={{ fontWeight: '900', color: '#64748b' }}>:</span>
      <select value={current.getMinutes()} onChange={(e) => handleChange('minute', e.target.value)} style={{ ...selectStyle, backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
        {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
      </select>
      <span style={{ margin: '0 2px', color: '#64748b', fontWeight: 'bold', fontSize: '13px' }}>น.</span>
    </div>
  );
};

// ==========================================
// Component หลัก
// ==========================================
const ManageThaiNumber = () => {
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [drawDate, setDrawDate] = useState('');

  const [editingRoundId, setEditingRoundId] = useState(null);
  const [editFormData, setEditFormData] = useState({ round_number: '', open_time: '', close_time: '', draw_time: '' });

  // State สำหรับระบบตรวจสอบรายชื่อผู้ถูกรางวัล
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [viewingWinnersRound, setViewingWinnersRound] = useState(null);
  const [winnersList, setWinnersList] = useState([]);
  const [selectedWinnerIds, setSelectedWinnerIds] = useState([]);
  const [autoPayoutCountdown, setAutoPayoutCountdown] = useState(300); // 5 นาที (300 วินาที)
  const [isAutoPayoutPaused, setIsAutoPayoutPaused] = useState(false);

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

  useEffect(() => { fetchRounds(); }, []);

  // นับถอยหลังโอนเงินอัตโนมัติ
  useEffect(() => {
    let timer;
    if (showWinnersModal && autoPayoutCountdown > 0 && !isAutoPayoutPaused) {
      timer = setInterval(() => setAutoPayoutCountdown(prev => prev - 1), 1000);
    } else if (autoPayoutCountdown === 0 && showWinnersModal && !isAutoPayoutPaused) {
      handleProcessPayout(selectedWinnerIds); // โอนอัตโนมัติเมื่อหมดเวลา
    }
    return () => clearInterval(timer);
  }, [showWinnersModal, autoPayoutCountdown, isAutoPayoutPaused, selectedWinnerIds]);

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
      } else { alert(`❌ ไม่สำเร็จ: ${data.message}`); }
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsProcessing(false); }
  };

  // เปิดระบบแก้ไขเมื่อคลิกการ์ด
  const startEdit = (round) => {
    setEditingRoundId(round.round_id);
    setEditFormData({
      round_number: round.round_number,
      open_time: round.open_time.substring(0, 16),
      close_time: round.close_time.substring(0, 16),
      draw_time: round.draw_time.substring(0, 16)
    });
  };

  const handleSaveEdit = async (round_id, e) => {
    e.stopPropagation();
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
      } else { alert(`❌ ผิดพลาด: ${data.message}`); }
    } catch (err) { alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsProcessing(false); }
  };

  // ดึงข้อมูลรายชื่อผู้ถูกรางวัลมาแสดงใน Modal
  const fetchWinnersAndOpenModal = async (round) => {
    setViewingWinnersRound(round);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/winners/${round.round_id}`);
      const data = await res.json();
      
      if (data.success && data.winners) {
        setWinnersList(data.winners);
        setSelectedWinnerIds(data.winners.map(w => w.order_item_id));
      } else {
        setWinnersList([]);
        setSelectedWinnerIds([]);
      }
    } catch (err) {
      console.error(err);
      setWinnersList([]);
      setSelectedWinnerIds([]);
    } finally {
      setAutoPayoutCountdown(300); 
      setIsAutoPayoutPaused(false);
      setShowWinnersModal(true);
      setIsLoading(false);
    }
  };

  // Toggle เลือกคนจ่ายเงิน
  const toggleWinnerSelection = (itemId) => {
    setSelectedWinnerIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleProcessPayout = async (idsToPay) => {
    if (isProcessing) return; 

    if (viewingWinnersRound?.status === 'paid' || viewingWinnersRound?.is_paid) {
        alert('❌ งวดนี้ได้ทำการโอนเงินรางวัลไปแล้ว');
        return;
    }

    if (idsToPay.length === 0) return alert('กรุณาเลือกผู้ใช้อย่างน้อย 1 รายการเพื่อโอนเงิน');
    
    if (!window.confirm(`ยืนยันการโอนเงินเข้า Wallet จำนวน ${idsToPay.length} รายการ ใช่หรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thai-lottery/process-payouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_item_ids: idsToPay, round_id: viewingWinnersRound.round_id })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('✅ โอนเงินรางวัลสำเร็จเรียบร้อยแล้ว!');
        setShowWinnersModal(false);
        fetchRounds();
      } else { 
        alert(`❌ เกิดข้อผิดพลาด: ${data.message}`); 
      }
    } catch (err) {
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatCurrency = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Trophy size={28} /> จัดการหวยรัฐบาลไทย
      </h2>

      {/* 🌟 นำกรอบแบ่งครึ่งออก ให้ฟอร์มเปิดรับแทงกว้างเต็มพื้นที่ */}
      <div style={{ marginBottom: '30px' }}>
        {/* ฟอร์มเปิดงวดใหม่ */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #0ea5e9', maxWidth: '800px' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <PlusCircle size={22} color="#0ea5e9" /> เปิดรับแทงงวดใหม่
          </h4>
          <form onSubmit={handleCreateRound}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>ชื่องวด (เช่น 16 สิงหาคม 2569)</label>
              <input type="text" required value={newRoundTitle} onChange={(e) => setNewRoundTitle(e.target.value)} placeholder="ระบุชื่องวด..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#16a34a', fontSize: '14px' }}>เวลา เปิดรับแทง</label>
              <ThaiDateTimePicker value={openDate} onChange={setOpenDate} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>เวลา ปิดรับแทง</label>
              <ThaiDateTimePicker value={closeDate} onChange={setCloseDate} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#d97706', fontSize: '14px' }}>เวลา ประกาศผล</label>
              <ThaiDateTimePicker value={drawDate} onChange={setDrawDate} />
            </div>
            <button type="submit" disabled={isProcessing} style={{ width: '100%', padding: '12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              {isProcessing ? <RefreshCw className="spin" size={20} /> : <Save size={20} />} บันทึกเปิดรับแทง
            </button>
          </form>
        </div>
      </div>

      <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>ประวัติและงวดหวยไทยทั้งหมด (คลิกที่การ์ดเพื่อจัดการ)</h3>
      
      {isLoading && !showWinnersModal ? (
        <div style={{ textAlign: 'center', padding: '30px' }}><RefreshCw className="spin" size={30} color="#0ea5e9" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {rounds.map(r => {
            const isCompleted = r.status === 'Completed';
            const isClosed = new Date() > new Date(r.close_time) && !isCompleted;
            const isOpen = new Date() >= new Date(r.open_time) && new Date() <= new Date(r.close_time) && !isCompleted;
            const isEditing = editingRoundId === r.round_id;
            
            return (
              <div 
                key={r.round_id} 
                onClick={() => {
                  if (isEditing) return;
                  if (isCompleted) fetchWinnersAndOpenModal(r);
                  else if (!isClosed) startEdit(r);
                }}
                style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative', cursor: isEditing ? 'default' : 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}
              >
                <div style={{ padding: '15px', backgroundColor: isCompleted ? '#f0fdf4' : isClosed ? '#fef2f2' : isOpen ? '#f0f9ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#0f172a', fontSize: '16px' }}>งวด: {r.round_number}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isCompleted ? <span style={{ backgroundColor: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ออกผลแล้ว (ดูรายชื่อ)</span> :
                     isClosed ? <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>ปิดรับแทงแล้ว</span> :
                     isOpen ? <span style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>กำลังเปิด (คลิกแก้ไข)</span> :
                     <span style={{ backgroundColor: '#d97706', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>รอเปิดขาย</span>}
                  </div>
                </div>
                
                {isEditing ? (
                  <div style={{ padding: '15px', backgroundColor: '#fffbeb' }} onClick={e => e.stopPropagation()}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ชื่องวด:</label>
                      <input type="text" value={editFormData.round_number} onChange={e => setEditFormData({...editFormData, round_number: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>เปิดรับ:</label>
                      <ThaiDateTimePicker value={editFormData.open_time} onChange={val => setEditFormData({...editFormData, open_time: val})} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>ปิดรับ:</label>
                      <ThaiDateTimePicker value={editFormData.close_time} onChange={val => setEditFormData({...editFormData, close_time: val})} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>ประกาศผล:</label>
                      <ThaiDateTimePicker value={editFormData.draw_time} onChange={val => setEditFormData({...editFormData, draw_time: val})} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingRoundId(null); }} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#cbd5e1', color: '#334155', fontWeight: 'bold', cursor: 'pointer' }}>ยกเลิก</button>
                      <button onClick={(e) => handleSaveEdit(r.round_id, e)} disabled={isProcessing} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                        {isProcessing ? <RefreshCw className="spin" size={16} /> : <Save size={16} />} บันทึก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '15px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>เปิดรับแทง:</span> <strong>{formatDate(r.open_time)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ปิดรับแทง:</span> <strong style={{ color: '#ef4444' }}>{formatDate(r.close_time)}</strong></div>
                    
                    {isCompleted && (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                          <div><span style={{ display: 'block', fontSize: '11px' }}>รางวัลที่ 1</span><strong style={{ fontSize: '20px', color: '#b91c1c' }}>{r.result_6}</strong></div>
                          <div><span style={{ display: 'block', fontSize: '11px' }}>เลขล่าง 2 ตัว</span><strong style={{ fontSize: '20px', color: '#1d4ed8' }}>{r.result_2_bottom}</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* 🌟 Modal: ตรวจสอบและโอนเงินผู้ถูกรางวัล */}
      {/* ========================================== */}
      {showWinnersModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={24} color="#10b981" /> รายชื่อผู้ถูกรางวัล (งวด {viewingWinnersRound?.round_number})
                </h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  ตรวจสอบความถูกต้องก่อนทำรายการโอนเงินเข้า Wallet
                </p>
              </div>
              <button onClick={() => setShowWinnersModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <XCircle size={28} />
              </button>
            </div>

            {/* Auto Payout Alert */}
            <div style={{ backgroundColor: isAutoPayoutPaused ? '#fef2f2' : '#fffbeb', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isAutoPayoutPaused ? '#ef4444' : '#d97706', fontWeight: 'bold' }}>
                <Clock size={20} />
                {isAutoPayoutPaused ? 'ระงับการโอนอัตโนมัติแล้ว (ต้องกดโอนเอง)' : `ระบบจะโอนเงินให้อัตโนมัติใน: ${Math.floor(autoPayoutCountdown / 60)}:${String(autoPayoutCountdown % 60).padStart(2, '0')} นาที`}
              </div>
              <button 
                onClick={() => setIsAutoPayoutPaused(!isAutoPayoutPaused)} 
                style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${isAutoPayoutPaused ? '#fca5a5' : '#fcd34d'}`, backgroundColor: 'white', color: isAutoPayoutPaused ? '#ef4444' : '#d97706', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                {isAutoPayoutPaused ? '▶️ เปิดระบบโอนอัตโนมัติ' : '⏸️ ระงับชั่วคราว'}
              </button>
            </div>

            {/* Table Content */}
            <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
              {winnersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  ไม่มีผู้ถูกรางวัลในงวดนี้
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1', width: '50px' }}>
                        <button onClick={() => setSelectedWinnerIds(selectedWinnerIds.length === winnersList.length ? [] : winnersList.map(w => w.order_item_id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}>
                          {selectedWinnerIds.length === winnersList.length ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                      </th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>ผู้ใช้งาน</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>ประเภท</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1' }}>เลขที่ซื้อ</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>เงินรางวัล (฿/₭)</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #cbd5e1', textAlign: 'center' }}>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winnersList.map(winner => {
                      const isSelected = selectedWinnerIds.includes(winner.order_item_id);
                      const isPaid = winner.status === 'Paid';
                      return (
                        <tr key={winner.order_item_id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#f0f9ff' : 'white', opacity: isPaid ? 0.6 : 1 }}>
                          <td style={{ padding: '12px' }}>
                            {!isPaid && (
                              <button onClick={() => toggleWinnerSelection(winner.order_item_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSelected ? '#0ea5e9' : '#cbd5e1' }}>
                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{winner.username}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{winner.lottery_type}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#fce7f3', color: '#be185d', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{winner.selected_number}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                            {formatCurrency(winner.prize_amount)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>{winner.currency}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {isPaid ? (
                              <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>โอนแล้ว</span>
                            ) : (
                              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>รอโอน</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer / Actions */}
            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ color: '#475569', fontWeight: 'bold' }}>
                เลือกโอน: <span style={{ color: '#0ea5e9', fontSize: '18px' }}>{selectedWinnerIds.length}</span> / {winnersList.filter(w => w.status !== 'Paid').length} รายการ
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowWinnersModal(false)} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                  ปิดหน้าต่าง
                </button>
                <button
                  onClick={() => handleProcessPayout(selectedWinnerIds)}
                  disabled={
                    selectedWinnerIds.length === 0 || 
                    isProcessing || 
                    viewingWinnersRound?.is_paid
                  }
                  style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isProcessing ? <RefreshCw className="spin" size={18} /> : <CheckCircle size={18} />}
                  ยืนยันโอนเงินทันที ({selectedWinnerIds.length} รายการ)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageThaiNumber;