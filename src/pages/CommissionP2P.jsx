import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CommissionP2P = () => {
  const [rewardPercent, setRewardPercent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ดึงข้อมูลใช้ API ของเดิมที่เจ้านายมีอยู่แล้ว (ปลอดภัย)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/p2p-settings`);
        const data = await res.json();
        if (data.success && data.settings) {
            setRewardPercent(data.settings.provider_reward_percent || 1); 
        }
      } catch (err) {
        console.error("Fetch Settings Error:", err);
      }
    };
    fetchSettings();
  }, []);

  // ตอนบันทึก ให้ยิงไปหา API ตัวใหม่ที่เพิ่งสร้างเมื่อกี้
  const handleSave = async () => {
    if (!rewardPercent || isNaN(rewardPercent)) return alert('กรุณาระบุตัวเลขให้ถูกต้องครับ');
    if (window.confirm(`ยืนยันการเปลี่ยน Commission P2P เป็น ${rewardPercent}% หรือไม่?\n\n(การเปลี่ยนแปลงนี้จะมีผลเฉพาะ "คำขอใหม่" เท่านั้น คำขอเดิมจะไม่ได้รับผลกระทบ)`)) {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/p2p-commission-update`, { // 🌟 วิ่งไป API ใหม่
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reward_percent: parseFloat(rewardPercent) })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${data.message}`);
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
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>ตั้งค่าระบบ P2P</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '18px' }}>ตั้งค่า Commission P2P (ผู้รับงาน)</h4>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          ระบุเปอร์เซ็นต์ค่าตอบแทนที่ผู้รับงานจะได้จากการรับฝากเงิน (โอนเงินให้ลูกค้า) 
          <br/><span style={{ color: '#ef4444' }}>* การแก้ไขจะไม่มีผลกับคำขอที่ถูกสร้างไปแล้วในอดีต</span>
        </p>
        
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>
                ค่าตอบแทนผู้รับงาน (%)
            </label>
            <div style={{ position: 'relative', width: '200px' }}>
                <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={rewardPercent}
                    onChange={(e) => setRewardPercent(e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }}
                />
                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold' }}>
                    %
                </span>
            </div>
        </div>

        <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '12px 25px', backgroundColor: isSaving ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', transition: '0.2s' }}
        >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
};

export default CommissionP2P;