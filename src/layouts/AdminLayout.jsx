import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Menu, X, User, Users,
  Settings, MapPin, ShieldCheck, FileText, Circle,
  Search, Layers, Building2, Activity, Bell
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const ICON_MAP = {
  LayoutDashboard, Users, Settings, User, MapPin,
  ShieldCheck, FileText, Circle, Search, Layers, Building2, Activity
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [menuGroups, setMenuGroups] = useState([]);

  // =========================================================================
  // State สำหรับรูปโปรไฟล์จริง และระบบแจ้งเตือน (รอพัฒนาต่อยอด)
  // =========================================================================
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const [avatarUrl, setAvatarUrl] = useState(userData.avatar_url || null);
  const [displayName, setDisplayName] = useState(userData.full_name || userData.username || 'ผู้ดูแลระบบ');
  const [displayRole, setDisplayRole] = useState(
    userData.is_super_admin
      ? 'Super Admin'
      : (userData.positions?.[0]?.position_name || 'พนักงาน / ผู้ดูแล')
  );

  // ระบบแจ้งเตือน (Placeholder พร้อมต่อยอด API ในอนาคต)
  const [notifications, setNotifications] = useState([]); // รอรับรายการแจ้งเตือนจาก API
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ปิด Dropdown แจ้งเตือนเมื่อคลิกพื้นที่อื่นนอกกรอบ
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================================================
  // ดึงรูปโปรไฟล์จริงและชื่อ-ตำแหน่งล่าสุดจาก /api/admin/profile/:accountId
  // =========================================================================
  useEffect(() => {
    const loadProfileAvatar = async () => {
      const accountId = userData.account_id || userData.id;
      if (!accountId) return;
      try {
        const res = await fetch(`${API_URL}/api/admin/profile/${accountId}`);
        const result = await res.json();
        if (result.success && result.data) {
          const p = result.data;
          if (p.avatar_url) setAvatarUrl(p.avatar_url);
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          if (fullName) setDisplayName(fullName);
          if (p.role) setDisplayRole(p.role);
        }
      } catch (err) {
        console.error('Load navbar profile error:', err);
      }
    };
    loadProfileAvatar();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('adminMenuPermissions');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    if (path) navigate(path);
    if (isMobile) setIsSidebarOpen(false);
  };

  const getMenuItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      fontSize: '13.5px',
      cursor: 'pointer', transition: 'all 0.2s ease',
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.78)',
      borderLeft: isActive ? '4px solid #4ade80' : '4px solid transparent',
      fontWeight: isActive ? '600' : 'normal',
      margin: '3px 8px', borderRadius: '8px'
    };
  };

  const loadMyMenus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/my-menus`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ถ้า Token หมดอายุ (401/403) ให้เด้งไปหน้า Login อัตโนมัติ
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMenuGroups(data.data);
        if (data.permissionsMap) {
          localStorage.setItem('adminMenuPermissions', JSON.stringify(data.permissionsMap));
        }
      }
    } catch (err) {
      console.error('Load admin menus error:', err);
    }
  };

  useEffect(() => {
    loadMyMenus();
    window.addEventListener('menuUpdated', loadMyMenus);
    return () => window.removeEventListener('menuUpdated', loadMyMenus);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'transparent', fontFamily: 'var(--sans)', overflow: 'hidden' }}>

      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar (Glassmorphism) */}
      <div style={{
        width: '280px',
        backgroundColor: 'rgba(2, 21, 146, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#ffffff',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative', top: 0, bottom: 0, left: 0,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 50,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ padding: '24px 20px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '1px' }}>
          <span>BAN RAO <span style={{ color: '#4ade80' }}>ADMIN</span></span>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* รายการเมนูแยกตามกรุ๊ปเมนู */}
        <div style={{ padding: '14px 0', flexGrow: 1, overflowY: 'auto' }}>
          {menuGroups.map((group, gIdx) => (
            <div key={group.group_id || gIdx} style={{ marginBottom: '14px' }}>
              <div style={{
                padding: '6px 18px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(148, 163, 184, 0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                {group.group_name}
              </div>

              {Array.isArray(group.menus) && group.menus.map((menu) => {
                const IconComponent = ICON_MAP[menu.icon_name] || Circle;
                return (
                  <div
                    key={menu.menu_id}
                    style={getMenuItemStyle(menu.route_path)}
                    onClick={() => handleNavigation(menu.route_path)}
                  >
                    <IconComponent size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
                    <span>{menu.menu_name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', transition: '0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
          >
            <LogOut size={20} /> ออกจากระบบ
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flexGrow: 1, display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        width: isMobile ? '100%' : 'calc(100% - 280px)',
        backgroundColor: 'transparent'
      }}>
        {/* Top Navbar */}
        <div style={{
          height: '70px',
          backgroundColor: 'rgba(8, 38, 94, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', flexShrink: 0,
          position: 'relative', zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={24} color="#ffffff" />
              </button>
            )}
            {!isMobile && <h3 style={{ margin: 0, color: '#ffffff', fontWeight: '500' }}>Ban Rao Admin Portal</h3>}
          </div>

          {/* มุมขวาบน: ปุ่มแจ้งเตือน + ชื่อ/ตำแหน่ง + รูปโปรไฟล์จริง */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* ปุ่มกระดิ่งแจ้งเตือน (พร้อม Dropdown รอเชื่อม API ในอนาคต) */}
            <div ref={notiRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsNotiOpen((prev) => !prev)}
                title="การแจ้งเตือน"
                style={{
                  position: 'relative',
                  width: '40px', height: '40px', borderRadius: '50%',
                  backgroundColor: isNotiOpen ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    minWidth: '18px', height: '18px', padding: '0 4px',
                    borderRadius: '999px', backgroundColor: '#ef4444', color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(8, 38, 94, 0.9)'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* กล่อง Dropdown แสดงรายการแจ้งเตือน */}
              {isNotiOpen && (
                <div style={{
                  position: 'absolute', top: '48px', right: 0, width: '320px',
                  backgroundColor: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                  color: '#fff', overflow: 'hidden', zIndex: 100
                }}>
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>การแจ้งเตือน</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {unreadCount > 0 ? `${unreadCount} รายการใหม่` : 'อัปเดตล่าสุด'}
                    </span>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        <Bell size={28} style={{ opacity: 0.35, marginBottom: '8px' }} />
                        <div>ยังไม่มีการแจ้งเตือนใหม่</div>
                        <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                          (ระบบแจ้งเตือนคำขออนุมัติและงานหลังบ้านกำลังพัฒนา)
                        </div>
                      </div>
                    ) : (
                      notifications.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            backgroundColor: item.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.12)',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>{item.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ข้อมูลผู้ใช้ + รูปโปรไฟล์ (คลิกเพื่อไปหน้า Profile) */}
            <div
              onClick={() => handleNavigation('/profile')}
              title="ดูโปรไฟล์ส่วนตัว"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
                <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{displayRole}</div>
              </div>

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid #4ade80', boxShadow: '0 0 12px rgba(74, 222, 128, 0.35)'
                  }}
                />
              ) : (
                <div style={{
                  width: '42px', height: '42px', backgroundColor: '#4ade80', borderRadius: '50%',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: '#000', fontWeight: 'bold', boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)'
                }}>
                  {avatarLetter}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* พื้นที่ Render หน้าลูก */}
        <div style={{ padding: isMobile ? '16px' : '28px', overflowY: 'auto', flexGrow: 1, backgroundColor: 'transparent' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;