import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { ErrorResponse } from '../middlewares/error.js';

// @desc    Get all appointments for the clinic
// @route   GET /api/v1/appointments
// @access  Private
export const getAppointments = async (req, res, next) => {
  try {
    const query = req.hospitalId ? { hospitalId: req.hospitalId } : {};

    // Filter by doctor
    if (req.query.doctorId) {
      query.doctorId = req.query.doctorId;
    }
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    // Text search on patient name or phone
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { patientName: searchRegex },
        { patientPhone: searchRegex },
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization')
      .sort({ appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new appointment
// @route   POST /api/v1/appointments
// @access  Private
export const createAppointment = async (req, res, next) => {
  try {
    if (!req.hospitalId) {
      return next(new ErrorResponse('Cannot schedule appointment without clinic context', 400));
    }

    req.body.hospitalId = req.hospitalId;

    // Verify doctor exists and belongs to the hospital tenant
    const doctor = await Doctor.findOne({ _id: req.body.doctorId, hospitalId: req.hospitalId });
    if (!doctor) {
      return next(new ErrorResponse('Doctor not found or not active in this clinic', 404));
    }

    const appointment = await Appointment.create(req.body);
    const populated = await appointment.populate('doctorId', 'name specialization');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update / Reschedule appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private
export const updateAppointment = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    let appointment = await Appointment.findOne(query);
    if (!appointment) {
      return next(new ErrorResponse('Appointment booking not found', 404));
    }

    // Check doctor changes
    if (req.body.doctorId) {
      const doctor = await Doctor.findOne({ _id: req.body.doctorId, hospitalId: req.hospitalId });
      if (!doctor) {
        return next(new ErrorResponse('Doctor not found or not active in this clinic', 404));
      }
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('doctorId', 'name specialization');

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment booking
// @route   DELETE /api/v1/appointments/:id
// @access  Private
export const deleteAppointment = async (req, res, next) => {
  try {
    const query = req.hospitalId
      ? { _id: req.params.id, hospitalId: req.hospitalId }
      : { _id: req.params.id };

    const appointment = await Appointment.findOne(query);
    if (!appointment) {
      return next(new ErrorResponse('Appointment booking not found', 404));
    }

    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
