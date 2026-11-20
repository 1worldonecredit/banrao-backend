import React, { useState } from 'react';
import {
  Search, Database, AlertTriangle, CheckCircle2, Trash2,
  Edit3, Save, X, Table2, RefreshCw, FileDown, Lock
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
        // เตรียมเฉพาะข้อมูลส่วนตัวที่ปลอดภัย (ไม่รวมพื้นที่, role, is_active)
        setEditForm({
          profile_id: p.profile_id || '',
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          nickname: p.nickname || '',
          gender: p.gender || '',
          dob: p.dob ? String(p.dob).split('T')[0] : '',
          house_no: p.house_no || ''
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

  // บันทึกเฉพาะข้อมูลส่วนตัว (ไม่ส่ง account_id, role, is_active, village_id)
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

  // ✨ ฟังก์ชันส่งออกรายงาน PDF (จัดหน้า A4 รองรับภาษาไทย 100%)
  const handleExportPDF = () => {
    if (!inspectData) return;

    const p = inspectData.tables.user_profiles[0] || {};
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || query;
    const nowStr = new Date().toLocaleString('th-TH');

    const tableMeta = [
      { key: 'user_profiles', desc: 'ข้อมูลส่วนตัวหลัก' },
      { key: 'user_accounts', desc: 'บัญชีเข้าสู่ระบบ & สิทธิ์' },
      { key: 'citizen_profiles_media', desc: 'รูปโปรไฟล์ Cloudflare' },
      { key: 'user_positions', desc: 'ประวัติการดำรงตำแหน่งทั้งหมด' },
      { key: 'villages', desc: 'หมู่บ้านที่สังกัด / เป็นผู้ใหญ่บ้าน' }
    ];

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const warningsHtml = inspectData.summary.warnings.length === 0
      ? `<div class="ok-box">✅ ข้อมูลสมบูรณ์ ไม่พบความซ้ำซ้อน</div>`
      : `<div class="warn-box">
           <strong>⚠️ พบจุดที่ควรตรวจสอบ (${inspectData.summary.warnings.length} รายการ):</strong>
           <ul>${inspectData.summary.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
         </div>`;

    const tablesHtml = tableMeta.map(({ key, desc }) => {
      const rows = inspectData.tables[key] || [];
      const rowsHtml = rows.length === 0
        ? `<p class="empty">ไม่พบข้อมูลในตารางนี้</p>`
        : rows.map((row, idx) => `
            <div class="row-block">
              ${rows.length > 1 ? `<div class="row-title">แถวที่ #${idx + 1}</div>` : ''}
              <table>
                <tbody>
                  ${Object.entries(row).map(([col, val]) => {
                    const isEmpty = val === null || val === undefined || val === '';
                    return `
                      <tr>
                        <td class="col-name">${escapeHtml(col)}</td>
                        <td class="col-val ${isEmpty ? 'null-val' : ''}">
                          ${isEmpty ? 'NULL (ว่าง)' : escapeHtml(val)}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('');

      return `
        <div class="section">
          <div class="section-header">
            <span><strong>${key}</strong> (${desc})</span>
            <span class="badge">พบ ${rows.length} แถว</span>
          </div>
          ${rowsHtml}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <title>Data_Inspector_${escapeHtml(query)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif; color: #0f172a; font-size: 12px; margin: 0; }
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; font-size: 18px; color: #1e1b4b; }
          .header .meta { font-size: 11px; color: #475569; text-align: right; }
          .ok-box { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-weight: bold; }
          .warn-box { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; }
          .warn-box ul { margin: 6px 0 0 18px; padding: 0; }
          .section { border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; page-break-inside: avoid; overflow: hidden; }
          .section-header { background: #f1f5f9; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; font-size: 13px; }
          .badge { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .empty { padding: 10px 12px; color: #94a3b8; font-style: italic; margin: 0; }
          .row-block { padding: 8px 12px; border-bottom: 1px dashed #e2e8f0; }
          .row-block:last-child { border-bottom: none; }
          .row-title { font-weight: bold; color: #6d28d9; margin-bottom: 4px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
          .col-name { width: 34%; font-family: monospace; font-weight: bold; color: #3730a3; }
          .col-val { width: 66%; font-family: monospace; word-break: break-all; }
          .null-val { color: #d97706; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>รายงานตรวจสอบข้อมูลบุคคล (Ban Rao Data Inspector)</h1>
            <div style="font-size:12px; color:#475569; margin-top:4px;">คำค้นหา: <strong>${escapeHtml(query)}</strong> | ชื่อ: <strong>${escapeHtml(fullName)}</strong></div>
          </div>
          <div class="meta">วันที่ส่งออก: ${nowStr}<br/>emp.banrao.life</div>
        </div>
        ${warningsHtml}
        ${tablesHtml}
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      alert('กรุณาอนุญาต Pop-up เพื่อดาวน์โหลดไฟล์ PDF ครับ');
      return;
    }
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
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
              ดูความเชื่อมโยงทุกตาราง + ชื่อคอลัมน์จริง เพื่อแก้ไข ส่งออก PDF หรือล้างขยะให้สะอาด
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
                {/* ✨ ปุ่มดาวน์โหลด PDF */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  style={{
                    padding: '9px 14px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #059669, #0d9488)', color: '#ffffff',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <FileDown size={14} /> ดาวน์โหลด PDF
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
                  <Edit3 size={14} /> แก้ไขข้อมูลพื้นฐาน
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

            {/* ฟอร์มแก้ไขเฉพาะข้อมูลส่วนตัวที่ปลอดภัย (ล็อกพื้นที่และสิทธิ์ทั้งหมด) */}
            {isEditing && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e3a8a' }}>
                    ✏️ แก้ไขข้อมูลส่วนตัวพื้นฐาน (user_profiles)
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* แจ้งเตือนการล็อกฟิลด์ที่มีผลกระทบ */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', color: '#475569', backgroundColor: '#e0f2fe',
                  padding: '8px 12px', borderRadius: '8px', marginBottom: '14px'
                }}>
                  <Lock size={14} color="#0369a1" />
                  <span>ข้อมูลพื้นที่ปกครอง (หมู่บ้าน/ต.อ.จ.), เลขบัตรประชาชน, สิทธิ์ (role) และสถานะบัญชี ถูกล็อกไว้เพื่อป้องกันผลกระทบต่อระบบ</span>
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