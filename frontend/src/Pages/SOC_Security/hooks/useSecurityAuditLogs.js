import { useState, useMemo } from 'react';
import { DEFAULT_LOGS } from '../utils/securityConstants';

export function useSecurityAuditLogs() {
  const [logs, setLogs] = useState(DEFAULT_LOGS);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [inspectEvent, setInspectEvent] = useState(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const sev = (log.severity || 'INFO').toUpperCase();
      if (severityFilter !== 'ALL' && sev !== severityFilter) return false;

      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchAct = String(log.action || '').toLowerCase().includes(q);
        const matchIp = String(log.ip_address || '').toLowerCase().includes(q);
        const matchTbl = String(log.target_table || '').toLowerCase().includes(q);
        const matchDev = String(log.device_id || '').toLowerCase().includes(q);
        const matchUser = String(log.user_name || '').toLowerCase().includes(q);
        if (!matchAct && !matchIp && !matchTbl && !matchDev && !matchUser) return false;
      }
      return true;
    });
  }, [logs, severityFilter, auditSearch]);

  return {
    logs,
    setLogs,
    severityFilter,
    setSeverityFilter,
    auditSearch,
    setAuditSearch,
    inspectEvent,
    setInspectEvent,
    filteredLogs,
  };
}
