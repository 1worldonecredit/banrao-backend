import React, { useState, useEffect } from 'react';
import { Save, Calendar, Type, AlignLeft, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const JobRecruitmentPost = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adData, setAdData] = useState({
    is_active: false,
    ad_title: '',
    ad_description: '',
    start_time: '', // 🌟 เพิ่ม start_time
    end_time: ''
  });

  useEffect(() => {
    fetchJobAdData();
  }, []);

  const fetchJobAdData = async () => {
    try {
      // 🌟 ใช้ API สำหรับ Admin เพื่อดึงข้อมูลมาแสดงทั้งหมด
      const res = await fetch(`${API_URL}/api/hrm/job-ad/admin`);
      const data = await res.json();
      if (data.success && data.ad) {
        setAdData({
          is_active: data.ad.is_active === 1 || data.ad.is_active === true,
          ad_title: data.ad.ad_title || '',
          ad_description: data.ad.ad_description || '',
          // 🌟 แปลงวันที่จาก DB ให้เข้ากับ input
          start_time: data.ad.start_time ? new Date(data.ad.start_time).toISOString().slice(0, 16) : '',
          end_time: data.ad.end_time ? new Date(data.ad.end_time).toISOString().slice(0, 16) : ''
        });
      }
    } catch (err) {
      console.error("Fetch Job Ad Error:", err);
      alert('ไม่สามารถดึงข้อมูลประกาศรับสมัครงานได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้องของเวลาเบื้องต้น
    if (adData.start_time && adData.end_time && new Date(adData.start_time) >= new Date(adData.end_time)) {
        return alert('⚠️ วันที่สิ้นสุด ต้องอยู่หลังวันที่เริ่มต้นเสมอครับ');
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hrm/job-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: adData.is_active ? 1 : 0,
          ad_title: adData.ad_title,
          ad_description: adData.ad_description,
          start_time: adData.start_time || null, // 🌟 ส่ง start_time ไปด้วย
          end_time: adData.end_time || null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกประกาศรับสมัครงานสำเร็จ!');
      } else {
        alert('❌ เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err) {
      console.error("Save Job Ad Error:", err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>ระบบจัดการประกาศรับสมัครงาน</h2>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
        
        <form onSubmit={handleSave}>
          
          {/* สวิตช์เปิด/ปิดประกาศ (เผื่อฉุกเฉิน) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '25px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '18px' }}>เปิดใช้งานระบบ</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>อนุญาตให้ระบบทำงาน (ระบบจะตรวจสอบเวลาโพสต์อัตโนมัติอีกชั้น)</p>
            </div>
            <div 
              onClick={() => setAdData({...adData, is_active: !adData.is_active})}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontWeight: 'bold', color: adData.is_active ? '#16a34a' : '#94a3b8' }}>
                {adData.is_active ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
              </span>
              {adData.is_active ? <ToggleRight size={40} color="#16a34a" /> : <ToggleLeft size={40} color="#94a3b8" />}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* หัวข้อ */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                <Type size={18} /> หัวข้อประกาศ (Title)
              </label>
              <input 
                type="text" 
                required
                placeholder="เช่น: เปิดรับสมัครเพื่อนร่วมทีมด่วน!"
                value={adData.ad_title}
                onChange={(e) => setAdData({...adData, ad_title: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            {/* รายละเอียด */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                <AlignLeft size={18} /> รายละเอียดงาน (Description)
              </label>
              <textarea 
                required
                rows={5}
                placeholder="เช่น: SALAPI กำลังขยายทีม! สมัครวันนี้เพื่อร่วมงานกับเรา..."
                value={adData.ad_description}
                onChange={(e) => setAdData({...adData, ad_description: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* ส่วนตั้งเวลา (จัดเรียงคู่กันให้ดูง่าย) */}
            <div style={{ display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>
                  <Clock size={18} /> เวลาเริ่มแสดง (Start Time)
                </label>
                <input 
                  type="datetime-local" 
                  value={adData.start_time}
                  onChange={(e) => setAdData({...adData, start_time: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  <Calendar size={18} /> เวลาสิ้นสุด (End Time)
                </label>
                <input 
                  type="datetime-local" 
                  value={adData.end_time}
                  onChange={(e) => setAdData({...adData, end_time: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <p style={{ margin: '-10px 0 0 0', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                *หากเว้นว่างไว้ ระบบจะแสดงประกาศทันที และแสดงไปตลอดจนกว่าคุณจะปิดใช้งาน
            </p>

          </div>

          <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'right' }}>
            <button 
              type="submit" 
              disabled={isSaving}
              style={{ padding: '12px 30px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งเวลา'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default JobRecruitmentPost;