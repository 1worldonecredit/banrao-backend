import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, 
  Landmark, UserCog, Package, Users, WalletCards, 
  Menu, X, Circle, Settings 
} from 'lucide-react';

const iconMap = { LayoutDashboard, Landmark, UserCog, Package, Users, WalletCards, Settings };

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [openMenus, setOpenMenus] = useState({});
  const [dynamicMenus, setDynamicMenus] = useState([]);

  // ==========================================
  // 🌟 ส่วนที่แก้ไขใหม่: ดึงข้อมูลเมนูจาก API 
  // ==========================================
  const fetchMenus = async () => {
    try {
      // ยิงไปขอข้อมูลเมนูจากเซิร์ฟเวอร์ Node.js
      const response = await fetch(`${API_URL}/api/menus`);
      if (response.ok) {
        const data = await response.json();
        setDynamicMenus(data); // เอาข้อมูลมาวาดเมนูซ้ายมือ
        
        // แอบเก็บลง LocalStorage ไว้สำรองให้ PageRouter.jsx ใช้งานได้ด้วย
        localStorage.setItem('system_menus', JSON.stringify(data));
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลเมนูได้:', error);
    }
  };

  useEffect(() => {
    fetchMenus(); // ดึงข้อมูลครั้งแรกตอนโหลดหน้าเว็บ

    // ดักจับ Event เมื่อมีการเพิ่ม/แก้ไข/ลบ เมนูจากหน้า MenuManagement ให้ดึงข้อมูลใหม่
    window.addEventListener('menuUpdated', fetchMenus);
    return () => window.removeEventListener('menuUpdated', fetchMenus);
  }, []);
  // ==========================================

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false); 
      } else {
        setIsSidebarOpen(true);  
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleNavigation = (path) => {
    if(path) navigate(path);
    if (isMobile) setIsSidebarOpen(false); 
  };

  const getMenuItemStyle = (path, isGroup = false) => {
    const isActive = !isGroup && (location.pathname === path);
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '12px 20px', cursor: 'pointer', transition: '0.2s',
      backgroundColor: isActive ? '#334155' : 'transparent',
      color: isActive ? '#f87171' : '#cbd5e1',
      borderLeft: isActive ? '4px solid #f87171' : '4px solid transparent',
    };
  };

  const getSubMenuItemStyle = (path) => {
    const isActive = location.pathname === path; 
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px 10px 50px', cursor: 'pointer', transition: '0.2s', fontSize: '14px',
      backgroundColor: isActive ? '#334155' : 'transparent',
      color: isActive ? '#f87171' : '#94a3b8',
      borderLeft: isActive ? '4px solid #f87171' : '4px solid transparent',
    };
  };

  const NotificationBadge = ({ count }) => (
    <span style={{
      backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold',
      padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
      boxShadow: '0 0 5px rgba(239, 68, 68, 0.4)'
    }}>
      {count}
    </span>
  );

  const mainMenus = dynamicMenus.filter(m => m.parentId === null);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, animation: 'fadeIn 0.2s' }}
        />
      )}

      {/* Sidebar */}
      <div style={{ 
        width: '280px', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative', top: 0, bottom: 0, left: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out', zIndex: 50
      }}>
        <div style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #334155', color: '#f87171', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          SALAPI ADMIN
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><X size={24} /></button>
          )}
        </div>
        
        <div style={{ padding: '10px 0', flexGrow: 1, overflowY: 'auto' }}>
          {mainMenus.map(mainMenu => {
            const children = dynamicMenus.filter(m => m.parentId === mainMenu.id);
            const hasChildren = children.length > 0;
            const IconComponent = iconMap[mainMenu.icon] || Circle;

            return (
              <div key={mainMenu.id}>
                <div 
                  style={getMenuItemStyle(mainMenu.path, hasChildren)} 
                  onClick={() => hasChildren ? toggleMenu(`menu-${mainMenu.id}`) : handleNavigation(mainMenu.path)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComponent size={20} /> 
                    {mainMenu.title}
                    {mainMenu.showNotification && <NotificationBadge count={3} />}
                  </div>
                  {hasChildren && (openMenus[`menu-${mainMenu.id}`] ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                </div>

                {hasChildren && openMenus[`menu-${mainMenu.id}`] && (
                  <div style={{ backgroundColor: '#0f172a' }}>
                    {children.map(child => (
                      <div key={child.id} style={getSubMenuItemStyle(child.path)} onClick={() => handleNavigation(child.path)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          - {child.title}
                        </div>
                        {child.showNotification && <NotificationBadge count={5} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#94a3b8' }}>
            <LogOut size={20} /> ออกจากระบบ
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: isMobile ? '100%' : 'calc(100% - 280px)' }}>
        
        <div style={{ height: '65px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Menu size={24} color="#1e293b" />
              </button>
            )}
            {!isMobile && <h3 style={{ margin: 0, color: '#1e293b' }}>ระบบจัดการหลังบ้าน</h3>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
              <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>ซุปเปอร์ ผู้ดูแลระบบ</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Super Admin</div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#f87171', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
              ซ
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '15px' : '25px', overflowY: 'auto', flexGrow: 1 }}>
          <Outlet /> 
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;