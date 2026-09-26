export const money = (val) => Number.parseFloat(val || 0) || 0;

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const newTender = (defaultAmount = 0, isAccepted = false) => ({
  id: `${Date.now()}-${Math.random()}`,
  method: 'Cash',
  sub_option: '',
  transaction_id: '',
  receiver_name: '',
  amount: defaultAmount,
  isAccepted,
});
