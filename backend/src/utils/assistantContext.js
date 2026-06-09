const formatHours = (hours = []) => {
  if (!hours.length) return 'No schedule entered.';

  return hours
    .map((slot) => `${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`)
    .join('; ');
};

const formatBusinessHours = (businessHours = []) => {
  if (!businessHours.length) return 'No clinic business hours entered.';

  return businessHours
    .map((slot) => {
      if (!slot.isOpen) return `${slot.dayOfWeek}: closed`;
      return `${slot.dayOfWeek}: ${slot.openTime}-${slot.closeTime}`;
    })
    .join('; ');
};

const formatDateKey = (date, timeZone) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const formatUpcomingCalendar = (timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return Array.from({ length: 45 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return `- ${formatDateKey(date, timeZone)}: ${formatter.format(date)}`;
  }).join('\n');
};

export const buildAssistantSystemPrompt = (agent, doctors = [], setting = null) => {
  const now = new Date();
  const clinicTimeZone = process.env.CLINIC_TIMEZONE || 'Asia/Kolkata';
  const runtimeClinicNow = `{{ "now" | date: "%A, %B %d, %Y, %I:%M %p", "${clinicTimeZone}" }}`;
  const activeDoctors = doctors.filter((doctor) => doctor.status === 'active');
  const doctorLines = activeDoctors.length
    ? activeDoctors.map((doctor) => {
      return `- ${doctor.name} (${doctor.specialization}), appointment duration ${doctor.consultationDuration || 30} minutes, available ${formatHours(doctor.availableHours)}`;
    }).join('\n')
    : '- No active doctors are currently configured in the portal.';

  const faqLines = agent.faqs?.length
    ? agent.faqs.map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`).join('\n')
    : '- No custom FAQs are configured.';

  return `${agent.systemPrompt}

Live portal data for this clinic:

Clinic timezone: ${clinicTimeZone}
Current clinic date and time: ${runtimeClinicNow}
Assistant configuration last synced at: ${now.toISOString()}
Clinic business hours: ${formatBusinessHours(setting?.businessHours)}

Upcoming clinic calendar. Use this to avoid weekday/date mistakes:
${formatUpcomingCalendar(clinicTimeZone)}

Active doctors and appointment timing:
${doctorLines}

Portal FAQs:
${faqLines}

Emergency workflow:
${agent.emergencyWorkflow}

Appointment behavior:
- Use only the doctor names, specializations, and available hours listed above.
- Treat "today" as the Current clinic date and time above. If any other message, transcript, memory, or stale portal line gives a different date, ignore it.
- Calendar facts are strict. For example, June 12, 2026 is Friday, June 11, 2026 is Thursday, and June 9, 2026 is Tuesday.
- If the caller says a date without a year, use the next upcoming instance of that month/day in the clinic timezone.
- Do not change a caller's requested date to a different date unless the requested date/time is unavailable or in the past.
- If the caller asks for a doctor, specialty, or timing that is unavailable, offer the nearest valid option from the portal data.
- Verify the weekday and calendar date match before confirming. For example, if the caller says a date with the wrong weekday, clarify and correct it before booking.
- Do not invent availability. A doctor is available only on the exact weekdays and time windows listed in the portal data.
- Before confirming an appointment, collect patient name, caller phone number if available, doctor or specialty, exact date, and exact time.
- Never confirm appointments in the past.
- When the caller agrees to a slot, call the bookAppointment tool before saying the appointment is scheduled.
- Never say the appointment is booked, confirmed, scheduled, or all set until the bookAppointment tool returns Success.
- If the bookAppointment tool returns Failed, do not confirm the appointment. Explain the reason in simple words and offer another available slot from the portal data.
- If the caller accepts a new slot after a Failed booking result, immediately call bookAppointment again for that exact new slot before confirming.
- After a successful booking, repeat the patient name, doctor, date, and time.

Rescheduling behavior:
- If the caller wants to reschedule, collect patient name, phone number, current appointment date/time if they know it, doctor/specialty, and the new requested date/time.
- Call the rescheduleAppointment tool before saying the appointment has been changed.
- Never say the appointment is rescheduled, updated, confirmed, or all set until the rescheduleAppointment tool returns Success.
- If the rescheduleAppointment tool returns Failed, explain the reason and ask for the missing detail or offer a different valid slot.`;
};

export const appointmentAnalysisPlan = {
  summaryPrompt: 'Summarize the call in 2-3 sentences. Include whether an appointment was requested, confirmed, cancelled, escalated, or left unresolved.',
  structuredDataPrompt: 'Extract appointment booking details from the call transcript. Only set appointmentBooked to true when the assistant clearly confirmed an appointment. appointmentTime must be an ISO 8601 date-time when a specific date and time were confirmed. Include the doctor name or specialty that the patient requested.',
  structuredDataSchema: {
    type: 'object',
    properties: {
      appointmentBooked: {
        type: 'boolean',
        description: 'True only if an appointment was clearly confirmed during the call.',
      },
      patientName: {
        type: 'string',
        description: 'Patient full name if collected.',
      },
      patientPhone: {
        type: 'string',
        description: 'Patient callback phone number if collected.',
      },
      doctorName: {
        type: 'string',
        description: 'Doctor name if confirmed.',
      },
      specialty: {
        type: 'string',
        description: 'Medical specialty requested or confirmed.',
      },
      appointmentTime: {
        type: 'string',
        format: 'date-time',
        description: 'Confirmed appointment date and time as ISO 8601.',
      },
      reason: {
        type: 'string',
        description: 'Short reason for the appointment.',
      },
      bookingStatus: {
        type: 'string',
        enum: ['confirmed', 'requested', 'cancelled', 'not-booked', 'unknown'],
      },
    },
    required: ['appointmentBooked', 'bookingStatus'],
  },
};
