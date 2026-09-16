'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRoleGuard } from '@/lib/useRoleGuard';

interface Application {
  _id: string;
  fullName: string;
  loanAmount: number;
  totalRepayment: number;
  totalPaid: number;
  status: string;
  userId: { _id: string; name: string; email: string };
}

interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  date: string;
  recordedBy: { name: string };
}

export default function CollectionPage() {
  const { authorized } = useRoleGuard(['admin', 'collection']);
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    utrNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(() => {
    if (!token || !authorized) return;
    setLoading(true);
    api.get<{ applications: Application[] }>('/ops/collection', token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, authorized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI Portfolio Metrics
  const { totalCollected, totalOutstanding, activeCount, closedCount } = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    let active = 0;
    let closed = 0;

    for (const app of applications) {
      const rem = Math.max(0, (app.totalRepayment || 0) - (app.totalPaid || 0));
      collected += app.totalPaid || 0;
      if (app.status === 'closed' || rem <= 1) {
        closed++;
      } else {
        outstanding += rem;
        active++;
      }
    }

    return {
      totalCollected: Math.round(collected),
      totalOutstanding: Math.round(outstanding),
      activeCount: active,
      closedCount: closed,
    };
  }, [applications]);

  const handleRecordPayment = async () => {
    if (!paymentModal || !paymentForm.utrNumber || !paymentForm.amount || !paymentForm.date) return;
    
    const utr = paymentForm.utrNumber.trim().toUpperCase();
    if (!utr.startsWith('UTR') || utr.length < 10) {
      setModalError('UTR must start with "UTR" and be at least 10 characters long.');
      return;
    }

    const selectedApp = applications.find(a => a._id === paymentModal);
    const outstanding = selectedApp ? (selectedApp.totalRepayment || 0) - (selectedApp.totalPaid || 0) : 0;
    
    if (Number(paymentForm.amount) > outstanding + 1) {
      setModalError(`Payment amount cannot exceed outstanding balance of ₹${Math.round(outstanding).toLocaleString('en-IN')}`);
      return;
    }

    setActionLoading(true);
    setModalError('');
    try {
      await api.post(
        '/ops/collection/' + paymentModal + '/payment',
        {
          utrNumber: utr,
          amount: Number(paymentForm.amount),
          date: paymentForm.date,
        },
        token!
      );
      setPaymentModal(null);
      setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openHistory = async (id: string) => {
    setHistoryModal(id);
    setHistoryLoading(true);
    try {
      const data = await api.get<{ payments: Payment[] }>('/ops/collection/' + id + '/payments', token!);
      setPayments(data.payments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium py-16 justify-center">
        <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading recovery ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Collection & Repayment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Track active disbursed loans, record verified borrower repayments via UTR, and monitor automated settlement.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh Ledger
        </button>
      </div>

      {/* KPI Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Capital Recovered
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-emerald-700">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Outstanding Portfolio
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-xl border bg-white shadow-2xs" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Portfolio Health
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-xs">
              {closedCount} Settled & Closed
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-xs font-medium border bg-rose-50 border-rose-200 text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-[10px] font-bold uppercase tracking-wider underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Loans Grid */}
      {applications.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-white shadow-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m19.5 0H21a.75.75 0 01-.75-.75V4.5m0 0A2.25 2.25 0 0018 2.25H6A2.25 2.25 0 003.75 4.5m16.5 0v11.25c0 .621-.504 1.125-1.125 1.125H3.75m16.5 0A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25m16.5 0v-2.25m-16.5 0v-2.25m16.5 0V9.75m-16.5 0V7.5" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-900">No Active Portfolio</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Once loans are disbursed successfully, they will appear here for payment recording and balance tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {applications.map((app) => {
            const rawOutstanding = (app.totalRepayment || 0) - (app.totalPaid || 0);
            const isClosed = app.status === 'closed' || rawOutstanding <= 1;
            const outstanding = isClosed ? 0 : Math.max(0, Math.round(rawOutstanding * 100) / 100);
            const paidPercent = isClosed
              ? 100
              : app.totalRepayment
              ? Math.min(100, Math.round(((app.totalPaid || 0) / app.totalRepayment) * 100))
              : 0;

            return (
              <div
                key={app._id}
                className={`rounded-2xl p-5 border shadow-2xs transition-all ${isClosed ? 'bg-slate-50/50 opacity-80 grayscale-[20%]' : 'bg-white'}`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-800 shrink-0 border border-slate-200">
                      {app.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{app.fullName}</p>
                      <p className="text-[10px] font-semibold text-slate-500 font-mono mt-0.5">{app.userId?.email}</p>
                    </div>
                  </div>

                  <span
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-xs border"
                    style={{
                      backgroundColor: isClosed ? 'var(--success-light)' : 'var(--warning-light)',
                      color: isClosed ? 'var(--success)' : 'var(--warning)',
                      borderColor: isClosed ? 'var(--success-border)' : 'var(--warning-border)'
                    }}
                  >
                    {isClosed ? (
                      <>✓ Zero Balance Settled</>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
                        {paidPercent}% Paid
                      </>
                    )}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs shadow-2xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Due</span>
                    <span className="text-sm font-bold tabular-nums text-slate-900 block">
                      ₹{Math.round(app.totalRepayment || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Recovered</span>
                    <span className="text-sm font-extrabold tabular-nums text-emerald-700 block">
                      ₹{Math.round(app.totalPaid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Outstanding</span>
                    <span
                      className="text-sm font-extrabold tabular-nums block"
                      style={{ color: isClosed ? 'var(--success)' : 'var(--danger)' }}
                    >
                      ₹{outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full mb-5 bg-slate-100 overflow-hidden shadow-inner border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${paidPercent}%`,
                      backgroundColor: isClosed ? 'var(--success)' : 'var(--accent)',
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                  {!isClosed ? (
                    <button
                      type="button"
                      onClick={() => {
                        setModalError('');
                        setPaymentModal(app._id);
                        setPaymentForm((p) => ({ ...p, amount: String(outstanding) }));
                      }}
                      className="inline-flex items-center justify-center flex-1 gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white cursor-pointer transition-all shadow-xs hover:opacity-90"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Record Payment
                    </button>
                  ) : (
                    <div className="flex-1 flex justify-center py-2 px-3 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Auto-Closed
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => openHistory(app._id)}
                    className="inline-flex items-center justify-center flex-1 gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Payment History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Record Repayment Ledger
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">
              Enter bank transaction reference (UTR) and the verified payment amount received.
            </p>

            {modalError && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-bold border bg-rose-50 border-rose-200 text-rose-700 leading-relaxed">
                {modalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Unique Transaction Ref (UTR)
                </label>
                <input
                  type="text"
                  value={paymentForm.utrNumber}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, utrNumber: e.target.value.toUpperCase() }))}
                  placeholder="e.g. UTR9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase border border-slate-200 bg-slate-50 transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
                <span className="text-[10px] font-medium text-slate-400 mt-1 block">Prevents duplicate accounting</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                  min={1}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold tabular-nums border border-slate-200 bg-slate-50 transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                type="button"
                onClick={() => {
                  setPaymentModal(null);
                  setModalError('');
                  setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().split('T')[0] });
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={actionLoading || !paymentForm.utrNumber.trim() || !paymentForm.amount}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shadow-2xs hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {actionLoading ? 'Recording...' : 'Update Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Payment Ledger
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">Audit trail of verified payments</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryModal(null);
                  setPayments([]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto pr-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 text-xs font-medium text-slate-500">
                  <svg className="animate-spin w-4 h-4 text-teal-700 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Loading ledger entries...
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-800">No Transactions Found</p>
                  <p className="text-[11px] font-medium mt-1 text-slate-500">No payments have been recorded for this loan yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between transition-all hover:border-slate-300"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold tabular-nums text-sm text-slate-900">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Verified
                          </span>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] font-medium">
                          UTR: {p.utrNumber} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Logged By</span>
                        <span className="font-bold text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{p.recordedBy?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
