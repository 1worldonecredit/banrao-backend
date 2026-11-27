// [SA-1.1] Imports และค่าคงที่หลักของหน้า SuperAdminPackages (Admin Portal)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Plus,
    Trash2,
    Save,
    RefreshCw,
    Clock,
    Users,
    Package as PackageIcon,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    BarChart3,
    BellRing,
    Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.banrao.life';

const EMPTY_FORM = {
    package_id: null,
    code: '',
    name_th: '',
    name_en: '',
    badge_tier: 'SILVER',
    price_amount: 0,
    billing_cycle: 'YEARLY',
    duration_days: 365,
    max_shop_products: '',
    target_audience: 'ALL',
    visibility_boost_level: 2,
    chat_tier: 'PRO',
    sort_order: 10,
    features: [{ title_th: '', description_th: '' }]
};

const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)'
};

const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none'
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '6px'
};

export default function SuperAdminPackages() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const adminAccountId = userData.account_id || userData.id || null;

    // [SA-1.2] State แท็บหลัก: 'PACKAGES' | 'USERS' | 'REPORTS' | 'SETTINGS'
    const [activeTab, setActiveTab] = useState('PACKAGES');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSyncing, setAutoSyncing] = useState(false);

    // [SA-1.3] State จัดการแพ็กเกจและบริการ
    const [packages, setPackages] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    // [SA-1.4] State การตั้งค่าแจ้งเตือนล่วงหน้า (Asia/Bangkok) + การตลาด User Free
    const [notifyDaysBefore, setNotifyDaysBefore] = useState(30);
    const [freeVillageYearsDefault, setFreeVillageYearsDefault] = useState(1);
    const [freeUpsellIntervalDays, setFreeUpsellIntervalDays] = useState(7);
    const [freeUpsellHeadline, setFreeUpsellHeadline] = useState('');
    const [freeUpsellMessage, setFreeUpsellMessage] = useState('');
    const [qrPromptInfo, setQrPromptInfo] = useState('');
    const [lastUpdatedText, setLastUpdatedText] = useState('');

    // [SA-1.5] State รายชื่อผู้ใช้งาน + รายงาน + Notification การปรับสถานะอัตโนมัติ
    const [usersList, setUsersList] = useState([]);
    const [searchUser, setSearchUser] = useState('');
    const [autoSyncReport, setAutoSyncReport] = useState(null);
    const [adminNotifications, setAdminNotifications] = useState([]);

    const formatThaiNow = () =>
        new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

    const pushAdminNotification = useCallback((title, detail, updatedCount = 0) => {
        const item = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title,
            detail,
            updatedCount,
            timeTh: formatThaiNow(),
            futureChannel: 'CHAT_SYSTEM_READY' // เตรียมเชื่อมส่งเข้าสู่ระบบ Chat ในอนาคต
        };
        setAdminNotifications((prev) => [item, ...prev].slice(0, 20));
        window.dispatchEvent(new CustomEvent('adminPackageNotification', { detail: item }));
    }, []);

    // [SA-1.6] โหลดข้อมูลภาพรวมแพ็กเกจและรายชื่อผู้ใช้งาน
    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ovRes, uRes] = await Promise.all([
                fetch(`${API_URL}/api/packages/overview`),
                fetch(`${API_URL}/api/super-admin/package-users`)
            ]);

            const ovJson = await ovRes.json();
            if (ovJson.success) {
                setPackages(ovJson.packages || []);
                if (ovJson.settings) {
                    setNotifyDaysBefore(Number(ovJson.settings.notify_days_before ?? 30));
                    setFreeVillageYearsDefault(Number(ovJson.settings.free_village_years_default ?? 1));
                    setFreeUpsellIntervalDays(Number(ovJson.settings.free_upsell_interval_days ?? 7));
                    setFreeUpsellHeadline(ovJson.settings.free_upsell_headline || '');
                    setFreeUpsellMessage(ovJson.settings.free_upsell_message || '');
                    setQrPromptInfo(ovJson.settings.qr_prompt_info || '');
                    if (ovJson.settings.updated_at) {
                        setLastUpdatedText(
                            new Date(ovJson.settings.updated_at).toLocaleString('th-TH', {
                                timeZone: 'Asia/Bangkok',
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })
                        );
                    }
                }
            }

            const uJson = await uRes.json();
            if (uJson.success) {
                setUsersList(uJson.users || []);
            }
        } catch (err) {
            console.error('[SA-1.6] Load SuperAdmin Packages Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // [SA-1.7] ฟังก์ชันปรับสถานะอัตโนมัติไปที่ Database + รายงานจำนวน User ที่ถูกปรับ + แจ้ง Notification
    const handleAutoSyncStatuses = async () => {
        setAutoSyncing(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/package-users/auto-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triggered_by: adminAccountId })
            });
            const data = await res.json();

            if (data.success) {
                const updatedCount = Number(data.updated_count || 0);
                const expiredCount = Number(data.expired_updated || 0);
                const expiringSoonCount = Number(data.expiring_soon_flagged || 0);
                const reportObj = {
                    updated_count: updatedCount,
                    expired_updated: expiredCount,
                    expiring_soon_flagged: expiringSoonCount,
                    synced_at_th: formatThaiNow(),
                    details: data.details || []
                };
                setAutoSyncReport(reportObj);
                pushAdminNotification(
                    `ปรับสถานะอัตโนมัติวันนี้: ${updatedCount} User`,
                    `หมดอายุอัปเดต ${expiredCount} รายการ | ใกล้หมดอายุแจ้งเตือน ${expiringSoonCount} รายการ (เตรียมส่งเข้า Chat ในอนาคต)`,
                    updatedCount
                );
                await loadAll();
                alert(`ปรับสถานะอัตโนมัติสำเร็จ วันนี้ปรับไปทั้งหมด ${updatedCount} User ครับ`);
            } else {
                // สำรองคำนวณและอัปเดตสถานะรายตัวผ่าน API ที่มีอยู่หากยังไม่ได้เพิ่มเส้น /auto-sync
                let localUpdated = 0;
                for (const u of usersList) {
                    const meta = u.status_meta || {};
                    if (u.subscription_id && meta.is_expired && u.payment_status !== 'EXPIRED') {
                        const r2 = await fetch(`${API_URL}/api/super-admin/package-users/${u.subscription_id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ payment_status: 'EXPIRED' })
                        });
                        const j2 = await r2.json();
                        if (j2.success) localUpdated += 1;
                    }
                }
                const reportObj = {
                    updated_count: localUpdated,
                    expired_updated: localUpdated,
                    expiring_soon_flagged: usersList.filter((u) => u.status_meta?.is_expiring_soon).length,
                    synced_at_th: formatThaiNow(),
                    details: []
                };
                setAutoSyncReport(reportObj);
                pushAdminNotification(
                    `ปรับสถานะอัตโนมัติวันนี้: ${localUpdated} User`,
                    `อัปเดตสถานะหมดอายุลง Database แล้ว ${localUpdated} User (เตรียมส่งเข้า Chat ในอนาคต)`,
                    localUpdated
                );
                await loadAll();
                alert(`ตรวจสอบและปรับสถานะอัตโนมัติแล้ว ${localUpdated} User ครับ`);
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดระหว่างปรับสถานะอัตโนมัติ');
        } finally {
            setAutoSyncing(false);
        }
    };

    // [SA-1.8] ฟังก์ชันจัดการฟอร์มแพ็กเกจ บริการ และราคา
    const handleFeatureChange = (idx, field, value) => {
        setForm((prev) => {
            const next = [...prev.features];
            next[idx] = { ...next[idx], [field]: value };
            return { ...prev, features: next };
        });
    };

    const addFeatureRow = () => {
        setForm((prev) => ({
            ...prev,
            features: [...prev.features, { title_th: '', description_th: '' }]
        }));
    };

    const removeFeatureRow = (idx) => {
        setForm((prev) => {
            const next = prev.features.filter((_, i) => i !== idx);
            return { ...prev, features: next.length > 0 ? next : [{ title_th: '', description_th: '' }] };
        });
    };

    const startEditPackage = (pkg) => {
        setForm({
            package_id: pkg.package_id,
            code: pkg.code || '',
            name_th: pkg.name_th || '',
            name_en: pkg.name_en || '',
            badge_tier: pkg.badge_tier || 'SILVER',
            price_amount: Number(pkg.price_amount || 0),
            billing_cycle: pkg.billing_cycle || 'YEARLY',
            duration_days: Number(pkg.duration_days || 365),
            max_shop_products: pkg.max_shop_products ?? '',
            target_audience: pkg.target_audience || 'ALL',
            visibility_boost_level: Number(pkg.visibility_boost_level || 1),
            chat_tier: pkg.chat_tier || 'STANDARD',
            sort_order: Number(pkg.sort_order || 10),
            features:
                Array.isArray(pkg.features) && pkg.features.length > 0
                    ? pkg.features.map((f) => ({
                          title_th: f.title_th || '',
                          description_th: f.description_th || ''
                      }))
                    : [{ title_th: '', description_th: '' }]
        });
        setActiveTab('PACKAGES');
    };

    const handleSavePackage = async (e) => {
        e.preventDefault();
        if (!form.name_th.trim()) return alert('กรุณากรอกชื่อแพ็กเกจ');
        if (!form.package_id && !form.code.trim()) return alert('กรุณากรอกรหัสแพ็กเกจ (Code)');

        setSaving(true);
        try {
            const payload = {
                code: form.code.trim().toUpperCase(),
                name_th: form.name_th.trim(),
                name_en: form.name_en.trim() || form.name_th.trim(),
                badge_tier: form.badge_tier,
                price_amount: Number(form.price_amount || 0),
                billing_cycle: form.billing_cycle,
                duration_days: Number(form.duration_days || 365),
                max_shop_products: form.max_shop_products === '' ? null : Number(form.max_shop_products),
                target_audience: form.target_audience,
                visibility_boost_level: Number(form.visibility_boost_level || 1),
                chat_tier: form.chat_tier,
                sort_order: Number(form.sort_order || 10),
                features: form.features.filter((f) => f.title_th && f.title_th.trim() !== '')
            };

            const url = form.package_id
                ? `${API_URL}/api/super-admin/packages/${form.package_id}`
                : `${API_URL}/api/super-admin/packages`;
            const method = form.package_id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.success) {
                alert('บันทึกไม่สำเร็จ: ' + (data.message || 'เกิดข้อผิดพลาด'));
            } else {
                alert('บันทึกแพ็กเกจเรียบร้อยแล้วครับ');
                setForm(EMPTY_FORM);
                await loadAll();
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePackage = async (pkg) => {
        if (!window.confirm(`ยืนยันลบแพ็กเกจ "${pkg.name_th}" หรือไม่?`)) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/packages/${pkg.package_id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                if (form.package_id === pkg.package_id) setForm(EMPTY_FORM);
                await loadAll();
            } else {
                alert('ลบไม่สำเร็จ: ' + (data.message || ''));
            }
        } finally {
            setSaving(false);
        }
    };

    // [SA-1.9] ฟังก์ชัน Update การตั้งค่าแจ้งเตือนล่วงหน้า + การตลาด User Free
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/packages/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notify_days_before: Number(notifyDaysBefore || 30),
                    free_village_years_default: Number(freeVillageYearsDefault || 1),
                    free_upsell_interval_days: Number(freeUpsellIntervalDays || 7),
                    free_upsell_headline: freeUpsellHeadline,
                    free_upsell_message: freeUpsellMessage,
                    qr_prompt_info: qrPromptInfo,
                    updated_by: adminAccountId
                })
            });
            const data = await res.json();
            if (data.success) {
                setLastUpdatedText(formatThaiNow());
                pushAdminNotification(
                    'Update การตั้งค่าแพ็กเกจและการตลาดสำเร็จ',
                    `เตือนล่วงหน้า ${notifyDaysBefore} วัน | ชวน User Free ทุก ${freeUpsellIntervalDays} วัน`,
                    0
                );
                await loadAll();
                alert('Update การตั้งค่าเรียบร้อยแล้วครับ');
            } else {
                alert('Update ไม่สำเร็จ: ' + (data.message || ''));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateUserSub = async (subId, paymentStatus, daysToAdd) => {
        if (!subId) return alert('ผู้ใช้นี้ยังไม่มีประวัติการสมัครแพ็กเกจ');
        setSaving(true);
        try {
            const nextExpires = new Date(Date.now() + Number(daysToAdd || 365) * 24 * 60 * 60 * 1000).toISOString();
            const res = await fetch(`${API_URL}/api/super-admin/package-users/${subId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_status: paymentStatus,
                    expires_at: nextExpires
                })
            });
            const data = await res.json();
            if (data.success) {
                pushAdminNotification('อัปเดตวันใช้งานให้ผู้ใช้ 1 ราย', `ต่ออายุ +${daysToAdd} วัน สถานะ ${paymentStatus}`, 1);
                await loadAll();
                alert('อัปเดตสถานะและวันหมดอายุเรียบร้อยแล้ว');
            }
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = usersList.filter((u) => {
        const kw = searchUser.trim().toLowerCase();
        if (!kw) return true;
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const phone = String(u.username_phone || '').toLowerCase();
        const village = `${u.village_no || ''} ${u.village_name || ''}`.toLowerCase();
        return fullName.includes(kw) || phone.includes(kw) || village.includes(kw);
    });

    const summaryStats = {
        totalUsers: usersList.length,
        activePaid: usersList.filter((u) => ['PAID', 'FREE_GRANTED'].includes(String(u.status_meta?.payment_status || '')) && !u.status_meta?.is_expired).length,
        expiringSoon: usersList.filter((u) => u.status_meta?.is_expiring_soon).length,
        expired: usersList.filter((u) => u.status_meta?.is_expired).length,
        unselected: usersList.filter((u) => !u.subscription_id).length
    };

    const getTabBtnStyle = (tabKey) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '12px',
        border: activeTab === tabKey ? '1px solid #4f46e5' : '1px solid #cbd5e1',
        backgroundColor: activeTab === tabKey ? '#4f46e5' : '#ffffff',
        color: activeTab === tabKey ? '#ffffff' : '#1e293b',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer'
    });
