import Doctor from '../models/Doctor.js';
import { ErrorResponse } from '../middlewares/error.js';

// @desc    Get all doctors for the current clinic
// @route   GET /api/v1/doctors
// @access  Private
export const getDoctors = async (req, res, next) => {
  try {
    // If hospitalId is null (e.g. Super Admin doing global search), allow fetching all or filter if query param is set
    const query = req.hospitalId ? { hospitalId: req.hospitalId } : {};
    const doctors = await Doctor.find(query);
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a doctor profile
// @route   POST /api/v1/doctors
// @access  Private (Hospital Admin)
export const createDoctor = async (req, res, next) => {
  try {
    if (!req.hospitalId) {
      return next(new ErrorResponse('Cannot create doctor without clinic context', 400));
    }
    
    req.body.hospitalId = req.hospitalId;
    const doctor = await Doctor.create(req.body);
    
    res.status(201).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/v1/doctors/:id
// @access  Private (Hospital Admin)
export const updateDoctor = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    let doctor = await Doctor.findOne(query);
    if (!doctor) {
      return next(new ErrorResponse('Doctor profile not found', 404));
    }

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove doctor profile
// @route   DELETE /api/v1/doctors/:id
// @access  Private (Hospital Admin)
export const deleteDoctor = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      return next(new ErrorResponse('Doctor profile not found', 404));
    }

    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
