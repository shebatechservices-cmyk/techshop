import React from 'react';
import { useSettings } from '../context/SettingsContext';
import SmsTabHeader from './sms/SmsTabHeader';
import SmsKpiMetrics from './sms/SmsKpiMetrics';
import SmsGatewayProvidersSection from './sms/SmsGatewayProvidersSection';
import SmsTriggerCard from './sms/SmsTriggerCard';
import SmsLogsTable from './sms/SmsLogsTable';

export default function SmsModuleTab(props) {
  const context = useSettings();
  const settings = props.settings ?? context.settings;
  const savingTriggers = props.savingTriggers ?? context.savingTriggers;
  const handleSaveSmsTriggers = props.handleSaveSmsTriggers ?? context.handleSaveSmsTriggers;
  const smsProviders = props.smsProviders ?? context.smsProviders;
  const smsBalance = props.smsBalance ?? context.smsBalance;
  const handleCheckLiveBalance = props.handleCheckLiveBalance ?? context.handleCheckLiveBalance;
  const handleSetActiveProvider = props.handleSetActiveProvider ?? context.handleSetActiveProvider;
  const handleDeleteProvider = props.handleDeleteProvider ?? context.handleDeleteProvider;
  const setProviderModal = props.setProviderModal ?? context.setProviderModal;
  const setTestSmsModal = props.setTestSmsModal ?? context.setTestSmsModal;
  const setBulkSmsModal = props.setBulkSmsModal ?? context.setBulkSmsModal;
  const smsCategoryFilter = props.smsCategoryFilter ?? context.smsCategoryFilter;
  const setSmsCategoryFilter = props.setSmsCategoryFilter ?? context.setSmsCategoryFilter;
  const filteredTriggers = props.filteredTriggers ?? context.filteredTriggers;
  const activeTriggersCount = props.activeTriggersCount ?? context.activeTriggersCount;
  const smsTriggers = props.smsTriggers ?? context.smsTriggers;
  const handleToggleSmsTrigger = props.handleToggleSmsTrigger ?? context.handleToggleSmsTrigger;
  const handleTemplateChange = props.handleTemplateChange ?? context.handleTemplateChange;
  const handleInsertToken = props.handleInsertToken ?? context.handleInsertToken;
  const handleOpenSamplePreview = props.handleOpenSamplePreview ?? context.handleOpenSamplePreview;
  const smsLogs = props.smsLogs ?? context.smsLogs;

  const categories = [
    'All',
    'Sales & POS',
    'Purchases & Stock',
    'Customer Credit',
    'Projects & Servicing',
    'Accounts & Wallets',
    'Security & Auth',
  ];

  return (
    <div className="space-y-6">
      <SmsTabHeader
        settings={settings}
        smsProviders={smsProviders}
        savingTriggers={savingTriggers}
        handleSaveSmsTriggers={handleSaveSmsTriggers}
        setProviderModal={setProviderModal}
        setTestSmsModal={setTestSmsModal}
        setBulkSmsModal={setBulkSmsModal}
      />

      <SmsKpiMetrics
        smsProviders={smsProviders}
        smsBalance={smsBalance}
        handleCheckLiveBalance={handleCheckLiveBalance}
        activeTriggersCount={activeTriggersCount}
        smsTriggers={smsTriggers}
        settings={settings}
      />

      <SmsGatewayProvidersSection
        smsProviders={smsProviders}
        setProviderModal={setProviderModal}
        handleDeleteProvider={handleDeleteProvider}
        handleCheckLiveBalance={handleCheckLiveBalance}
        setTestSmsModal={setTestSmsModal}
        settings={settings}
        handleSetActiveProvider={handleSetActiveProvider}
      />

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSmsCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                smsCategoryFilter === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredTriggers.length}</strong> event triggers
        </span>
      </div>

      {/* Event Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTriggers.map((trig) => (
          <SmsTriggerCard
            key={trig.trigger_key}
            trig={trig}
            onToggle={handleToggleSmsTrigger}
            onTemplateChange={handleTemplateChange}
            onInsertToken={handleInsertToken}
            onOpenSamplePreview={handleOpenSamplePreview}
          />
        ))}
      </div>

      <SmsLogsTable smsLogs={smsLogs} />
    </div>
  );
}
