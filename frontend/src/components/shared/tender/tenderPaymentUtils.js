export const money = (val) => Number.parseFloat(val || 0) || 0;

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const getMethodIcon = (type, name) => {
  const t = String(type || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (t === 'cash' || n === 'cash' || t === 'drawer') return '💵';
  if (t === 'bank' || n.includes('bank')) return '🏦';
  if (t === 'wallet' || n.includes('wallet')) return '👛';
  if (
    t === 'mobile_banking' ||
    t === 'mfs' ||
    n.includes('bkash') ||
    n.includes('nagad') ||
    n.includes('rocket') ||
    n.includes('mfs') ||
    n.includes('cellfin') ||
    n.includes('upay')
  ) {
    return '📱';
  }
  if (t === 'card' || n.includes('card') || n.includes('pos')) return '💳';
  return '💳';
};

export const getMethodType = (methodName, effectivePaymentMethods = []) => {
  const found = effectivePaymentMethods.find(
    (pm) =>
      (pm.account_name || pm.name || pm.method_name || '').toLowerCase() ===
      String(methodName || '').toLowerCase()
  );
  if (found && (found.account_type || found.type)) {
    return (found.account_type || found.type).toLowerCase();
  }
  const m = String(methodName || '').toLowerCase();
  if (m === 'wallet') return 'wallet';
  if (m.includes('bank')) return 'bank';
  if (
    m.includes('bkash') ||
    m.includes('nagad') ||
    m.includes('rocket') ||
    m.includes('mfs') ||
    m.includes('mobile')
  ) {
    return 'mobile_banking';
  }
  if (m.includes('card')) return 'card';
  return 'cash';
};

export const getAccountOptions = ({
  method,
  effectivePaymentMethods = [],
  bankAccounts = [],
  mfsAccounts = [],
  cashAccounts = [],
  isPurchase = false,
  walletAccountLabel = '',
}) => {
  const type = getMethodType(method, effectivePaymentMethods);
  switch (type) {
    case 'bank':
      return bankAccounts.length > 0 ? bankAccounts : ['Bank Account'];
    case 'mobile_banking':
    case 'mfs':
      return mfsAccounts.length > 0 ? mfsAccounts : ['Mobile Banking Account'];
    case 'wallet': {
      const defLabel = isPurchase
        ? walletAccountLabel || 'Supplier Wallet'
        : walletAccountLabel || 'Customer Wallet';
      return [defLabel];
    }
    case 'cash':
    default:
      return cashAccounts.length > 0 ? cashAccounts : ['Cash Drawer'];
  }
};

export const accountLabel = (a) =>
  a.name + (a.account_number ? ` (${a.account_number})` : '');

export const getAccountBalance = ({
  method,
  subOption,
  effectivePaymentMethods = [],
  walletBalance = 0,
  bankAccounts = [],
  mfsAccounts = [],
  cashAccounts = [],
  isPurchase = false,
  walletAccountLabel = '',
  allAccounts = [],
}) => {
  if (
    String(method).toLowerCase() === 'wallet' ||
    getMethodType(method, effectivePaymentMethods) === 'wallet'
  ) {
    return money(walletBalance);
  }
  const defaultAccounts = getAccountOptions({
    method,
    effectivePaymentMethods,
    bankAccounts,
    mfsAccounts,
    cashAccounts,
    isPurchase,
    walletAccountLabel,
  });
  const effectiveSub =
    (defaultAccounts.includes(subOption) ? subOption : defaultAccounts[0]) || '';
  const match = (allAccounts || []).find((a) => {
    const label = accountLabel(a);
    return label === effectiveSub || a.name === effectiveSub;
  });
  if (match && match.balance !== undefined && match.balance !== null) {
    return money(match.balance);
  }
  return 0;
};