return (
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* [SA-2.1] Header Banner + ปุ่มปรับสถานะอัตโนมัติไปที่ Database */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #312e81 60%, #1e293b 100%)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: '#ffffff',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.18)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                                color: '#fde68a',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                marginBottom: '6px'
                            }}
                        >
                            <Shield size={13} /> SUPER ADMIN CONSOLE
                        </div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                            จัดการระบบแพ็กเกจ (Parkgate) & วันหมดอายุ
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        disabled={autoSyncing}
                        onClick={handleAutoSyncStatuses}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer'
                        }}
                    >
                        {autoSyncing ? <Loader2 size={14} /> : <Sparkles size={14} />}
                        ปรับสถานะอัตโนมัติ (DB)
                    </button>

                    <button
                        type="button"
                        onClick={loadAll}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.25)',
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={14} /> รีเฟรชข้อมูล
                    </button>
                </div>
            </div>

            {/* [SA-2.2] กล่องแจ้งเตือน (Notification) ว่าวันนี้ปรับไปกี่ User + เตรียมเชื่อมระบบ Chat ในอนาคต */}
            {adminNotifications.length > 0 && (
                <div style={{ ...cardStyle, border: '1px solid #a7f3d0', backgroundColor: '#f0fdf4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                            <BellRing size={16} /> Notification การปรับสถานะอัตโนมัติ (รอเชื่อมระบบ Chat ในอนาคต)
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                            {adminNotifications[0].timeTh}
                        </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        {adminNotifications[0].title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                        {adminNotifications[0].detail}
                    </div>
                </div>
            )}

            {/* [SA-2.3] แท็บเมนูแยกชัดเจน: แพ็กเกจ / รายชื่อผู้ใช้ / รายงาน / ตั้งค่า */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button type="button" onClick={() => setActiveTab('PACKAGES')} style={getTabBtnStyle('PACKAGES')}>
                    <PackageIcon size={15} /> จัดการแพ็กเกจ / บริการ / ราคา
                </button>
                <button type="button" onClick={() => setActiveTab('USERS')} style={getTabBtnStyle('USERS')}>
                    <Users size={15} /> รายชื่อผู้ใช้งาน & นับถอยหลังหมดอายุ ({usersList.length})
                </button>
                <button type="button" onClick={() => setActiveTab('REPORTS')} style={getTabBtnStyle('REPORTS')}>
                    <BarChart3 size={15} /> รายงานสถานะ & การปรับอัตโนมัติ
                </button>
                <button type="button" onClick={() => setActiveTab('SETTINGS')} style={getTabBtnStyle('SETTINGS')}>
                    <Clock size={15} /> ตั้งค่าแจ้งเตือน & การตลาด Free
                </button>
            </div>

            {loading ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px', color: '#475569' }}>
                    <Loader2 size={28} style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>กำลังโหลดข้อมูลหลังบ้าน...</div>
                </div>
            ) : activeTab === 'PACKAGES' ? (
                /* [SA-2.4] แท็บจัดการแพ็กเกจ บริการ กลุ่มเป้าหมาย และราคา */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
                    <form onSubmit={handleSavePackage} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                {form.package_id ? 'แก้ไขแพ็กเกจ' : 'เพิ่มแพ็กเกจใหม่'}
                            </h2>
                            {form.package_id && (
                                <button
                                    type="button"
                                    onClick={() => setForm(EMPTY_FORM)}
                                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    + สร้างแพ็กเกจใหม่
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>รหัสแพ็กเกจ (Code) *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={Boolean(form.package_id)}
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="เช่น SILVER_990"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>ระดับ Icon (Top Navbar)</label>
                                <select
                                    value={form.badge_tier}
                                    onChange={(e) => setForm({ ...form, badge_tier: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="FREE">Free</option>
                                    <option value="SILVER">Silver</option>
                                    <option value="DIAMOND">Diamond</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>กลุ่มเป้าหมายแพ็กเกจ</label>
                                <select
                                    value={form.target_audience}
                                    onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="ALL">ทั้งหมด (หมู่บ้าน & ผู้ใช้)</option>
                                    <option value="VILLAGE">หมู่บ้าน (VILLAGE)</option>
                                    <option value="USER">ผู้ใช้งานทั่วไป (USER)</option>
                                    <option value="SHOP">ร้านค้า (SHOP)</option>
                                    <option value="BUSINESS">ธุรกิจ (BUSINESS)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>ระดับการดันการมองเห็น (1-10)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={form.visibility_boost_level}
                                    onChange={(e) => setForm({ ...form, visibility_boost_level: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>ชื่อแพ็กเกจ (ภาษาไทย) *</label>
                            <input
                                type="text"
                                required
                                value={form.name_th}
                                onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                                placeholder="เช่น แพ็กเกจรายปี"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>ราคา (บาท)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.price_amount}
                                    onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>รอบบิล</label>
                                <select
                                    value={form.billing_cycle}
                                    onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="FREE">FREE</option>
                                    <option value="YEARLY">YEARLY (รายปี)</option>
                                    <option value="MONTHLY">MONTHLY (รายเดือน)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>ระยะเวลา (วัน)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.duration_days}
                                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>รายการบริการ / สิทธิ์ที่แสดงหน้า Parkgate</label>
                                <button
                                    type="button"
                                    onClick={addFeatureRow}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #c7d2fe',
                                        backgroundColor: '#eef2ff',
                                        color: '#4338ca',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={14} /> เพิ่มบริการ
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {form.features.map((feat, idx) => (
                                    <div key={idx} style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="text"
                                                value={feat.title_th}
                                                onChange={(e) => handleFeatureChange(idx, 'title_th', e.target.value)}
                                                placeholder="ชื่อบริการ เช่น แชท โทรเสียง Video Call"
                                                style={{ ...inputStyle, backgroundColor: '#ffffff' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeatureRow(idx)}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                                                title="ลบบริการนี้"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={feat.description_th}
                                            onChange={(e) => handleFeatureChange(idx, 'description_th', e.target.value)}
                                            placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                                            style={{ ...inputStyle, backgroundColor: '#ffffff', fontSize: '13px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Save size={16} />
                            {form.package_id ? 'บันทึกการแก้ไขแพ็กเกจ' : 'บันทึกแพ็กเกจใหม่'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {packages.map((pkg) => (
                            <div key={pkg.package_id} style={cardStyle}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '999px', backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                                                {pkg.badge_tier}
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                                                กลุ่ม: {pkg.target_audience || 'ALL'}
                                            </span>
                                            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{pkg.code}</span>
                                        </div>
                                        <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                            {pkg.name_th}
                                        </h3>
                                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>
                                            {Number(pkg.price_amount || 0) === 0
                                                ? 'ฟรี (฿0)'
                                                : `฿${Number(pkg.price_amount).toLocaleString()} (${pkg.duration_days} วัน)`}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => startEditPackage(pkg)}
                                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePackage(pkg)}
                                            style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                                            title="ลบแพ็กเกจ"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <ul style={{ margin: '12px 0 0 0', padding: '12px 0 0 0', borderTop: '1px solid #f1f5f9', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(pkg.features || []).map((f) => (
                                        <li key={f.feature_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                                            <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                                            <span>{f.title_th}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'USERS' ? (
                /* [SA-2.5] แท็บรายชื่อผู้ใช้งาน & นับถอยหลังวันหมดอายุ */
                <div style={cardStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                            รายชื่อผู้ใช้งาน & เวลานับถอยหลังวันหมดอายุ
                        </h2>
                        <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="ค้นหาชื่อ เบอร์โทร หรือหมู่บ้าน..."
                            style={{ ...inputStyle, maxWidth: '300px' }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                                    <th style={{ padding: '10px 12px' }}>ผู้ใช้งาน</th>
                                    <th style={{ padding: '10px 12px' }}>หมู่บ้าน</th>
                                    <th style={{ padding: '10px 12px' }}>แพ็กเกจ / สถานะ</th>
                                    <th style={{ padding: '10px 12px' }}>หมดอายุ (เวลาไทย) & นับถอยหลัง</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => {
                                    const meta = u.status_meta || {};
                                    const daysLeft = meta.days_remaining;
                                    return (
                                        <tr key={u.account_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                                    {`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'}
                                                </div>
                                                <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{u.username_phone || '-'}</div>
                                            </td>
                                            <td style={{ padding: '12px', color: '#334155' }}>
                                                {u.village_name ? `หมู่ ${u.village_no || '-'} ${u.village_name}` : '-'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 700, color: '#4338ca' }}>{meta.package_name || 'ยังไม่เลือก'}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>ชำระ: {meta.payment_status || '-'}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {meta.expires_at_th ? (
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{meta.expires_at_th}</div>
                                                        <div
                                                            style={{
                                                                fontWeight: 800,
                                                                marginTop: '3px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                color: meta.is_expired ? '#dc2626' : meta.is_expiring_soon ? '#b45309' : '#047857'
                                                            }}
                                                        >
                                                            {meta.is_expiring_soon && <AlertTriangle size={13} />}
                                                            {meta.is_expired
                                                                ? 'หมดอายุแล้ว'
                                                                : `นับถอยหลัง: เหลือ ${Math.max(0, daysLeft)} วัน`}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>ไม่มีกำหนดวันหมดอายุ</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {u.subscription_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateUserSub(u.subscription_id, 'PAID', 365)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #a7f3d0',
                                                            backgroundColor: '#ecfdf5',
                                                            color: '#047857',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        +365 วัน
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'REPORTS' ? (
                /* [SA-2.6] แท็บรายงานสถานะผู้ใช้งาน + รายงานการปรับอัตโนมัติวันนี้ + ประวัติ Notification */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>ผู้ใช้ทั้งหมด</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{summaryStats.totalUsers}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>ใช้งานปกติ</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>{summaryStats.activePaid}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>ใกล้หมดอายุ</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{summaryStats.expiringSoon}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>หมดอายุแล้ว</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>{summaryStats.expired}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>ปรับอัตโนมัติวันนี้</div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#4f46e5', marginTop: '4px' }}>
                                {autoSyncReport ? autoSyncReport.updated_count : 0} User
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                    รายงานการปรับสถานะอัตโนมัติ & Notification
                                </h2>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {autoSyncReport
                                        ? `ล่าสุดเมื่อ: ${autoSyncReport.synced_at_th} (ปรับสถานะ ${autoSyncReport.updated_count} User)`
                                        : 'กดปุ่ม "ปรับสถานะอัตโนมัติ (DB)" ด้านบนเพื่อซิงค์สถานะลงฐานข้อมูลและบันทึกแจ้งเตือน'}
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={autoSyncing}
                                onClick={handleAutoSyncStatuses}
                                style={{
                                    padding: '9px 14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                }}
                            >
                                รันปรับสถานะอัตโนมัติตอนนี้
                            </button>
                        </div>

                        {adminNotifications.length === 0 ? (
                            <div style={{ fontSize: '13px', color: '#64748b' }}>ยังไม่มีรายการแจ้งเตือนการปรับสถานะในรอบนี้</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {adminNotifications.map((n) => (
                                    <div key={n.id} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                            <span>{n.title}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{n.timeTh}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{n.detail}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* [SA-2.7] แท็บตั้งค่าแจ้งเตือนล่วงหน้า (เวลาไทย) + การตลาดเชิญชวน User Free + ปุ่ม Update */
                <form onSubmit={handleUpdateSettings} style={{ ...cardStyle, maxWidth: '620px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        ตั้งค่าแจ้งเตือนล่วงหน้า & การตลาดเชิญชวน User Free (Asia/Bangkok)
                    </h2>

                    <div>
                        <label style={labelStyle}>แจ้งเตือนล่วงหน้ากี่วันก่อนหมดอายุ (เช่น 30 วัน = 1 เดือน)</label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={notifyDaysBefore}
                            onChange={(e) => setNotifyDaysBefore(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>จำนวนปีสิทธิ์ฟรีเริ่มต้นสำหรับหมู่บ้าน (สูงสุด 5 ปี)</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            value={freeVillageYearsDefault}
                            onChange={(e) => setFreeVillageYearsDefault(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>การตลาด User Free: เชิญชวนให้ Update ทุกกี่วัน (เช่น 7 = 1 สัปดาห์)</label>
                        <input
                            type="number"
                            min="1"
                            max="180"
                            value={freeUpsellIntervalDays}
                            onChange={(e) => setFreeUpsellIntervalDays(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>พาดหัวเชิญชวน User Free อัปเกรดแพ็กเกจ</label>
                        <input
                            type="text"
                            value={freeUpsellHeadline}
                            onChange={(e) => setFreeUpsellHeadline(e.target.value)}
                            placeholder="เช่น อัปเกรดแพ็กเกจเพื่อปลดล็อกสิทธิ์และเพิ่มการมองเห็น!"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>ข้อความชวนอัปเกรด (โพสต์สินค้ามากขึ้น / ดันการมองเห็น / แชท)</label>
                        <input
                            type="text"
                            value={freeUpsellMessage}
                            onChange={(e) => setFreeUpsellMessage(e.target.value)}
                            placeholder="เช่น เพิ่มโควตาสินค้า ดันการมองเห็นโพสต์ และแชทประสิทธิภาพสูงขึ้น"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>ข้อความ / รายละเอียดหน้า Scan QR Code</label>
                        <input
                            type="text"
                            value={qrPromptInfo}
                            onChange={(e) => setQrPromptInfo(e.target.value)}
                            placeholder="เช่น โอนเข้าบัญชีระบบชุมชนหรือสแกน QR Code"
                            style={inputStyle}
                        />
                    </div>

                    {lastUpdatedText && (
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                            อัปเดตล่าสุด (เวลาไทย): <strong>{lastUpdatedText}</strong>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Save size={16} />
                        Update การตั้งค่า
                    </button>
                </form>
            )}
        </div>
    );
}