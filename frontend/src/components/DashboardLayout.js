'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore.js';
import api from '../services/api.js';
import Link from 'next/link';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarDays,
  UserCheck,
  BrainCircuit,
  Smartphone,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
  Building,
  User,
} from 'lucide-react';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, roles: ['super-admin', 'hospital-admin', 'receptionist', 'doctor'] },
  { name: 'Call Logs', path: '/dashboard/calls', icon: PhoneCall, roles: ['super-admin', 'hospital-admin', 'receptionist'] },
  { name: 'Appointments', path: '/dashboard/appointments', icon: CalendarDays, roles: ['super-admin', 'hospital-admin', 'receptionist', 'doctor'] },
  { name: 'Doctor Roster', path: '/dashboard/doctors', icon: UserCheck, roles: ['super-admin', 'hospital-admin', 'receptionist', 'doctor'] },
  { name: 'Prompt Studio', path: '/dashboard/prompts', icon: BrainCircuit, roles: ['super-admin', 'hospital-admin'] },
  { name: 'Telephony', path: '/dashboard/telephony', icon: Smartphone, roles: ['super-admin', 'hospital-admin'] },
  { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3, roles: ['super-admin', 'hospital-admin', 'receptionist'] },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings, roles: ['super-admin', 'hospital-admin'] },
];

export default function DashboardLayout({ children, clinicNameOverride = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, theme, toggleTheme } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [clinicName, setClinicName] = useState(clinicNameOverride || user?.hospitalName || 'Clinic');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    if (user?.role === 'super-admin') {
      api.get('/hospitals')
        .then((res) => {
          if (!isMounted) return;

          const hospitalList = res.data?.data || [];
          setHospitals(hospitalList);

          const savedTenantId = typeof window !== 'undefined'
            ? localStorage.getItem('activeTenantId')
            : '';
          const nextTenantId = savedTenantId || hospitalList[0]?._id || '';

          setActiveTenant(nextTenantId);
          if (nextTenantId && !savedTenantId && typeof window !== 'undefined') {
            localStorage.setItem('activeTenantId', nextTenantId);
          }
        })
        .catch(() => {
          if (isMounted) setHospitals([]);
        });

      return () => {
        isMounted = false;
      };
    }

    if (clinicNameOverride) {
      setClinicName(clinicNameOverride);
      return () => {
        isMounted = false;
      };
    }

    if (user?.hospitalName) {
      setClinicName(user.hospitalName);
    }

    api.get('/settings')
      .then((res) => {
        const hospital = res.data?.data?.hospital;
        if (isMounted && hospital?.name) {
          setClinicName(hospital.name);
        }

        if (hospital?.name && typeof window !== 'undefined') {
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
      })
      .catch(() => {
        if (isMounted) {
          setClinicName(user?.role === 'super-admin' ? 'Platform Admin' : 'Clinic');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clinicNameOverride, isAuthenticated, user?.hospitalName, user?.role]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading secure receptionist session...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleTenantChange = (tenantId) => {
    setActiveTenant(tenantId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTenantId', tenantId);
      // Reload page to refresh all active queries with new tenant headers
      window.location.reload();
    }
  };

  const userRole = user?.role || 'hospital-admin';
  const allowedNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-card border-r border-border transition-colors duration-300">
        <div className="flex h-16 items-center px-6 border-b border-border gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight premium-gradient-text">ReceptionOS</span>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MOBILE MENUS */}
      <div className="md:hidden">
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex w-64 flex-col bg-card border-r border-border h-full p-4 z-50">
              <div className="flex items-center justify-between h-12 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-md font-bold premium-gradient-text">ReceptionOS</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-md hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {allowedNavItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 mt-auto rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </aside>
          </div>
        )}
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="flex h-16 items-center justify-between px-6 bg-card border-b border-border transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Tenant Selector for Super Admin or Display Clinic Context */}
            {userRole === 'super-admin' ? (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <select
                  value={activeTenant}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="bg-secondary text-foreground text-sm font-semibold rounded-lg border-0 py-1.5 px-3 focus:ring-2 focus:ring-primary"
                >
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
                <span className="hidden sm:inline bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  Super Admin View
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{clinicName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggler */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
                {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-none">{user?.name || 'Staff Account'}</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5 capitalize">{user?.role?.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
