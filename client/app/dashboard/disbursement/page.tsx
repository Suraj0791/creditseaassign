'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/lib/useRoleGuard';

interface Application {
  _id: string;
  fullName: string;
  loanAmount: number;
  tenure: number;
  totalRepayment: number;
  status: string;
  createdAt: string;
  userId: { _id: string; name: string; email: string };
}

export default function DisbursementPage() {
  const { authorized } = useRoleGuard(['admin', 'disbursement']);
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = () => {
    if (!token || !authorized) return;
    setLoading(true);
    api.get<{ applications: Application[] }>('/ops/disbursement', token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, [token, authorized]);

  const totalPayoutValue = useMemo(() => {
    return applications.reduce((acc, a) => acc + (a.loanAmount || 0), 0);
  }, [applications]);

  const handleDisburse = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch('/ops/disbursement/' + id + '/disburse', {}, token!);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium py-16 justify-center">
        <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading disbursement queue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Fund Disbursement Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Sanctioned loans approved by underwriting, awaiting release of capital to borrower bank accounts.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Desk
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Awaiting Disbursement
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{applications.length}</span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              Sanctioned
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Capital to Release
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              ₹{totalPayoutValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Disbursement Channel
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-slate-800">Direct Bank Transfer</span>
            <span className="text-[10px] font-medium text-slate-400">IMPS / NEFT</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium border bg-rose-50 border-rose-200 text-rose-700">
          {error}
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-white shadow-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-teal-50 border border-teal-200 text-teal-700 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-900">All Sanctioned Loans Disbursed</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            There are no pending loans awaiting fund transfer. Approved loans from underwriting will queue here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500 uppercase tracking-wider font-bold" style={{ borderColor: 'var(--border-color)' }}>
                <th className="px-5 py-4">Borrower Identity</th>
                <th className="px-5 py-4">Approved Principal</th>
                <th className="px-5 py-4">Tenure</th>
                <th className="px-5 py-4">Total Obligation</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                        {app.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{app.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{app.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-extrabold text-sm tabular-nums text-slate-900">
                      ₹{app.loanAmount?.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-bold">
                    {app.tenure} days
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-teal-800 tabular-nums">
                    ₹{Math.round(app.totalRepayment || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDisburse(app._id)}
                      disabled={actionLoading === app._id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shadow-xs hover:opacity-90"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {actionLoading === app._id ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Releasing...
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          Mark Disbursed
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
