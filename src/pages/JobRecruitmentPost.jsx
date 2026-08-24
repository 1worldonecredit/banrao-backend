import React, { useState, useEffect } from 'react';
import { Save, Calendar, Type, AlignLeft, ToggleLeft, ToggleRight, Clock, Megaphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const DatePickerTH = ({ label, dateValue, onChange, colorTheme }) => {
  const d = dateValue ? new Date(dateValue) : new Date();
  const [day, setDay] = useState(d.getDate().toString().padStart(2, '0'));
  const [month, setMonth] = useState(d.getMonth());
  const [year, setYear] = useState(d.getFullYear() + 543);
  const [hour, setHour] = useState(d.getHours().toString().padStart(2, '0'));
  const [minute, setMinute] = useState(d.getMinutes().toString().padStart(2, '0'));

  useEffect(() => {
    const newDate = new Date(year - 543, month, parseInt(day), parseInt(hour), parseInt(minute));
    onChange(newDate);
  }, [day, month, year, hour, minute]);

  const generateOptions = (start, end, pad = true) => {
    const opts = [];
    for (let i = start; i <= end; i++) {
      opts.push(<option key={i} value={pad ? i.toString().padStart(2, '0') : i}>{pad ? i.toString().padStart(2, '0') : i}</option>);
    }
    return opts;
  };

  return (
    <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: `1px solid ${colorTheme}`, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      <div style={{ color: colorTheme, fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '10px' }}>
        <select value={day} onChange={(e) => setDay(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}>
          {generateOptions(1, 31)}
        </select>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}>
          {generateOptions(new Date().getFullYear() + 543, new Date().getFullYear() + 545, false)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>เวลา</span>
        <select value={hour} onChange={(e) => setHour(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}>
          {generateOptions(0, 23)}
        </select>
        <span>:</span>
        <select value={minute} onChange={(e) => setMinute(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}>
          {generateOptions(0, 59)}
        </select>
        <span style={{ fontSize: '14px', color: '#64748b' }}>น.</span>
      </div>
    </div>
  );
};

const JobRecruitmentPost = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  const [adData, setAdData] = useState({
    is_active: false,
    ad_title: '',
    ad_description: '',
    start_time: new Date(), 
    end_time: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) 
  });

  useEffect(() => {
    fetchJobAdData();
  }, []);

  useEffect(() => {
    if (!adData.is_active || !adData.end_time) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(adData.end_time).getTime();
      const start = new Date(adData.start_time).getTime();

      if (now < start) {
        setCountdown('⏳ กำลังรอเปิดรับสมัคร...');
      } else if (now > end) {
        setCountdown('🛑 หมดเวลารับสมัครแล้ว');
        clearInterval(timer);
      } else {
        const distance = end - now;
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`เหลือเวลา: ${d} วัน ${h} ชม. ${m} น. ${s} วิ.`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [adData.is_active, adData.end_time, adData.start_time]);

  const fetchJobAdData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hrm/job-ad/admin`);
      const data = await res.json();
      if (data.success && data.ad) {
        setAdData({
          is_active: data.ad.is_active === 1 || data.ad.is_active === true,
          ad_title: data.ad.ad_title || '',
          ad_description: data.ad.ad_description || '',
          start_time: data.ad.start_time ? new Date(data.ad.start_time) : new Date(),
          end_time: data.ad.end_time ? new Date(data.ad.end_time) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (adData.start_time >= adData.end_time) {
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
          start_time: adData.start_time.toISOString(), 
          end_time: adData.end_time.toISOString()
        })
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกประกาศรับสมัครงานสำเร็จ!');
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}>
      
      {/* 🌟 ปรับ Header ให้ล้อไปกับหน้า Master Data */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone size={28} color="#0ea5e9" /> ระบบจัดการประกาศรับสมัครงาน
        </h2>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '900px' }}>
        <form onSubmit={handleSave}>
          
          {/* 🌟 บล็อก 1: สวิตช์เปิด-ปิดการใช้งาน (ธีมสีเขียว-เทา) */}
          <div style={{ 
              backgroundColor: adData.is_active ? '#f0fdf4' : '#f8fafc', 
              border: `1px solid ${adData.is_active ? '#bbf7d0' : '#e2e8f0'}`, 
              padding: '20px', borderRadius: '12px', marginBottom: '25px', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.3s'
          }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: adData.is_active ? '#166534' : '#475569', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                เปิดใช้งานระบบประกาศ
              </h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>อนุญาตให้ระบบเริ่มตรวจสอบเวลาแสดงผลอัตโนมัติที่หน้าเว็บลูกค้า</p>
            </div>
            <div onClick={() => setAdData({...adData, is_active: !adData.is_active})} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', backgroundColor: 'white', borderRadius: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <span style={{ fontWeight: 'bold', color: adData.is_active ? '#16a34a' : '#94a3b8', fontSize: '14px' }}>
                {adData.is_active ? 'กำลังเปิดใช้งาน' : 'ปิดการใช้งาน'}
              </span>
              {adData.is_active ? <ToggleRight size={35} color="#16a34a" /> : <ToggleLeft size={35} color="#cbd5e1" />}
            </div>
          </div>

          {/* 🌟 บล็อก 2: กรอกข้อมูล หัวข้อ & รายละเอียด (ธีมสีฟ้าอ่อน) */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ margin: 0, color: '#0369a1', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={18} /> ข้อมูลประกาศรับสมัคร
            </h4>
            <div>
              <label style={{ display: 'block', color: '#0c4a6e', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>หัวข้อประกาศ</label>
              <input type="text" required value={adData.ad_title} onChange={(e) => setAdData({...adData, ad_title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="เช่น: เปิดรับสมัครเพื่อนร่วมทีมด่วน!" />
            </div>

            <div>
              <label style={{ display: 'block', color: '#0c4a6e', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>รายละเอียดงาน</label>
              <textarea required rows={4} value={adData.ad_description} onChange={(e) => setAdData({...adData, ad_description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} placeholder="เขียนอธิบายสั้นๆ ดึงดูดผู้สมัคร..." />
            </div>
          </div>

          {/* 🌟 บล็อก 3: ตั้งเวลา (ธีมสีเทาพาสเทล) */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> กำหนดระยะเวลาแสดงผล
            </h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <DatePickerTH 
                label="เวลา เปิดรับสมัคร" 
                colorTheme="#16a34a" 
                dateValue={adData.start_time} 
                onChange={(d) => setAdData({...adData, start_time: d})} 
              />
              <DatePickerTH 
                label="เวลา ปิดรับสมัคร" 
                colorTheme="#ef4444" 
                dateValue={adData.end_time} 
                onChange={(d) => setAdData({...adData, end_time: d})} 
              />
            </div>

            {/* เวลานับถอยหลัง */}
            <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: '#fff7ed', border: '1px dashed #fdba74', borderRadius: '8px', color: '#ea580c', fontWeight: 'bold', fontSize: '16px' }}>
                <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                {adData.is_active ? countdown : 'ระบบปิดการใช้งานอยู่'}
            </div>
          </div>

          {/* 🌟 ปุ่มบันทึก */}
          <div style={{ textAlign: 'right' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 30px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(14, 165, 233, 0.2)' }}>
              <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกประกาศรับสมัคร'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default JobRecruitmentPost;