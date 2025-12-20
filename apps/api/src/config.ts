import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/croco_flag',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpirySeconds: parseInt(process.env.JWT_EXPIRY_SECONDS || '86400', 10), // 24 hours

  // Bcrypt
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
} as const;

// Validate required env vars in production
if (config.nodeEnv === 'production') {
  const required = ['JWT_SECRET', 'DATABASE_URL'] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  if (config.jwtSecret === 'dev-secret-change-in-production') {
    throw new Error('JWT_SECRET must be changed in production');
  }
}
