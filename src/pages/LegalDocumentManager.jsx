import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    ShieldCheck,
    PlusCircle,
    CheckCircle2,
    AlertCircle,
    Search,
    RefreshCw,
    Clock,
    Globe,
    KeyRound
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function formatThaiDateTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return '-';
    const bkk = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return `${bkk.getDate()} ${THAI_MONTHS[bkk.getMonth()]} ${bkk.getFullYear() + 543} ${String(bkk.getHours()).padStart(2, '0')}:${String(bkk.getMinutes()).padStart(2, '0')} น.`;
}

export default function LegalDocumentManager() {
    const [activeTab, setActiveTab] = useState('DOCS'); // DOCS | CONSENTS
    const [documents, setDocuments] = useState([]);
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [feedback, setFeedback] = useState(null);

    // ฟอร์มเพิ่มเอกสารเวอร์ชันใหม่
    const [version, setVersion] = useState('1.1');
    const [titleTh, setTitleTh] = useState('คำขอเปิดบัญชีกระเป๋าเงินอิเล็กทรอนิกส์และข้อตกลงการใช้บริการ (BAN RAO WALLET)');
    const [contentTh, setContentTh] = useState('');
    const [setActiveNow, setSetActiveNow] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dRes, cRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/legal/documents`),
                fetch(`${API_URL}/api/admin/legal/consents?q=${encodeURIComponent(searchQ)}`)
            ]);
            const dJson = await dRes.json().catch(() => ({}));
            const cJson = await cRes.json().catch(() => ({}));
            if (dJson.success) setDocuments(dJson.documents || []);
            if (cJson.success) setConsents(cJson.consents || []);
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }, [searchQ]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleCreateDoc = async (e) => {
        e.preventDefault();
        if (!titleTh.trim() || !contentTh.trim()) {
            setFeedback({ type: 'error', text: 'กรุณากรอกชื่อเอกสารและเนื้อหาข้อตกลง' });
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/legal/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_code: 'WALLET_OPENING_TERMS',
                    version,
                    title_th: titleTh,
                    content_th: contentTh,
                    set_active: setActiveNow,
                    created_by: 'ADMIN'
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setFeedback({ type: 'error', text: data.message || 'บันทึกเอกสารไม่สำเร็จ' });
                return;
            }
            setFeedback({ type: 'success', text: data.message });
            setContentTh('');
            await loadAll();
        } finally {
            setSaving(false);
        }
    };

    const handleActivateDoc = async (docId) => {
        if (!window.confirm('ยืนยันตั้งเอกสารฉบับนี้เป็นฉบับใช้งานปัจจุบันบนหน้าเว็บลูกค้า?')) return;
        setFeedback(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/legal/documents/${docId}/activate`, { method: 'PATCH' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setFeedback({ type: 'error', text: data.message || 'สลับสถานะไม่สำเร็จ' });
                return;
            }
            setFeedback({ type: 'success', text: data.message });
            await loadAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
            {/* หัวข้อหน้า */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck size={24} className="text-emerald-600" />
                        จัดการเอกสารทางกฎหมายขอเปิดบัญชี (BAN RAO WALLET)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        บันทึกแบบ Append-Only ห้ามลบ เพื่อเก็บหลักฐานการยินยอมเปิดบัญชีและยืนยัน PIN 6 หลักของลูกค้า
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadAll}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรชข้อมูล
                </button>
            </div>

            {/* แท็บสลับ 2 โหมด */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('DOCS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                        activeTab === 'DOCS'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <FileText size={16} /> 1. เพิ่ม / แก้ไขเอกสารข้อตกลง ({documents.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('CONSENTS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                        activeTab === 'CONSENTS'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <ShieldCheck size={16} /> 2. ทะเบียนหลักฐานลูกค้าที่เปิดบัญชีแล้ว ({consents.length})
                </button>
            </div>

            {feedback && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                >
                    {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{feedback.text}</span>
                </div>
            )}

            {/* ================= TAB 1: จัดการเอกสารทางกฎหมาย ================= */}
            {activeTab === 'DOCS' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* ฟอร์มเพิ่มฉบับใหม่ */}
                    <form onSubmit={handleCreateDoc} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs h-fit">
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <PlusCircle size={18} className="text-emerald-600" />
                            เพิ่มเอกสารขอเปิดบัญชีเวอร์ชันใหม่
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">เวอร์ชัน *</label>
                                <input
                                    type="text"
                                    required
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="เช่น 1.1"
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อเอกสาร (ภาษาไทย) *</label>
                                <input
                                    type="text"
                                    required
                                    value={titleTh}
                                    onChange={(e) => setTitleTh(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">เนื้อหาข้อตกลงทางกฎหมาย *</label>
                            <textarea
                                rows={10}
                                required
                                value={contentTh}
                                onChange={(e) => setContentTh(e.target.value)}
                                placeholder="พิมพ์รายละเอียดข้อตกลงทางกฎหมาย ข้อ 1, 2, 3..."
                                className="w-full p-3 rounded-xl border border-slate-300 text-xs leading-relaxed"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={setActiveNow}
                                onChange={(e) => setSetActiveNow(e.target.checked)}
                                className="w-4 h-4 accent-emerald-600"
                            />
                            เปิดใช้งานเป็นฉบับปัจจุบันทันที (แสดงให้ลูกค้าใหม่ทุกคนเห็น)
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
                        >
                            {saving ? 'กำลังบันทึก...' : '+ บันทึกเอกสารเวอร์ชันใหม่'}
                        </button>
                    </form>

                    {/* รายการเอกสารทุกเวอร์ชัน */}
                    <div className="lg:col-span-7 space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.doc_id}
                                className={`bg-white rounded-2xl border p-4 space-y-2.5 shadow-xs ${
                                    doc.is_active ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono text-[11px] font-bold">
                                            v{doc.version}
                                        </span>
                                        <span className="text-sm font-extrabold text-slate-900">{doc.title_th}</span>
                                    </div>
                                    {doc.is_active ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                                            ✓ ใช้งานอยู่ปัจจุบัน
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleActivateDoc(doc.doc_id)}
                                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold border border-slate-200"
                                        >
                                            ตั้งเป็นฉบับใช้งานปัจจุบัน
                                        </button>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line max-h-40 overflow-y-auto">
                                    {doc.content_th}
                                </div>

                                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                    <span>รหัสเอกสาร: {doc.doc_code} (#{doc.doc_id})</span>
                                    <span>บันทึกเมื่อ: {formatThaiDateTime(doc.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= TAB 2: ทะเบียนหลักฐานลูกค้าที่กดยอมรับเปิดบัญชี ================= */}
            {activeTab === 'CONSENTS' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                placeholder="ค้นหาชื่อลูกค้า, Account ID หรือ IP Address..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-2.5 px-3">วันเวลาที่ยินยอม (พ.ศ.)</th>
                                    <th className="py-2.5 px-3">ผู้ขอเปิดบัญชี</th>
                                    <th className="py-2.5 px-3">เอกสาร / PIN</th>
                                    <th className="py-2.5 px-3">ผู้อนุมัติ</th>
                                    <th className="py-2.5 px-3">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {consents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-slate-400">
                                            ยังไม่มีรายการลูกค้าที่ยื่นคำขอเปิดบัญชี
                                        </td>
                                    </tr>
                                ) : (
                                    consents.map((c) => (
                                        <tr key={c.consent_id} className="hover:bg-slate-50">
                                            <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-semibold">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={13} className="text-slate-400" />
                                                    {formatThaiDateTime(c.accepted_at)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="font-extrabold text-slate-900">{c.applicant_name || '-'}</div>
                                                <div className="text-[10px] font-mono text-slate-400">{c.account_id}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold mr-1.5">
                                                    v{c.doc_version}
                                                </span>
                                                {c.pin_verified && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                        <KeyRound size={10} /> ยืนยัน PIN แล้ว
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-slate-700">
                                                <div className="font-bold text-emerald-700">{c.approved_by_dept}</div>
                                                <div className="text-[10px] text-slate-400">{c.approved_by_name}</div>
                                            </td>
                                            <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <Globe size={12} className="text-slate-400" />
                                                    {c.ip_address || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}