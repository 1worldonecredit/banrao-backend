import React from 'react';
import { useLocation } from 'react-router-dom';

// นำเข้าหน้าต่างๆ (เช็กให้ชัวร์ว่ามีไฟล์เหล่านี้อยู่ในโฟลเดอร์ pages ครบถ้วน)
import Dashboard from './Dashboard';
import MenuManagement from './MenuManagement';
import EmployeeList from './EmployeeList';
import OrgStructure from './OrgStructure';
import UserPermissions from './UserPermissions';
import AddBankSystem from './AddBankSystem';
import CustomerList from "./CustomerList";
import AccountBank from './AccountBank';
import ManageDeposit from './ManageDeposit';
import AddNumberViet from './AddNumberViet';
import AwardResults from './AwardResults';
import OverseeThePrize from './OverseeThePrize';
import DepositRequest from './DepositRequest';
import DailySales from './DailySales';
import CustomersRequestBook from './CustomersRequestBook';
import CustomersWinning  from './CustomersWinning';
import WithdrawalRequest from './WithdrawalRequest';
import ReportDeposit from './ReportDeposit';
import OderNumber from './OderNumber';
import ChatMessage from './ChatMessage';
import MaliciousIP from './MaliciousIP';
import DepositBalance from './DepositBalance';
import LaosSalesReport from './LaosSalesReport';
import SetNameSystem from './SetNameSystem';
import PrizeTransferReport from './PrizeTransferReport';
import ProfitReport from './ProfitReport';
import ReceivingAccount from './ReceivingAccount';
import HRMResources from './HRMResources';
import CommissionSetting from './CommissionSetting';
import SetTimeYeeki from './SetTimeYeeki';
import ManageYeeki from './ManageYeeki';
import AddNumberYeeki from './AddNumberYeeki';
import YeekiSaleReport from './YeekiSaleReport';
import AwardHistoryYeeki from './AwardHistoryYeeki';
import SaleReportDetails from './SaleReportDetails';
import ManageThaiNumber from './ManageThaiNumber';
import DailySaleThaiNumber from './DailySaleThaiNumber';
import ThaiLotteryResults from './ThaiLotteryResults';
import DepositPromotion from './DepositPromotion';
import CommissionP2P from './CommissionP2P';
import SetTimeMission from './SetTimeMission';
import CustomerUnderSurveillance from './CustomerUnderSurveillance';
import JobRecruitmentPost from './JobRecruitmentPost';
import ListOfJobApplicants from './ListOfJobApplicants';
import Profile from './Profile';
import P2PStatus from './P2PStatus';



// ลงทะเบียน Component
const componentsRegistry = {
  'Dashboard': Dashboard,
  'MenuManagement': MenuManagement,
  'EmployeeList': EmployeeList,
  'OrgStructure': OrgStructure,
  'UserPermissions': UserPermissions,
  'AddBankSystem': AddBankSystem,
  'CustomerList': CustomerList,
  'AccountBank': AccountBank,
  'ManageDeposit': ManageDeposit,
  'AddNumberViet': AddNumberViet,
  'AwardResults': AwardResults,
  'OverseeThePrize': OverseeThePrize,
  'DepositRequest': DepositRequest,
  'DailySales': DailySales,
  'CustomersRequestBook': CustomersRequestBook,
  'CustomersWinning': CustomersWinning ,
  'WithdrawalRequest': WithdrawalRequest,
  'ReportDeposit': ReportDeposit,
  'OderNumber': OderNumber,
  'ChatMessage': ChatMessage,
  'DepositBalance': DepositBalance,
  'MaliciousIP': MaliciousIP,
  'LaosSalesReport': LaosSalesReport,
  'SetNameSystem': SetNameSystem,
  'PrizeTransferReport': PrizeTransferReport,
  'ProfitReport': ProfitReport,
  'ReceivingAccount': ReceivingAccount,
  'HRMResources': HRMResources,
  'CommissionSetting': CommissionSetting,
  'AddNumberYeeki': AddNumberYeeki,
  'ManageYeeki': ManageYeeki,
  'SetTimeYeeki': SetTimeYeeki,
  'AwardHistoryYeeki': AwardHistoryYeeki,
  'YeekiSaleReport': YeekiSaleReport,
  'SaleReportDetails': SaleReportDetails,
  'ManageThaiNumber': ManageThaiNumber,
  'DailySaleThaiNumber': DailySaleThaiNumber,
  'ThaiLotteryResults': ThaiLotteryResults,
  'DepositPromotion': DepositPromotion,
  'CommissionP2P': CommissionP2P,
  'SetTimeMission': SetTimeMission,
  'CustomerUnderSurveillance': CustomerUnderSurveillance,
  'JobRecruitmentPost': JobRecruitmentPost,
  'ListOfJobApplicants': ListOfJobApplicants,
  'Profile': Profile,
  'P2PStatus': P2PStatus
};

export default function PageRouter() {
  const location = useLocation();
  const menus = JSON.parse(localStorage.getItem('system_menus') || '[]');

  // หาเมนูที่ตรงกับ URL ปัจจุบัน
  const currentMenu = menus.find(m => m.path === location.pathname);

  // ถ้าไม่เจอเมนูใน LocalStorage ให้แสดงหน้า 404
  if (!currentMenu || !currentMenu.component) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px' }}>
        <h2 style={{ color: '#ef4444' }}>404 - ไม่พบหน้าเว็บ (Page Not Found)</h2>
        <p style={{ color: '#64748b' }}>คุณกำลังพยายามเข้าถึง: <strong>{location.pathname}</strong></p>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>*หากคุณเพิ่งเพิ่มเมนู โปรดตรวจสอบว่าระบุ Component ถูกต้องหรือไม่</p>
      </div>
    );
  }

  // ดึงหน้า Component ออกมาแสดงผล
  const ComponentToRender = componentsRegistry[currentMenu.component];
  
  return ComponentToRender ? <ComponentToRender /> : (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h3 style={{ color: '#ef4444' }}>เกิดข้อผิดพลาด</h3>
      <p>ระบบพบชื่อ Component "<b>{currentMenu.component}</b>" ในเมนู แต่หาไฟล์ .jsx ไม่พบ</p>
    </div>
  );
}