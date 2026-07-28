import React, { useState } from 'react';
import { Users, UserPlus, MapPin, Search, Filter, MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';

// 🌟 Mockup Data (จำลองข้อมูลลูกค้า)
// ตั้งค่าวันที่วันนี้เป็น 28/07/2026 ตามเวลาปัจจุบัน
const TODAY_DATE = '2026-07-28';

const mockCustomers = [
  { id: 'CUS-2607001', name: 'บริษัท แสนดี โฮลดิ้งส์ จำกัด', contact: '02-123-4567', country: 'ไทย', regDate: '2026-07-28', status: 'Active', type: 'นิติบุคคล' },
  { id: 'CUS-2607002', name: 'ຮ້ານສະບາຍດີ ການຄ້າ (Sabaidee Trading)', contact: '+856 20 1234 5678', country: 'ลาว', regDate: '2026-07-28', status: 'Active', type: 'นิติบุคคล' },
  { id: 'CUS-2607003', name: 'สมปอง ยอดเยี่ยม', contact: '089-999-8888', country: 'ไทย', regDate: '2026-07-28', status: 'Pending', type: 'บุคคลธรรมดา' },
  { id: 'CUS-2607004', name: 'บริษัท เจริญรุ่งเรือง กรุ๊ป', contact: '02-987-6543', country: 'ไทย', regDate: '2026-07-25', status: 'Active', type: 'นิติบุคคล' },
  { id: 'CUS-2607005', name: 'ໂຮງແຮມລ້ານຊ້າງ (Lane Xang Hotel)', contact: '+856 21 212 444', country: 'ลาว', regDate: '2026-07-20', status: 'Active', type: 'นิติบุคคล' },
  { id: 'CUS-2607006', name: 'มาลี สวยเสมอ', contact: '081-111-2222', country: 'ไทย', regDate: '2026-07-15', status: 'Inactive', type: 'บุคคลธรรมดา' },
];

const CustomerList = () => {
  const [filter, setFilter] = useState('all'); // all, today, th, la
  const [searchTerm, setSearchTerm] = useState('');

  // 🌟 คำนวณสรุปข้อมูล (KPIs)
  const stats = {
    total: mockCustomers.length,
    today: mockCustomers.filter(c => c.regDate === TODAY_DATE).length,
    thai: mockCustomers.filter(c => c.country === 'ไทย').length,
    laos: mockCustomers.filter(c => c.country === 'ลาว').length,
  };

  // 🌟 ฟังก์ชันกรองข้อมูลตาราง
  const filteredCustomers = mockCustomers.filter(customer => {
    // กรองตามปุ่ม Tab
    if (filter === 'today' && customer.regDate !== TODAY_DATE) return false;
    if (filter === 'th' && customer.country !== 'ไทย') return false;
    if (filter === 'la' && customer.country !== 'ลาว') return false;
    
    // กรองตามช่องค้นหา (ชื่อ หรือ ID)
    if (searchTerm && !customer.name.includes(searchTerm) && !customer.id.includes(searchTerm)) {
      return false;
    }
    
    return true;
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      
      {/* 🌟 Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="#3b82f6" /> ระบบบริหารจัดการลูกค้า
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>ภาพรวมและรายชื่อลูกค้าทั้งหมดในระบบ</p>
        </div>
        <button style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <UserPlus size={18} /> ลงทะเบียนลูกค้าใหม่
        </button>
      </div>

      {/* 🌟 KPI Cards (สรุปข้อมูลด้านบน) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>ลูกค้าทั้งหมด (Total)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.total} <span style={{fontSize:'14px', fontWeight:'normal', color:'#94a3b8'}}>ราย</span></div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>ลงทะเบียนวันนี้ (Today)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {stats.today} <span style={{fontSize:'12px', backgroundColor:'#d1fae5', color:'#059669', padding:'2px 8px', borderRadius:'10px'}}>New</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>ลูกค้าประเทศไทย (TH)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.thai} <span style={{fontSize:'14px', fontWeight:'normal', color:'#94a3b8'}}>ราย</span></div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>ลูกค้าประเทศลาว (LA)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.laos} <span style={{fontSize:'14px', fontWeight:'normal', color:'#94a3b8'}}>ราย</span></div>
        </div>
      </div>

      {/* 🌟 พื้นที่ตารางข้อมูล */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* แถบเครื่องมือ (Toolbar) */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          
          {/* ปุ่ม Filter กรองข้อมูล */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: filter === 'all' ? '#1e293b' : 'white', color: filter === 'all' ? 'white' : '#475569', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}>
              ทั้งหมด
            </button>
            <button onClick={() => setFilter('today')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: filter === 'today' ? '#10b981' : 'white', color: filter === 'today' ? 'white' : '#475569', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}>
              วันนี้
            </button>
            <button onClick={() => setFilter('th')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: filter === 'th' ? '#3b82f6' : 'white', color: filter === 'th' ? 'white' : '#475569', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}>
              ไทย (TH)
            </button>
            <button onClick={() => setFilter('la')} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: filter === 'la' ? '#ef4444' : 'white', color: filter === 'la' ? 'white' : '#475569', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}>
              ลาว (LA)
            </button>
          </div>

          {/* ช่องค้นหา */}
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="ค้นหารหัส หรือ ชื่อลูกค้า..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* 🌟 ตาราง (Responsive เลื่อนซ้ายขวาได้) */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>รหัสลูกค้า</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>ชื่อลูกค้า / บริษัท</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>ข้อมูลติดต่อ</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>ประเทศ</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>วันที่ลงทะเบียน</th>
                <th style={{ padding: '15px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>สถานะ</th>
                <th style={{ padding: '15px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', transition: '0.2s' }}>
                    <td style={{ padding: '15px 20px', fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>{customer.id}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{customer.type}</div>
                    </td>
                    <td style={{ padding: '15px 20px', fontSize: '14px', color: '#475569' }}>{customer.contact}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold',
                        backgroundColor: customer.country === 'ไทย' ? '#eff6ff' : '#fef2f2',
                        color: customer.country === 'ไทย' ? '#2563eb' : '#dc2626'
                      }}>
                        <MapPin size={12} /> {customer.country}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', fontSize: '14px', color: '#475569' }}>
                      {customer.regDate}
                      {customer.regDate === TODAY_DATE && <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>ใหม่</span>}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      {customer.status === 'Active' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '12px' }}><CheckCircle2 size={14}/> Active</span>}
                      {customer.status === 'Pending' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '12px' }}><Circle size={14}/> Pending</span>}
                      {customer.status === 'Inactive' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '12px' }}><XCircle size={14}/> Inactive</span>}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CustomerList;