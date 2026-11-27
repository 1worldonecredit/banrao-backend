// [RECON-UI-01] หน้าตรวจสอบยอดเงินเข้า / คีย์กระทบยอด / เทียบสลิป / อนุมัติเข้ากระเป๋า (banrao_emp)
import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    XCircle,
    Wallet,
    FileCheck2,
    RefreshCw,
    Calendar,
    Landmark
} from 'lucide-react';
import BankLogoBadge from '../components/BankLogoBadge';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const cardBox = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
};

const inpStyle = {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '12px'
};

export default function BankReconciliationPage() {
    const adminUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const adminId = adminUser.account_id || adminUser.id || null;

    const [bankOptions, setBankOptions] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [summary, setSummary] = useState(null);
    const [items, setItems] = useState([]);
    const [matchedMap, setMatchedMap] = useState({});
    const [noteMap, setNoteMap] = useState({});
    const [loading, setLoading] = useState(false);

    const loadRecon = useCallback(async () => {
        setLoading(true);
        try {
            const bRes = await fetch(`${API_URL}/api/banks`);
            const bJson = await bRes.json();
            if (bJson.success) setBankOptions(bJson.banks || []);

            const q = selectedBankId ? `?bank_account_id=${encodeURIComponent(selectedBankId)}` : '';
            const sRes = await fetch(`${API_URL}/api/payment-methods/bank-summary${q}`);
            const sJson = await sRes.json();
            if (sJson.success) {
                setSummary(sJson.summary || null);
                setItems(sJson.verifications || []);
                const nextMatched = {};
                (sJson.verifications || []).forEach((it) => {
                    nextMatched[it.verification_id] = it.matched_amount ?? it.claimed_amount ?? 0;
                });
                setMatchedMap(nextMatched);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedBankId]);

    useEffect(() => {
        loadRecon();
    }, [loadRecon]);

    const handleReview = async (verificationId, decision) => {
        try {
            const res = await fetch(`${API_URL}/api/super-admin/verifications/${verificationId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    matched_amount: matchedMap[verificationId],
                    slip_note: noteMap[verificationId] || '',
                    verified_by: adminId
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'อัปเดตไม่สำเร็จ');
            } else {
                await loadRecon();
                alert(
                    decision === 'APPROVED'
                        ? 'อนุมัติยอดเงินเข้ากระเป๋าและปรับสถานะการชำระเงินเป็น PAID เรียบร้อยแล้วครับ'
                        : 'บันทึกสถานะไม่สำเร็จเรียบร้อยแล้วครับ'
                );
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const currentBank = bankOptions.find((b) => String(b.bank_id || b.bank_code) === String(selectedBankId)) || bankOptions[0] || null;

    return (
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* [RECON-UI-02] การ์ดสถานะบัญชีใช้อยู่ + สรุปรายวัน/รายเดือนแบบไทย + สำเร็จ/ไม่สำเร็จ */}
            <div style={cardBox}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BankLogoBadge
                            bankCode={currentBank?.bank_code || 'BANK'}
                            logoUrl={currentBank?.logo_url || ''}
                            brandColor={currentBank?.brand_color || '#059669'}
                            size={44}
                        />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                    ตรวจสอบยอดเงินเข้า / กระทบยอด / เทียบสลิป
                                </h1>
                                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 10px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534' }}>
                                    สถานะ: ใช้อยู่ (ACTIVE)
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                โหมดตรวจเองและกระทบยอดสลิปก่อนเชื่อม Bank API อัตโนมัติ
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadRecon}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        <RefreshCw size={14} /> รีเฟรชยอด
                    </button>
                </div>

                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                        <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} /> วันนี้ ({summary.today_label_th})
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
                                ฿{Number(summary.daily_success_amount || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                                สำเร็จ: <strong>{summary.daily_success_count}</strong> รายการ | ไม่สำเร็จ: <strong>{summary.daily_failed_count}</strong> รายการ
                            </div>
                        </div>

                        <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Landmark size={14} /> เดือนนี้ ({summary.month_label_th})
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1d4ed8', marginTop: '6px' }}>
                                ฿{Number(summary.monthly_success_amount || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                                สำเร็จ: <strong>{summary.monthly_success_count}</strong> รายการ | ไม่สำเร็จ: <strong>{summary.monthly_failed_count}</strong> รายการ
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* [RECON-UI-03] ตารางคีย์กระทบยอด เทียบสลิป และอนุมัติให้เงินเข้ากระเป๋า */}
            <div style={cardBox}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck2 size={17} color="#4f46e5" /> รายการเทียบสลิป & คีย์กระทบยอด ({items.length})
                </h2>

                {loading ? (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>กำลังโหลดรายการ...</div>
                ) : items.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>ยังไม่มีรายการรอเทียบสลิปหรือกระทบยอด</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {items.map((it) => (
                            <div key={it.verification_id} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#334155' }}>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                                        ยอดแจ้งโอน: ฿{Number(it.claimed_amount || 0).toLocaleString()} • สถานะ: <strong>{it.verification_status}</strong>
                                    </div>
                                    <div>เลขที่ใบเสร็จ/อ้างอิง: <span style={{ fontFamily: 'monospace' }}>{it.receipt_no || '-'}</span> | วันโอน: {it.transfer_date_th || '-'}</div>
                                    {it.slip_url && (
                                        <div>
                                            สลิป: <a href={it.slip_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>เปิดดูสลิป</a>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={matchedMap[it.verification_id] ?? ''}
                                        onChange={(e) => setMatchedMap({ ...matchedMap, [it.verification_id]: e.target.value })}
                                        placeholder="ยอดกระทบยอดจริง"
                                        style={{ ...inpStyle, width: '130px' }}
                                    />
                                    <input
                                        type="text"
                                        value={noteMap[it.verification_id] || ''}
                                        onChange={(e) => setNoteMap({ ...noteMap, [it.verification_id]: e.target.value })}
                                        placeholder="หมายเหตุเทียบสลิป"
                                        style={{ ...inpStyle, width: '160px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleReview(it.verification_id, 'APPROVED')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        <CheckCircle2 size={14} /> <Wallet size={14} /> อนุมัติเข้ากระเป๋า
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReview(it.verification_id, 'REJECTED')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        <XCircle size={14} /> ไม่สำเร็จ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}