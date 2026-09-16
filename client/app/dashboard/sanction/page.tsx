'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

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
}

export default function SanctionPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    if (!token) return;
    setLoading(true);
    api.get<{ applications: Application[] }>('/ops/sanction', token)
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [token]);

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

  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading applications...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Sanction — Pending Applications</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Review and approve or reject loan applications.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending applications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app._id}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {app.fullName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    ₹{app.loanAmount?.toLocaleString()} · {app.tenure} days · Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(app._id); }}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: 'var(--success)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRejectId(app._id); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
                  >
                    Reject
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {expandedId === app._id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedId === app._id && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Email</span>
                      <span style={{ color: 'var(--text-primary)' }}>{app.userId?.email}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>PAN</span>
                      <span style={{ color: 'var(--text-primary)' }}>{app.pan}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>DOB</span>
                      <span style={{ color: 'var(--text-primary)' }}>{app.dob}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Monthly Salary</span>
                      <span style={{ color: 'var(--text-primary)' }}>₹{app.monthlySalary?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Employment</span>
                      <span style={{ color: 'var(--text-primary)' }}>{app.employmentMode}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Interest Rate</span>
                      <span style={{ color: 'var(--text-primary)' }}>{app.interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Loan Amount</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₹{app.loanAmount?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Total Repayment</span>
                      <span className="font-medium" style={{ color: 'var(--accent)' }}>₹{app.totalRepayment?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        {applications.length} application{applications.length !== 1 ? 's' : ''} pending
      </p>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-sm mx-4 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Reject Application
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Please provide a reason for rejecting this application.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="flex-1 py-2 rounded-lg text-sm cursor-pointer"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--danger)' }}
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
