export const getQuotationBadgeStyle = (status) => {
  switch (status) {
    case 'approved':
      return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
    case 'ordered':
      return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' };
    case 'rejected':
      return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
    case 'pending':
      return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    default:
      return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
  }
};
