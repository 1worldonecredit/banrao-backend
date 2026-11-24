import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin,
  Shield, Briefcase, CreditCard, Building2, Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

// =========================================================================
// ฟังก์ชันตัวช่วยจัดรูปแบบข้อมูล (เลขบัตรไทย / วันที่ไทย / คำนวณอายุ)
// =========================================================================
const formatThaiId = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 13);
  if (digits.length !== 13) return value || '-';
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12, 13)}`;
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calcAgeText = (birthDate) => {
  if (!birthDate) return '-';
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return '-';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return `${years} ปี ${months} เดือน`;
};

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // 1. ดึงข้อมูลผู้ใช้งานที่ Login จริงจาก LocalStorage + API หลังบ้าน
  // =========================================================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // อ่านข้อมูลเบื้องต้นที่เก็บไว้ตั้งแต่ตอน Login
        const loggedInUser = JSON.parse(localStorage.getItem('userData') || '{}');
        const accountId = loggedInUser.account_id || loggedInUser.id;

        // ข้อมูลสำรองกรณี API ยังโหลดไม่เสร็จหรือเชื่อมต่อไม่ได้
        const fallbackFullName = (loggedInUser.full_name || '').split(' ');
        const fallbackData = {
          account_id: accountId || '-',
          username: loggedInUser.username || '-',
          emp_code: null,
          national_id: null,
          first_name: fallbackFullName[0] || 'ผู้ใช้งาน',
          last_name: fallbackFullName.slice(1).join(' ') || '',
          nickname: '',
          role: loggedInUser.positions?.[0]?.position_name || (loggedInUser.is_super_admin ? 'Super Admin' : 'เจ้าหน้าที่'),
          org_name: null,
          department_name: null,
          area_code: loggedInUser.area_code || 'TH',
          area_name: 'ส่วนกลาง',
          email: '-',
          phone: loggedInUser.username || '-',
          birth_date: null,
          gender: '-',
          education: null,
          join_date: null,
          is_active: true,
          avatar_url: null,
          assignments: []
        };

        if (!accountId) {
          setProfileData(fallbackData);
          setLoading(false);
          return;
        }

        // เรียก API ดึงข้อมูลโปรไฟล์เต็มจากฐานข้อมูลจริง
        const response = await fetch(`${API_URL}/api/admin/profile/${accountId}`);
        const result = await response.json();

        if (result.success && result.data) {
          setProfileData(result.data);
        } else {
          setProfileData(fallbackData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  if (!profileData) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง</div>;
  }

  // สร้างรูปโปรไฟล์สำรองจากชื่อจริง กรณียังไม่ได้อัปโหลดรูปใน Profile
  const fullName = `${profileData.first_name} ${profileData.last_name}`.trim() || profileData.username;
  const avatarSrc =
    profileData.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563eb&color=fff&size=256`;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* ส่วนหัวหน้าจอ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: '#fff', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          โปรไฟล์ส่วนตัว (My Profile)
        </h2>
        {profileData.emp_code && (
          <div style={{
            backgroundColor: 'rgba(37, 99, 235, 0.9)', color: '#fff',
            padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold',
            fontFamily: 'monospace', fontSize: '14px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
          }}>
            รหัสบุคลากร: {profileData.emp_code}
          </div>
        )}
      </div>

      {/* Grid Layout แบ่ง 2 คอลัมน์ (ซ้าย: รูปและตำแหน่งหลัก, ขวา: ข้อมูลส่วนตัว + ประวัติตำแหน่ง) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>

        {/* ================================================================= */}
        {/* คอลัมน์ซ้าย: รูปโปรไฟล์ ชื่อ-นามสกุล ตำแหน่ง และสังกัดปัจจุบัน */}
        {/* ================================================================= */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* กรอบรูปโปรไฟล์ */}
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <img
              src={avatarSrc}
              alt={fullName}
              style={{
                width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
              }}
            />
          </div>

          {/* ชื่อ-นามสกุล และชื่อเล่น */}
          <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', color: '#fff' }}>
            {fullName} {profileData.nickname ? `(${profileData.nickname})` : ''}
          </h3>

          {/* ตำแหน่งปัจจุบัน */}
          <p style={{
            margin: '0 0 12px 0', color: '#4ade80', fontWeight: 'bold', fontSize: '15px',
            backgroundColor: 'rgba(74, 222, 128, 0.12)', padding: '4px 14px', borderRadius: '999px'
          }}>
            {profileData.role}
          </p>

          {/* สังกัดหน่วยงาน / แผนก */}
          {(profileData.org_name || profileData.department_name) && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px', lineHeight: '1.6' }}>
              <div><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{profileData.org_name || '-'}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)' }}>แผนก: {profileData.department_name || '-'}</div>
            </div>
          )}

          <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '18px' }}></div>

          {/* สรุปพื้นที่รับผิดชอบ และจำนวนประวัติตำแหน่ง */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            <div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>รหัสพื้นที่</p>
              <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{profileData.area_code || 'TH'}</p>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>ประวัติตำแหน่ง</p>
              <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{profileData.assignments?.length || 0} รายการ</p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* คอลัมน์ขวา: ข้อมูลส่วนตัว + สถานะระบบ + ประวัติการดำรงตำแหน่ง */}
        {/* ================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', gridColumn: 'span 2' }}>

          {/* การ์ดที่ 1: ข้อมูลส่วนตัว */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              ข้อมูลส่วนตัว (Personal Information)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
              {/* Username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '12px', color: '#c084fc' }}><User size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>ชื่อผู้ใช้งาน (Username)</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>{profileData.username}</div>
                </div>
              </div>

              {/* เลขบัตรประชาชน */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}><CreditCard size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>เลขบัตรประชาชน</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500', fontFamily: 'monospace' }}>{formatThaiId(profileData.national_id)}</div>
                </div>
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', color: '#34d399' }}><Phone size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>เบอร์โทรศัพท์</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>{profileData.phone}</div>
                </div>
              </div>

              {/* อีเมล */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px', color: '#60a5fa' }}><Mail size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>อีเมล</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>{profileData.email || '-'}</div>
                </div>
              </div>

              {/* วันเกิด & อายุ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', padding: '12px', borderRadius: '12px', color: '#facc15' }}><Calendar size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>วันเกิด / อายุ / เพศ</div>
                  <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                    {formatThaiDate(profileData.birth_date)} ({calcAgeText(profileData.birth_date)}) • {profileData.gender || '-'}
                  </div>
                </div>
              </div>

              {/* พื้นที่รับผิดชอบ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '12px', color: '#fb7185' }}><MapPin size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>พื้นที่รับผิดชอบ</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>[{profileData.area_code}] {profileData.area_name || 'ส่วนกลาง'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 2: ข้อมูลระบบ & สถานะบัญชี */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              ข้อมูลระบบ (System Status)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', padding: '12px', borderRadius: '12px', color: '#facc15' }}><Award size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>วันที่สร้างบัญชี</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '500' }}>{formatThaiDate(profileData.join_date)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}><Shield size={22} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>สถานะบัญชี</div>
                  <div style={{
                    fontSize: '13px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginTop: '2px',
                    color: profileData.is_active ? '#4ade80' : '#f87171',
                    backgroundColor: profileData.is_active ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)'
                  }}>
                    {profileData.is_active ? 'Active (เปิดใช้งาน)' : 'Inactive (ปิดใช้งาน)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 3: ประวัติการดำรงตำแหน่งงาน (แสดงเฉพาะเมื่อมีข้อมูลใน HR) */}
          {Array.isArray(profileData.assignments) && profileData.assignments.length > 0 && (
            <div className="glass-card">
              <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#60a5fa" /> ประวัติตำแหน่งงาน ({profileData.assignments.length} รายการ)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profileData.assignments.map((item) => (
                  <div
                    key={item.assignment_id}
                    style={{
                      padding: '12px 14px', borderRadius: '12px',
                      backgroundColor: item.is_current ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                      border: item.is_current ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>
                        [{item.pos_code || '-'}] {item.position_name || '-'}
                      </div>
                      <span style={{
                        fontSize: '11.5px', fontWeight: 'bold', padding: '2px 10px', borderRadius: '999px',
                        backgroundColor: item.is_current ? 'rgba(74, 222, 128, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        color: item.is_current ? '#4ade80' : '#cbd5e1'
                      }}>
                        {item.is_current ? 'ตำแหน่งปัจจุบัน' : item.status === 'PENDING' ? 'รออนุมัติ' : 'ตำแหน่งที่ผ่านมา'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
                      {item.org_name || '-'} • {item.department_name || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
                      พื้นที่: [{item.area_code}] {item.area_name || 'ส่วนกลาง'} • ระยะเวลา: {formatThaiDate(item.start_date || item.created_at)} – {item.end_date ? formatThaiDate(item.end_date) : (item.is_current ? 'ปัจจุบัน' : '-')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;