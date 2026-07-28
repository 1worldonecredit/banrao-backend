import React from 'react';

const AddBankSystem = () => {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>เพิ่มบัญชีธนาคารระบบ</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>ฟอร์มเพิ่มบัญชีธนาคาร</h4>
        <p style={{ color: '#94a3b8' }}>พื้นที่สำหรับสร้างฟอร์มกรอกข้อมูลธนาคารของระบบ (กำลังพัฒนา...)</p>
        
        {/* อนาคตเราจะเอา ฟอร์มกรอกชื่อบัญชี, เลขบัญชี, เลือกธนาคาร มาใส่ตรงนี้ครับ */}
      </div>
    </div>
  );
};

export default AddBankSystem;