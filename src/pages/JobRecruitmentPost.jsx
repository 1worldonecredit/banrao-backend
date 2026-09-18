import React, { useState, useEffect } from 'react';
import { Save, Calendar, Type, AlignLeft, ToggleLeft, ToggleRight, Clock, Megaphone, Briefcase, CheckSquare, History, Edit3, X, PlusCircle } from 'lucide-react';

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
  
  const [masterPositions, setMasterPositions] = useState([]);
  const [adList, setAdList] = useState([]); // 🌟 เก็บรายการโพสต์ทั้งหมด
  const [editingId, setEditingId] = useState(null); // 🌟 เก็บ ID ที่กำลังแก้ไข (ถ้ามี)
  
  const [adData, setAdData] = useState({
    is_active: false,
    ad_title: '',
    ad_description: '',
    start_time: new Date(), 
    end_time: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    allowed_positions: [] 
  });

  useEffect(() => {
    fetchMasterAndAdData();
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

  const fetchMasterAndAdData = async () => {
    setIsLoading(true);
    try {
      // 1. ดึงตำแหน่ง Master Data
      const resMaster = await fetch(`${API_URL}/api/hrm/master-data`);
      const masterData = await resMaster.json();
      if(masterData.success) {
          setMasterPositions(masterData.positions || []);
      }

      // 2. ดึงรายการโพสต์ทั้งหมด
      const resAd = await fetch(`${API_URL}/api/hrm/job-ad/admin`);
      const adJson = await resAd.json();
      if (adJson.success) {
        setAdList(adJson.ads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePositionToggle = (posCode) => {
      setAdData(prev => {
          const isSelected = prev.allowed_positions.includes(posCode);
          if (isSelected) {
              return { ...prev, allowed_positions: prev.allowed_positions.filter(c => c !== posCode) };
          } else {
              return { ...prev, allowed_positions: [...prev.allowed_positions, posCode] };
          }
      });
  };

  // 🌟 โหลดข้อมูลเข้าฟอร์มเมื่อกด "แก้ไข" จากตารางด้านล่าง
  const handleEditAd = (ad) => {
      setEditingId(ad.id);
      let allowed = [];
      if(ad.allowed_positions) {
          allowed = ad.allowed_positions.split(',').map(p => p.trim());
      }
      setAdData({
          is_active: ad.is_active === 1 || ad.is_active === true,
          ad_title: ad.ad_title || '',
          ad_description: ad.ad_description || '',
          start_time: ad.start_time ? new Date(ad.start_time) : new Date(),
          end_time: ad.end_time ? new Date(ad.end_time) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          allowed_positions: allowed
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🌟 เคลียร์ฟอร์มเพื่อเตรียมสร้างใหม่
  const handleClearForm = () => {
      setEditingId(null);
      setAdData({
          is_active: false,
          ad_title: '',
          ad_description: '',
          start_time: new Date(), 
          end_time: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          allowed_positions: [] 
      });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (adData.start_time >= adData.end_time) {
        return alert('⚠️ วันที่สิ้นสุด ต้องอยู่หลังวันที่เริ่มต้นเสมอครับ');
    }
    if (adData.allowed_positions.length === 0 && adData.is_active) {
        return alert('⚠️ กรุณาเลือกตำแหน่งงานอย่างน้อย 1 ตำแหน่ง เพื่อเปิดรับสมัครครับ');
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hrm/job-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId, // 🌟 ส่ง ID ไปด้วย (ถ้ามี)
          is_active: adData.is_active ? 1 : 0,
          ad_title: adData.ad_title,
          ad_description: adData.ad_description,
          start_time: adData.start_time.toISOString(), 
          end_time: adData.end_time.toISOString(),
          allowed_positions: adData.allowed_positions 
        })
      });
      const data = await res.json();
      if (data.success) {
          alert('✅ บันทึกประกาศรับสมัครงานสำเร็จ!');
          handleClearForm(); // เคลียร์ฟอร์ม
          fetchMasterAndAdData(); // โหลดตารางใหม่
      } else {
          alert(`❌ ${data.message || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 ฟังก์ชันเช็คสถานะโพสต์ สำหรับโชว์ในตาราง
  const getAdStatus = (ad) => {
      if (!ad.is_active) return { text: 'ปิดการใช้งาน', color: '#94a3b8', bg: '#f1f5f9' };
      const now = new Date().getTime();
      const start = new Date(ad.start_time).getTime();
      const end = new Date(ad.end_time).getTime();
      if (now < start) return { text: 'กำลังรอเวลาเปิด', color: '#d97706', bg: '#fffbeb' };
      if (now > end) return { text: 'หมดเวลาแล้ว', color: '#dc2626', bg: '#fef2f2' };
      return { text: 'กำลังเปิดรับสมัคร', color: '#16a34a', bg: '#f0fdf4' };
  };

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh',  boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Megaphone size={28} color="#0ea5e9" /> ระบบจัดการประกาศรับสมัครงาน
        </h2>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '900px', marginBottom: '30px' }}>
        
        {/* 🌟 Header ของฟอร์ม (เปลี่ยนสีถ้ากำลังแก้ไข) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: editingId ? '#7c3aed' : '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingId ? <><Edit3 size={20} /> กำลังแก้ไขโพสต์ (ID: {editingId})</> : <><PlusCircle size={20} /> สร้างโพสต์รับสมัครงานใหม่</>}
            </h3>
            {editingId && (
                <button onClick={handleClearForm} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#ef4444', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <X size={14} /> ยกเลิกการแก้ไข
                </button>
            )}
        </div>

        <form onSubmit={handleSave}>
          
          <div style={{ backgroundColor: adData.is_active ? '#f0fdf4' : '#f8fafc', border: `1px solid ${adData.is_active ? '#bbf7d0' : '#e2e8f0'}`, padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: adData.is_active ? '#166534' : '#475569', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>เปิดใช้งานโพสต์นี้</h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>หากปิดไว้ โพสต์จะไม่แสดงที่หน้าเว็บลูกค้าไม่ว่าเวลาไหนก็ตาม</p>
            </div>
            <div onClick={() => setAdData({...adData, is_active: !adData.is_active})} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', backgroundColor: 'white', borderRadius: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <span style={{ fontWeight: 'bold', color: adData.is_active ? '#16a34a' : '#94a3b8', fontSize: '14px' }}>{adData.is_active ? 'กำลังเปิดใช้งาน' : 'ปิดการใช้งาน'}</span>
              {adData.is_active ? <ToggleRight size={35} color="#16a34a" /> : <ToggleLeft size={35} color="#cbd5e1" />}
            </div>
          </div>

          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ margin: 0, color: '#0369a1', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Type size={18} /> ข้อมูลประกาศรับสมัคร</h4>
            <div>
              <label style={{ display: 'block', color: '#0c4a6e', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>หัวข้อประกาศ</label>
              <input type="text" required value={adData.ad_title} onChange={(e) => setAdData({...adData, ad_title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none' }} placeholder="เช่น: เปิดรับสมัครเพื่อนร่วมทีมด่วน!" />
            </div>
            <div>
              <label style={{ display: 'block', color: '#0c4a6e', fontSize: '13px', marginBottom: '5px', fontWeight: 'bold' }}>รายละเอียดงาน</label>
              <textarea required rows={4} value={adData.ad_description} onChange={(e) => setAdData({...adData, ad_description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} placeholder="เขียนอธิบายสั้นๆ ดึงดูดผู้สมัคร..." />
            </div>
          </div>

          <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#6b21a8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={18} /> เลือกตำแหน่งที่ต้องการเปิดรับในรอบนี้</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {masterPositions.map(pos => {
                    const isSelected = adData.allowed_positions.includes(pos.position_code);
                    return (
                        <div key={pos.position_code} onClick={() => handlePositionToggle(pos.position_code)} style={{ padding: '15px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: isSelected ? '2px solid #8b5cf6' : '1px solid #cbd5e1', backgroundColor: isSelected ? '#f3e8ff' : 'white', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ marginTop: '2px' }}>{isSelected ? <CheckSquare size={18} color="#8b5cf6" /> : <div style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderRadius: '3px' }}></div>}</div>
                            <div>
                                <strong style={{ display: 'block', color: isSelected ? '#5b21b6' : '#334155', fontSize: '14px' }}>{pos.position_name}</strong>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>รหัส: {pos.position_code}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> กำหนดระยะเวลาแสดงผล</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <DatePickerTH label="เวลา เปิดรับสมัคร" colorTheme="#16a34a" dateValue={adData.start_time} onChange={(d) => setAdData({...adData, start_time: d})} />
              <DatePickerTH label="เวลา ปิดรับสมัคร" colorTheme="#ef4444" dateValue={adData.end_time} onChange={(d) => setAdData({...adData, end_time: d})} />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center', padding: '15px', backgroundColor: '#fff7ed', border: '1px dashed #fdba74', borderRadius: '8px', color: '#ea580c', fontWeight: 'bold', fontSize: '16px' }}>
                <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                {adData.is_active ? countdown : 'ระบบปิดการใช้งานอยู่'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="submit" disabled={isSaving} style={{ padding: '12px 30px', backgroundColor: editingId ? '#7c3aed' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'สร้างโพสต์รับสมัคร')}
            </button>
          </div>

        </form>
      </div>

      {/* ============================================================== */}
      {/* 🌟 ส่วนที่เพิ่มใหม่: ตารางประวัติโพสต์ทั้งหมด */}
      {/* ============================================================== */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '900px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
            <History size={24} color="#6366f1" /> ประวัติการโพสต์รับสมัครงานทั้งหมด
        </h3>
        
        {adList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ยังไม่มีประวัติการโพสต์</div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ID</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>หัวข้อประกาศ</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ช่วงเวลาเปิดรับ</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>สถานะปัจจุบัน</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adList.map((ad) => {
                            const status = getAdStatus(ad);
                            return (
                                <tr key={ad.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: editingId === ad.id ? '#f3e8ff' : 'white', transition: '0.2s' }}>
                                    <td style={{ padding: '12px', color: '#64748b' }}>#{ad.id}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{ad.ad_title}</td>
                                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>
                                        <div>เริ่ม: {new Date(ad.start_time).toLocaleDateString('th-TH')}</div>
                                        <div>ปิด: {new Date(ad.end_time).toLocaleDateString('th-TH')}</div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {status.text}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => handleEditAd(ad)} style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#3b82f6', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                                            <Edit3 size={14} /> แก้ไข
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

    </div>
  );
};

export default JobRecruitmentPost;