'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';
import {
  User,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Clock,
  Calendar,
  X,
  PlusCircle,
} from 'lucide-react';

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationDuration, setConsultationDuration] = useState(30);
  const [status, setStatus] = useState('active');
  const [availableHours, setAvailableHours] = useState([]);

  // Fetch doctors list
  const { data: doctorsRes, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/doctors');
      return res.data.data;
    },
  });

  const doctors = doctorsRes || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newDoc) => api.post('/doctors', newDoc),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedDoc) => api.put(`/doctors/${updatedDoc.id}`, updatedDoc.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      closeModal();
    },
  });

  const openAddModal = () => {
    setSelectedDoctor(null);
    setName('');
    setSpecialization('');
    setEmail('');
    setPhone('');
    setConsultationDuration(30);
    setStatus('active');
    setAvailableHours([
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setSelectedDoctor(doc);
    setName(doc.name);
    setSpecialization(doc.specialization);
    setEmail(doc.email || '');
    setPhone(doc.phone || '');
    setConsultationDuration(doc.consultationDuration || 30);
    setStatus(doc.status);
    setAvailableHours(doc.availableHours || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const docPayload = {
      name,
      specialization,
      email,
      phone,
      consultationDuration,
      status,
      availableHours,
    };

    if (selectedDoctor) {
      updateMutation.mutate({ id: selectedDoctor._id, data: docPayload });
    } else {
      createMutation.mutate(docPayload);
    }
  };

  const handleDelete = () => {
    if (selectedDoctor && confirm(`Are you sure you want to remove Dr. ${selectedDoctor.name}?`)) {
      deleteMutation.mutate(selectedDoctor._id);
    }
  };

  const handleAddSlot = () => {
    setAvailableHours([
      ...availableHours,
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
    ]);
  };

  const handleRemoveSlot = (index) => {
    setAvailableHours(availableHours.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index, field, value) => {
    const updated = [...availableHours];
    updated[index][field] = value;
    setAvailableHours(updated);
  };

  return (
    <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Practitioners Roster</h1>
            <p className="text-sm text-muted-foreground">
              Define doctor details, appointment segments, and operational availabilities.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Doctor
          </button>
        </div>

        {/* CARDS LISTING */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc._id}
                className="glass-panel border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:scale-[1.01]"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                      {doc.name ? doc.name.replace(/^(Dr\.\s*)/i, '').slice(0,2) : 'DR'}
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        doc.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary">{doc.specialization}</p>
                  </div>

                  {/* Contact details */}
                  <div className="mt-4 space-y-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                    {doc.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{doc.email}</span>
                      </div>
                    )}
                    {doc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{doc.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{doc.consultationDuration} min consultation</span>
                    </div>
                  </div>

                  {/* Availability slots summary */}
                  <div className="mt-4 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Scheduled Availability
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {doc.availableHours && doc.availableHours.length > 0 ? (
                        doc.availableHours.map((slot, idx) => (
                          <span
                            key={idx}
                            className="bg-secondary text-foreground text-[9px] font-semibold px-2 py-0.5 rounded-md border border-border"
                          >
                            {slot.dayOfWeek.slice(0, 3)} {slot.startTime}-{slot.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No availability slots set</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border/40 pt-4">
                  <button
                    onClick={() => openEditModal(doc)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2 text-xs font-semibold text-foreground hover:bg-border transition-all duration-200 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Modify Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-2xl border border-border">
            <User className="h-12 w-12 text-muted-foreground/45 mb-3" />
            <h3 className="font-bold text-foreground">No Doctors Registered</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Add a practitioner to define appointment availabilities.
            </p>
          </div>
        )}

        {/* DIALOG BOX (ADD / EDIT) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-card border border-border w-full max-w-lg p-6 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {selectedDoctor ? 'Edit Doctor Profile' : 'Add Practitioner'}
                </h3>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Doctor Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Specialization</label>
                    <input
                      type="text"
                      required
                      placeholder="Pediatrics / Cardiology"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="sjenkins@metrohealth.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 301-4455"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Consultation (Mins)</label>
                    <input
                      type="number"
                      required
                      value={consultationDuration === '' || isNaN(consultationDuration) ? '' : consultationDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setConsultationDuration(isNaN(val) ? '' : val);
                      }}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Roster Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* WEEKLY AVAILABILITY HOUR SLOTS */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Availability Shifts</span>
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Add Shift
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {availableHours.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border">
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) => handleSlotChange(idx, 'dayOfWeek', e.target.value)}
                          className="rounded border border-border bg-background text-xs py-1 px-1.5 text-foreground focus:border-primary outline-none"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="09:00"
                          value={slot.startTime}
                          onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                          className="w-16 rounded border border-border bg-background text-xs py-1 px-1.5 text-center text-foreground focus:border-primary outline-none"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="text"
                          placeholder="17:00"
                          value={slot.endTime}
                          onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                          className="w-16 rounded border border-border bg-background text-xs py-1 px-1.5 text-center text-foreground focus:border-primary outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(idx)}
                          className="ml-auto p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {availableHours.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No availability shifts defined.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-between items-center border-t border-border pt-4 mt-6">
                  {selectedDoctor ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-1 text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Profile
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
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      Save Practitioner
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
