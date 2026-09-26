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
           {/* ... UI Components เหมือนเดิม (MainTab, SubTab, DatePicker) ... */}
           
           {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>
           ) : (
                // แสดงตารางข้อมูล (displayData, reportData.adminAlertJobs, reportData.summary) เหมือนที่เคยทำไว้
           )}
        </div>
    );
}

export default P2PStatus;