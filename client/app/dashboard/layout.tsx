'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const moduleConfig: Record<string, { label: string; path: string; roles: string[] }> = {
  sales: { label: 'Sales', path: '/dashboard/sales', roles: ['admin', 'sales'] },
  sanction: { label: 'Sanction', path: '/dashboard/sanction', roles: ['admin', 'sanction'] },
  disbursement: { label: 'Disbursement', path: '/dashboard/disbursement', roles: ['admin', 'disbursement'] },
  collection: { label: 'Collection', path: '/dashboard/collection', roles: ['admin', 'collection'] },
};

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
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const allowedModules = Object.values(moduleConfig).filter(
    (m) => m.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <aside
        className="flex flex-col border-r transition-all duration-200"
        style={{
          width: sidebarOpen ? '240px' : '64px',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {sidebarOpen && (
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              LMS Dashboard
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-gray-100 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="flex-1 py-2">
          {allowedModules.map((m) => {
            const active = pathname === m.path;
            return (
              <Link
                key={m.path}
                href={m.path}
                className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {sidebarOpen ? m.label : m.label.charAt(0)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {user.role}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              className="w-full py-2 rounded-lg text-xs cursor-pointer transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
