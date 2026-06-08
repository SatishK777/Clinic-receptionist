import { ErrorResponse } from './error.js';
import mongoose from 'mongoose';

export const resolveTenant = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Authentication context required for tenant resolution', 401));
  }

  // Super admins are global, they can pass an optional X-Tenant-ID header or query param
  if (req.user.role === 'super-admin') {
    const tenantId = req.headers['x-tenant-id'] || req.query.hospitalId;
    if (tenantId) {
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return next(new ErrorResponse('Invalid tenant id', 400));
      }
      req.hospitalId = tenantId;
    } else {
      req.hospitalId = null; // Access global analytics or hospital profiles
    }
    return next();
  }

  // Regular hospital-level users are locked to their own tenant context
  if (!req.user.hospitalId) {
    return next(new ErrorResponse('User has no associated hospital tenant isolation context', 403));
  }

  req.hospitalId = req.user.hospitalId;
  next();
};
