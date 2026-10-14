import { useState } from 'react';
import API, { getAuthHeaders } from '../../../services/api';

export default function useDevUserOps({ showMsg, onDeveloperLogin, onClose, setLoading }) {
  const [usersList, setUsersList] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: 2,
    role_name: 'Sales Executive',
    is_active: true,
  });

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API}/dev/users`, {
        headers: getAuthHeaders(),
      }).catch(() => null);
      if (res && res.ok) {
        const d = await res.json();
        if (d.success) setUsersList(d.data || []);
      }
    } catch (e) {
      console.error('fetchUsersList error:', e);
    }
  };

  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    if (!newUserForm.name || (!newUserForm.email && !newUserForm.phone) || !newUserForm.password) {
      showMsg('Name, Password, and at least one of Email/Phone are required!', 'error');
      return;
    }
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newUserForm),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User "${d.user.name}" created successfully!`);
        setShowAddUserModal(false);
        setNewUserForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          role_id: 2,
          role_name: 'Sales Executive',
          is_active: true,
        });
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to create user', 'error');
      }
    } catch (err) {
      showMsg('Error creating user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleSaveEditUser = async (e) => {
    if (e) e.preventDefault();
    if (!editingUser) return;
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editingUser),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User #${editingUser.id} (${editingUser.name}) updated successfully!`);
        setEditingUser(null);
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to update user', 'error');
      }
    } catch (err) {
      showMsg('Error updating user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (uId, uName) => {
    if (
      !window.confirm(
        `⚠️ Permanently delete user #${uId} ("${uName}") from database? This action cannot be undone.`
      )
    )
      return;
    try {
      setUserActionLoading(true);
      const res = await fetch(`${API}/dev/users/${uId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showMsg(`✓ User #${uId} ("${uName}") deleted successfully!`);
        fetchUsersList();
      } else {
        showMsg(d.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showMsg('Error deleting user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleBypassLogin = async (targetUser = null) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/dev/bypass-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ targetUserId: targetUser?.id || 1 }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        localStorage.setItem('sheba_auth_user', JSON.stringify(d.user));
        localStorage.setItem('sheba_auth_token', d.token);
        showMsg(`⚡ Instant Bypass Login granted for ${d.user.name}! Entering system...`);
        setTimeout(() => {
          if (onDeveloperLogin) onDeveloperLogin(d.user);
          if (onClose) onClose();
        }, 300);
      } else {
        showMsg(d.message || 'Failed to generate bypass login', 'error');
      }
    } catch (err) {
      showMsg('Error initiating bypass login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generate3TypePassword = () => {
    const prefixes = ['Sheba@', 'Admin#', 'Secure$', 'Tech!', 'Net*'];
    const randPre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const suffix = '!';
    return `${randPre}${randNum}${suffix}`;
  };

  return {
    usersList,
    showAddUserModal,
    setShowAddUserModal,
    editingUser,
    setEditingUser,
    userActionLoading,
    newUserForm,
    setNewUserForm,
    fetchUsersList,
    handleCreateUser,
    handleSaveEditUser,
    handleDeleteUser,
    handleBypassLogin,
    generate3TypePassword,
  };
}
