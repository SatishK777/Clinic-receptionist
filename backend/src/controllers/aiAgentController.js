import AIAgent from '../models/AIAgent.js';
import Doctor from '../models/Doctor.js';
import Setting from '../models/Setting.js';
import { ErrorResponse } from '../middlewares/error.js';
import { toVapiAssistantPayload } from '../utils/vapiAssistantPayload.js';

// @desc    Get active AI Receptionist configuration
// @route   GET /api/v1/ai-agents
// @access  Private
export const getAIAgent = async (req, res, next) => {
  try {
    if (!req.hospitalId) {
      return next(new ErrorResponse('Cannot retrieve AI config without clinic context', 400));
    }

    let agent = await AIAgent.findOne({ hospitalId: req.hospitalId });
    if (!agent) {
      // Fallback fallback constructor if not created on signup
      agent = await AIAgent.create({
        hospitalId: req.hospitalId,
        systemPrompt: 'You are a warm, helpful AI front-desk receptionist for our medical clinic. Your goal is to gather patient name, phone number, choose a doctor and schedule an appointment. Use the live portal data below as the source of truth for current clinic date, timezone, doctors, hours, and availability. Crucial: You must never book an appointment for a date or time in the past. If the patient requests a past slot, inform them it has already passed and guide them to choose a future slot.',
        greetingMessage: 'Thank you for calling. This is the clinic AI receptionist. How can I help you today?',
      });
    }

    res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update AI prompt settings (syncs to Vapi assistant in prod)
// @route   PUT /api/v1/ai-agents/:id
// @access  Private (Hospital Admin)
export const updateAIAgent = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    let agent = await AIAgent.findOne(query);
    if (!agent) {
      return next(new ErrorResponse('AI Config profile not found', 404));
    }

    agent = await AIAgent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    let vapiSync = {
      attempted: false,
      success: false,
      message: 'Vapi sync skipped because VAPI_API_KEY or Vapi Assistant ID is missing.',
    };

    // Synchronize to Vapi if API key and Assistant ID are present
    if (process.env.VAPI_API_KEY && agent.vapiAssistantId) {
      vapiSync = {
        attempted: true,
        success: false,
        message: 'Vapi sync did not complete.',
      };

      try {
        const headers = {
          'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        };

        const currentAssistantRes = await fetch(`https://api.vapi.ai/assistant/${agent.vapiAssistantId}`, {
          method: 'GET',
          headers,
        });
        const currentAssistant = currentAssistantRes.ok
          ? await currentAssistantRes.json()
          : {};

        const [doctors, setting] = await Promise.all([
          Doctor.find({ hospitalId: agent.hospitalId, status: 'active' }).sort({ name: 1 }),
          Setting.findOne({ hospitalId: agent.hospitalId }),
        ]);

        const patchBody = toVapiAssistantPayload(agent, {
          ...currentAssistant,
          portalDoctors: doctors,
          portalSetting: setting,
        });

        const vapiRes = await fetch(`https://api.vapi.ai/assistant/${agent.vapiAssistantId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patchBody)
        });

        if (!vapiRes.ok) {
          const errData = await vapiRes.json().catch(() => ({}));
          vapiSync.message = errData.message || 'Failed to sync assistant settings to Vapi.';
          vapiSync.error = errData;
          console.error('[Vapi Sync Error]: Failed to sync to Vapi:', errData);
        } else {
          vapiSync.success = true;
          vapiSync.message = 'Successfully synchronized agent prompt to Vapi.';
          console.log('[Vapi Sync Success]: Successfully synchronized agent prompt to Vapi.');
        }
      } catch (err) {
        vapiSync.message = err.message;
        console.error('[Vapi Sync Exception]: Failed to synchronize agent prompt to Vapi:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      data: agent,
      vapiSync,
    });
  } catch (error) {
    next(error);
  }
};
