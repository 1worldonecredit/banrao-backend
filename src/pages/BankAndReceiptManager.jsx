// [PAY-UI-01] คอมโพเนนต์ผูกบัญชีธนาคาร + รหัสยืนยัน PIN + ใบเสร็จ/QR Code (หน้าบ้าน & หลังบ้าน)
import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, KeyRound, QrCode, Plus, CheckCircle2, ShieldAlert, Receipt } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const boxStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
};

const inpStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '13px',
    outline: 'none'
};

export default function BankAndReceiptManager({
    targetAccountId = null,
    isAdminMode = false,
    receiptPreviewData = null
}) {
    const localUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const accountId = targetAccountId || localUser.account_id || localUser.id || '';

    const [accountInfo, setAccountInfo] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [defaultPinHint, setDefaultPinHint] = useState('000000');

    // [PAY-UI-02] ฟอร์มผูกบัญชีธนาคารรับเงิน
    const [ownerType, setOwnerType] = useState('USER'); // 'USER' | 'VILLAGE' | 'SHOP' | 'BUSINESS'
    const [bankCode, setBankCode] = useState('KBANK');
    const [bankNameTh, setBankNameTh] = useState('ธนาคารกสิกรไทย');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [pinInput, setPinInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // [PAY-UI-03] ฟอร์มตั้งรหัสยืนยัน PIN ใหม่
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');

    // [PAY-UI-04] ใบเสร็จและ QR Payload สำหรับสแกนดูผู้รับเงิน/รายการจ่าย/รองรับ Scan จ่ายสินค้า
    const [activeReceipt, setActiveReceipt] = useState(receiptPreviewData);

    const loadPaymentMethods = useCallback(async () => {
        if (!accountId) return;
        try {
            const res = await fetch(`${API_URL}/api/payment-methods/my?account_id=${encodeURIComponent(accountId)}`);
            const data = await res.json();
            if (data.success) {
                setAccountInfo(data.account_info || null);
                setBankAccounts(data.bank_accounts || []);
                setDefaultPinHint(data.pin_status?.default_pin_hint || '000000');
                if (data.account_info?.full_name && ownerType === 'USER') {
                    setAccountHolderName((prev) => prev || data.account_info.full_name);
                }
            }
        } catch (err) {
            console.error('[PAY-UI-02] Load payment methods error:', err);
        }
    }, [accountId, ownerType]);

    useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);

    useEffect(() => {
        if (receiptPreviewData) setActiveReceipt(receiptPreviewData);
    }, [receiptPreviewData]);

    const handleAddBankAccount = async (e) => {
        e.preventDefault();
        if (!accountId) return alert('ไม่พบบัญชีผู้ใช้งาน');
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/payment-methods/bank-accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: accountId,
                    created_by: localUser.account_id || localUser.id || accountId,
                    owner_type: ownerType,
                    bank_code: bankCode,
                    bank_name_th: bankNameTh,
                    account_number: accountNumber,
                    account_holder_name: accountHolderName,
                    pin: pinInput,
                    is_default: bankAccounts.length === 0,
                    bypass_pin_for_admin: false // บังคับใช้รหัสยืนยันทุกครั้งตามเงื่อนไข
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'ผูกบัญชีไม่สำเร็จ');
            } else {
                setAccountNumber('');
                setPinInput('');
                await loadPaymentMethods();
                alert('ผูกบัญชีธนาคารรับเงินเรียบร้อยแล้วครับ');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdatePin = async (e) => {
        e.preventDefault();
        if (!accountId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/payment-methods/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: accountId,
                    current_pin: currentPin,
                    new_pin: newPin
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'เปลี่ยนรหัสยืนยันไม่สำเร็จ');
            } else {
                setCurrentPin('');
                setNewPin('');
                alert('อัปเดตรหัสยืนยัน (PIN) ใหม่เรียบร้อยแล้วครับ');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* [PAY-UI-05] ส่วนผูกบัญชีธนาคารรับเงิน + รหัสยืนยัน PIN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px', alignItems: 'start' }}>
                <form onSubmit={handleAddBankAccount} style={{ ...boxStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Landmark size={17} color="#059669" /> ผูกบัญชีธนาคารรับเงิน {isAdminMode ? '(หลังบ้าน)' : '(ฝั่งผู้ใช้)'}
                        </h3>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '999px' }}>
                            PIN เริ่มต้น: {defaultPinHint}
                        </span>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534' }}>
                        <ShieldAlert size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        ชื่อบัญชีธนาคารต้องตรงกับชื่อผู้ใช้งาน (<strong>{accountInfo?.full_name || '-'}</strong>) ยกเว้นบัญชี <strong>หมู่บ้าน</strong>, <strong>ร้านค้า</strong> หรือ <strong>เจ้าของกิจการ</strong> ที่เป็นบัญชีเจ้าของ Account ได้
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            ประเภทบัญชีรับเงิน
                        </label>
                        <select
                            value={ownerType}
                            onChange={(e) => {
                                const val = e.target.value;
                                setOwnerType(val);
                                if (val === 'USER' && accountInfo?.full_name) {
                                    setAccountHolderName(accountInfo.full_name);
                                }
                            }}
                            style={inpStyle}
                        >
                            <option value="USER">บัญชีผู้ใช้งาน (ต้องตรงกับชื่อผู้ใช้งาน)</option>
                            <option value="VILLAGE">บัญชีหมู่บ้าน (ใช้ชื่อหมู่บ้าน/เจ้าของ Account ได้)</option>
                            <option value="SHOP">บัญชีร้านค้า (ใช้ชื่อเจ้าของ Account/ร้านได้)</option>
                            <option value="BUSINESS">บัญชีเจ้าของกิจการ/ธุรกิจ (ใช้ชื่อเจ้าของ Account/กิจการได้)</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                                เลือกธนาคาร
                            </label>
                            <select
                                value={bankCode}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    setBankCode(code);
                                    const mapName = {
                                        KBANK: 'ธนาคารกสิกรไทย',
                                        SCB: 'ธนาคารไทยพาณิชย์',
                                        KTB: 'ธนาคารกรุงไทย',
                                        BBL: 'ธนาคารกรุงเทพ',
                                        GSB: 'ธนาคารออมสิน',
                                        PROMPTPAY: 'พร้อมเพย์ (PromptPay)'
                                    };
                                    setBankNameTh(mapName[code] || code);
                                }}
                                style={inpStyle}
                            >
                                <option value="KBANK">KBANK — กสิกรไทย</option>
                                <option value="SCB">SCB — ไทยพาณิชย์</option>
                                <option value="KTB">KTB — กรุงไทย</option>
                                <option value="BBL">BBL — กรุงเทพ</option>
                                <option value="GSB">GSB — ออมสิน</option>
                                <option value="PROMPTPAY">PROMPTPAY — พร้อมเพย์</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                                เลขที่บัญชี / เบอร์พร้อมเพย์ *
                            </label>
                            <input
                                type="text"
                                required
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="เช่น 123-4-56789-0"
                                style={inpStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            ชื่อบัญชีธนาคาร *
                        </label>
                        <input
                            type="text"
                            required
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="กรอกชื่อบัญชีธนาคาร"
                            style={inpStyle}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            รหัสยืนยัน (PIN) เพื่อผูกบัญชี * (เริ่มต้น: {defaultPinHint})
                        </label>
                        <input
                            type="password"
                            required
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder={`กรอกรหัสยืนยัน (เริ่มต้น ${defaultPinHint})`}
                            style={inpStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%',
                            padding: '11px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <Plus size={16} /> ยืนยันผูกบัญชีธนาคารรับเงิน
                    </button>
                </form>

                {/* [PAY-UI-06] รายการบัญชีที่ผูกไว้ + ตั้ง/เปลี่ยนรหัสยืนยัน PIN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={boxStyle}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            บัญชีธนาคารที่ผูกไว้ ({bankAccounts.length})
                        </h3>
                        {bankAccounts.length === 0 ? (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>ยังไม่มีบัญชีธนาคารที่ผูกไว้</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {bankAccounts.map((b) => (
                                    <div key={b.bank_account_id} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                                {b.bank_name_th} • <span style={{ fontFamily: 'monospace' }}>{b.account_number}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>
                                                ชื่อบัญชี: <strong>{b.account_holder_name}</strong> ({b.owner_type})
                                            </div>
                                        </div>
                                        <CheckCircle2 size={16} color="#10b981" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleUpdatePin} style={{ ...boxStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <KeyRound size={16} color="#4f46e5" /> ตั้ง / เปลี่ยนรหัสยืนยัน (PIN) สำหรับผูกบัญชี / ถอนเงิน / ชำระเงิน
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input
                                type="password"
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value)}
                                placeholder={`รหัสเดิม (เริ่มต้น ${defaultPinHint})`}
                                style={inpStyle}
                            />
                            <input
                                type="password"
                                required
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                placeholder="รหัส PIN ใหม่ (4-8 หลัก)"
                                style={inpStyle}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '9px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                alignSelf: 'flex-start'
                            }}
                        >
                            บันทึกรหัส PIN ใหม่
                        </button>
                    </form>
                </div>
            </div>

            {/* [PAY-UI-07] ใบเสร็จและ QR Code (สแกนดูผู้รับเงิน / รายการที่จ่าย / รองรับ Scan จ่ายสินค้าในอนาคต) */}
            {activeReceipt && (
                <div style={{ ...boxStyle, border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={18} color="#0f172a" />
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                ใบเสร็จ & QR Code รายละเอียดผู้รับเงิน / รายการชำระ (รองรับ Scan จ่ายสินค้า)
                            </h3>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                            เลขที่: {activeReceipt.receipt_no || '-'} | อ้างอิง: {activeReceipt.qr_reference || '-'}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '14px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8' }}>
                            <QrCode size={72} color="#0f172a" />
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                                QR Payload พร้อมสแกนตรวจสอบ & ชำระสินค้า
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                ผู้รับเงิน: <strong>{activeReceipt.receiver_name || 'ระบบชุมชนบ้านเรา'}</strong> ({activeReceipt.receiver_owner_type || 'SYSTEM'})
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>ผู้รับเงิน:</strong> {activeReceipt.receiver_name} ({activeReceipt.receiver_owner_type})</div>
                            {activeReceipt.receiver_bank_name && (
                                <div><strong>บัญชีรับเงิน:</strong> {activeReceipt.receiver_bank_name} ({activeReceipt.receiver_account_number || '-'})</div>
                            )}
                            <div><strong>ค่าอะไร:</strong> {activeReceipt.purpose_title}</div>
                            <div><strong>ยอดรวม:</strong> <span style={{ fontWeight: 900, color: '#059669' }}>฿{Number(activeReceipt.total_amount || 0).toLocaleString()}</span></div>
                            <div>
                                <strong>รายการที่จ่าย:</strong>
                                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                                    {(activeReceipt.line_items || []).map((item, i) => (
                                        <li key={i}>
                                            {item.name} x{item.qty || 1} = ฿{Number(item.price || 0).toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}