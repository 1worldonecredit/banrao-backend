import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Menu, X, User, Users,
  Settings, MapPin, ShieldCheck, FileText, Circle,
  Search, Layers, Building2, Activity
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

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const displayName = userData.full_name || userData.username || 'ผู้ดูแลระบบ';
  const displayRole = userData.is_super_admin
    ? 'Super Admin'
    : (userData.positions?.[0]?.position_name || 'พนักงาน / ผู้ดูแล');
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
          display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={24} color="#ffffff" />
              </button>
            )}
            {!isMobile && <h3 style={{ margin: 0, color: '#ffffff', fontWeight: '500' }}>Ban Rao Admin Portal</h3>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>{displayName}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{displayRole}</div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', fontWeight: 'bold', boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)' }}>
              {avatarLetter}
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