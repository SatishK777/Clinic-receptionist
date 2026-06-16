import Call from '../models/Call.js';
import AIAgent from '../models/AIAgent.js';
import PhoneNumber from '../models/PhoneNumber.js';
import Doctor from '../models/Doctor.js';
import Setting from '../models/Setting.js';
import { ErrorResponse } from '../middlewares/error.js';
import { toVapiAssistantPayload } from '../utils/vapiAssistantPayload.js';
import {
  createAppointmentFromCall,
  extractAppointmentData,
  inferAppointmentDataFromText,
  parseToolArguments,
  rescheduleAppointmentFromCall,
} from '../utils/appointmentAutomation.js';

const getToolCalls = (message = {}) => {
  if (Array.isArray(message.toolCalls)) return message.toolCalls;
  if (Array.isArray(message.toolCallList)) return message.toolCallList;
  if (Array.isArray(message.toolWithToolCallList)) {
    return message.toolWithToolCallList.map((entry) => ({
      id: entry.toolCall?.id,
      name: entry.name || entry.toolCall?.name,
      arguments: entry.toolCall?.arguments || entry.toolCall?.parameters,
      function: {
        name: entry.name || entry.toolCall?.name,
        arguments: entry.toolCall?.arguments || entry.toolCall?.parameters,
      },
    }));
  }
  return [];
};

