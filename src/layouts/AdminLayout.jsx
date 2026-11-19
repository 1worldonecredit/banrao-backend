import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, 
  Landmark, UserCog, Package, Users, WalletCards, 
  Menu, X, Circle, Settings, MapPin, ShieldCheck
} from 'lucide-react';

const iconMap = { LayoutDashboard, Landmark, UserCog, Package, Users, WalletCards, Settings, MapPin, ShieldCheck };

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

// เมนูพื้นฐานของระบบ Ban Rao (แสดงทันทีหากยังไม่ได้สร้างเมนูในตาราง sys_menus)
const DEFAULT_MENUS = [
  { id: 1, title: 'ภาพรวมระบบ (Dashboard)', path: '/dashboard', icon: 'LayoutDashboard', parentId: null, permission: null },
  { id: 2, title: 'จัดการพนักงาน & สิทธิ์', path: null, icon: 'UserCog', parentId: null, permission: 'MANAGE_EMPLOYEES' },
  { id: 21, title: 'รายชื่อพนักงาน', path: '/employees', icon: 'Users', parentId: 2, permission: 'MANAGE_EMPLOYEES' },
  { id: 22, title: 'จัดการเมนูระบบ', path: '/menu-management', icon: 'Settings', parentId: 2, permission: 'MANAGE_MENUS' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [openMenus, setOpenMenus] = useState({});
  const [dynamicMenus, setDynamicMenus] = useState([]);

  // ดึงข้อมูลผู้ใช้งานที่ล็อกอินอยู่
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const displayName = userData.full_name || userData.username || 'ผู้ดูแลระบบ';
  const displayRole = userData.is_super_admin
    ? 'Super Admin'
    : (userData.positions?.[0]?.position_name || 'พนักงาน / ผู้ดูแล');
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ฟังก์ชันเช็กสิทธิ์จาก userData.permissions
  const hasPermission = (permCode) => {
    if (!permCode) return true; // เมนูที่ไม่ระบุสิทธิ์ (เช่น Dashboard) เข้าได้ทุกคนที่ล็อกอินผ่าน
    if (userData.is_super_admin || userData.permissions?.includes('*')) return true;
    return Array.isArray(userData.permissions) && userData.permissions.includes(permCode);
  };

  // โหลดเมนู (ถ้ามี API /api/menus จะดึงจาก DB ถ้าไม่มีจะใช้ DEFAULT_MENUS อัตโนมัติ)
  const fetchMenusAndPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const menusRes = await fetch(`${API_URL}/api/menus`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      let allMenus = DEFAULT_MENUS;
      if (menusRes.ok) {
        const data = await menusRes.json();
        if (Array.isArray(data) && data.length > 0) {
          allMenus = data;
        }
      }

      // กรองเมนูตามสิทธิ์ของผู้ใช้
      const filtered = allMenus.filter(menu => hasPermission(menu.permission || menu.permission_code));
      setDynamicMenus(filtered);
    } catch (error) {
      // กันพัง: ใช้เมนูพื้นฐานกรองตามสิทธิ์
      const filtered = DEFAULT_MENUS.filter(menu => hasPermission(menu.permission));
      setDynamicMenus(filtered);
    }
  };

  useEffect(() => {
    fetchMenusAndPermissions();
    window.addEventListener('menuUpdated', fetchMenusAndPermissions);
    return () => window.removeEventListener('menuUpdated', fetchMenusAndPermissions);
  }, []);

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
    navigate('/login');
  };

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleNavigation = (path) => {
    if (path) navigate(path);
    if (isMobile) setIsSidebarOpen(false);
  };

  const getMenuItemStyle = (path, isGroup = false) => {
    const isActive = !isGroup && location.pathname === path;
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', cursor: 'pointer', transition: 'all 0.3s ease',
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
      borderLeft: isActive ? '4px solid #4ade80' : '4px solid transparent',
      fontWeight: isActive ? '600' : 'normal',
      margin: '4px 8px', borderRadius: '8px'
    };
  };

  const getSubMenuItemStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px 10px 45px', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px',
      backgroundColor: isActive ? 'rgba(16, 33, 133, 0.5)' : 'transparent',
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
      borderLeft: isActive ? '4px solid #4ade80' : '4px solid transparent',
      fontWeight: isActive ? '600' : 'normal',
      margin: '2px 8px', borderRadius: '8px'
    };
  };

  const safeMenus = Array.isArray(dynamicMenus) ? dynamicMenus : [];
  const mainMenus = safeMenus.filter(m => !m.parentId && !m.parent_id);

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
        {/* โลโก้ */}
        <div style={{ padding: '24px 20px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '1px' }}>
          <span>BAN RAO <span style={{ color: '#4ade80' }}>ADMIN</span></span>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* รายการเมนู */}
        <div style={{ padding: '15px 0', flexGrow: 1, overflowY: 'auto' }}>
          {mainMenus.map(mainMenu => {
            const children = safeMenus.filter(m => (m.parentId || m.parent_id) === mainMenu.id);
            const hasChildren = children.length > 0;
            const IconComponent = iconMap[mainMenu.icon] || Circle;

            return (
              <div key={mainMenu.id}>
                <div
                  style={getMenuItemStyle(mainMenu.path, hasChildren)}
                  onClick={() => hasChildren ? toggleMenu(`menu-${mainMenu.id}`) : handleNavigation(mainMenu.path)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconComponent size={20} style={{ opacity: 0.85 }} />
                    {mainMenu.title}
                  </div>
                  {hasChildren && (openMenus[`menu-${mainMenu.id}`] ? <ChevronDown size={18} style={{ opacity: 0.6 }} /> : <ChevronRight size={18} style={{ opacity: 0.6 }} />)}
                </div>

                {hasChildren && openMenus[`menu-${mainMenu.id}`] && (
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', padding: '4px 0', marginTop: '4px', borderRadius: '8px', marginInline: '8px' }}>
                    {children.map(child => (
                      <div key={child.id} style={getSubMenuItemStyle(child.path)} onClick={() => handleNavigation(child.path)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ opacity: 0.4, fontSize: '10px' }}>●</span> {child.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ปุ่มออกจากระบบ */}
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
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>{displayName}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{displayRole}</div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', fontWeight: 'bold', boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)' }}>
              {avatarLetter}
            </div>
          </div>
        </div>

        {/* พื้นที่ Render หน้าลูก */}
        <div style={{
          padding: isMobile ? '16px' : '28px',
          overflowY: 'auto',
          flexGrow: 1,
          backgroundColor: 'transparent'
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;