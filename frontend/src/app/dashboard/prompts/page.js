'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api.js';
import DashboardLayout from '../../../components/DashboardLayout.js';
import {
  BrainCircuit,
  MessageSquare,
  AlertOctagon,
  Languages,
  Volume2,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  // Fetch active AI configs
  const { data: agentData, isLoading } = useQuery({
    queryKey: ['aiAgent'],
    queryFn: async () => {
      const res = await api.get('/ai-agents');
      return res.data.data;
    },
  });

  // State bindings (populated in useEffect or handleSave)
  const [name, setName] = useState('');
  const [vapiAssistantId, setVapiAssistantId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [emergencyWorkflow, setEmergencyWorkflow] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [triggerPhrases, setTriggerPhrases] = useState('');
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [voiceProvider, setVoiceProvider] = useState('11labs');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [voiceTemperature, setVoiceTemperature] = useState(0.7);

  // Sync state when agent loads
  const [loaded, setLoaded] = useState(false);
  if (agentData && !loaded) {
    setName(agentData.name || '');
    setVapiAssistantId(agentData.vapiAssistantId || '');
    setSystemPrompt(agentData.systemPrompt || '');
    setGreetingMessage(agentData.greetingMessage || '');
    setFaqs(agentData.faqs || []);
    setEmergencyWorkflow(agentData.emergencyWorkflow || '');
    setTransferNumber(agentData.escalationRules?.transferNumber || '');
    setTriggerPhrases(agentData.escalationRules?.triggerPhrases?.join(', ') || 'speak to a human');
    setSupportedLanguages(agentData.supportedLanguages || ['en']);
    setVoiceProvider(agentData.voiceSettings?.provider === 'elevenlabs' ? '11labs' : agentData.voiceSettings?.provider || '11labs');
    setVoiceId(agentData.voiceSettings?.voiceId || '21m00Tcm4TlvDq8ikWAM');
    setVoiceTemperature(agentData.voiceSettings?.temperature || 0.7);
    setLoaded(true);
  }

  // Mutation
  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/ai-agents/${agentData._id}`, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['aiAgent']);
      const vapiSync = res.data?.vapiSync;
      if (vapiSync?.attempted && !vapiSync.success) {
        setSuccessMsg('AI Assistant settings saved in the portal.');
        setWarningMsg(`Vapi sync failed: ${vapiSync.message}`);
      } else if (vapiSync?.attempted) {
        setSuccessMsg('AI Assistant settings saved and synchronized to Vapi!');
        setWarningMsg('');
      } else {
        setSuccessMsg('AI Assistant settings saved in the portal.');
        setWarningMsg(vapiSync?.message || '');
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      setTimeout(() => setWarningMsg(''), 8000);
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      name,
      vapiAssistantId,
      systemPrompt,
      greetingMessage,
      faqs,
      emergencyWorkflow,
      escalationRules: {
        transferNumber,
        triggerPhrases: triggerPhrases.split(',').map((p) => p.trim()).filter(Boolean),
      },
      supportedLanguages,
      voiceSettings: {
        provider: voiceProvider,
        voiceId,
        temperature: parseFloat(voiceTemperature),
      },
    };
    updateMutation.mutate(payload);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index, field, value) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const toggleLanguage = (lang) => {
    if (supportedLanguages.includes(lang)) {
      setSupportedLanguages(supportedLanguages.filter((l) => l !== lang));
    } else {
      setSupportedLanguages([...supportedLanguages, lang]);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Prompts Studio</h1>
            <p className="text-sm text-muted-foreground">
              Refine receptionist behavioral instructions, FAQ dictionaries, and emergency routing protocols.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm animate-in fade-in duration-200">
            <CheckCircle className="h-5 w-5" />
            {successMsg}
          </div>
        )}

        {warningMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-300 font-semibold shadow-sm animate-in fade-in duration-200">
            <AlertOctagon className="h-5 w-5" />
            {warningMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* BEHAVIOR AND GREETING EDITORS (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* INSTRUCTIONS */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <BrainCircuit className="h-5 w-5 text-primary" /> Core LLM System Prompts
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Receptionist Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Vapi Assistant ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 3b1e779a-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={vapiAssistantId}
                    onChange={(e) => setVapiAssistantId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Behavior Instructions</label>
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary font-mono text-[11px]"
                />
              </div>
            </div>

            {/* CALL SCRIPTING */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <MessageSquare className="h-5 w-5 text-primary" /> Script Greeting Messages
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Opening Greeting (Spoken first)</label>
                <textarea
                  rows={3}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* FAQ DIRECTORY */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" /> Knowledge Base FAQ Matches
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add FAQ
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="relative bg-secondary/20 border border-border p-4 rounded-xl space-y-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="absolute right-3 top-3 p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Question</label>
                      <input
                        type="text"
                        placeholder="What are your hours?"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-1.5 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Answer</label>
                      <textarea
                        rows={2}
                        placeholder="We are open..."
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-1.5 px-3 text-xs text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}

                {faqs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    No custom FAQ matching entries loaded. Click Add FAQ to register.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* TELEPHONY VOICES & EMERGENCY ROUTING (1/3 width) */}
          <div className="space-y-6">
            
            {/* ESCALATIONS AND PROTOCOLS */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <AlertOctagon className="h-5 w-5 text-primary" /> Emergency Protocols
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Emergency Instructions</label>
                <textarea
                  rows={4}
                  value={emergencyWorkflow}
                  onChange={(e) => setEmergencyWorkflow(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Staff Handoff Line</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-9999"
                  value={transferNumber}
                  onChange={(e) => setTransferNumber(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Escalation Trigger Phrases</label>
                <input
                  type="text"
                  placeholder="speak to human, supervisor"
                  value={triggerPhrases}
                  onChange={(e) => setTriggerPhrases(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground">Separate phrases using commas.</span>
              </div>
            </div>

            {/* AI VOICE SETTINGS */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <Volume2 className="h-5 w-5 text-primary" /> AI Voice Engine
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Voice Provider</label>
                <select
                  value={voiceProvider}
                  onChange={(e) => setVoiceProvider(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="11labs">ElevenLabs (High Quality)</option>
                  <option value="openai">OpenAI TTS</option>
                  <option value="playht">PlayHT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Voice Speaker ID</label>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Warm Female)</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi (Energetic Female)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella (Clear Female)</option>
                  <option value="ErXwobaYiN019PkySvjV">Antoni (Clinical Male)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                  <span>Temperature</span>
                  <span className="text-foreground font-semibold">{voiceTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={voiceTemperature}
                  onChange={(e) => setVoiceTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* LANGUAGES SELECTOR */}
            <div className="glass-panel border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-foreground border-b border-border pb-3">
                <Languages className="h-5 w-5 text-primary" /> Supported Languages
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { code: 'en', label: 'English (US)' },
                  { code: 'es', label: 'Spanish' },
                  { code: 'fr', label: 'French' },
                  { code: 'pt', label: 'Portuguese' },
                ].map((lang) => (
                  <label
                    key={lang.code}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-secondary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={supportedLanguages.includes(lang.code)}
                      onChange={() => toggleLanguage(lang.code)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* SYNC/SAVE ACTION BUTTON */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
              ) : (
                'Synchronize AI Assistants'
              )}
            </button>

          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
