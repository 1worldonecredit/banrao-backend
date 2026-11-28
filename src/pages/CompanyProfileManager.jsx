import React, { useState, useEffect } from 'react';
import { Building2, Save, RefreshCw, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const S = {
    page: { padding: '20px', maxWidth: '1080px', margin: '0 auto', fontFamily: 'inherit', color: '#0f172a' },
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px',
        alignItems: 'start'
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '22px',
        border: '1px solid #e2e8f0'
    },
    label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '13px',
        color: '#0f172a',
        backgroundColor: '#ffffff',
        outline: 'none'
    },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    btnPrimary: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#059669',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 800,
        cursor: 'pointer',
        width: '100%'
    },
    btnGhost: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f8fafc',
        color: '#334155',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer'
    }
};

export default function CompanyProfileManager() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const [form, setForm] = useState({
        company_name_th: '',
        branch_name: 'สำนักงานใหญ่',
        address_full: '',
        tax_id: '',
        phone: '',
        email: '',
        vat_rate: 7
    });

    const fetchProfile = async () => {
        setLoading(true);
        setStatusMsg(null);
        try {
            const res = await fetch(`${API_URL}/api/company-profile`);
            const data = await res.json();
            if (data.success && data.profile) {
                setForm({
                    company_name_th: data.profile.company_name_th || '',
                    branch_name: data.profile.branch_name || 'สำนักงานใหญ่',
                    address_full: data.profile.address_full || '',
                    tax_id: data.profile.tax_id || '',
                    phone: data.profile.phone || '',
                    email: data.profile.email || '',
                    vat_rate: data.profile.vat_rate ?? 7
                });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: `โหลดข้อมูลไม่สำเร็จ: ${err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);
        try {
            const res = await fetch(`${API_URL}/api/admin/company-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setStatusMsg({ type: 'error', text: data.message || 'บันทึกข้อมูลไม่สำเร็จ' });
            } else {
                setStatusMsg({ type: 'success', text: 'บันทึกข้อมูลผู้ออกใบกำกับภาษีเรียบร้อยแล้ว (มีผลบนใบเสร็จทันที)' });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={S.page}>
            {/* ส่วนหัว */}
            <div style={S.headerCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            ตั้งค่าข้อมูลและที่อยู่ผู้ออกใบกำกับภาษี
                        </h1>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            ข้อมูลส่วนนี้จะถูกดึงไปแสดงบนหัวใบเสร็จรับเงิน / ใบกำกับภาษีทุกฉบับอัตโนมัติ
                        </div>
                    </div>
                </div>

                <button type="button" onClick={fetchProfile} disabled={loading} style={S.btnGhost}>
                    <RefreshCw size={14} /> โหลดข้อมูลล่าสุด
                </button>
            </div>

            {statusMsg && (
                <div
                    style={{
                        marginBottom: '16px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
                        border: statusMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
                    }}
                >
                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {statusMsg.text}
                </div>
            )}

            <div style={S.grid}>
                {/* ฟอร์มแก้ไข */}
                <form onSubmit={handleSave} style={S.card}>
                    <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>
                        แก้ไขรายละเอียดผู้ออกเอกสาร
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={S.label}>ชื่อบริษัท / นิติบุคคล / ผู้ออกใบเสร็จ *</label>
                            <input
                                type="text"
                                required
                                value={form.company_name_th}
                                onChange={(e) => handleChange('company_name_th', e.target.value)}
                                placeholder="เช่น บริษัท บ้านเรา จำกัด"
                                style={S.input}
                            />
                        </div>

                        <div style={S.row2}>
                            <div>
                                <label style={S.label}>สาขา</label>
                                <input
                                    type="text"
                                    value={form.branch_name}
                                    onChange={(e) => handleChange('branch_name', e.target.value)}
                                    placeholder="เช่น สำนักงานใหญ่"
                                    style={S.input}
                                />
                            </div>
                            <div>
                                <label style={S.label}>เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                                <input
                                    type="text"
                                    value={form.tax_id}
                                    onChange={(e) => handleChange('tax_id', e.target.value)}
                                    placeholder="0-1055-69000-00-0"
                                    style={S.input}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={S.label}>ที่อยู่ฉบับเต็ม (สำหรับออกใบกำกับภาษี) *</label>
                            <textarea
                                rows={3}
                                required
                                value={form.address_full}
                                onChange={(e) => handleChange('address_full', e.target.value)}
                                placeholder="เลขที่ ... หมู่ที่ ... ตำบล/แขวง ... อำเภอ/เขต ... จังหวัด ... รหัสไปรษณีย์ ..."
                                style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }}
                            />
                        </div>

                        <div style={S.row2}>
                            <div>
                                <label style={S.label}>เบอร์โทรศัพท์</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="02-000-0000"
                                    style={S.input}
                                />
                            </div>
                            <div>
                                <label style={S.label}>อีเมลติดต่อ</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="support@banrao.life"
                                    style={S.input}
                                />
                            </div>
                        </div>

                        <div style={{ maxWidth: '180px' }}>
                            <label style={S.label}>อัตราภาษีมูลค่าเพิ่ม (VAT %)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={form.vat_rate}
                                onChange={(e) => handleChange('vat_rate', e.target.value)}
                                style={S.input}
                            />
                        </div>

                        <button type="submit" disabled={saving || loading} style={S.btnPrimary}>
                            <Save size={16} />
                            {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลผู้ออกใบกำกับภาษี'}
                        </button>
                    </div>
                </form>

                {/* ตัวอย่างการแสดงผลบนใบเสร็จจริง */}
                <div style={S.card}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#0f172a',
                            marginBottom: '14px'
                        }}
                    >
                        <FileText size={16} color="#059669" />
                        ตัวอย่างที่จะแสดงบนใบเสร็จรับเงิน / ใบกำกับภาษี
                    </div>

                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '14px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            lineHeight: 1.7,
                            fontSize: '12px',
                            color: '#334155'
                        }}
                    >
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                            ผู้ออกใบเสร็จ: {form.company_name_th || '-'}{' '}
                            {form.branch_name ? `(${form.branch_name})` : ''}
                        </div>
                        <div>ที่อยู่: {form.address_full || '-'}</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            เลขประจำตัวผู้เสียภาษี: {form.tax_id || '-'}
                        </div>
                        <div>
                            โทร: {form.phone || '-'} • อีเมล: {form.email || '-'}
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', color: '#059669', fontWeight: 700 }}>
                            อัตรา VAT ที่ใช้คำนวณ: {form.vat_rate}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}