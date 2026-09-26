import React, { useState, useMemo, useEffect } from 'react';
// import ThaiDatePicker, formatDateThai, getTodayInThailand จากที่เคยทำไว้

const P2PStatus = () => {
    // ... State สำหรับ Tab และ DatePicker เหมือนเดิม ...
    const [startDate, setStartDate] = useState(getTodayInThailand());
    const [endDate, setEndDate] = useState(getTodayInThailand());

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
                // หากหน้าบ้านเรียก URL นี้ โดยส่ง startDate และ endDate ไปด้วย
                const response = await fetch(`/api/admin/p2p-report?start_date=${startDate}&end_date=${endDate}`);
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
            if (subTab === 'all') return reportData.requests;
            if (subTab === 'success') return reportData.requests.filter(item => item.status === 'COMPLETED');
        }
        if (mainTab === 'jobs') {
            if (subTab === 'all_deposit') return reportData.jobs.filter(item => item.type === 'deposit');
            if (subTab === 'all_withdraw') return reportData.jobs.filter(item => item.type === 'withdraw');
            if (subTab === 'success') return reportData.jobs.filter(item => item.status === 'COMPLETED');
            if (subTab === 'failed') return reportData.jobs.filter(item => item.status === 'CANCELLED');
        }
        return [];
    };

    const displayData = getSubTabData();

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