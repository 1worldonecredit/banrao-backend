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
  
  // 🌟 ตัวแปรเก็บจำนวนแจ้งเตือน (คำขอเพิ่มบัญชีที่รอตรวจสอบ)
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
  // 🌟 2. API: ดึงจำนวนการแจ้งเตือนต่างๆ (Auto-Refresh ทุก 10 วินาที)
  // ==========================================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/user-banks`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            // นับเฉพาะรายการที่สถานะเป็น 'Pending' (รอตรวจสอบ)
            const count = result.data.filter(item => item.status === 'Pending').length;
            setPendingBankCount(count);
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications(); // ดึงครั้งแรกเมื่อโหลดหน้า
    const interval = setInterval(fetchNotifications, 10000); // ตั้งเวลาดึงซ้ำทุกๆ 10 วินาที
    return () => clearInterval(interval); // ทำลายทิ้งเมื่อปิดหน้านี้ (ประหยัดแรม)
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

  // ==========================================
  // 🌟 3. จัดสไตล์เมนูหลัก (เปลี่ยนเป็นโทนสว่าง)
  // ==========================================
  const getMenuItemStyle = (path, isGroup = false) => {
    const isActive = !isGroup && (location.pathname === path);
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '12px 20px', cursor: 'pointer', transition: '0.2s',
      backgroundColor: isActive ? '#f1f5f9' : 'transparent', // พื้นหลังตอนเลือก (เทาอ่อน)
      color: isActive ? '#ef4444' : '#475569', // ตัวหนังสือ (สีแดงตอนเลือก / สีเทาเข้มตอนปกติ)
      borderLeft: isActive ? '4px solid #ef4444' : '4px solid transparent',
      fontWeight: isActive ? 'bold' : 'normal'
    };
  };

  // ==========================================
  // 🌟 4. จัดสไตล์เมนูย่อย (เปลี่ยนเป็นโทนสว่าง)
  // ==========================================
  const getSubMenuItemStyle = (path) => {
    const isActive = location.pathname === path; 
    return {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px 10px 50px', cursor: 'pointer', transition: '0.2s', fontSize: '14px',
      backgroundColor: isActive ? '#f8fafc' : 'transparent', // พื้นหลังเมนูย่อยตอนเลือก
      color: isActive ? '#ef4444' : '#64748b', 
      borderLeft: isActive ? '4px solid #ef4444' : '4px solid transparent',
      fontWeight: isActive ? 'bold' : 'normal'
    };
  };

  // Component สำหรับวาดป้ายแจ้งเตือน (สีแดง)
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

      {/* ========================================== */}
      {/* 🌟 Sidebar Area (เปลี่ยนพื้นหลังเป็นสีขาว) */}
      {/* ========================================== */}
      <div style={{ 
        width: '280px', 
        backgroundColor: '#ffffff', // <-- พื้นหลังสีขาว
        color: '#1e293b',           // <-- ตัวหนังสือสีเข้ม
        borderRight: '1px solid #e2e8f0', // <-- เส้นขอบขวาให้ดูมีมิติแยกกับเนื้อหา
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative', top: 0, bottom: 0, left: 0, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out', zIndex: 50
      }}>
        {/* หัว Sidebar โลโก้ */}
        <div style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          SALAPI ADMIN
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
          )}
        </div>
        
        {/* วนลูปวาดเมนู */}
        <div style={{ padding: '10px 0', flexGrow: 1, overflowY: 'auto' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconComponent size={20} /> 
                    {mainMenu.title}
                  </div>
                  {hasChildren && (openMenus[`menu-${mainMenu.id}`] ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                </div>

                {/* เมนูย่อย (ถ้ามี) */}
                {hasChildren && openMenus[`menu-${mainMenu.id}`] && (
                  <div style={{ backgroundColor: '#f8fafc', borderY: '1px solid #f1f5f9' }}>
                    {children.map(child => (
                      <div key={child.id} style={getSubMenuItemStyle(child.path)} onClick={() => handleNavigation(child.path)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          - {child.title}
                        </div>
                        
                        {/* ========================================== */}
                        {/* 🌟 5. การแสดงแจ้งเตือน (Notification Badge) */}
                        {/* ========================================== */}
                        {child.component === 'AccountBank' && pendingBankCount > 0 ? (
                          // ถ้าเป็นหน้า "คำขอเพิ่มบัญชีธนาคาร" และมีรายการรอตรวจ > 0 ให้โชว์เลขจริง
                          <NotificationBadge count={pendingBankCount} />
                        ) : child.showNotification ? (
                          // กรณีเมนูอื่นๆ ที่เปิดตั้งค่าให้โชว์ Notification (เช่น อนาคตทำแจ้งเตือนลูกค้าใหม่)
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

        {/* ปุ่มออกจากระบบ (ด้านล่างสุด) */}
        <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#64748b' }}>
            <LogOut size={20} /> ออกจากระบบ
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* Content Area (พื้นที่ด้านขวาสำหรับแสดงหน้าต่างๆ) */}
      {/* ========================================== */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: isMobile ? '100%' : 'calc(100% - 280px)' }}>
        
        {/* Top Navbar */}
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
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
              ซ
            </div>
          </div>
        </div>

        {/* พื้นที่สำหรับ Render หน้าลูก (Outlet) */}
        <div style={{ padding: isMobile ? '15px' : '25px', overflowY: 'auto', flexGrow: 1 }}>
          <Outlet /> 
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;