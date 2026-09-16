'use client';

import { useAuth } from './auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useRoleGuard(allowedRoles: string[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const rolesKey = allowedRoles.slice().sort().join(',');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    setAuthorized(true);
  }, [user, loading, router, rolesKey]);

  return { authorized, loading };
}
