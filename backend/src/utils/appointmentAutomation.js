import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeName = (value = '') => {
  return value
    .toLowerCase()
    .replace(/\bdr\.?\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getNameTokens = (value = '') => {
  return normalizeName(value)
    .split(' ')
    .filter((token) => token.length >= 3);
};

const specialtyAliases = {
  cardiology: ['cardiology', 'cardiologist', 'heart', 'cardiac'],
  heart: ['heart', 'cardiology', 'cardiologist', 'cardiac'],
};

const specialtyMatches = (doctorSpecialty = '', requestedSpecialty = '') => {
  const doctorText = normalizeName(doctorSpecialty);
  const requestedText = normalizeName(requestedSpecialty);
  if (!doctorText || !requestedText) return false;

  if (doctorText.includes(requestedText) || requestedText.includes(doctorText)) return true;

  const doctorTokens = getNameTokens(doctorText);
  const requestedTokens = getNameTokens(requestedText);
  if (doctorTokens.some((token) => requestedTokens.includes(token))) return true;

  return Object.values(specialtyAliases).some((aliases) => {
    const doctorHasAlias = aliases.some((alias) => doctorText.includes(alias));
    const requestedHasAlias = aliases.some((alias) => requestedText.includes(alias));
    return doctorHasAlias && requestedHasAlias;
  });
};

const getMinutes = (time = '') => {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isDoctorAvailableAt = (doctor, appointmentTime) => {
  const dayOfWeek = DAY_NAMES[appointmentTime.getDay()];
  const minutes = appointmentTime.getHours() * 60 + appointmentTime.getMinutes();

  return doctor.availableHours?.some((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false;

    const start = getMinutes(slot.startTime);
    const end = getMinutes(slot.endTime);
    if (start === null || end === null) return false;

    return minutes >= start && minutes < end;
  });
};

export const extractAppointmentData = (message = {}) => {
  const candidates = [
    message.analysis?.structuredData,
    message.call?.analysis?.structuredData,
  ];

  const structuredOutputs = message.artifact?.structuredOutputs || message.call?.artifact?.structuredOutputs;
  if (structuredOutputs && typeof structuredOutputs === 'object') {
    for (const output of Object.values(structuredOutputs)) {
      candidates.push(output?.result || output);
    }
  }

  return candidates.find((candidate) => candidate && typeof candidate === 'object') || {};
};

export const parseToolArguments = (args = {}) => {
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }

  return args && typeof args === 'object' ? args : {};
};

const hasConfirmedBookingLanguage = (text) => {
  return /\b(scheduled|booked|confirmed|appointment (?:has been )?(?:scheduled|booked|confirmed)|you are all set)\b/i.test(text);
};

const inferPatientName = (text) => {
  const patterns = [
    /\bmy name is\s+([a-z][a-z\s.'-]{1,60})(?=\.|,|\n|$)/i,
    /\bpatient name is\s+([a-z][a-z\s.'-]{1,60})(?=\.|,|\n|$)/i,
    /\bfor\s+([a-z][a-z\s.'-]{1,60})\s+(?:with|on|at)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return '';
};

const inferTime = (text, now = new Date()) => {
  const timeMatch = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] || 0);
  const meridiem = timeMatch[3].toLowerCase();

  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  const inferred = new Date(now);
  inferred.setSeconds(0, 0);

  if (/\btomorrow\b/i.test(text)) {
    inferred.setDate(inferred.getDate() + 1);
  } else {
    const weekdayIndex = DAY_NAMES.findIndex((day) => new RegExp(`\\b${day}\\b`, 'i').test(text));
    if (weekdayIndex >= 0) {
      const dayDelta = (weekdayIndex - inferred.getDay() + 7) % 7 || 7;
      inferred.setDate(inferred.getDate() + dayDelta);
    } else if (!/\btoday\b/i.test(text)) {
      return null;
    }
  }

  inferred.setHours(hours, minutes, 0, 0);
  return inferred.toISOString();
};

export const inferAppointmentDataFromText = async ({ hospitalId, text = '', patientPhone = '' }) => {
  if (!hospitalId || !text || !hasConfirmedBookingLanguage(text)) return {};

  const doctors = await Doctor.find({ hospitalId, status: 'active' });
  const doctor = doctors.find((candidate) => {
    const normalizedText = normalizeName(text);
    const doctorTokens = getNameTokens(candidate.name);

    return new RegExp(`\\b${escapeRegex(candidate.name)}\\b`, 'i').test(text) ||
      doctorTokens.some((token) => normalizedText.includes(token)) ||
      specialtyMatches(candidate.specialization, text);
  });

  const appointmentTime = inferTime(text);
  if (!doctor || !appointmentTime) return {};

  return {
    appointmentBooked: true,
    bookingStatus: 'confirmed',
    patientName: inferPatientName(text),
    patientPhone,
    doctorName: doctor.name,
    specialty: doctor.specialization,
    appointmentTime,
    reason: 'Inferred from confirmed call transcript or summary.',
  };
};

export const findMatchingDoctor = async ({ hospitalId, doctorName = '', specialty = '' }) => {
  const baseQuery = { hospitalId, status: 'active' };
  const doctors = await Doctor.find(baseQuery);

  if (doctorName) {
    const requestedTokens = getNameTokens(doctorName);
    const doctor = doctors.find((candidate) => {
      const candidateTokens = getNameTokens(candidate.name);
      return normalizeName(candidate.name).includes(normalizeName(doctorName)) ||
        requestedTokens.some((token) => candidateTokens.includes(token));
    });
    if (doctor) return doctor;
  }

  if (specialty) {
    const doctor = doctors.find((candidate) => specialtyMatches(candidate.specialization, specialty));
    if (doctor) return doctor;
  }

  return doctors[0] || null;
};

export const createAppointmentFromCall = async ({
  hospitalId,
  patientName,
  patientPhone,
  doctorName,
  specialty,
  appointmentTime,
  summary,
  reason,
}) => {
  if (!hospitalId) {
    return { created: false, reason: 'Clinic context could not be resolved.' };
  }

  const parsedTime = new Date(appointmentTime);
  if (!appointmentTime || Number.isNaN(parsedTime.getTime())) {
    return { created: false, reason: 'No valid appointment time was extracted.' };
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  if (parsedTime < cutoff) {
    return { created: false, reason: 'Appointment time is in the past.' };
  }

  const doctor = await findMatchingDoctor({ hospitalId, doctorName, specialty });
  if (!doctor) {
    return { created: false, reason: 'No active doctor matched the call details.' };
  }

  if (!isDoctorAvailableAt(doctor, parsedTime)) {
    return {
      created: false,
      reason: `${doctor.name} is not available at the requested time.`,
      doctor,
    };
  }

  const existing = await Appointment.findOne({
    hospitalId,
    doctorId: doctor._id,
    appointmentTime: parsedTime,
    status: { $in: ['scheduled', 'pending'] },
  });

  if (existing) {
    return {
      created: false,
      reason: `${doctor.name} already has an appointment at that time.`,
      doctor,
      existing,
    };
  }

  const appointment = await Appointment.create({
    hospitalId,
    patientName: patientName || 'Unknown Patient',
    patientPhone: patientPhone || 'Unknown',
    doctorId: doctor._id,
    appointmentTime: parsedTime,
    duration: doctor.consultationDuration || 30,
    source: 'ai-call',
    notes: `Auto-created from Vapi call summary. Reason: ${reason || 'Not provided'}. Summary: ${summary || 'No summary provided.'}`,
  });

  return { created: true, appointment, doctor };
};

export const rescheduleAppointmentFromCall = async ({
  hospitalId,
  patientName,
  patientPhone,
  doctorName,
  specialty,
  currentAppointmentTime,
  newAppointmentTime,
  summary,
  reason,
}) => {
  if (!hospitalId) {
    return { updated: false, reason: 'Clinic context could not be resolved.' };
  }

  const parsedNewTime = new Date(newAppointmentTime);
  if (!newAppointmentTime || Number.isNaN(parsedNewTime.getTime())) {
    return { updated: false, reason: 'No valid new appointment time was provided.' };
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  if (parsedNewTime < cutoff) {
    return { updated: false, reason: 'New appointment time is in the past.' };
  }

  const doctor = await findMatchingDoctor({ hospitalId, doctorName, specialty });
  if (!doctor) {
    return { updated: false, reason: 'No active doctor matched the reschedule request.' };
  }

  if (!isDoctorAvailableAt(doctor, parsedNewTime)) {
    return {
      updated: false,
      reason: `${doctor.name} is not available at the requested new time.`,
      doctor,
    };
  }

  const phoneDigits = (patientPhone || '').replace(/\D/g, '');
  const patientRegex = patientName ? new RegExp(escapeRegex(patientName), 'i') : null;

  const query = {
    hospitalId,
    status: { $in: ['scheduled', 'pending'] },
    $or: [],
  };

  if (phoneDigits) {
    query.$or.push({ patientPhone: { $regex: phoneDigits.slice(-10) } });
  }
  if (patientRegex) {
    query.$or.push({ patientName: patientRegex });
  }

  if (!query.$or.length) {
    return { updated: false, reason: 'Patient name or phone number is required to find the existing appointment.' };
  }

  let candidates = await Appointment.find(query)
    .populate('doctorId', 'name specialization')
    .sort({ appointmentTime: 1 });

  if (doctorName || specialty) {
    candidates = candidates.filter((appointment) => {
      const appointmentDoctor = appointment.doctorId;
      return appointmentDoctor &&
        (
          getNameTokens(doctorName).some((token) => getNameTokens(appointmentDoctor.name).includes(token)) ||
          specialtyMatches(appointmentDoctor.specialization, specialty) ||
          getNameTokens(appointmentDoctor.name).some((token) => getNameTokens(doctor.name).includes(token))
        );
    });
  }

  if (currentAppointmentTime) {
    const parsedCurrentTime = new Date(currentAppointmentTime);
    if (!Number.isNaN(parsedCurrentTime.getTime())) {
      const windowMs = 2 * 60 * 60 * 1000;
      candidates = candidates.filter((appointment) => {
        return Math.abs(new Date(appointment.appointmentTime).getTime() - parsedCurrentTime.getTime()) <= windowMs;
      });
    }
  }

  if (!candidates.length) {
    return { updated: false, reason: 'Could not find an existing scheduled appointment for those details.' };
  }

  if (candidates.length > 1 && !currentAppointmentTime) {
    return {
      updated: false,
      reason: 'Multiple matching appointments were found. Please ask for the current appointment date or time before rescheduling.',
    };
  }

  const existingAtNewTime = await Appointment.findOne({
    hospitalId,
    doctorId: doctor._id,
    appointmentTime: parsedNewTime,
    status: { $in: ['scheduled', 'pending'] },
    _id: { $ne: candidates[0]._id },
  });

  if (existingAtNewTime) {
    return {
      updated: false,
      reason: `${doctor.name} already has an appointment at the requested new time.`,
      doctor,
      existing: existingAtNewTime,
    };
  }

  const appointment = await Appointment.findByIdAndUpdate(
    candidates[0]._id,
    {
      doctorId: doctor._id,
      appointmentTime: parsedNewTime,
      duration: doctor.consultationDuration || candidates[0].duration || 30,
      status: 'scheduled',
      notes: `${candidates[0].notes || ''}\nRescheduled via Vapi call. Reason: ${reason || 'Not provided'}. Summary: ${summary || 'No summary provided.'}`.trim(),
    },
    { new: true }
  );

  return { updated: true, appointment, doctor };
};
