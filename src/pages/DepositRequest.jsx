import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, X, Search, Clock, Eye, CheckSquare, Square, History, Image as ImageIcon, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositRequest = () => {
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // ระบบแท็บ: pending, approved, rejected
  const [activeTab, setActiveTab] = useState('pending');

  // State สำหรับ Modal ตรวจสอบ
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State สำหรับแว่นขยาย (Hover Zoom)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);

  // State จุดที่ไม่ผ่าน
  const [invalidFields, setInvalidFields] = useState({
    slipFake: false,
    wrongAmount: false,
    wrongDate: false,
    wrongTime: false
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-requests`); 
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
        setSummary(data.summary || {});
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
    // รีเซ็ตค่า Checkbox ทุกครั้งที่เปิดบิลใหม่
    setInvalidFields({ slipFake: false, wrongAmount: false, wrongDate: false, wrongTime: false });
  };

  const toggleInvalidField = (field) => {
    setInvalidFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const hasErrors = invalidFields.slipFake || invalidFields.wrongAmount || invalidFields.wrongDate || invalidFields.wrongTime;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleApprove = async () => {
    if (hasErrors) return; 
    if (!window.confirm('ยืนยันว่าสลิปถูกต้อง และต้องการตรวจผ่านใช่หรือไม่?')) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          depositId: selectedRequest.deposit_id, 
          userId: selectedRequest.user_id,
          amount: selectedRequest.amount
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedRequest(null);
        fetchRequests(); 
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!hasErrors) {
      alert('กรุณาติ๊กเลือกรายการที่ไม่ผ่านอย่างน้อย 1 รายการ');
      return;
    }
    if (!window.confirm('ยืนยันส่งเรื่องกลับให้ลูกค้าแก้ไขใช่หรือไม่?')) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          depositId: selectedRequest.deposit_id, 
          userId: selectedRequest.user_id,
          rejectReasons: invalidFields 
        })
      });
      const data = await res.json();
      if (data.success) {
        // หากผู้ใช้ติด Blacklist ก่อกวน ระบบจะแจ้งเตือนตรงนี้
        alert(data.message); 
        setSelectedRequest(null);
        fetchRequests(); 
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // กรองข้อมูลตามแท็บที่กด
  const filteredRequests = requests.filter(req => {
    if (activeTab === 'pending') return req.status === 'Pending' || req.status === 'Slip Verified';
    if (activeTab === 'approved') return req.status === 'Approved' || req.status === 'Completed';
    if (activeTab === 'rejected') return req.status === 'Rejected';
    return true;
  });

  const pendingCount = requests.filter(req => req.status === 'Pending' || req.status === 'Slip Verified').length;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* สรุปยอดด้านบน */}
      <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#10b981', padding: '12px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#064e3b', fontSize: '16px' }}>สรุปยอดฝากกระทบยอดสำเร็จ (เดือนนี้)</h3>
            <p style={{ margin: 0, color: '#047857', fontSize: '12px' }}>ข้อมูลอัปเดตแบบเรียลไทม์อัตโนมัติ</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, color: '#059669', fontSize: '24px' }}>
            {Number(summary['THB'] || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB
          </h2>
        </div>
      </div>

      {/* Header & Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>ระบบจัดการคำขอฝากเงิน</h2>
        {pendingCount > 0 && (
          <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '13px', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
            <AlertTriangle size={16} /> มีคำขอใหม่ {pendingCount} รายการ
          </span>
        )}
      </div>

      {/* แท็บเมนู (Tabs) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'pending' ? '#f1f5f9' : 'transparent', color: activeTab === 'pending' ? '#334155' : '#94a3b8' }}
        >
          <Clock size={16} /> รอตรวจสอบ {pendingCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '11px' }}>{pendingCount}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'approved' ? '#dcfce7' : 'transparent', color: activeTab === 'approved' ? '#16a34a' : '#94a3b8' }}
        >
          <CheckCircle size={16} /> อนุมัติแล้ว (วันนี้)
        </button>
        <button 
          onClick={() => setActiveTab('rejected')}
          style={{ padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'rejected' ? '#fee2e2' : 'transparent', color: activeTab === 'rejected' ? '#dc2626' : '#94a3b8' }}
        >
          <X size={16} /> ส่งกลับแก้ไข (วันนี้)
        </button>
      </div>

      {/* รายการคำขอ (Card List) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '50px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>ไม่มีรายการในหมวดหมู่นี้</div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.deposit_id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderLeft: activeTab === 'pending' ? '4px solid #10b981' : '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>ผู้ใช้: {req.customer_name} (ID: {req.user_id})</p>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#0284c7' }}>
                  {Number(req.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} {req.currency_code}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>ส่งคำขอเมื่อ: {req.created_at.replace('T', ' ')}</p>
              </div>
              <div>
                <button 
                  onClick={() => handleViewDetails(req)}
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}
                >
                  <Eye size={18} /> {activeTab === 'pending' ? 'ตรวจสอบ' : 'ดูรายละเอียด'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal ตรวจสอบสลิป + แว่นขยายอัจฉริยะ */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
          
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={20} color="#0284c7" /> ตรวจสอบสลิปฝากเงิน
              </h3>
              <X size={24} color="#6b7280" onClick={() => setSelectedRequest(null)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', overflowY: 'auto' }}>
              
              {/* ฝั่งซ้าย: รูปสลิปพร้อมแว่นขยาย */}
              <div style={{ flex: '1 1 400px', padding: '20px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}><ImageIcon size={16} style={{ display:'inline', verticalAlign:'middle' }}/> ภาพสลิป (ชี้ที่รูปเพื่อซูมขยาย)</p>
                
                <div 
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setShowZoom(true)}
                  onMouseLeave={() => setShowZoom(false)}
                  style={{ position: 'relative', width: '100%', height: '450px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', cursor: 'crosshair', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  <img 
                    src={selectedRequest.slip_image} 
                    alt="Slip" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'opacity 0.2s', opacity: showZoom ? 0 : 1 }} 
                  />
                  {showZoom && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      backgroundImage: `url(${selectedRequest.slip_image})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%', 
                      backgroundRepeat: 'no-repeat',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
              </div>

              {/* ฝั่งขวา: ข้อมูล และ Checkbox */}
              <div style={{ flex: '1 1 350px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#0284c7' }}>ข้อมูลที่ลูกค้าแจ้ง</h4>
                
                <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#166534', fontSize: '14px' }}>ลูกค้า:</span>
                    <strong style={{ color: '#14532d' }}>{selectedRequest.customer_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#166534', fontSize: '14px' }}>ยอดเงิน:</span>
                    <strong style={{ color: '#059669', fontSize: '18px' }}>{Number(selectedRequest.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} {selectedRequest.currency_code}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534', fontSize: '14px' }}>เวลาตามสลิป:</span>
                    <strong style={{ color: '#14532d' }}>{selectedRequest.deposit_datetime.replace('T', ' ')}</strong>
                  </div>
                </div>

                {/* ถ้ารายการนี้ยังไม่ถูกจัดการ ให้แสดง Checkbox */}
                {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Slip Verified') ? (
                  <>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>ตรวจเช็ค (ติ๊กถ้ารายการไม่ผ่าน)</h4>

                    <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.amount ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
                      <div onClick={() => toggleInvalidField('amount')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.amount ? '#ef4444' : '#64748b' }}>
                        {invalidFields.amount ? <CheckSquare size={20} /> : <Square size={20} />}
                        <span style={{ fontWeight: invalidFields.amount ? 'bold' : 'normal' }}>ยอดเงินไม่ตรงกับสลิป</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: invalidFields.datetime ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
                      <div onClick={() => toggleInvalidField('datetime')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.datetime ? '#ef4444' : '#64748b' }}>
                        {invalidFields.datetime ? <CheckSquare size={20} /> : <Square size={20} />}
                        <span style={{ fontWeight: invalidFields.datetime ? 'bold' : 'normal' }}>วันที่ หรือ เวลาโอน ไม่ตรง</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: invalidFields.slipImage ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
                      <div onClick={() => toggleInvalidField('slipImage')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: invalidFields.slipImage ? '#ef4444' : '#64748b' }}>
                        {invalidFields.slipImage ? <CheckSquare size={20} /> : <Square size={20} />}
                        <span style={{ fontWeight: invalidFields.slipImage ? 'bold' : 'normal' }}>สลิปปลอม / ซ้ำ / ไม่ชัดเจน</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                      <button 
                        onClick={handleReject}
                        disabled={!hasErrors || isSubmitting}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: hasErrors ? 'pointer' : 'not-allowed', backgroundColor: hasErrors ? '#ef4444' : '#fca5a5', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        <AlertTriangle size={16} /> ตีกลับ
                      </button>
                      <button 
                        onClick={handleApprove}
                        disabled={hasErrors || isSubmitting}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: !hasErrors ? 'pointer' : 'not-allowed', backgroundColor: !hasErrors ? '#10b981' : '#a7f3d0', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle size={16} /> อนุมัติสลิปนี้
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                    รายการนี้ถูกจัดการไปแล้ว<br/>
                    สถานะปัจจุบัน: <strong>{selectedRequest.status}</strong>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DepositRequest;