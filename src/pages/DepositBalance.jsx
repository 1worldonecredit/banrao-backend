import React, { useState, useEffect } from 'react';
import { Save, FileText, CheckCircle, Clock, Filter, Edit, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositBalance = () => {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [amount, setAmount] = useState('');
  
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const [transferDate, setTransferDate] = useState(getTodayDate());
  const [transferTime, setTransferTime] = useState('');
  const adminName = "ผู้ดูแลระบบ";

  const [records, setRecords] = useState([]);
  const [summaryList, setSummaryList] = useState([]); 
  const [startDate, setStartDate] = useState(getTodayDate()); // 🌟 โชว์วันต่อวันเป็นค่าเริ่มต้น
  const [endDate, setEndDate] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState('pending'); // 🌟 ระบบแท็บ ('pending' หรือ 'completed')
  const [editingId, setEditingId] = useState(null); // 🌟 เก็บ ID รายการที่กำลังแก้ไข

  useEffect(() => {
    fetchBanks();
    fetchReport();
    // eslint-disable-next-line
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/banks`);
      const data = await res.json();
      if (data.success) setBanks(data.banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/statement-report?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setSummaryList(data.summary || []);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  // 🌟 ฟังก์ชันดึงข้อมูลมาใส่ฟอร์มเพื่อแก้ไข
  const handleEditClick = (record) => {
    setEditingId(record.statement_id);
    setSelectedBank(record.bank_id.toString());
    setAmount(record.amount);
    setTransferDate(new Date(record.transfer_date).toISOString().split('T')[0]);
    
    // แปลงเวลาให้เข้ากับ input type="time"
    let timeStr = record.transfer_time;
    if (record.time_formatted) timeStr = record.time_formatted;
    else if (timeStr.includes('T')) timeStr = new Date(timeStr).toISOString().substring(11, 19);
    setTransferTime(timeStr);
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนจอขึ้นไปที่ฟอร์ม
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedBank('');
    setAmount('');
    setTransferTime('');
    setTransferDate(getTodayDate());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBank || !amount || !transferTime) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    
    const bankObj = banks.find(b => b.bank_id.toString() === selectedBank);
    setIsSubmitting(true);

    try {
      // 🌟 เลือกว่าจะส่งไป API สร้างใหม่ หรือ API แก้ไข
      const url = editingId 
        ? `${API_URL}/api/admin/key-statement/${editingId}`
        : `${API_URL}/api/admin/key-statement`;
        
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: bankObj.bank_id,
          bankName: bankObj.bank_name,
          accountNumber: bankObj.account_number,
          amount: amount,
          transferDate: transferDate,
          transferTime: transferTime,
          adminName: adminName
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        cancelEdit(); // เคลียร์ฟอร์ม
        fetchReport(); 
      } else {
        alert("เกิดข้อผิดพลาด: " + data.message);
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amt);

  // 🌟 กรองข้อมูลตามแท็บที่เลือก
  const filteredRecords = records.filter(r => activeTab === 'pending' ? !r.is_reconciled : r.is_reconciled);

  // ... (ฟังก์ชัน exportPDF ไว้เหมือนเดิม) ...
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFont('THSarabunNew', 'normal');
    doc.setFontSize(18);
    doc.text(`Deposit Report (${startDate} to ${endDate})`, 14, 20);
    const tableColumn = ["ID", "Bank", "Account", "Amount", "Date", "Time", "Status"];
    const tableRows = [];
    filteredRecords.forEach(req => {
      tableRows.push([req.statement_id, req.bank_name, req.account_number, req.amount, new Date(req.transfer_date).toLocaleDateString('th-TH'), req.time_formatted || req.transfer_time, req.is_reconciled ? 'Matched' : 'Pending']);
    });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30, styles: { fontSize: 10 } });
    doc.save(`Deposit_${activeTab}_${startDate}.pdf`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', width: '100%', boxSizing: 'border-box' }}>
      
      {/* กล่องสรุปยอด */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        {summaryList.length === 0 ? (
           <p style={{ margin: 0, color: '#6b7280' }}>ยังไม่มีข้อมูลสรุปยอด</p>
        ) : (
          summaryList.map((acc, idx) => {
            const isLAK = acc.currency === 'LAK';
            return (
              <div key={idx} style={{ flex: '1 1 300px', backgroundColor: isLAK ? '#fffbeb' : '#f0fdf4', border: `1px solid ${isLAK ? '#fde68a' : '#bbf7d0'}`, padding: '20px', borderRadius: '12px' }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: 'bold' }}>{acc.bank_name} <br/><span style={{fontSize: '13px', color: '#666', fontWeight: 'normal'}}>({acc.account_number})</span></h2>
                <h3 style={{ margin: '0 0 5px 0', color: isLAK ? '#b45309' : '#15803d', fontSize: '14px' }}>ยอดรับวันนี้ ({acc.currency})</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isLAK ? '#b45309' : '#15803d' }}>{formatCurrency(acc.todayTotal)}</p>
              </div>
            )
          })
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* 🌟 ฟอร์มคีย์ยอด / แก้ไข */}
        <div style={{ flex: '1 1 320px', maxWidth: '100%', backgroundColor: editingId ? '#fffbea' : 'white', padding: '20px', borderRadius: '12px', border: `1px solid ${editingId ? '#fde047' : '#e5e7eb'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: editingId ? '#a16207' : '#111', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            {editingId ? '✏️ แก้ไขรายการที่คีย์ผิด' : 'คีย์ยอดเงินฝากเข้า'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>ธนาคารที่รับเงินโอน</label>
              <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <option value="">-- เลือกธนาคาร --</option>
                {banks.map(b => <option key={b.bank_id} value={b.bank_id}>{b.bank_name} ({b.account_number})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>จำนวนเงิน</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>วันที่</label><input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>เวลา</label><input type="time" step="1" value={transferTime} onChange={(e) => setTransferTime(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} /></div>
            </div>

            {editingId ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, backgroundColor: '#ca8a04', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'อัปเดตข้อมูล'}
                </button>
                <button type="button" onClick={cancelEdit} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button type="submit" disabled={isSubmitting} style={{ backgroundColor: '#0369a1', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                <Save size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกยอดเงิน'}
              </button>
            )}
          </form>
        </div>

        {/* 🌟 ตารางประวัติ (มีแยกแท็บ และ ปุ่มแก้ไข) */}
        <div style={{ flex: '999 1 500px', maxWidth: '100%', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <h2 style={{ fontSize: '18px', margin: '0', color: '#111' }}>ประวัติคีย์ยอดและกระทบยอด</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <span>ถึง</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <button onClick={fetchReport} style={{ backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Filter size={16} style={{verticalAlign:'middle'}}/> กรอง</button>
            </div>
          </div>

          {/* 🌟 แท็บแยกประเภท */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
            <button onClick={() => setActiveTab('pending')} style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', fontWeight: 'bold', color: activeTab === 'pending' ? '#d97706' : '#6b7280', borderBottom: activeTab === 'pending' ? '3px solid #d97706' : 'none', cursor: 'pointer' }}>
              ⏳ รอกระทบยอด ({records.filter(r => !r.is_reconciled).length})
            </button>
            <button onClick={() => setActiveTab('completed')} style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: 'transparent', fontSize: '16px', fontWeight: 'bold', color: activeTab === 'completed' ? '#166534' : '#6b7280', borderBottom: activeTab === 'completed' ? '3px solid #166534' : 'none', cursor: 'pointer' }}>
              ✅ สำเร็จแล้ว ({records.filter(r => r.is_reconciled).length})
            </button>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>วัน-เวลาโอน</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ธนาคาร / เลขบัญชี</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>ยอดเงิน</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>สถานะ</th>
                  {activeTab === 'pending' && <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: editingId === r.statement_id ? '#fffbea' : 'transparent' }}>
                    <td style={{ padding: '12px' }}>{new Date(r.transfer_date).toLocaleDateString('th-TH')} <br/><span style={{color: '#666'}}>{r.time_formatted || r.transfer_time}</span></td>
                    <td style={{ padding: '12px' }}>{r.bank_name} <br/><span style={{fontSize: '12px', color: '#888'}}>{r.account_number}</span></td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0369a1' }}>{formatCurrency(r.amount)} {r.currency || 'THB'}</td>
                    <td style={{ padding: '12px' }}>
                      {r.is_reconciled ? (
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                          <CheckCircle size={12} style={{verticalAlign:'middle', marginRight:'4px'}}/> สำเร็จ
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                          <Clock size={12} style={{verticalAlign:'middle', marginRight:'4px'}}/> รอกระทบยอด
                        </span>
                      )}
                    </td>
                    
                    {/* 🌟 แสดงปุ่มแก้ไขเฉพาะแท็บรอกระทบยอด */}
                    {activeTab === 'pending' && (
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleEditClick(r)} style={{ backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Edit size={14} /> แก้ไข
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? "5" : "4"} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>ไม่มีข้อมูลในช่วงวันที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositBalance;