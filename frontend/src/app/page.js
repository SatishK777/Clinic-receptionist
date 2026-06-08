'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore.js';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase animate-pulse">
          Routing ReceptionOS Connection...
        </p>
      </div>
    </div>
  );
}