// @desc    Get all calls for the tenant
// @route   GET /api/v1/calls
// @access  Private
export const getCalls = async (req, res, next) => {
  try {
    const query = req.hospitalId ? { hospitalId: req.hospitalId } : {};

    // Filters
    if (req.query.sentiment) {
      query.sentiment = req.query.sentiment;
    }
    if (req.query.escalated) {
      query.escalated = req.query.escalated === 'true';
    }
    if (req.query.appointmentBooked) {
      query.appointmentBooked = req.query.appointmentBooked === 'true';
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.patientPhone = searchRegex;
    }

    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const total = await Call.countDocuments(query);
    const calls = await Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: calls.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: calls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single call log detail
// @route   GET /api/v1/calls/:id
// @access  Private
export const getCall = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    const call = await Call.findOne(query);
    if (!call) {
      return next(new ErrorResponse('Call record not found', 404));
    }

    res.status(200).json({
      success: true,
      data: call,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive webhook event notifications from Vapi
// @route   POST /api/v1/calls/webhook
// @access  Public
export const handleVapiWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Log the incoming message type for monitoring
    const messageType = payload.message?.type;
    console.log(`Vapi Webhook Received: type = ${messageType}`);

    if (messageType === 'assistant-request') {
      const call = payload.message.call || {};
      const assistantId = call.assistantId;

      // Resolve Tenant hospitalId & AIAgent
      let hospitalId = null;
      let agent = null;

      if (assistantId) {
        agent = await AIAgent.findOne({ vapiAssistantId: assistantId });
        if (agent) hospitalId = agent.hospitalId;
      }
      if (!hospitalId && call.phoneNumber?.number) {
        const phone = await PhoneNumber.findOne({ phoneNumber: call.phoneNumber.number });
        if (phone) {
          hospitalId = phone.hospitalId;
          agent = await AIAgent.findOne({ hospitalId });
        }
      }
      if (!agent) {
        // Fallback: Use first AIAgent record in the DB
        agent = await AIAgent.findOne();
      }

      if (!agent) {
        console.warn(`[Assistant Request] No AI Agent configuration found in DB for assistantId: ${assistantId}`);
        return res.status(200).json({});
      }

      console.log(`[Assistant Request] Exposing dynamic prompt & greeting for assistantId: ${agent.vapiAssistantId}`);

      const [doctors, setting] = await Promise.all([
        Doctor.find({ hospitalId: agent.hospitalId, status: 'active' }).sort({ name: 1 }),
        Setting.findOne({ hospitalId: agent.hospitalId }),
      ]);

      // Respond to Vapi with dynamic overrides reflecting settings in our database
      return res.status(200).json({
        assistantId: agent.vapiAssistantId || assistantId,
        assistantOverrides: toVapiAssistantPayload(agent, {
          portalDoctors: doctors,
          portalSetting: setting,
        }),
      });
    }

    if (messageType === 'tool-calls') {
      const toolCalls = getToolCalls(payload.message);
      const call = payload.message.call || {};
      const assistantId = call.assistantId;
      const patientPhone = call.customer?.number || 'Unknown';

      // Resolve Tenant hospitalId
      let hospitalId = null;
      if (assistantId) {
        const agent = await AIAgent.findOne({ vapiAssistantId: assistantId });
        if (agent) hospitalId = agent.hospitalId;
      }
      if (!hospitalId && call.phoneNumber?.number) {
        const phone = await PhoneNumber.findOne({ phoneNumber: call.phoneNumber.number });
        if (phone) hospitalId = phone.hospitalId;
      }
      if (!hospitalId) {
        const fallbackHospital = await AIAgent.findOne();
        if (fallbackHospital) hospitalId = fallbackHospital.hospitalId;
      }

      const results = [];

      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id;
        const fn = toolCall.function || {};
        const toolName = fn.name || toolCall.name;
        const toolArgs = fn.arguments || toolCall.arguments || toolCall.parameters;
        if (toolName === 'bookAppointment') {
          const { patientName, patientPhone: providedPatientPhone, doctorName, specialty, appointmentTime, reason } = parseToolArguments(toolArgs);
          
          const bookingResult = await createAppointmentFromCall({
              hospitalId,
              patientName,
              patientPhone: providedPatientPhone || patientPhone,
              doctorName,
              specialty,
              appointmentTime,
              reason,
              summary: 'Booked mid-call via Vapi tool calling.',
          });

          if (bookingResult.created) {
            results.push({
              name: toolName,
              toolCallId,
              result: `Success: Appointment booked for ${patientName || 'the patient'} with ${bookingResult.doctor.name} at ${bookingResult.appointment.appointmentTime.toISOString()}.`
            });
          } else {
            const clinicTimeZone = process.env.CLINIC_TIMEZONE || 'Asia/Kolkata';
            const clinicNow = new Intl.DateTimeFormat('en-US', {
              timeZone: clinicTimeZone,
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }).format(new Date());
            results.push({
              name: toolName,
              toolCallId,
              result: `Failed: ${bookingResult.reason} Current clinic date and time is ${clinicNow} (${clinicTimeZone}). Do not offer or confirm any date or time before this. Ask the caller to choose a future available slot.`
            });
          }
        } else if (toolName === 'rescheduleAppointment') {
          const {
            patientName,
            patientPhone: providedPatientPhone,
            doctorName,
            specialty,
            currentAppointmentTime,
            newAppointmentTime,
            reason,
          } = parseToolArguments(toolArgs);

          const rescheduleResult = await rescheduleAppointmentFromCall({
            hospitalId,
            patientName,
            patientPhone: providedPatientPhone || patientPhone,
            doctorName,
            specialty,
            currentAppointmentTime,
            newAppointmentTime,
            reason,
            summary: 'Rescheduled mid-call via Vapi tool calling.',
          });

          if (rescheduleResult.updated) {
            results.push({
              name: toolName,
              toolCallId,
              result: `Success: Appointment rescheduled for ${patientName || 'the patient'} with ${rescheduleResult.doctor.name} at ${rescheduleResult.appointment.appointmentTime.toISOString()}.`
            });
          } else {
            results.push({
              name: toolName,
              toolCallId,
              result: `Failed: ${rescheduleResult.reason}`
            });
          }
        } else {
          results.push({
            name: toolName,
            toolCallId,
            result: "Tool function name not recognized."
          });
        }
      }

      return res.status(200).json({ results });
    }

    if (messageType === 'end-of-call-report') {
      const { call, transcript, summary, analysis, recordingUrl } = payload.message;
      const vapiCallId = call.id;
      const assistantId = call.assistantId;
      const patientPhone = call.customer?.number || 'Unknown';
      const duration = call.duration ? Math.round(call.duration) : 0;
      
      // Resolve Tenant hospitalId
      let hospitalId = null;
      
      // Attempt 1: Check by assistantId mapping
      if (assistantId) {
        const agent = await AIAgent.findOne({ vapiAssistantId: assistantId });
        if (agent) {
          hospitalId = agent.hospitalId;
        }
      }
      
      // Attempt 2: Check by dialing phone number mapping
      if (!hospitalId && call.phoneNumber?.number) {
        const phone = await PhoneNumber.findOne({ phoneNumber: call.phoneNumber.number });
        if (phone) {
          hospitalId = phone.hospitalId;
        }
      }
      
      // Fallback: If no tenant is matched, reject or log to a default testing clinic
      if (!hospitalId) {
        console.warn(`No active hospital tenant matched for assistantId: ${assistantId}. Using fallback or skipping.`);
        // For testing/sandboxing, fetch the first hospital
        const fallbackHospital = await AIAgent.findOne();
        if (fallbackHospital) {
          hospitalId = fallbackHospital.hospitalId;
        } else {
          return res.status(400).json({ success: false, error: 'Tenant context could not be resolved' });
        }
      }

      let enrichedCall = null;
      if (process.env.VAPI_API_KEY && vapiCallId) {
        try {
          const vapiCallRes = await fetch(`https://api.vapi.ai/call/${vapiCallId}`, {
            headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
          });
          if (vapiCallRes.ok) {
            enrichedCall = await vapiCallRes.json();
          }
        } catch (err) {
          console.warn(`[Vapi Call Fetch Warning] Could not fetch completed call ${vapiCallId}: ${err.message}`);
        }
      }

      // Analyze outcomes
      const callAnalysis = {
        ...(enrichedCall?.analysis || {}),
        ...(call.analysis || {}),
        ...(analysis || {}),
      };
      const callSummary = summary || callAnalysis.summary || enrichedCall?.summary || 'No summary provided.';
      const sentiment = (callAnalysis?.sentiment || 'neutral').toLowerCase();
      // Determine if a human handoff was requested
      const escalated = transcript?.toLowerCase().includes('speak to a human') || 
                        transcript?.toLowerCase().includes('transfer me') || 
                        call.endedReason === 'forwarded-to-number';

      // Parse structured appointment booking data if present
      // We look for structuredData from LLM parser: { patientName, doctorName, date }
      let structuredData = extractAppointmentData({
        ...payload.message,
        call: enrichedCall || call,
        analysis: callAnalysis,
        artifact: enrichedCall?.artifact || payload.message.artifact,
      });
      if (!structuredData.appointmentTime) {
        structuredData = await inferAppointmentDataFromText({
          hospitalId,
          text: `${transcript || enrichedCall?.transcript || ''}\n${callSummary}`,
          patientPhone,
        });
      }
      let appointmentBooked = false;
      let appointmentBookingStatus = 'not-attempted';
      let appointmentBookingError = '';
      
      if (structuredData.appointmentBooked === true || 
          structuredData.bookingSuccessful === true ||
          structuredData.bookingStatus === 'confirmed' ||
          transcript?.toLowerCase().includes('appointment has been booked') ||
          transcript?.toLowerCase().includes('appointment scheduled')) {
        appointmentBooked = true;
      }

      // Auto-Schedule Appointment in DB if booking details are extracted
      if (appointmentBooked && structuredData.appointmentTime) {
        appointmentBookingStatus = 'failed';
        const bookingResult = await createAppointmentFromCall({
          hospitalId,
          patientName: structuredData.patientName,
          patientPhone: structuredData.patientPhone || patientPhone,
          doctorName: structuredData.doctorName,
          specialty: structuredData.specialty,
          appointmentTime: structuredData.appointmentTime,
          reason: structuredData.reason,
          summary: callSummary,
          dedupePatientDay: true,
        });

        appointmentBooked = bookingResult.created;
        if (bookingResult.created) {
          appointmentBookingStatus = 'created';
          console.log(`Successfully auto-booked appointment for ${bookingResult.appointment.patientName} with ${bookingResult.doctor.name}`);
        } else {
          appointmentBookingError = bookingResult.reason;
          console.warn(`[Auto-Booking Guard] ${bookingResult.reason}`);
        }
      } else if (appointmentBooked) {
        appointmentBooked = false;
        appointmentBookingStatus = 'failed';
        appointmentBookingError = 'Booking was mentioned, but no valid appointment date/time was extracted.';
      }

      // Save call document after auto-booking guards have finalized the status
      const callLog = await Call.findOneAndUpdate(
        { vapiCallId },
        {
          hospitalId,
          vapiCallId,
          twilioCallSid: call.twilioCallSid || '',
          patientPhone,
          direction: call.type === 'outboundPhoneCall' ? 'outbound' : 'inbound',
          status: 'completed',
          duration,
          recordingUrl: recordingUrl || '',
          transcript: transcript || '',
          summary: callSummary,
          sentiment,
          escalated,
          appointmentBooked,
          appointmentBookingStatus,
          appointmentBookingError,
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, data: callLog });
    }

    res.status(200).json({ success: true, message: 'Webhook event processed' });
  } catch (error) {
    next(error);
  }
};
