'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/lib/useRoleGuard';

interface Application {
  _id: string;
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  totalRepayment: number;
  status: string;
  createdAt: string;
  userId: { _id: string; name: string; email: string };
  salarySlipUrl?: string;
}

export default function SanctionPage() {
  const { authorized } = useRoleGuard(['admin', 'sanction']);
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(() => {
    if (!token || !authorized) return;
    setLoading(true);
    api.get<{ applications: Application[] }>('/ops/sanction', token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, authorized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalValueInReview = useMemo(() => {
    return applications.reduce((acc, a) => acc + (a.loanAmount || 0), 0);
  }, [applications]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch('/ops/sanction/' + id + '/approve', {}, token!);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch('/ops/sanction/' + rejectId + '/reject', { reason: rejectReason }, token!);
      setApplications((prev) => prev.filter((a) => a._id !== rejectId));
      setRejectId(null);
      setRejectReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium py-16 justify-center">
        <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading underwriting queue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Underwriting & Sanction Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Review submitted borrower applications, verify KYC details, and execute final approval or rejection.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Awaiting Sanction
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">{applications.length}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              In Review Queue
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Requested Capital Value
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              ₹{totalValueInReview.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Authorized Executives
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              Sanction & Admin Only
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium border bg-rose-50 border-rose-200 text-rose-700">
          {error}
        </div>
      )}

      {/* Queue Listing */}
      {applications.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-white shadow-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-900">Underwriting Queue Clear</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            All submitted applications have been sanctioned or rejected. New applications will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedId === app._id;

            return (
              <div
                key={app._id}
                className="rounded-xl border bg-white shadow-2xs overflow-hidden transition-all"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Card Header Row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 cursor-pointer gap-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : app._id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-teal-50 text-teal-800 border border-teal-100 shrink-0 shadow-2xs">
                      {app.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900 leading-tight">{app.fullName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                          {app.tenure}d Term
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 font-mono">
                        {app.userId?.email} · Applied on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Principal Amount</span>
                      <span className="text-base font-extrabold tabular-nums text-slate-900">
                        ₹{app.loanAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 border-l pl-5" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(app._id);
                        }}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shadow-xs hover:opacity-90"
                        style={{ backgroundColor: 'var(--success)' }}
                      >
                        ✓ Approve
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectId(app._id);
                        }}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition-all border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-xs"
                      >
                        ✕ Reject
                      </button>

                      <div className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-md border border-slate-200 ml-1">
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Underwriting Verification Drawer */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t bg-slate-50 text-xs" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Underwriting Dossier & Borrower KYC
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                        BRE Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">PAN Verification</span>
                        <span className="font-mono font-bold text-slate-900 block">{app.pan}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Monthly Salary</span>
                        <span className="font-bold text-slate-900 block tabular-nums text-sm">
                          ₹{app.monthlySalary?.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Employment Status</span>
                        <span className="font-bold text-slate-900 block capitalize text-sm">
                          {app.employmentMode?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs bg-teal-50/30">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">Total Repayment (SI @ 12%)</span>
                        <span className="font-extrabold text-teal-900 block tabular-nums text-sm">
                          ₹{Math.round(app.totalRepayment || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reject Application
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">
              Enter a mandatory reason for declining this borrower. This reason is logged in the permanent loan audit trail.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Income verification mismatch, unstable employment..."
              className="w-full px-3.5 py-3 rounded-xl text-xs font-medium border border-slate-200 bg-slate-50 resize-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
            />

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
