'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const handleRecordPayment = async () => {
    if (!paymentModal || !paymentForm.utrNumber || !paymentForm.amount || !paymentForm.date) return;
    setActionLoading(true);
    try {
      await api.post(
        '/ops/collection/' + paymentModal + '/payment',
        {
          utrNumber: paymentForm.utrNumber,
          amount: Number(paymentForm.amount),
          date: paymentForm.date,
        },
        token!
      );
      setPaymentModal(null);
      setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      setError(err.message);
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
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Collection</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Disbursed loans — record payments and track outstanding balances.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">dismiss</button>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No disbursed loans to collect.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const outstanding = (app.totalRepayment || 0) - (app.totalPaid || 0);
            const paidPercent = app.totalRepayment ? Math.round(((app.totalPaid || 0) / app.totalRepayment) * 100) : 0;

            return (
              <div
                key={app._id}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{app.fullName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.userId?.email}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: paidPercent >= 100 ? 'var(--success-light)' : 'var(--warning-light)',
                      color: paidPercent >= 100 ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {paidPercent}% paid
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Total Repayment</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₹{app.totalRepayment?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Paid</span>
                    <span className="font-medium" style={{ color: 'var(--success)' }}>₹{(app.totalPaid || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Outstanding</span>
                    <span className="font-medium" style={{ color: outstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{outstanding.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(paidPercent, 100)}%`,
                      backgroundColor: paidPercent >= 100 ? 'var(--success)' : 'var(--accent)',
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentModal(app._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Record Payment
                  </button>
                  <button
                    onClick={() => openHistory(app._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    Payment History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        {applications.length} active loan{applications.length !== 1 ? 's' : ''}
      </p>

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-sm mx-4 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Record Payment
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>UTR Number</label>
                <input
                  type="text"
                  value={paymentForm.utrNumber}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, utrNumber: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  placeholder="Enter UTR number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  min={1}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Date</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setPaymentModal(null); setPaymentForm({ utrNumber: '', amount: '', date: new Date().toISOString().split('T')[0] }); }}
                className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={actionLoading || !paymentForm.utrNumber || !paymentForm.amount}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {actionLoading ? 'Recording...' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md mx-4 rounded-xl p-6 max-h-[80vh] overflow-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Payment History
              </h3>
              <button
                onClick={() => { setHistoryModal(null); setPayments([]); }}
                className="text-sm cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between py-3 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ₹{p.amount.toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        UTR: {p.utrNumber} · {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      by {p.recordedBy?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
