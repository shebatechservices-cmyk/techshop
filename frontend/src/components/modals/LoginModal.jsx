import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode, serverOnline } = modalState;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans min-h-screen">
      {/* Enterprise Split-Screen Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-black/60 border border-slate-800/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] animate-fadeIn relative">
        
        {/* LEFT COLUMN: Enterprise Branding & Showcase (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle Ambient Glowing Orbs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Block */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
                  Sheba Technology
                </h1>
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5 mb-0">
                  Enterprise ERP &amp; Cloud POS
                </p>
              </div>
            </div>

            {/* Showcase Headlines & Features (Hidden on extra small devices to save scroll height) */}
            <div className="hidden sm:block mt-8 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Smart Enterprise Suite
              </div>
              <ul className="space-y-3.5 m-0 p-0 list-none">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 m-0">Real-Time POS &amp; Billing</h4>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5">High-speed barcode checkout with multi-tender payment processing.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 m-0">Serial &amp; Warranty Tracking</h4>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5">Granular item-level serial codes and warranty lifecycle management.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 m-0">Ledgers &amp; Financial Analytics</h4>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5">Automated customer, supplier, and expense ledger reconciliations.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Info: Live Server & Verified Hotline */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80">
            {serverOnline !== null && (
              <div className="mb-3.5">
                <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                  serverOnline 
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{serverOnline ? 'Live Cloud Connected' : 'Connecting to Server...'}</span>
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row lg:flex-col justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">📞</span>
                <span>Official Hotline:</span>
                <a href="tel:01722578860" className="text-white hover:text-emerald-400 font-bold tracking-wider">
                  01722578860
                </a>
              </div>
              <div className="text-[11px] text-slate-500">
                © 2026 Sheba Technology BD • Enterprise v16.9
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean White Login Portal (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative">
          {/* Close button for account switch / modal mode */}
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Form Header */}
          <div className="mb-6">
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 mb-2">
              Secure ERP Gateway
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
              {mode === 'login' ? 'Sign In to Your Account' : 'Password Recovery'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 mb-0">
              {mode === 'login' 
                ? 'Enter your credentials to access your store management workspace.' 
                : 'Enter your registered phone number or email to receive reset instructions.'}
            </p>
          </div>

          {/* Main Auth Form Area */}
          <div className="flex-1 flex flex-col justify-center">
            {mode === 'login' && (
              <LoginForm
                {...modalState}
                onOpenDevConsole={onOpenDevConsole}
              />
            )}

            {mode === 'forgot_password' && (
              <ForgotPasswordForm
                {...modalState}
              />
            )}
          </div>

          {/* Bottom Security Assurance */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>256-Bit SSL Encrypted Session</span>
            </span>
            <span>Sheba Cloud POS</span>
          </div>
        </div>

      </div>
    </div>
  );
}
