import React, { useState, useEffect } from 'react';
import { Save, Percent, Clock, CalendarRange, Trash2, PlusCircle, RefreshCw, AlertCircle, Zap, Image as ImageIcon, Video, Megaphone, Settings } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const formatForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const DepositPromotion = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. State: ตั้งค่าระบบหลัก
  const [formData, setFormData] = useState({
    deposit_bonus_percent: 0,
    withdraw_fee_percent: 0,
    provider_reward_percent: 0,
    referrer_reward_percent: 0,
    request_timeout_minutes: 15,
    promo_start_time: '',
    promo_end_time: ''
  });

  // 2. State: คิวโปรโมชั่น
  const [promotions, setPromotions] = useState([]);
  const [newPromo, setNewPromo] = useState({ title: '', bonus_percent: 0, start_time: '', end_time: '' });

  // 3. State: ป้ายโฆษณา (ADS)
  const [ads, setAds] = useState([]);
  const [newAd, setNewAd] = useState({ title: '', description: '', media_type: 'image', media_url: '' });

  useEffect(() => {
    fetchAllData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // ดึงตั้งค่าหลัก
      const resSettings = await fetch(`${API_URL}/api/admin/p2p-settings`);
      const dataSettings = await resSettings.json();
      if (dataSettings.success && dataSettings.settings) {
        setFormData({
          deposit_bonus_percent: dataSettings.settings.deposit_bonus_percent,
          withdraw_fee_percent: dataSettings.settings.withdraw_fee_percent,
          provider_reward_percent: dataSettings.settings.provider_reward_percent,
          referrer_reward_percent: dataSettings.settings.referrer_reward_percent,
          request_timeout_minutes: dataSettings.settings.request_timeout_minutes,
          promo_start_time: formatForInput(dataSettings.settings.promo_start_time),
          promo_end_time: formatForInput(dataSettings.settings.promo_end_time)
        });
      }

      // ดึงคิวโปรโมชั่น
      const resPromos = await fetch(`${API_URL}/api/admin/promotions`);
      const dataPromos = await resPromos.json();
      if (dataPromos.success) setPromotions(dataPromos.promotions);

      // ดึงโฆษณา
      const resAds = await fetch(`${API_URL}/api/admin/ads`);
      const dataAds = await resAds.json();
      if (dataAds.success) setAds(dataAds.ads);

    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setIsLoading(false); }
  };

  // =========================================
  // 📝 ฟังก์ชันจัดการข้อมูล
  // =========================================
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
    if (new Date(newPromo.start_time) >= new Date(newPromo.end_time)) return alert('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม!');
    try {
      const res = await fetch(`${API_URL}/api/admin/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromo)
      });
      if ((await res.json()).success) {
        alert('เพิ่มโปรโมชั่นล่วงหน้าสำเร็จ');
        setNewPromo({ title: '', bonus_percent: 0, start_time: '', end_time: '' });
        fetchAllData();
      }
    } catch (err) { alert('Error!'); }
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd)
      });
      if ((await res.json()).success) {
        alert('เพิ่มโฆษณาสำเร็จ!');
        setNewAd({ title: '', description: '', media_type: 'image', media_url: '' });
        fetchAllData();
      }
    } catch (err) { alert('Error!'); }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm(`ยืนยันการลบ${type === 'promo' ? 'โปรโมชั่น' : 'โฆษณา'}นี้?`)) return;
    try {
      await fetch(`${API_URL}/api/admin/${type === 'promo' ? 'promotions' : 'ads'}/${id}`, { method: 'DELETE' });
      fetchAllData();
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (start, end) => {
    const s = new Date(start), e = new Date(end);
    if (currentTime < s) return <span style={{ padding: '4px 10px', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #fde68a' }}>ล่วงหน้า</span>;
    if (currentTime >= s && currentTime <= e) return <span style={{ padding: '4px 10px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>กำลังทำงาน</span>;
    return <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>หมดเวลา</span>;
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><RefreshCw size={40} className="spin" color="#0ea5e9" /></div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Prompt', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="#0ea5e9" /> ศูนย์จัดการ P2P & โปรโมชั่น
        </h2>
        <button onClick={fetchAllData} style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <RefreshCw size={18} /> รีเฟรชข้อมูล
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginBottom: '40px' }}>
        
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
        {/* 📦 กล่อง 2: จัดการคิวโปรโมชั่น (Promotion Queue) */}
        {/* ========================================== */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <CalendarRange size={22} color="#10b981" /> คิวโปรโมชั่น (แจกโบนัสฝาก)
          </h4>
          
          <form onSubmit={handleAddPromo} style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #6ee7b7' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="text" required placeholder="ชื่อโปรโมชั่น" value={newPromo.title} onChange={e => setNewPromo({...newPromo, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }} />
              <input type="number" step="0.01" required placeholder="โบนัส %" value={newPromo.bonus_percent || ''} onChange={e => setNewPromo({...newPromo, bonus_percent: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div><span style={{fontSize:'12px', color:'#166534'}}>เริ่ม:</span><input type="datetime-local" required value={newPromo.start_time} onChange={e => setNewPromo({...newPromo, start_time: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0', boxSizing:'border-box' }} /></div>
              <div><span style={{fontSize:'12px', color:'#166534'}}>จบ:</span><input type="datetime-local" required value={newPromo.end_time} onChange={e => setNewPromo({...newPromo, end_time: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0', boxSizing:'border-box' }} /></div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ เพิ่มคิวโปรโมชั่น</button>
          </form>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {promotions.map(p => (
              <div key={p.promo_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{p.title} <span style={{ color: '#10b981' }}>(+{p.bonus_percent}%)</span></strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(p.start_time).toLocaleString()} - {new Date(p.end_time).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getStatusBadge(p.start_time, p.end_time)}
                  <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => deleteItem('promo', p.promo_id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ============================================== */}
      {/* 🌟 โซนป้ายโฆษณา (ADS/VIDEO) */}
      {/* ============================================== */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #8b5cf6' }}>
        <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Megaphone size={22} color="#8b5cf6" /> คลังป้ายโฆษณา (แสดงแทนตอนว่างโปรโมชั่น)
        </h4>

        {/* ฟอร์มเพิ่มโฆษณา */}
        <form onSubmit={handleAddAd} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>หัวข้อ (Title) - แสดงทับรูปภาพ</label>
            <input type="text" placeholder="เช่น โปรเด็ดประจำสัปดาห์" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>ประเภทไฟล์</label>
            <select value={newAd.media_type} onChange={e => setNewAd({...newAd, media_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="image">รูปภาพ (Image / GIF)</option>
              <option value="video">วิดีโอสั้น (MP4 / WebM)</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>คำอธิบาย (Description) - แสดงทับรูปภาพ</label>
            <input type="text" placeholder="พิมพ์รายละเอียดสั้นๆ..." value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>ลิงก์ไฟล์ (URL รูปภาพ หรือ วิดีโอ)</label>
              <input type="text" required placeholder="https://..." value={newAd.media_url} onChange={e => setNewAd({...newAd, media_url: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', height: '42px' }}>
              <PlusCircle size={18} /> อัปโหลดเข้าคลัง
            </button>
          </div>
        </form>

        {/* ตารางแสดงโฆษณา (Preview สมจริง!) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {ads.map(ad => (
            <div key={ad.ad_id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'relative' }}>
              
              {/* ส่วน Preview ภาพเหมือนหน้าแอปจริง */}
              <div style={{ position: 'relative', height: '160px', backgroundColor: '#000' }}>
                {ad.media_type === 'video' ? (
                  <video src={ad.media_url} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={ad.media_url} alt="ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Gradient และ ข้อความ */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', padding: '20px 10px 10px 10px' }}>
                   <h5 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.title || 'ไม่มีหัวข้อ'}</h5>
                   <p style={{ color: '#cbd5e1', margin: 0, fontSize: '10px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.description || '-'}</p>
                </div>
                <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold', color: '#0f172a' }}>
                  {ad.media_type === 'video' ? <Video size={12} color="#8b5cf6" /> : <ImageIcon size={12} color="#8b5cf6" />} {ad.media_type.toUpperCase()}
                </div>
              </div>

              {/* ส่วนปุ่มลบ */}
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                 <span style={{ fontSize: '11px', color: '#64748b' }}>เพิ่มเมื่อ: {new Date(ad.created_at).toLocaleDateString()}</span>
                 <button onClick={() => deleteItem('ad', ad.ad_id)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                   <Trash2 size={14} /> ลบออก
                 </button>
              </div>
            </div>
          ))}
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