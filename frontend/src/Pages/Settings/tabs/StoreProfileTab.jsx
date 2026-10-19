import React from 'react';
import { useSettings } from '../context/SettingsContext';
import StoreProfileHeader from './profile/StoreProfileHeader';
import StoreProfileFields from './profile/StoreProfileFields';
import StoreTaxLegalFields from './profile/StoreTaxLegalFields';
import StoreLogoUploader from './profile/StoreLogoUploader';

export default function StoreProfileTab(props) {
  const context = useSettings();
  const settings = props.settings ?? context.settings;
  const setSettings = props.setSettings ?? context.setSettings;
  const saving = props.saving ?? context.saving;
  const handleResetDummyShop = props.handleResetDummyShop ?? context.handleResetDummyShop;
  const handleSaveSettings = props.handleSaveSettings ?? context.handleSaveSettings;
  const handleLogoUpload = props.handleLogoUpload ?? context.handleLogoUpload;

  return (
    <div className="space-y-5">
      <StoreProfileHeader
        saving={saving}
        handleResetDummyShop={handleResetDummyShop}
        handleSaveSettings={handleSaveSettings}
      />

      {/* Strict 3-Column Responsive CSS Grid Form Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StoreProfileFields
          settings={settings}
          setSettings={setSettings}
        />

        <StoreTaxLegalFields
          settings={settings}
          setSettings={setSettings}
        />

        <StoreLogoUploader
          settings={settings}
          setSettings={setSettings}
          saving={saving}
          handleLogoUpload={handleLogoUpload}
        />
      </div>
    </div>
  );
}
