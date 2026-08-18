import React, { useState, useEffect } from 'react';
import { Clock, Timer, CheckCircle, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const SetTimeMission = () => {
  const [boardMinutes, setBoardMinutes] = useState('');
  const [providerMinutes, setProviderMinutes] = useState('');
  
  // สถานะปัจจุบันเพื่อแสดงในหน้าปัดนาฬิกา
  const [currentBoard, setCurrentBoard] = useState(30);
  const [currentProvider, setCurrentProvider] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTimeSetting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/p2p-time-setting`);
        const data = await res.json();
        if (data.success) {
            setBoardMinutes(data.board_timeout);
            setProviderMinutes(data.provider_timeout);
            setCurrentBoard(data.board_timeout);
            setCurrentProvider(data.provider_timeout);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    fetchTimeSetting();
  }, []);

  const handleSave = async () => {
    if (!boardMinutes || !providerMinutes || boardMinutes < 1 || providerMinutes < 1) {
        return alert('กรุณาระบุเวลาให้ถูกต้องทั้ง 2 ช่องครับ');
    }
    
    if (window.confirm('ยืนยันการอัปเดตระบบเวลา P2P หรือไม่?')) {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/p2p-time-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    board_timeout: parseInt(boardMinutes),
                    provider_timeout: parseInt(providerMinutes)
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
                setCurrentBoard(boardMinutes);
                setCurrentProvider(providerMinutes);
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            setIsSaving(false);
        }
    }
  };

  // ฟังก์ชันวาดหน้าปัดนาฬิกาสวยๆ
  const renderDigitalClock = (minutes, color) => {
    const hrs = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '15px 0' }}>
            <div style={{ background: color, color: 'white', padding: '10px 15px', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>{hrs}</div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: color, alignSelf: 'center' }}>:</span>
            <div style={{ background: color, color: 'white', padding: '10px 15px', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>{mins}</div>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: color, alignSelf: 'center' }}>:</span>
            <div style={{ background: color, color: 'white', padding: '10px 15px', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', opacity: 0.7 }}>00</div>
        </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Timer size={28} color="#2563eb" /> จัดการระบบเวลา P2P
      </h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* ---------------- กล่องที่ 1: เวลาบนบอร์ด ---------------- */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flex: '1', minWidth: '300px', borderTop: '5px solid #3b82f6' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1e40af', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Clock size={20} /> เวลาบนหน้าบอร์ด (รอกดรับ)
          </h4>
          <p style={{ color: '#64748b', fontSize: '13px' }}>ถ้าไม่มีคนกดรับงานภายในเวลานี้ คำขอจะหมดอายุ</p>
          
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', margin: '20px 0' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ค่าที่ใช้อยู่ในปัจจุบัน</span>
            {renderDigitalClock(currentBoard, '#3b82f6')}
          </div>

          <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>ตั้งเวลาใหม่ (นาที)</label>
          <input 
              type="number" min="1" value={boardMinutes} onChange={(e) => setBoardMinutes(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none' }}
          />
        </div>

        {/* ---------------- กล่องที่ 2: เวลาฝั่งคนรับงาน ---------------- */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flex: '1', minWidth: '300px', borderTop: '5px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#b45309', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <CheckCircle size={20} /> เวลาผู้รับงาน (ต้องโอนเงิน)
          </h4>
          <p style={{ color: '#64748b', fontSize: '13px' }}>เมื่อกดรับงานแล้ว ผู้รับงานต้องโอนเงินภายในเวลานี้</p>
          
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fffbeb', borderRadius: '12px', margin: '20px 0' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px' }}>ค่าที่ใช้อยู่ในปัจจุบัน</span>
            {renderDigitalClock(currentProvider, '#f59e0b')}
          </div>

          <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>ตั้งเวลาใหม่ (นาที)</label>
          <input 
              type="number" min="1" value={providerMinutes} onChange={(e) => setProviderMinutes(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '16px', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '25px', textAlign: 'center' }}>
        <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '15px 40px', backgroundColor: isSaving ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)' }}
        >
            <Save size={20} /> {isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าเวลาทั้งหมด'}
        </button>
      </div>

    </div>
  );
};

export default SetTimeMission;