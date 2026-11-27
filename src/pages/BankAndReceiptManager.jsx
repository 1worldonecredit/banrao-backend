// [EMP-QR-CH-01] หน้าจัดการบัญชีรับเงิน & รูป QR ลงตาราง system_payment_channels (คลิก List แก้ไข + ดูผลกระทบแบบ Read-only)
import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Plus, CheckCircle2, Power, Upload, Edit3, XCircle, Eye, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const boxStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
};

const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '13px',
    boxSizing: 'border-box'
};

const readOnlyInputStyle = {
    ...inputStyle,
    backgroundColor: '#f1f5f9',
    color: '#475569',
    cursor: 'not-allowed'
};

export function SystemQrChannelBox() {
    const [channels, setChannels] = useState([]);
    const [editingChannel, setEditingChannel] = useState(null);

    const [channelCode, setChannelCode] = useState('');
    const [channelNameTh, setChannelNameTh] = useState('');
    const [ownerType, setOwnerType] = useState('SYSTEM');
    const [receiverName, setReceiverName] = useState('');
    const [bankCode, setBankCode] = useState('BBL');
    const [bankNameTh, setBankNameTh] = useState('ธนาคารกรุงเทพ');
    const [accountNumber, setAccountNumber] = useState('');
    const [promptpayId, setPromptpayId] = useState('');
    const [qrImageUrl, setQrImageUrl] = useState('/images/bkk-promptpay-qr.jpg');
    const [warnCount, setWarnCount] = useState(350);
    const [saving, setSaving] = useState(false);
    const [uploadingQr, setUploadingQr] = useState(false);

    const loadChannels = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/payment-channels?include_inactive=true`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.success && Array.isArray(data.channels)) {
                setChannels(data.channels);
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Load error:', err);
        }
    }, []);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    const resetForm = () => {
        setEditingChannel(null);
        setChannelCode('');
        setChannelNameTh('');
        setOwnerType('SYSTEM');
        setReceiverName('');
        setBankCode('BBL');
        setBankNameTh('ธนาคารกรุงเทพ');
        setAccountNumber('');
        setPromptpayId('');
        setQrImageUrl('/images/bkk-promptpay-qr.jpg');
        setWarnCount(350);
    };

    const handleSelectToEdit = (ch) => {
        setEditingChannel(ch);
        setChannelCode(ch.channel_code || '');
        setChannelNameTh(ch.channel_name_th || '');
        setOwnerType(ch.owner_type || 'SYSTEM');
        setReceiverName(ch.receiver_name || '');
        setBankCode(ch.bank_code || '');
        setBankNameTh(ch.bank_name_th || '');
        setAccountNumber(ch.account_number || '');
        setPromptpayId(ch.promptpay_id || '');
        setQrImageUrl(ch.qr_image_url || '');
        setWarnCount(ch.annual_tx_warn_count ?? 350);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleQrFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingQr(true);
        try {
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const res = await fetch(`${API_URL}/api/upload-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data_url: dataUrl,
                    file_name: file.name
                })
            });
            const data = await res.json();
            if (!data.success || !data.url) {
                alert(data.message || 'อัปโหลดรูป QR ไม่สำเร็จ');
            } else {
                setQrImageUrl(data.url);
                alert('อัปโหลดรูป QR สำเร็จแล้ว กด "บันทึกการแก้ไข" หรือ "บันทึกช่องทางรับเงิน & QR ลงตาราง" ได้เลยครับ');
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Upload error:', err);
            alert('เกิดข้อผิดพลาดในการอัปโหลดรูป QR');
        } finally {
            setUploadingQr(false);
            e.target.value = '';
        }
    };

    const handleSaveChannel = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/payment-channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_code: editingChannel ? editingChannel.channel_code : channelCode,
                    channel_name_th: channelNameTh,
                    owner_type: ownerType,
                    receiver_name: receiverName,
                    bank_code: bankCode,
                    bank_name_th: bankNameTh,
                    account_number: accountNumber,
                    promptpay_id: promptpayId,
                    qr_image_url: qrImageUrl,
                    annual_tx_warn_count: Number(warnCount || 350),
                    annual_amount_warn_thb: editingChannel?.annual_amount_warn_thb ?? 1800000,
                    is_active: editingChannel ? Boolean(editingChannel.is_active) : true,
                    sort_order: editingChannel ? Number(editingChannel.sort_order || 1) : channels.length + 1
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'บันทึกช่องทางรับเงินไม่สำเร็จ');
            } else {
                const wasEditing = Boolean(editingChannel);
                await loadChannels();
                resetForm();
                alert(
                    wasEditing
                        ? 'อัปเดตการแก้ไขช่องทางรับเงิน & รูป QR เรียบร้อยแล้วครับ'
                        : 'บันทึกบัญชีรับเงิน & รูป QR ลงตารางเรียบร้อยแล้วครับ'
                );
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Save error:', err);
            alert('เกิดข้อผิดพลาดในการบันทึกช่องทางรับเงิน');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (e, ch) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_URL}/api/payment-channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_code: ch.channel_code,
                    channel_name_th: ch.channel_name_th,
                    owner_type: ch.owner_type,
                    receiver_name: ch.receiver_name,
                    bank_code: ch.bank_code,
                    bank_name_th: ch.bank_name_th,
                    account_number: ch.account_number,
                    promptpay_id: ch.promptpay_id,
                    qr_image_url: ch.qr_image_url,
                    annual_tx_warn_count: ch.annual_tx_warn_count,
                    annual_amount_warn_thb: ch.annual_amount_warn_thb,
                    is_active: !ch.is_active,
                    sort_order: ch.sort_order
                })
            });
            const data = await res.json();
            if (data.success) {
                await loadChannels();
                if (editingChannel && editingChannel.channel_id === ch.channel_id) {
                    setEditingChannel({ ...ch, is_active: !ch.is_active });
                }
            } else {
                alert(data.message || 'เปลี่ยนสถานะไม่สำเร็จ');
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Toggle active error:', err);
        }
    };

    const activeWarnNum = Number(warnCount || 350);

    return (
        <div style={boxStyle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={18} color="#059669" /> ตั้งค่าบัญชีรับเงิน & รูป QR ของระบบ (คลิกที่รายการด้านล่างเพื่อแก้ไข)
                </h2>

                {editingChannel && (
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                        กำลังแก้ไข: {editingChannel.channel_name_th} ({editingChannel.channel_code})
                    </span>
                )}
            </div>

            {/* กล่องแสดงขอบเขต: สิ่งที่แก้ไขได้ vs ผลกระทบ/ข้อมูลระบบ (ดูได้อย่างเดียว) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '10px',
                    marginBottom: '14px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                }}
            >
                <div>
                    <div style={{ fontWeight: 800, color: '#059669', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Edit3 size={14} /> สิ่งที่แก้ไขได้ในฟอร์มนี้
                    </div>
                    <div style={{ color: '#334155', lineHeight: 1.55 }}>
                        ชื่อช่องทาง, ประเภทบัญชี, ชื่อผู้รับเงิน, ธนาคาร, เลขบัญชี, รูปภาพ QR Code (อัปโหลดหรือเปลี่ยนลิงก์), เลขพร้อมเพย์ และเพดานเตือนจำนวนครั้งรับโอน/ปี
                    </div>
                </div>

                <div>
                    <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} /> ผลกระทบที่เกิดขึ้น (ดูได้อย่างเดียว)
                    </div>
                    <div style={{ color: '#334155', lineHeight: 1.55 }}>
                        • เมื่อบันทึก ช่องทางนี้จะอัปเดตไปที่หน้าชำระเงินฝั่งหน้าบ้านและใบเสร็จ QR ทันที<br />
                        • เกณฑ์รายงานภาษี e-Payment ไทย: <strong>400 ครั้ง/ปี</strong> (ยอดรวม ≥ 2 ล้านบาท) หรือ <strong>3,000 ครั้ง/ปี</strong> — ช่องทางนี้ตั้งเตือนไว้ที่ <strong>{activeWarnNum}</strong> ครั้ง/ปี
                    </div>
                </div>
            </div>

            <form onSubmit={handleSaveChannel} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            รหัสช่องทาง {editingChannel ? '(ล็อกไว้ — ดูได้อย่างเดียว)' : '(ถ้าเว้นว่างจะสร้างให้)'}
                        </label>
                        <input
                            value={channelCode}
                            disabled={Boolean(editingChannel)}
                            onChange={(e) => setChannelCode(e.target.value)}
                            placeholder="เช่น BKK_MAIN_QR"
                            style={editingChannel ? readOnlyInputStyle : inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>ชื่อช่องทางรับเงิน *</label>
                        <input required value={channelNameTh} onChange={(e) => setChannelNameTh(e.target.value)} placeholder="เช่น พร้อมเพย์หลัก รับแพ็กเกจ" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>ประเภทบัญชี</label>
                        <select value={ownerType} onChange={(e) => setOwnerType(e.target.value)} style={inputStyle}>
                            <option value="SYSTEM">บัญชีระบบกลาง (SYSTEM)</option>
                            <option value="BUSINESS">บัญชีธุรกิจ (BUSINESS)</option>
                            <option value="SHOP">บัญชีร้านค้า (SHOP)</option>
                            <option value="VILLAGE">บัญชีหมู่บ้าน (VILLAGE)</option>
                            <option value="USER">บัญชีบุคคล (USER)</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>ชื่อผู้รับเงิน *</label>
                        <input required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="เช่น นาย วิทยา สันทบ" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>รหัสธนาคาร / ธนาคาร</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="BBL" style={{ ...inputStyle, width: '78px' }} />
                            <input value={bankNameTh} onChange={(e) => setBankNameTh(e.target.value)} placeholder="ธนาคารกรุงเทพ" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>เลขบัญชี / เลขที่แสดง</label>
                        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เช่น 3-6701-0xxxx-32-7" style={inputStyle} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>URL / พาธรูปภาพ QR Code *</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                                required
                                value={qrImageUrl}
                                onChange={(e) => setQrImageUrl(e.target.value)}
                                placeholder="กดอัปโหลดรูป QR หรือวางลิงก์รูป"
                                style={inputStyle}
                            />
                            <label
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '9px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Upload size={14} /> {uploadingQr ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={handleQrFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>เลขพร้อมเพย์ (ถ้ามี)</label>
                        <input value={promptpayId} onChange={(e) => setPromptpayId(e.target.value)} placeholder="เบอร์ 10 หลัก หรือเลข 13 หลัก" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>แจ้งเตือนเมื่อรับโอนถึง (ครั้ง/ปี)</label>
                        <input type="number" value={warnCount} onChange={(e) => setWarnCount(e.target.value)} style={inputStyle} />
                    </div>
                </div>

                {/* แถบข้อมูลผลกระทบที่ดูได้อย่างเดียวขณะกำลังแก้ไข */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        fontSize: '12px',
                        color: '#78350f',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                        <ShieldAlert size={15} /> ข้อมูลผลกระทบ (ดูได้อย่างเดียว — แก้ไขไม่ได้):
                    </div>
                    <div>
                        สถานะใช้งานปัจจุบัน: <strong>{editingChannel ? (editingChannel.is_active ? 'เปิดใช้งาน (ACTIVE)' : 'ปิดใช้งาน (INACTIVE)') : 'เปิดใช้งานใหม่ (ACTIVE)'}</strong> • โควตาเตือน: <strong>{activeWarnNum}</strong> / 400 ครั้งต่อปี
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button
                        type="submit"
                        disabled={saving || uploadingQr}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                    >
                        <Plus size={16} />{' '}
                        {saving
                            ? 'กำลังบันทึก...'
                            : editingChannel
                            ? 'บันทึกการแก้ไขช่องทาง & QR'
                            : 'บันทึกช่องทางรับเงิน & QR ลงตาราง'}
                    </button>

                    {editingChannel && (
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            <XCircle size={15} /> ยกเลิกแก้ไข
                        </button>
                    )}
                </div>
            </form>

            {/* รายการช่องทางในตาราง — คลิกที่แถวเพื่อดึงขึ้นมาแก้ไขได้ทันที */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {channels.map((ch) => {
                    const isSelected = editingChannel?.channel_id === ch.channel_id;
                    return (
                        <div
                            key={ch.channel_id}
                            onClick={() => handleSelectToEdit(ch)}
                            title="คลิกเพื่อแก้ไขช่องทางรับเงินและรูป QR"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                                backgroundColor: isSelected ? '#ecfdf5' : ch.is_active ? '#f8fafc' : '#f1f5f9',
                                opacity: ch.is_active ? 1 : 0.72,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {ch.qr_image_url && (
                                    <img
                                        src={ch.qr_image_url}
                                        alt={ch.channel_name_th}
                                        loading="lazy"
                                        decoding="async"
                                        style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '2px' }}
                                    />
                                )}
                                <div style={{ fontSize: '12px', color: '#334155' }}>
                                    <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span>{ch.channel_name_th}</span>
                                        <span style={{ color: '#64748b' }}>({ch.owner_type})</span>
                                        <span style={{ fontSize: '10px', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                                            {ch.channel_code}
                                        </span>
                                    </div>
                                    <div>
                                        ผู้รับเงิน: <strong>{ch.receiver_name}</strong> • {ch.bank_name_th || '-'} ({ch.account_number || '-'})
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                        แจ้งเตือนที่: <strong>{ch.annual_tx_warn_count}</strong> ครั้ง/ปี • QR: <span style={{ fontFamily: 'monospace' }}>{ch.qr_image_url || '-'}</span> • <span style={{ color: '#059669', fontWeight: 700 }}>คลิกเพื่อแก้ไข</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={(e) => handleToggleActive(e, ch)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#ffffff',
                                        color: ch.is_active ? '#059669' : '#64748b',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Power size={13} /> {ch.is_active ? 'เปิดใช้' : 'ปิดใช้'}
                                </button>
                                <CheckCircle2 size={16} color={ch.is_active ? '#059669' : '#94a3b8'} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BankAndReceiptManager() {
    return (
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '16px' }}>
            <SystemQrChannelBox />
        </div>
    );
}

export default BankAndReceiptManager;