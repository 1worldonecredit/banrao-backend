import React, { useState, useMemo } from 'react';

// --- Mock Data ---
const mockData = [
  { id: 'REQ001', type: 'deposit', amount: 5000, status: 'success', requester: 'user_somchai', receiver: 'agent_win', date: '2026-09-25' },
  { id: 'REQ002', type: 'withdraw', amount: 12000, status: 'pending', requester: 'user_mana', receiver: 'agent_win', date: '2026-09-26' },
  { id: 'REQ003', type: 'deposit', amount: 150000, status: 'pending', requester: 'user_suda', receiver: null, date: '2026-09-26' }, // ยอดสูงเกินกระเป๋า
  { id: 'REQ004', type: 'deposit', amount: 2000, status: 'failed', requester: 'user_piti', receiver: 'agent_aom', date: '2026-09-25' },
  { id: 'REQ005', type: 'withdraw', amount: 8000, status: 'success', requester: 'user_chujai', receiver: 'agent_aom', date: '2026-09-26' },
  { id: 'REQ006', type: 'deposit', amount: 85000, status: 'pending', requester: 'user_nida', receiver: null, date: '2026-09-27' }, // ยอดสูงเกินกระเป๋า
];

// สมมติว่ากระเป๋าเงินผู้ใช้งานในระบบรับได้สูงสุด 50,000 บาทต่อคน (เพื่อใช้เป็นเกณฑ์เตือน Admin)
const MAX_USER_WALLET_CAPACITY = 50000;

