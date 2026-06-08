'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api.js';
import DashboardLayout from '../../../components/DashboardLayout.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';

export default function AnalyticsPage() {
  // Fetch dashboard analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, callTrends, sentiment, hourlyDistribution } = analytics || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operational Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Audit clinic conversion metrics, busiest dialing periods, and customer satisfaction indexes.
          </p>
        </div>

        {/* STATS MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Call Duration</span>
              <h3 className="text-2xl font-extrabold text-foreground">{summary?.averageCallDuration || 0}s</h3>
              <p className="text-[10px] text-muted-foreground">Time taken to process patient intents</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Booking Conversions</span>
              <h3 className="text-2xl font-extrabold text-foreground">{summary?.bookingConversionRate || 0}%</h3>
              <p className="text-[10px] text-muted-foreground">Ratio of call inquiries to saved bookings</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Handling Index</span>
              <h3 className="text-2xl font-extrabold text-foreground">{summary?.aiSuccessRate || 0}%</h3>
              <p className="text-[10px] text-muted-foreground">Completed calls requiring no staff transfers</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* CHART ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HOURLY DISTRIBUTION */}
          <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-foreground">Busiest Hours (Hourly Distribution)</h3>
              <p className="text-xs text-muted-foreground">Call frequency mapped over a 24 hour block</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="calls" name="Calls Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HISTORICAL SCHEDULINGS */}
          <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-foreground">Apt Bookings Evolution</h3>
              <p className="text-xs text-muted-foreground">Comparing total queries against finalized rosters</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="booked" stroke="#10b981" fill="#10b981" fillOpacity={0.06} strokeWidth={2} />
                  <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="#6366f1" fillOpacity={0.03} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SATISFACTION SUMMARY */}
        <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-foreground">Tone and Patient Sentiments</h3>
            <p className="text-xs text-muted-foreground mb-6">Aggregate voice analysis of patient satisfaction indexes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <Smile className="h-8 w-8 text-emerald-500 mb-2 animate-bounce" style={{ animationDuration: '4s' }} />
              <span className="text-xs font-bold text-muted-foreground uppercase">Positive Feedbacks</span>
              <span className="text-3xl font-extrabold text-foreground mt-2">{sentiment?.positive || 0}</span>
              <span className="text-[10px] text-muted-foreground mt-1">Warm expressions, clear schedules</span>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <Meh className="h-8 w-8 text-indigo-500 mb-2" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Neutral Exchanges</span>
              <span className="text-3xl font-extrabold text-foreground mt-2">{sentiment?.neutral || 0}</span>
              <span className="text-[10px] text-muted-foreground mt-1">FAQ checks, insurance inquiries</span>
            </div>

            <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <Frown className="h-8 w-8 text-destructive mb-2" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Active Escalations</span>
              <span className="text-3xl font-extrabold text-foreground mt-2">{sentiment?.negative || 0}</span>
              <span className="text-[10px] text-muted-foreground mt-1">Refill queries, custom transfer requests</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
