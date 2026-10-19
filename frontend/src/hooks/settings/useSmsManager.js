import { useSmsSettingsState } from './useSmsSettingsState';
import { useSmsTriggersOps } from './sms/useSmsTriggersOps';
import { useSmsProviderOps } from './sms/useSmsProviderOps';
import { useSmsMessagingOps } from './sms/useSmsMessagingOps';

export function useSmsManager({ API, settings, showToast, loadSettingsData }) {
  const smsState = useSmsSettingsState();
  const {
    smsProviders,
    setSmsProviders,
    smsBalance,
    setSmsBalance,
    providerModal,
    setProviderModal,
    smsTriggers,
    setSmsTriggers,
    smsCategoryFilter,
    testSmsModal,
    setTestSmsModal,
    bulkSmsModal,
    setBulkSmsModal,
    setSavingTriggers,
    setSamplePreviewModal,
  } = smsState;

  const triggersOps = useSmsTriggersOps({
    API,
    settings,
    showToast,
    smsTriggers,
    setSmsTriggers,
    smsCategoryFilter,
    setSavingTriggers,
    setSamplePreviewModal,
  });

  const providerOps = useSmsProviderOps({
    API,
    showToast,
    loadSettingsData,
    setSmsProviders,
    setSmsBalance,
    providerModal,
    setProviderModal,
  });

  const messagingOps = useSmsMessagingOps({
    API,
    settings,
    showToast,
    loadSettingsData,
    testSmsModal,
    setTestSmsModal,
    bulkSmsModal,
    setBulkSmsModal,
  });

  return {
    ...smsState,
    ...triggersOps,
    ...providerOps,
    ...messagingOps,
  };
}

export default useSmsManager;
