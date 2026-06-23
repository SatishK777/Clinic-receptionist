'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';

export default function AuthBootstrap() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}
