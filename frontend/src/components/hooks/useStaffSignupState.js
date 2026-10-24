import { useState } from 'react';
import { smartFetch } from '../../services/api';

export function useStaffSignupState() {
  const [staffName, setStaffName] = useState('');
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('Sales Executive');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  const handleStaffSignup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    const name = String(staffName || '').trim();
    const id = String(staffIdentifier || '').trim();
    const pass = String(staffPassword || '').trim();

    if (!name || !id || !pass) {
      setStaffError('Please enter full name, mobile number/email, and password.');
      return;
    }

    try {
      setStaffLoading(true);
      const res = await smartFetch('/security/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          identifier: id,
          password: pass,
          user_type: 'staff',
          staff_role: staffRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStaffSuccess(
          data.message ||
            'Registration submitted successfully! Your account will be activated once approved by the shop administrator.'
        );
        setStaffName('');
        setStaffIdentifier('');
        setStaffPassword('');
      } else {
        setStaffError(data.message || 'Staff registration failed. Please check inputs.');
      }
    } catch (err) {
      setStaffError(err.message || 'Network error occurred during registration.');
    } finally {
      setStaffLoading(false);
    }
  };

  return {
    staffName,
    setStaffName,
    staffIdentifier,
    setStaffIdentifier,
    staffPassword,
    setStaffPassword,
    staffRole,
    setStaffRole,
    staffLoading,
    staffError,
    staffSuccess,
    handleStaffSignup,
  };
}
