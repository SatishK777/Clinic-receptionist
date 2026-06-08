import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    vapiCallId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    twilioCallSid: {
      type: String,
      default: '',
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient phone is required'],
      trim: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'inbound',
    },
    status: {
      type: String,
      enum: ['queued', 'ringing', 'in-progress', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    duration: {
      type: Number, // In seconds
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
      index: true,
    },
    escalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    appointmentBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
    appointmentBookingStatus: {
      type: String,
      enum: ['not-attempted', 'created', 'failed'],
      default: 'not-attempted',
      index: true,
    },
    appointmentBookingError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Call = mongoose.model('Call', callSchema);
export default Call;
