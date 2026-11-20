import React, { useState } from 'react';
import {
  Search, Database, AlertTriangle, CheckCircle2, Trash2,
  Edit3, Save, X, Table2, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const UserDataInspector = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [inspectData, setInspectData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const cleanQ = query.replace(/-/g, '').trim();
    if (!cleanQ) return alert('กรุณากรอกเลขบัตรประชาชน หรือ เบอร์โทรศัพท์');

    setLoading(true);
    setErrorMsg('');
    setIsEditing(false);

    try {
      const res = await fetch(`${API_URL}/api/admin/inspect-user?q=${encodeURIComponent(cleanQ)}`);
      const data = await res.json();
      if (data.success) {
        setInspectData(data);
        const p = data.tables.user_profiles[0] || {};
        const a = data.tables.user_accounts[0] || {};
        setEditForm({
          profile_id: p.profile_id || '',
          account_id: a.account_id || '',
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          nickname: p.nickname || '',
          gender: p.gender || '',
          dob: p.dob ? String(p.dob).split('T')[0] : '',
          house_no: p.house_no || '',
          role: a.role || 'CITIZEN',
          is_active: a.is_active !== false
        });
      } else {
        setInspectData(null);
        setErrorMsg(data.message || 'ไม่พบข้อมูล');
      }
    } catch (err) {
      setErrorMsg('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/inspect-user/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        setIsEditing(false);
        handleSearch();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ บันทึกล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!inspectData) return;
    const confirmText = window.prompt(
      '⚠️ คำเตือน: การลบนี้จะล้างข้อมูลบุคคลนี้ออกจากทุกตาราง (user_profiles, user_accounts, media, positions) และปลดออกจากผู้ใหญ่บ้าน\n\nพิมพ์คำว่า DELETE เพื่อยืนยัน:'
    );
    if (confirmText !== 'DELETE') return;

    try {
      const res = await fetch(`${API_URL}/api/admin/inspect-user/purge`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: inspectData.summary.profileIds,
          accountIds: inspectData.summary.accountIds
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        setInspectData(null);
        setQuery('');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#1e293b',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const renderTableCard = (tableName, rows, description) => {
    const isDuplicate = (tableName === 'user_profiles' || tableName === 'user_accounts') && rows.length > 1;

    return (
      <div
        key={tableName}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '18px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          paddingBottom: '12px',
          marginBottom: '14px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table2 size={18} color="#7c3aed" />
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
              {tableName}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>({description})</span>
          </div>
          <span style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: rows.length === 0 ? '#e2e8f0' : isDuplicate ? '#fee2e2' : '#d1fae5',
            color: rows.length === 0 ? '#475569' : isDuplicate ? '#b91c1c' : '#047857'
          }}>
            พบ {rows.length} แถว {isDuplicate ? '⚠️ ซ้ำซ้อน' : ''}
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>ไม่พบข้อมูลในตารางนี้</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rows.map((row, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                {rows.length > 1 && (
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>
                    แถวที่ #{idx + 1}
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '8px'
                }}>
                  {Object.entries(row).map(([colName, val]) => {
                    const isEmpty = val === null || val === undefined || val === '';
                    return (
                      <div
                        key={colName}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4338ca' }}>
                          {colName}
                        </span>
                        <span style={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          textAlign: 'right',
                          color: isEmpty ? '#d97706' : '#1e293b',
                          fontStyle: isEmpty ? 'italic' : 'normal',
                          fontWeight: isEmpty ? 400 : 600
                        }}>
                          {isEmpty ? 'NULL (ว่าง)' : typeof val === 'boolean' ? String(val) : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '24px 16px' }}>
      {/* การ์ดหลัก Light Frosted Glass */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
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
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(124, 58, 237, 0.3)'
          }}>
            <Database size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              ตรวจสอบและล้างข้อมูลบุคคล (Data Inspector)
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
              ดูความเชื่อมโยงทุกตาราง + ชื่อคอลัมน์จริง เพื่อแก้ไขหรือล้างขยะให้สะอาด
            </p>
          </div>
        </div>

        {/* กล่องค้นหา */}
        <form
          onSubmit={handleSearch}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '10px'
          }}>
            <Search size={16} /> ค้นหาด้วย เลขบัตรประชาชน (13 หลัก) หรือ เบอร์โทรศัพท์
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น 1111111111111 หรือ 0811111111"
              style={{
                flex: '1 1 280px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            >
              {loading ? 'กำลังสแกน...' : 'สแกนทุกตาราง'}
            </button>
          </div>
          {errorMsg && (
            <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 700, marginTop: '10px' }}>
              ❌ {errorMsg}
            </div>
          )}
        </form>

        {/* ผลลัพธ์การสแกน */}
        {inspectData && (
          <div>
            {/* แถบสรุป + ปุ่ม Action */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '18px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                {inspectData.summary.warnings.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, fontSize: '14px' }}>
                    <CheckCircle2 size={20} /> ข้อมูลสมบูรณ์ ไม่พบความซ้ำซ้อน
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                      <AlertTriangle size={20} /> พบจุดที่ควรตรวจสอบ ({inspectData.summary.warnings.length} รายการ)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#92400e', lineHeight: 1.6 }}>
                      {inspectData.summary.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  style={{
                    padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: '12px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <RefreshCw size={14} /> รีเฟรช
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    padding: '9px 14px', borderRadius: '10px', border: 'none',
                    backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '12px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Edit3 size={14} /> แก้ไขข้อมูลให้ครบ
                </button>
                <button
                  type="button"
                  onClick={handlePurgeAll}
                  style={{
                    padding: '9px 14px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ffffff',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> ลบข้อมูลทั้งหมด (ล้างขยะ)
                </button>
              </div>
            </div>

            {/* ฟอร์มแก้ไขด่วน */}
            {isEditing && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e3a8a' }}>
                    ✏️ แก้ไขข้อมูลพื้นฐานให้ครบ
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>ชื่อ (first_name)</label>
                    <input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>นามสกุล (last_name)</label>
                    <input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>ชื่อเล่น (nickname)</label>
                    <input type="text" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>เพศ (gender)</label>
                    <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} style={inputStyle}>
                      <option value="">-- ไม่ระบุ --</option>
                      <option value="MALE">MALE (ชาย)</option>
                      <option value="FEMALE">FEMALE (หญิง)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>วันเกิด (dob)</label>
                    <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>บ้านเลขที่ (house_no)</label>
                    <input type="text" value={editForm.house_no} onChange={e => setEditForm({ ...editForm, house_no: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>สิทธิ์หลัก (role)</label>
                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={inputStyle}>
                      <option value="CITIZEN">CITIZEN (ประชาชน)</option>
                      <option value="HEADMAN">HEADMAN (ผู้ใหญ่บ้าน)</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>สถานะบัญชี (is_active)</label>
                    <select value={String(editForm.is_active)} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'true' })} style={inputStyle}>
                      <option value="true">true (เปิดใช้งาน)</option>
                      <option value="false">false (ระงับ)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    style={{
                      padding: '10px 22px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #0d9488)', color: '#ffffff',
                      fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Save size={15} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                  </button>
                </div>
              </div>
            )}

            {/* ตารางทั้งหมดที่เชื่อมโยง */}
            {renderTableCard('user_profiles', inspectData.tables.user_profiles, 'ข้อมูลส่วนตัวหลัก')}
            {renderTableCard('user_accounts', inspectData.tables.user_accounts, 'บัญชีเข้าสู่ระบบ & สิทธิ์')}
            {renderTableCard('citizen_profiles_media', inspectData.tables.citizen_profiles_media, 'รูปโปรไฟล์ Cloudflare')}
            {renderTableCard('user_positions', inspectData.tables.user_positions, 'ประวัติการดำรงตำแหน่งทั้งหมด')}
            {renderTableCard('villages', inspectData.tables.villages, 'หมู่บ้านที่สังกัด / เป็นผู้ใหญ่บ้าน')}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDataInspector;