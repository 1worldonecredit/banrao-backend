import React, { useState, useEffect, useCallback } from 'react';
import {
    Crown,
    PlusCircle,
    Sparkles,
    RefreshCw,
    Search,
    CheckCircle2,
    AlertCircle,
    Edit3,
    Save,
    X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const TIER_META = {
    VIP: { label: 'เลข VIP', bg: '#fef3c7', color: '#92400e', defaultPrice: 2999 },
    SUPER_NICE: { label: 'สวยมาก', bg: '#ede9fe', color: '#5b21b6', defaultPrice: 999 },
    NICE_TIER_2: { label: 'สวยรอง', bg: '#dbeafe', color: '#1e40af', defaultPrice: 499 },
    NICE: { label: 'สวย', bg: '#dcfce7', color: '#166534', defaultPrice: 299 },
    LUCKY: { label: 'เลขมงคล', bg: '#fce7f3', color: '#9d174d', defaultPrice: 399 }
};

const STATUS_META = {
    AVAILABLE: { label: 'เปิดขาย', bg: '#d1fae5', color: '#065f46' },
    HIDDEN: { label: 'ปิดการขาย', bg: '#f1f5f9', color: '#475569' },
    SOLD: { label: 'ขายแล้ว', bg: '#fee2e2', color: '#991b1b' }
};

const styles = {
    page: { padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#0f172a' },
    headerCard: {
        background: 'rgba(255,255,255,0.96)',
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
    card: {
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        marginBottom: '18px'
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '18px',
        marginBottom: '18px'
    },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' },
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
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
    th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 },
    td: { padding: '11px 12px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', verticalAlign: 'middle' }
};

export default function PremiumNumberManager() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTier, setFilterTier] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQ, setSearchQ] = useState('');
    const [feedback, setFeedback] = useState(null);

    // ฟอร์มเพิ่ม 1 เลขกำหนดเอง
    const [digits, setDigits] = useState('');
    const [singleTier, setSingleTier] = useState('VIP');
    const [singlePrice, setSinglePrice] = useState(2999);
    const [addingSingle, setAddingSingle] = useState(false);

    // ฟอร์มสุ่มสร้างเป็นชุด
    const [batchTier, setBatchTier] = useState('LUCKY');
    const [batchCount, setBatchCount] = useState(20);
    const [batchPrice, setBatchPrice] = useState(399);
    const [generating, setGenerating] = useState(false);

    // แก้ไขราคาในตาราง
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');

    const loadNumbers = useCallback(async () => {
        setLoading(true);
        try {
            const url = `${API_URL}/api/admin/premium-numbers?tier=${encodeURIComponent(filterTier)}&status=${encodeURIComponent(filterStatus)}&q=${encodeURIComponent(searchQ)}`;
            const res = await fetch(url);
            const data = await res.json().catch(() => ({}));
            if (data.success) setNumbers(data.numbers || []);
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }, [filterTier, filterStatus, searchQ]);

    useEffect(() => {
        loadNumbers();
    }, [loadNumbers]);

    const handleAddSingle = async (e) => {
        e.preventDefault();
        setAddingSingle(true);
        setFeedback(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/premium-numbers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ digits, tier: singleTier, price: Number(singlePrice) })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setFeedback({ type: 'error', text: data.message || 'เพิ่มเลขไม่สำเร็จ' });
                return;
            }
            setFeedback({ type: 'success', text: data.message });
            setDigits('');
            await loadNumbers();
        } finally {
            setAddingSingle(false);
        }
    };

    const handleGenerateBatch = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setFeedback(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/premium-numbers/generate-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: batchTier, count: Number(batchCount), price: Number(batchPrice) })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setFeedback({ type: 'error', text: data.message || 'สร้างชุดเลขไม่สำเร็จ' });
                return;
            }
            setFeedback({ type: 'success', text: data.message });
            await loadNumbers();
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdateItem = async (id, payload) => {
        setFeedback(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/premium-numbers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setFeedback({ type: 'error', text: data.message || 'อัปเดตไม่สำเร็จ' });
                return;
            }
            setFeedback({ type: 'success', text: data.message });
            setEditingId(null);
            await loadNumbers();
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        }
    };

    return (
        <div style={styles.page}>
            {/* หัวข้อหน้า */}
            <div style={styles.headerCard}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
                        <Crown size={24} color="#d97706" />
                        จัดการคลังเลขสวย 10 หลัก (BANRAO ID)
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        เพิ่มเลขสวย 5 ระดับเข้าคลัง • กำหนดราคาขาย • เปิด/ปิดสถานะการขาย (ลูกค้าซื้อด้วยยอดเงินในกระเป๋าเท่านั้น)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadNumbers}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fbbf24', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RefreshCw size={14} /> {loading ? 'กำลังโหลด...' : 'รีเฟรชคลัง'}
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

            {/* 2 ฟอร์มเพิ่มเลขสวย */}
            <div style={styles.grid2}>
                {/* เพิ่มเลขกำหนดเอง */}
                <form onSubmit={handleAddSingle} style={{ ...styles.card, marginBottom: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusCircle size={18} color="#059669" /> เพิ่มเลขสวยแบบกำหนดเอง (10 หลัก)
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={styles.label}>ตัวเลข 10 หลัก (ระบบเติม BR- ให้อัตโนมัติ) *</label>
                        <input
                            type="text"
                            maxLength={10}
                            required
                            value={digits}
                            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
                            placeholder="เช่น 9999999999"
                            style={{ ...styles.input, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '2px' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                            <label style={styles.label}>ระดับความสวย</label>
                            <select
                                value={singleTier}
                                onChange={(e) => {
                                    setSingleTier(e.target.value);
                                    setSinglePrice(TIER_META[e.target.value]?.defaultPrice || 299);
                                }}
                                style={styles.input}
                            >
                                {Object.entries(TIER_META).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>ราคาขาย (บาท)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={singlePrice}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setSinglePrice(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={addingSingle}
                        style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#059669', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                        {addingSingle ? 'กำลังบันทึก...' : '+ เพิ่มเลขนี้เข้าคลัง'}
                    </button>
                </form>

                {/* สุ่มสร้างเป็นชุด */}
                <form onSubmit={handleGenerateBatch} style={{ ...styles.card, marginBottom: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="#d97706" /> สุ่มสร้างเลขสวยเข้าคลังเป็นชุดอัตโนมัติ
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <div>
                            <label style={styles.label}>ระดับความสวย</label>
                            <select
                                value={batchTier}
                                onChange={(e) => {
                                    setBatchTier(e.target.value);
                                    setBatchPrice(TIER_META[e.target.value]?.defaultPrice || 299);
                                }}
                                style={styles.input}
                            >
                                {Object.entries(TIER_META).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>จำนวน (1-100)</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={batchCount}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setBatchCount(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div>
                            <label style={styles.label}>ราคาชุดนี้ (บาท)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={batchPrice}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setBatchPrice(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={generating}
                        style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fbbf24', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                        {generating ? 'กำลังสุ่มสร้างเลข...' : `⚡ สร้างเลขสวย ${batchCount} เลขเข้าคลังทันที`}
                    </button>
                </form>
            </div>

            {/* ตารางคลังเลขสวย */}
            <div style={styles.card}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 220px' }}>
                        <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="ค้นหาเลข เช่น 789, 888, BR-..."
                            style={{ ...styles.input, paddingLeft: '36px' }}
                        />
                    </div>
                    <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={{ ...styles.input, width: 'auto' }}>
                        <option value="ALL">ทุกระดับความสวย</option>
                        {Object.entries(TIER_META).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...styles.input, width: 'auto' }}>
                        <option value="ALL">ทุกสถานะ</option>
                        <option value="AVAILABLE">เปิดขาย</option>
                        <option value="HIDDEN">ปิดการขาย</option>
                        <option value="SOLD">ขายแล้ว</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>รหัสบัญชี (10 หลัก)</th>
                                <th style={styles.th}>ระดับ</th>
                                <th style={styles.th}>ราคาขาย (บาท)</th>
                                <th style={styles.th}>สถานะ</th>
                                <th style={styles.th}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {numbers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                        ยังไม่มีเลขสวยในคลัง กดปุ่มสุ่มสร้างด้านบนได้เลยครับ
                                    </td>
                                </tr>
                            ) : (
                                numbers.map((n) => {
                                    const tMeta = TIER_META[n.tier] || { label: n.tier, bg: '#f1f5f9', color: '#334155' };
                                    const sMeta = STATUS_META[n.status] || { label: n.status, bg: '#f1f5f9', color: '#334155' };
                                    const isEditing = editingId === n.id;
                                    return (
                                        <tr key={n.id}>
                                            <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '14px', fontWeight: 800 }}>
                                                {n.public_code}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ padding: '3px 10px', borderRadius: '99px', background: tMeta.bg, color: tMeta.color, fontSize: '11px', fontWeight: 800 }}>
                                                    {tMeta.label}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="number"
                                                            value={editPrice}
                                                            onWheel={(e) => e.target.blur()}
                                                            onChange={(e) => setEditPrice(e.target.value)}
                                                            style={{ ...styles.input, width: '100px', padding: '5px 8px' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateItem(n.id, { price: Number(editPrice) })}
                                                            style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer' }}
                                                        >
                                                            <Save size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingId(null)}
                                                            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                                        ฿{Number(n.price).toLocaleString('th-TH')}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ padding: '3px 10px', borderRadius: '99px', background: sMeta.bg, color: sMeta.color, fontSize: '11px', fontWeight: 800 }}>
                                                    {sMeta.label}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {n.status !== 'SOLD' && (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingId(n.id);
                                                                setEditPrice(String(n.price));
                                                            }}
                                                            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Edit3 size={12} /> แก้ราคา
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateItem(n.id, { status: n.status === 'AVAILABLE' ? 'HIDDEN' : 'AVAILABLE' })}
                                                            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: n.status === 'AVAILABLE' ? '#fef2f2' : '#ecfdf5', color: n.status === 'AVAILABLE' ? '#b91c1c' : '#065f46', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            {n.status === 'AVAILABLE' ? 'ปิดการขาย' : 'เปิดขาย'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}