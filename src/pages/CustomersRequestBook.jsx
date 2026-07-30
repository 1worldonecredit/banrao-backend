import React, { useState, useEffect } from 'react';

import { Search, CheckCircle, XCircle, AlertTriangle, ZoomIn, Clock, ChevronRight, CheckSquare, Square, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CustomersRequestBook = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับจัดการหน้าต่างรายละเอียด (Modal)
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // State สำหรับแว่นขยายดูรูป
  const [zoomedImage, setZoomedImage] = useState(null);

  // State เก็บค่าว่า "จุดไหนบ้างที่ไม่ผ่าน"
  const [invalidFields, setInvalidFields] = useState({
    accountNumber: false,
    currencyCode: false,
    passbookImage: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. ดึงข้อมูลคำขอที่สถานะเป็น 'Pending'
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // 🌟 ตรงนี้ใช้ API สมมติของฝั่ง Admin พี่อาจจะต้องไปสร้าง Route นี้ใน server.js อีกทีนะครับ
      const res = await fetch(`${API_URL}/api/admin/pending-banks`); 
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // เปิดดูรายละเอียด
  const handleViewDetails = (req) => {
    setSelectedRequest(req);
    // รีเซ็ตค่าการติ๊กผิดทุกครั้งที่เปิดบิลใหม่
    setInvalidFields({
      accountNumber: false,
      currencyCode: false,
      passbookImage: false
    });
  };

  // จัดการติ๊ก Checkbox "ไม่ผ่าน"
  const toggleInvalidField = (field) => {
    setInvalidFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // ตรวจสอบว่ามีจุดไหนโดนติ๊ก "ไม่ผ่าน" หรือไม่ (ถ้ามี = true)
  const hasErrors = invalidFields.accountNumber || invalidFields.currencyCode || invalidFields.passbookImage;

  // 🟢 ฟังก์ชัน อนุมัติผ่าน
  const handleApprove = async () => {
    if (hasErrors) return; // ป้องกันการกดผ่านถ้ามี error
    
    if (!window.confirm('ยืนยันอนุมัติบัญชีนี้ใช่หรือไม่?')) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/approve-bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_bank_id: selectedRequest.user_bank_id, status: 'Approved' })
      });
      const data = await res.json();
      if (data.success) {
        alert('อนุมัติบัญชีสำเร็จ');
        setSelectedRequest(null);
        fetchRequests(); // โหลดข้อมูลใหม่
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔴 ฟังก์ชัน ส่งกลับให้แก้ไข
  const handleReject = async () => {
    if (!hasErrors) {
      alert('กรุณาติ๊กเลือกรายการที่ไม่ผ่านอย่างน้อย 1 รายการ เพื่อระบุให้ลูกค้าทราบว่าต้องแก้อะไร');
      return;
    }

    if (!window.confirm('ยืนยันส่งเรื่องกลับให้ลูกค้าแก้ไขใช่หรือไม่?')) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/reject-bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_bank_id: selectedRequest.user_bank_id, 
          status: 'Rejected',
          errors: invalidFields // ส่งไปบอกหลังบ้านว่าอะไรผิดบ้าง ลูกค้าจะได้เห็น
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('ส่งเรื่องกลับให้ลูกค้าแก้ไขสำเร็จ');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="app-container" style={{ backgroundColor: '#f9fafb', minHeight: '100vh', position: 'relative' }}>
      <TopNavbar />

      <div style={{ padding: '20px' }}>
        
        {/* ส่วนหัว + ตัวเลขคำขอใหม่ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
            รายการขอผูกบัญชี 
            {requests.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
                ใหม่ {requests.length}
              </span>
            )}
          </h2>
        </div>

        {/* รายการคำขอ (List) */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#6b7280' }}>กำลังโหลดข้อมูล...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #ccc' }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, color: '#6b7280' }}>ไม่มีรายการรอตรวจสอบ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.map((req) => (
              <div 
                key={req.user_bank_id} 
                onClick={() => handleViewDetails(req)}
                style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
              >
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#111', fontSize: '15px' }}>{req.account_name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(req.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px' }}>รอตรวจสอบ</span>
                  <ChevronRight size={18} color="#9ca3af" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================
          🌟 หน้าต่างดูรายละเอียด + ตรวจสอบ (Modal)
      ========================================= */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f9fafb', zIndex: 100, overflowY: 'auto' }}>
          
          <div style={{ backgroundColor: '#fff', padding: '15px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 110 }}>
            <X size={24} color="#374151" onClick={() => setSelectedRequest(null)} style={{ cursor: 'pointer', marginRight: '10px' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#111' }}>ตรวจสอบบัญชี</h2>
          </div>

          <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>ชื่อบัญชีลูกค้า</p>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e3a8a' }}>{selectedRequest.account_name}</h3>
            </div>

            {/* --- จุดตรวจสอบที่ 1: เลขบัญชี --- */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: invalidFields.accountNumber ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280' }}>เลขที่บัญชี</p>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#111', letterSpacing: '1px' }}>{selectedRequest.account_number}</h4>
              <div 
                onClick={() => toggleInvalidField('accountNumber')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.accountNumber ? '#ef4444' : '#6b7280' }}
              >
                {invalidFields.accountNumber ? <CheckSquare size={18} color="#ef4444"/> : <Square size={18} />}
                <span style={{ fontSize: '14px', fontWeight: invalidFields.accountNumber ? 'bold' : 'normal' }}>เลขบัญชีไม่ถูกต้อง</span>
              </div>
            </div>

            {/* --- จุดตรวจสอบที่ 2: สกุลเงิน --- */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: invalidFields.currencyCode ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280' }}>สกุลเงิน</p>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#111' }}>{selectedRequest.currency_code}</h4>
              <div 
                onClick={() => toggleInvalidField('currencyCode')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.currencyCode ? '#ef4444' : '#6b7280' }}
              >
                {invalidFields.currencyCode ? <CheckSquare size={18} color="#ef4444"/> : <Square size={18} />}
                <span style={{ fontSize: '14px', fontWeight: invalidFields.currencyCode ? 'bold' : 'normal' }}>สกุลเงินไม่ตรงกับบัญชี</span>
              </div>
            </div>

            {/* --- จุดตรวจสอบที่ 3: ภาพสมุดบัญชี --- */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: invalidFields.passbookImage ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                ภาพสมุดบัญชี (Passbook)
                <button 
                  onClick={() => setZoomedImage(selectedRequest.passbook_image)}
                  style={{ background: '#e0f2fe', border: 'none', color: '#0284c7', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <ZoomIn size={14} /> ขยายดูรูป
                </button>
              </p>
              
              <div style={{ width: '100%', height: '150px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                {selectedRequest.passbook_image ? (
                   <img src={selectedRequest.passbook_image} alt="Passbook" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                   <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#999', fontSize:'13px' }}>ไม่ได้แนบรูปมา</div>
                )}
              </div>

              <div 
                onClick={() => toggleInvalidField('passbookImage')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.passbookImage ? '#ef4444' : '#6b7280' }}
              >
                {invalidFields.passbookImage ? <CheckSquare size={18} color="#ef4444"/> : <Square size={18} />}
                <span style={{ fontSize: '14px', fontWeight: invalidFields.passbookImage ? 'bold' : 'normal' }}>รูปภาพไม่ชัดเจน / ไม่ถูกต้อง</span>
              </div>
            </div>

          </div>

          {/* แถบปุ่มด้านล่าง (Fixed Bottom) */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: '15px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }}>
            
            <button 
              onClick={handleReject}
              disabled={!hasErrors || isSubmitting}
              style={{ flex: 1, padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: hasErrors ? 'pointer' : 'not-allowed', backgroundColor: hasErrors ? '#ef4444' : '#fca5a5', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <AlertTriangle size={18} /> ส่งกลับให้แก้ไข
            </button>
            
            <button 
              onClick={handleApprove}
              disabled={hasErrors || isSubmitting}
              style={{ flex: 1, padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !hasErrors ? 'pointer' : 'not-allowed', backgroundColor: !hasErrors ? '#10b981' : '#a7f3d0', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={18} /> อนุมัติผ่าน
            </button>

          </div>
        </div>
      )}

      {/* =========================================
          🌟 แว่นขยายดูรูป (Image Lightbox Modal)
      ========================================= */}
      {zoomedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <button 
            onClick={() => setZoomedImage(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={32} />
          </button>
          <img src={zoomedImage} alt="Zoomed Passbook" style={{ maxWidth: '95%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}

    </div>
  );
};

export default CustomersRequestBook;