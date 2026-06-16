import { appointmentAnalysisPlan, buildAssistantSystemPrompt } from './assistantContext.js';

const clinicTimeZone = process.env.CLINIC_TIMEZONE || 'Asia/Kolkata';

const buildBookAppointmentTool = (serverUrl) => ({
  type: 'function',
  async: false,
  server: serverUrl ? { url: serverUrl } : undefined,
  messages: [
    {
      type: 'request-start',
      content: 'Let me check and reserve that appointment slot.',
    },
    {
      type: 'request-complete',
      role: 'system',
      content: 'The tool call finished, but the appointment is confirmed only if the tool result starts with Success. If the result starts with Failed, do not confirm; explain the exact reason, offer a future portal-valid slot, and if the caller accepts that new slot call bookAppointment again before confirming.',
    },
    {
      type: 'request-failed',
      content: 'I am sorry, I could not check the appointment system right now. Please try another time or call the clinic directly.',
    },
  ],
  function: {
    name: 'bookAppointment',
    description: 'Book an appointment in the clinic portal after the caller has confirmed patient name, doctor or specialty, exact date, and exact time. Use the exact caller-confirmed date and time; do not substitute a different date. The backend checks doctor availability, past times, and duplicate bookings. Do not tell the caller the appointment is confirmed until this tool returns Success.',
    parameters: {
      type: 'object',
      properties: {
        patientName: {
          type: 'string',
          description: 'The patient full name.',
        },
        patientPhone: {
          type: 'string',
          description: 'The patient callback phone number if the caller provided it.',
        },
        doctorName: {
          type: 'string',
          description: 'The selected doctor name.',
        },
        specialty: {
          type: 'string',
          description: 'The requested specialty, if provided.',
        },
        appointmentTime: {
          type: 'string',
          description: `The confirmed appointment date and time in ISO 8601 format for the clinic timezone (${clinicTimeZone}). Use the caller-confirmed local clinic time; do not convert it to another timezone.`,
        },
        reason: {
          type: 'string',
          description: 'Short appointment reason, using non-sensitive language.',
        },
      },
      required: ['patientName', 'doctorName', 'appointmentTime'],
    },
  },
});

const buildRescheduleAppointmentTool = (serverUrl) => ({
  type: 'function',
  async: false,
  server: serverUrl ? { url: serverUrl } : undefined,
  messages: [
    {
      type: 'request-start',
      content: 'Let me look up and reschedule that appointment.',
    },
    {
      type: 'request-complete',
      role: 'system',
      content: 'Use the tool result as the source of truth. If it starts with Success, confirm the new appointment time. If it starts with Failed, explain the reason and ask for the missing detail or offer another available slot.',
    },
    {
      type: 'request-failed',
      content: 'I am sorry, I could not access the appointment system right now. Please call the clinic directly to reschedule.',
    },
  ],
  function: {
    name: 'rescheduleAppointment',
    description: 'Reschedule an existing appointment in the clinic portal. Use this only after collecting enough details to find the existing appointment and the caller has confirmed the new date and time. The backend checks the existing appointment, doctor availability, and duplicate bookings. Do not tell the caller the appointment was rescheduled until this tool returns Success.',
    parameters: {
      type: 'object',
      properties: {
        patientName: {
          type: 'string',
          description: 'The patient full name.',
        },
        patientPhone: {
          type: 'string',
          description: 'The patient callback phone number.',
        },
        doctorName: {
          type: 'string',
          description: 'The doctor name on the existing or requested appointment.',
        },
        specialty: {
          type: 'string',
          description: 'The specialty, if doctor name is unclear.',
        },
        currentAppointmentTime: {
          type: 'string',
          description: `The existing appointment date and time in ISO 8601 format for the clinic timezone (${clinicTimeZone}), if the caller knows it.`,
        },
        newAppointmentTime: {
          type: 'string',
          description: `The new confirmed appointment date and time in ISO 8601 format for the clinic timezone (${clinicTimeZone}). Use the caller-confirmed local clinic time; do not convert it to another timezone.`,
        },
        reason: {
          type: 'string',
          description: 'Short reason for rescheduling, using non-sensitive language.',
        },
      },
      required: ['patientName', 'patientPhone', 'newAppointmentTime'],
    },
  },
});

export const toVapiAssistantPayload = (agent, existingAssistant = {}) => {
  const doctors = existingAssistant.portalDoctors || [];
  const setting = existingAssistant.portalSetting || null;
  const existingModel = existingAssistant.model || {};
  const existingVoice = existingAssistant.voice || {};
  const { version: _voiceVersion, ...editableExistingVoice } = existingVoice;
  const existingAnalysisPlan = existingAssistant.analysisPlan || {};
  const systemPrompt = buildAssistantSystemPrompt(agent, doctors, setting);
  const voiceProvider = agent.voiceSettings?.provider === 'elevenlabs'
    ? '11labs'
    : agent.voiceSettings?.provider;
  const serverUrl = process.env.VAPI_WEBHOOK_URL ||
    existingAssistant.server?.url ||
    existingAssistant.serverUrl;

  return {
    name: agent.name,
    firstMessage: agent.greetingMessage,
    firstMessageMode: 'assistant-speaks-first',
    model: {
      ...existingModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
      temperature: agent.voiceSettings?.temperature ?? existingModel.temperature ?? 0.7,
      tools: [
        buildBookAppointmentTool(serverUrl),
        buildRescheduleAppointmentTool(serverUrl),
      ],
    },
    voice: {
      ...editableExistingVoice,
      provider: voiceProvider || existingVoice.provider || '11labs',
      voiceId: agent.voiceSettings?.voiceId || existingVoice.voiceId || '21m00Tcm4TlvDq8ikWAM',
    },
    analysisPlan: {
      ...existingAnalysisPlan,
      ...appointmentAnalysisPlan,
    },
  };
};
