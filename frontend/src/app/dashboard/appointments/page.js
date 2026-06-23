'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Trash2,
  Edit2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('calendar'); // calendar or list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  // Form States
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('scheduled');

  // Fetch appointments
  const { data: appointmentsRes, isLoading: isLoadingApts } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  // Fetch doctors for selector
  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data.data;
    },
  });

  const appointments = appointmentsRes || [];
  const doctors = doctorsRes || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newApt) => api.post('/appointments', newApt),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedApt) => api.put(`/appointments/${updatedApt.id}`, updatedApt.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      closeModal();
    },
  });

  const openAddModal = () => {
    setSelectedApt(null);
    setPatientName('');
    setPatientPhone('');
    setDoctorId(doctors[0]?._id || '');
    setAppointmentTime('');
    setNotes('');
    setStatus('scheduled');
    setIsModalOpen(true);
  };

  const openEditModal = (apt) => {
    setSelectedApt(apt);
    setPatientName(apt.patientName);
    setPatientPhone(apt.patientPhone);
    setDoctorId(apt.doctorId?._id || '');
    
    // Format date string for datetime-local input field
    const date = new Date(apt.appointmentTime);
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    setAppointmentTime(adjustedDate.toISOString().slice(0, 16));
    
    setNotes(apt.notes || '');
    setStatus(apt.status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApt(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const aptPayload = {
      patientName,
      patientPhone,
      doctorId,
      appointmentTime: new Date(appointmentTime).toISOString(),
      notes,
      status,
    };

    if (selectedApt) {
      updateMutation.mutate({ id: selectedApt._id, data: aptPayload });
    } else {
      createMutation.mutate({ ...aptPayload, source: 'receptionist' });
    }
  };

  const handleDelete = () => {
    if (selectedApt && confirm('Are you sure you want to cancel this appointment?')) {
      deleteMutation.mutate(selectedApt._id);
    }
  };

  // Calendar generation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const startDayOfWeek = startOfMonth.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  // Previous month padding cells
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push({ dayNumber: null, key: `prev-${i}` });
  }
  // Current month active cells
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({ dayNumber: i, key: `curr-${i}` });
  }

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments Scheduler</h1>
            <p className="text-sm text-muted-foreground">
              Coordinate patient slots, allocate doctors, and adjust timings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex bg-card border border-border p-1 rounded-lg">
              <button
                onClick={() => setView('calendar')}
                className={`p-1.5 rounded-md transition-all ${
                  view === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-all ${
                  view === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Appointment
            </button>
          </div>
        </div>

        {/* CALENDAR VIEW */}
        {view === 'calendar' ? (
          <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-6">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-lg font-bold text-foreground">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div>
              {/* Day Titles */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7 gap-2">
                {daysArray.map((cell) => {
                  const day = cell.dayNumber;
                  const matchingApts = day
                    ? appointments.filter((apt) => {
                        const aptDate = new Date(apt.appointmentTime);
                        return (
                          aptDate.getFullYear() === year &&
                          aptDate.getMonth() === month &&
                          aptDate.getDate() === day
                        );
                      })
                    : [];

                  return (
                    <div
                      key={cell.key}
                      className={`min-h-[100px] border border-border/40 rounded-xl p-2 flex flex-col justify-between transition-colors bg-secondary/15 ${
                        day ? 'hover:bg-secondary/40' : 'opacity-30 bg-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${day ? 'text-foreground' : 'text-transparent'}`}>
                          {day}
                        </span>
                        {matchingApts.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
                        )}
                      </div>

                      <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                        {day &&
                          matchingApts.map((apt) => (
                            <button
                              key={apt._id}
                              onClick={() => openEditModal(apt)}
                              className={`w-full text-left truncate text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                apt.status === 'scheduled'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
                                  : apt.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {new Date(apt.appointmentTime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              - {apt.patientName}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* SPREADSHEET TABLE VIEW */
          <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Assigned Doctor</th>
                    <th className="py-3 px-4">Scheduled Slot</th>
                    <th className="py-3 px-4">Scheduling Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {appointments.length > 0 ? (
                    appointments.map((apt) => (
                      <tr key={apt._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{apt.patientName}</div>
                          <div className="text-xs text-muted-foreground">{apt.patientPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{apt.doctorId?.name}</div>
                          <div className="text-xs text-muted-foreground">{apt.doctorId?.specialization}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {new Date(apt.appointmentTime).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(apt.appointmentTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              apt.source === 'ai-call'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {apt.source === 'ai-call' ? 'AI Assistant' : 'Staff'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModal(apt)}
                            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground inline-flex cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No appointments found. Click Add Appointment to schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DIALOG (ADD / EDIT) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-card border border-border w-full max-w-md p-6 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {selectedApt ? 'Manage Appointment' : 'Schedule Appointment'}
                </h3>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alice Cooper"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Patient Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 123-4567"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Assign Practitioner</label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Time Slot</label>
                  <input
                    type="datetime-local"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Notes / Instructions</label>
                  <textarea
                    placeholder="Reason for checkup..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary h-20 resize-none"
                  />
                </div>

                {selectedApt && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                      <option value="pending">pending</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 justify-between items-center border-t border-border pt-4 mt-4">
                  {selectedApt ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-1 text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Cancel Booking
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

    </div>
  );
}
