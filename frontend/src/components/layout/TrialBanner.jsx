import React, { useState } from 'react';

export default function TrialBanner({
  licenseLoading = false,
  isTrial = false,
  hasCommercialLicense = false,
  isLicenseValid = true,
  isLicenseBlocked = false,
  trialDaysRemaining,
  trialEndDate,
  onActivate,
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (
    licenseLoading ||
    !isTrial ||
    hasCommercialLicense ||
    !isLicenseValid ||
    isLicenseBlocked ||
    isDismissed
  ) {
    return null;
  }

  return (
    <div className="w-full mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-2">
        <span className="text-base">⏳</span>
        <span>
          <strong className="font-bold">Trial Active: {trialDaysRemaining} day(s) remaining</strong>
          <span className="hidden sm:inline text-amber-800 ml-1.5 font-normal">
            (Full ERP features unlocked until {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : '15 days'})
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onActivate && (
          <button
            type="button"
            onClick={onActivate}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
          >
            Activate License
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-amber-700 hover:text-amber-900 text-sm font-bold px-1.5 py-0.5 rounded cursor-pointer"
          title="Dismiss for this session"
          aria-label="Dismiss trial banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
