'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/dashboard/sales');
    } else if (user.role === 'sales') {
      router.push('/dashboard/sales');
    } else if (user.role === 'sanction') {
      router.push('/dashboard/sanction');
    } else if (user.role === 'disbursement') {
      router.push('/dashboard/disbursement');
    } else if (user.role === 'collection') {
      router.push('/dashboard/collection');
    } else {
      router.push('/apply');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: 'var(--text-secondary)' }}>Redirecting...</p>
    </div>
  );
}
