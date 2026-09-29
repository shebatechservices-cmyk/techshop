import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessRestricted({
  title = 'Access Restricted',
  message = 'The Session & Security section is strictly reserved for Admin and Super Admin accounts.',
  returnTo = 'shop',
  returnLabel = 'Return to Store Profile'
}) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm my-6 max-w-md mx-auto">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-5">
        {message}
      </p>
      <Link
        to={returnTo}
        className="no-underline px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm inline-block"
      >
        {returnLabel}
      </Link>
    </div>
  );
}
