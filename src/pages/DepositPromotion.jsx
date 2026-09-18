import React, { useState, useEffect } from 'react';
import { Save, Edit, Percent, Clock, CalendarRange, Trash2, PlusCircle, RefreshCw, Zap, Image as ImageIcon, Video, Megaphone, Settings } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

// ==========================================
// 🗓️ ระบบตั้งคริสต์ศักราช / พุทธศักราช / เดือนไทย
// ==========================================
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const parseDateObj = (dateStr) => {
  if (!dateStr) return { day: '1', month: '1', year: new Date().getFullYear().toString(), hour: '00', minute: '00' };
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString(),
    month: (d.getMonth() + 1).toString(),
    year: d.getFullYear().toString(),
    hour: d.getHours().toString().padStart(2, '0'),
    minute: d.getMinutes().toString().padStart(2, '0')
  };
};

const formatToISO = ({ day, month, year, hour, minute }) => {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00`;
};

const ThaiDateTimePicker = ({ label, value, onChange }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleChange = (field, val) => {
    const newValue = { ...value, [field]: val };
    onChange(newValue);
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', textAlign: 'center' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '5px' }}>
        <select value={value.day} onChange={(e) => handleChange('day', e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={value.month} onChange={(e) => handleChange('month', e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>
          {THAI_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={value.year} onChange={(e) => handleChange('year', e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>
          {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#475569' }}>เวลา</span>
        <select value={value.hour} onChange={(e) => handleChange('hour', e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span>:</span>
        <select value={value.minute} onChange={(e) => handleChange('minute', e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}>
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: '#475569' }}>น.</span>
      </div>
    </div>
  );
};

const DepositPromotion = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [editModeId, setEditModeId] = useState(null);

  const [formData, setFormData] = useState({
    deposit_bonus_percent: 0,
    withdraw_fee_percent: 0,
    provider_reward_percent: 0,
    referrer_reward_percent: 0,
    request_timeout_minutes: 15
  });

  const [promotions, setPromotions] = useState([]);
  
  const [newPromo, setNewPromo] = useState({ 
    title: '', 
    bonus_percent: '', 
    start: parseDateObj(new Date()), 
    end: parseDateObj(new Date(new Date().getTime() + 86400000)) 
  });

  const [ads, setAds] = useState([]);
  // 🌟 เพิ่ม thumbnail_url ใน State
  const [newAd, setNewAd] = useState({ title: '', description: '', media_type: 'image', media_url: '', thumbnail_url: '' });
  
  const [videoList, setVideoList] = useState([]);

  useEffect(() => {
    fetchAllData();
    fetchVideos(); 
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/video-promotions`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setVideoList(data.ads);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const resSettings = await fetch(`${API_URL}/api/admin/p2p-settings`);
      const dataSettings = await resSettings.json();
      if (dataSettings.success && dataSettings.settings) {
        setFormData({
          deposit_bonus_percent: dataSettings.settings.deposit_bonus_percent,
          withdraw_fee_percent: dataSettings.settings.withdraw_fee_percent,
          provider_reward_percent: dataSettings.settings.provider_reward_percent,
          referrer_reward_percent: dataSettings.settings.referrer_reward_percent,
          request_timeout_minutes: dataSettings.settings.request_timeout_minutes
        });
      }

      const resPromos = await fetch(`${API_URL}/api/admin/promotions`);
      const dataPromos = await resPromos.json();
      if (dataPromos.success) setPromotions(dataPromos.promotions);

    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setIsLoading(false); }
  };

  const handleEditClick = (ad) => {
    setEditModeId(ad.ad_id); 
    setNewAd({
      title: ad.title || '',
      description: ad.description || '',
      media_url: ad.media_url, 
      media_type: ad.media_type,
      thumbnail_url: ad.thumbnail_url || '' // 🌟 ดึงปกเดิมมาด้วย
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEditAd = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ads/${editModeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // 🌟 ส่ง thumbnail_url ไปอัปเดตด้วย
        body: JSON.stringify({ title: newAd.title, description: newAd.description, thumbnail_url: newAd.thumbnail_url }) 
      });
      const data = await res.json();
      
      if (data.success) {
        alert('อัปเดตข้อมูลโฆษณาสำเร็จ');
        setEditModeId(null); 
        setNewAd({ title: '', description: '', media_url: '', media_type: 'image', thumbnail_url: '' }); 
        fetchVideos(); 
      } else {
        alert(`ผิดพลาด: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!window.confirm('ยืนยันการบันทึกการตั้งค่าระบบ P2P ใช่หรือไม่?')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/p2p-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) alert('✅ บันทึกการตั้งค่าหลักสำเร็จ');
      else alert(`❌ ผิดพลาด: ${data.message}`);
    } catch (err) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อ'); } 
    finally { setIsSaving(false); fetchAllData(); }
  };

  const handleAddPromo = async (e) => {
    e.preventDefault();
    const startIso = formatToISO(newPromo.start);
    const endIso = formatToISO(newPromo.end);

    if (new Date(startIso) >= new Date(endIso)) return alert('❌ เวลาสิ้นสุด ต้องอยู่หลังเวลาเปิดรับโปรโมชั่นครับ!');
    if (!newPromo.title || !newPromo.bonus_percent) return alert('❌ กรุณากรอกชื่อโปรและโบนัสให้ครบครับ');

    try {
      const res = await fetch(`${API_URL}/api/admin/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPromo.title,
          bonus_percent: newPromo.bonus_percent,
          start_time: startIso,
          end_time: endIso
        })
      });
      if ((await res.json()).success) {
        alert('✅ เพิ่มคิวโปรโมชั่นสำเร็จ');
        setNewPromo({ title: '', bonus_percent: '', start: parseDateObj(new Date()), end: parseDateObj(new Date(new Date().getTime() + 86400000)) });
        fetchAllData();
      }
    } catch (err) { alert('Error!'); }
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    if (!newAd.media_url || !newAd.title) {
        return alert('กรุณากรอกหัวข้อและเลือกไฟล์วิดีโอก่อนครับเจ้านาย!');
    }

    setIsSaving(true); 

    try {
      const fileInput = document.getElementById('ad-file-upload');
      const file = fileInput.files[0];
      
      if(!file){
           setIsSaving(false);
           return alert('หาไฟล์วิดีโอไม่เจอครับ ลองเลือกไฟล์ใหม่อีกครั้ง');
      }

      console.log("ขอ URL อัปโหลด...");
      const urlRes = await fetch(`${API_URL}/api/get-upload-url`, { method: 'POST' });
      const urlData = await urlRes.json();
      
      if (!urlData.success) throw new Error('ขอ URL อัปโหลดไม่สำเร็จ: ' + urlData.message);

      console.log("กำลังอัปโหลดขึ้น Cloudflare...");
      const formData = new FormData();
      formData.append('file', file);

      const cfRes = await fetch(urlData.uploadUrl, { method: 'POST', body: formData });
      
      if (!cfRes.ok) {
          throw new Error('Cloudflare ปฏิเสธไฟล์ Status: ' + cfRes.status);
      }

      const cfVideoId = urlData.uid;
      console.log("อัปโหลดสำเร็จ! Video ID:", cfVideoId);

      console.log("บันทึกข้อมูลลงฐานข้อมูล...");
      const saveRes = await fetch(`${API_URL}/api/video-promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: newAd.title,
            description: newAd.description,
            cf_video_id: cfVideoId,
            thumbnail_url: newAd.thumbnail_url // 🌟 ส่งรูปปกที่แปลงเป็น Base64 ไปด้วย
        })
      });
      
      const saveData = await saveRes.json();

      if (saveData.success) {
        alert('✅ เยี่ยม! อัปโหลดและบันทึกโฆษณาสำเร็จ 100%!');
        setNewAd({ title: '', description: '', media_type: 'video', media_url: '', thumbnail_url: '' }); 
        fileInput.value = ''; 
        document.getElementById('ad-thumbnail-upload').value = ''; // ล้างช่องอัปปก
        fetchVideos(); 
      } else {
        throw new Error('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + saveData.message);
      }

    } catch (err) { 
        console.error(err);
        alert('🚨 เกิดข้อผิดพลาด: ' + err.message); 
    } finally {
        setIsSaving(false);
    }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm(`ยืนยันการลบ${type === 'promo' ? 'โปรโมชั่น' : 'โฆษณา'}นี้ ทิ้งถาวรใช่หรือไม่?`)) return;
    try {
      await fetch(`${API_URL}/api/admin/${type === 'promo' ? 'promotions' : 'ads'}/${id}`, { method: 'DELETE' });
      fetchAllData();
      if (type === 'ad') fetchVideos(); 
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (start, end) => {
    const s = new Date(start), e = new Date(end);
    if (currentTime < s) return <span style={{ padding: '4px 10px', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #fde68a' }}>ล่วงหน้า</span>;
    if (currentTime >= s && currentTime <= e) return <span style={{ padding: '4px 10px', backgroundColor: '#10b981', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>กำลังแจกโบนัส</span>;
    return <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>หมดเวลา</span>;
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><RefreshCw size={40} className="spin" color="#0ea5e9" /></div>;

  return (
    <div style={{ padding: '20px',  minHeight: '100vh', fontFamily: "'Prompt', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="#0ea5e9" /> ศูนย์จัดการ P2P & โปรโมชั่น
        </h2>
        <button onClick={() => { fetchAllData(); fetchVideos(); }} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <RefreshCw size={18} /> รีเฟรชข้อมูล
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* ========================================== */}
        {/* 📦 กล่อง 1: ตั้งค่าส่วนแบ่ง P2P หลัก */}
        {/* ========================================== */}
        <form onSubmit={handleSaveSettings} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <Percent size={22} color="#f59e0b" /> ตั้งค่าส่วนแบ่ง P2P (Global)
          </h4>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#dc2626' }}>หักค่าธรรมเนียม ถอนเงิน (%)</label>
            <input type="number" step="0.01" value={formData.withdraw_fee_percent} onChange={e => setFormData({...formData, withdraw_fee_percent: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0284c7' }}>ค่าคอมมิชชัน ผู้รับงาน P2P (%)</label>
            <input type="number" step="0.01" value={formData.provider_reward_percent} onChange={e => setFormData({...formData, provider_reward_percent: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#8b5cf6' }}>ค่าคอมมิชชัน ผู้แนะนำ (Affiliate) (%)</label>
            <input type="number" step="0.01" value={formData.referrer_reward_percent} onChange={e => setFormData({...formData, referrer_reward_percent: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd6fe', boxSizing: 'border-box' }} />
          </div>

          <h4 style={{ margin: '0 0 15px 0', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Clock size={20} color="#475569" /> หมดอายุคำขอ P2P (นาที)
          </h4>
          <input type="number" value={formData.request_timeout_minutes} onChange={e => setFormData({...formData, request_timeout_minutes: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '20px' }} />

          <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '15px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
            {isSaving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />} บันทึกตั้งค่า P2P
          </button>
        </form>

        {/* ========================================== */}
        {/* 📦 กล่อง 2: จัดการคิวโปรโมชั่น (แบบหวยไทย) */}
        {/* ========================================== */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #10b981', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <CalendarRange size={22} color="#10b981" /> คิวโปรโมชั่น (แจกโบนัสฝาก)
          </h4>
          
          <form onSubmit={handleAddPromo} style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #6ee7b7' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                 <label style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>ชื่อโปรโมชั่น</label>
                 <input type="text" required placeholder="โปรวันแม่" value={newPromo.title} onChange={e => setNewPromo({...newPromo, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', boxSizing: 'border-box', marginTop: '5px' }} />
              </div>
              <div>
                 <label style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>โบนัส (%)</label>
                 <input type="number" step="0.01" required placeholder="เช่น 2.5" value={newPromo.bonus_percent} onChange={e => setNewPromo({...newPromo, bonus_percent: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0', boxSizing: 'border-box', marginTop: '5px' }} />
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '20px' }}>
               <ThaiDateTimePicker label="เวลา เริ่มโปรโมชั่น" value={newPromo.start} onChange={(val) => setNewPromo({...newPromo, start: val})} />
               <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '15px 0' }}></div>
               <ThaiDateTimePicker label="เวลา สิ้นสุดโปรโมชั่น" value={newPromo.end} onChange={(val) => setNewPromo({...newPromo, end: val})} />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>+ บันทึกเปิดโปรโมชั่น</button>
          </form>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>โปรโมชั่น</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}></th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(p => (
                  <tr key={p.promo_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px' }}>
                      <strong style={{ color: '#0f172a' }}>{p.title} (+{p.bonus_percent}%)</strong>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        {new Date(p.start_time).toLocaleDateString('th-TH')} - {new Date(p.end_time).toLocaleDateString('th-TH')}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>{getStatusBadge(p.start_time, p.end_time)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => deleteItem('promo', p.promo_id)} />
                    </td>
                  </tr>
                ))}
                {promotions.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>ยังไม่มีคิวโปรโมชั่น</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>


     {/* ============================================== */}
      {/* 🌟 โซนป้ายโฆษณา (ADS/VIDEO) แบบอัปโหลดตรงลง DB */}
      {/* ============================================== */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #8b5cf6' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Megaphone size={22} color="#8b5cf6" /> คลังป้ายโฆษณา (อัปโหลดวิดีโอ/รูปภาพ 9:16)
        </h4>

       {/* 🌟 ฟอร์มหลัก (อัจฉริยะ: เป็นทั้งปุ่ม "เพิ่ม" และ "แก้ไข") */}
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            editModeId ? handleSaveEditAd() : handleAddAd(e);
          }} 
          style={{ 
            backgroundColor: editModeId ? '#f0f9ff' : '#f8fafc',
            padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px',
            border: editModeId ? '2px solid #0ea5e9' : '1px solid transparent'
          }}
        >
          
          {editModeId && (
            <div style={{ gridColumn: 'span 2', color: '#0284c7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-5px' }}>
              <Edit size={18} /> โหมดแก้ไขรายละเอียดโฆษณา (ไฟล์วิดีโอเดิม จะไม่ถูกแก้ไข)
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>หัวข้อ (Title)</label>
            <input 
              type="text" 
              placeholder="เช่น โปรเด็ดประจำสัปดาห์" 
              value={newAd.title}
              onChange={e => setNewAd({...newAd, title: e.target.value})} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>คำอธิบาย (Description)</label>
            <input 
              type="text" 
              placeholder="พิมพ์รายละเอียดสั้นๆ..." 
              value={newAd.description}
              onChange={e => setNewAd({...newAd, description: e.target.value})} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
            />
          </div>
          
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'white', padding: '15px', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            
            {/* 🌟 ส่วนอัปโหลดวิดีโอหลัก */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: editModeId ? '#94a3b8' : '#8b5cf6', marginBottom: '8px' }}>
                🎬 {editModeId ? 'ไฟล์วิดีโอเดิมถูกล็อคไว้ (แก้ไขได้เฉพาะข้อความและปก)' : 'อัปโหลดวิดีโอ (ไฟล์วิดีโอแนวตั้ง 9:16 แนะนำไม่เกิน 10MB)'}
              </label>
              <input 
                id="ad-file-upload" 
                type="file" 
                accept="video/mp4,video/webm" 
                disabled={editModeId !== null} 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                      e.target.value = '';
                      return alert('❌ วิดีโอไฟล์ใหญ่เกินไปครับ! (สูงสุดไม่เกิน 10MB)');
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => setNewAd({...newAd, media_url: reader.result, media_type: 'video'});
                  reader.readAsDataURL(file);
                }} 
                style={{ width: '100%', padding: '8px', cursor: editModeId ? 'not-allowed' : 'pointer', opacity: editModeId ? 0.5 : 1, border: '1px solid #e2e8f0', borderRadius: '6px' }} 
              />
            </div>

            {/* 🌟 🌟 เพิ่มส่วนอัปโหลดรูปปก (Thumbnail) ตรงนี้ 🌟 🌟 */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                🖼️ อัปโหลดรูปปกวิดีโอ (หน้าปะหน้า ไม่เกิน 500KB)
              </label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <input 
                    id="ad-thumbnail-upload" 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      // 🌟 ดักขนาดไฟล์ปกไม่ให้เกิน 500KB (ลดภาระฐานข้อมูล)
                      if (file.size > 500 * 1024) {
                          e.target.value = '';
                          return alert('❌ รูปปกขนาดใหญ่เกินไปครับ! (สูงสุดไม่เกิน 500KB) กรุณาย่อขนาดรูปก่อนครับ');
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setNewAd({...newAd, thumbnail_url: reader.result}); // แปลงเป็น Base64 เก็บไว้
                      reader.readAsDataURL(file);
                    }} 
                    style={{ flex: 1, padding: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '6px' }} 
                  />
                  {newAd.thumbnail_url && (
                      <div style={{ width: '60px', height: '100px', backgroundColor: '#000', borderRadius: '6px', overflow: 'hidden' }}>
                          <img src={newAd.thumbnail_url} alt="ปก" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                  )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {editModeId && (
                <button 
                    type="button" 
                    onClick={() => { 
                    setEditModeId(null); 
                    setNewAd({ title: '', description: '', media_url: '', media_type: 'image', thumbnail_url: '' }); 
                    }} 
                    style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ยกเลิก
                </button>
                )}

                <button 
                type="submit" 
                disabled={!newAd.media_url && !editModeId}
                style={{ 
                    padding: '10px 25px', 
                    backgroundColor: (newAd.media_url || editModeId) ? (editModeId ? '#0284c7' : '#8b5cf6') : '#cbd5e1', 
                    color: 'white', border: 'none', borderRadius: '8px', 
                    cursor: (newAd.media_url || editModeId) ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'
                }}
                >
                {editModeId ? <><Edit size={18} /> บันทึกการแก้ไข</> : <><PlusCircle size={18} /> บันทึกโฆษณาและปกเข้า DB</>}
                </button>
            </div>

          </div>
        </form>

        {/* 🌟 🌟 ตารางแสดงโฆษณา (ดึงจาก Database) 🌟 🌟 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '30px' }}>
            {videoList.length > 0 ? (
                videoList.map((vid) => (
                    <div key={vid.ad_id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        
                        {/* ส่วนแสดงวิดีโอ และโชว์รูปปกแทนถ้ายังไม่ได้กด Play */}
                        <div style={{ aspectRatio: '9/16', backgroundColor: '#000', position: 'relative' }}>
                            <video 
                                src={vid.media_url} 
                                poster={vid.thumbnail_url} /* 🌟 แสดงรูปปกตรงนี้เลย */
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                muted playsInline controls 
                            />
                            <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                                ID: {vid.ad_id}
                            </div>
                        </div>

                        {/* ส่วนรายละเอียดเนื้อหา */}
                        <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {vid.title}
                            </h4>
                            <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                {vid.description}
                            </p>
                            
                            {/* แถบโชว์สถิติให้แอดมินชื่นใจ */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', marginBottom: '15px', fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>
                                <span title="ยอดวิว">👁️ {vid.views_count || 0}</span>
                                <span title="ยอดไลก์">❤️ {vid.likes_count || 0}</span>
                                <span title="ยอดแชร์">🔗 {vid.shares_count || 0}</span>
                                <span title="คอมเมนต์">💬 {vid.comments_count || 0}</span>
                            </div>

                            {/* ปุ่ม Action */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleEditClick(vid)} style={{ flex: 1, padding: '8px', backgroundColor: '#f1f5f9', color: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                    ✏️ แก้ไข (ใส่ปกใหม่)
                                </button>
                                <button onClick={() => deleteItem('ad', vid.ad_id)} style={{ flex: 1, padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                    🗑️ ลบ
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    ยังไม่มีวิดีโอโฆษณา ลองอัปโหลดสักคลิปสิครับ!
                </div>
            )}
        </div>


      </div>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DepositPromotion;