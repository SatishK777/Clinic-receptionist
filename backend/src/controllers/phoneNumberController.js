import PhoneNumber from '../models/PhoneNumber.js';
import AIAgent from '../models/AIAgent.js';
import { ErrorResponse } from '../middlewares/error.js';

// @desc    Get all phone numbers for the tenant
// @route   GET /api/v1/phone-numbers
// @access  Private
export const getPhoneNumbers = async (req, res, next) => {
  try {
    const query = req.hospitalId ? { hospitalId: req.hospitalId } : {};
    const phoneNumbers = await PhoneNumber.find(query).populate('vapiAssistantId', 'name');
    
    res.status(200).json({
      success: true,
      count: phoneNumbers.length,
      data: phoneNumbers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Provision / Link a new Twilio number
// @route   POST /api/v1/phone-numbers/assign
// @access  Private (Hospital Admin / Super Admin)
export const assignPhoneNumber = async (req, res, next) => {
  const { phoneNumber, department, twilioSid } = req.body;

  try {
    if (!req.hospitalId) {
      return next(new ErrorResponse('Cannot assign numbers without clinic context', 400));
    }

    // Check if the hospital already has an AI agent configuration
    const agent = await AIAgent.findOne({ hospitalId: req.hospitalId });
    if (!agent) {
      return next(
        new ErrorResponse(
          'Please configure your AI Agent prompt first before provisioning phone numbers',
          400
        )
      );
    }

    // Check if number is already in use
    const exists = await PhoneNumber.findOne({ phoneNumber });
    if (exists) {
      return next(new ErrorResponse('Phone number is already registered on our platform', 400));
    }

    // Use provided Twilio SID or generate a mock one
    const sid = twilioSid || ('PN' + Math.random().toString(36).substr(2, 9).toUpperCase());

    const phone = await PhoneNumber.create({
      hospitalId: req.hospitalId,
      phoneNumber,
      twilioSid: sid,
      vapiAssistantId: agent._id,
      department: department || 'General Reception',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: phone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mapping or status of phone routing
// @route   PUT /api/v1/phone-numbers/:id
// @access  Private (Hospital Admin)
export const updatePhoneNumber = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    let phone = await PhoneNumber.findOne(query);
    if (!phone) {
      return next(new ErrorResponse('Phone mapping not found', 404));
    }

    phone = await PhoneNumber.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: phone,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Remove a phone number mapping
// @route   DELETE /api/v1/phone-numbers/:id
// @access  Private (Hospital Admin)
export const deletePhoneNumber = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    const phone = await PhoneNumber.findOne(query);
    if (!phone) {
      return next(new ErrorResponse('Phone mapping not found', 404));
    }

    await phone.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
