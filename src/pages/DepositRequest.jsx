import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Search, CheckCircle, XCircle, AlertTriangle, X, Clock, CheckSquare, XSquare, Calendar, Bell, Image as ImageIcon, RefreshCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const DepositRequest = () => {
  const [requests, setRequests] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Pending');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);
  
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const [isConfirmChecked, setIsConfirmChecked] = useState(false);
  
  const [rejectionReasons, setRejectionReasons] = useState({
    invalidSlip: false, amountMismatch: false, dateMismatch: false, timeMismatch: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const formatRejectReasons = (reasonStr) => {
    if (!reasonStr) return '-';
    try {
      const reasons = JSON.parse(reasonStr);
      let textArr = [];
      if (reasons.invalidSlip) textArr.push("สลิปปลอม/ภาพไม่ถูกต้อง");
      if (reasons.amountMismatch) textArr.push("จำนวนเงินไม่ตรง");
      if (reasons.dateMismatch) textArr.push("วันที่โอนไม่ตรง");
      if (reasons.timeMismatch) textArr.push("เวลาโอนไม่ตรง");
      return textArr.join(", ");
    } catch (e) {
      return reasonStr; 
    }
  };

  // ใช้ useCallback เพื่อให้เรียกซ้ำได้อย่างปลอดภัย
  const fetchRequests = useCallback(async (showLoadingIcon = true) => {
    if (showLoadingIcon) setIsLoading(true);
    setIsRefreshing(true);
    try {
      // เพิ่ม { cache: 'no-store' } เพื่อให้ดึงข้อมูลใหม่เสมอ
      const response = await fetch(`${API_URL}/api/admin/deposit-requests`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests || []);
        setMonthlySummary(data.summary || {});
      } else {
        console.error("Failed to fetch data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  const handleViewDetails = (req) => {
    setSelectedRequest(req);
    setRejectionReasons({ invalidSlip: false, amountMismatch: false, dateMismatch: false, timeMismatch: false });
    setIsConfirmChecked(false);
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setRejectionReasons(prev => ({ ...prev, [name]: checked }));
    setIsConfirmChecked(false);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const hasRejectionReasons = Object.values(rejectionReasons).some(value => value === true);

  const handleApprove = async () => {
    if (hasRejectionReasons) return;
    if (!isConfirmChecked) return;
    if (!window.confirm("ยืนยันว่าสลิปนี้ 'ถูกต้อง' และส่งเข้าสู่ระบบกระทบยอดอัตโนมัติ?")) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          depositId: selectedRequest.deposit_id, 
          userId: selectedRequest.user_id, 
          amount: selectedRequest.amount,
          accountNumber: selectedRequest.account_number
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ " + data.message);
        setIsModalOpen(false);
        fetchRequests(false); // โหลดใหม่โดยไม่โชว์ไอคอนเต็มหน้า
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
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/deposit-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          depositId: selectedRequest.deposit_id, 
          userId: selectedRequest.user_id,
          rejectReasons: rejectionReasons 
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message); 
        setIsModalOpen(false);
        fetchRequests(false);
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
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  const filteredRequests = requests.filter(req => req.status === activeTab);
  const pendingCount = requests.filter(req => req.status === 'Pending').length;
  const slipVerifiedCount = requests.filter(req => req.status === 'Slip Verified').length;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* กล่องสรุปยอดเงิน */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#22c55e', padding: '10px', borderRadius: '50%', color: 'white' }}>
            <Calendar size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#166534', fontSize: '16px' }}>สรุปยอดฝากกระทบยอดสำเร็จ (เดือนนี้)</h3>
            <p style={{ margin: 0, color: '#15803d', fontSize: '13px' }}>ข้อมูลอัปเดตอัตโนมัติเมื่อกดรีเฟรช</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {monthlySummary['THB'] ? (
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {formatCurrency(monthlySummary['THB'])} THB
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#666' }}>0.00 THB</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '22px', margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          ระบบจัดการคำขอฝากเงิน
          <button 
            onClick={() => fetchRequests(true)} 
            disabled={isRefreshing}
            style={{ 
              background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', 
              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', 
              cursor: isRefreshing ? 'wait' : 'pointer', fontSize: '13px', color: '#4b5563',
              backgroundColor: '#f9fafb'
            }}
          >
            <RefreshCcw size={14} className={isRefreshing ? "spin-icon" : ""} /> 
            {isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรชข้อมูล'}
          </button>
        </h2>
        
        {pendingCount > 0 && (
          <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite' }}>
            <Bell size={16} /> มีคำขอใหม่ {pendingCount} รายการ
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          onClick={() => setActiveTab('Pending')}
          style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'Pending' ? '#fef3c7' : 'transparent', color: activeTab === 'Pending' ? '#d97706' : '#6b7280' }}
        >
          <Clock size={18} /> 1. รอตรวจสลิป 
          {pendingCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: '4px' }}>{pendingCount}</span>}
        </button>

        <button 
          onClick={() => setActiveTab('Slip Verified')}
          style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'Slip Verified' ? '#e0f2fe' : 'transparent', color: activeTab === 'Slip Verified' ? '#0284c7' : '#6b7280' }}
        >
          <RefreshCcw size={18} /> 2. รอกระทบยอดบัญชี
          {slipVerifiedCount > 0 && <span style={{ backgroundColor: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: '4px' }}>{slipVerifiedCount}</span>}
        </button>

        <button 
          onClick={() => setActiveTab('Approved')}
          style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'Approved' ? '#dcfce7' : 'transparent', color: activeTab === 'Approved' ? '#166534' : '#6b7280' }}
        >
          <CheckSquare size={18} /> 3. กระทบยอดสำเร็จ
        </button>

        <button 
          onClick={() => setActiveTab('Rejected')}
          style={{ padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: activeTab === 'Rejected' ? '#fee2e2' : 'transparent', color: activeTab === 'Rejected' ? '#b91c1c' : '#6b7280' }}
        >
          <XSquare size={18} /> ตีกลับ (ส่งแก้ไข)
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>กำลังโหลดข้อมูล...</div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          ไม่มีรายการในสถานะนี้
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredRequests.map((req) => (
            <div key={req.deposit_id} style={{ 
              backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              borderLeft: `5px solid ${
                activeTab === 'Pending' ? '#f59e0b' : 
                activeTab === 'Slip Verified' ? '#0ea5e9' : 
                activeTab === 'Approved' ? '#22c55e' : '#ef4444'
              }`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'
            }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                  ผู้ใช้: {req.customer_name} (ID: {req.user_id})
                  {req.edit_count > 0 && (
                    <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px' }}>
                      แก้ไขแล้ว {req.edit_count} ครั้ง
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0369a1' }}>
                  {formatCurrency(req.amount)} {req.currency_code}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  โอนเข้า: <strong>{req.bank_name || 'ไม่ระบุ'}</strong> ({req.account_number})
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  แจ้งเมื่อ: {new Date(req.created_at).toLocaleString('en-GB')}
                </p>
                {req.status === 'Rejected' && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fef2f2', padding: '5px 10px', borderRadius: '4px', display: 'inline-block' }}>
                    เหตุผล: {formatRejectReasons(req.reject_reasons)}
                  </p>
                )}
                {req.status === 'Slip Verified' && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#0284c7', fontWeight: 'bold', backgroundColor: '#f0f9ff', padding: '5px 10px', borderRadius: '4px', display: 'inline-block' }}>
                    <RefreshCcw size={12} style={{display:'inline', marginRight:'4px'}}/> กำลังรอฝั่งบัญชีเงินเข้าคีย์ยอดเพื่อกระทบยอดอัตโนมัติ...
                  </p>
                )}
              </div>
              <button 
                onClick={() => handleViewDetails(req)}
                style={{ 
                  backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '10px 20px', 
                  borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  fontWeight: '600', color: '#374151', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                <Eye size={18} /> {activeTab === 'Pending' ? 'ตรวจสลิป' : 'ดูข้อมูล'}
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
              <h3 style={{ margin: 0, fontSize: '20px', color: '#111' }}>
                {selectedRequest.status === 'Pending' ? 'ตรวจสอบรายการฝากเงิน (Step 1)' : 'รายละเอียดการฝากเงิน'}
              </h3>
              <X size={24} color="#6b7280" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>

            {selectedRequest.edit_count > 0 && (
              <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <b>ระวัง:</b> ลูกค้ารายนี้ส่งแก้ไขคำขอนี้มาแล้ว {selectedRequest.edit_count} ครั้ง
              </div>
            )}

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div><span style={{ color: '#64748b' }}>โอนเข้าธนาคาร:</span><br/><strong>{selectedRequest.bank_name || 'ไม่ระบุ'}</strong></div>
                <div><span style={{ color: '#64748b' }}>เลขบัญชีระบบ:</span><br/><strong>{selectedRequest.account_number}</strong></div>
                <div><span style={{ color: '#64748b' }}>วันที่โอน:</span><br/><strong style={{ color: '#b45309' }}>{new Date(selectedRequest.deposit_datetime).toLocaleDateString('en-GB')}</strong></div>
                <div><span style={{ color: '#64748b' }}>เวลาโอน:</span><br/><strong style={{ color: '#b45309' }}>{new Date(selectedRequest.deposit_datetime).toLocaleTimeString('en-GB')}</strong></div>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '15px' }}>ยอดเงินที่แจ้งโอน</span><br/>
                <strong style={{ fontSize: '32px', color: '#0369a1' }}>{formatCurrency(selectedRequest.amount)} {selectedRequest.currency_code}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '15px' }}>หลักฐานการโอน (สลิป):</p>
              
              <div 
                onClick={() => setIsPreviewImageOpen(true)}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setShowZoom(true)}
                onMouseLeave={() => setShowZoom(false)}
                title="คลิกเพื่อดูเต็มจอ"
                style={{ 
                  position: 'relative', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', 
                  backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', cursor: 'zoom-in',
                  height: '350px' 
                }}
              >
                {selectedRequest.slip_image ? (
                   <img 
                   src={selectedRequest.slip_image} 
                   alt="Slip" 
                   style={{ 
                     maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', 
                     opacity: showZoom ? 0 : 1, transition: 'opacity 0.2s' 
                   }} 
                 />
                ) : (
                  <div style={{display: 'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#9ca3af'}}>ไม่มีรูปสลิป</div>
                )}
                
                {showZoom && selectedRequest.slip_image && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url(${selectedRequest.slip_image})`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: '130%', 
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none'
                  }} />
                )}
              </div>
            </div>

            {selectedRequest.status === 'Pending' ? (
              <>
                <div style={{ backgroundColor: '#fff1f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '15px' }}>
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

                {!hasRejectionReasons && (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="confirm-approve"
                      checked={isConfirmChecked}
                      onChange={(e) => setIsConfirmChecked(e.target.checked)}
                      style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                    />
                    <label htmlFor="confirm-approve" style={{ cursor: 'pointer', color: '#166534', fontWeight: 'bold', fontSize: '13px' }}>
                      ข้อมูลถูกต้องทั้งหมด ยืนยันว่าตรวจสอบสลิปแล้ว
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleReject} disabled={!hasRejectionReasons || isProcessing}
                    style={{ flex: '1 1 200px', padding: '16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: hasRejectionReasons ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px', backgroundColor: hasRejectionReasons ? '#ef4444' : '#f3f4f6', color: hasRejectionReasons ? 'white' : '#9ca3af' }}
                  >
                    <XCircle size={22} /> ส่งกลับให้ลูกค้าแก้ไข
                  </button>
                  <button 
                    onClick={handleApprove} disabled={hasRejectionReasons || isProcessing || !isConfirmChecked}
                    style={{ flex: '1 1 200px', padding: '16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: (!hasRejectionReasons && isConfirmChecked) ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px', backgroundColor: (!hasRejectionReasons && isConfirmChecked) ? '#0ea5e9' : '#f3f4f6', color: (!hasRejectionReasons && isConfirmChecked) ? 'white' : '#9ca3af' }}
                  >
                    <RefreshCcw size={22} className={isProcessing ? "spin-icon" : ""} /> ตรวจสลิปผ่าน
                  </button>
                </div>
              </>
            ) : (
              <div style={{ backgroundColor: selectedRequest.status === 'Approved' ? '#dcfce7' : (selectedRequest.status === 'Slip Verified' ? '#e0f2fe' : '#fee2e2'), padding: '20px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: selectedRequest.status === 'Approved' ? '#166534' : (selectedRequest.status === 'Slip Verified' ? '#0284c7' : '#b91c1c') }}>
                {selectedRequest.status === 'Approved' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CheckCircle size={24} /> รายการนี้กระทบยอดสำเร็จแล้ว</div>
                )}
                {selectedRequest.status === 'Slip Verified' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><RefreshCcw size={24} /> สลิปถูกต้อง (กำลังรอระบบบัญชีเงินเข้ากระทบยอด)</div>
                )}
                {selectedRequest.status === 'Rejected' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><XCircle size={24} /> รายการนี้ถูกส่งกลับไปให้แก้ไข</div>
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#ef4444' }}>เหตุผล: {formatRejectReasons(selectedRequest.reject_reasons)}</span>
                  </div>
                )}
              </div>
            )}
            
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
          {selectedRequest.slip_image ? (
              <img src={selectedRequest.slip_image} alt="Slip Full" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
          ) : (
             <div style={{color: 'white', fontSize:'24px'}}>ไม่มีรูปสลิป</div>
          )}
        </div>
      )}

    </div>
  );
};

export default DepositRequest;