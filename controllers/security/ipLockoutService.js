/**
 * IP Lockout Service: Tracks failed login attempts per IP address
 * and enforces temporary lockdown to defend against brute-force attacks.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes observation window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockdown duration
const MAX_ATTEMPTS = 5; // 5 failed attempts threshold

// In-memory store: Map<ip, { attempts: number, firstAttemptAt: number, lockedUntil: number | null }>
const ipStore = new Map();

function isLoopback(ip) {
    if (!ip) return false;
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function cleanIp(rawIp) {
    if (!rawIp) return '127.0.0.1';
    return String(rawIp).split(',')[0].trim();
}

/**
 * Checks if the given IP is currently locked out.
 */
function isIpLocked(rawIp) {
    const ip = cleanIp(rawIp);
    if (isLoopback(ip)) return { isLocked: false, remainingMinutes: 0, attempts: 0 };

    const record = ipStore.get(ip);
    if (!record) return { isLocked: false, remainingMinutes: 0, attempts: 0 };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
        const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
        return { isLocked: true, remainingMinutes, attempts: record.attempts };
    }

    // Lock has expired or window has elapsed
    if (record.lockedUntil && record.lockedUntil <= now) {
        ipStore.delete(ip);
        return { isLocked: false, remainingMinutes: 0, attempts: 0 };
    }

    if (now - record.firstAttemptAt > WINDOW_MS) {
        ipStore.delete(ip);
        return { isLocked: false, remainingMinutes: 0, attempts: 0 };
    }

    return { isLocked: false, remainingMinutes: 0, attempts: record.attempts };
}

/**
 * Records a failed password attempt from the given IP.
 */
function recordFailedAttempt(rawIp) {
    const ip = cleanIp(rawIp);
    if (isLoopback(ip)) return { attempts: 1, isLocked: false, remainingMinutes: 0 };

    const now = Date.now();
    let record = ipStore.get(ip);

    if (!record || (now - record.firstAttemptAt > WINDOW_MS && !record.lockedUntil)) {
        record = { attempts: 1, firstAttemptAt: now, lockedUntil: null };
    } else {
        record.attempts += 1;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_MS;
        ipStore.set(ip, record);
        const remainingMinutes = Math.ceil(LOCKOUT_MS / 60000);
        return { attempts: record.attempts, isLocked: true, remainingMinutes };
    }

    ipStore.set(ip, record);
    return { attempts: record.attempts, isLocked: false, remainingMinutes: 0 };
}

/**
 * Resets failed attempts count for an IP on successful login.
 */
function resetIpAttempts(rawIp) {
    const ip = cleanIp(rawIp);
    ipStore.delete(ip);
}

module.exports = {
    isIpLocked,
    recordFailedAttempt,
    resetIpAttempts,
    MAX_ATTEMPTS,
    LOCKOUT_MS,
};
