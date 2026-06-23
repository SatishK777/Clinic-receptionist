'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '../../services/api.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useDashboardShell } from '../../components/DashboardShellProvider.js';
import { normalizeTrendDays } from '../../utils/chartData.js';
import {
  Phone,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const { activeTenantId, bootstrapReady, isSuperAdmin } = useDashboardShell();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['dashboardAnalytics', activeTenantId || user?.role],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    },
    enabled: isSuperAdmin ? bootstrapReady : true,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: false,
  });

  if (!bootstrapReady || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground text-xs font-semibold">Aggregating telemetry charts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to fetch dashboard metrics. Please ensure the backend is running.
      </div>
    );
  }

  const { summary, todayAppointments, callTrends, sentiment, hourlyDistribution } = analytics || {};
  const normalizedCallTrends = normalizeTrendDays(callTrends);

  const kpis = [
    {
      title: 'Total Call Sessions',
      value: summary?.totalCalls || 0,
      icon: Phone,
      color: 'text-indigo-500 bg-indigo-500/10',
      description: 'Incoming customer inquiries',
    },
    {
      title: 'Booked Appointments',
      value: summary?.appointmentsBooked || 0,
      icon: Calendar,
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Clinic slot allocations',
    },
    {
      title: 'Booking Conversion',
      value: `${summary?.bookingConversionRate || 0}%`,
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-500/10',
      description: 'Call to scheduling success',
    },
    {
      title: 'AI Success Rate',
      value: `${summary?.aiSuccessRate || 0}%`,
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10',
      description: 'Calls handled without escalation',
    },
  ];

  return (
    <div className="space-y-8">
        
        {/* HEADER GREETINGS */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operational Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring AI receptionist telemetry, scheduling outcomes, and clinic rosters.
          </p>
        </div>

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className={`p-2 rounded-xl transition-all duration-300 ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {kpi.value}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            );
          })}
        </div>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* CURVED AREA CALL VOLUME TRENDS */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-0.5">
                <h3 className="font-bold text-foreground">Call Activities & Bookings</h3>
                <p className="text-xs text-muted-foreground">Volume analytics over the last week</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedCallTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="calls" name="Inbound Calls" fill="#6366f1" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="booked" name="AI Bookings" fill="#10b981" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SENTIMENT ANALYSIS */}
          <div className="glass-panel rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-foreground mb-1">Customer Sentiments</h3>
              <p className="text-xs text-muted-foreground mb-6">AI evaluation of call tone</p>
            </div>

            <div className="space-y-4">
              {/* Positive */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Positive
                  </span>
                  <span>{sentiment?.positive || 0} calls</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        summary?.totalCalls > 0
                          ? ((sentiment?.positive || 0) / summary.totalCalls) * 100
                          : 70
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Neutral */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-indigo-500">
                    <Clock className="h-3.5 w-3.5" /> Neutral
                  </span>
                  <span>{sentiment?.neutral || 0} calls</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${
                        summary?.totalCalls > 0
                          ? ((sentiment?.neutral || 0) / summary.totalCalls) * 100
                          : 20
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Negative */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Escalations / Negative
                  </span>
                  <span>{sentiment?.negative || 0} calls</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full"
                    style={{
                      width: `${
                        summary?.totalCalls > 0
                          ? ((sentiment?.negative || 0) / summary.totalCalls) * 100
                          : 10
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-center">
              <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                Avg Call Duration:{' '}
                <span className="text-foreground">{summary?.averageCallDuration || 0} seconds</span>
              </span>
            </div>
          </div>

        </div>

        {/* TODAY'S APPOINTMENTS QUEUE */}
        <div className="glass-panel rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <h3 className="font-bold text-foreground">Today&apos;s Appointment Queue</h3>
              <p className="text-xs text-muted-foreground">List of incoming checked schedules</p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open Full Scheduler
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Origin</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {todayAppointments && todayAppointments.length > 0 ? (
                  todayAppointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{apt.patientName}</div>
                        <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{apt.doctorId?.name}</div>
                        <div className="text-xs text-muted-foreground">{apt.doctorId?.specialization}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        {new Date(apt.appointmentTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            apt.source === 'ai-call'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {apt.source === 'ai-call' ? 'AI Assistant' : 'Receptionist'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            apt.status === 'scheduled'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : apt.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                      No appointments scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
