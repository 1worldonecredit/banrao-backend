import React, { useState, useEffect } from 'react';
import { Eye, Search, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositRequest = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับ Popup
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false); // สำหรับขยายรูปสลิป
  
  // State สำหรับ Checkbox แจ้งข้อผิดพลาด
  const [rejectionReasons, setRejectionReasons] = useState({
    invalidSlip: false,
    amountMismatch: false,
    dateMismatch: false,
    timeMismatch: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  // ดึงข้อมูลรายการฝากที่รอตรวจสอบ
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-requests`); // ต้องสร้าง API นี้ใน Backend
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // เปิด Popup ดูรายละเอียด
  const handleViewDetails = (req) => {
    setSelectedRequest(req);
    setRejectionReasons({
      invalidSlip: false,
      amountMismatch: false,
      dateMismatch: false,
      timeMismatch: false
    });
    setIsModalOpen(true);
  };

  // จัดการการเปลี่ยนค่า Checkbox
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setRejectionReasons(prev => ({ ...prev, [name]: checked }));
  };

  // เช็กว่ามีการติ๊กข้อผิดพลาดหรือไม่
  const hasRejectionReasons = Object.values(rejectionReasons).some(value => value === true);

  // ฟังก์ชัน: ตรวจผ่าน (Approve)
  const handleApprove = async () => {
    if (!window.confirm("ยืนยันการ 'อนุมัติ' รายการนี้ และเติมเงินเข้ากระเป๋าลูกค้า?")) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId: selectedRequest.deposit_id, userId: selectedRequest.user_id, amount: selectedRequest.amount })
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ อนุมัติและเติมเงินสำเร็จ");
        setIsModalOpen(false);
        fetchRequests();
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsProcessing(false);
    }
  };

  // ฟังก์ชัน: ส่งกลับแก้ไข (Reject)
  const handleReject = async () => {
    if (!window.confirm("ยืนยันการ 'ส่งกลับแก้ไข' ใช่หรือไม่?")) return;
    
    // รวบรวมข้อความเหตุผลที่ติ๊กไว้
    let reasonsText = [];
    if (rejectionReasons.invalidSlip) reasonsText.push("สลิปไม่ถูกต้อง/ภาพไม่ชัด");
    if (rejectionReasons.amountMismatch) reasonsText.push("จำนวนเงินไม่ตรงกับสลิป");
    if (rejectionReasons.dateMismatch) reasonsText.push("วันที่โอนไม่ตรงกับสลิป");
    if (rejectionReasons.timeMismatch) reasonsText.push("เวลาโอนไม่ตรงกับสลิป");

    const finalReason = reasonsText.join(", ");

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId: selectedRequest.deposit_id, reason: finalReason })
      });
      const data = await response.json();
      if (data.success) {
        alert("⚠️ ส่งกลับให้ลูกค้าแก้ไขเรียบร้อยแล้ว");
        setIsModalOpen(false);
        fetchRequests();
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="app-container">
      <TopNavbar />
      <div className="main-content" style={{ padding: '20px', paddingBottom: '80px' }}>
        <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          รายการขอฝากเงิน (รอตรวจสอบ)
        </h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>กำลังโหลดข้อมูล...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#999', backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '12px' }}>
            ไม่มีรายการรอตรวจสอบ
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {requests.map((req) => (
              <div key={req.deposit_id} style={{ 
                backgroundColor: 'white', padding: '15px', borderRadius: '12px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '4px solid #eab308',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>ผู้ใช้: {req.customer_name}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                    {formatCurrency(req.amount)} {req.currency_code}
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                    เวลาแจ้ง: {new Date(req.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
                <button 
                  onClick={() => handleViewDetails(req)}
                  style={{ 
                    backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 15px', 
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                    fontWeight: 'bold', color: '#374151'
                  }}
                >
                  <Eye size={16} /> ตรวจสอบ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavbar />

      {/* =========================================================
          Popup (Modal): แสดงรายละเอียดและให้แอดมินตรวจสอบ
      ========================================================= */}
      {isModalOpen && selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '600px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>ตรวจสอบรายการฝากเงิน</h3>
              <X size={24} color="#666" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>

            {/* ข้อมูลการโอน (ฝั่งซ้าย-ขวา แบบแบ่งหน้าจอ) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}><strong>ผู้แจ้ง:</strong> {selectedRequest.customer_name} (ID: {selectedRequest.user_id})</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#666' }}>โอนเข้าธนาคาร:</span><br/>
                  <strong>{selectedRequest.bank_name}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>เลขบัญชีระบบ:</span><br/>
                  <strong>{selectedRequest.account_number}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>วันที่โอน (ตามที่แจ้ง):</span><br/>
                  <strong style={{ color: '#d97706' }}>{new Date(selectedRequest.deposit_datetime).toLocaleDateString('th-TH')}</strong>
                </div>
                <div>
                  <span style={{ color: '#666' }}>เวลาโอน (ตามที่แจ้ง):</span><br/>
                  <strong style={{ color: '#d97706' }}>{new Date(selectedRequest.deposit_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>ยอดเงินที่แจ้งโอน</span><br/>
                <strong style={{ fontSize: '28px', color: '#0369a1' }}>{formatCurrency(selectedRequest.amount)} {selectedRequest.currency_code}</strong>
              </div>
            </div>

            {/* รูปสลิป */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px' }}>หลักฐานการโอน (สลิป):</p>
              <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={selectedRequest.slip_image} alt="Slip" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#f0f0f0' }} />
                <button 
                  onClick={() => setIsPreviewImageOpen(true)}
                  style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <Search size={16} /> ขยายรูป
                </button>
              </div>
            </div>

            {/* Checkbox ตรวจสอบข้อผิดพลาด */}
            <div style={{ backgroundColor: '#fff1f2', padding: '15px', borderRadius: '12px', border: '1px solid #fecdd3', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#be185d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={18} /> หากข้อมูลไม่ถูกต้อง กรุณาติ๊กเลือกด้านล่าง
              </p>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="invalidSlip" checked={rejectionReasons.invalidSlip} onChange={handleCheckboxChange} style={{ transform: 'scale(1.3)' }} />
                <span style={{ fontSize: '14px', color: '#4c0519' }}>สลิปปลอม / ภาพสลิปไม่ถูกต้อง</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="amountMismatch" checked={rejectionReasons.amountMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.3)' }} />
                <span style={{ fontSize: '14px', color: '#4c0519' }}>จำนวนเงิน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="dateMismatch" checked={rejectionReasons.dateMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.3)' }} />
                <span style={{ fontSize: '14px', color: '#4c0519' }}>วันที่โอน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                <input type="checkbox" name="timeMismatch" checked={rejectionReasons.timeMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.3)' }} />
                <span style={{ fontSize: '14px', color: '#4c0519' }}>เวลาโอน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
            </div>

            {/* ปุ่ม Action (Approve / Reject) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* ปุ่มส่งกลับแก้ไข จะใช้ได้ก็ต่อเมื่อ "มีการติ๊กถูกอย่างน้อย 1 ข้อ" */}
              <button 
                onClick={handleReject} 
                disabled={!hasRejectionReasons || isProcessing}
                style={{ 
                  flex: 1, padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: hasRejectionReasons ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px',
                  backgroundColor: hasRejectionReasons ? '#ef4444' : '#f3f4f6', 
                  color: hasRejectionReasons ? 'white' : '#9ca3af'
                }}
              >
                <XCircle size={20} /> ส่งกลับให้ลูกค้าแก้ไข
              </button>

              {/* ปุ่มตรวจผ่าน จะใช้ได้ก็ต่อเมื่อ "ไม่ได้ติ๊กอะไรเลย" */}
              <button 
                onClick={handleApprove} 
                disabled={hasRejectionReasons || isProcessing}
                style={{ 
                  flex: 1, padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: !hasRejectionReasons ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px',
                  backgroundColor: !hasRejectionReasons ? '#22c55e' : '#f3f4f6', 
                  color: !hasRejectionReasons ? 'white' : '#9ca3af'
                }}
              >
                <CheckCircle size={20} /> ข้อมูลถูกต้อง (ตรวจผ่าน)
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* =========================================================
          Popup (Modal): ขยายรูปสลิปเต็มจอ
      ========================================================= */}
      {isPreviewImageOpen && selectedRequest && (
        <div 
          onClick={() => setIsPreviewImageOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', cursor: 'zoom-out' }}
        >
          <img src={selectedRequest.slip_image} alt="Slip Full" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}

    </div>
  );
};

export default DepositRequest;