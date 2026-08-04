import React, { useState, useEffect } from 'react';
import { Settings, Save, ShoppingBag, Trophy, Users, Percent } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CommissionSetting = () => {
  const [settings, setSettings] = useState({
    purchase_percent: 0,
    win_percent: 0,
    daily_bonus_percent: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ดึงค่า % จาก Database เมื่อเปิดหน้านี้
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/commission-settings`);
        const data = await res.json();
        if (data.success) {
          setSettings({
            purchase_percent: data.data.purchase_percent,
            win_percent: data.data.win_percent,
            daily_bonus_percent: data.data.daily_bonus_percent
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/commission-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกอัตรา Commission ใหม่สำเร็จแล้ว!');
      } else {
        alert(`❌ เกิดข้อผิดพลาด: ${data.message}`);
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert('⚠️ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={28} color="#0ea5e9" /> ระบบตั้งค่า Commission
      </h2>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '650px' }}>
        <h4 style={{ margin: '0 0 25px 0', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
          ปรับอัตราส่วนแบ่งรายได้ (เปอร์เซ็นต์ %)
        </h4>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูลการตั้งค่า...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* 1. ค่าคอมมิชชั่นซื้อหวย */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>
                <ShoppingBag size={18} /> ส่วนแบ่งจากการซื้อหวย (ลูกทีม)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="purchase_percent"
                  value={settings.purchase_percent} 
                  onChange={handleChange}
                  step="0.01"
                  style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
                />
                <Percent size={18} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>ตั้งค่าปัจจุบันคือ {settings.purchase_percent}% จากยอดแทงของลูกทีม</p>
            </div>

            {/* 2. ค่าคอมมิชชั่นถูกรางวัล */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#ca8a04', marginBottom: '8px' }}>
                <Trophy size={18} /> ส่วนแบ่งเมื่อลูกทีมถูกรางวัล
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="win_percent"
                  value={settings.win_percent} 
                  onChange={handleChange}
                  step="0.01"
                  style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
                />
                <Percent size={18} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>ตั้งค่าปัจจุบันคือ {settings.win_percent}% จากยอดเงินรางวัลที่ลูกทีมได้รับ</p>
            </div>

            {/* 3. โบนัสทีม 1% */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                <Users size={18} /> โบนัสจากค่าคอมรวมของลูกทีม (ส่วนที่ 3)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="daily_bonus_percent"
                  value={settings.daily_bonus_percent} 
                  onChange={handleChange}
                  step="0.01"
                  style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' }}
                />
                <Percent size={18} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>ตั้งค่าปัจจุบันคือ {settings.daily_bonus_percent}% จากยอดค่าคอมมิชชั่นสะสมที่ลูกทีมทำได้</p>
            </div>

            <hr style={{ border: '1px solid #f1f5f9', margin: '15px 0' }} />

            <button 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ 
                backgroundColor: '#0ea5e9', color: 'white', padding: '14px', borderRadius: '8px', 
                border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: isSaving ? 0.7 : 1, transition: '0.2s'
              }}
            >
              <Save size={20} /> {isSaving ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกการตั้งค่า Commission'}
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionSetting;