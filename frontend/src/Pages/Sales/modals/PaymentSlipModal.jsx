import React, { useRef, useState } from 'react';
import PaymentSlipTopBar from './receipt/PaymentSlipTopBar';
import ThermalReceiptLayout from './receipt/ThermalReceiptLayout';
import VoucherReceiptLayout from './receipt/VoucherReceiptLayout';

export default function PaymentSlipModal({
  isOpen,
  onClose,
  receiptData,
  shopSettings,
}) {
  const [printLayout, setPrintLayout] = useState('thermal'); // 'thermal' | 'a4'
  const printAreaRef = useRef(null);

  if (!isOpen || !receiptData) return null;

  const {
    receipt_no = 'MR-000000',
    payment_date = new Date().toISOString(),
  } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment_date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fadeIn my-auto max-h-[96vh]">
        <PaymentSlipTopBar
          receiptNo={receipt_no}
          printLayout={printLayout}
          setPrintLayout={setPrintLayout}
          onClose={onClose}
        />

        {/* Printable Area */}
        <div
          ref={printAreaRef}
          className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0"
        >
          {printLayout === 'thermal' ? (
            <ThermalReceiptLayout
              receiptData={receiptData}
              shopSettings={shopSettings}
              formattedDate={formattedDate}
            />
          ) : (
            <VoucherReceiptLayout
              receiptData={receiptData}
              shopSettings={shopSettings}
              formattedDate={formattedDate}
            />
          )}
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 shadow-md transition-colors cursor-pointer"
          >
            <span>🖨️</span> Print Slip (প্রিন্ট রশিদ)
          </button>
        </div>
      </div>
    </div>
  );
}
