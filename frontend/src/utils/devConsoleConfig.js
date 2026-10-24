/**
 * Dev Console Configuration: Manages stealth shortcut and developer entry password.
 */

const SHORTCUT_STORAGE_KEY = 'sheba_dev_shortcut';
const PASS_HASH_STORAGE_KEY = 'sheba_dev_pass_hash';
const DEV_SESSION_KEY = 'sheba_dev_session_unlocked';

// Default: Ctrl + Shift + D
export const DEFAULT_SHORTCUT = {
  ctrl: true,
  shift: true,
  alt: false,
  key: 'D',
};

// Default password: 'sheba@dev2026'
export const DEFAULT_PASS_HASH =
  '5aa0a287d8aea91e3c49a2f999d6d3409e08e678b61eb48c66c062b793166448';

export async function hashString(str) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const buffer = new TextEncoder().encode(String(str || ''));
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return String(str || '');
}

export function getDevShortcutConfig() {
  try {
    const raw = localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ctrl: Boolean(parsed.ctrl),
          shift: Boolean(parsed.shift),
          alt: Boolean(parsed.alt),
          key: (parsed.key || 'D').toUpperCase(),
        };
      }
    }
  } catch (_) {}
  return { ...DEFAULT_SHORTCUT };
}

export function saveDevShortcutConfig(config) {
  const sanitized = {
    ctrl: Boolean(config.ctrl),
    shift: Boolean(config.shift),
    alt: Boolean(config.alt),
    key: (config.key || 'D').toUpperCase(),
  };
  localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function formatShortcut(config) {
  const parts = [];
  if (config.ctrl) parts.push('Ctrl');
  if (config.alt) parts.push('Alt');
  if (config.shift) parts.push('Shift');
  parts.push(config.key || 'D');
  return parts.join(' + ');
}

export function isShortcutMatch(event, config) {
  if (!event || !config) return false;
  const targetKey = (config.key || 'D').toUpperCase();
  const pressedKey = (event.key || '').toUpperCase();
  const isKeyEqual =
    pressedKey === targetKey ||
    (event.code && event.code.toUpperCase() === `KEY${targetKey}`);

  const ctrlMatches = config.ctrl ? (event.ctrlKey || event.metaKey) : (!event.ctrlKey && !event.metaKey);
  const shiftMatches = config.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = config.alt ? event.altKey : !event.altKey;

  return isKeyEqual && ctrlMatches && shiftMatches && altMatches;
}

export function getStoredPasswordHash() {
  return localStorage.getItem(PASS_HASH_STORAGE_KEY) || DEFAULT_PASS_HASH;
}

export async function verifyDevPassword(inputPassword) {
  const hash = await hashString(inputPassword);
  const storedHash = getStoredPasswordHash();
  return hash === storedHash;
}

export async function changeDevPassword(currentPassword, newPassword) {
  const isCurrentValid = await verifyDevPassword(currentPassword);
  if (!isCurrentValid) {
    return { success: false, message: 'Current developer password does not match.' };
  }
  if (!newPassword || String(newPassword).trim().length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long.' };
  }
  const newHash = await hashString(newPassword);
  localStorage.setItem(PASS_HASH_STORAGE_KEY, newHash);
  return { success: true, message: 'Developer entry password updated successfully!' };
}

export function isDevSessionUnlocked() {
  return sessionStorage.getItem(DEV_SESSION_KEY) === 'unlocked_true';
}

export function unlockDevSession() {
  sessionStorage.setItem(DEV_SESSION_KEY, 'unlocked_true');
}

export function lockDevSession() {
  sessionStorage.removeItem(DEV_SESSION_KEY);
}
