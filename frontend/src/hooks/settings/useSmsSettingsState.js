import { useState } from 'react';
import {
  DEFAULT_SMS_TRIGGERS,
  DEFAULT_SMS_LOGS,
} from '../../utils/settingsConstants';

export function useSmsSettingsState() {
  const [smsProviders, setSmsProviders] = useState([]);
  const [smsBalance, setSmsBalance] = useState({ loading: false, balance: null, raw: null, error: null, checkedAt: null });
  const [providerModal, setProviderModal] = useState({
    open: false,
    mode: 'create',
    data: {
      provider_name: '',
      provider_code: 'greenweb',
      api_url: 'http://api.greenweb.com.bd/api.php',
      http_method: 'GET',
      auth_type: 'param',
      api_key: '',
      api_secret: '',
      sender_id: '',
      param_phone_key: 'to',
      param_message_key: 'message',
      param_sender_key: 'sender_id',
      param_api_key: 'token',
      balance_endpoint: 'http://api.greenweb.com.bd/gurecomm/credit.php',
      is_active: false
    }
  });
  const [smsTriggers, setSmsTriggers] = useState(DEFAULT_SMS_TRIGGERS);
  const [smsLogs, setSmsLogs] = useState(DEFAULT_SMS_LOGS);
  const [smsCategoryFilter, setSmsCategoryFilter] = useState('All');
  const [showApiKey, setShowApiKey] = useState(false);
  const [samplePreviewModal, setSamplePreviewModal] = useState({ open: false, title: '', text: '' });
  const [testSmsModal, setTestSmsModal] = useState({ open: false, phone: '', message: '', sending: false, result: null });
  const [bulkSmsModal, setBulkSmsModal] = useState({ open: false, targetGroup: 'due_customers', customNumbers: '', message: '', sending: false, result: null });
  const [savingTriggers, setSavingTriggers] = useState(false);

  return {
    smsProviders,
    setSmsProviders,
    smsBalance,
    setSmsBalance,
    providerModal,
    setProviderModal,
    smsTriggers,
    setSmsTriggers,
    smsLogs,
    setSmsLogs,
    smsCategoryFilter,
    setSmsCategoryFilter,
    showApiKey,
    setShowApiKey,
    samplePreviewModal,
    setSamplePreviewModal,
    testSmsModal,
    setTestSmsModal,
    bulkSmsModal,
    setBulkSmsModal,
    savingTriggers,
    setSavingTriggers,
  };
}
