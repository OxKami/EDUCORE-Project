import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Please set it in your .env file.');
}

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production. Please set it in your .env file.');
}

// Parse CORS origin - supports comma-separated list for multiple origins
const corsOriginRaw = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOrigin = corsOriginRaw.includes(',')
  ? corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean)
  : corsOriginRaw;

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isProduction,
  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isProduction ? '' : 'dev-refresh-secret'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  cors: {
    origin: corsOrigin,
  },
};