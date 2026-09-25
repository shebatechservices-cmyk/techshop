export const taka = (val) => `৳${(Number(val) || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDecimal = (val) => (Number(val) || 0).toFixed(2);

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const threeDigits = (n) => `${n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' : ''}` : ''}${n % 100 ? twoDigits(n % 100) : ''}`;

export const numToWords = (num) => {
    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return 'Zero';
    const parts = [];
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));
    return parts.join(' ').replace(/\s+/g, ' ').trim();
};

export const takaInWords = (val) => {
    const amount = Number(val) || 0;
    const takaPart = Math.floor(amount);
    const poisha = Math.round((amount - takaPart) * 100);
    let out = `${numToWords(takaPart)} Taka`;
    if (poisha > 0) out += ` & ${numToWords(poisha)} Poisha`;
    return `${out} Only`;
};

export const formatPrintDateTime = (d = new Date()) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};
