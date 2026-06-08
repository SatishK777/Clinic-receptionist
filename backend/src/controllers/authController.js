import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import AIAgent from '../models/AIAgent.js';
import Setting from '../models/Setting.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { ErrorResponse } from '../middlewares/error.js';

// @desc    Register a new Hospital Admin and Hospital (Onboarding)
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { hospitalName, subdomain, adminName, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Check if subdomain is taken
    const hospitalExists = await Hospital.findOne({ subdomain });
    if (hospitalExists) {
      return next(new ErrorResponse('Subdomain is already in use', 400));
    }

    // Create Hospital
    const hospital = await Hospital.create({
      name: hospitalName,
      subdomain: subdomain,
    });

    // Create default AI Agent config for this hospital
    const aiAgent = await AIAgent.create({
      hospitalId: hospital._id,
      name: 'Clinical AI Receptionist',
      systemPrompt: 'You are a warm, helpful AI front-desk receptionist for our medical clinic. Your goal is to gather patient name, phone number, choose a doctor and schedule an appointment. Use the live portal data below as the source of truth for current clinic date, timezone, doctors, hours, and availability. Crucial: You must never book an appointment for a date or time in the past. If the patient requests a past slot, inform them it has already passed and guide them to choose a future slot.',
      greetingMessage: `Thank you for calling ${hospitalName}. This is the clinic AI receptionist. How can I help you today?`,
    });

    // Create default settings (business hours Mon-Sun 9-5)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const businessHours = days.map((day) => ({
      dayOfWeek: day,
      isOpen: day !== 'Sunday', // Open Mon-Sat
      openTime: '09:00',
      closeTime: '17:00',
    }));

    await Setting.create({
      hospitalId: hospital._id,
      businessHours,
      notifications: {
        emailAlerts: true,
        smsEscalations: false,
        escalationPhone: '',
      },
    });

    // Hash Password & Create Admin User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      hospitalId: hospital._id,
      name: adminName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'hospital-admin',
      status: 'active',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: hospital.name,
        hospitalSubdomain: hospital.subdomain,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (user.status !== 'active') {
      return next(new ErrorResponse('User account is suspended or inactive', 403));
    }

    const hospital = user.hospitalId ? await Hospital.findById(user.hospitalId) : null;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: hospital?.name,
        hospitalSubdomain: hospital?.subdomain,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh session token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token is required', 400));
  }

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    // Sign new access token
    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout / Invalidate token
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = '';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Mock
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new ErrorResponse('User email not found', 404));
    }
    // Simply return success with placeholder token for manual verification/simulation
    res.status(200).json({
      success: true,
      message: 'Password recovery email sent (simulation)',
      resetToken: 'mock_reset_token_xyz_123',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password Mock
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { password } = req.body;
  try {
    // Normally we check a reset token in database. For the simulation:
    // Update the password of a demo user or return success
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
