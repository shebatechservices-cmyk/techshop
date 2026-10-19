export const getAuthToken = () => {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('sheba_token') ||
      localStorage.getItem('sheba_auth_token') ||
      sessionStorage.getItem('sheba_auth_token') ||
      ''
    );
  } catch {
    return '';
  }
};

export const getActiveUser = () => {
  try {
    const stored = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
    if (stored) {
      const u = JSON.parse(stored);
      return u.name || u.role_title || 'Super Admin';
    }
  } catch {
    // fallback
  }
  return 'Super Admin';
};
