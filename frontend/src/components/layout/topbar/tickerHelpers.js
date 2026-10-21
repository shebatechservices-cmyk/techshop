export const defaultTickerItem = {
  badgeText: '🔥 লাইভ ফিড',
  title: 'স্বাগতম সেবা টেকনোলজি ইআরপিতে!',
  message: 'কাস্টমার ও টেকনিশিয়ানদের জন্য সক্রিয় অফার এবং রিয়েল-টাইম নোটিফিকেশন এখানে প্রদর্শিত হবে।',
  priority: 'info',
};

export const getTickerRank = (item) => {
  if (item.type === 'offer_technician') return 1;
  if (item.type === 'offer_customer') return 2;
  if (item.priority === 'urgent') return 3;
  if (item.type === 'project') return 4;
  if (item.type === 'wallet') return 5;
  if (item.type === 'payout') return 6;
  if (item.type === 'stock') return 7;
  if (item.type === 'due') return 8;
  if (item.type === 'sales') return 9;
  if (item.type === 'purchase') return 10;
  return 11;
};

export const getTickerBadgeStyle = (item) => {
  if (item.type === 'offer_customer') {
    return {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: '#ffffff',
      border: '1px solid #fb923c',
      boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)',
    };
  }
  if (item.type === 'offer_technician') {
    return {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      color: '#ffffff',
      border: '1px solid #a78bfa',
      boxShadow: '0 0 8px rgba(139, 92, 246, 0.4)',
    };
  }
  if (item.priority === 'urgent' || item.type === 'stock') {
    return {
      background: '#dc2626',
      color: '#ffffff',
      border: '1px solid #ef4444',
    };
  }
  if (item.type === 'sales') {
    return {
      background: '#16a34a',
      color: '#ffffff',
      border: '1px solid #22c55e',
    };
  }
  if (item.type === 'purchase') {
    return {
      background: '#2563eb',
      color: '#ffffff',
      border: '1px solid #3b82f6',
    };
  }
  if (item.type === 'due') {
    return {
      background: '#e11d48',
      color: '#ffffff',
      border: '1px solid #f43f5e',
    };
  }
  return {
    background: '#0284c7',
    color: '#ffffff',
    border: '1px solid #38bdf8',
  };
};
