'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';
import DashboardLayout from '../../../components/DashboardLayout.js';
import {
  Smartphone,
  Plus,
  Link as LinkIcon,
  CheckCircle,
  AlertTriangle,
  Building,
  Hash,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function TelephonyPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [department, setDepartment] = useState('General Reception');
  const [editingPhone, setEditingPhone] = useState(null);

  // Fetch assigned numbers
  const { data: phonesRes, isLoading } = useQuery({
    queryKey: ['phoneNumbers'],
    queryFn: async () => {
      const res = await api.get('/phone-numbers');
      return res.data.data;
    },
  });

  const phoneNumbers = phonesRes || [];

  // Mutation to assign number
  const assignMutation = useMutation({
    mutationFn: (payload) => api.post('/phone-numbers/assign', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['phoneNumbers']);
      setSuccessMsg('Phone number successfully provisioned and bound to Vapi!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to provision number');
    },
  });

  // Mutation to update number
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/phone-numbers/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['phoneNumbers']);
      setSuccessMsg('Phone number configuration successfully updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update phone configuration');
    },
  });

  // Mutation to delete number
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/phone-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['phoneNumbers']);
      setSuccessMsg('Phone number configuration successfully removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to delete phone configuration');
    },
  });

  const openModal = () => {
    setErrorMsg('');
    setPhoneNumber('');
    setTwilioSid('');
    setDepartment('General Reception');
    setEditingPhone(null);
    setIsModalOpen(true);
  };

  const openEditModal = (phone) => {
    setErrorMsg('');
    setPhoneNumber(phone.phoneNumber);
    setTwilioSid(phone.twilioSid || '');
    setDepartment(phone.department || 'General Reception');
    setEditingPhone(phone);
    setIsModalOpen(true);
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!phoneNumber) return;
    if (editingPhone) {
      updateMutation.mutate({
        id: editingPhone._id,
        payload: { phoneNumber, department, twilioSid }
      });
    } else {
      assignMutation.mutate({ phoneNumber, department, twilioSid });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Telephony Control</h1>
            <p className="text-sm text-muted-foreground">
              Provision Twilio numbers and link calls routing to clinical AI receptionists.
            </p>
          </div>

          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Provision Number
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm">
            <CheckCircle className="h-5 w-5" />
            {successMsg}
          </div>
        )}

        {/* NUMBERS TABLE */}
        <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : phoneNumbers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase">
                    <th className="py-3 px-4">Line Identifier</th>
                    <th className="py-3 px-4">Department Mapping</th>
                    <th className="py-3 px-4">Twilio Provider SID</th>
                    <th className="py-3 px-4">AI Target Assistant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {phoneNumbers.map((phone) => (
                    <tr key={phone._id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" /> {phone.phoneNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" /> {phone.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {phone.twilioSid}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <LinkIcon className="h-3.5 w-3.5" /> {phone.vapiAssistantId?.name || 'Clinical Assistant'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {phone.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditModal(phone)}
                            className="p-1.5 rounded hover:bg-secondary text-primary transition-all cursor-pointer"
                            title="Edit Configuration"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${phone.phoneNumber}?`)) {
                                deleteMutation.mutate(phone._id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-all cursor-pointer"
                            title="Delete Line"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Smartphone className="h-10 w-10 text-muted-foreground/45 mb-3" />
              <h3 className="font-bold text-foreground">No Phone Lines Provisioned</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Purchase or route a phone number to enable AI voice reception on your phone.
              </p>
            </div>
          )}
        </div>

        {/* DIALOG BOX */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-card border border-border w-full max-w-md p-6 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" /> {editingPhone ? 'Edit Telephone Line' : 'Provision Telephone Line'}
                </h3>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-xs font-semibold text-destructive">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number (E.164)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +18005550199"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Ensure prefix includes country code (+1 for USA).</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Twilio Phone SID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">Leave blank to auto-generate a mock identifier.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Department Routing</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option value="General Reception">General Reception</option>
                    <option value="Pediatrics Dept">Pediatrics Dept</option>
                    <option value="Cardiology Dept">Cardiology Dept</option>
                    <option value="Billing & Claims">Billing & Claims</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end border-t border-border pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {assignMutation.isPending || updateMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    ) : (
                      editingPhone ? 'Save Changes' : 'Provision Line'
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
