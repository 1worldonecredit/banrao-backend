// src/utils/permissions.js
export const getPagePermissions = (menuPath) => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // 1. กรณีเป็น Super Admin ให้สิทธิ์เต็มทุกอย่างอัตโนมัติ
    const isSuperAdmin =
      userData?.is_super_admin === true ||
      String(userData?.role || '').toUpperCase() === 'SUPER_ADMIN' ||
      String(userData?.position_level || '').toUpperCase() === 'SYSTEM' ||
      userData?.full_name === 'Super Admin';

    if (isSuperAdmin) {
      return {
        isSuperAdmin: true,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true
      };
    }

    // 2. ดึงรายการสิทธิ์เมนูที่เก็บไว้ตั้งแต่ตอน Login
    const rawPerms =
      userData?.adminMenuPermissions ||
      userData?.menuPermissions ||
      JSON.parse(localStorage.getItem('adminMenuPermissions') || '[]') ||
      JSON.parse(localStorage.getItem('menuPermissions') || '[]');

    const permList = Array.isArray(rawPerms) ? rawPerms : [];

    // หาสิทธิ์ที่ตรงกับ Path ของหน้านี้ (เช่น '/staff-management')
    const matched = permList.find(
      (p) => (p.menu_path || p.path || p.route) === menuPath
    );

    if (!matched) {
      // ถ้าไม่พบการตั้งค่าสิทธิ์ของเมนูนี้ ให้ดูได้อย่างเดียว (ปลอดภัยไว้ก่อน)
      return {
        isSuperAdmin: false,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false
      };
    }

    return {
      isSuperAdmin: false,
      canView: Boolean(matched.can_view),
      canCreate: Boolean(matched.can_create),
      canEdit: Boolean(matched.can_edit),
      canDelete: Boolean(matched.can_delete),
      canApprove: Boolean(matched.can_approve)
    };
  } catch {
    return {
      isSuperAdmin: false,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false
    };
  }
};