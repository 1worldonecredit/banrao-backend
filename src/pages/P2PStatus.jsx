import React, { useState, useMemo, useEffect } from 'react';

// กำหนด API_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

// --- Helper: ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (Asia/Bangkok) ---
const getTodayInThailand = () => {
  const thaiTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const yyyy = thaiTime.getFullYear();
  const mm = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const dd = String(thaiTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// --- Helper: แปลงวันที่ YYYY-MM-DD เป็นอ็อบเจกต์ ---
const parseDateValue = (dateString) => {
  if (!dateString) return { day: '', month: '', year: '' };
  const [y, m, d] = dateString.split('-');
  return { day: parseInt(d, 10), month: parseInt(m, 10) - 1, year: parseInt(y, 10) + 543 };
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const generateYears = () => {
  const currentYearBE = new Date().getFullYear() + 543;
  const years = [];
  for (let i = 0; i < 10; i++) years.push(currentYearBE - i);
  return years;
};

// --- คอมโพเนนต์เลือกวันที่แบบไทย ---
const ThaiDatePicker = ({ label, dateValue, setDateValue }) => {
  // แก้ไข warning hook ด้วยการดึงค่าเริ่มต้นนอก useMemo
  const initialDate = parseDateValue(dateValue);
  const [day, setDay] = React.useState(initialDate.day);
  const [month, setMonth] = React.useState(initialDate.month);
  const [year, setYear] = React.useState(initialDate.year);

  React.useEffect(() => {
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
        {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <select style={selectStyle} value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="">เดือน</option>
        {THAI_MONTHS.map((m, index) => <option key={index} value={index}>{m}</option>)}
      </select>
      <select style={selectStyle} value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">ปี (พ.ศ.)</option>
        {generateYears().map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

// --- Helper: แปลงฟอร์แมตวันที่สำหรับแสดงผลตาราง ---
const formatDateThai = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const P2PStatus = () => {
    const [startDate, setStartDate] = useState(getTodayInThailand());
    const [endDate, setEndDate] = useState(getTodayInThailand());
    const [mainTab, setMainTab] = useState('requests');
    const [subTab, setSubTab] = useState('all');

    // State สำหรับเก็บข้อมูลจาก API
    const [reportData, setReportData] = useState({ requests: [], jobs: [], adminAlertJobs: [], summary: { totalDeposit: 0, totalWithdraw: 0 } });
    const [loading, setLoading] = useState(false);
    
    // State สำหรับเวลานับถอยหลัง
    const [now, setNow] = useState(new Date().getTime());

    // 1. Fetch ข้อมูลจาก API เมื่อวันที่เปลี่ยน
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                // แก้ไขโดยใส่ API_URL นำหน้า
                const response = await fetch(`${API_URL}/api/admin/p2p-report?start_date=${startDate}&end_date=${endDate}`);
                const data = await response.json();
                
                if (data.success) {
                    setReportData(data.data);
                } else {
                    console.error("Failed to fetch report data:", data.message);
                }
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        // ตรวจสอบว่ามีวันที่ครบถึงค่อยเรียก API
        if (startDate && endDate) {
             fetchReportData();
        }
    }, [startDate, endDate]);

    // 2. Timer อัปเดตเวลาปัจจุบัน
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ฟังก์ชันคำนวณเวลาที่เหลือ
    const getCountdown = (expireAtString) => {
        if (!expireAtString) return '-';
        const expireAt = new Date(expireAtString).getTime(); // แปลง timestamp จาก DB
        const diff = expireAt - now;
        if (diff <= 0) return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>หมดเวลา</span>;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return <span style={{ color: '#eab308', fontWeight: 'bold' }}>{`${minutes} นาที ${seconds} วิ`}</span>;
    };


    // 3. ปรับ Logic การดึง SubTab Data ให้ใช้ข้อมูลจาก reportData
    const getSubTabData = () => {
        if (mainTab === 'requests') {
            if (subTab === 'all') return reportData.requests || [];
            if (subTab === 'success') return (reportData.requests || []).filter(item => item.status === 'COMPLETED');
        }
        if (mainTab === 'jobs') {
            if (subTab === 'all_deposit') return (reportData.jobs || []).filter(item => item.type === 'deposit');
            if (subTab === 'all_withdraw') return (reportData.jobs || []).filter(item => item.type === 'withdraw');
            if (subTab === 'success') return (reportData.jobs || []).filter(item => item.status === 'COMPLETED');
            if (subTab === 'failed') return (reportData.jobs || []).filter(item => item.status === 'CANCELLED');
        }
        return [];
    };

    const displayData = getSubTabData();

    // ดึงตัวแปรที่ใช้แสดงผลออกมาเพื่อป้องกัน Error ตอน Render
    const adminAlertJobs = reportData.adminAlertJobs || [];
    const totalDeposit = reportData.summary?.totalDeposit || 0;
    const totalWithdraw = reportData.summary?.totalWithdraw || 0;

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
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
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
                      <td style={styles.td}>{Number(row.amount).toLocaleString()}</td>
                      <td style={styles.td}>{row.requester}</td>
                      <td style={styles.td}>{row.receiver || '-'}</td>
                      <td style={styles.td}>
                        {row.status === 'PENDING' ? getCountdown(row.expires_at) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                          backgroundColor: row.status === 'COMPLETED' ? '#dcfce7' : row.status === 'CANCELLED' ? '#fee2e2' : '#fef9c3',
                          color: row.status === 'COMPLETED' ? '#166534' : row.status === 'CANCELLED' ? '#991b1b' : '#854d0e'
                        }}>
                          {row.status === 'COMPLETED' ? 'สำเร็จ' : row.status === 'CANCELLED' ? 'ยกเลิก' : row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayData.length === 0 && <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>ไม่พบข้อมูล (ไม่มีรายการในวันที่เลือก)</td></tr>}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default P2PStatus;