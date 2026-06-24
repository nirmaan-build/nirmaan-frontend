'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser } from './cookies';
import type { User } from './types';

/**
 * Client-side gate for CSR pages (Truck/Profile/RFQ): redirect to /login when
 * signed out, and to /onboarding when the profile is incomplete (PRD-03 §4.6).
 * Pass requireComplete=false on the onboarding page itself.
 */
export function useAuthGuard(requireComplete = true): {
  ready: boolean;
  user: User | null;
} {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser();
    if (requireComplete && u && !u.profileComplete) {
      router.replace('/onboarding');
      return;
    }
    setUser(u);
    setReady(true);
  }, [router, requireComplete]);

  return { ready, user };
}
