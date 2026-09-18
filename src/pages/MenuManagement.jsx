import React, { useState, useEffect } from 'react';
import { 
  ListTree, PlusCircle, Save, Trash2, Edit, X, Bell, 
  LayoutDashboard, Landmark, UserCog, Package, Users, WalletCards, 
  Settings, Building, ShieldCheck, DollarSign, CreditCard, FileText, Circle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';
const availableIcons = [
  { id: 'LayoutDashboard', name: 'แผงควบคุม', component: LayoutDashboard },
  { id: 'UserCog', name: 'จัดการผู้ใช้/พนักงาน', component: UserCog },
  { id: 'Users', name: 'กลุ่มลูกค้า/ผู้คน', component: Users },
  { id: 'Landmark', name: 'ธนาคาร/สถาบันการเงิน', component: Landmark },
  { id: 'Package', name: 'กล่องพัสดุ/สินค้า', component: Package },
  { id: 'WalletCards', name: 'กระเป๋าเงิน/บัตร', component: WalletCards },
  { id: 'CreditCard', name: 'การชำระเงิน', component: CreditCard },
  { id: 'DollarSign', name: 'การเงิน/รายได้', component: DollarSign },
  { id: 'Building', name: 'องค์กร/บริษัท', component: Building },
  { id: 'ShieldCheck', name: 'ความปลอดภัย/สิทธิ์', component: ShieldCheck },
  { id: 'FileText', name: 'เอกสาร/รายงาน', component: FileText },
  { id: 'Settings', name: 'ตั้งค่าระบบ', component: Settings },
];

const renderIcon = (iconName, size = 18) => {
  const iconObj = availableIcons.find(i => i.id === iconName);
  if (iconObj) {
    const IconComponent = iconObj.component;
    return <IconComponent size={size} />;
  }
  return <Circle size={size} color="#cbd5e1" />; 
};

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [formData, setFormData] = useState({ title: '', path: '', icon: '', parentId: '', component: '', showNotification: true });
  const [editingId, setEditingId] = useState(null);
  
  // 🌟 1. ดึงข้อมูลจาก API (Database) แทน LocalStorage
  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/menus`);
      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const mainMenus = menus.filter(m => m.parentId === null);

  const handleEdit = (menu) => {
    setEditingId(menu.id);
    setFormData({
      title: menu.title,
      path: menu.path || '',
      icon: menu.icon || '',
      parentId: menu.parentId ? menu.parentId.toString() : '',
      component: menu.component || '',
      showNotification: menu.showNotification !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', path: '', icon: '', parentId: '', component: '', showNotification: true });
  };

  // 🌟 2. บันทึก / แก้ไข ลง Database ผ่าน API
  const handleSave = async (e) => {
    e.preventDefault();

    if (formData.path && !formData.component) {
      if (!formData.parentId) {
        const confirmFolder = window.confirm('⚠️ คุณไม่ได้เลือกหน้าจอ Component \nเมนูนี้จะทำหน้าที่เป็น "หัวข้อหลัก" สำหรับกดกางเมนูลูกเท่านั้น \n\nยืนยันที่จะบันทึกหรือไม่?');
        if (!confirmFolder) return;
      } else {
        alert('❌ ผิดพลาด: เมนูลูกที่สามารถคลิกได้ ต้องเลือก "หน้าจอ (Component)" เสมอครับ');
        return;
      }
    }

    if (formData.component && !formData.path) {
      alert('❌ ผิดพลาด: หากมีการเลือกหน้าจอ Component ต้องระบุ "Path (URL)" ด้วยครับ');
      return;
    }

    const menuData = {
      title: formData.title,
      path: formData.path,
      icon: formData.icon,
      parentId: formData.parentId ? parseInt(formData.parentId) : null,
      component: formData.component || null,
      showNotification: formData.showNotification
    };

    try {
      const url = editingId 
       ? `${API_URL}/api/menus/${editingId}` // ถ้ามี ID (กำลังแก้ไข) ให้วิ่งไปเส้น PUT พร้อมแปะ ID ต่อท้าย
  :     `${API_URL}/api/menus`;             // ถ้าไม่มี ID (สร้างใหม่) ให้วิ่งไปเส้น POST ปกติ
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData)
      });

      if (response.ok) {
        await fetchMenus(); // โหลดข้อมูลใหม่จาก DB
        setFormData({ title: '', path: '', icon: '', parentId: '', component: '', showNotification: true });
        setEditingId(null); 
        
        window.dispatchEvent(new Event('menuUpdated')); // สั่งให้แถบซ้ายอัปเดตตาม
        alert(editingId ? '✅ แก้ไขเมนูสำเร็จ!' : '✅ บันทึกเมนูใหม่สำเร็จ!');
      } else {
        alert('❌ เกิดข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์');
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('❌ ไม่สามารถเชื่อมต่อกับ Database ได้ (เช็กว่ารัน Node.js หรือยัง)');
    }
  };

  // 🌟 3. ลบข้อมูลจาก Database ผ่าน API
  const handleDelete = async (id) => {
    if(window.confirm('คุณแน่ใจหรือไม่ที่จะลบเมนูนี้?')) {
      try {
        const response = await fetch(`${API_URL}/api/menus/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
          await fetchMenus(); // โหลดข้อมูลใหม่จาก DB
          window.dispatchEvent(new Event('menuUpdated')); 
          if (editingId === id) handleCancelEdit();
        }
      } catch (error) {
        console.error('API Error:', error);
      }
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <ListTree size={28} color="#8b5cf6" />
        <h2 style={{ margin: 0, color: '#d2fb0a' }}>จัดการโครงสร้างเมนู (Dynamic Menu)</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 350px', backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', alignSelf: 'flex-start' }}>
          
          <h4 style={{ margin: '0 0 20px 0', color: editingId ? '#3b82f6' : '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            {editingId ? <Edit size={18} color="#3b82f6" /> : <PlusCircle size={18} color="#10b981" />} 
            {editingId ? 'แก้ไขข้อมูลเมนู' : 'เพิ่มเมนูระบบ'}
          </h4>
          
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ระดับเมนู (หากต้องการสร้างเมนูลูก)</label>
              <select value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="">-- สร้างเป็นเมนูหลัก (Main Menu) --</option>
                {mainMenus.filter(m => m.id !== editingId).map(m => (
                  <option key={m.id} value={m.id}>เป็นเมนูลูกของ: {m.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>ชื่อเมนู *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="เช่น จัดการพนักงาน" />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>Path (URL)</label>
              <input type="text" value={formData.path} onChange={(e) => setFormData({...formData, path: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #086de7', outline: 'none' }} placeholder="เช่น /admin/employees" />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>เลือกหน้าจอ (Component)</label>
              <select 
                value={formData.component} 
                onChange={(e) => setFormData({...formData, component: e.target.value})} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #086de7', outline: 'none', backgroundColor: '#ebeaf3' }}
              >
                <option value="">-- ไม่ระบุ (ใช้สำหรับเมนูหลักที่มีลูก) --</option>
                <option value="Dashboard">หน้าแผงควบคุม (Dashboard)</option>
                <option value="EmployeeList">หน้ารายชื่อพนักงาน (EmployeeList)</option>
                <option value="OrgStructure">หน้าโครงสร้างองค์กร (OrgStructure)</option>
                <option value="UserPermissions">หน้ากำหนดสิทธิ์ (UserPermissions)</option>
                <option value="AddBankSystem">หน้าเพิ่มบัญชีระบบ (AddBankSystem)</option>
                <option value="ManageDeposit">หน้ารายการคำขอฝากเงิน(ManageDeposit)</option>
                <option value="AwardResults">ผลการออกหวยเวีบด (AwardResults)</option>
                <option value="DailySales">รายงานยอดขายรายวัน(DailySales)</option>
                <option value="AddNumberViet">เพิ่มเลขหวยเวียด(AddNumberViet)</option>
                <option value="CustomerList">หน้ารายชื่อลูกค้า (CustomerList)</option>
                <option value="AccountBank">หน้าตรวจสอบบัญชีธนาคาร (AccountBank)</option>
                <option value="DepositRequest">คำขอฝากเงิน(DepositRequest)</option>
                <option value= "CustomersRequestBook">คำขอเพิ่มบัญชีธนาคาร(CustomersRequestBook)</option>
                <option value="OverseeThePrize">จัดการออกเลข คั้งค่าควบคุม(OverseeThePrize)</option>
                <option value="CustomersWinning">ลูกค้าถูกเลข(CustomersWinning)</option>
                <option value="WithdrawalRequest">คำขอถอนเงิน(WithdrawalRequest)</option>
                <option value="ReportDeposit">รายงานสรุปเงินฝาก(ReportDeposit)</option>
                <option value="OderNumber">รายงานขายรายวัน(OderNumber)</option>
                <option value="ChatMessage">ข้อความพูดคุย(ChatMessage)</option>
                <option value="DepositBalance">คีย์ยอดฝากเงินที่ลูกค้าโอนมา (DepositBalance)</option>
                <option value="MaliciousIP">IP ที่ต้องระวัง(MaliciousIP)</option>
                <option value="LaosSalesReport">รายงานยอดขายในลาว(LaosSalesReport)</option>
                <option value="SetNameSystem">ตั้งขื่อระบบ(SetNameSystem)</option>
                <option value="PrizeTransferReport">รายงานโอนเงินรางวัลคนถูกหาย(PrizeTransferReport)</option>
                <option value="ProfitReport">รายงานผลกำไรรายวัน(ProfitReport)</option>
                <option value="ReceivingAccount">เพิ่มบัญชีรับเงินโอน(ReceivingAccount)</option>
                <option value="HRMResources">เพิ่มแผนก และตำแหน่งงาน(HRMResources)</option>
                <option value="CommissionSetting">ปรับ % Commission(CommissionSetting)</option>
                <option value="ManageYeeki">จัดการหวยซุปเปอร์ จับยี่กี(ManageYeeki)</option>
                <option value="AddNumberYeeki">จัดการเลขและเงินรางวัล หวยจับยี่กี(AddNumberYeeki)</option>
                <option value="SetTimeYeeki">ตั้งเวลา รอบหวยจับยี่กี(SetTimeYeeki)</option>
                <option value="YeekiSaleReport">รายงานขายหวยจับยี่กี(YeekiSaleReport)</option>
                <option value="AwardHistoryYeeki">ประวัติการออกเลข จับยี่กี(AwardHistoryYeeki)</option>
                <option value="SaleReportDetails">รายงานขายแต่ละรอบ(SaleReportDetails)</option>
                <option value="DailySaleThaiNumber">รายงานขายหวยไทย (DailySaleThaiNumber)</option>
                <option value="ManageThaiNumber">ตัดการควบคุมหวยไทย (ManageThaiNumber)</option>
                <option value="ThaiLotteryResults">เพิ่มผลออกเลขรางวัลหวยไทย (ThaiLotteryResults)</option>
                <option value="DepositPromotion">โปรโมชั่นฝากถอนเงิน P2P (DepositPromotion)</option>
                <option value="CommissionP2P">ปรับ Commission P2P (CommissionP2P)</option>
                <option value="SetTimeMission">ตั้งเวลาภารกิจ (SetTimeMission)</option>
                <option value="CustomerUnderSurveillance">รายชื่อลูกค้าเฝ่าระวัง (CustomerUnderSurveillance)</option>
                <option value="JobRecruitmentPost">โพ็สรับสมัครคนทำงานหน้าเว็บ (JobRecruitmentPost)</option>
                <option value="ListOfJobApplicants">รายชื่อคำขอสมัครงาน (ListOfJobApplicants)</option>
                <option value= "Profile">โปรไฟล์ (Profile)</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>เลือก Icon (เฉพาะเมนูหลัก)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', border: '1px solid #cbd5e1' }}>
                  {renderIcon(formData.icon, 20)}
                </div>
                <select 
                  disabled={formData.parentId !== ''} 
                  value={formData.icon} 
                  onChange={(e) => setFormData({...formData, icon: e.target.value})} 
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: formData.parentId ? '#f1f5f9' : 'white' }}
                >
                  <option value="">-- ไม่มี Icon --</option>
                  {availableIcons.map(icon => (
                    <option key={icon.id} value={icon.id}>{icon.name} ({icon.id})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '25px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={formData.showNotification} 
                  onChange={(e) => setFormData({...formData, showNotification: e.target.checked})} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                เปิดใช้งาน Badge แจ้งเตือน (Notification)
              </label>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '28px' }}>
                หากเปิดไว้ ระบบจะแสดงตัวเลขแจ้งเตือนงานใหม่หลังชื่อเมนู
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: editingId ? '#3b82f6' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเมนูลงในระบบ'}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <X size={18} /> ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{ flex: '2 1 400px', backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            โครงสร้างเมนูที่จะแสดงผลทางซ้ายมือ
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mainMenus.map(main => {
              const children = menus.filter(m => m.parentId === main.id);
              const isEditingThis = editingId === main.id;

              return (
                <div key={main.id} style={{ border: isEditingThis ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: isEditingThis ? '#eff6ff' : '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: '#f1f5fc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ color: '#8b5cf6' }}>{renderIcon(main.icon)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {main.title} 
                        {main.showNotification && <Bell size={14} color="#ef4444" />}
                        <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:'normal'}}>
                          {main.path ? `(${main.path})` : ''} 
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleEdit(main)} style={{ background:'white', border:'1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', color:'#3b82f6', cursor:'pointer' }}><Edit size={14}/></button>
                      <button onClick={() => handleDelete(main.id)} style={{ background:'white', border:'1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', color:'#ef4444', cursor:'pointer' }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  {children.length > 0 && (
                    <div style={{ marginLeft: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid #cbd5e1', paddingLeft: '20px' }}>
                      {children.map(child => {
                        const isEditingChild = editingId === child.id;
                        return (
                          <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#475569', backgroundColor: isEditingChild ? '#eff6ff' : 'transparent', padding: isEditingChild ? '4px 8px' : '0', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              - {child.title} 
                              {child.showNotification && <Bell size={14} color="#ef4444" />}
                              <span style={{fontSize:'12px', color:'#94a3b8'}}>
                                ({child.path})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => handleEdit(child)} style={{ background:'none', border:'none', color:'#3b82f6', cursor:'pointer', padding: 0 }}><Edit size={14}/></button>
                              <button onClick={() => handleDelete(child.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding: 0 }}><Trash2 size={14}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;