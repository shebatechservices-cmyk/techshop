export const money = (val) => Number.parseFloat(val || 0) || 0;

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
