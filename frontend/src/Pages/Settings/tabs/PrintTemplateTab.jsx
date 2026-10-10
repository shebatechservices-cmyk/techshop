import React from 'react';
import { useSettings } from '../context/SettingsContext';
import PrintBrandingSection from './print/PrintBrandingSection';
import PrintFormatClauseSection from './print/PrintFormatClauseSection';
import PrintBrandPartnersSection from './print/PrintBrandPartnersSection';
import PrintLivePreviewPanel from './print/PrintLivePreviewPanel';

export default function PrintTemplateTab(props) {
  const context = useSettings();
  const settings = props.settings ?? context.settings;
  const setSettings = props.setSettings ?? context.setSettings;
  const saving = props.saving ?? context.saving;
  const handleSavePrintDesign = props.handleSavePrintDesign ?? context.handleSavePrintDesign;
  const handleGenericImageUpload = props.handleGenericImageUpload ?? context.handleGenericImageUpload;
  const handleBrandLogoFileUpload = props.handleBrandLogoFileUpload ?? context.handleBrandLogoFileUpload;
  const handleMoveBrandLogo = props.handleMoveBrandLogo ?? context.handleMoveBrandLogo;
  const handleAddBrandLogo = props.handleAddBrandLogo ?? context.handleAddBrandLogo;
  const handleUpdateBrandLogo = props.handleUpdateBrandLogo ?? context.handleUpdateBrandLogo;
  const handleRemoveBrandLogo = props.handleRemoveBrandLogo ?? context.handleRemoveBrandLogo;
  const previewMode = props.previewMode ?? context.previewMode;
  const setPreviewMode = props.setPreviewMode ?? context.setPreviewMode;

  return (
    <div className="space-y-5">
      {/* Sub-page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">Print Templates</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🖨️</span> Invoice Design & Print Templates
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure A4/A5 invoices, POS thermal slips, primary/secondary logos, watermarks, brand strips, and policy clauses.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSavePrintDesign}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-1.5"
          >
            <span>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Saving...' : 'Save Print Design'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <PrintBrandingSection
            settings={settings}
            setSettings={setSettings}
            handleGenericImageUpload={handleGenericImageUpload}
          />

          <PrintFormatClauseSection
            settings={settings}
            setSettings={setSettings}
            setPreviewMode={setPreviewMode}
          />

          <PrintBrandPartnersSection
            settings={settings}
            handleAddBrandLogo={handleAddBrandLogo}
            handleMoveBrandLogo={handleMoveBrandLogo}
            handleRemoveBrandLogo={handleRemoveBrandLogo}
            handleBrandLogoFileUpload={handleBrandLogoFileUpload}
            handleUpdateBrandLogo={handleUpdateBrandLogo}
          />
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5">
          <PrintLivePreviewPanel
            settings={settings}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        </div>
      </div>
    </div>
  );
}
