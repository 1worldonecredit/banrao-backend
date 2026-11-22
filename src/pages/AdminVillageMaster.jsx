import React, { useState, useEffect } from 'react';
import { Save, MapPin, ListPlus, Pencil, Check, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const AdminVillageMaster = () => {
  const [provinces, setProvinces] = useState([]);
  const [amphures, setAmphures] = useState([]);
  const [tambons, setTambons] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedAmphure, setSelectedAmphure] = useState('');
  const [selectedTambon, setSelectedTambon] = useState('');

  const [villagesInput, setVillagesInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingVillages, setExistingVillages] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  // State แก้ไขชื่อหมู่บ้านในตาราง
  const [editingId, setEditingId] = useState(null);
  const [editNo, setEditNo] = useState('');
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // State แก้ไขชื่อ จังหวัด / อำเภอ / ตำบล
  const [areaEditModal, setAreaEditModal] = useState({
    open: false,
    type: '', // 'province' | 'amphure' | 'tambon'
    id: '',
    label: '',
    value: ''
  });
  const [isSavingArea, setIsSavingArea] = useState(false);

  const [areaStats, setAreaStats] = useState({
    total_provinces: 0, provinces_with_villages: 0,
    total_amphures: 0, amphures_with_villages: 0,
    total_tambons: 0, tambons_with_villages: 0,
    total_villages: 0
  });

  const fetchAreaStats = () => {
    fetch(`${API_URL}/api/area/village-stats`)
      .then((res) => res.json())
      .then((res) => { if (res.success) setAreaStats(res.data); })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAreaStats();
    fetch(`${API_URL}/api/sys-provinces`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProvinces(data.map((item) => ({ id: item.province_code, name_th: item.province_name_th })));
        }
      })
      .catch((err) => console.error('Error fetching provinces:', err));
  }, []);

  useEffect(() => {
    setSelectedAmphure('');
    setSelectedTambon('');
    setTambons([]);
    setExistingVillages([]);
    if (!selectedProvince) {
      setAmphures([]);
      return;
    }
    fetch(`${API_URL}/api/sys-amphures/${selectedProvince}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAmphures(data.map((item) => ({ id: item.amphure_code, name_th: item.amphure_name_th })));
        }
      })
      .catch((err) => console.error('Error fetching amphures:', err));
  }, [selectedProvince]);

  const fetchTambons = (amphureCode) => {
    if (!amphureCode) {
      setTambons([]);
      return;
    }
    fetch(`${API_URL}/api/sys-tambons-with-count/${amphureCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTambons(data.map((t) => ({
            id: t.tambon_id,
            name_th: t.tambon_name_th,
            village_count: t.village_count || 0
          })));
        } else {
          setTambons([]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    setSelectedTambon('');
    setExistingVillages([]);
    fetchTambons(selectedAmphure);
  }, [selectedAmphure]);

  const fetchExistingVillages = () => {
    if (!selectedTambon) {
      setExistingVillages([]);
      return;
    }
    setIsLoadingTable(true);
    fetch(`${API_URL}/api/villages/by-tambon-id/${selectedTambon}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) =>
            String(a.village_no).localeCompare(String(b.village_no), undefined, { numeric: true, sensitivity: 'base' })
          );
          setExistingVillages(sortedData);
        } else {
          setExistingVillages([]);
        }
      })
      .catch((err) => console.error('Error fetching existing villages:', err))
      .finally(() => setIsLoadingTable(false));
  };

  useEffect(() => {
    fetchExistingVillages();
  }, [selectedTambon]);

  // ==========================
  // แก้ไขชื่อ จังหวัด / อำเภอ / ตำบล
  // ==========================
  const openEditArea = (type) => {
    if (type === 'province') {
      const item = provinces.find((p) => String(p.id) === String(selectedProvince));
      if (!item) return;
      setAreaEditModal({ open: true, type: 'province', id: item.id, label: 'แก้ไขชื่อจังหวัด', value: item.name_th });
    } else if (type === 'amphure') {
      const item = amphures.find((a) => String(a.id) === String(selectedAmphure));
      if (!item) return;
      setAreaEditModal({ open: true, type: 'amphure', id: item.id, label: 'แก้ไขชื่ออำเภอ', value: item.name_th });
    } else if (type === 'tambon') {
      const item = tambons.find((t) => String(t.id) === String(selectedTambon));
      if (!item) return;
      setAreaEditModal({ open: true, type: 'tambon', id: item.id, label: 'แก้ไขชื่อตำบล', value: item.name_th });
    }
  };

  const handleSaveAreaName = async (e) => {
    e.preventDefault();
    if (!areaEditModal.value.trim()) return alert('กรุณากรอกชื่อที่ต้องการแก้ไข');
    setIsSavingArea(true);

    let endpoint = '';
    if (areaEditModal.type === 'province') endpoint = `${API_URL}/api/admin/sys-provinces/${areaEditModal.id}`;
    if (areaEditModal.type === 'amphure') endpoint = `${API_URL}/api/admin/sys-amphures/${areaEditModal.id}`;
    if (areaEditModal.type === 'tambon') endpoint = `${API_URL}/api/admin/sys-tambons/${areaEditModal.id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name_th: areaEditModal.value.trim() })
      });
      const result = await res.json();
      if (result.success) {
        const newName = areaEditModal.value.trim();
        if (areaEditModal.type === 'province') {
          setProvinces((prev) => prev.map((p) => (String(p.id) === String(areaEditModal.id) ? { ...p, name_th: newName } : p)));
        } else if (areaEditModal.type === 'amphure') {
          setAmphures((prev) => prev.map((a) => (String(a.id) === String(areaEditModal.id) ? { ...a, name_th: newName } : a)));
        } else if (areaEditModal.type === 'tambon') {
          setTambons((prev) => prev.map((t) => (String(t.id) === String(areaEditModal.id) ? { ...t, name_th: newName } : t)));
        }
        setAreaEditModal({ open: false, type: '', id: '', label: '', value: '' });
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('❌ บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSavingArea(false);
    }
  };

  // ==========================
  // เพิ่มหมู่บ้านแบบกลุ่ม & แก้ไขชื่อหมู่บ้าน
  // ==========================
  const handleSave = async () => {
    if (!selectedTambon) return alert('กรุณาเลือกตำบล');
    if (!villagesInput.trim()) return alert('กรุณากรอกรายชื่อหมู่บ้าน');

    setIsLoading(true);
    const lines = villagesInput.split('\n').filter((line) => line.trim() !== '');
    const villagesToSave = lines.map((line) => {
      const parts = line.trim().split(' ');
      const moo = !isNaN(parts[0]) ? parts[0] : '-';
      const name = !isNaN(parts[0]) ? parts.slice(1).join(' ') : line.trim();
      return { village_no: moo, village_name: name };
    });

    try {
      const res = await fetch(`${API_URL}/api/sys-villages/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tambon_id: selectedTambon, villages: villagesToSave })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setVillagesInput('');
        fetchExistingVillages();
        fetchAreaStats();
        fetchTambons(selectedAmphure);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (v) => {
    setEditingId(v.village_id);
    setEditNo(v.village_no || '');
    setEditName(v.village_name || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNo('');
    setEditName('');
  };

  const handleSaveEdit = async (villageId) => {
    if (!editName.trim()) return alert('กรุณากรอกชื่อหมู่บ้าน');
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/villages/${villageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ village_no: editNo, village_name: editName })
      });
      const result = await res.json();
      if (result.success) {
        setExistingVillages((prev) =>
          prev.map((v) =>
            v.village_id === villageId
              ? { ...v, village_no: result.data.village_no, village_name: result.data.village_name }
              : v
          )
        );
        handleCancelEdit();
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
    fontSize: '13px', fontWeight: 600, color: '#1e293b', boxSizing: 'border-box', outline: 'none'
  };

  const statCardStyle = {
    backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        color: '#1e293b'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          paddingBottom: '20px', marginBottom: '20px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', flexShrink: 0, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
          }}>
            <MapPin size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              จัดการฐานข้อมูลพื้นที่และหมู่บ้าน (Master Data)
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
              เพิ่มรายชื่อหมู่บ้าน แก้ไขชื่อหมู่บ้าน รวมถึงแก้ไขคำผิดของชื่อ จังหวัด / อำเภอ / ตำบล ได้โดยตรง
            </p>
          </div>
        </div>

        {/* การ์ดสถิติ 4 ช่อง */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '22px' }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>จังหวัด (เพิ่มแล้ว / ทั้งหมด)</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#4f46e5', marginTop: '4px' }}>
              {(areaStats.provinces_with_villages || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>/ {(areaStats.total_provinces || 0).toLocaleString()}</span>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>อำเภอ (เพิ่มแล้ว / ทั้งหมด)</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>
              {(areaStats.amphures_with_villages || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>/ {(areaStats.total_amphures || 0).toLocaleString()}</span>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>ตำบล (เพิ่มแล้ว / ทั้งหมด)</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
              {(areaStats.tambons_with_villages || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>/ {(areaStats.total_tambons || 0).toLocaleString()}</span>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>หมู่บ้านในระบบทั้งหมด</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>
              {(areaStats.total_villages || 0).toLocaleString()}{' '}
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>หมู่บ้าน</span>
            </div>
          </div>
        </div>

        {/* เนื้อหาหลัก 2 ฝั่ง */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* ฝั่งซ้าย: เลือกพื้นที่ (พร้อมปุ่มแก้คำผิด) + เพิ่มหมู่บ้าน */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              {/* จังหวัด */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>จังหวัด</label>
                  {selectedProvince && (
                    <button type="button" onClick={() => openEditArea('province')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Pencil size={11} /> แก้ชื่อ
                    </button>
                  )}
                </div>
                <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} style={selectStyle}>
                  <option value="">-- เลือกจังหวัด --</option>
                  {provinces.map((p) => <option key={p.id} value={p.id}>{p.name_th}</option>)}
                </select>
              </div>

              {/* อำเภอ */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>อำเภอ</label>
                  {selectedAmphure && (
                    <button type="button" onClick={() => openEditArea('amphure')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Pencil size={11} /> แก้ชื่อ
                    </button>
                  )}
                </div>
                <select value={selectedAmphure} onChange={(e) => setSelectedAmphure(e.target.value)} disabled={!selectedProvince} style={{ ...selectStyle, opacity: !selectedProvince ? 0.6 : 1 }}>
                  <option value="">-- เลือกอำเภอ --</option>
                  {amphures.map((a) => <option key={a.id} value={a.id}>{a.name_th}</option>)}
                </select>
              </div>

              {/* ตำบล */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>ตำบล</label>
                  {selectedTambon && (
                    <button type="button" onClick={() => openEditArea('tambon')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Pencil size={11} /> แก้ชื่อ
                    </button>
                  )}
                </div>
                <select value={selectedTambon} onChange={(e) => setSelectedTambon(e.target.value)} disabled={!selectedAmphure} style={{ ...selectStyle, opacity: !selectedAmphure ? 0.6 : 1 }}>
                  <option value="">-- เลือกตำบล --</option>
                  {tambons.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.village_count > 0 ? '✅' : '⬜'} {t.name_th} ({t.village_count} หมู่บ้าน)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                <ListPlus size={16} color="#2563eb" /> รายชื่อหมู่บ้าน (แยกบรรทัด)
              </label>
              <textarea
                rows="8"
                value={villagesInput}
                onChange={(e) => setVillagesInput(e.target.value)}
                placeholder={'กรอกรูปแบบ: [หมู่ที่] [ชื่อหมู่บ้าน] (1 บรรทัดต่อ 1 หมู่บ้าน)\nเช่น:\n1 บ้านดง\n2 บ้านน้ำร้อน'}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc', fontSize: '13px', color: '#1e293b', boxSizing: 'border-box', outline: 'none', resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '11px', color: '#b45309', backgroundColor: '#fffbeb', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fde68a', marginTop: '8px' }}>
                * ระบบจะแยกข้อมูลด้วยการเว้นวรรคช่องแรก เช่น พิมพ์ "1 บ้านดง" → หมู่ที่=1, ชื่อ=บ้านดง
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || !selectedTambon || !villagesInput}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: (isLoading || !selectedTambon || !villagesInput) ? 'not-allowed' : 'pointer',
                background: (isLoading || !selectedTambon || !villagesInput) ? '#e2e8f0' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: (isLoading || !selectedTambon || !villagesInput) ? '#94a3b8' : '#ffffff'
              }}
            >
              <Save size={17} /> {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหมู่บ้านเข้าสู่ระบบ'}
            </button>
          </div>

          {/* ฝั่งขวา: ตารางหมู่บ้านในตำบล */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#0f172a', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <ListPlus size={18} color="#4f46e5" /> หมู่บ้านในระบบ ({existingVillages.length})
            </div>

            {!selectedTambon ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '13px' }}>
                กรุณาเลือกตำบลเพื่อดูและแก้ไขรายชื่อหมู่บ้าน
              </div>
            ) : isLoadingTable ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>กำลังโหลดข้อมูลหมู่บ้าน...</div>
            ) : existingVillages.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '13px' }}>
                ยังไม่มีข้อมูลหมู่บ้านในตำบลนี้
              </div>
            ) : (
              <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px', width: '70px' }}>หมู่ที่</th>
                      <th style={{ padding: '10px 12px' }}>ชื่อหมู่บ้าน</th>
                      <th style={{ padding: '10px 12px', width: '80px', textAlign: 'center' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingVillages.map((v, idx) => {
                      const isEditing = editingId === v.village_id;
                      return (
                        <tr key={v.village_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 800, color: '#4f46e5' }}>
                            {isEditing ? (
                              <input type="text" value={editNo} onChange={(e) => setEditNo(e.target.value)} style={{ width: '50px', padding: '5px', borderRadius: '6px', border: '1px solid #6366f1', fontSize: '13px' }} />
                            ) : v.village_no}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                            {isEditing ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #6366f1', fontSize: '13px', boxSizing: 'border-box' }} />
                            ) : v.village_name}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                <button type="button" disabled={isUpdating} onClick={() => handleSaveEdit(v.village_id)} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: '#d1fae5', color: '#047857', cursor: 'pointer' }}><Check size={14} /></button>
                                <button type="button" onClick={handleCancelEdit} style={{ padding: '5px', borderRadius: '6px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => handleStartEdit(v)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} title="แก้ไขชื่อหมู่บ้าน"><Pencil size={15} /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal แก้ไขคำผิด จังหวัด / อำเภอ / ตำบล */}
      {areaEditModal.open && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <form onSubmit={handleSaveAreaName} style={{
            backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>{areaEditModal.label}</span>
              <button type="button" onClick={() => setAreaEditModal({ open: false, type: '', id: '', label: '', value: '' })} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ชื่อภาษาไทยที่ถูกต้อง *</label>
              <input
                required
                autoFocus
                type="text"
                value={areaEditModal.value}
                onChange={(e) => setAreaEditModal({ ...areaEditModal, value: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setAreaEditModal({ open: false, type: '', id: '', label: '', value: '' })} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" disabled={isSavingArea} style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Save size={14} /> {isSavingArea ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminVillageMaster;