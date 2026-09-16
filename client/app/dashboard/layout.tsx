'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface ModuleItem {
  id: string;
  label: string;
  description: string;
  path: string;
  roles: string[];
  icon: (active: boolean) => React.ReactNode;
}

const modules: ModuleItem[] = [
  {
    id: 'sales',
    label: 'Sales Pipeline',
    description: 'Pre-apply leads queue',
    path: '/dashboard/sales',
    roles: ['admin', 'sales'],
    icon: (active: boolean) => (
      <svg className="w-4 h-4 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    id: 'sanction',
    label: 'Underwriting & Sanction',
    description: 'Credit verification & KYC',
    path: '/dashboard/sanction',
    roles: ['admin', 'sanction'],
    icon: (active: boolean) => (
      <svg className="w-4 h-4 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: 'disbursement',
    label: 'Fund Disbursement',
    description: 'Bank payouts & release',
    path: '/dashboard/disbursement',
    roles: ['admin', 'disbursement'],
    icon: (active: boolean) => (
      <svg className="w-4 h-4 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m19.5 0H21a.75.75 0 01-.75-.75V4.5m0 0A2.25 2.25 0 0018 2.25H6A2.25 2.25 0 003.75 4.5m16.5 0v11.25c0 .621-.504 1.125-1.125 1.125H3.75m16.5 0A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25m16.5 0v-2.25m-16.5 0v-2.25m16.5 0V9.75m-16.5 0V7.5" />
      </svg>
    ),
  },
  {
    id: 'collection',
    label: 'Collection & Recovery',
    description: 'Repayments & UTR ledger',
    path: '/dashboard/collection',
    roles: ['admin', 'collection'],
    icon: (active: boolean) => (
      <svg className="w-4 h-4 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && user.role === 'borrower') {
      router.push('/apply');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2.5 text-sm text-slate-500 font-medium">
          <svg className="animate-spin w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Authenticating workspace...
        </div>
      </div>
    );
  }

  const allowedModules = modules.filter((m) => m.roles.includes(user.role));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside
        className="flex flex-col border-r transition-all duration-200 shrink-0 select-none z-20"
        style={{
          width: sidebarOpen ? '260px' : '68px',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                CS
              </div>
              <div className="leading-tight">
                <span className="text-sm font-bold tracking-tight block text-slate-900">
                  CreditSea
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase block text-teal-700">
                  Ops Dashboard
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              CS
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors text-slate-400 hover:text-slate-600"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Section Label */}
        {sidebarOpen && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations Workflow
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 py-2 px-2.5 space-y-1">
          {allowedModules.map((m) => {
            const active = pathname === m.path;
            return (
              <Link
                key={m.path}
                href={m.path}
                title={!sidebarOpen ? `${m.label} (${m.description})` : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 group ${
                  active ? 'shadow-2xs font-semibold' : 'hover:bg-slate-50 font-medium'
                }`}
                style={{
                  backgroundColor: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                }}
              >
                {/* Active left indicator pill */}
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
                <div style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {m.icon(active)}
                </div>
                {sidebarOpen && (
                  <div className="overflow-hidden min-w-0 flex-1">
                    <span className="truncate block leading-tight">{m.label}</span>
                    <span className="text-[10px] text-slate-400 truncate block font-normal mt-0.5">
                      {m.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Identity & Logout */}
        <div className="border-t p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {sidebarOpen && (
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-xs font-bold truncate leading-tight text-slate-900">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            )}
          </div>

          {sidebarOpen ? (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors bg-white hover:bg-slate-50 text-slate-600 shadow-2xs"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign Out
            </button>
          ) : (
            <button
              onClick={logout}
              className="w-full p-1.5 rounded-lg flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
              title="Sign Out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
