import React from 'react';
import { Building, Briefcase, Globe2, PlusCircle } from 'lucide-react';

const OrgStructure = () => {
  const CardHeader = ({ icon: Icon, title, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
        <Icon size={20} /> {title}
      </h3>
      <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
        <PlusCircle size={16} /> เพิ่มใหม่
      </button>
    </div>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>โครงสร้างองค์กร (Organization Structure)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* กล่องสาขาและประเทศ */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <CardHeader icon={Globe2} title="สาขา และ ประเทศ" color="#0ea5e9" />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
              <strong>TH:</strong> สำนักงานใหญ่ (กทม.)
            </li>
            <li style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
              <strong>LA:</strong> สาขาเวียงจันทน์
            </li>
          </ul>
        </div>

        {/* กล่องแผนก */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <CardHeader icon={Building} title="แผนกงาน (Departments)" color="#8b5cf6" />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {['ผู้บริหาร (Executive)', 'การเงิน (Finance)', 'บริการลูกค้า (CS)', 'เทคโนโลยี (IT)'].map((dept, idx) => (
              <li key={idx} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                {dept}
              </li>
            ))}
          </ul>
        </div>

        {/* กล่องตำแหน่งและฐานเงินเดือน */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <CardHeader icon={Briefcase} title="ตำแหน่ง & ฐานเงินเดือน" color="#f59e0b" />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>หัวหน้าฝ่ายบัญชี (FIN)</div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>ฐานเงินเดือน: 35,000 ฿ | OT: x1.5</div>
            </li>
            <li style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>พนักงานซัพพอร์ต (CS)</div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>รายชั่วโมง: 60 ฿/ชม. | OT: x1.5</div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default OrgStructure;