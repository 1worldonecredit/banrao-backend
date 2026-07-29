import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Eye, X, ZoomIn, Wallet } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ManageDeposit = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentAdminName = "ซุปเปอร์ ผู้ดูแลระบบ";

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    // ข้อมูลจำลอง (เพิ่ม currency_code แล้ว)
    setDeposits([
      {
        deposit_id: 1,
        user_id: 5,
        customer_name: 'ไชยวงษ์ อินทรไชย',
        bank_name: 'ธนาคารกสิกรไทย (KBANK)',
        account_number: '111-222-3333',
        amount: 500.00,
        currency_code: 'THB', // 🌟 สกุลเงิน
        slip_image: 'https://i.pinimg.com/736x/9f/2a/35/9f2a35fc206253457a44f2bbd71f65bb.jpg',
        status: 'Pending',
        created_at: new Date().toISOString()
      },
      {
        deposit_id: 2,
        user_id: 8,
        customer_name: 'วิญญู นาควิมนณ์',
        bank_name: 'ธนาคารไทยพาณิชย์ (SCB)',
        account_number: '999-888-7777',
        amount: 1500.00,
        currency_code: 'USD', // 🌟 สกุลเงิน
        slip_image: 'https://i.pinimg.com/736x/9f/2a/35/9f2a35fc206253457a44f2bbd71f65bb.jpg',
        status: 'Approved',
        created_at: new Date().toISOString()
      }
    ]);
    setLoading(false);
  };

  const handleOpenModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsModalOpen(true);
    setIsZoomed(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDeposit(null);
  };

  const handleUpdateStatus = (status) => {
    const actionText = status === 'Approved' ? 'อนุมัติยอดเงิน' : 'ปฏิเสธรายการ';
    if(window.confirm(`ยืนยันการ ${actionText} ของคุณ ${selectedDeposit.customer_name} ใช่หรือไม่?`)) {
      alert(`${actionText} สำเร็จ!`);
      setDeposits(deposits.map(d => 
        d.deposit_id === selectedDeposit.deposit_id ? { ...d, status: status } : d
      ));
      handleCloseModal();
    }
  };

  const filteredDeposits = deposits.filter(d => 
    d.customer_name.includes(searchTerm) || d.amount.toString().includes(searchTerm) || d.currency_code.includes(searchTerm.toUpperCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet size={28} color="#3b82f6" /> จัดการคำขอฝากเงิน
        </h2>
        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          ตรวจสอบสลิปและอนุมัติยอดเงินเข้ากระเป๋าลูกค้า
        </p>
      </div>

      {/* Table Area */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อลูกค้า, ยอดเงิน หรือ สกุลเงิน..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>ข้อมูลลูกค้า</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>ธนาคารที่โอนเข้า</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>จำนวนเงิน</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeposits.map(req => (
              <tr key={req.deposit_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{req.customer_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>User ID: {req.user_id}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ color: '#0f172a', fontSize: '14px' }}>{req.bank_name}</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>{req.account_number}</div>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>
                  {/* 🌟 แสดงจำนวนเงิน พร้อมสกุลเงิน */}
                  +{req.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})} <span style={{fontSize: '12px', color: '#64748b'}}>{req.currency_code}</span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {req.status === 'Pending' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}><AlertCircle size={12} style={{marginRight:'4px'}}/> รอตรวจ</span>}
                  {req.status === 'Approved' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#d1fae5', color: '#059669', fontSize: '12px', fontWeight: 'bold' }}><CheckCircle size={12} style={{marginRight:'4px'}}/> อนุมัติแล้ว</span>}
                  {req.status === 'Rejected' && <span style={{ padding: '4px 8px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}><XCircle size={12} style={{marginRight:'4px'}}/> ปฏิเสธ</span>}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleOpenModal(req)} 
                    style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={14} /> ตรวจสอบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal PopUp ตรวจสอบสลิป */}
      {isModalOpen && selectedDeposit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '900px', maxWidth: '100%', display: 'flex', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'zoomIn 0.2s' }}>
            
            <div 
              style={{ flex: 1, backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img 
                src={selectedDeposit.slip_image} 
                alt="สลิปโอนเงิน" 
                style={{ 
                  width: '100%', height: '100%', objectFit: 'contain', 
                  transition: 'transform 0.3s ease-in-out',
                  transform: isZoomed ? 'scale(1.8)' : 'scale(1)' 
                }} 
              />
              {!isZoomed && (
                <div style={{ position: 'absolute', bottom: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <ZoomIn size={16} /> คลิกลงบนภาพเพื่อซูมขยาย
                </div>
              )}
            </div>

            <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>ข้อมูลแจ้งฝากเงิน</h3>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
              </div>

              <div style={{ display: 'grid', gap: '15px', flexGrow: 1 }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>ชื่อลูกค้าที่แจ้งโอน</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{selectedDeposit.customer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>โอนเงินเข้าบัญชีระบบ (ธนาคาร)</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{selectedDeposit.bank_name}</div>
                  <div style={{ fontSize: '14px', color: '#475569' }}>เลขบัญชี: {selectedDeposit.account_number}</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '13px', color: '#16a34a' }}>ยอดเงินที่แจ้งฝาก</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#14532d', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {/* 🌟 แสดงจำนวนเงิน พร้อมสกุลเงินใน PopUp */}
                    {selectedDeposit.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                    <span style={{ fontSize: '16px', color: '#16a34a', fontWeight: 'normal' }}>{selectedDeposit.currency_code}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>วันเวลาที่แจ้งทำรายการ</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>{new Date(selectedDeposit.created_at).toLocaleString('th-TH')}</div>
                </div>
              </div>

              {selectedDeposit.status === 'Pending' ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => handleUpdateStatus('Approved')} style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <CheckCircle size={20} /> อนุมัติยอดเงิน
                  </button>
                  <button onClick={() => handleUpdateStatus('Rejected')} style={{ padding: '12px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={20} /> ปฏิเสธ
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '20px', padding: '12px', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontWeight: 'bold' }}>
                  รายการนี้ถูกตรวจสอบแล้ว ({selectedDeposit.status === 'Approved' ? 'อนุมัติ' : 'ปฏิเสธ'})
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageDeposit;