// [EMP-RECON-02] หน้าหลังบ้านตรวจสลิป + ส่งแก้ไขแบบมาร์คจุดผิด + คีย์ Statement + กระทบยอดอัตโนมัติ + สรุปรายวัน/เดือน/ปี (Inline Style 100%)
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
    PENDING: { label: 'รอตรวจสลิป', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    RESUBMITTED: { label: 'ส่งแก้ไขกลับมาแล้ว', bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' },
    NEED_FIX: { label: 'ส่งกลับให้แก้ไข', bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
    SLIP_VERIFIED: { label: 'สลิปถูกต้อง (รอกระทบยอด)', bg: '#cffafe', color: '#155e75', border: '#67e8f9' },
    APPROVED: { label: 'กระทบยอดสำเร็จ', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    REJECTED: { label: 'ไม่สำเร็จ / ปฏิเสธ', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
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

const S = {
    page: {
        padding: '20px',
        maxWidth: '1280px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0f172a'
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '20px'
    },
    headerFlex: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
    },
    title: {
        fontSize: '20px',
        fontWeight: 800,
        margin: 0,
        color: '#0f172a'
    },
    subtitle: {
        fontSize: '13px',
        color: '#64748b',
        margin: '4px 0 0 0'
    },
    tabBtn: (active) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        border: active ? '1px solid #059669' : '1px solid #cbd5e1',
        backgroundColor: active ? '#059669' : '#ffffff',
        color: active ? '#ffffff' : '#334155'
    }),
    filterBtn: (active) => ({
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        border: active ? '1px solid #0f172a' : '1px solid #cbd5e1',
        backgroundColor: active ? '#0f172a' : '#f8fafc',
        color: active ? '#ffffff' : '#334155'
    }),
    twoCol: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        alignItems: 'start'
    },
    input: {
        width: '100%',
        padding: '9px 12px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '13px',
        fontWeight: 600,
        color: '#0f172a',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
    },
    label: {
        display: 'block',
        fontSize: '12px',
        fontWeight: 700,
        color: '#475569',
        marginBottom: '6px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px'
    },
    th: {
        textAlign: 'left',
        padding: '10px 12px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        color: '#475569',
        fontWeight: 700
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid #f1f5f9',
        color: '#1e293b'
    }
};

export default function SlipReconcileManager() {
    const [activeTab, setActiveTab] = useState('SLIPS');
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
        <div style={S.page}>
            {/* หัวข้อหลัก + แท็บเมนู */}
            <div style={S.card}>
                <div style={S.headerFlex}>
                    <div>
                        <h1 style={S.title}>ศูนย์ตรวจสลิปและกระทบยอดเงินอัตโนมัติ</h1>
                        <p style={S.subtitle}>
                            แยกหน้าที่แอดมินตรวจสลิป (มาร์คจุดผิดส่งแก้ไข) และแอดมินคีย์ยอดเงินเข้า Statement เพื่อกระทบยอดอัตโนมัติ
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button type="button" onClick={() => setActiveTab('SLIPS')} style={S.tabBtn(activeTab === 'SLIPS')}>
                            <FileSearch size={16} /> 1. ตรวจสลิปแจ้งโอน
                        </button>
                        <button type="button" onClick={() => setActiveTab('STATEMENTS')} style={S.tabBtn(activeTab === 'STATEMENTS')}>
                            <Landmark size={16} /> 2. คีย์ยอดเงินเข้า & กระทบยอด
                        </button>
                        <button type="button" onClick={() => setActiveTab('SUMMARY')} style={S.tabBtn(activeTab === 'SUMMARY')}>
                            <BarChart3 size={16} /> 3. สรุปยอดรายวัน/เดือน/ปี
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= TAB 1: ตรวจสลิป ================= */}
            {activeTab === 'SLIPS' && (
                <div style={S.twoCol}>
                    {/* ฝั่งซ้าย: รายการแจ้งโอน */}
                    <div style={S.card}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {['ALL', 'PENDING', 'RESUBMITTED', 'SLIP_VERIFIED', 'NEED_FIX', 'APPROVED'].map((st) => (
                                    <button key={st} type="button" onClick={() => setSlipFilter(st)} style={S.filterBtn(slipFilter === st)}>
                                        {st === 'ALL' ? 'ทั้งหมด' : STATUS_BADGE[st]?.label || st}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={loadSlips}
                                style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                            >
                                <RefreshCw size={15} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '65vh', overflowY: 'auto' }}>
                            {slips.length === 0 ? (
                                <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '12px' }}>
                                    ไม่พบรายการแจ้งโอนในหมวดนี้
                                </div>
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
                                            style={{
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                                                backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                        backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                                                    }}>
                                                        {badge.label}
                                                    </span>
                                                    {s.revision_count > 0 && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, backgroundColor: '#7e22ce', color: '#fff' }}>
                                                            งานส่งแก้ไขรอบที่ {s.revision_count}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                                                        {s.qr_reference}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                                    ผู้โอน: {s.payer_name || s.payer_account_id} • <span style={{ color: '#059669' }}>฿{Number(s.amount).toLocaleString()}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                    โอนเข้า: {s.receiver_bank_name} ({s.receiver_account_number}) • {formatThaiDate(s.transfer_date)} เวลา {s.transfer_time_hms} น.
                                                </div>
                                            </div>
                                            <img
                                                src={s.slip_image_url}
                                                alt="slip"
                                                style={{ width: '48px', height: '58px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 }}
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ฝั่งขวา: พื้นที่ตรวจสลิป */}
                    <div style={S.card}>
                        {!selectedSlip ? (
                            <div style={{ padding: '64px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '12px' }}>
                                คลิกเลือกรายการทางซ้ายเพื่อตรวจสอบรูปสลิปและยืนยัน / ส่งกลับแก้ไข
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 800 }}>
                                        ตรวจสลิป #{selectedSlip.submission_id} ({selectedSlip.qr_reference})
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>
                                        ฿{Number(selectedSlip.amount).toLocaleString()}
                                    </div>
                                </div>

                                {selectedSlip.revision_count > 0 && Array.isArray(selectedSlip.fixed_fields) && selectedSlip.fixed_fields.length > 0 && (
                                    <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#faf5ff', border: '1px solid #d8b4fe', fontSize: '12px', color: '#581c87' }}>
                                        <div style={{ fontWeight: 800, marginBottom: '6px' }}>
                                            งานส่งแก้ไขรอบที่ {selectedSlip.revision_count} — จุดที่ผู้ฝากเงินแก้กลับมา:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {selectedSlip.fixed_fields.map((f) => (
                                                <span key={f} style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#7e22ce', color: '#fff', fontWeight: 700 }}>
                                                    ✓ {FIELD_LABELS[f] || f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <a
                                    href={selectedSlip.slip_image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'block', padding: '10px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', textDecoration: 'none' }}
                                >
                                    <img
                                        src={selectedSlip.slip_image_url}
                                        alt="สลิปโอนเงิน"
                                        style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', marginTop: '6px' }}>
                                        คลิกเพื่อเปิดดูรูปสลิปขนาดเต็ม
                                    </div>
                                </a>

                                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.6 }}>
                                    <div><strong>ผู้โอน:</strong> {selectedSlip.payer_name} ({selectedSlip.payer_account_id})</div>
                                    <div><strong>บัญชีรับเงิน:</strong> {selectedSlip.receiver_name} • {selectedSlip.receiver_bank_name} ({selectedSlip.receiver_account_number})</div>
                                    <div><strong>วันเวลาที่แจ้ง:</strong> {formatThaiDate(selectedSlip.transfer_date)} เวลา <strong style={{ color: '#059669' }}>{selectedSlip.transfer_time_hms}</strong> น.</div>
                                </div>

                                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#9a3412', marginBottom: '8px' }}>
                                        หากข้อมูลไม่ถูกต้อง: ติ๊กมาร์คจุดที่ผิด (จุดที่ไม่ติ๊กจะถูกล็อกไม่ให้ผู้ส่งแก้ไข)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                        {Object.entries(FIELD_LABELS).map(([key, label]) => (
                                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={wrongFields.includes(key)} onChange={() => toggleWrongField(key)} />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="หมายเหตุถึงผู้ฝากเงิน (เช่น เวลาในสลิปคือ 17:19:49)"
                                        style={S.input}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('SLIP_VERIFIED')}
                                        style={{ padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        <CheckCircle2 size={15} /> สลิปถูกต้อง
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('NEED_FIX')}
                                        style={{ padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#f97316', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        <AlertTriangle size={15} /> ส่งกลับแก้ไข
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingReview}
                                        onClick={() => handleReviewSlip('REJECTED')}
                                        style={{ padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        <XCircle size={15} /> ปฏิเสธ
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= TAB 2: คีย์ Statement + กระทบยอดอัตโนมัติ ================= */}
            {activeTab === 'STATEMENTS' && (
                <div style={S.twoCol}>
                    <form onSubmit={handleAddStatement} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <PlusCircle size={18} color="#059669" /> คีย์ยอดเงินเข้าบัญชีจริง (Statement)
                        </div>

                        <div>
                            <label style={S.label}>เลือกบัญชีรับเงินของระบบ *</label>
                            <select value={stmtChannelId} onChange={(e) => setStmtChannelId(e.target.value)} style={S.input}>
                                {channels.map((ch) => (
                                    <option key={ch.channel_id} value={ch.channel_id}>
                                        {ch.channel_name_th} • {ch.bank_name_th} ({ch.account_number || ch.promptpay_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={S.label}>ยอดเงินเข้า (บาท) *</label>
                            <input type="number" step="0.01" value={stmtAmount} onChange={(e) => setStmtAmount(e.target.value)} placeholder="เช่น 20.00" style={S.input} />
                        </div>

                        <div>
                            <label style={S.label}>วันที่เงินเข้า (วัน / เดือน / พ.ศ.) *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.3fr', gap: '6px' }}>
                                <select value={stmtDay} onChange={(e) => setStmtDay(e.target.value)} style={S.input}>
                                    {dayOptions.map((d) => <option key={d} value={d}>{Number(d)}</option>)}
                                </select>
                                <select value={stmtMonth} onChange={(e) => setStmtMonth(e.target.value)} style={S.input}>
                                    {THAI_MONTHS.map((m, idx) => <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>)}
                                </select>
                                <select value={stmtYearBE} onChange={(e) => setStmtYearBE(e.target.value)} style={S.input}>
                                    {yearBEOptions.map((y) => <option key={y} value={y}>พ.ศ. {y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={S.label}>เวลาเงินเข้า (ชม : นาที : วินาที) *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                <select value={stmtHour} onChange={(e) => setStmtHour(e.target.value)} style={S.input}>
                                    {hourOptions.map((h) => <option key={h} value={h}>{h} น.</option>)}
                                </select>
                                <select value={stmtMin} onChange={(e) => setStmtMin(e.target.value)} style={S.input}>
                                    {minSecOptions.map((m) => <option key={m} value={m}>{m} นาที</option>)}
                                </select>
                                <select value={stmtSec} onChange={(e) => setStmtSec(e.target.value)} style={S.input}>
                                    {minSecOptions.map((s) => <option key={s} value={s}>{s} วินาที</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={S.label}>หมายเหตุ (ถ้ามี)</label>
                            <input type="text" value={stmtNote} onChange={(e) => setStmtNote(e.target.value)} placeholder="เช่น โอนเข้าผ่านพร้อมเพย์" style={S.input} />
                        </div>

                        <button type="submit" style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
                            + บันทึกยอดเงินเข้า Statement
                        </button>
                    </form>

                    <div style={S.card}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800 }}>รายการยอดเงินเข้าที่คีย์ไว้ ({statements.length})</div>
                            <button
                                type="button"
                                disabled={reconciling}
                                onClick={handleAutoReconcile}
                                style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                {reconciling ? <Loader2 size={15} /> : <Zap size={15} />} รันกระทบยอดอัตโนมัติทันที
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>วันเวลาเงินเข้า</th>
                                        <th style={S.th}>บัญชี</th>
                                        <th style={{ ...S.th, textAlign: 'right' }}>ยอดเงิน</th>
                                        <th style={{ ...S.th, textAlign: 'center' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statements.map((st) => (
                                        <tr key={st.statement_id}>
                                            <td style={S.td}>{formatThaiDate(st.received_date)} <strong style={{ color: '#059669' }}>{st.received_time_hms}</strong></td>
                                            <td style={S.td}>{st.bank_name_th} ({st.account_number})</td>
                                            <td style={{ ...S.td, textAlign: 'right', fontWeight: 800 }}>฿{Number(st.amount).toLocaleString()}</td>
                                            <td style={{ ...S.td, textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                                    backgroundColor: st.match_status === 'MATCHED' ? '#d1fae5' : '#fef3c7',
                                                    color: st.match_status === 'MATCHED' ? '#065f46' : '#92400e'
                                                }}>
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

            {/* ================= TAB 3: สรุปยอดรายวัน / เดือน / ปี ================= */}
            {activeTab === 'SUMMARY' && (
                <div style={S.card}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800 }}>รายงานสรุปยอดการโอนและกระทบยอด</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                                { key: 'DAILY', label: 'รายวัน' },
                                { key: 'MONTHLY', label: 'รายเดือน' },
                                { key: 'YEARLY', label: 'รายปี (พ.ศ.)' }
                            ].map((m) => (
                                <button key={m.key} type="button" onClick={() => setSummaryMode(m.key)} style={S.tabBtn(summaryMode === m.key)}>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>ช่วงเวลา</th>
                                    <th style={{ ...S.th, textAlign: 'right' }}>ทั้งหมด (รายการ / บาท)</th>
                                    <th style={{ ...S.th, textAlign: 'right', color: '#059669' }}>สำเร็จ</th>
                                    <th style={{ ...S.th, textAlign: 'right', color: '#b45309' }}>รอตรวจ/รอกระทบยอด</th>
                                    <th style={{ ...S.th, textAlign: 'right', color: '#dc2626' }}>ส่งแก้ไข/ไม่สำเร็จ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryRows.map((r) => (
                                    <tr key={r.period_key}>
                                        <td style={{ ...S.td, fontWeight: 800 }}>{formatPeriodThai(r.period_key, summaryMode)}</td>
                                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700 }}>{r.total_count} รายการ • ฿{Number(r.total_amount).toLocaleString()}</td>
                                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 800, color: '#059669' }}>{r.approved_count} รายการ • ฿{Number(r.approved_amount).toLocaleString()}</td>
                                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#b45309' }}>{r.pending_count} รายการ • ฿{Number(r.pending_amount).toLocaleString()}</td>
                                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{r.failed_count} รายการ • ฿{Number(r.failed_amount).toLocaleString()}</td>
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