/**
 * Helper to get Tailwind CSS badge color classes based on staff role name
 */
export const getRoleBadgeColor = (roleName = '') => {
  const lower = roleName.toLowerCase();
  if (lower.includes('super admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (lower.includes('admin')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (lower.includes('technician')) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

/**
 * Helper to extract initials from staff member's name
 */
export const getInitials = (name = '') => {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST'
  );
};
