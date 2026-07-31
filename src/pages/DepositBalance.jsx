import React, { useState, useEffect } from 'react';
import { Save, FileText, CheckCircle, Clock, Calendar, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositBalance = () => {
  // ฟอร์ม State
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [amount, setAmount] = useState('');
  
  // วันที่ตั้งค่าเริ่มต้นเป็นวันนี้ เวลาว่างเปล่า
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [transferDate, setTransferDate] = useState(getTodayDate());
  const [transferTime, setTransferTime] = useState('');
  const adminName = "ผู้ดูแลระบบ"; // สามารถดึงจาก Context/LocalStorage ได้

  // รายงาน State
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ todayTotal: 0, monthlyTotal: 0 });
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBanks();
    fetchReport();
  }, []);

  const fetchBanks = async () => {
    const res = await fetch(`${API_URL}/api/admin/banks`);
    const data = await res.json();
    if (data.success) setBanks(data.banks);
  };

  const fetchReport = async () => {
    const res = await fetch(`${API_URL}/api/admin/statement-report?startDate=${startDate}&endDate=${endDate}`);
    const data = await res.json();
    if (data.success) {
      setRecords(data.records);
      setSummary({ todayTotal: data.todayTotal, monthlyTotal: data.monthlyTotal });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBank || !amount || !transferTime) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    const bankObj = banks.find(b => b.bank_id.toString() === selectedBank);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/key-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: bankObj.bank_id,
          bankName: bankObj.bank_name,
          accountNumber: bankObj.account_number,
          amount: amount,
          transferDate: transferDate,
          transferTime: transferTime, // Format: HH:MM:SS
          adminName: adminName
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        // Reset Form
        setAmount('');
        setTransferTime('');
        fetchReport(); // โหลดข้อมูลใหม่
      } else {
        alert("เกิดข้อผิดพลาด: " + data.message);
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชัน Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('THSarabunNew', 'normal'); // หมายเหตุ: ต้องแนบฟอนต์ภาษาไทยถ้าต้องการให้แสดงผลภาษาไทยสมบูรณ์
    
    doc.setFontSize(18);
    doc.text(`Deposit Report (${startDate} to ${endDate})`, 14, 20);
    
    const tableColumn = ["ID", "Bank", "Account", "Amount", "Date", "Time", "Status", "Admin"];
    const tableRows = [];

    records.forEach(req => {
      const reqData = [
        req.statement_id,
        req.bank_name,
        req.account_number,
        req.amount,
        new Date(req.transfer_date).toLocaleDateString(),
        req.transfer_time,
        req.is_reconciled ? 'Matched' : 'Pending',
        req.recorded_by
      ];
      tableRows.push(reqData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [3, 105, 161] }
    });

    doc.save(`Deposit_Report_${startDate}_${endDate}.pdf`);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amt);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* สรุปยอดด้านบน */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '16px' }}>ยอดเงินฝากเข้า (วันนี้)</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>{formatCurrency(summary.todayTotal)} ฿</p>
        </div>
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '16px' }}>สรุปยอดรายเดือน (เดือนนี้)</h3>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>{formatCurrency(summary.monthlyTotal)} ฿</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* ฟอร์มคีย์ยอด */}
        <div style={{ flex: '0 0 350px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#111', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>คีย์ยอดเงินฝากเข้า</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>ธนาคารที่รับเงินโอน</label>
              <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <option value="">-- เลือกธนาคาร --</option>
                {banks.map(b => (
                  <option key={b.bank_id} value={b.bank_id}>{b.bank_name} ({b.account_number})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>จำนวนเงิน</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '18px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>วันที่ (ด/ว/ป)</label>
                <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>เวลา (hh:mm:ss)</label>
                {/* step="1" ช่วยให้ใส่ระดับวินาทีได้ */}
                <input type="time" step="1" value={transferTime} onChange={(e) => setTransferTime(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#0369a1', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <Save size={18} /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกยอดเงิน'}
            </button>
          </form>
        </div>

        {/* ตารางแสดงรายงานและตัวกรอง */}
        <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#111' }}>ประวัติคีย์ยอดและกระทบยอด</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <span>ถึง</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <button onClick={fetchReport} style={{ backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Filter size={14} /> กรองข้อมูล
                </button>
              </div>
            </div>
            
            <button onClick={exportPDF} style={{ backgroundColor: '#be123c', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Export PDF
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>วัน-เวลาโอน</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ธนาคาร / เลขบัญชี</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ยอดเงิน</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>สถานะจับคู่</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{new Date(r.transfer_date).toLocaleDateString('th-TH')} <br/><span style={{color: '#666'}}>{r.transfer_time}</span></td>
                  <td style={{ padding: '12px' }}>{r.bank_name} <br/><span style={{fontSize: '12px', color: '#888'}}>{r.account_number}</span></td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>{formatCurrency(r.amount)}</td>
                  <td style={{ padding: '12px' }}>
                    {r.is_reconciled ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> อนุมัติแล้ว
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> รอจับคู่
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{r.recorded_by}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>ไม่มีข้อมูลในช่วงวันที่เลือก</td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default DepositBalance;