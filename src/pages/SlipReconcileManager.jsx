// [EMP-RECON-01] หน้าหลังบ้านตรวจสลิป + ส่งแก้ไขแบบมาร์คจุดผิด + คีย์ Statement เงินเข้า + กระทบยอดอัตโนมัติ + สรุปรายวัน/เดือน/ปี
import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Landmark,
    Zap,
    BarChart3,
    FileSearch,
    PlusCircle,
    Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const FIELD_LABELS = {
    slip_image: 'รูปสลิปไม่ชัด / ไม่ถูกต้อง',
    amount: 'ยอดเงินไม่ตรง',
    transfer_date: 'วันที่โอนไม่ตรงสลิป',
    transfer_time: 'เวลาโอน (ชม:นาที:วินาที) ไม่ตรงสลิป',
    receiver_account: 'โอนผิดบัญชีรับเงิน'
};

const STATUS_BADGE = {
    PENDING: { label: 'รอตรวจสลิป', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    RESUBMITTED: { label: 'ส่งแก้ไขกลับมาแล้ว', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
    NEED_FIX: { label: 'ส่งกลับให้แก้ไข', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
    SLIP_VERIFIED: { label: 'สลิปถูกต้อง (รอกระทบยอด)', cls: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    APPROVED: { label: 'กระทบยอดสำเร็จ', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'ไม่สำเร็จ / ปฏิเสธ', cls: 'bg-red-100 text-red-800 border-red-300' }
};

function formatThaiDate(isoStr) {
    if (!isoStr) return '-';
    const [y, m, d] = String(isoStr).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return isoStr;
    return `${d} ${THAI_MONTHS[m - 1] || ''} ${y + 543}`;
}

function formatPeriodThai(periodKey, mode) {
    if (!periodKey) return '-';
    if (mode === 'YEARLY') return `พ.ศ. ${Number(periodKey) + 543}`;
    if (mode === 'MONTHLY') {
        const [y, m] = periodKey.split('-').map(Number);
        return `${THAI_MONTHS[m - 1] || m} ${y + 543}`;
    }
    return formatThaiDate(periodKey);
}

function getBangkokNowParts() {
    const bkk = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return {
        day: String(bkk.getDate()).padStart(2, '0'),
        month: String(bkk.getMonth() + 1).padStart(2, '0'),
        yearBE: String(bkk.getFullYear() + 543),
        hh: String(bkk.getHours()).padStart(2, '0'),
        mi: String(bkk.getMinutes()).padStart(2, '0'),
        ss: String(bkk.getSeconds()).padStart(2, '0')
    };
}

export default function SlipReconcileManager() {
    const [activeTab, setActiveTab] = useState('SLIPS'); // SLIPS | STATEMENTS | SUMMARY
    const [loading, setLoading] = useState(false);

    // Tab 1: สลิปรอตรวจ
    const [slipFilter, setSlipFilter] = useState('ALL');
    const [slips, setSlips] = useState([]);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [wrongFields, setWrongFields] = useState([]);
    const [adminNote, setAdminNote] = useState('');
    const [savingReview, setSavingReview] = useState(false);

    // Tab 2: Statement เงินเข้า + กระทบยอดอัตโนมัติ
    const [channels, setChannels] = useState([]);
    const [statements, setStatements] = useState([]);
    const nowBkk = getBangkokNowParts();
    const [stmtChannelId, setStmtChannelId] = useState('');
    const [stmtAmount, setStmtAmount] = useState('');
    const [stmtDay, setStmtDay] = useState(nowBkk.day);
    const [stmtMonth, setStmtMonth] = useState(nowBkk.month);
    const [stmtYearBE, setStmtYearBE] = useState(nowBkk.yearBE);
    const [stmtHour, setStmtHour] = useState(nowBkk.hh);
    const [stmtMin, setStmtMin] = useState(nowBkk.mi);
    const [stmtSec, setStmtSec] = useState(nowBkk.ss);
    const [stmtNote, setStmtNote] = useState('');
    const [reconciling, setReconciling] = useState(false);

    // Tab 3: สรุปยอดรายวัน/เดือน/ปี
    const [summaryMode, setSummaryMode] = useState('DAILY');
    const [summaryRows, setSummaryRows] = useState([]);

    const loadSlips = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/payment-slips?status=${slipFilter}`);
            const data = await res.json();
            if (data.success) setSlips(data.submissions || []);
        } finally {
            setLoading(false);
        }
    }, [slipFilter]);

    const loadStatementsAndChannels = useCallback(async () => {
        setLoading(true);
        try {
            const [chRes, stRes] = await Promise.all([
                fetch(`${API_URL}/api/payment-channels?include_inactive=true`),
                fetch(`${API_URL}/api/admin/bank-statements?status=ALL`)
            ]);
            const chJson = await chRes.json();
            const stJson = await stRes.json();
            if (chJson.success) {
                setChannels(chJson.channels || []);
                if (chJson.channels?.length > 0 && !stmtChannelId) {
                    setStmtChannelId(String(chJson.channels[0].channel_id));
                }
            }
            if (stJson.success) setStatements(stJson.statements || []);
        } finally {
            setLoading(false);
        }
    }, [stmtChannelId]);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/reconcile-summary?mode=${summaryMode}`);
            const data = await res.json();
            if (data.success) setSummaryRows(data.rows || []);
        } finally {
            setLoading(false);
        }
    }, [summaryMode]);

    useEffect(() => {
        if (activeTab === 'SLIPS') loadSlips();
        if (activeTab === 'STATEMENTS') loadStatementsAndChannels();
        if (activeTab === 'SUMMARY') loadSummary();
    }, [activeTab, loadSlips, loadStatementsAndChannels, loadSummary]);

    const toggleWrongField = (key) => {
        setWrongFields((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleReviewSlip = async (action) => {
        if (!selectedSlip) return;
        if (action === 'NEED_FIX' && wrongFields.length === 0) {
            alert('กรุณาติ๊กมาร์คอย่างน้อย 1 จุดที่ไม่ถูกต้อง เพื่อให้ผู้ส่งรู้ว่าต้องแก้ตรงไหน');
            return;
        }
        setSavingReview(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/payment-slips/${selectedSlip.submission_id}/review-slip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    wrong_fields: wrongFields,
                    admin_note: adminNote,
                    checked_by: 'ADMIN_SLIP'
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(
                    action === 'SLIP_VERIFIED'
                        ? 'ยืนยันสลิปถูกต้องแล้ว (พร้อมรอกระทบยอดอัตโนมัติ)'
                        : action === 'NEED_FIX'
                        ? 'ส่งกลับให้ผู้ฝากเงินแก้ไขเรียบร้อยแล้ว'
                        : 'ปฏิเสธรายการเรียบร้อยแล้ว'
                );
                setSelectedSlip(null);
                setWrongFields([]);
                setAdminNote('');
                loadSlips();
            } else {
                alert(data.message || 'บันทึกไม่สำเร็จ');
            }
        } finally {
            setSavingReview(false);
        }
    };

    const handleAddStatement = async (e) => {
        e.preventDefault();
        if (!stmtAmount || Number(stmtAmount) <= 0) {
            alert('กรุณาระบุยอดเงินเข้า');
            return;
        }
        const ch = channels.find((c) => String(c.channel_id) === String(stmtChannelId));
        const yearCE = Number(stmtYearBE) - 543;
        const receivedDate = `${yearCE}-${stmtMonth}-${stmtDay}`;
        const receivedTime = `${stmtHour}:${stmtMin}:${stmtSec}`;

        const res = await fetch(`${API_URL}/api/admin/bank-statements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel_id: ch?.channel_id || null,
                bank_name_th: ch?.bank_name_th || ch?.channel_name_th || '-',
                account_number: ch?.account_number || ch?.promptpay_id || '-',
                amount: Number(stmtAmount),
                received_date: receivedDate,
                received_time_hms: receivedTime,
                note: stmtNote,
                entered_by: 'ADMIN_BANK'
            })
        });
        const data = await res.json();
        if (data.success) {
            setStmtAmount('');
            setStmtNote('');
            loadStatementsAndChannels();
        } else {
            alert(data.message || 'บันทึกยอดเงินเข้าไม่สำเร็จ');
        }
    };

    const handleAutoReconcile = async () => {
        setReconciling(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/auto-reconcile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tolerance_sec: 60, verified_by: 'AUTO_RECONCILE' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`กระทบยอดอัตโนมัติเสร็จสิ้น!\nจับคู่สำเร็จ: ${data.matched_count} รายการ\nรอจับคู่อยู่: ${data.unmatched_slips} รายการ`);
                loadStatementsAndChannels();
                loadSlips();
            } else {
                alert(data.message || 'เกิดข้อผิดพลาดในการกระทบยอด');
            }
        } finally {
            setReconciling(false);
        }
    };

    const currentYearBE = new Date().getFullYear() + 543;
    const yearBEOptions = [String(currentYearBE - 1), String(currentYearBE), String(currentYearBE + 1)];
    const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
    const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minSecOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 font-sans">
            {/* หัวข้อ + ปุ่มสลับ 3 แท็บ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 m-0">
                        ศูนย์ตรวจสลิปและกระทบยอดเงินอัตโนมัติ
                    </h1>
                    <p className="text-xs text-slate-500 m-0 mt-1">
                        แยกหน้าที่แอดมินตรวจสลิป (มาร์คจุดผิดส่งแก้ไข) และแอดมินคีย์ยอดเงินเข้า Statement เพื่อกระทบยอดอัตโนมัติ
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('SLIPS')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                            activeTab === 'SLIPS' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                        <FileSearch size={15} /> 1. ตรวจสลิปแจ้งโอน
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('STATEMENTS')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                            activeTab === 'STATEMENTS' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                        <Landmark size={15} /> 2. คีย์ยอดเงินเข้า & กระทบยอด
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('SUMMARY')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                            activeTab === 'SUMMARY' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                        <BarChart3 size={15} /> 3. สรุปยอดรายวัน/เดือน/ปี
                    </button>
                </div>
            </div>

            {/* ================= TAB 1: ตรวจสลิป & ส่งกลับแก้ไข ================= */}
            {activeTab === 'SLIPS' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* รายการแจ้งโอนฝั่งซ้าย */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                                {['ALL', 'PENDING', 'RESUBMITTED', 'SLIP_VERIFIED', 'NEED_FIX', 'APPROVED'].map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setSlipFilter(st)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                                            slipFilter === st ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        {st === 'ALL' ? 'ทั้งหมด' : STATUS_BADGE[st]?.label || st}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={loadSlips} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-[65vh] overflow-y-auto">
                            {slips.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400">ไม่พบรายการแจ้งโอน</div>
                            ) : (
                                slips.map((s) => {
                                    const badge = STATUS_BADGE[s.status] || STATUS_BADGE.PENDING;
                                    const isSelected = selectedSlip?.submission_id === s.submission_id;
                                    return (
                                        <div
                                            key={s.submission_id}
                                            onClick={() => {
                                                setSelectedSlip(s);
                                                setWrongFields(Array.isArray(s.wrong_fields) ? s.wrong_fields : []);
                                                setAdminNote(s.admin_note || '');
                                            }}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                                                isSelected ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                    {s.revision_count > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                                                            งานส่งแก้ไขรอบที่ {s.revision_count}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-mono font-bold text-slate-600">{s.qr_reference}</span>
                                                </div>
                                                <div className="text-xs font-extrabold text-slate-800 truncate">
                                                    ผู้โอน: {s.payer_name || s.payer_account_id} • ฿{Number(s.amount).toLocaleString()}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    โอนเข้า: {s.receiver_bank_name} ({s.receiver_account_number}) • วันที่ {formatThaiDate(s.transfer_date)} เวลา {s.transfer_time_hms} น.
                                                </div>
                                            </div>
                                            <img
                                                src={s.slip_image_url}
                                                alt="slip"
                                                className="w-12 h-14 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* พื้นที่ตรวจสลิป + มาร์คจุดผิดฝั่งขวา */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4">
                        {!selectedSlip ? (
                            <div className="py-20 text-center text-xs text-slate-400">
                                คลิกเลือกรายการทางซ้ายเพื่อตรวจสอบรูปสลิปและยืนยัน/ส่งกลับแก้ไข
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="text-sm font-extrabold text-slate-900">
                                        ตรวจสลิป #{selectedSlip.submission_id} ({selectedSlip.qr_reference})
                                    </div>
                                    <span className="text-base font-black text-emerald-700">
                                        ฿{Number(selectedSlip.amount).toLocaleString()}
                                    </span>
                                </div>

                                {/* มาร์คแจ้งแอดมินกรณีเป็นงานส่งแก้ไขกลับมา */}
                                {selectedSlip.revision_count > 0 && Array.isArray(selectedSlip.fixed_fields) && selectedSlip.fixed_fields.length > 0 && (
                                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-300 text-xs text-purple-900">
                                        <div className="font-extrabold">งานส่งแก้ไขรอบที่ {selectedSlip.revision_count} — จุดที่ผู้ฝากเงินแก้กลับมา:</div>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {selectedSlip.fixed_fields.map((f) => (
                                                <span key={f} className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-bold">
                                                    ✓ {FIELD_LABELS[f] || f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <a href={selectedSlip.slip_image_url} target="_blank" rel="noreferrer" className="block bg-slate-50 rounded-xl p-2 border border-slate-200 text-center">
                                    <img
                                        src={selectedSlip.slip_image_url}
                                        alt="สลิปโอนเงิน"
                                        className="max-h-72 mx-auto object-contain rounded-lg"
                                    />
                                    <div className="text-[11px] text-blue-600 font-bold mt-1">คลิกเพื่อเปิดดูรูปสลิปขนาดเต็ม</div>
                                </a>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                    <div><strong>ผู้โอน:</strong> {selectedSlip.payer_name} ({selectedSlip.payer_account_id})</div>
                                    <div><strong>บัญชีรับเงิน:</strong> {selectedSlip.receiver_name} • {selectedSlip.receiver_bank_name} ({selectedSlip.receiver_account_number})</div>
                                    <div><strong>วันเวลาที่แจ้ง:</strong> {formatThaiDate(selectedSlip.transfer_date)} เวลา <span className="font-mono font-bold text-emerald-700">{selectedSlip.transfer_time_hms}</span> น.</div>
                                </div>

                                {/* ติ๊กมาร์คจุดที่ผิดกรณีต้องส่งกลับแก้ไข */}
                                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
                                    <div className="text-xs font-extrabold text-orange-900">
                                        หากข้อมูลไม่ถูกต้อง: ติ๊กมาร์คจุดที่ผิด (จุดที่ไม่ติ๊กจะถูกล็อกไม่ให้ผู้ส่งแก้ไข)
                                    </div>
                                    <div className="space-y-1.5">
                                        {Object.entries(FIELD_LABELS).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={wrongFields.includes(key)}
                                                    onChange={() => toggleWrongField(key)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="หมายเหตุถึงผู้ฝากเงิน (เช่น เวลาในสลิปคือ 17:19:49 ไม่ใช่ 17:10:00)"
                                        className="w-full p-2 rounded-lg border border-orange-200 bg-white text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('SLIP_VERIFIED')}
                                        className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 size={14} /> สลิปถูกต้อง
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('NEED_FIX')}
                                        className="py-2.5 rounded-xl bg-orange-500 text-white text-xs font-extrabold hover:bg-orange-600 flex items-center justify-center gap-1"
                                    >
                                        <AlertTriangle size={14} /> ส่งกลับแก้ไข
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('REJECTED')}
                                        className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={14} /> ปฏิเสธ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= TAB 2: คีย์ Statement เงินเข้า + กระทบยอดอัตโนมัติ ================= */}
            {activeTab === 'STATEMENTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <form onSubmit={handleAddStatement} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit">
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <PlusCircle size={16} className="text-emerald-600" /> คีย์ยอดเงินเข้าบัญชีจริง (Statement)
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">เลือกบัญชีรับเงินของระบบ *</label>
                            <select
                                value={stmtChannelId}
                                onChange={(e) => setStmtChannelId(e.target.value)}
                                className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold"
                            >
                                {channels.map((ch) => (
                                    <option key={ch.channel_id} value={ch.channel_id}>
                                        {ch.channel_name_th} • {ch.bank_name_th} ({ch.account_number || ch.promptpay_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">ยอดเงินเข้า (บาท) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={stmtAmount}
                                onChange={(e) => setStmtAmount(e.target.value)}
                                placeholder="เช่น 20.00"
                                className="w-full p-2 rounded-xl border border-slate-300 text-sm font-black text-emerald-700"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">วันที่เงินเข้า (วัน / เดือน / พ.ศ.) *</label>
                            <div className="grid grid-cols-12 gap-1.5">
                                <select value={stmtDay} onChange={(e) => setStmtDay(e.target.value)} className="col-span-3 p-2 rounded-lg border border-slate-300 text-xs font-bold text-center">
                                    {dayOptions.map((d) => <option key={d} value={d}>{Number(d)}</option>)}
                                </select>
                                <select value={stmtMonth} onChange={(e) => setStmtMonth(e.target.value)} className="col-span-5 p-2 rounded-lg border border-slate-300 text-xs font-bold">
                                    {THAI_MONTHS.map((m, idx) => <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>)}
                                </select>
                                <select value={stmtYearBE} onChange={(e) => setStmtYearBE(e.target.value)} className="col-span-4 p-2 rounded-lg border border-slate-300 text-xs font-bold text-center">
                                    {yearBEOptions.map((y) => <option key={y} value={y}>พ.ศ. {y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">เวลาเงินเข้า (ชม : นาที : วินาที) *</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <select value={stmtHour} onChange={(e) => setStmtHour(e.target.value)} className="p-2 rounded-lg border border-slate-300 text-xs font-bold text-center">
                                    {hourOptions.map((h) => <option key={h} value={h}>{h} น.</option>)}
                                </select>
                                <select value={stmtMin} onChange={(e) => setStmtMin(e.target.value)} className="p-2 rounded-lg border border-slate-300 text-xs font-bold text-center">
                                    {minSecOptions.map((m) => <option key={m} value={m}>{m} นาที</option>)}
                                </select>
                                <select value={stmtSec} onChange={(e) => setStmtSec(e.target.value)} className="p-2 rounded-lg border border-slate-300 text-xs font-bold text-center">
                                    {minSecOptions.map((s) => <option key={s} value={s}>{s} วินาที</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">หมายเหตุ (ถ้ามี)</label>
                            <input
                                type="text"
                                value={stmtNote}
                                onChange={(e) => setStmtNote(e.target.value)}
                                placeholder="เช่น โอนเข้าผ่านพร้อมเพย์"
                                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                            />
                        </div>

                        <button type="submit" className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800">
                            + บันทึกยอดเงินเข้า Statement
                        </button>
                    </form>

                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-extrabold text-slate-900">รายการยอดเงินเข้าที่คีย์ไว้ ({statements.length})</div>
                            <button
                                type="button"
                                disabled={reconciling}
                                onClick={handleAutoReconcile}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-sm hover:opacity-95 flex items-center gap-1.5"
                            >
                                {reconciling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                รันกระทบยอดอัตโนมัติทันที
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="py-2 pr-2">วันเวลาเงินเข้า</th>
                                        <th className="py-2 pr-2">บัญชี</th>
                                        <th className="py-2 pr-2 text-right">ยอดเงิน</th>
                                        <th className="py-2 text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statements.map((st) => (
                                        <tr key={st.statement_id} className="border-b border-slate-100">
                                            <td className="py-2.5 pr-2 font-semibold">
                                                {formatThaiDate(st.received_date)} <span className="font-mono text-emerald-700">{st.received_time_hms}</span>
                                            </td>
                                            <td className="py-2.5 pr-2 text-slate-600">{st.bank_name_th} ({st.account_number})</td>
                                            <td className="py-2.5 pr-2 text-right font-black text-slate-900">฿{Number(st.amount).toLocaleString()}</td>
                                            <td className="py-2.5 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                    st.match_status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {st.match_status === 'MATCHED' ? `จับคู่แล้ว (#${st.matched_submission_id})` : 'รอจับคู่'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TAB 3: สรุปยอดรายวัน / รายเดือน / รายปี ================= */}
            {activeTab === 'SUMMARY' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-extrabold text-slate-900">รายงานสรุปยอดการโอนและกระทบยอด</div>
                        <div className="flex gap-1.5">
                            {[
                                { key: 'DAILY', label: 'รายวัน' },
                                { key: 'MONTHLY', label: 'รายเดือน' },
                                { key: 'YEARLY', label: 'รายปี (พ.ศ.)' }
                            ].map((m) => (
                                <button
                                    key={m.key}
                                    type="button"
                                    onClick={() => setSummaryMode(m.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${
                                        summaryMode === m.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                    <th className="p-2.5">ช่วงเวลา</th>
                                    <th className="p-2.5 text-right">ทั้งหมด (รายการ / บาท)</th>
                                    <th className="p-2.5 text-right text-emerald-700">สำเร็จ (รายการ / บาท)</th>
                                    <th className="p-2.5 text-right text-amber-700">รอตรวจ/รอกระทบยอด</th>
                                    <th className="p-2.5 text-right text-red-700">ส่งแก้ไข/ไม่สำเร็จ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryRows.map((r) => (
                                    <tr key={r.period_key} className="border-b border-slate-100">
                                        <td className="p-2.5 font-extrabold text-slate-800">{formatPeriodThai(r.period_key, summaryMode)}</td>
                                        <td className="p-2.5 text-right font-bold">{r.total_count} รายการ • ฿{Number(r.total_amount).toLocaleString()}</td>
                                        <td className="p-2.5 text-right font-extrabold text-emerald-700">{r.approved_count} รายการ • ฿{Number(r.approved_amount).toLocaleString()}</td>
                                        <td className="p-2.5 text-right font-semibold text-amber-700">{r.pending_count} รายการ • ฿{Number(r.pending_amount).toLocaleString()}</td>
                                        <td className="p-2.5 text-right font-semibold text-red-600">{r.failed_count} รายการ • ฿{Number(r.failed_amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}