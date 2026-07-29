import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Image as ImageIcon, UploadCloud, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company'; 

const AddNumberViet = () => {
  const [animalList, setAnimalList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [userData, setUserData] = useState(null);
  const [editingId, setEditingId] = useState(null); 

  const [formData, setFormData] = useState({
    animalName: '',
    imagePreview: null, 
    imageBase64: '',    
    lotteryType: '2',
    numberCount: 3,
    num1: '',
    num2: '',
    num3: '',
    isActive: true
  });

  const fetchAnimals = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/animal-numbers`);
      if (res.ok) {
        const data = await res.json();
        setAnimalList(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
    const storedUser = localStorage.getItem('userData');
    if (storedUser) setUserData(JSON.parse(storedUser));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์รูปใหญ่เกิน 5MB กรุณาเลือกรูปใหม่ครับ");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          imagePreview: URL.createObjectURL(file), 
          imageBase64: reader.result               
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountChange = (count) => {
    setFormData({ ...formData, numberCount: count, num3: count === 2 ? '' : formData.num3 });
  };

  const handleEditClick = (item) => {
    setEditingId(item.animal_id);
    setFormData({
      animalName: item.animal_name_th,
      imagePreview: item.image_url, 
      imageBase64: item.image_url,    
      lotteryType: item.lottery_type,
      numberCount: item.num3 === '-' ? 2 : 3,
      num1: item.num1,
      num2: item.num2,
      num3: item.num3 === '-' ? '' : item.num3,
      isActive: item.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      animalName: '', imagePreview: null, imageBase64: '', lotteryType: '2', 
      numberCount: 3, num1: '', num2: '', num3: '', isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { animalName, imageBase64, lotteryType, numberCount, num1, num2, num3, isActive } = formData;

    if (!animalName || !imageBase64 || !num1 || !num2 || (numberCount === 3 && !num3)) {
      alert('กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน');
      return;
    }

    const newNumbers = [num1, num2];
    if (numberCount === 3) newNumbers.push(num3);
    if (new Set(newNumbers).size !== newNumbers.length) {
      alert('❌ คุณกรอกเลขซ้ำกันเองในฟอร์ม!');
      return;
    }

    setIsLoading(true);
    try {
      const actionByName = userData?.username || userData?.email || userData?.emp_name || 'Admin';

      const payload = {
        animal_name_th: animalName,
        image_url: imageBase64, 
        lottery_type: lotteryType,
        num1: num1,
        num2: num2,
        num3: numberCount === 3 ? num3 : '-',
        is_active: isActive,
        action_by: actionByName 
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/api/admin/animal-numbers/${editingId}` : `${API_URL}/api/admin/animal-numbers`;

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(`${data.message}\n👉 ข้อมูลเชิงลึกจาก SQL: ${data.error || 'ไม่ระบุ'}`);
      
      if(data.success) { 
        alert(editingId ? '✅ แก้ไขข้อมูลสำเร็จ!' : '✅ บันทึกข้อมูลสำเร็จ!');
        fetchAnimals(); 
        handleCancelEdit(); 
      } else {
        alert(`❌ ผิดพลาด: ${data.message}`); 
      }

    } catch (error) {
      console.error("🔥 Error Details:", error);
      alert(`ไม่สามารถบันทึกข้อมูลได้\nสาเหตุ: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 🌟 1. ครอบด้วย box-sizing และ max-width 100% เพื่อไม่ให้ทะลุจอมือถือ
    <div style={{ padding: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          <span style={{ color: '#f97316' }}>|</span> จัดการเลขหวยเวียดนาม
        </h2>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start', width: '100%' }}>
        
        {/* =========================================
            ฟอร์มด้านซ้าย (ปรับ flex เป็น 100% ในจอมือถือ)
        ========================================= */}
        <div style={{ flex: '1 1 300px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: editingId ? '4px solid #10b981' : '4px solid #f97316', boxSizing: 'border-box', width: '100%' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingId ? (
              <><span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>EDIT</span> แก้ไขรายการ</>
            ) : (
              <><span style={{ backgroundColor: '#f97316', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>NEW</span> เพิ่มรายการใหม่</>
            )}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>หมวดหมู่ (ประเภทหวย) *</label>
              <select name="lotteryType" value={formData.lotteryType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0284c7', fontWeight: 'bold', boxSizing: 'border-box' }}>
                <option value="2">หมวด 2 ตัว</option>
                <option value="3">หมวด 3 ตัว</option>
                <option value="4">หมวด 4 ตัว</option>
                <option value="6">หมวด 6 ตัว</option>
                <option value="8">หมวด 8 ตัว</option>
              </select>
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>ชื่อสัตว์ (ภาษาลาว/ไทย) *</label>
              <input type="text" name="animalName" value={formData.animalName} onChange={handleInputChange} placeholder="เช่น ปาน้อย (ປານ້ອຍ)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} required />
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>อัปโหลดรูปภาพ *</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                <div style={{ minWidth: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {formData.imagePreview ? <img src={formData.imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={24} color="#9ca3af" />}
                </div>
                <div style={{ flex: 1, position: 'relative', width: '100%' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                    <UploadCloud size={16} /> {formData.imagePreview ? 'เปลี่ยนรูปภาพ' : 'คลิกเลือกรูปภาพ'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#4b5563' }}>จำนวนตัวเลขของสัตว์นี้ *</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: formData.numberCount === 2 ? 'bold' : 'normal' }}>
                  <input type="radio" checked={formData.numberCount === 2} onChange={() => handleCountChange(2)} style={{ width: '16px', height: '16px', accentColor: '#f97316' }} />
                  มี 2 เลข
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: formData.numberCount === 3 ? 'bold' : 'normal' }}>
                  <input type="radio" checked={formData.numberCount === 3} onChange={() => handleCountChange(3)} style={{ width: '16px', height: '16px', accentColor: '#f97316' }} />
                  มี 3 เลข
                </label>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>ระบุตัวเลข (00-99) *</label>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input type="text" name="num1" value={formData.num1} onChange={handleInputChange} placeholder="เลข 1" maxLength="5" style={{ flex: 1, minWidth: '50px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#d11010', boxSizing: 'border-box' }} required />
                <input type="text" name="num2" value={formData.num2} onChange={handleInputChange} placeholder="เลข 2" maxLength="5" style={{ flex: 1, minWidth: '50px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#d11010', boxSizing: 'border-box' }} required />
                {formData.numberCount === 3 && (
                  <input type="text" name="num3" value={formData.num3} onChange={handleInputChange} placeholder="เลข 3" maxLength="5" style={{ flex: 1, minWidth: '50px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#d11010', boxSizing: 'border-box' }} required />
                )}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <AlertCircle size={14} /> ระบบดักเลขซ้ำอัตโนมัติ
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} id="activeStatus" />
              <label htmlFor="activeStatus" style={{ fontSize: '13px', fontWeight: 'bold', color: formData.isActive ? '#10b981' : '#6b7280', cursor: 'pointer' }}>
                {formData.isActive ? 'ใช้งานระบบนี้อยู่ (Active)' : 'ระงับการใช้งาน (Inactive)'}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }}>
              <button type="submit" disabled={isLoading} style={{ flex: 1, backgroundColor: editingId ? '#10b981' : '#0284c7', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', opacity: isLoading ? 0.7 : 1, transition: '0.2s', boxSizing: 'border-box' }}>
                <Save size={18} /> {isLoading ? 'รอสักครู่...' : editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxSizing: 'border-box' }}>
                  <XCircle size={18} /> ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* =========================================
            ตารางด้านขวา (ปรับให้เลื่อนซ้ายขวาได้ในมือถือ)
        ========================================= */}
        <div style={{ flex: '2 1 400px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #0284c7', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span>รายการที่บันทึกแล้ว <span style={{fontSize:'11px', color:'#f59e0b'}}>(คลิกแถวเพื่อแก้)</span></span>
            <span style={{ fontSize: '11px', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '12px', color: '#6b7280' }}>
              รวม {animalList.length} รายการ
            </span>
          </h3>

          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '10px', color: '#374151', fontSize: '12px', width: '50px', textAlign: 'center' }}>รูป</th>
                  <th style={{ padding: '10px', color: '#374151', fontSize: '12px' }}>ชื่อสัตว์</th>
                  <th style={{ padding: '10px', color: '#374151', fontSize: '12px', textAlign: 'center' }}>หมวด</th>
                  <th style={{ padding: '10px', color: '#374151', fontSize: '12px', textAlign: 'center' }}>ชุดตัวเลข</th>
                  <th style={{ padding: '10px', color: '#374151', fontSize: '12px', textAlign: 'center' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : animalList.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>ยังไม่มีข้อมูลในระบบ</td></tr>
                ) : (
                  animalList.map((item, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => handleEditClick(item)}
                      style={{ 
                        borderBottom: '1px solid #f3f4f6', 
                        cursor: 'pointer', 
                        backgroundColor: editingId === item.animal_id ? '#ecfdf5' : 'transparent', 
                        transition: 'background-color 0.2s' 
                      }} 
                    >
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <img src={item.image_url} alt="animal" style={{ width: '35px', height: '35px', objectFit: 'cover', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                      </td>
                      <td style={{ padding: '8px', color: '#1f2937', fontSize: '13px' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.animal_name_th}</div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                          อัปเดต: {item.updated_by || item.created_by || 'Admin'}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {item.lottery_type} ตัว
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', flexWrap: 'wrap' }}>
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{item.num1}</span>
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{item.num2}</span>
                          {item.num3 !== '-' && (
                            <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{item.num3}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ color: item.is_active ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {item.is_active ? 'เปิดใช้งาน' : 'ปิด'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddNumberViet;