import Setting from '../models/Setting.js';
import Hospital from '../models/Hospital.js';
import { ErrorResponse } from '../middlewares/error.js';

// @desc    Get hospital settings and clinic metadata
// @route   GET /api/v1/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    if (!req.hospitalId) {
      return next(new ErrorResponse('Cannot retrieve settings without clinic context', 400));
    }

    let setting = await Setting.findOne({ hospitalId: req.hospitalId });
    if (!setting) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const businessHours = days.map((day) => ({
        dayOfWeek: day,
        isOpen: day !== 'Sunday',
        openTime: '09:00',
        closeTime: '17:00',
      }));

      setting = await Setting.create({
        hospitalId: req.hospitalId,
        businessHours,
      });
    }

    const hospital = await Hospital.findById(req.hospitalId);

    res.status(200).json({
      success: true,
      data: {
        hospital,
        settings: setting,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update operating configurations
// @route   PUT /api/v1/settings
// @access  Private (Hospital Admin)
export const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ hospitalId: req.hospitalId });
    if (!setting) {
      return next(new ErrorResponse('Settings configuration not found', 404));
    }

    setting = await Setting.findByIdAndUpdate(setting._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update basic hospital details (logo, timezone, name)
// @route   PUT /api/v1/settings/hospital
// @access  Private (Hospital Admin)
export const updateHospitalProfile = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.hospitalId);
    if (!hospital) {
      return next(new ErrorResponse('Hospital profile not found', 404));
    }

    hospital = await Hospital.findByIdAndUpdate(req.hospitalId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
};
