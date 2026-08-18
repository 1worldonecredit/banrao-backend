import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const SetTimeMission = () => {
  const [timeoutMinutes, setTimeoutMinutes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTimeSetting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/p2p-time-setting`);
        const data = await res.json();
        if (data.success) {
            setTimeoutMinutes(data.timeout); 
        }
      } catch (err) {
        console.error("Fetch Time Setting Error:", err);
      }
    };
    fetchTimeSetting();
  }, []);

  const handleSave = async () => {
    if (!timeoutMinutes || isNaN(timeoutMinutes) || timeoutMinutes < 1) {
        return alert('กรุณาระบุเวลาเป็นนาทีให้ถูกต้อง (เช่น 30)');
    }
    
    if (window.confirm(`ยืนยันการตั้งเวลาภารกิจ P2P เป็น ${timeoutMinutes} นาที หรือไม่?\n\n(งานที่ถูกสร้างหลังจากนี้ จะมีเวลาให้คนรับงานตามที่คุณตั้งไว้)`)) {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/p2p-time-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeout_minutes: parseInt(timeoutMinutes) })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
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

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>ตั้งเวลา ภารกิจ P2P</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '18px' }}>ตั้งเวลาหมดอายุคำขอ P2P</h4>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          ระบุเวลา (นาที) ที่จะให้แสดงคำขอบนหน้าบอร์ด หากไม่มีคนกดรับงานในเวลาที่กำหนด คำขอนี้จะหมดอายุและถูกซ่อนอัตโนมัติ
        </p>
        
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>
                เวลาภารกิจ (นาที)
            </label>
            <div style={{ position: 'relative', width: '200px' }}>
                <input 
                    type="number" 
                    min="1"
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
                />
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold' }}>
                    นาที
                </span>
            </div>
        </div>

        <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '12px 25px', backgroundColor: isSaving ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', transition: '0.2s' }}
        >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกเวลาภารกิจ'}
        </button>
      </div>
    </div>
  );
};

export default SetTimeMission;