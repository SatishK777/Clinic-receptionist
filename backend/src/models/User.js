import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function () {
        return this.role !== 'super-admin';
      },
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['super-admin', 'hospital-admin', 'receptionist', 'doctor'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    refreshToken: {
      type: String,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify passwords
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
