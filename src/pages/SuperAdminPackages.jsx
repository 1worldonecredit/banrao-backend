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
    Loader2
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
    sort_order: 10,
    features: [{ title_th: '', description_th: '' }]
};

export default function SuperAdminPackages() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const adminAccountId = userData.account_id || userData.id || null;

    const [activeTab, setActiveTab] = useState('PACKAGES'); // 'PACKAGES' | 'USERS' | 'SETTINGS'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ข้อมูลแพ็กเกจและตั้งค่า
    const [packages, setPackages] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    // ตั้งค่าแจ้งเตือนล่วงหน้า + ปุ่ม Update
    const [notifyDaysBefore, setNotifyDaysBefore] = useState(30);
    const [freeVillageYearsDefault, setFreeVillageYearsDefault] = useState(1);
    const [qrPromptInfo, setQrPromptInfo] = useState('');
    const [lastUpdatedText, setLastUpdatedText] = useState('');

    // รายชื่อผู้ใช้งานและนับถอยหลังวันหมดอายุ
    const [usersList, setUsersList] = useState([]);
    const [searchUser, setSearchUser] = useState('');

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
            console.error('Load SuperAdmin Packages Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

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

    // ฟังก์ชัน Update การตั้งค่าแจ้งเตือนล่วงหน้า (เวลาไทย Asia/Bangkok)
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
                    qr_prompt_info: qrPromptInfo,
                    updated_by: adminAccountId
                })
            });
            const data = await res.json();
            if (data.success) {
                setLastUpdatedText(formatThaiNow());
                await loadAll();
                alert('Update การตั้งค่าแจ้งเตือนล่วงหน้าเรียบร้อยแล้วครับ');
            } else {
                alert('Update ไม่สำเร็จ: ' + (data.message || ''));
            }
        } finally {
            setSaving(false);
        }
    };

    // ปรับวันหมดอายุหรือสถานะของผู้ใช้งานรายคน
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

    const inputCls =
        'w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800';
    const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full mb-1">
                            <Shield size={13} /> SUPER ADMIN CONSOLE
                        </div>
                        <h1 className="text-xl font-extrabold m-0">จัดการระบบแพ็กเกจ (Parkgate) & วันหมดอายุ</h1>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={loadAll}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 transition"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรชข้อมูล
                </button>
            </div>

            {/* แท็บเมนู */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('PACKAGES')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                        activeTab === 'PACKAGES'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <PackageIcon size={15} /> จัดการแพ็กเกจ / บริการ / ราคา
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('USERS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                        activeTab === 'USERS'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Users size={15} /> รายชื่อผู้ใช้งาน & นับถอยหลังหมดอายุ ({usersList.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                        activeTab === 'SETTINGS'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Clock size={15} /> ตั้งค่าแจ้งเตือนล่วงหน้า (เวลาไทย)
                </button>
            </div>

            {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="animate-spin" size={28} />
                    <span className="text-sm font-medium">กำลังโหลดข้อมูลหลังบ้าน...</span>
                </div>
            ) : activeTab === 'PACKAGES' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* ฟอร์มเพิ่ม / แก้ไขแพ็กเกจ */}
                    <form
                        onSubmit={handleSavePackage}
                        className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h2 className="text-base font-extrabold text-slate-800 m-0">
                                {form.package_id ? 'แก้ไขแพ็กเกจ' : 'เพิ่มแพ็กเกจใหม่'}
                            </h2>
                            {form.package_id && (
                                <button
                                    type="button"
                                    onClick={() => setForm(EMPTY_FORM)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                                >
                                    + สร้างใหม่
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>รหัสแพ็กเกจ (Code) *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={Boolean(form.package_id)}
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="เช่น SILVER_990 หรือ VIP_5900"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>ระดับ Icon (Top Navbar)</label>
                                <select
                                    value={form.badge_tier}
                                    onChange={(e) => setForm({ ...form, badge_tier: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="FREE">Free</option>
                                    <option value="SILVER">Silver</option>
                                    <option value="DIAMOND">Diamond</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>ชื่อแพ็กเกจ (ภาษาไทย) *</label>
                            <input
                                type="text"
                                required
                                value={form.name_th}
                                onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                                placeholder="เช่น แพ็กเกจรายปี"
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className={labelCls}>ราคา (บาท)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.price_amount}
                                    onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>รอบบิล</label>
                                <select
                                    value={form.billing_cycle}
                                    onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="FREE">FREE</option>
                                    <option value="YEARLY">YEARLY (รายปี)</option>
                                    <option value="MONTHLY">MONTHLY (รายเดือน)</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>ระยะเวลา (วัน)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.duration_days}
                                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* รายการบริการในแพ็กเกจ */}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls + ' m-0'}>รายการบริการ / สิทธิ์ที่แสดงหน้า Parkgate</label>
                                <button
                                    type="button"
                                    onClick={addFeatureRow}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                                >
                                    <Plus size={14} /> เพิ่มบริการ
                                </button>
                            </div>

                            <div className="space-y-2">
                                {form.features.map((feat, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={feat.title_th}
                                                onChange={(e) => handleFeatureChange(idx, 'title_th', e.target.value)}
                                                placeholder="ชื่อบริการ เช่น แชท โทรเสียง Video Call"
                                                className={inputCls}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeatureRow(idx)}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                                title="ลบบริการนี้"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={feat.description_th}
                                            onChange={(e) => handleFeatureChange(idx, 'description_th', e.target.value)}
                                            placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                                            className={inputCls}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {form.package_id ? 'บันทึกการแก้ไขแพ็กเกจ' : 'บันทึกแพ็กเกจใหม่'}
                        </button>
                    </form>

                    {/* รายการแพ็กเกจปัจจุบัน */}
                    <div className="lg:col-span-6 space-y-3">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.package_id}
                                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {pkg.badge_tier}
                                            </span>
                                            <span className="text-xs font-mono text-slate-400">{pkg.code}</span>
                                        </div>
                                        <h3 className="text-base font-extrabold text-slate-800 mt-1 mb-0">
                                            {pkg.name_th}
                                        </h3>
                                        <div className="text-sm font-black text-emerald-700 mt-0.5">
                                            {Number(pkg.price_amount || 0) === 0
                                                ? 'ฟรี (฿0)'
                                                : `฿${Number(pkg.price_amount).toLocaleString()} (${pkg.duration_days} วัน)`}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => startEditPackage(pkg)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePackage(pkg)}
                                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                                            title="ลบแพ็กเกจ"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600 list-none p-0 m-0">
                                    {(pkg.features || []).map((f) => (
                                        <li key={f.feature_id} className="flex items-center gap-1.5">
                                            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                                            <span>{f.title_th}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'USERS' ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="text-base font-extrabold text-slate-800 m-0">
                            รายชื่อผู้ใช้งาน & เวลานับถอยหลังวันหมดอายุ
                        </h2>
                        <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="ค้นหาชื่อ เบอร์โทร หรือหมู่บ้าน..."
                            className="w-full sm:w-72 p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-2.5 px-3">ผู้ใช้งาน</th>
                                    <th className="py-2.5 px-3">หมู่บ้าน</th>
                                    <th className="py-2.5 px-3">แพ็กเกจ / สถานะ</th>
                                    <th className="py-2.5 px-3">หมดอายุ (เวลาไทย) & นับถอยหลัง</th>
                                    <th className="py-2.5 px-3 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => {
                                    const meta = u.status_meta || {};
                                    const daysLeft = meta.days_remaining;
                                    return (
                                        <tr key={u.account_id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                            <td className="py-3 px-3">
                                                <div className="font-extrabold text-slate-800">
                                                    {`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'ไม่ระบุชื่อ'}
                                                </div>
                                                <div className="text-slate-500 font-mono">{u.username_phone || '-'}</div>
                                            </td>
                                            <td className="py-3 px-3 text-slate-700">
                                                {u.village_name ? `หมู่ ${u.village_no || '-'} ${u.village_name}` : '-'}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="font-bold text-indigo-700">{meta.package_name || 'ยังไม่เลือก'}</div>
                                                <div className="text-[11px] text-slate-500">ชำระ: {meta.payment_status || '-'}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {meta.expires_at_th ? (
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{meta.expires_at_th}</div>
                                                        <div
                                                            className={`font-extrabold mt-0.5 inline-flex items-center gap-1 ${
                                                                meta.is_expired
                                                                    ? 'text-red-600'
                                                                    : meta.is_expiring_soon
                                                                    ? 'text-amber-700'
                                                                    : 'text-emerald-700'
                                                            }`}
                                                        >
                                                            {meta.is_expiring_soon && <AlertTriangle size={12} />}
                                                            {meta.is_expired
                                                                ? 'หมดอายุแล้ว'
                                                                : `นับถอยหลัง: เหลือ ${Math.max(0, daysLeft)} วัน`}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">ไม่มีกำหนดวันหมดอายุ</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                                {u.subscription_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateUserSub(u.subscription_id, 'PAID', 365)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
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
            ) : (
                /* แท็บตั้งค่าแจ้งเตือนล่วงหน้า (เวลาไทย Asia/Bangkok + ปุ่ม Update) */
                <form
                    onSubmit={handleUpdateSettings}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl space-y-4"
                >
                    <h2 className="text-base font-extrabold text-slate-800 m-0">
                        ตั้งค่าแจ้งเตือนล่วงหน้าก่อนหมดอายุ (เขตเวลา Asia/Bangkok)
                    </h2>

                    <div>
                        <label className={labelCls}>แจ้งเตือนล่วงหน้ากี่วันก่อนหมดอายุ (เช่น 30 วัน = 1 เดือน)</label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={notifyDaysBefore}
                            onChange={(e) => setNotifyDaysBefore(e.target.value)}
                            className={inputCls}
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            เมื่อผู้ใช้เหลือวันใช้งานน้อยกว่าหรือเท่ากับจำนวนวันที่กำหนด ระบบจะเด้งแจ้งเตือนและเปิดหน้าแพ็กเกจให้อัตโนมัติ
                        </p>
                    </div>

                    <div>
                        <label className={labelCls}>จำนวนปีสิทธิ์ฟรีเริ่มต้นสำหรับหมู่บ้าน (สูงสุด 5 ปี)</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            value={freeVillageYearsDefault}
                            onChange={(e) => setFreeVillageYearsDefault(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>ข้อความ / รายละเอียดหน้า Scan QR Code</label>
                        <input
                            type="text"
                            value={qrPromptInfo}
                            onChange={(e) => setQrPromptInfo(e.target.value)}
                            placeholder="เช่น โอนเข้าบัญชีระบบชุมชนหรือสแกน QR Code"
                            className={inputCls}
                        />
                    </div>

                    {lastUpdatedText && (
                        <div className="text-xs text-slate-500">
                            อัปเดตล่าสุด (เวลาไทย): <strong>{lastUpdatedText}</strong>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Update การตั้งค่า
                    </button>
                </form>
            )}
        </div>
    );
}