import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ErrorResponse } from './error.js';

export const protect = async (req, res, next) => {
  let token;

  // Check headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorResponse('No user found with this id', 401));
    }

    if (user.status !== 'active') {
      return next(new ErrorResponse('User account is inactive', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};
