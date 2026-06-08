import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, hospitalId: user.hospitalId },
    process.env.JWT_SECRET || 'secret_key_123',
    { expiresIn: '15m' } // 15 mins for access token
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_123',
    { expiresIn: '7d' } // 7 days for refresh token
  );
};
