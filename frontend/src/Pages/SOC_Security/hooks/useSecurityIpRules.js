import { useState } from 'react';
import API from '../../../services/api';
import { DEFAULT_IP_RULES } from '../utils/securityConstants';

export function useSecurityIpRules({ showToast }) {
  const [ipRules, setIpRules] = useState(DEFAULT_IP_RULES);
  const [isAddIpOpen, setIsAddIpOpen] = useState(false);
  const [newIpRule, setNewIpRule] = useState({
    ip_address: '',
    rule_type: 'block',
    reason: '',
  });

  // Create IP Rule
  const handleCreateIpRule = async (e) => {
    e.preventDefault();
    try {
      const createdRule = {
        id: Date.now(),
        ...newIpRule,
        blocked_attempts: 0,
      };
      setIpRules((prev) => [createdRule, ...prev]);
      showToast(`IP rule for ${newIpRule.ip_address} added to ${newIpRule.rule_type.toUpperCase()}!`);
      setIsAddIpOpen(false);
      const payload = { ...newIpRule };
      setNewIpRule({ ip_address: '', rule_type: 'block', reason: '' });

      await fetch(`${API}/security/ip-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete IP Rule
  const handleDeleteIpRule = async (id) => {
    if (!window.confirm('Delete this firewall rule?')) return;
    setIpRules((prev) => prev.filter((r) => r.id !== id));
    showToast('Firewall rule deleted.');
    try {
      await fetch(`${API}/security/ip-rules/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  return {
    ipRules,
    setIpRules,
    isAddIpOpen,
    setIsAddIpOpen,
    newIpRule,
    setNewIpRule,
    handleCreateIpRule,
    handleDeleteIpRule,
  };
}
