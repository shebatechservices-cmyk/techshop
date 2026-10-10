import React from 'react';

export default function TechResponseModal({
  project,
  onClose,
  techResponseNote,
  setTechResponseNote,
  onRespond,
}) {
  if (!project) return null;

  const totalCompensation =
    Number(project.setup_charge || 0) +
    Number(project.conveyance_cost || 0) +
    Number(project.meal_allowance || 0);

  const isAlreadyAccepted =
    project.technician_status === 'accepted' ||
    project.technician_status === 'in_progress' ||
    project.status === 'in_progress' ||
    project.status === 'awaiting_incharge_confirmation';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <span>{isAlreadyAccepted ? '⚠️' : '📲'}</span>
          <span>{isAlreadyAccepted ? 'Request Job Rejection (বাতিলের আবেদন)' : 'Technician Job Assignment'}</span>
        </h3>

        {isAlreadyAccepted && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs font-medium mb-3">
            ⚠️ <strong>বিজ্ঞপ্তি:</strong> এই কাজটি আপনি ইতোমধ্যেই গ্রহণ করেছেন। অপারগতার কারণে কাজটি বাতিল করতে হলে সুস্পষ্ট কারণ লিখে শপ এডমিনের কাছে আবেদন পাঠান। এডমিন অনুমোদন দিলে আপনাকে কাজ থেকে রিলিজ করা হবে।
          </div>
        )}

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 text-xs space-y-1">
          <div>
            <span className="text-slate-500">Project / Task:</span>{' '}
            <strong className="text-slate-900">{project.title}</strong>
          </div>
          <div>
            <span className="text-slate-500">Site Address:</span>{' '}
            <strong className="text-slate-900">{project.site_address || 'Not specified'}</strong>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-blue-600 font-bold">
            Compensation: Setup ৳{project.setup_charge} + Conveyance ৳{project.conveyance_cost} + Meal ৳{project.meal_allowance} = ৳{totalCompensation.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {isAlreadyAccepted ? 'বাতিলের কারণ / Reason for Rejection (Required):' : 'Technician Reply / Notes (Optional):'}
          </label>
          <input
            type="text"
            placeholder={isAlreadyAccepted ? "e.g. জরুরী পারিবারিক সমস্যা বা অসুস্থতার কারণে যেতে পারছি না..." : "e.g. Will arrive at site tomorrow at 10 AM..."}
            value={techResponseNote}
            onChange={(e) => setTechResponseNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {isAlreadyAccepted ? (
            <button
              type="button"
              disabled={!techResponseNote.trim()}
              onClick={() => onRespond('request_rejection')}
              className="px-4 py-2 rounded-lg bg-rose-600 disabled:bg-rose-300 text-white text-xs font-bold hover:bg-rose-700 shadow-sm transition-colors cursor-pointer"
            >
              ⚠️ Submit Rejection Request (আবেদন পাঠান)
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onRespond('decline')}
                className="px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onRespond('accept')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
              >
                ✓ Accept Job
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
