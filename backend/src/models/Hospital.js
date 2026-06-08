import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    subscription: {
      planId: { type: String, default: 'free' },
      stripeCustomerId: { type: String, default: '' },
      expiresAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
