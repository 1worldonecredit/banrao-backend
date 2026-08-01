import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ZoomIn, Clock, Eye, CheckSquare, Square, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CustomersRequestBook = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State สำหรับ Modal ตรวจสอบ และ ซูมรูป
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  // State จุดที่ไม่ผ่าน
  const [invalidFields, setInvalidFields] = useState({
    accountNumber: false,
    currencyCode: false,
    passbookImage: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 อัปเดต API ให้ตรงกับหลังบ้าน
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user-banks`); 
      const data = await res.json();
      if (data.success) {
        // 🌟 กรองเอาเฉพาะอันที่สถานะเป็น 'Pending' มาแสดงให้แอดมินดู
        const pendingRequests = data.data.filter(req => req.status === 'Pending');
        setRequests(pendingRequests);
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

  const handleViewDetails = (req) => {
    setSelectedRequest(req);
    setInvalidFields({ accountNumber: false, currencyCode: false, passbookImage: false });
  };

  const toggleInvalidField = (field) => {
    setInvalidFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const hasErrors = invalidFields.accountNumber || invalidFields.currencyCode || invalidFields.passbookImage;

  const handleApprove = async () => {
    if (hasErrors) return; 
    if (!window.confirm('ยืนยันอนุมัติบัญชีนี้ใช่หรือไม่?')) return;
    setIsSubmitting(true);
    
    try {
      // 🌟 เรียกใช้ API อัปเดตสถานะแบบใหม่
      const res = await fetch(`${API_URL}/api/admin/user-banks/${selectedRequest.user_bank_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Approved',
          user_id: selectedRequest.user_id
        })
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

  const handleReject = async () => {
    if (!hasErrors) {
      alert('กรุณาติ๊กเลือกรายการที่ไม่ผ่านอย่างน้อย 1 รายการ เพื่อระบุให้ลูกค้าทราบว่าต้องแก้อะไร');
      return;
    }
    if (!window.confirm('ยืนยันส่งเรื่องกลับให้ลูกค้าแก้ไขใช่หรือไม่?')) return;
    setIsSubmitting(true);

    try {
      // 🌟 เรียกใช้ API อัปเดตสถานะแบบใหม่ พร้อมส่งเหตุผลไปให้ลูกค้า
      const res = await fetch(`${API_URL}/api/admin/user-banks/${selectedRequest.user_bank_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Rejected',
          user_id: selectedRequest.user_id,
          reject_reason: JSON.stringify(invalidFields) 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('ส่งเรื่องกลับให้ลูกค้าแก้ไขสำเร็จ');
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '22px' }}>
          คำขอเพิ่มสมุดบัญชี 
          {requests.length > 0 && <span style={{ marginLeft: '10px', backgroundColor: '#ef4444', color: 'white', fontSize: '14px', padding: '4px 12px', borderRadius: '12px' }}>รอตรวจ {requests.length} รายการ</span>}
        </h2>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px', color: '#475569' }}>ชื่อลูกค้า</th>
              <th style={{ padding: '15px', color: '#475569' }}>ข้อมูลบัญชี (ชื่อ/เลขที่)</th>
              <th style={{ padding: '15px', color: '#475569' }}>วันที่ทำรายการ</th>
              <th style={{ padding: '15px', color: '#475569', textAlign: 'center' }}>สถานะ</th>
              <th style={{ padding: '15px', color: '#475569', textAlign: 'center' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>กำลังโหลดข้อมูล...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีรายการรอตรวจสอบ</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.user_bank_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{req.firstname} {req.lastname}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>User ID: {req.user_id}</div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{req.account_name}</div>
                    <div style={{ fontSize: '13px', color: '#0f172a' }}>{req.account_number} <span style={{ color: '#0284c7', fontWeight: 'bold' }}>({req.currency_code})</span></div>
                  </td>
                  <td style={{ padding: '15px', color: '#64748b' }}>
                    {new Date(req.created_at).toLocaleString('th-TH')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                      รอตรวจ
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleViewDetails(req)}
                      style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontWeight: 'bold' }}
                    >
                      <Eye size={16} /> ตรวจสอบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================
          🌟 Modal รายละเอียดการตรวจสอบ
      ========================================= */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>ตรวจสอบบัญชี: {selectedRequest.account_name}</h3>
              <X size={24} color="#6b7280" onClick={() => setSelectedRequest(null)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ padding: '20px' }}>
              
              <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#0284c7', fontWeight: 'bold' }}>ข้อมูลเบื้องต้น</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>ชื่อบัญชี:</span> <br/><strong>{selectedRequest.account_name}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: '13px' }}>User ID:</span> <br/><strong>{selectedRequest.user_id}</strong></div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>ตรวจเช็คความถูกต้อง (ติ๊กถ้ารายการไม่ผ่าน)</h4>

              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.accountNumber ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>เลขที่บัญชี</p>
                    <h4 style={{ margin: 0, fontSize: '18px', color: '#111' }}>{selectedRequest.account_number}</h4>
                  </div>
                  <div onClick={() => toggleInvalidField('accountNumber')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.accountNumber ? '#ef4444' : '#94a3b8' }}>
                    {invalidFields.accountNumber ? <CheckSquare size={24} /> : <Square size={24} />}
                    <span style={{ fontWeight: invalidFields.accountNumber ? 'bold' : 'normal' }}>ข้อมูลผิด</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.currencyCode ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>สกุลเงิน</p>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#111' }}>{selectedRequest.currency_code}</h4>
                  </div>
                  <div onClick={() => toggleInvalidField('currencyCode')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.currencyCode ? '#ef4444' : '#94a3b8' }}>
                    {invalidFields.currencyCode ? <CheckSquare size={24} /> : <Square size={24} />}
                    <span style={{ fontWeight: invalidFields.currencyCode ? 'bold' : 'normal' }}>ข้อมูลผิด</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: invalidFields.passbookImage ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#333' }}>ภาพหน้าสมุดบัญชี</p>
                  <div onClick={() => toggleInvalidField('passbookImage')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.passbookImage ? '#ef4444' : '#94a3b8' }}>
                    {invalidFields.passbookImage ? <CheckSquare size={24} /> : <Square size={24} />}
                    <span style={{ fontWeight: invalidFields.passbookImage ? 'bold' : 'normal' }}>รูปผิด/ไม่ชัดเจน</span>
                  </div>
                </div>
                
                <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {selectedRequest.passbook_image ? (
                     <>
                       <img src={selectedRequest.passbook_image} alt="Passbook" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                       <button 
                         onClick={() => setZoomedImage(selectedRequest.passbook_image)}
                         style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#0284c7', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                       >
                         <ZoomIn size={16} /> ขยายดูรูป
                       </button>
                     </>
                  ) : (
                     <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#94a3b8' }}>ไม่มีรูปภาพสมุดบัญชี</div>
                  )}
                </div>
              </div>

            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '15px', backgroundColor: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
              <button 
                onClick={handleReject}
                disabled={!hasErrors || isSubmitting}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: hasErrors ? 'pointer' : 'not-allowed', backgroundColor: hasErrors ? '#ef4444' : '#fca5a5', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <AlertTriangle size={18} /> ส่งกลับให้ลูกค้าแก้ไข
              </button>
              
              <button 
                onClick={handleApprove}
                disabled={hasErrors || isSubmitting}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: !hasErrors ? 'pointer' : 'not-allowed', backgroundColor: !hasErrors ? '#10b981' : '#a7f3d0', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle size={18} /> อนุมัติข้อมูลถูกต้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          🌟 แว่นขยายดูรูป (Image Lightbox Modal)
      ========================================= */}
      {zoomedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <button 
            onClick={() => setZoomedImage(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={40} />
          </button>
          <img src={zoomedImage} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}

    </div>
  );
};

export default CustomersRequestBook;