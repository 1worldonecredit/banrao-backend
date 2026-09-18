import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  Shield, CreditCard, Camera, Edit3, Activity 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🌟 ฟังก์ชันจำลอง/ดึงข้อมูล Profile จาก API
  // ==========================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ดึงข้อมูล User จาก LocalStorage (ที่ Login ไว้) เป็นค่าเริ่มต้น
        const loggedInUser = JSON.parse(localStorage.getItem('userData')) || {};
        const userId = loggedInUser.user_id || loggedInUser.id || 1; 

        // 🚀 เรียก API ดึงข้อมูลส่วนตัว (เชื่อมกับตาราง users และ username_lastname)
        // const response = await fetch(`${API_URL}/api/users/profile/${userId}`);
        // const result = await response.json();
        
        // ข้อมูลจำลอง (Mock Data) สำหรับแสดงผล UI ให้เห็นความสวยงามก่อนต่อ API จริง
        const mockData = {
          user_id: userId,
          username: loggedInUser.username || 'superadmin',
          firstname: 'ซุปเปอร์',
          lastname: 'ผู้ดูแลระบบ',
          role: 'Super Admin',
          email: 'admin@salapi.company',
          phone: '089-123-4567',
          location: 'กรุงเทพมหานคร, ประเทศไทย',
          joinDate: '2026-07-25',
          wallet_balance: 192599.00,
          total_orders: 500,
          avatar: loggedInUser.avatar || 'https://ui-avatars.com/api/?name=SA&background=4ade80&color=fff&size=256'
        };

        setProfileData(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          โปรไฟล์ส่วนตัว (My Profile)
        </h2>
        <button style={{ 
          backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', 
          borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 'bold', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}>
          <Edit3 size={18} /> แก้ไขข้อมูล
        </button>
      </div>

      {/* 🌟 Grid Layout แบ่ง 2 คอลัมน์ (ซ้าย 1 ส่วน, ขวา 2 ส่วน) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
        
        {/* ========================================== */}
        {/* 🟢 คอลัมน์ซ้าย: ข้อมูลหลัก & รูปภาพ */}
        {/* ========================================== */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* กรอบรูป Profile พร้อมปุ่มเปลี่ยนรูป */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <img 
              src={profileData.avatar} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            />
            <button style={{ 
              position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#4ade80', 
              color: '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}>
              <Camera size={20} />
            </button>
          </div>

          <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#fff' }}>
            {profileData.firstname} {profileData.lastname}
          </h3>
          <p style={{ margin: '0 0 20px 0', color: '#4ade80', fontWeight: 'bold' }}>{profileData.role}</p>

          <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}></div>

          {/* สถิติแบบย่อ (ดึงจากตาราง users) */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
             <div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>ยอดเงินคงเหลือ</p>
                <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>฿{profileData.wallet_balance.toLocaleString()}</p>
             </div>
             <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
             <div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>จำนวนออเดอร์</p>
                <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{profileData.total_orders}</p>
             </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🔵 คอลัมน์ขวา: รายละเอียดการติดต่อ & ข้อมูลระบบ */}
        {/* ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', gridColumn: 'span 2' }}>
          
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              ข้อมูลส่วนตัว (Personal Information)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '12px', color: '#c084fc' }}><User size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>ชื่อผู้ใช้งาน (Username)</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>{profileData.username}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px', color: '#60a5fa' }}><Mail size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>อีเมล (Email)</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>{profileData.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', color: '#34d399' }}><Phone size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>เบอร์โทรศัพท์ (Phone)</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>{profileData.phone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '12px', color: '#fb7185' }}><MapPin size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>สถานที่ (Location)</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>{profileData.location}</div>
                </div>
              </div>

            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              ข้อมูลระบบ (System Status)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', padding: '12px', borderRadius: '12px', color: '#facc15' }}><Calendar size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>วันที่สมัครสมาชิก</div>
                  <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>{profileData.joinDate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}><Shield size={24} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>สถานะบัญชี</div>
                  <div style={{ fontSize: '14px', color: '#4ade80', fontWeight: 'bold', backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginTop: '2px' }}>
                    Active (เปิดใช้งาน)
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Profile;