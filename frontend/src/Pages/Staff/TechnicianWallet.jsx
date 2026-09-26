import React, { useState, useEffect, useCallback } from "react";
import API from "../../services/api";

export default function TechnicianWallet({ currentUser }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects"); // "projects" | "ledger"
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const userId = currentUser?.id || 1;

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/staff/wallet/${userId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWalletData(json.data);
        }
      } else {
        showToast("Failed to load wallet data", "error");
      }
    } catch (err) {
      console.error("Error fetching technician wallet:", err);
      showToast("Server error occurred", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const summary = walletData?.summary || {
    walletBalance: currentUser?.wallet_balance || 0,
    totalEarnedCommission: 0,
    totalProjects: 0,
    completedProjects: 0,
    ongoingProjects: 0
  };

  const projects = walletData?.projects || [];
  const transactions = walletData?.transactions || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === "error"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          <span>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-3xl font-bold shadow-inner flex-shrink-0">
              👛
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {currentUser?.name || "Technician Portal"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  FIELD TECHNICIAN
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {currentUser?.phone || currentUser?.email || "Technician ID: #" + userId} • Personal Earnings, Task Commissions & Wallet Statement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchWallet}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-2"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>Refresh Balance</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Available Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg shadow-emerald-700/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Available Wallet Balance
            </span>
            <span className="text-xl">💰</span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight">
              ৳{parseFloat(summary.walletBalance || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1">
              Ready for cash payout / withdrawal
            </p>
          </div>
        </div>

        {/* Total Earned Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Project Earnings</span>
            <span className="text-lg">🛠️</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ৳{parseFloat(summary.totalEarnedCommission || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Lifetime commission & allowances
            </p>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Completed Tasks</span>
            <span className="text-lg">✅</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              {summary.completedProjects || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Finished service & installation jobs
            </p>
          </div>
        </div>

        {/* Ongoing Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Ongoing Tasks</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">
              {summary.ongoingProjects || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently assigned service calls
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === "projects"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🛠️</span>
            <span>Assigned Projects & Tasks ({projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === "ledger"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📜</span>
            <span>Wallet History & Payouts ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Projects List */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                📋
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Assigned Projects Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                When the Shop Admin assigns you CCTV or service tasks, they will appear here with your commission breakdown.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const totalComm = (parseFloat(proj.charges) || 0) + (parseFloat(proj.conveyance_cost) || 0) + (parseFloat(proj.meal_allowance) || 0);
                const isDone = proj.status === "completed" || proj.technician_status === "completed" || proj.admin_confirmed;
                return (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {proj.project_code || "PROJ-" + proj.id}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {isDone ? "✓ Completed" : "⏳ In Progress"}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mb-1">{proj.title}</h4>
                      {proj.customer_name && (
                        <p className="text-xs text-slate-600 mb-2">
                          👤 Customer: <span className="font-semibold">{proj.customer_name}</span> {proj.customer_phone ? `(${proj.customer_phone})` : ""}
                        </p>
                      )}
                      {proj.site_address && (
                        <p className="text-[11px] text-slate-500 mb-3 flex items-start gap-1">
                          <span>📍</span>
                          <span>{proj.site_address}</span>
                        </p>
                      )}

                      {/* Earnings Breakdown */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Service Charge:</span>
                          <span className="font-semibold text-slate-800">৳{parseFloat(proj.charges || 0).toLocaleString()}</span>
                        </div>
                        {parseFloat(proj.conveyance_cost || 0) > 0 && (
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Conveyance Allowance:</span>
                            <span className="font-semibold text-slate-800">৳{parseFloat(proj.conveyance_cost || 0).toLocaleString()}</span>
                          </div>
                        )}
                        {parseFloat(proj.meal_allowance || 0) > 0 && (
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Meal Allowance:</span>
                            <span className="font-semibold text-slate-800">৳{parseFloat(proj.meal_allowance || 0).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                          <span>Your Total Commission:</span>
                          <span>৳{totalComm.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                      <span>Date: {proj.start_date ? new Date(proj.start_date).toLocaleDateString("en-GB") : "N/A"}</span>
                      {proj.admin_confirmed && (
                        <span className="text-emerald-600 font-semibold">🔒 Admin Approved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Wallet Transaction Ledger */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📜</span>
              <span>No recorded wallet transactions or payouts yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description / Reference</th>
                    <th className="py-3 px-4 text-right">Amount (৳)</th>
                    <th className="py-3 px-4 text-right">Balance After (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isCredit = tx.credit === true;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-500">
                          #TX-{tx.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCredit ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}>
                            {isCredit ? "+ Credit / Commission" : "- Payout / Debit"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {tx.note || tx.reference || "Wallet Adjustment"}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                          {isCredit ? "+" : "-"}৳{parseFloat(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ৳{parseFloat(tx.balance_after || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
