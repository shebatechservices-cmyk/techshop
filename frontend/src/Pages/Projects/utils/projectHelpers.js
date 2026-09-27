/**
 * projectHelpers.js
 * Pure utility functions and constants for Projects and Work Orders.
 */

export const SERVICE_PRESETS = [
  { name: 'CCTV Camera Setup', rate: 350 },
  { name: 'Router Configuration', rate: 300 },
  { name: 'ONU Setup & Fiber Splicing', rate: 250 },
  { name: 'WiFi Access Point Setup', rate: 400 },
  { name: 'TV / Display Mounting', rate: 500 },
  { name: 'General Troubleshooting', rate: 500 }
];

export const JOB_TYPES = [
  { value: 'CCTV Installation', label: 'CCTV Installation (New Camera Setup)' },
  { value: 'Repair & Servicing', label: 'Repair & Servicing (Troubleshooting)' },
  { value: 'Networking Setup', label: 'Networking & WiFi Setup' },
  { value: 'Maintenance Visit', label: 'Maintenance Visit (Routine Check)' },
  { value: 'Multi-Task Service', label: 'Multi-Task Service (Router/ONU/TV/CCTV)' }
];

/**
 * Normalizes a raw phone string into an 11-digit Bangladeshi phone number (starting with 0).
 * @param {string} rawPhone 
 * @returns {string} Clean 11-digit phone or empty string
 */
export function cleanSitePhone(rawPhone) {
  if (!rawPhone) return '';
  let cleanDigits = String(rawPhone).replace(/\D/g, '');
  if (cleanDigits.startsWith('880')) {
    cleanDigits = '0' + cleanDigits.slice(3);
  } else if (cleanDigits.startsWith('88')) {
    cleanDigits = cleanDigits.slice(2);
  }
  if (cleanDigits.length > 11) {
    cleanDigits = cleanDigits.slice(-11);
  }
  return cleanDigits;
}

/**
 * Validates Bangladeshi 11-digit phone number.
 * @param {string} digits 
 * @returns {boolean}
 */
export function isValidBangladeshiPhone(digits) {
  if (!digits) return true; // Optional field or empty
  return digits.length === 11 && digits.startsWith('0');
}

/**
 * Converts 11-digit phone to E.164 with +88 prefix.
 * @param {string} digits 
 * @returns {string}
 */
export function formatToE164Phone(digits) {
  const clean = cleanSitePhone(digits);
  return clean ? `+88${clean}` : '';
}

/**
 * Calculates sum of dynamic service task line totals derived dynamically by summing (qty * rate).
 * @param {Array<{ quantity: number|string, unit_rate: number|string, line_total?: number }>} services 
 * @returns {number}
 */
export function calculateServicesTotal(services = []) {
  if (!Array.isArray(services)) return 0;
  return services.reduce((acc, s) => {
    const qty = parseFloat(s.quantity) || 0;
    const rate = parseFloat(s.unit_rate) || 0;
    return acc + (qty * rate);
  }, 0);
}

/**
 * Calculates total quantity of devices/tasks in the service list.
 * @param {Array<{ quantity: number|string }>} services 
 * @returns {number}
 */
export function calculateTotalDeviceCount(services = []) {
  if (!Array.isArray(services)) return 0;
  return services.reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0);
}

/**
 * Calculates total technician payout (Services Total + Conveyance + Meal Allowance) with strict numeric type conversion.
 * @param {number|string} totalSetupFee 
 * @param {number|string} conveyance 
 * @param {number|string} mealAllowance 
 * @returns {number}
 */
export function calculateTotalTechnicianPayout(totalSetupFee = 0, conveyance = 0, mealAllowance = 0) {
  const fee = parseFloat(totalSetupFee) || 0;
  const conv = parseFloat(conveyance) || 0;
  const meal = parseFloat(mealAllowance) || 0;
  return fee + conv + meal;
}
