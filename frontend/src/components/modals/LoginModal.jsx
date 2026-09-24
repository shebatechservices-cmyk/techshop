import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import StaffSignupForm from '../shared/auth/StaffSignupForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode, serverOnline } = modalState;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 relative animate-fadeIn">
        {/* Header Branding */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 pb-5 text-white relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors"
            >
              ✕
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/40 flex-shrink-0">
              🏪
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Sheba Technology
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>POS & ERP Management System</span>
                {serverOnline !== null && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${serverOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ● {serverOnline ? 'Cloud Live' : 'Connecting...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {mode === 'login' && (
            <LoginForm
              {...modalState}
            />
          )}

          {mode === 'staff_signup' && (
            <StaffSignupForm
              {...modalState}
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
