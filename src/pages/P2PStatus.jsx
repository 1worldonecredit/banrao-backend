import React, { useState, useMemo, useEffect } from 'react';

// --- Helper: ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (Asia/Bangkok) ---
const getTodayInThailand = () => {
  const thaiTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const yyyy = thaiTime.getFullYear();
  const mm = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const dd = String(thaiTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`; // รูปแบบ YYYY-MM-DD
};

// --- Helper: แปลงสตริงวันที่ (YYYY-MM-DD) เป็น วัน, เดือน (index), ปี (พ.ศ.) ---
const parseDateValue = (dateString) => {
  if (!dateString) return { day: '', month: '', year: '' };
  const [y, m, d] = dateString.split('-');
  return { 
    day: parseInt(d, 10), 
    month: parseInt(m, 10) - 1, 
    year: parseInt(y, 10) + 543 
  };
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const generateYears = () => {
  const currentYearBE = new Date().getFullYear() + 543;
  const years = [];
  for (let i = 0; i < 10; i++) { // ย้อนหลัง 10 ปี
    years.push(currentYearBE - i);
  }
  return years;
};

// --- คอมโพเนนต์เลือกวันที่แบบไทย ---
const ThaiDatePicker = ({ label, dateValue, setDateValue }) => {
  const initialDate = useMemo(() => parseDateValue(dateValue), []);
  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);

  // อัปเดตค่า dateValue เมื่อผู้ใช้เลือก วัน/เดือน/ปี ครบ
  useEffect(() => {
    if (day !== '' && month !== '' && year !== '') {
      const formattedMonth = String(Number(month) + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const gregorianYear = Number(year) - 543;
      setDateValue(`${gregorianYear}-${formattedMonth}-${formattedDay}`);
    } else {
      setDateValue('');
    }
  }, [day, month, year, setDateValue]);

  const selectStyle = { padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', marginRight: '5px' };

  return (
    <div>
      <label style={{ marginRight: '10px', color: '#475569' }}>{label}:</label>
      <select style={selectStyle} value={day} onChange={(e) => setDay(e.target.value)}>
        <option value="">วัน</option>
        {[...Array(31)].map((_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>
      <select style={selectStyle} value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="">เดือน</option>
        {THAI_MONTHS.map((m, index) => (
          <option key={index} value={index}>{m}</option>
        ))}
      </select>
      <select style={selectStyle} value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">ปี (พ.ศ.)</option>
        {generateYears().map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
};

// --- Mock Data ---
const mockCurrentTime = new Date().getTime(); 

const mockData = [
  { id: 'REQ001', type: 'deposit', amount: 5000, status: 'success', requester: 'user_somchai', receiver: 'agent_win', date: '2026-09-25' },
  { id: 'REQ002', type: 'withdraw', amount: 12000, status: 'pending', requester: 'user_mana', receiver: 'agent_win', date: '2026-09-26', expireAt: mockCurrentTime + (15 * 60000) },
  { id: 'REQ003', type: 'deposit', amount: 150000, status: 'pending', requester: 'user_suda', receiver: null, date: '2026-09-26', expireAt: mockCurrentTime + (5 * 60000) },
  { id: 'REQ004', type: 'deposit', amount: 2000, status: 'failed', requester: 'user_piti', receiver: 'agent_aom', date: '2026-09-25' },
  { id: 'REQ005', type: 'withdraw', amount: 8000, status: 'success', requester: 'user_chujai', receiver: 'agent_aom', date: '2026-09-26' },
  { id: 'REQ006', type: 'deposit', amount: 85000, status: 'pending', requester: 'user_nida', receiver: null, date: '2026-09-27', expireAt: mockCurrentTime + (2 * 60000) },
];

const MAX_USER_WALLET_CAPACITY = 50000;

const formatDateThai = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const P2PStatus = () => {
  const [mainTab, setMainTab] = useState('requests');
  const [subTab, setSubTab] = useState('all');
  
  // กำหนดค่าเริ่มต้นให้เป็นวันที่ปัจจุบัน (เวลาไทย)
  const [startDate, setStartDate] = useState(getTodayInThailand());
  const [endDate, setEndDate] = useState(getTodayInThailand());
  
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (expireAt) => {
    if (!expireAt) return '-';
    const diff = expireAt - now;
    if (diff <= 0) return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>หมดเวลา</span>;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return <span style={{ color: '#eab308', fontWeight: 'bold' }}>{`${minutes} นาที ${seconds} วิ`}</span>;
  };

  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      const itemDate = new Date(item.date);
      // ตั้งเวลาเริ่มต้นเป็น 00:00:00 และสิ้นสุดเป็น 23:59:59 เพื่อให้ครอบคลุมตลอดวัน
      const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date('2000-01-01');
      const end = endDate ? new Date(`${endDate}T23:59:59`) : new Date('2100-01-01');
      return itemDate >= start && itemDate <= end;
    });
  }, [startDate, endDate]);

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
  const totalDeposit = filteredData.filter(i => i.type === 'deposit' && i.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdraw = filteredData.filter(i => i.type === 'withdraw' && i.status === 'success').reduce((acc, curr) => acc + curr.amount, 0);

  const styles = {
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '20px' },
    btnGroup: { display: 'flex', gap: '10px', marginBottom: '15px' },
    btn: (isActive, isAlert) => ({
      padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
      backgroundColor: isActive ? (isAlert ? '#ef4444' : '#3b82f6') : '#f1f5f9',
      color: isActive ? 'white' : '#475569',
      transition: 'all 0.2s'
    }),
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    th: { padding: '12px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#1e293b', fontSize: '14px' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '14px' },
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>รายงานสรุปสถานะ P2P</h2>

      {/* Date Filter (Thai Format) - Defaults to Today */}
      <div style={styles.card}>
        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
          <ThaiDatePicker label="ตั้งแต่วันที่" dateValue={startDate} setDateValue={setStartDate} />
          <ThaiDatePicker label="ถึงวันที่" dateValue={endDate} setDateValue={setEndDate} />
        </div>
      </div>

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

      <div style={styles.card}>
        {mainTab === 'requests' && (
          <div style={styles.btnGroup}>
            <button style={styles.btn(subTab === 'all')} onClick={() => setSubTab('all')}>คำขอทั้งหมด</button>
            <button style={styles.btn(subTab === 'success')} onClick={() => setSubTab('success')}>คำขอที่สำเร็จ</button>
            <button style={styles.btn(subTab === 'summary')} onClick={() => setSubTab('summary')}>ยอดสรุปรายวัน</button>
          </div>
        )}

        {mainTab === 'jobs' && (
          <div style={styles.btnGroup}>
            <button style={styles.btn(subTab === 'all_deposit')} onClick={() => setSubTab('all_deposit')}>รับงานคำขอฝาก</button>
            <button style={styles.btn(subTab === 'all_withdraw')} onClick={() => setSubTab('all_withdraw')}>รับงานคำขอถอน</button>
            <button style={styles.btn(subTab === 'success')} onClick={() => setSubTab('success')}>รับงานที่สำเร็จ</button>
            <button style={styles.btn(subTab === 'failed')} onClick={() => setSubTab('failed')}>รับงานที่ไม่สำเร็จ</button>
          </div>
        )}

        {mainTab === 'alerts' ? (
          <div>
            <h4 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ รายการฝากที่ยอดเงินเกินกระเป๋าผู้ใช้งาน (Admin ต้องรับงานเอง)</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>วันที่</th>
                  <th style={styles.th}>รหัสคำขอ</th>
                  <th style={styles.th}>ผู้ขอ (Username)</th>
                  <th style={styles.th}>ยอดฝาก (บาท)</th>
                  <th style={styles.th}>เวลาเหลือ</th>
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
                    <td style={styles.td}>{job.status === 'pending' ? getCountdown(job.expireAt) : '-'}</td>
                    <td style={styles.td}>
                      <button style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Admin รับงาน
                      </button>
                    </td>
                  </tr>
                ))}
                {adminAlertJobs.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>ไม่มีรายการแจ้งเตือน</td></tr>}
              </tbody>
            </table>
          </div>
        ) : subTab === 'summary' ? (
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '25px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', flex: 1 }}>
              <h3 style={{ margin: 0, color: '#166534', fontSize: '16px' }}>ยอดฝากรวมที่สำเร็จ</h3>
              <h2 style={{ margin: '10px 0 0 0', color: '#15803d', fontSize: '28px' }}>{totalDeposit.toLocaleString()} บาท</h2>
            </div>
            <div style={{ padding: '25px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', flex: 1 }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '16px' }}>ยอดถอนรวมที่สำเร็จ</h3>
              <h2 style={{ margin: '10px 0 0 0', color: '#b91c1c', fontSize: '28px' }}>{totalWithdraw.toLocaleString()} บาท</h2>
            </div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>วันที่</th>
                <th style={styles.th}>รหัส</th>
                <th style={styles.th}>ประเภท</th>
                <th style={styles.th}>ยอดเงิน</th>
                <th style={styles.th}>ผู้ขอ (Username)</th>
                <th style={styles.th}>ผู้รับงาน</th>
                <th style={styles.th}>เวลาเหลือ</th>
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
                    {row.status === 'pending' ? getCountdown(row.expireAt) : <span style={{ color: '#94a3b8' }}>-</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                      backgroundColor: row.status === 'success' ? '#dcfce7' : row.status === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: row.status === 'success' ? '#166534' : row.status === 'failed' ? '#991b1b' : '#854d0e'
                    }}>
                      {row.status === 'success' ? 'สำเร็จ' : row.status === 'failed' ? 'ไม่สำเร็จ' : 'รอดำเนินการ'}
                    </span>
                  </td>
                </tr>
              ))}
              {displayData.length === 0 && <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>ไม่พบข้อมูล (ไม่มีรายการในวันที่เลือก)</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default P2PStatus;