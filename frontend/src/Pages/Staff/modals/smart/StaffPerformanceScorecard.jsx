import React, { useEffect, useState } from 'react';
import { smartFetch } from '../../../../services/api';

export default function StaffPerformanceScorecard({ staff = {} }) {
  const [smartData, setSmartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!staff?.id) return;
    let isMounted = true;
    setLoading(true);

    smartFetch(`/party/profile?type=staff&id=${staff.id}`)
      .then(async (res) => {
        if (isMounted && res && res.ok) {
          const json = await res.json();
          if (json.success) {
            setSmartData(json.data?.smart || null);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [staff?.id]);

  const monthSales = smartData?.month_sales || {};
  const projects = smartData?.projects || {};
  const monthVol = parseFloat(monthSales.month_sales_volume || 0);
  const monthCount = parseInt(monthSales.month_sales_count || 0, 10);
  const completionRate = projects.completion_rate ?? 100;

  const phone = String(staff.phone || '').trim();
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const bdPhone = cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? `88${cleanPhone}`
    : cleanPhone;

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 border border-indigo-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎯</span>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Monthly Performance & KPI
          </h4>
        </div>
        {loading && <span className="text-[10px] text-indigo-600 font-semibold animate-pulse">Calculating KPI...</span>}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-white/90 border border-indigo-50 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
            This Month Sales
          </span>
          <div className="text-sm font-black text-indigo-700">
            ৳ {monthVol.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{monthCount} orders completed</span>
        </div>

        <div className="bg-white/90 border border-indigo-50 p-2.5 rounded-xl shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
            Service / Project Rate
          </span>
          <div className="text-sm font-black text-emerald-700">
            {completionRate}% Complete
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {projects.completed_projects || 0} done / {projects.ongoing_projects || 0} active
          </span>
        </div>
      </div>

      {/* Staff Smart Quick Contact Bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-indigo-50 flex-wrap text-xs">
        {bdPhone && (
          <a
            href={`https://wa.me/${bdPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-[11px]"
          >
            <span>💬</span> WhatsApp
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg transition-colors text-[11px]"
          >
            <span>📞</span> Call
          </a>
        )}
      </div>
    </div>
  );
}
