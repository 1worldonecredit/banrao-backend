// [EMP-QR-CH-01] กล่องเพิ่ม/ดู/เปิด-ปิด ช่องทางรับเงิน & รูป QR ลงตาราง system_payment_channels (หลังบ้าน)
import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Plus, CheckCircle2, Power } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const boxStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
    marginTop: '18px'
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

export function SystemQrChannelBox() {
    const [channels, setChannels] = useState([]);
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

    const handleSaveChannel = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/payment-channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_code: channelCode,
                    channel_name_th: channelNameTh,
                    owner_type: ownerType,
                    receiver_name: receiverName,
                    bank_code: bankCode,
                    bank_name_th: bankNameTh,
                    account_number: accountNumber,
                    promptpay_id: promptpayId,
                    qr_image_url: qrImageUrl,
                    annual_tx_warn_count: Number(warnCount || 350),
                    is_active: true,
                    sort_order: channels.length + 1
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'บันทึกช่องทางรับเงินไม่สำเร็จ');
            } else {
                setChannelCode('');
                setChannelNameTh('');
                setReceiverName('');
                setAccountNumber('');
                setPromptpayId('');
                await loadChannels();
                alert('บันทึกบัญชีรับเงิน & รูป QR ลงตารางเรียบร้อยแล้วครับ');
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Save error:', err);
            alert('เกิดข้อผิดพลาดในการบันทึกช่องทางรับเงิน');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (ch) => {
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
            } else {
                alert(data.message || 'เปลี่ยนสถานะไม่สำเร็จ');
            }
        } catch (err) {
            console.error('[EMP-QR-CH-01] Toggle active error:', err);
        }
    };

    return (
        <div style={boxStyle}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="#059669" /> ตั้งค่าบัญชีรับเงิน & รูป QR ของระบบ (เก็บลงตาราง เปลี่ยนง่าย)
            </h2>

            <form onSubmit={handleSaveChannel} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>รหัสช่องทาง (ถ้าเว้นว่างจะสร้างให้)</label>
                        <input value={channelCode} onChange={(e) => setChannelCode(e.target.value)} placeholder="เช่น BKK_MAIN_QR" style={inputStyle} />
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
                            <input required value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="/images/bkk-promptpay-qr.jpg หรือลิงก์ R2" style={inputStyle} />
                            <button
                                type="button"
                                onClick={() => setQrImageUrl('/images/bkk-promptpay-qr.jpg')}
                                style={{
                                    padding: '9px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f1f5f9',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                ใช้รูป BKK
                            </button>
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

                <button
                    type="submit"
                    disabled={saving}
                    style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                    <Plus size={16} /> {saving ? 'กำลังบันทึก...' : 'บันทึกช่องทางรับเงิน & QR ลงตาราง'}
                </button>
            </form>

            {/* แสดงรายการที่บันทึกในตารางแล้ว */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {channels.map((ch) => (
                    <div
                        key={ch.channel_id}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: ch.is_active ? '#f8fafc' : '#f1f5f9',
                            opacity: ch.is_active ? 1 : 0.65,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
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
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                    {ch.channel_name_th} <span style={{ color: '#64748b' }}>({ch.owner_type})</span>
                                </div>
                                <div>
                                    ผู้รับเงิน: <strong>{ch.receiver_name}</strong> • {ch.bank_name_th || '-'} ({ch.account_number || '-'})
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    แจ้งเตือนที่: <strong>{ch.annual_tx_warn_count}</strong> ครั้ง/ปี • QR: <span style={{ fontFamily: 'monospace' }}>{ch.qr_image_url || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => handleToggleActive(ch)}
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
                ))}
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