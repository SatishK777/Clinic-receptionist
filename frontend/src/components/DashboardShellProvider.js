'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

const DashboardShellContext = createContext(null);

export function DashboardShellProvider({ children, clinicNameOverride = '' }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const userRole = user?.role || 'hospital-admin';
  const isSuperAdmin = userRole === 'super-admin';

  const hospitalsQuery = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const res = await api.get('/hospitals');
      return res.data.data || [];
    },
    enabled: isAuthenticated && isSuperAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    enabled: isAuthenticated && !isSuperAdmin && !clinicNameOverride,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hospitals = useMemo(() => hospitalsQuery.data || [], [hospitalsQuery.data]);
  const activeTenantId = useMemo(() => {
    if (!isSuperAdmin) {
      return '';
    }

    if (!hospitals.length) {
      return '';
    }

    const savedTenantId = typeof window !== 'undefined'
      ? localStorage.getItem('activeTenantId')
      : '';
    const savedTenantIsValid = hospitals.some((hospital) => hospital._id === savedTenantId);
    return savedTenantIsValid ? savedTenantId : hospitals[0]?._id || '';
  }, [hospitals, isSuperAdmin]);

  const bootstrapReady = !isAuthenticated
    ? false
    : !isSuperAdmin || hospitalsQuery.isSuccess || hospitalsQuery.isError;

  useEffect(() => {
    if (!isAuthenticated) return;

    const hospital = settingsQuery.data?.hospital;
    if (hospital?.name) {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const nextUser = {
            ...JSON.parse(storedUser),
            hospitalName: hospital.name,
            hospitalSubdomain: hospital.subdomain,
          };
          localStorage.setItem('user', JSON.stringify(nextUser));
        }
      }
    }
  }, [isAuthenticated, settingsQuery.data]);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin) return;

    if (typeof window === 'undefined') return;
    if (activeTenantId) {
      localStorage.setItem('activeTenantId', activeTenantId);
      return;
    }

    localStorage.removeItem('activeTenantId');
  }, [activeTenantId, isAuthenticated, isSuperAdmin]);

  const clinicName = clinicNameOverride
    || (isSuperAdmin
      ? 'Platform Admin'
      : settingsQuery.data?.hospital?.name
        || user?.hospitalName
        || 'Clinic');

  const value = useMemo(
    () => ({
      userRole,
      isSuperAdmin,
      activeTenantId,
      clinicName,
      hospitals,
      bootstrapReady,
      hospitalsLoading: hospitalsQuery.isLoading,
      settingsLoading: settingsQuery.isLoading,
    }),
    [
      userRole,
      isSuperAdmin,
      activeTenantId,
      clinicName,
      hospitals,
      bootstrapReady,
      hospitalsQuery.isLoading,
      settingsQuery.isLoading,
    ]
  );

  return (
    <DashboardShellContext.Provider value={value}>
      {children}
    </DashboardShellContext.Provider>
  );
}

export function useDashboardShell() {
  const context = useContext(DashboardShellContext);
  if (!context) {
    throw new Error('useDashboardShell must be used within DashboardShellProvider');
  }
  return context;
}
