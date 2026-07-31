import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositRequest = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับ Popup
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);
  
  // State สำหรับ Checkbox แจ้งข้อผิดพลาด
  const [rejectionReasons, setRejectionReasons] = useState({
    invalidSlip: false,
    amountMismatch: false,
    dateMismatch: false,
    timeMismatch: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-requests`);
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setRejectionReasons(prev => ({ ...prev, [name]: checked }));
  };

  const hasRejectionReasons = Object.values(rejectionReasons).some(value => value === true);

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

  const handleReject = async () => {
    if (!window.confirm("ยืนยันการ 'ส่งกลับแก้ไข' ใช่หรือไม่?")) return;
    
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>รายการขอฝากเงิน (รอตรวจสอบ)</h2>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>กำลังโหลดข้อมูล...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          ไม่มีรายการรอตรวจสอบ
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {requests.map((req) => (
            <div key={req.deposit_id} style={{ 
              backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#1f2937' }}>ผู้ใช้: {req.customer_name}</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0369a1' }}>
                  {formatCurrency(req.amount)} {req.currency_code}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  เวลาแจ้ง: {new Date(req.created_at).toLocaleString('th-TH')}
                </p>
              </div>
              <button 
                onClick={() => handleViewDetails(req)}
                style={{ 
                  backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '10px 20px', 
                  borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  fontWeight: '600', color: '#374151', fontSize: '14px'
                }}
              >
                <Eye size={18} /> ตรวจสอบ
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ==================== Modal Details ==================== */}
      {isModalOpen && selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '650px', borderRadius: '12px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#111' }}>ตรวจสอบรายการฝากเงิน</h3>
              <X size={24} color="#6b7280" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}><strong>ผู้แจ้ง:</strong> {selectedRequest.customer_name} (ID: {selectedRequest.user_id})</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div><span style={{ color: '#64748b' }}>โอนเข้าธนาคาร:</span><br/><strong>{selectedRequest.bank_name}</strong></div>
                <div><span style={{ color: '#64748b' }}>เลขบัญชีระบบ:</span><br/><strong>{selectedRequest.account_number}</strong></div>
                <div><span style={{ color: '#64748b' }}>วันที่โอน:</span><br/><strong style={{ color: '#b45309' }}>{new Date(selectedRequest.deposit_datetime).toLocaleDateString('th-TH')}</strong></div>
                <div><span style={{ color: '#64748b' }}>เวลาโอน:</span><br/><strong style={{ color: '#b45309' }}>{new Date(selectedRequest.deposit_datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</strong></div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '15px' }}>ยอดเงินที่แจ้งโอน</span><br/>
                <strong style={{ fontSize: '32px', color: '#0369a1' }}>{formatCurrency(selectedRequest.amount)} {selectedRequest.currency_code}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '15px' }}>หลักฐานการโอน (สลิป):</p>
              {/* 🌟 ปรับปรุงส่วนรูปภาพ: เปลี่ยนเมาส์เป็นแว่นขยาย และกดที่รูปได้เลย */}
              <div 
                onClick={() => setIsPreviewImageOpen(true)}
                title="คลิกเพื่อขยายรูปสลิป"
                style={{ 
                  position: 'relative', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  backgroundColor: '#f3f4f6', 
                  display: 'flex', 
                  justifyContent: 'center',
                  cursor: 'zoom-in' // เปลี่ยนเมาส์เป็นแว่นขยาย
                }}
              >
                <img 
                  src={selectedRequest.slip_image} 
                  alt="Slip" 
                  style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} 
                />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                * นำเมาส์วางและคลิกที่รูปเพื่อขยาย
              </p>
            </div>

            <div style={{ backgroundColor: '#fff1f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '25px' }}>
              <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#be185d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} /> หากข้อมูลไม่ถูกต้อง กรุณาติ๊กเลือกด้านล่าง
              </p>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="invalidSlip" checked={rejectionReasons.invalidSlip} onChange={handleCheckboxChange} style={{ transform: 'scale(1.4)' }} />
                <span style={{ fontSize: '15px', color: '#881337' }}>สลิปปลอม / ภาพสลิปไม่ถูกต้อง</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="amountMismatch" checked={rejectionReasons.amountMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.4)' }} />
                <span style={{ fontSize: '15px', color: '#881337' }}>จำนวนเงิน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="dateMismatch" checked={rejectionReasons.dateMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.4)' }} />
                <span style={{ fontSize: '15px', color: '#881337' }}>วันที่โอน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="timeMismatch" checked={rejectionReasons.timeMismatch} onChange={handleCheckboxChange} style={{ transform: 'scale(1.4)' }} />
                <span style={{ fontSize: '15px', color: '#881337' }}>เวลาโอน <b>ไม่ตรงกับ</b> ในสลิป</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={handleReject} 
                disabled={!hasRejectionReasons || isProcessing}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: hasRejectionReasons ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px',
                  backgroundColor: hasRejectionReasons ? '#ef4444' : '#f3f4f6', 
                  color: hasRejectionReasons ? 'white' : '#9ca3af'
                }}
              >
                <XCircle size={22} /> ส่งกลับให้ลูกค้าแก้ไข
              </button>

              <button 
                onClick={handleApprove} 
                disabled={hasRejectionReasons || isProcessing}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: !hasRejectionReasons ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px',
                  backgroundColor: !hasRejectionReasons ? '#22c55e' : '#f3f4f6', 
                  color: !hasRejectionReasons ? 'white' : '#9ca3af'
                }}
              >
                <CheckCircle size={22} /> ข้อมูลถูกต้อง (ตรวจผ่าน)
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ==================== Modal Preview Image ==================== */}
      {isPreviewImageOpen && selectedRequest && (
        <div 
          onClick={() => setIsPreviewImageOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', cursor: 'zoom-out' }}
          title="คลิกเพื่อปิด"
        >
          <img src={selectedRequest.slip_image} alt="Slip Full" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
        </div>
      )}

    </div>
  );
};

export default DepositRequest;