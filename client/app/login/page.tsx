'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const DEMO_ROLES = [
  { role: 'Admin', email: 'admin@lms.dev', pass: 'Admin@123', badge: 'All Modules' },
  { role: 'Sanction', email: 'sanction@lms.dev', pass: 'Sanction@123', badge: 'Approve/Reject' },
  { role: 'Disbursement', email: 'disburse@lms.dev', pass: 'Disburse@123', badge: 'Payouts' },
  { role: 'Collection', email: 'collect@lms.dev', pass: 'Collect@123', badge: 'Payments & UTR' },
  { role: 'Sales', email: 'sales@lms.dev', pass: 'Sales@123', badge: 'Leads' },
  { role: 'Borrower', email: 'borrower@lms.dev', pass: 'Borrower@123', badge: 'Application' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleQuickSelect = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            LMS Portal Sign In
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in with an executive role or borrower account
          </p>
        </div>

        {/* Quick Role Fill Card */}
        <div
          className="mb-5 p-3.5 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              ⚡ Quick Test Roles (Click to fill):
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>RBAC Demo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {DEMO_ROLES.map((d) => {
              const isSelected = email === d.email;
              return (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleQuickSelect(d.email, d.pass)}
                  className="px-2.5 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer border"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-primary)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <div className="font-semibold truncate">{d.role}</div>
                  <div className="text-[10px] truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {d.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'var(--accent)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
