import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, LogOut, ChevronDown, ChevronRight, 
  Landmark, UserCog, Package, Users, WalletCards, 
  Menu, X, Circle, Settings 
} from 'lucide-react';

const iconMap = { LayoutDashboard, Landmark, UserCog, Package, Users, WalletCards, Settings };

// ==========================================
// 🌟 กำหนด URL สำหรับต่อ API
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company'; 

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [openMenus, setOpenMenus] = useState({});
  const [dynamicMenus, setDynamicMenus] = useState([]);
  
  // 🌟 ตัวแปรเก็บจำนวนแจ้งเตือน
  const [pendingBankCount, setPendingBankCount] = useState(0);

  // ==========================================
  // 🌟 1. API: ดึงโครงสร้างเมนูจากฐานข้อมูล
  // ==========================================
  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/menus`);
      if (response.ok) {
        const data = await response.json();
        setDynamicMenus(data);
        localStorage.setItem('system_menus', JSON.stringify(data));
      }
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลเมนูได้:', error);
    }
  };

  useEffect(() => {
    fetchMenus();
    window.addEventListener('menuUpdated', fetchMenus);
    return () => window.removeEventListener('menuUpdated', fetchMenus);
  }, []);

  // ==========================================
  // 🌟 2. API: ดึงจำนวนการแจ้งเตือนต่างๆ 
  // ==========================================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/user-banks`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            const count = result.data.filter(item => item.status === 'Pending').length;
            setPendingBankCount(count);
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval); 
  }, []);

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

  // ==========================================
  // 🌟 3. จัดสไตล์เมนูหลัก (โทนกระจก)
  // ==========================================
  const getMenuItemStyle = (path, isGroup = false) => {
    const isActive = !isGroup && (location.pathname === path);
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '12px 20px', cursor: 'pointer', transition: 'all 0.3s ease',
      // ปรับให้ตอน Hover หรือ Active เป็นสีสว่างโปร่งแสง และมีขอบมนเล็กน้อยให้ดูทันสมัย
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)', 
      borderLeft: isActive ? '4px solid #4ade80' : '4px solid transparent', // เส้นขอบสีเขียวเข้าธีม
      fontWeight: isActive ? '600' : 'normal',
      margin: '4px 8px', borderRadius: '8px' // เพิ่ม Margin ให้ปุ่มดูไม่ติดกันเกินไป
    };
  };

  // ==========================================
  // 🌟 4. จัดสไตล์เมนูย่อย (โทนกระจก)
  // ==========================================
  const getSubMenuItemStyle = (path) => {
    const isActive = location.pathname === path; 
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px 10px 45px', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px',
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent', 
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)', 
      borderLeft: isActive ? '4px solid #4ade80' : '4px solid transparent',
      fontWeight: isActive ? '600' : 'normal',
      margin: '2px 8px', borderRadius: '8px'
    };
  };

  const NotificationBadge = ({ count }) => (
    <span style={{
      backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold',
      padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center',
      boxShadow: '0 0 5px rgba(239, 68, 68, 0.6)'
    }}>
      {count}
    </span>
  );

  const mainMenus = dynamicMenus.filter(m => m.parentId === null);

  return (
    // เปลี่ยน Background หลักให้โปร่งใส (transparent) เพื่อโชว์ภาพพื้นหลังที่ตั้งไว้ใน CSS
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'transparent', fontFamily: 'var(--sans)', overflow: 'hidden' }}>
      
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ========================================== */}
      {/* 🌟 Sidebar Area (สไตล์ Glassmorphism) */}
      {/* ========================================== */}
      <div style={{ 
        width: '320px', 
        backgroundColor: 'rgba(10, 15, 25, 0.9)', // <-- เปลี่ยนเป็นสีเข้มโปร่งแสง
        backdropFilter: 'blur(20px)',             // <-- เอฟเฟกต์เบลอแบบกระจก
        WebkitBackdropFilter: 'blur(20px)',       // <-- รองรับ Safari
        color: '#ffffff',                         // <-- ตัวอักษรสีขาว
        borderRight: '1px solid rgba(255, 255, 255, 0.1)', // <-- เส้นขอบโปร่งแสงบางๆ
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative', top: 0, bottom: 0, left: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 50,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.2)' // เพิ่มเงาให้ลอยขึ้นมา
      }}>
        {/* หัว Sidebar โลโก้ */}
        <div style={{ padding: '24px 20px', fontSize: '22px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '1px' }}>
          SALAPI <span style={{color: '#4ade80'}}>ADMIN</span> {/* ตกแต่งโลโก้ให้สวยขึ้น */}
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex' }}><X size={20} /></button>
          )}
        </div>
        
        {/* วนลูปวาดเมนู */}
        <div style={{ padding: '15px 0', flexGrow: 1, overflowY: 'auto' }}>
          {mainMenus.map(mainMenu => {
            const children = dynamicMenus.filter(m => m.parentId === mainMenu.id);
            const hasChildren = children.length > 0;
            const IconComponent = iconMap[mainMenu.icon] || Circle;

            return (
              <div key={mainMenu.id}>
                {/* เมนูหลัก */}
                <div 
                  style={getMenuItemStyle(mainMenu.path, hasChildren)} 
                  onClick={() => hasChildren ? toggleMenu(`menu-${mainMenu.id}`) : handleNavigation(mainMenu.path)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconComponent size={20} style={{ opacity: 0.8 }} /> 
                    {mainMenu.title}
                  </div>
                  {hasChildren && (openMenus[`menu-${mainMenu.id}`] ? <ChevronDown size={18} style={{ opacity: 0.6 }} /> : <ChevronRight size={18} style={{ opacity: 0.6 }} />)}
                </div>

                {/* เมนูย่อย (ถ้ามี) */}
                {hasChildren && openMenus[`menu-${mainMenu.id}`] && (
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', padding: '4px 0', marginTop: '4px', borderRadius: '8px', marginInline: '8px' }}>
                    {children.map(child => (
                      <div key={child.id} style={getSubMenuItemStyle(child.path)} onClick={() => handleNavigation(child.path)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{opacity: 0.4, fontSize: '10px'}}>●</span> {child.title}
                        </div>
                        {child.component === 'AccountBank' && pendingBankCount > 0 ? (
                          <NotificationBadge count={pendingBankCount} />
                        ) : child.showNotification ? (
                          <NotificationBadge count={0} />
                        ) : null}
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
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.7)', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}>
            <LogOut size={20} /> ออกจากระบบ
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🌟 Content Area (ปรับให้โปร่งแสงเข้าธีม) */}
      {/* ========================================== */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: isMobile ? '100%' : 'calc(100% - 280px)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        
        {/* Top Navbar */}
        <div style={{ 
          height: '70px', 
          backgroundColor: 'rgba(62, 85, 131, 0.4)', // กล่องบนสุดโปร่งแสง
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
            {!isMobile && <h3 style={{ margin: 0, color: '#ffffff', fontWeight: '500' }}>Dashboard Overview</h3>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>ซุปเปอร์ ผู้ดูแลระบบ</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Super Admin</div>
            </div>
            <div style={{ width: '42px', height: '42px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', fontWeight: 'bold', boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)' }}>
              ซ
            </div>
          </div>
        </div>

        {/* พื้นที่สำหรับ Render หน้าลูก (Outlet) */}
        <div style={{ padding: isMobile ? '16px' : '32px', overflowY: 'auto', flexGrow: 1 }}>
          <Outlet /> 
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;