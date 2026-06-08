import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      unique: true,
      index: true,
    },
    businessHours: [
      {
        dayOfWeek: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '17:00' },
      },
    ],
    notifications: {
      emailAlerts: { type: Boolean, default: true },
      smsEscalations: { type: Boolean, default: false },
      escalationPhone: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
