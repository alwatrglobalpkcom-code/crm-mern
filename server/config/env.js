/**
 * Centralized env config. Validates required vars in production.
 */
const isProd = process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required. Add it to .env');
  if (isProd && secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
  return secret;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  getJwtSecret,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 2 * 1024 * 1024
};
