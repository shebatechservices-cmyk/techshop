import React from 'react';
import { useLoginModalState } from '../hooks/useLoginModalState';
import LoginForm from '../shared/auth/LoginForm';
import ForgotPasswordForm from '../shared/auth/ForgotPasswordForm';
import Login2FaForm from '../shared/auth/Login2FaForm';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose, onOpenDevConsole }) {
  const modalState = useLoginModalState({ onLoginSuccess });

  if (!isOpen) return null;

  const { mode } = modalState;
  const isPage = !canClose;

  return (
    <div className={isPage 
      ? "min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 font-sans" 
      : "fixed inset-0 z-[99999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans min-h-screen"
    }>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 relative animate-fadeIn">
        {/* Close Button when applicable */}
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Clean Header: Welcome to Sheba Technology / Shop management System */}
        {mode === 'login' && (
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
              Welcome to Sheba Technology
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 mb-0">
              Shop management System
            </p>
          </div>
        )}

        {/* Dynamic Form Body */}
        <div>
          {mode === 'login' && (
            <LoginForm
              {...modalState}
              onOpenDevConsole={onOpenDevConsole}
            />
          )}

          {mode === 'two_factor' && (
            <Login2FaForm
              maskedEmail={modalState.maskedEmail}
              simulatedCode={modalState.simulatedCode}
              otpCode={modalState.otpCode}
              setOtpCode={modalState.setOtpCode}
              verifyingOtp={modalState.verifyingOtp}
              verifyError={modalState.verifyError}
              approvalNotice={modalState.approvalNotice}
              onVerify={modalState.handleVerifyOtp}
              onCancel={modalState.handleCancel2Fa}
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
