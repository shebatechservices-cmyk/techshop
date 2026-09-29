import React from 'react';

export default function ExpensesHeader({
  setIsManageCategoriesOpen = () => {},
  setIsAddExpenseOpen = () => {}
}) {
  return (
    <div className="flex justify-between items-center mb-2.5 gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-base font-extrabold text-slate-900">
          Expenses & Operating Overheads
        </span>
        <span className="text-[0.7rem] font-extrabold py-0.5 px-2 rounded-full bg-red-100 text-red-700 uppercase">
          CASH OUTFLOW
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsManageCategoriesOpen(true)}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md py-1.5 px-3 text-xs font-bold cursor-pointer flex items-center gap-1.25 transition-colors shadow-xs"
        >
          <span>⚙️</span>
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-md py-1.5 px-3.5 text-xs font-bold cursor-pointer flex items-center gap-1.25 shadow-xs transition-colors"
        >
          <span>+</span>
          <span>Record Expense</span>
        </button>
      </div>
    </div>
  );
}
