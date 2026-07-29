import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Image as ImageIcon, UploadCloud } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.salapi.company';// 🌟 เปลี่ยนเป็น URL ของ Backend พี่

const AddNumberViet = () => {
  const [animalList, setAnimalList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // State สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    animalName: '',
    imagePreview: null, // สำหรับโชว์รูปหน้าเว็บ
    imageBase64: '',    // สำหรับส่งไป Database
    lotteryType: '2',
    numberCount: 3,
    num1: '',
    num2: '',
    num3: ''
  });

  // 🌟 1. API: ดึงข้อมูลจากฐานข้อมูล
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🌟 ฟังก์ชัน: อัปโหลดและแปลงรูปเป็น Base64 เพื่อส่งเข้า Database ง่ายๆ
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          imagePreview: URL.createObjectURL(file), // พรีวิวรูป
          imageBase64: reader.result               // ข้อมูลรูปส่งเข้า DB
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountChange = (count) => {
    setFormData({ 
      ...formData, 
      numberCount: count,
      num3: count === 2 ? '' : formData.num3 
    });
  };

  // 🌟 2. API: ส่งข้อมูลเพิ่มลงฐานข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { animalName, imageBase64, lotteryType, numberCount, num1, num2, num3 } = formData;

    if (!animalName || !imageBase64 || !num1 || !num2 || (numberCount === 3 && !num3)) {
      alert('กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน');
      return;
    }

    const newNumbers = [num1, num2];
    if (numberCount === 3) newNumbers.push(num3);

    const uniqueNumbers = new Set(newNumbers);
    if (uniqueNumbers.size !== newNumbers.length) {
      alert('❌ คุณกรอกเลขซ้ำกันเองในฟอร์ม!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        animal_name_th: animalName,
        image_url: imageBase64, // ส่งรูปเป็น String Base64 
        lottery_type: lotteryType,
        num1: num1,
        num2: num2,
        num3: numberCount === 3 ? num3 : '-',
        is_active: 1
      };

      const res = await fetch(`${API_URL}/api/admin/animal-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if(data.success) { 
        alert('✅ บันทึกข้อมูลสำเร็จ!');
        fetchAnimals(); 
        setFormData({ animalName: '', imagePreview: null, imageBase64: '', lotteryType: '2', numberCount: 3, num1: '', num2: '', num3: '' });
      } else {
        alert(data.message); 
      }

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          <span style={{ color: '#f97316' }}>|</span> จัดการระบบเลขหวยเวียดนาม
        </h2>
      </div>

      {/* 🌟 Layout หลัก: ซ้ายฟอร์ม (flex: 1), ขวาตาราง (flex: 2) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* =========================================
            ฝั่งซ้าย: ฟอร์มเพิ่มข้อมูล (กรอบสีส้ม-ฟ้า)
        ========================================= */}
        <div style={{ flex: '1 1 320px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #f97316' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#f97316', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>NEW</span> 
            เพิ่มรายการสัตว์และตัวเลข
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>โหมดหมู่ (ประเภทหวย) *</label>
              <select name="lotteryType" value={formData.lotteryType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0284c7', fontWeight: 'bold' }}>
                <option value="2">หมวด 2 ตัว</option>
                <option value="3">หมวด 3 ตัว</option>
                <option value="4">หมวด 4 ตัว</option>
                <option value="6">หมวด 6 ตัว</option>
                <option value="8">หมวด 8 ตัว</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>ชื่อสัตว์ (ภาษาลาว/ไทย) *</label>
              <input type="text" name="animalName" value={formData.animalName} onChange={handleInputChange} placeholder="เช่น ปาน้อย (ປານ້ອຍ)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} required />
            </div>

            {/* 🌟 ระบบอัปโหลดรูป */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>อัปโหลดรูปภาพ *</label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                
                <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {formData.imagePreview ? <img src={formData.imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={24} color="#9ca3af" />}
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    <UploadCloud size={18} /> {formData.imagePreview ? 'เปลี่ยนรูปภาพ' : 'คลิกเพื่อเลือกรูปภาพ'}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#4b5563' }}>จำนวนตัวเลขของสัตว์นี้ *</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: formData.numberCount === 2 ? 'bold' : 'normal' }}>
                  <input type="radio" checked={formData.numberCount === 2} onChange={() => handleCountChange(2)} style={{ width: '16px', height: '16px', accentColor: '#f97316' }} />
                  มีแค่ 2 เลข
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#374151', fontWeight: formData.numberCount === 3 ? 'bold' : 'normal' }}>
                  <input type="radio" checked={formData.numberCount === 3} onChange={() => handleCountChange(3)} style={{ width: '16px', height: '16px', accentColor: '#f97316' }} />
                  มี 3 เลข
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>ระบุตัวเลข (00-99) *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" name="num1" value={formData.num1} onChange={handleInputChange} placeholder="เลข 1" maxLength="5" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: '#d11010' }} required />
                <input type="text" name="num2" value={formData.num2} onChange={handleInputChange} placeholder="เลข 2" maxLength="5" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: '#d11010' }} required />
                {formData.numberCount === 3 && (
                  <input type="text" name="num3" value={formData.num3} onChange={handleInputChange} placeholder="เลข 3" maxLength="5" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: '#d11010' }} required />
                )}
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                <AlertCircle size={14} /> ระบบดักเลขซ้ำอัตโนมัติ (หลังบ้าน)
              </p>
            </div>

            <button type="submit" disabled={isLoading} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px', opacity: isLoading ? 0.7 : 1, transition: '0.2s', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)' }}>
              <Save size={20} /> {isLoading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>

        {/* =========================================
            ฝั่งขวา: ตารางแสดงข้อมูล (กรอบสีฟ้า)
        ========================================= */}
        <div style={{ flex: '2 1 500px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid #0284c7', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>รายการที่บันทึกแล้วในระบบ</span>
            <span style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', color: '#6b7280' }}>
              รวม {animalList.length} รายการ
            </span>
          </h3>

          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '12px 10px', color: '#374151', fontSize: '13px', width: '60px', textAlign: 'center' }}>รูป</th>
                  <th style={{ padding: '12px 10px', color: '#374151', fontSize: '13px' }}>ชื่อสัตว์</th>
                  <th style={{ padding: '12px 10px', color: '#374151', fontSize: '13px', textAlign: 'center' }}>หมวด</th>
                  <th style={{ padding: '12px 10px', color: '#374151', fontSize: '13px', textAlign: 'center' }}>ชุดตัวเลข</th>
                  <th style={{ padding: '12px 10px', color: '#374151', fontSize: '13px', textAlign: 'center' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : animalList.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>ยังไม่มีข้อมูลในระบบ</td></tr>
                ) : (
                  animalList.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {/* 🌟 แสดงรูป Base64 หรือลิงก์จาก DB ได้เลย */}
                        <img src={item.image_url} alt="animal" style={{ width: '40px', height: '40px', objectFit: 'cover', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1f2937', fontSize: '14px' }}>
                        {item.animal_name_th}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                          {item.lottery_type} ตัว
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{item.num1}</span>
                          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{item.num2}</span>
                          {item.num3 !== '-' && (
                            <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{item.num3}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{ color: item.is_active ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', backgroundColor: item.is_active ? '#10b981' : '#ef4444', borderRadius: '50%' }}></span>
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