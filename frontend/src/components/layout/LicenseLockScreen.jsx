import React, { useState } from 'react';
import { licenseAuthService } from '../../services/licenseAuthService';

export default function LicenseLockScreen({ licenseInfo, onReactivated }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSuspended = licenseInfo?.status === 'suspended' || licenseInfo?.status === 'Blocked';
  const isTrial = licenseInfo?.is_trial === true;
  const isTrialExpired = isTrial && licenseInfo?.isExpired;
  const isExpired = licenseInfo?.status === 'expired' || licenseInfo?.status === 'Expired' || isTrialExpired;

  const handleActivate = async (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMsg('Please enter a valid Redemption Code or License Key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await licenseAuthService.redeemCode(cleanKey);
      if (result.success) {
        setSuccessMsg(result.message || 'License successfully reactivated! Reloading system...');
        setTimeout(() => {
          if (onReactivated) onReactivated();
          else window.location.reload();
        }, 1200);
      } else {
        setErrorMsg(result.message || result.error || 'Failed to redeem code. Please check the code and try again.');
      }
    } catch (err) {
      setErrorMsg(`Network Error: ${err.message || 'Failed to connect to licensing server.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#1e1b4b] z-[9999999] flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans">
      <div className="bg-slate-900/95 border border-red-500/40 shadow-2xl rounded-2xl w-full max-w-lg p-6 sm:p-8 text-center backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Status Lock Icon */}
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-500/15 border-2 border-red-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-red-500/20">
          {isTrialExpired ? '⏳' : '🔒'}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
          {isTrialExpired
            ? '15-Day Free Trial Expired'
            : isSuspended
            ? 'Software Access Suspended'
            : 'Software License Expired'}
        </h2>

        {/* Description Message */}
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
          {licenseInfo?.vendor_message ||
            (isTrialExpired
              ? 'Your 15-day evaluation period has concluded. To continue using Sheba Technology ERP without interruption, please enter your purchased License Key.'
              : isSuspended
              ? 'This software installation has been locked by the vendor. To restore service, please contact vendor customer support or provide a renewed license key.'
              : 'Your commercial subscription period has ended. Please enter a valid renewal key below or contact your vendor.')}
        </p>

        {/* System Diagnostic Information */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-left mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Client Identifier:</span>
            <span className="text-sky-400 font-mono font-bold">
              {licenseInfo?.client_app_id || 'CLIENT-SHEBA-TECH-8801'}
            </span>
          </div>
          {isTrial && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trial Period:</span>
              <span className="text-amber-400 font-medium">15 Days (Completed)</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Host Domain:</span>
            <span className="text-slate-300 font-mono">{licenseInfo?.domain_name || window.location.hostname}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Application Version:</span>
            <span className="text-slate-300 font-semibold">v{licenseInfo?.current_version || '16.9.26'}</span>
          </div>
        </div>

        {/* License Activation Form */}
        <form onSubmit={handleActivate} className="text-left mb-5">
          <label className="block text-xs font-bold text-slate-200 mb-2">
            Enter Purchased License Key / Activation Code:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. SHEBA-ENT-2026-XXXX-PRO"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Activate'}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-xs mb-4 text-left flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 text-emerald-200 text-xs mb-4 text-left flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Footer Support Info */}
        <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          Vendor Support: <strong className="text-slate-400">support@shebatech.com.bd</strong> • Hotline: <strong className="text-slate-400">+880 1722-578860</strong>
        </div>
      </div>
    </div>
  );
}
