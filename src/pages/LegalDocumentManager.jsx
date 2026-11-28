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

const styles = {
    page: {
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'inherit',
        color: '#0f172a'
    },
    headerCard: {
        background: 'rgba(255, 255, 255, 0.96)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 800,
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'transparent'
    },
    subtitle: {
        margin: '4px 0 0 0',
        fontSize: '12px',
        color: '#64748b'
    },
    tabBar: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '18px'
    },
    tabBtn: (active) => ({
        padding: '10px 18px',
        borderRadius: '12px',
        border: active ? '1px solid #059669' : '1px solid #cbd5e1',
        background: active ? '#059669' : 'rgba(255,255,255,0.95)',
        color: active ? '#ffffff' : '#334155',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }),
    refreshBtn: {
        padding: '9px 16px',
        borderRadius: '10px',
        border: 'none',
        background: '#0f172a',
        color: '#fbbf24',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.97)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '18px',
        alignItems: 'start'
    },
    label: {
        display: 'block',
        fontSize: '12px',
        fontWeight: 700,
        color: '#475569',
        marginBottom: '6px'
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '13px',
        color: '#0f172a',
        boxSizing: 'border-box',
        background: '#ffffff'
    },
    submitBtn: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: 'none',
        background: '#059669',
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: 800,
        cursor: 'pointer'
    },
    docItem: (isActive) => ({
        background: '#ffffff',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '12px',
        border: isActive ? '2px solid #10b981' : '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
    }),
    docContentBox: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px',
        fontSize: '12px',
        color: '#334155',
        whiteSpace: 'pre-line',
        maxHeight: '160px',
        overflowY: 'auto',
        lineHeight: 1.6,
        margin: '10px 0'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
    },
    th: {
        textAlign: 'left',
        padding: '10px 12px',
        borderBottom: '2px solid #e2e8f0',
        color: '#475569',
        fontWeight: 700
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #f1f5f9',
        color: '#1e293b',
        verticalAlign: 'top'
    }
};

