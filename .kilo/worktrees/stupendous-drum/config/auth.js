const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(String(password), salt, KEY_LENGTH);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedValue) {
    const stored = String(storedValue || '');
    const parts = stored.split('$');
    if (parts.length === 3 && parts[0] === 'scrypt') {
        const derivedKey = await scrypt(String(password), parts[1], KEY_LENGTH);
        const expected = Buffer.from(parts[2], 'hex');
        return expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey);
    }

    // Existing installations used plaintext passwords. Permit one successful
    // legacy login so the caller can immediately migrate the stored value.
    const candidate = Buffer.from(String(password));
    const expected = Buffer.from(stored);
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function isPasswordHash(value) {
    return String(value || '').startsWith('scrypt$');
}

function createSessionToken() {
    return crypto.randomBytes(48).toString('base64url');
}

module.exports = { hashPassword, verifyPassword, isPasswordHash, createSessionToken };
