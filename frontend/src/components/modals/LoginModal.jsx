import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode, serverOnline } = modalState;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Main Container Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800/40 relative">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white relative border-b border-slate-700/50">
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-all focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 flex-shrink-0 border border-emerald-400/30">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight text-white m-0 leading-tight">
                Sheba Technology
              </h2>
              <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
                <span>POS & ERP Management System</span>
                {serverOnline !== null && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${serverOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {serverOnline ? 'Cloud Live' : 'Connecting...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-7 bg-white">
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
