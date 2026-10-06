import React from 'react';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending', icon: '⏳', desc: 'Order received, awaiting review' },
  { key: 'processing', label: 'Processing', icon: '📦', desc: 'Items being picked & packed' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'Handed to courier for delivery' },
  { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Delivered to customer' },
];

export default function OrderFulfillmentStepper({
  currentStatus,
  currentStepIdx,
  isCancelled,
  updatingStatus,
  onStatusChange,
}) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 mb-4 shadow-xs">
      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide mb-3">
        Fulfillment Timeline &amp; Status Stepper
      </div>

      {isCancelled ? (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
            <span>🚫</span> This order has been cancelled and its inventory stock restored.
          </div>
          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            disabled={updatingStatus}
            className="px-3 py-1.5 bg-white border border-red-500 hover:bg-red-50 text-red-600 rounded-md text-xs font-bold cursor-pointer transition-colors"
          >
            Reopen Order
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between relative">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div
                key={step.key}
                className="flex-1 flex flex-col items-center relative z-10"
              >
                <button
                  type="button"
                  onClick={() => onStatusChange(step.key)}
                  disabled={updatingStatus}
                  title={`Change to ${step.label}`}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer transition-all ${
                    isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                  } ${isCurrent ? 'ring-4 ring-teal-200 border-2 border-teal-300 shadow-sm' : ''}`}
                >
                  {step.icon}
                </button>
                <span
                  className={`text-xs mt-1.5 ${
                    isCurrent
                      ? 'font-extrabold text-slate-900'
                      : isDone
                      ? 'font-bold text-slate-700'
                      : 'font-medium text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!isCancelled && (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={() => onStatusChange('cancelled')}
            disabled={updatingStatus}
            className="text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer underline transition-colors"
          >
            Cancel Order &amp; Restock Products
          </button>
        </div>
      )}
    </div>
  );
}
