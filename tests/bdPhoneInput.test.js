function extractBDDigits(val) {
  if (!val) return '';
  let str = String(val).replace(/\D/g, '');
  if (str.startsWith('880')) {
    str = str.slice(3);
  } else if (str.startsWith('0')) {
    str = str.slice(1);
  }
  return str.slice(0, 10);
}

function formatBDDigits(digits) {
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}`;
}

function toCleanBDPhone(digits) {
  if (!digits) return '';
  return `0${digits}`;
}

function formatFullBDPhone(val) {
  const digits = extractBDDigits(val);
  if (!digits) return '';
  return `+880 ${formatBDDigits(digits)}`;
}

function isValidBDPhone(val) {
  const digits = extractBDDigits(val);
  return digits.length === 10 && /^1[3-9]\d{8}$/.test(digits);
}

describe('BDPhoneInput Utility & Validation Logic', () => {
  test('1. extractBDDigits should strip country code, leading 0, and non-numeric chars to max 10 digits', () => {
    expect(extractBDDigits('01712345678')).toBe('1712345678');
    expect(extractBDDigits('+8801712345678')).toBe('1712345678');
    expect(extractBDDigits('+880 17-12345678')).toBe('1712345678');
    expect(extractBDDigits('8801712345678')).toBe('1712345678');
    expect(extractBDDigits('1712345678')).toBe('1712345678');
    expect(extractBDDigits('abc018abc12345678xyz')).toBe('1812345678');
    expect(extractBDDigits('0191234567899999')).toBe('1912345678'); // Capped at 10 digits
    expect(extractBDDigits('')).toBe('');
    expect(extractBDDigits(null)).toBe('');
    expect(extractBDDigits(undefined)).toBe('');
  });

  test('2. formatBDDigits should format 10 digits as 1X-XXXXXXXX', () => {
    expect(formatBDDigits('17')).toBe('17');
    expect(formatBDDigits('1712345678')).toBe('17-12345678');
    expect(formatBDDigits('1855')).toBe('18-55');
    expect(formatBDDigits('')).toBe('');
  });

  test('3. toCleanBDPhone should format 10 digits as standardized 11-digit string 01XXXXXXXXX', () => {
    expect(toCleanBDPhone('1712345678')).toBe('01712345678');
    expect(toCleanBDPhone('1800000000')).toBe('01800000000');
    expect(toCleanBDPhone('')).toBe('');
  });

  test('4. formatFullBDPhone should format as +880 1X-XXXXXXXX', () => {
    expect(formatFullBDPhone('01712345678')).toBe('+880 17-12345678');
    expect(formatFullBDPhone('+880 18-11223344')).toBe('+880 18-11223344');
    expect(formatFullBDPhone('')).toBe('');
  });

  test('5. isValidBDPhone should validate 10 digits after +880 with valid BD prefixes (13-19)', () => {
    expect(isValidBDPhone('01712345678')).toBe(true);
    expect(isValidBDPhone('01812345678')).toBe(true);
    expect(isValidBDPhone('01312345678')).toBe(true);
    expect(isValidBDPhone('01412345678')).toBe(true);
    expect(isValidBDPhone('01512345678')).toBe(true);
    expect(isValidBDPhone('01612345678')).toBe(true);
    expect(isValidBDPhone('01912345678')).toBe(true);

    // Invalid lengths or prefixes
    expect(isValidBDPhone('017123456')).toBe(false); // only 9 digits
    expect(isValidBDPhone('01212345678')).toBe(false); // invalid BD prefix '12'
    expect(isValidBDPhone('01112345678')).toBe(false); // invalid BD prefix '11'
    expect(isValidBDPhone('')).toBe(false);
  });
});
