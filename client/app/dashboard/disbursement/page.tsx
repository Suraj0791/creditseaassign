'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!token || !authorized) return;
    setLoading(true);
    api.get<{ applications: Application[] }>('/ops/disbursement', token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, authorized]);

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
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Disbursement</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Sanctioned loans awaiting fund disbursement.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No loans pending disbursement.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Borrower</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Loan Amount</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Tenure</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Total Repayment</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{app.fullName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{app.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>₹{app.loanAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{app.tenure} days</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent)' }}>₹{app.totalRepayment?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDisburse(app._id)}
                      disabled={actionLoading === app._id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {actionLoading === app._id ? 'Processing...' : 'Mark Disbursed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        {applications.length} loan{applications.length !== 1 ? 's' : ''} pending disbursement
      </p>
    </div>
  );
}
