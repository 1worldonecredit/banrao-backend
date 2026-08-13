import React, { useState, useEffect } from 'react';
import { Plus, Edit, Image as ImageIcon, Save, X, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';

const ReceivingAccount = () => {
  const [banks, setBanks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialFormState = {
    bank_id: null,
    bank_name: '',
    bank_code: '',
    account_name: '',
    account_number: '',
    currency: 'THB',
    logo_url: '',
    is_active: 1
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);

  // 1. ดึงข้อมูลธนาคารทั้งหมดเมื่อเปิดหน้า
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      // ⚠️ คุณพี่ต้องสร้าง API GET: /api/admin/banks มารองรับด้วยนะครับ
      const response = await fetch(`${API_URL}/api/admin/banks`);
      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  // 2. จัดการเมื่อมีการอัปโหลดรูปภาพโลโก้ (แปลงเป็น Base64)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo_url: reader.result }); // เก็บ Base64 ลง State
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. จัดการเปิดฟอร์มแก้ไข
  const handleEditClick = (bank) => {
    setFormData(bank);
    setIsEditing(true);
    setShowModal(true);
  };

  // 4. จัดการเปิดฟอร์มเพิ่มใหม่
  const handleAddClick = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  // 5. กดบันทึกข้อมูล (เพิ่มใหม่ หรือ อัปเดต)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const method = isEditing ? 'PUT' : 'POST';
      // ⚠️ ถ้าแก้ไขให้ส่งไปที่ PUT /api/admin/banks/:id ถ้าเพิ่มใหม่ส่ง POST /api/admin/banks
      const url = isEditing 
        ? `${API_URL}/api/admin/banks/${formData.bank_id}` 
        : `${API_URL}/api/admin/banks`;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(isEditing ? 'อัปเดตบัญชีสำเร็จ' : 'เพิ่มบัญชีสำเร็จ');
        setShowModal(false);
        fetchBanks(); // โหลดข้อมูลตารางใหม่
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error("Error saving bank:", error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>จัดการบัญชีรับฝากเงิน (Receiving Accounts)</h2>
        <button 
          onClick={handleAddClick}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> เพิ่มบัญชีใหม่
        </button>
      </div>
      
      {/* ======================= ตารางแสดงข้อมูล ======================= */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px' }}>โลโก้</th>
              <th style={{ padding: '12px' }}>ข้อมูลธนาคาร</th>
              <th style={{ padding: '12px' }}>ชื่อและเลขบัญชี</th>
              <th style={{ padding: '12px' }}>สกุลเงิน</th>
              <th style={{ padding: '12px' }}>สถานะ</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {banks.length > 0 ? banks.map((bank) => (
              <tr key={bank.bank_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px' }}>
                  {bank.logo_url ? (
                    <img src={bank.logo_url} alt={bank.bank_code} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}><ImageIcon size={20} color="#94a3b8" /></div>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#334155' }}>{bank.bank_name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{bank.bank_code}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#334155' }}>{bank.account_name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{bank.account_number}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: bank.currency === 'THB' ? '#dbeafe' : '#fce7f3', color: bank.currency === 'THB' ? '#1d4ed8' : '#be185d', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {bank.currency}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {bank.is_active ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '14px', fontWeight: 'bold' }}><CheckCircle size={16} /> เปิดใช้งาน</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}><XCircle size={16} /> ปิดใช้งาน</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleEditClick(bank)}
                    style={{ padding: '6px 12px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit size={14} /> แก้ไข
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีข้อมูลบัญชี หรือ API ยังไม่พร้อมใช้งาน</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================= Modal เพิ่ม/แก้ไข ======================= */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>{isEditing ? '✏️ แก้ไขบัญชี' : '➕ เพิ่มบัญชีใหม่'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* ส่วนอัปโหลดรูประบบ Base64 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={30} color="#94a3b8" />
                  </div>
                )}
                <label style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold' }}>
                  อัปโหลดโลโก้ (ไฟล์รูปภาพ)
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ชื่อธนาคาร</label>
                  <input required type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} placeholder="เช่น ธนาคารกสิกรไทย" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>รหัสธนาคาร (Code)</label>
                  <input required type="text" value={formData.bank_code} onChange={(e) => setFormData({...formData, bank_code: e.target.value})} placeholder="เช่น KBANK" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>ชื่อบัญชี (Account Name)</label>
                <input required type="text" value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} placeholder="เช่น บจก. ซาลาปี (ไทย)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>เลขที่บัญชี (Account Number)</label>
                <input required type="text" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} placeholder="เช่น 111-222-3333" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>สกุลเงิน</label>
                  <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="THB">THB (บาท)</option>
                    <option value="LAK">LAK (กีบ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>สถานะการใช้งาน</label>
                  <select value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value={1}>เปิดใช้งาน</option>
                    <option value={0}>ปิดใช้งาน (ซ่อน)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ยกเลิก
                </button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Save size={18} /> {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivingAccount;