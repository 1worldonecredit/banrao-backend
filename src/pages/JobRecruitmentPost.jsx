import React, { useState, useEffect } from 'react';
import { Save, Calendar, Type, AlignLeft, ToggleLeft, ToggleRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const JobRecruitmentPost = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [adData, setAdData] = useState({
    is_active: false,
    ad_title: '',
    ad_description: '',
    end_time: ''
  });

  // 1. ดึงข้อมูลตั้งต้นเมื่อเปิดหน้า
  useEffect(() => {
    fetchJobAdData();
  }, []);

  const fetchJobAdData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hrm/job-ad`);
      const data = await res.json();
      if (data.success && data.ad) {
        setAdData({
          is_active: data.ad.is_active === 1 || data.ad.is_active === true,
          ad_title: data.ad.ad_title || '',
          ad_description: data.ad.ad_description || '',
          // แปลงวันที่จาก DB ให้เข้ากับ input type="datetime-local" (YYYY-MM-DDThh:mm)
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

  // 2. ฟังก์ชันกดบันทึก
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hrm/job-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: adData.is_active ? 1 : 0,
          ad_title: adData.ad_title,
          ad_description: adData.ad_description,
          end_time: adData.end_time || null // ถ้าไม่เลือกวันที่ให้ส่ง null
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
          
          {/* ส่วนสวิตช์ เปิด/ปิด ประกาศ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '25px' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '18px' }}>สถานะประกาศรับสมัคร</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>เปิดเพื่อแสดงแบบฟอร์มรับสมัครงานที่หน้าเว็บลูกค้า</p>
            </div>
            <div 
              onClick={() => setAdData({...adData, is_active: !adData.is_active})}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontWeight: 'bold', color: adData.is_active ? '#16a34a' : '#94a3b8' }}>
                {adData.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
              </span>
              {adData.is_active ? <ToggleRight size={40} color="#16a34a" /> : <ToggleLeft size={40} color="#94a3b8" />}
            </div>
          </div>

          {/* ฟอร์มกรอกข้อมูล */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* หัวข้อประกาศ */}
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

            {/* วันหมดอายุ */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                <Calendar size={18} /> สิ้นสุดการแสดงประกาศ (End Time)
              </label>
              <input 
                type="datetime-local" 
                value={adData.end_time}
                onChange={(e) => setAdData({...adData, end_time: e.target.value})}
                style={{ width: '100%', maxWidth: '300px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>*หากไม่กำหนดเวลาหมดอายุ ให้เว้นว่างไว้ (ระบบจะแสดงจนกว่าคุณจะกดปิด)</p>
            </div>

          </div>

          <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'right' }}>
            <button 
              type="submit" 
              disabled={isSaving}
              style={{ padding: '12px 30px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default JobRecruitmentPost;