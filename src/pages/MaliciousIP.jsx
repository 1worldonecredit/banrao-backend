import React from 'react';

const MaliciousIP = () => {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>IP ที่ต้องระวัง</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>IP ที่ต้องระวัง</h4>
        <p style={{ color: '#94a3b8' }}>IP ที่ต้องระวัง(กำลังพัฒนา...)</p>
        
        {/* อนาคตเราจะเอา IP ที่ต้องระวัง */}
      </div>
    </div>
  );
};

export default MaliciousIP ;