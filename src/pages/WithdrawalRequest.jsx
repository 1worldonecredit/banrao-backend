import React from 'react';

const WithdrawalRequest = () => {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>คำขอถอนเงิน</h2>
      
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>คำขอถอนเงิน</h4>
        <p style={{ color: '#94a3b8' }}>คำขอถอนเงิน(กำลังพัฒนา...)</p>
        
        {/* อนาคตเราจะเอา คำขอถอนเงิน */}
      </div>
    </div>
  );
};

export default WithdrawalRequest ;