// Helper แปลงวันที่เป็นภาษาไทย
const formatDateThai = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const P2PStatus = () => {
  const [mainTab, setMainTab] = useState('requests'); // requests, jobs, alerts
  const [subTab, setSubTab] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // กรองตามวันที่
  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      const itemDate = new Date(item.date);
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      return itemDate >= start && itemDate <= end;
    });
  }, [startDate, endDate]);

  // แยกข้อมูลตามเงื่อนไข
  const adminAlertJobs = filteredData.filter(item => item.type === 'deposit' && item.amount > MAX_USER_WALLET_CAPACITY);
  
  const getSubTabData = () => {
    if (mainTab === 'requests') {
      if (subTab === 'all') return filteredData;
      if (subTab === 'success') return filteredData.filter(item => item.status === 'success');
    }
    if (mainTab === 'jobs') {
      if (subTab === 'all_deposit') return filteredData.filter(item => item.type === 'deposit' && item.receiver);
      if (subTab === 'all_withdraw') return filteredData.filter(item => item.type === 'withdraw' && item.receiver);
      if (subTab === 'success') return filteredData.filter(item => item.status === 'success' && item.receiver);
      if (subTab === 'failed') return filteredData.filter(item => item.status === 'failed' && item.receiver);
    }
    return [];
  };

  const displayData = getSubTabData();

  // สรุปยอดรวม (สำหรับ Tab สรุปยอด)
  const totalDeposit = filteredData.filter(i => i.type === 'deposit' && i.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdraw = filteredData.filter(i => i.type === 'withdraw' && i.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);

  // สไตล์ CSS แบบ Inline เบื้องต้น
  const styles = {
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
    btnGroup: { display: 'flex', gap: '10px', marginBottom: '15px' },
    btn: (isActive, isAlert) => ({
      padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
      backgroundColor: isActive ? (isAlert ? '#ef4444' : '#3b82f6') : '#e2e8f0',
      color: isActive ? 'white' : '#475569',
    }),
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    th: { padding: '12px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#1e293b' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' },
    alertText: { color: '#ef4444', fontWeight: 'bold' }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>รายงานสรุปสถานะ P2P</h2>

      {/* ตัวกรองวันที่ */}
      <div style={styles.card}>
        <h4 style={{ margin: '0 0 15px 0' }}>กรองข้อมูลตามวันที่ (วัน เดือน ปี)</h4>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: '10px' }}>ตั้งแต่วันที่:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '5px' }} />
          </div>
          <div>
            <label style={{ marginRight: '10px' }}>ถึงวันที่:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '5px' }} />
          </div>
          {(startDate || endDate) && (
            <div style={{ color: '#059669', fontSize: '14px' }}>
              แสดงผล: {startDate ? formatDateThai(startDate) : 'เริ่มต้น'} - {endDate ? formatDateThai(endDate) : 'ปัจจุบัน'}
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div style={styles.btnGroup}>
        <button style={styles.btn(mainTab === 'requests')} onClick={() => { setMainTab('requests'); setSubTab('all'); }}>
          คำขอฝาก/ถอนทั้งหมด
        </button>
        <button style={styles.btn(mainTab === 'jobs')} onClick={() => { setMainTab('jobs'); setSubTab('all_deposit'); }}>
          การรับงาน (Jobs)
        </button>
        <button style={styles.btn(mainTab === 'alerts', true)} onClick={() => setMainTab('alerts')}>
          แจ้งเตือน Admin ({adminAlertJobs.length})
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.card}>
        
        {/* Sub Tabs for Requests */}
        {mainTab === 'requests' && (
          <div style={styles.btnGroup}>
            <button style={styles.btn(subTab === 'all')} onClick={() => setSubTab('all')}>คำขอทั้งหมด</button>
            <button style={styles.btn(subTab === 'success')} onClick={() => setSubTab('success')}>คำขอที่สำเร็จ</button>
            <button style={styles.btn(subTab === 'summary')} onClick={() => setSubTab('summary')}>ยอดสรุปรายวัน</button>
          </div>
        )}

        {/* Sub Tabs for Jobs */}
        {mainTab === 'jobs' && (
          <div style={styles.btnGroup}>
            <button style={styles.btn(subTab === 'all_deposit')} onClick={() => setSubTab('all_deposit')}>รับงานคำขอฝาก</button>
            <button style={styles.btn(subTab === 'all_withdraw')} onClick={() => setSubTab('all_withdraw')}>รับงานคำขอถอน</button>
            <button style={styles.btn(subTab === 'success')} onClick={() => setSubTab('success')}>รับงานที่สำเร็จ</button>
            <button style={styles.btn(subTab === 'failed')} onClick={() => setSubTab('failed')}>รับงานที่ไม่สำเร็จ</button>
          </div>
        )}

        {/* Tables */}
        {mainTab === 'alerts' ? (
          <div>
            <h4 style={styles.alertText}>⚠️ รายการฝากที่ยอดเงินเกินกระเป๋าผู้ใช้งาน (Admin ต้องรับงานเอง)</h4>
            <p>ระบบตรวจพบคำขอฝากที่ยอดเกิน {MAX_USER_WALLET_CAPACITY.toLocaleString()} บาท</p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>วันที่</th>
                  <th style={styles.th}>รหัสคำขอ</th>
                  <th style={styles.th}>ผู้ขอ (Username)</th>
                  <th style={styles.th}>ยอดฝาก (บาท)</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminAlertJobs.map(job => (
                  <tr key={job.id}>
                    <td style={styles.td}>{formatDateThai(job.date)}</td>
                    <td style={styles.td}>{job.id}</td>
                    <td style={styles.td}>{job.requester}</td>
                    <td style={{...styles.td, color: '#ef4444', fontWeight: 'bold'}}>{job.amount.toLocaleString()}</td>
                    <td style={styles.td}>
                      <button style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Admin กดรับงาน</button>
                    </td>
                  </tr>
                ))}
                {adminAlertJobs.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>ไม่มีรายการแจ้งเตือน</td></tr>}
              </tbody>
            </table>
          </div>
        ) : subTab === 'summary' ? (
          <div>
            <h4>ยอดสรุปมูลค่าคำขอที่สำเร็จตามช่วงเวลาที่เลือก</h4>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px', flex: 1 }}>
                <h3 style={{ margin: 0, color: '#166534' }}>ยอดฝากรวม</h3>
                <h2 style={{ margin: '10px 0 0 0', color: '#15803d' }}>{totalDeposit.toLocaleString()} บาท</h2>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fee2e2', borderRadius: '8px', flex: 1 }}>
                <h3 style={{ margin: 0, color: '#991b1b' }}>ยอดถอนรวม</h3>
                <h2 style={{ margin: '10px 0 0 0', color: '#b91c1c' }}>{totalWithdraw.toLocaleString()} บาท</h2>
              </div>
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>วันที่</th>
                <th style={styles.th}>รหัส</th>
                <th style={styles.th}>ประเภท</th>
                <th style={styles.th}>ยอดเงิน (บาท)</th>
                <th style={styles.th}>ผู้ขอ (Username)</th>
                <th style={styles.th}>ผู้รับงาน (Receiver)</th>
                <th style={styles.th}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map(row => (
                <tr key={row.id}>
                  <td style={styles.td}>{formatDateThai(row.date)}</td>
                  <td style={styles.td}>{row.id}</td>
                  <td style={styles.td}>{row.type === 'deposit' ? 'ฝาก' : 'ถอน'}</td>
                  <td style={styles.td}>{row.amount.toLocaleString()}</td>
                  <td style={styles.td}>{row.requester}</td>
                  <td style={styles.td}>{row.receiver || '-'}</td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                      backgroundColor: row.status === 'success' ? '#dcfce7' : row.status === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: row.status === 'success' ? '#166534' : row.status === 'failed' ? '#991b1b' : '#854d0e'
                    }}>
                      {row.status === 'success' ? 'สำเร็จ' : row.status === 'failed' ? 'ไม่สำเร็จ' : 'รอดำเนินการ'}
                    </span>
                  </td>
                </tr>
              ))}
              {displayData.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>ไม่พบข้อมูล</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default P2PStatus;