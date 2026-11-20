import React, { useState } from 'react';
import {
  Search, Database, AlertTriangle, CheckCircle2, Trash2,
  Edit3, Save, X, Table2, RefreshCw
} from 'lucide-react';


const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const UserDataInspector = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [inspectData, setInspectData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // State สำหรับแก้ไขข้อมูลพื้นฐาน
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // ค้นหาข้อมูลทั้งหมด
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
        // เตรียมข้อมูลสำหรับฟอร์มแก้ไข (อ้างอิงแถวแรก)
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

  // บันทึกการแก้ไข
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
        handleSearch(); // รีโหลดข้อมูลใหม่ทันที
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      alert('❌ บันทึกล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ลบข้อมูลทั้งหมดให้สะอาด (Purge)
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

  // ฟังก์ชันช่วยแสดงแต่ละตารางแบบเห็นชื่อคอลัมน์ชัดเจน
  const renderTableCard = (tableName, rows, description) => {
    const isDuplicateWarning = (tableName === 'user_profiles' || tableName === 'user_accounts') && rows.length > 1;

    return (
      <div key={tableName} className="bg-white/60 border border-white/80 rounded-2xl p-6 mb-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Table2 size={18} className="text-purple-600" />
            <span className="font-mono font-black text-slate-800 text-base">{tableName}</span>
            <span className="text-xs text-slate-500">({description})</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            rows.length === 0
              ? 'bg-slate-200 text-slate-600'
              : isDuplicateWarning
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-emerald-100 text-emerald-700'
          }`}>
            พบ {rows.length} แถว {isDuplicateWarning && '⚠️ ซ้ำซ้อน'}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="text-sm text-slate-400 italic py-2">ไม่พบข้อมูลในตารางนี้</div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div key={idx} className="bg-white/80 rounded-xl p-4 border border-slate-200">
                {rows.length > 1 && (
                  <div className="text-xs font-bold text-purple-600 mb-2">แถวที่ #{idx + 1}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(row).map(([colName, val]) => {
                    const isEmpty = val === null || val === undefined || val === '';
                    return (
                      <div key={colName} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 gap-1">
                        {/* ✨ ชื่อคอลัมน์จริงในฐานข้อมูล */}
                        <span className="font-mono font-bold text-indigo-700">{colName}</span>
                        {/* ✨ ค่าข้อมูล */}
                        <span className={`font-mono break-all sm:text-right ${isEmpty ? 'text-amber-600 italic' : 'text-slate-800 font-semibold'}`}>
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
    <div
      className="min-h-screen pb-24 font-sans relative overflow-hidden"
      style={{
        backgroundImage: "url('/hex-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
    

      <div className="max-w-4xl mx-auto p-4 pt-24 relative z-10">
        {/* ✨ การ์ดกระจกหลัก (Light Frosted Glass Theme) */}
        <div className="bg-white bg-opacity-70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40">

          {/* หัวข้อหน้า */}
          <div className="flex items-center gap-5 mb-8 border-b border-slate-200 pb-6">
            <div className="p-4 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-500/30">
              <Database size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-wide">ตรวจสอบและล้างข้อมูลบุคคล (Data Inspector)</h1>
              <p className="text-sm text-slate-500 mt-1">ดูความเชื่อมโยงทุกตาราง + ชื่อคอลัมน์จริง เพื่อแก้ไขหรือล้างขยะให้สะอาด</p>
            </div>
          </div>

          {/* กล่องค้นหา */}
          <form onSubmit={handleSearch} className="mb-8 p-6 bg-white/50 rounded-2xl border border-white/60">
            <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Search size={18} /> ค้นหาด้วย เลขบัตรประชาชน (13 หลัก) หรือ เบอร์โทรศัพท์
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="เช่น 1111111111111 หรือ 0811111111"
                className="flex-1 p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-400 text-slate-800 font-mono font-bold shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all"
              >
                {loading ? 'กำลังสแกน...' : 'สแกนทุกตาราง'}
              </button>
            </div>
            {errorMsg && <p className="text-red-600 text-sm font-bold mt-3">❌ {errorMsg}</p>}
          </form>

          {/* ผลลัพธ์การสแกน */}
          {inspectData && (
            <div className="animate-fade-in-up">
              {/* แถบสรุปสถานะ & ปุ่มจัดการ */}
              <div className="bg-white/70 border border-white rounded-2xl p-5 mb-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  {inspectData.summary.warnings.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 size={20} /> ข้อมูลสมบูรณ์ ไม่พบความซ้ำซ้อน
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                        <AlertTriangle size={20} /> พบจุดที่ควรตรวจสอบ ({inspectData.summary.warnings.length} รายการ)
                      </div>
                      <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                        {inspectData.summary.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* ปุ่ม Action */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSearch()}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw size={15} /> รีเฟรช
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 size={15} /> แก้ไขข้อมูลให้ครบ
                  </button>
                  <button
                    type="button"
                    onClick={handlePurgeAll}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Trash2 size={15} /> ลบข้อมูลทั้งหมด (ล้างขยะ)
                  </button>
                </div>
              </div>

              {/* ฟอร์มแก้ไขด่วน */}
              {isEditing && (
                <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-blue-900 text-base">✏️ แก้ไขข้อมูลพื้นฐานให้ครบ</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อ (first_name)</label>
                      <input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">นามสกุล (last_name)</label>
                      <input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อเล่น (nickname)</label>
                      <input type="text" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">เพศ (gender)</label>
                      <select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg">
                        <option value="">-- ไม่ระบุ --</option>
                        <option value="MALE">MALE (ชาย)</option>
                        <option value="FEMALE">FEMALE (หญิง)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">วันเกิด (dob)</label>
                      <input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">บ้านเลขที่ (house_no)</label>
                      <input type="text" value={editForm.house_no} onChange={e => setEditForm({ ...editForm, house_no: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">สิทธิ์หลัก (role)</label>
                      <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg">
                        <option value="CITIZEN">CITIZEN (ประชาชน)</option>
                        <option value="HEADMAN">HEADMAN (ผู้ใหญ่บ้าน)</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">สถานะบัญชี (is_active)</label>
                      <select value={String(editForm.is_active)} onChange={e => setEditForm({ ...editForm, is_active: e.target.value === 'true' })} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg">
                        <option value="true">true (เปิดใช้งาน)</option>
                        <option value="false">false (ระงับ)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md flex items-center gap-2"
                    >
                      <Save size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                  </div>
                </div>
              )}

              {/* แสดงตารางทั้งหมดที่เชื่อมโยง */}
              {renderTableCard('user_profiles', inspectData.tables.user_profiles, 'ข้อมูลส่วนตัวหลัก')}
              {renderTableCard('user_accounts', inspectData.tables.user_accounts, 'บัญชีเข้าสู่ระบบ & สิทธิ์')}
              {renderTableCard('citizen_profiles_media', inspectData.tables.citizen_profiles_media, 'รูปโปรไฟล์ Cloudflare')}
              {renderTableCard('user_positions', inspectData.tables.user_positions, 'ประวัติการดำรงตำแหน่งทั้งหมด')}
              {renderTableCard('villages', inspectData.tables.villages, 'หมู่บ้านที่สังกัด / เป็นผู้ใหญ่บ้าน')}
            </div>
          )}
        </div>
      </div>

    
    </div>
  );
};

export default UserDataInspector;