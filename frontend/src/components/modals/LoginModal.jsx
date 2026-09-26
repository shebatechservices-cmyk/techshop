import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode, serverOnline } = modalState;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 relative">
        {/* Header Branding */}
        <div className="bg-slate-900 px-6 py-5 text-white relative border-b border-slate-800">
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm font-semibold transition-colors focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold tracking-wide text-white m-0 leading-tight">
                Sheba Technology
              </h2>
              <div className="text-xs text-slate-300 font-normal flex items-center gap-2 mt-0.5">
                <span>POS & ERP Management System</span>
                {serverOnline !== null && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${serverOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-amber-950 text-amber-300 border border-amber-700/50'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    {serverOnline ? 'Live' : 'Connecting...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white">
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
  );
}

