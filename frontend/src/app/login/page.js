'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Activity, ArrowRight, ShieldCheck, Mail, Lock, Building, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading, initAuth } = useAuthStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration States
  const [hospitalName, setHospitalName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      if (!hospitalName || !subdomain || !adminName || !email || !password) {
        setErrorMsg('Please populate all fields');
        return;
      }
      const res = await register({ hospitalName, subdomain, adminName, email, password });
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message);
      }
    } else {
      if (!email || !password) {
        setErrorMsg('Please populate email and password');
        return;
      }
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleDemoSignIn = async (demoEmail, demoPassword) => {
    setErrorMsg('');
    const res = await login(demoEmail, demoPassword);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 glow-indigo">
            <Activity className="h-6 w-6 text-primary-foreground pulse-glow" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            {isRegister ? 'Onboard your clinic' : 'Sign in to ReceptionOS'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister ? 'Get started with AI front-desk operations' : 'AI voice operating system for clinics & hospitals'}
          </p>
        </div>

        {/* MOCK DEMO CREDENTIALS ACCORDION */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-primary uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Quick Demo Accounts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoSignIn('admin@metrohealth.com', 'password123')}
              className="flex flex-col text-left p-2.5 rounded-lg border border-border bg-secondary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              <span className="font-bold text-foreground">Hospital Admin</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">admin@metrohealth.com / password123</span>
            </button>
            <button
              onClick={() => handleDemoSignIn('superadmin@receptionist.ai', 'admin123')}
              className="flex flex-col text-left p-2.5 rounded-lg border border-border bg-secondary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              <span className="font-bold text-foreground">Super Admin (Platform)</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">superadmin@receptionist.ai / admin123</span>
            </button>
          </div>
        </div>

        {/* AUTH FORM CARD */}
        <div className="glass-panel rounded-2xl border border-border p-8 shadow-xl">
          {errorMsg && (
            <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-xs font-semibold text-destructive">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Clinic Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Metro Health Center"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subdomain identifier</label>
                  <div className="flex rounded-lg border border-border bg-card overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <input
                      type="text"
                      required
                      placeholder="metrohealth"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                      className="flex-1 bg-transparent py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none"
                    />
                    <span className="flex items-center px-3 bg-secondary text-xs text-muted-foreground border-l border-border">
                      .receptionist.ai
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Administrator Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="Dr. John Doe"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:opacity-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
              ) : (
                <>
                  {isRegister ? 'Register and Onboard' : 'Secure Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setErrorMsg('');
                setIsRegister(!isRegister);
              }}
              className="text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
            >
              {isRegister ? 'Already registered? Sign In' : 'Need ReceptionOS for your clinic? Onboard here'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
