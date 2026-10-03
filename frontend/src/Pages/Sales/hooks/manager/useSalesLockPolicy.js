import { useState, useMemo, useCallback } from 'react';

export function useSalesLockPolicy({ currentUser, shopSettings }) {
  const authUser = useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const saved =
        localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return Boolean(
      !authUser ||
        Number(authUser.role_id) === 1 ||
        Number(authUser.role_id) === 2 ||
        ['admin', 'super admin', 'owner', 'manager'].some((r) =>
          String(authUser.role_name || authUser.role_title || authUser.role || '')
            .toLowerCase()
            .includes(r)
        )
    );
  }, [authUser]);

  const [overrideModal, setOverrideModal] = useState({
    isOpen: false,
    actionType: null, // 'edit' | 'delete'
    sale: null,
    enteredPin: '',
    error: '',
    lockReason: '',
  });

  // Helper to determine lock status for a sale record based on policy rules
  const getSaleLockStatus = useCallback(
    (sale) => {
      const hoursOld = sale?.created_at
        ? (Date.now() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60)
        : 0;
      const allowMod = shopSettings?.allow_invoice_modification !== false;
      const editLimitHours = shopSettings?.invoice_edit_time_limit_hours ?? 360;
      const isShiftClosed = Boolean(sale?.is_shift_closed);

      // Edit lock
      let isEditLocked = false;
      let editLockReason = '';
      if (!allowMod) {
        isEditLocked = true;
        editLockReason = 'Invoice modification is disabled by administrative policy.';
      } else if (isShiftClosed) {
        isEditLocked = true;
        editLockReason = 'Register shift is closed and locked.';
      } else if (hoursOld > editLimitHours) {
        isEditLocked = true;
        editLockReason = `Edit window closed — invoices are only editable within ${Math.floor(
          editLimitHours / 24
        )} days (${editLimitHours} hours).`;
      }

      // Delete lock
      let isDeleteLocked = false;
      let deleteLockReason = '';
      if (!allowMod) {
        isDeleteLocked = true;
        deleteLockReason = 'Invoice deletion is disabled by administrative policy.';
      } else if (isShiftClosed) {
        isDeleteLocked = true;
        deleteLockReason = 'Register shift is closed and locked.';
      } else if (hoursOld > 168) {
        // 7 days
        isDeleteLocked = true;
        deleteLockReason = 'Delete window (7 days) has expired.';
      }

      return {
        hoursOld,
        isShiftClosed,
        isEditLocked,
        editLockReason,
        isDeleteLocked,
        deleteLockReason,
      };
    },
    [shopSettings]
  );

  const handleConfirmOverride = useCallback(
    ({ onConfirmEdit, onConfirmDelete }) => {
      const entered = String(overrideModal.enteredPin || '').trim();
      if (!entered) {
        setOverrideModal((prev) => ({ ...prev, error: 'Please enter the Admin Security PIN.' }));
        return;
      }
      const configuredPin = String(shopSettings?.security_pin || '1234').trim();
      if (configuredPin && entered !== configuredPin) {
        setOverrideModal((prev) => ({
          ...prev,
          error: 'Invalid Admin Security PIN. Please try again.',
        }));
        return;
      }

      const { actionType, sale } = overrideModal;
      setOverrideModal({
        isOpen: false,
        actionType: null,
        sale: null,
        enteredPin: '',
        error: '',
        lockReason: '',
      });

      if (actionType === 'edit') {
        onConfirmEdit?.(sale.id, entered);
      } else if (actionType === 'delete') {
        onConfirmDelete?.(sale.id, sale, entered);
      }
    },
    [overrideModal, shopSettings]
  );

  return {
    isAdmin,
    overrideModal,
    setOverrideModal,
    getSaleLockStatus,
    handleConfirmOverride,
  };
}
