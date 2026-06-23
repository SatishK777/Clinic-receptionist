'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';
import { useDashboardShell } from '../../../components/DashboardShellProvider.js';
import {
  Building,
  Clock,
  Bell,
  Save,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const { bootstrapReady, isSuperAdmin } = useDashboardShell();

  // Fetch hospital profile settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    enabled: !isSuperAdmin || bootstrapReady,
    staleTime: 5 * 60 * 1000,
  });

  const settingsObj = settingsData?.settings || {};
  const hospitalObj = settingsData?.hospital || {};
  const [draft, setDraft] = useState(null);
  const defaultForm = {
    hospitalName: hospitalObj.name || '',
    timezone: hospitalObj.timezone || 'America/New_York',
    businessHours: settingsObj.businessHours || [],
    emailAlerts: settingsObj.notifications?.emailAlerts ?? true,
    smsEscalations: settingsObj.notifications?.smsEscalations ?? false,
    escalationPhone: settingsObj.notifications?.escalationPhone || '',
  };
  const form = draft ?? defaultForm;

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (payload) => api.put('/settings', payload),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries(['settings']);
      setSuccessMsg('Operational settings successfully saved.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => api.put('/settings/hospital', payload),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries(['settings']);
      setSuccessMsg('Clinic profile metadata successfully updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: form.hospitalName, timezone: form.timezone });
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      businessHours: form.businessHours,
      notifications: {
        emailAlerts: form.emailAlerts,
        smsEscalations: form.smsEscalations,
        escalationPhone: form.escalationPhone,
      },
    });
  };

  const handleHourToggle = (index) => {
    const updated = form.businessHours.map((day, dayIndex) => (
      dayIndex === index ? { ...day, isOpen: !day.isOpen } : day
    ));
    setDraft({ ...form, businessHours: updated });
  };

  const handleHourChange = (index, field, value) => {
    const updated = form.businessHours.map((day, dayIndex) => (
      dayIndex === index ? { ...day, [field]: value } : day
    ));
    setDraft({ ...form, businessHours: updated });
  };

  if (!bootstrapReady || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clinic Configurations</h1>
          <p className="text-sm text-muted-foreground">
            Administer clinic coordinates, operating schedules, and escalation alert systems.
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm animate-in fade-in duration-200">
            <CheckCircle className="h-5 w-5" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PROFILE AND HOURLY GRIDS (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* HOSPITAL PROFILE */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <Building className="h-5 w-5 text-primary" /> Hospital Profile Information
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Clinic Legal Name</label>
                    <input
                      type="text"
                      required
                      value={form.hospitalName}
                      onChange={(e) => setDraft({ ...form, hospitalName: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Standard Timezone</label>
                    <select
                      value={form.timezone}
                      onChange={(e) => setDraft({ ...form, timezone: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Anchorage">Alaska Time (AKT)</option>
                      <option value="America/Adak">Hawaii Time (HT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Metadata
                  </button>
                </div>
              </form>
            </div>

            {/* OPERATING BUSINESS HOURS */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <Clock className="h-5 w-5 text-primary" /> Operating Business Hours
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-3">
                  {form.businessHours.map((day, idx) => (
                    <div
                      key={day._id || idx}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-secondary/15 flex-wrap"
                    >
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <input
                          type="checkbox"
                          checked={day.isOpen}
                          onChange={() => handleHourToggle(idx)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-bold text-foreground">{day.dayOfWeek}</span>
                      </div>

                      {day.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={day.openTime}
                            onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)}
                            className="w-16 rounded border border-border bg-background text-xs py-1 px-1.5 text-center text-foreground focus:border-primary outline-none"
                          />
                          <span className="text-xs text-muted-foreground">to</span>
                          <input
                            type="text"
                            value={day.closeTime}
                            onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)}
                            className="w-16 rounded border border-border bg-background text-xs py-1 px-1.5 text-center text-foreground focus:border-primary outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold italic">Closed / Off duty</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-border pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Operating Hours
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ALERT NOTIFICATIONS (1/3 width) */}
          <div className="space-y-6">
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <Bell className="h-5 w-5 text-primary" /> Notifications & Alerts
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:bg-secondary/40 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={form.emailAlerts}
                    onChange={() => setDraft({ ...form, emailAlerts: !form.emailAlerts })}
                      className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                    />
                    <div>
                      <div className="font-semibold text-foreground">Email Notifications</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Send a digest when appointments are auto-booked</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:bg-secondary/40 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={form.smsEscalations}
                    onChange={() => setDraft({ ...form, smsEscalations: !form.smsEscalations })}
                      className="rounded text-primary focus:ring-primary h-4.5 w-4.5"
                    />
                    <div>
                      <div className="font-semibold text-foreground">SMS Escalations</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Send text alerts to staff on negative sentiment handoffs</div>
                    </div>
                  </label>
                </div>

                {smsEscalations && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Staff Alert Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 901-2345"
                    value={form.escalationPhone}
                    onChange={(e) => setDraft({ ...form, escalationPhone: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="border-t border-border pt-4 mt-4">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Notifications
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
    </div>
  );
}