export default function LegalDocumentManager() {
    const [activeTab, setActiveTab] = useState('DOCS');
    const [documents, setDocuments] = useState([]);
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [feedback, setFeedback] = useState(null);

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
        <div style={styles.page}>
            {/* หัวข้อหน้า */}
            <div style={styles.headerCard}>
                <div>
                    <h2 style={styles.title}>
                        <ShieldCheck size={24} color="#059669" />
                        จัดการเอกสารทางกฎหมายขอเปิดบัญชี (BAN RAO WALLET)
                    </h2>
                    <p style={styles.subtitle}>
                        บันทึกแบบ Append-Only ห้ามลบ เพื่อเก็บหลักฐานการยินยอมเปิดบัญชีและยืนยัน PIN 6 หลักของลูกค้า
                    </p>
                </div>
                <button type="button" onClick={loadAll} style={styles.refreshBtn}>
                    <RefreshCw size={14} /> {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
                </button>
            </div>

            {/* แท็บสลับ 2 โหมด */}
            <div style={styles.tabBar}>
                <button type="button" onClick={() => setActiveTab('DOCS')} style={styles.tabBtn(activeTab === 'DOCS')}>
                    <FileText size={16} /> 1. เพิ่ม / แก้ไขเอกสารข้อตกลง ({documents.length})
                </button>
                <button type="button" onClick={() => setActiveTab('CONSENTS')} style={styles.tabBtn(activeTab === 'CONSENTS')}>
                    <ShieldCheck size={16} /> 2. ทะเบียนหลักฐานลูกค้าที่เปิดบัญชีแล้ว ({consents.length})
                </button>
            </div>

            {feedback && (
                <div
                    style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
                        border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}
                >
                    {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{feedback.text}</span>
                </div>
            )}

            {/* TAB 1: จัดการเอกสาร */}
            {activeTab === 'DOCS' && (
                <div style={styles.grid2}>
                    <form onSubmit={handleCreateDoc} style={styles.card}>
                        <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                            <PlusCircle size={18} color="#059669" />
                            เพิ่มเอกสารขอเปิดบัญชีเวอร์ชันใหม่
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '10px', marginBottom: '12px' }}>
                            <div>
                                <label style={styles.label}>เวอร์ชัน *</label>
                                <input type="text" required value={version} onChange={(e) => setVersion(e.target.value)} style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>ชื่อเอกสาร (ภาษาไทย) *</label>
                                <input type="text" required value={titleTh} onChange={(e) => setTitleTh(e.target.value)} style={styles.input} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={styles.label}>เนื้อหาข้อตกลงทางกฎหมาย *</label>
                            <textarea
                                rows={10}
                                required
                                value={contentTh}
                                onChange={(e) => setContentTh(e.target.value)}
                                placeholder="พิมพ์รายละเอียดข้อตกลงทางกฎหมาย ข้อ 1, 2, 3..."
                                style={{ ...styles.input, resize: 'vertical', lineHeight: 1.6 }}
                            />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '16px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={setActiveNow} onChange={(e) => setSetActiveNow(e.target.checked)} />
                            เปิดใช้งานเป็นฉบับปัจจุบันทันที (แสดงให้ลูกค้าใหม่ทุกคนเห็น)
                        </label>

                        <button type="submit" disabled={saving} style={{ ...styles.submitBtn, opacity: saving ? 0.6 : 1 }}>
                            {saving ? 'กำลังบันทึก...' : '+ บันทึกเอกสารเวอร์ชันใหม่'}
                        </button>
                    </form>

                    <div>
                        {documents.map((doc) => (
                            <div key={doc.doc_id} style={styles.docItem(doc.is_active)}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#0f172a', color: '#fbbf24', fontSize: '11px', fontWeight: 800 }}>
                                            v{doc.version}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{doc.title_th}</span>
                                    </div>
                                    {doc.is_active ? (
                                        <span style={{ padding: '4px 10px', borderRadius: '99px', background: '#d1fae5', color: '#065f46', fontSize: '11px', fontWeight: 800 }}>
                                            ✓ ใช้งานอยู่ปัจจุบัน
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleActivateDoc(doc.doc_id)}
                                            style={{ padding: '5px 10px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            ตั้งเป็นฉบับใช้งานปัจจุบัน
                                        </button>
                                    )}
                                </div>

                                <div style={styles.docContentBox}>{doc.content_th}</div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                                    <span>รหัสเอกสาร: {doc.doc_code} (#{doc.doc_id})</span>
                                    <span>บันทึกเมื่อ: {formatThaiDateTime(doc.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: ทะเบียนหลักฐานลูกค้า */}
            {activeTab === 'CONSENTS' && (
                <div style={styles.card}>
                    <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '16px' }}>
                        <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="ค้นหาชื่อลูกค้า, Account ID หรือ IP Address..."
                            style={{ ...styles.input, paddingLeft: '36px' }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>วันเวลาที่ยินยอม (พ.ศ.)</th>
                                    <th style={styles.th}>ผู้ขอเปิดบัญชี</th>
                                    <th style={styles.th}>เอกสาร / PIN</th>
                                    <th style={styles.th}>ผู้อนุมัติ</th>
                                    <th style={styles.th}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                            ยังไม่มีรายการลูกค้าที่ยื่นคำขอเปิดบัญชี
                                        </td>
                                    </tr>
                                ) : (
                                    consents.map((c) => (
                                        <tr key={c.consent_id}>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                    <Clock size={13} color="#64748b" />
                                                    {formatThaiDateTime(c.accepted_at)}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ fontWeight: 800 }}>{c.applicant_name || '-'}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{c.account_id}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontSize: '10px', fontWeight: 700, marginRight: '6px' }}>
                                                    v{c.doc_version}
                                                </span>
                                                {c.pin_verified && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', background: '#d1fae5', color: '#065f46', fontSize: '10px', fontWeight: 700 }}>
                                                        <KeyRound size={10} /> ยืนยัน PIN แล้ว
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ fontWeight: 700, color: '#059669' }}>{c.approved_by_dept}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{c.approved_by_name}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                                                    <Globe size={12} color="#64748b" />
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