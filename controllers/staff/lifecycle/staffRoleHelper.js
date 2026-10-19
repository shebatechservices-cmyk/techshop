/**
 * Helper to normalize role enum
 */
function normalizeRole(role, roleName, roleId) {
    if (role && ['ADMIN', 'STAFF', 'TECHNICIAN'].includes(String(role).toUpperCase())) {
        return String(role).toUpperCase();
    }
    const name = String(roleName || '').toLowerCase();
    if (name.includes('admin') || roleId === 1) return 'ADMIN';
    if (name.includes('technician') || name.includes('tech') || roleId === 4) return 'TECHNICIAN';
    return 'STAFF';
}

module.exports = {
    normalizeRole,
};
