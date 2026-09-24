/**
 * Auto-Save & Crash Recovery Utility for POS Sales & Purchases
 * Manages debounced local storage persistence, draft validation, and cleanup.
 */

export const POS_DRAFT_KEY = 'pos_active_draft_v1';
export const PURCHASE_DRAFT_KEY = 'purchase_active_draft_v1';

/**
 * Format ISO timestamp into a human-readable relative/short time
 */
export function formatDraftTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `${timeStr} (Today)`;
    }
    return `${timeStr}, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
  } catch (_) {
    return '';
  }
}

/**
 * Save draft data to localStorage
 */
export function saveDraft(key, data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (!data) {
      clearDraft(key);
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const serialCount = items.reduce(
      (sum, it) => sum + (Array.isArray(it.serials) ? it.serials.length : 0),
      0
    );

    // Only save if there's actual content (items or party or notes/costs)
    const hasMeaningfulContent =
      items.length > 0 ||
      Boolean(data.customerId) ||
      Boolean(data.supplierId) ||
      Boolean(data.reference) ||
      Boolean(data.extraCost && Number(data.extraCost) > 0);

    if (!hasMeaningfulContent) {
      clearDraft(key);
      return;
    }

    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      itemCount: items.length,
      serialCount,
      data,
    };

    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn(`[DraftRecovery] Failed to save draft for ${key}:`, err);
  }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(key) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;

    return {
      ...parsed,
      formattedTime: formatDraftTime(parsed.savedAt),
    };
  } catch (err) {
    console.warn(`[DraftRecovery] Failed to read draft for ${key}:`, err);
    return null;
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(key) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[DraftRecovery] Failed to clear draft for ${key}:`, err);
  }
}

/**
 * Check if a valid non-empty draft exists
 */
export function hasDraft(key) {
  const draft = loadDraft(key);
  return Boolean(draft && (draft.itemCount > 0 || draft.data?.customerId || draft.data?.supplierId));
}
