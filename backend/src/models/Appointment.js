import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient phone is required'],
      trim: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    appointmentTime: {
      type: Date,
      required: [true, 'Appointment time is required'],
      index: true,
    },
    duration: {
      type: Number, // In minutes
      default: 30,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'pending'],
      default: 'scheduled',
      index: true,
    },
    source: {
      type: String,
      enum: ['ai-call', 'receptionist', 'portal'],
      default: 'receptionist',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
