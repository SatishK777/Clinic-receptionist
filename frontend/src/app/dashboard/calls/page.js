'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api.js';
import DashboardLayout from '../../../components/DashboardLayout.js';
import {
  Search,
  Filter,
  Volume2,
  Calendar,
  Clock,
  User,
  PhoneCall,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  TrendingDown,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export default function CallLogsPage() {
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [escalated, setEscalated] = useState('');
  const [booked, setBooked] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCallId, setSelectedCallId] = useState(null);

  // Audio Playback states
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioEngineRef = useRef(null);

  // Fetch calls with query arguments
  const { data: callsData, isLoading } = useQuery({
    queryKey: ['calls', search, sentiment, escalated, booked, page],
    queryFn: async () => {
      const params = { page, limit: 8 };
      if (search) params.search = search;
      if (sentiment) params.sentiment = sentiment;
      if (escalated) params.escalated = escalated;
      if (booked) params.appointmentBooked = booked;
      const res = await api.get('/calls', { params });
      return res.data;
    },
  });

  // Fetch single call details
  const { data: activeCallData, isLoading: isLoadingCall } = useQuery({
    queryKey: ['callDetails', selectedCallId],
    queryFn: async () => {
      if (!selectedCallId) return null;
      const res = await api.get(`/calls/${selectedCallId}`);
      return res.data.data;
    },
    enabled: !!selectedCallId,
  });

  const handlePlayAudio = (url) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.pause();
    }

    if (playing && audioUrl === url) {
      setPlaying(false);
      return;
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audio.play();
    audio.onended = () => setPlaying(false);

    audioEngineRef.current = audio;
    setAudioUrl(url);
    setPlaying(true);
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (audioEngineRef.current) {
      audioEngineRef.current.playbackRate = rate;
    }
  };

  const activeCall = activeCallData;
  const calls = callsData?.data || [];
  const totalPages = callsData?.pages || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Call Inquiries Logs</h1>
          <p className="text-sm text-muted-foreground">
            Browse recordings, transcripts, and AI-extracted sentiment flags.
          </p>
        </div>

        {/* CONTROLS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search phone number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <select
              value={sentiment}
              onChange={(e) => {
                setSentiment(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <div>
            <select
              value={escalated}
              onChange={(e) => {
                setEscalated(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">All Handoffs</option>
              <option value="true">Escalated to Staff</option>
              <option value="false">Handled by AI</option>
            </select>
          </div>

          <div>
            <select
              value={booked}
              onChange={(e) => {
                setBooked(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">All Booking Statuses</option>
              <option value="true">Bookings Booked</option>
              <option value="false">Inquiries / No Booking</option>
            </select>
          </div>
        </div>

        {/* SPLIT SCREEN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          
          {/* CALLS LIST COLUMN (5/12 width) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-card border border-border rounded-2xl p-4 shadow-sm overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : calls.length > 0 ? (
              <div className="space-y-2">
                {calls.map((call) => {
                  const isSelected = selectedCallId === call._id;
                  return (
                    <div
                      key={call._id}
                      onClick={() => setSelectedCallId(call._id)}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]'
                          : 'border-border bg-secondary/30 hover:bg-secondary/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">
                          {call.patientPhone}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(call.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {/* Sentiment */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            call.sentiment === 'positive'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : call.sentiment === 'negative'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {call.sentiment}
                        </span>

                        {/* Booking */}
                        {call.appointmentBooked && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> Booked
                          </span>
                        )}

                        {/* Escalation */}
                        {call.escalated && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Handoff
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-muted-foreground line-clamp-1">
                        {call.summary || 'Click to view transcript summaries.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">No call sessions found</p>
                <p className="text-xs text-muted-foreground">Adjust filters or check webhooks.</p>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-xs font-semibold text-muted-foreground">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* CALL DETAILS PANEL (7/12 width) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm overflow-y-auto">
            {isLoadingCall ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : activeCall ? (
              <div className="space-y-6">
                {/* DETAILS HEADER */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{activeCall.patientPhone}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(activeCall.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
                      Duration: {activeCall.duration}s
                    </span>
                  </div>
                </div>

                {/* AUDIO CONTROLLER */}
                {activeCall.recordingUrl && (
                  <div className="flex items-center justify-between gap-4 bg-secondary/30 p-4 rounded-xl border border-border">
                    <button
                      onClick={() => handlePlayAudio(activeCall.recordingUrl)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-all shadow-md cursor-pointer"
                    >
                      {playing && audioUrl === activeCall.recordingUrl ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                        <span>Recording Player</span>
                        <span>{playing && audioUrl === activeCall.recordingUrl ? 'Playing...' : 'Audio Loaded'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-primary ${playing ? 'animate-pulse' : ''}`}
                          style={{ width: playing && audioUrl === activeCall.recordingUrl ? '100%' : '0%' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
                      {[1, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange(rate)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            playbackRate === rate
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUMMARY CARD */}
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" /> AI Summary & Outcomes
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {activeCall.summary || 'Summary could not be resolved.'}
                  </p>
                </div>

                {/* TRANSCRIPT CONVERSATION */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Call Conversation Transcript
                  </h4>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 border border-border/40 p-4 rounded-xl bg-secondary/20">
                    {activeCall.transcript ? (
                      activeCall.transcript.split('\n').map((line, idx) => {
                        const isAI = line.startsWith('AI:');
                        const isPatient = line.startsWith('Patient:');
                        
                        if (!isAI && !isPatient) return <p key={idx} className="text-xs text-muted-foreground italic">{line}</p>;
                        
                        const text = line.replace(/^(AI:|Patient:)/, '').trim();

                        return (
                          <div
                            key={idx}
                            className={`flex flex-col gap-1 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto text-right'}`}
                          >
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {isAI ? 'Clinical AI' : 'Patient Call'}
                            </span>
                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isAI
                                  ? 'bg-card border border-border text-foreground rounded-tl-none'
                                  : 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                              }`}
                            >
                              {text}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        No transcript recorded for this session.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Volume2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h4 className="font-semibold text-foreground text-sm">Select a Call Log</h4>
                <p className="text-xs max-w-xs mt-1">
                  Click on any session in the ledger to review recordings, AI summaries, and patient dialogue.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
