import React from 'react';

const SetNameSystem = () => {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>ตั้งชื่อระบบ</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>ตั้งชื่อระบบ</h4>
        <p style={{ color: '#94a3b8' }}>ตั้งชื่อระบบ(กำลังพัฒนา...)</p>
        
        {/* อนาคตเราจะเอา ตั้งชื่อระบบ */}
      </div>
    </div>
  );
};

export default SetNameSystem;