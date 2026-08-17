import React, { useState, useEffect } from 'react';
import { Save, Percent, Clock, CalendarRange, RefreshCw, AlertCircle, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

// ฟังก์ชันช่วยแปลงวันที่จาก SQL ให้เข้ากับ Input type="datetime-local"
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

  // State เก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    deposit_bonus_percent: 0,
    withdraw_fee_percent: 0,
    provider_reward_percent: 0,
    referrer_reward_percent: 0,
    request_timeout_minutes: 15,
    promo_start_time: '',
    promo_end_time: ''
  });

  // 1. ดึงข้อมูลครั้งแรกเมื่อเปิดหน้า
  useEffect(() => {
    fetchSettings();
    // อัปเดตเวลาปัจจุบันทุก 1 วินาที เพื่อเช็คสถานะโปรโมชั่น
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/p2p-settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData({
          deposit_bonus_percent: data.settings.deposit_bonus_percent,
          withdraw_fee_percent: data.settings.withdraw_fee_percent,
          provider_reward_percent: data.settings.provider_reward_percent,
          referrer_reward_percent: data.settings.referrer_reward_percent,
          request_timeout_minutes: data.settings.request_timeout_minutes,
          promo_start_time: formatForInput(data.settings.promo_start_time),
          promo_end_time: formatForInput(data.settings.promo_end_time)
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert('ไม่สามารถดึงข้อมูลตั้งค่าได้');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. จัดการเมื่อพิมพ์แก้ข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. บันทึกข้อมูลกลับไปที่ Server
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate ตรวจสอบวันที่
    if (formData.promo_start_time && formData.promo_end_time) {
        if (new Date(formData.promo_start_time) >= new Date(formData.promo_end_time)) {
            return alert('❌ เวลาสิ้นสุดโปรโมชั่น ต้องอยู่หลังเวลาเริ่มต้นครับ');
        }
    }

    if (!window.confirm('ยืนยันการบันทึกการตั้งค่า P2P และโปรโมชั่นใช่หรือไม่?')) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/p2p-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ บันทึกข้อมูลสำเร็จ ระบบอัปเดตการทำงานอัตโนมัติแล้ว');
        fetchSettings(); // ดึงมาอัปเดตหน้าจออีกรอบ
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSaving(false);
    }
  };

  // เช็คสถานะโปรโมชั่นแบบ Real-time
  const checkPromoStatus = () => {
    if (!formData.promo_start_time || !formData.promo_end_time) return { text: 'ไม่ได้ตั้งค่าเวลา', color: '#94a3b8', bg: '#f1f5f9' };
    
    const start = new Date(formData.promo_start_time);
    const end = new Date(formData.promo_end_time);

    if (currentTime < start) return { text: 'รอเวลาเปิดอัตโนมัติ (ล่วงหน้า)', color: '#d97706', bg: '#fffbeb' };
    if (currentTime >= start && currentTime <= end) return { text: '🔥 โปรโมชั่นกำลังทำงาน', color: '#16a34a', bg: '#f0fdf4' };
    return { text: 'หมดเวลาโปรโมชั่นแล้ว', color: '#dc2626', bg: '#fef2f2' };
  };

  const promoStatus = checkPromoStatus();

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={28} color="#0ea5e9" /> ตั้งค่า P2P & โปรโมชั่นฝากถอน
        </h2>
        <button onClick={fetchSettings} style={{ padding: '8px 15px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <RefreshCw size={16} className={isLoading ? "spin" : ""} /> รีเฟรชข้อมูล
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><RefreshCw size={40} className="spin" color="#0ea5e9" /></div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          
          {/* ========================================== */}
          {/* 📦 กล่อง 1: ตั้งเวลาโปรโมชั่น (เปิด/ปิดอัตโนมัติ) */}
          {/* ========================================== */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <CalendarRange size={22} color="#10b981" /> ตั้งเวลาโปรโมชั่น
              </h4>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: promoStatus.bg, color: promoStatus.color, border: `1px solid ${promoStatus.color}30` }}>
                {promoStatus.text}
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', color: '#475569', fontSize: '13px', marginBottom: '10px' }}>
                <AlertCircle size={16} color="#0ea5e9" /> 
                <span>เมื่อถึง <strong>เวลาเริ่ม</strong> การ์ดโปรโมชั่นจะแสดงให้ลูกค้าเห็นอัตโนมัติ และจะหายไปเมื่อถึง <strong>เวลาสิ้นสุด</strong></span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>เวลา เริ่มโปรโมชั่น (Start)</label>
              <input type="datetime-local" lang="en-GB" name="promo_start_time" value={formData.promo_start_time} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>เวลา สิ้นสุดโปรโมชั่น (End)</label>
              <input type="datetime-local" lang="en-GB" name="promo_end_time" value={formData.promo_end_time} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            
            {/* โบนัสลูกค้า */}
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#16a34a' }}>เปอร์เซ็นต์โบนัสฝากเงิน (สำหรับลูกค้า)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.01" name="deposit_bonus_percent" value={formData.deposit_bonus_percent} onChange={handleChange} style={{ width: '100%', padding: '12px 40px 12px 15px', borderRadius: '8px', border: '2px solid #bbf7d0', boxSizing: 'border-box', fontSize: '16px', fontWeight: 'bold', color: '#15803d', backgroundColor: '#f0fdf4' }} />
                <Percent size={18} color="#16a34a" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '5px' }}>ตัวอย่าง: ตั้ง 2.00 หมายถึง ฝาก 100 บาท ได้เพิ่ม 2 บาท</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* 📦 กล่อง 2: ตั้งค่าระบบ P2P (ค่าคอม, ค่าธรรมเนียม) */}
          {/* ========================================== */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderTop: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Percent size={22} color="#f59e0b" /> ตั้งค่าส่วนแบ่ง P2P
            </h4>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#dc2626' }}>หักค่าธรรมเนียม ถอนเงิน (%)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.01" name="withdraw_fee_percent" value={formData.withdraw_fee_percent} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', boxSizing: 'border-box' }} />
                <Percent size={16} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0284c7' }}>ค่าคอมมิชชัน ผู้รับงาน P2P (%)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.01" name="provider_reward_percent" value={formData.provider_reward_percent} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', boxSizing: 'border-box' }} />
                <Percent size={16} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#8b5cf6' }}>ค่าคอมมิชชัน ผู้แนะนำ (Affiliate) (%)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.01" name="referrer_reward_percent" value={formData.referrer_reward_percent} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd6fe', boxSizing: 'border-box' }} />
                <Percent size={16} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <h4 style={{ margin: '0 0 15px 0', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
              <Clock size={20} color="#475569" /> ระบบความปลอดภัย (Timeout)
            </h4>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569' }}>เวลาหมดอายุคำขอ P2P (นาที)</label>
              <input type="number" name="request_timeout_minutes" value={formData.request_timeout_minutes} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '5px' }}>หากไม่มีคนกดรับงานในเวลาที่กำหนด ระบบจะยกเลิกคำขออัตโนมัติ</span>
            </div>

            <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '15px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 6px rgba(14, 165, 233, 0.2)' }}>
              {isSaving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />} บันทึกการตั้งค่าทั้งหมด
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default DepositPromotion;