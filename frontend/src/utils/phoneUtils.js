/**
 * Normalizes any raw phone input to exactly the 10 digits after +880.
 * E.g.: "01712345678" -> "1712345678"
 *       "+8801712345678" -> "1712345678"
 *       "+880 17-12345678" -> "1712345678"
 *       "8801712345678" -> "1712345678"
 *       "1712345678" -> "1712345678"
 */
export function extractBDDigits(val) {
  if (!val) return '';
  let str = String(val).replace(/\D/g, ''); // remove all non-digits
  if (str.startsWith('880')) {
    str = str.slice(3);
  } else if (str.startsWith('0')) {
    str = str.slice(1);
  }
  return str.slice(0, 10);
}

/**
 * Formats 10 digits into "1X-XXXXXXXX"
 */
export function formatBDDigits(digits) {
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}`;
}

/**
 * Standardizes 10 digits into clean 11-digit string for backend storage: "01XXXXXXXXX"
 */
export function toCleanBDPhone(digits) {
  if (!digits) return '';
  return `0${digits}`;
}

/**
 * Full visual formatter: "+880 1X-XXXXXXXX"
 */
export function formatFullBDPhone(val) {
  const digits = extractBDDigits(val);
  if (!digits) return '';
  return `+880 ${formatBDDigits(digits)}`;
}

/**
 * Validates whether a given phone string has exactly 10 valid digits after BD code (+880 1XXXXXXXXX)
 */
export function isValidBDPhone(val) {
  const digits = extractBDDigits(val);
  return digits.length === 10 && /^1[3-9]\d{8}$/.test(digits);
}
