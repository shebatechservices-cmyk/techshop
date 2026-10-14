export const money = (val) => Number.parseFloat(val || 0) || 0;

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const COURIER_PRESETS = [
  { label: 'Steadfast Courier (Inside Dhaka - ৳80)', name: 'Steadfast Courier', charge: 80 },
  { label: 'Steadfast Courier (Outside Dhaka - ৳150)', name: 'Steadfast Courier', charge: 150 },
  { label: 'Pathao Courier (Express - ৳120)', name: 'Pathao Courier', charge: 120 },
  { label: 'Sundarban Courier (৳150)', name: 'Sundarban Courier', charge: 150 },
  { label: 'RedX Delivery (৳130)', name: 'RedX Delivery', charge: 130 },
  { label: 'Free Delivery (৳0)', name: 'In-house Delivery', charge: 0 },
];
