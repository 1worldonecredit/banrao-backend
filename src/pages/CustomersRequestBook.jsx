import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, ZoomIn, Eye, CheckSquare, Square, X, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const CustomersRequestBook = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 State สำหรับแยกแท็บ
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' หรือ 'Re-submitted'

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [invalidFields, setInvalidFields] = useState({
    accountNumber: false,
    currencyCode: false,
    passbookImage: false
  });
  
  // 🌟 State เก็บประวัติว่าแอดมินเคยสั่งให้แก้อะไรไป (เพื่อเอามาล็อคช่องที่ถูกต้องแล้ว)
  const [previousErrors, setPreviousErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user-banks`); 
      const data = await res.json();
      if (data.success) {
        // ดึงมาทั้งคำขอใหม่ และคำขอที่ส่งแก้มา
        setRequests(data.data.filter(req => req.status === 'Pending' || req.status === 'Re-submitted'));
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
    
    // เคลียร์ค่าแจ้งเตือนใหม่
    setInvalidFields({ accountNumber: false, currencyCode: false, passbookImage: false });

    // 🌟 ถ้าเป็นเคส "ส่งแก้" ให้ดึงประวัติมาดูว่าเคยสั่งให้แก้อะไร
    if (req.status === 'Re-submitted' && req.reject_reason) {
      try {
        setPreviousErrors(JSON.parse(req.reject_reason));
      } catch(e) { setPreviousErrors({}); }
    } else {
      setPreviousErrors({}); // ถ้าคำขอใหม่ ไม่มีประวัติ
    }
  };

  // 🌟 ฟังก์ชันติ๊กผิด (จะติ๊กได้เฉพาะช่องที่แอดมินเคยสั่งให้แก้ หรือคำขอใหม่เท่านั้น)
  const toggleInvalidField = (field) => {
    // ถ้าเป็นเคสส่งแก้ และช่องนี้แอดมิน 'ไม่ได้' สั่งให้แก้แต่แรก = ห้ามติ๊กซ้ำ
    if (selectedRequest.status === 'Re-submitted' && !previousErrors[field]) return;
    
    setInvalidFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const hasErrors = invalidFields.accountNumber || invalidFields.currencyCode || invalidFields.passbookImage;

  const handleApprove = async () => {
    if (hasErrors) return; 
    if (!window.confirm('ยืนยันอนุมัติบัญชีนี้ใช่หรือไม่?')) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/user-banks/${selectedRequest.user_bank_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', user_id: selectedRequest.user_id })
      });
      const data = await res.json();
      if (data.success) {
        alert('อนุมัติบัญชีสำเร็จ');
        setSelectedRequest(null);
        fetchRequests(); 
      } else { alert(data.message); }
    } catch (error) { alert('เกิดข้อผิดพลาด'); } finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!hasErrors) {
      alert('กรุณาติ๊กเลือกรายการที่ไม่ผ่านอย่างน้อย 1 รายการ');
      return;
    }
    if (!window.confirm('ยืนยันส่งเรื่องกลับให้ลูกค้าแก้ไขใช่หรือไม่?')) return;
    setIsSubmitting(true);

    try {
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
        fetchRequests(); 
      } else { alert(data.message); }
    } catch (error) { alert('เกิดข้อผิดพลาด'); } finally { setIsSubmitting(false); }
  };

  // กรองข้อมูลตามแท็บที่เลือก
  const displayedRequests = requests.filter(req => req.status === activeTab);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '22px' }}>
          จัดการสมุดบัญชีลูกค้า
        </h2>
      </div>

      {/* 🌟 แท็บเมนูแยกประเภท */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('Pending')}
          style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'Pending' ? '#0284c7' : '#e2e8f0', color: activeTab === 'Pending' ? '#fff' : '#64748b' }}
        >
          คำขอใหม่ ({requests.filter(r => r.status === 'Pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('Re-submitted')}
          style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'Re-submitted' ? '#d97706' : '#e2e8f0', color: activeTab === 'Re-submitted' ? '#fff' : '#64748b' }}
        >
          ลูกค้ายื่นแก้ไขแล้ว ({requests.filter(r => r.status === 'Re-submitted').length})
        </button>
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
            ) : displayedRequests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีรายการในหมวดหมู่นี้</td></tr>
            ) : (
              displayedRequests.map((req) => (
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
                    <span style={{ backgroundColor: req.status === 'Pending' ? '#fef3c7' : '#ffedd5', color: req.status === 'Pending' ? '#d97706' : '#ea580c', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                      {req.status === 'Pending' ? 'รอตรวจ' : 'ส่งแก้ไขแล้ว'}
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
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111' }}>
                ตรวจสอบบัญชี {selectedRequest.status === 'Re-submitted' && <span style={{ color: '#ea580c', fontSize: '14px', marginLeft: '10px' }}>(ฉบับแก้ไข)</span>}
              </h3>
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

              {/* 🌟 เลขบัญชี */}
              <div style={{ backgroundColor: (selectedRequest.status === 'Re-submitted' && !previousErrors.accountNumber) ? '#f8fafc' : '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.accountNumber ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>เลขที่บัญชี</p>
                    <h4 style={{ margin: 0, fontSize: '18px', color: (selectedRequest.status === 'Re-submitted' && !previousErrors.accountNumber) ? '#94a3b8' : '#111' }}>{selectedRequest.account_number}</h4>
                  </div>
                  {(selectedRequest.status === 'Re-submitted' && !previousErrors.accountNumber) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                      <CheckCircle2 size={20} /> ถูกต้องแล้ว
                    </div>
                  ) : (
                    <div onClick={() => toggleInvalidField('accountNumber')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.accountNumber ? '#ef4444' : '#94a3b8' }}>
                      {invalidFields.accountNumber ? <CheckSquare size={24} /> : <Square size={24} />}
                      <span style={{ fontWeight: invalidFields.accountNumber ? 'bold' : 'normal' }}>ข้อมูลผิด</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🌟 สกุลเงิน */}
              <div style={{ backgroundColor: (selectedRequest.status === 'Re-submitted' && !previousErrors.currencyCode) ? '#f8fafc' : '#fff', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.currencyCode ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>สกุลเงิน</p>
                    <h4 style={{ margin: 0, fontSize: '16px', color: (selectedRequest.status === 'Re-submitted' && !previousErrors.currencyCode) ? '#94a3b8' : '#111' }}>{selectedRequest.currency_code}</h4>
                  </div>
                  {(selectedRequest.status === 'Re-submitted' && !previousErrors.currencyCode) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                      <CheckCircle2 size={20} /> ถูกต้องแล้ว
                    </div>
                  ) : (
                    <div onClick={() => toggleInvalidField('currencyCode')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.currencyCode ? '#ef4444' : '#94a3b8' }}>
                      {invalidFields.currencyCode ? <CheckSquare size={24} /> : <Square size={24} />}
                      <span style={{ fontWeight: invalidFields.currencyCode ? 'bold' : 'normal' }}>ข้อมูลผิด</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🌟 รูปภาพ */}
              <div style={{ backgroundColor: (selectedRequest.status === 'Re-submitted' && !previousErrors.passbookImage) ? '#f8fafc' : '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: invalidFields.passbookImage ? '2px solid #ef4444' : '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: (selectedRequest.status === 'Re-submitted' && !previousErrors.passbookImage) ? '#94a3b8' : '#333' }}>ภาพหน้าสมุดบัญชี</p>
                  
                  {(selectedRequest.status === 'Re-submitted' && !previousErrors.passbookImage) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                      <CheckCircle2 size={20} /> ถูกต้องแล้ว
                    </div>
                  ) : (
                    <div onClick={() => toggleInvalidField('passbookImage')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.passbookImage ? '#ef4444' : '#94a3b8' }}>
                      {invalidFields.passbookImage ? <CheckSquare size={24} /> : <Square size={24} />}
                      <span style={{ fontWeight: invalidFields.passbookImage ? 'bold' : 'normal' }}>รูปผิด/ไม่ชัดเจน</span>
                    </div>
                  )}
                </div>
                
                <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', opacity: (selectedRequest.status === 'Re-submitted' && !previousErrors.passbookImage) ? 0.6 : 1 }}>
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
                <AlertTriangle size={18} /> ส่งกลับให้ลูกค้าแก้ไขซ้ำ
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
          🌟 แว่นขยายดูรูป
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