import mongoose from 'mongoose';

const phoneNumberSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    twilioSid: {
      type: String,
      default: '',
    },
    vapiAssistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAgent',
      required: true,
    },
    department: {
      type: String,
      default: 'General Reception',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema);
export default PhoneNumber;
