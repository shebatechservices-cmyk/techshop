import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode, serverOnline } = modalState;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.18),rgba(15,23,42,0.98))] flex flex-col justify-between items-center p-4 sm:p-6 text-slate-800 font-sans min-h-screen">
      {/* Top Brand Bar / Empty Spacer for Perfect Centering */}
      <div className="w-full flex justify-between items-center max-w-5xl py-2 px-4 opacity-90">
        <div className="flex items-center gap-2 text-white/80 font-bold text-xs tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Sheba ERP Suite</span>
        </div>
        <div className="text-slate-400 text-xs hidden sm:block">
          Need Support? <a href="tel:01758309271" className="text-emerald-400 hover:underline font-semibold">01758309271</a>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md my-auto animate-fadeIn py-6">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/50 border border-slate-100/80 overflow-hidden relative">
          {/* Header Branding */}
          <div className="pt-8 pb-6 px-6 sm:px-8 text-center bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100 relative">
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold transition-colors focus:outline-none"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Brand Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 mx-auto mb-3.5 border-2 border-white">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
              Sheba Technology
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1 mb-0">
              POS &amp; ERP Management System
            </p>

            {serverOnline !== null && (
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-0.5 rounded-full ${
                  serverOnline 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{serverOnline ? 'Live Cloud Connected' : 'Connecting to Server...'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 bg-white">
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
        </div>
      </div>

      {/* Page Footer */}
      <div className="py-4 text-center text-xs text-slate-400 font-medium">
        <p className="m-0">© 2026 Sheba Technology BD • All Rights Reserved</p>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-0">Enterprise Cloud POS &amp; ERP Management Platform</p>
      </div>
    </div>
  );
}
