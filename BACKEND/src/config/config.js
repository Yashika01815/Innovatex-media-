/**
 * App configuration.
 * FILE: src/config/config.js
 *
 * WHAT CHANGED:
 *   - Removed JWT_SECRET check (old — never existed in this project)
 *   - JWT is validated by env.js using JWT_ACCESS_SECRET + JWT_REFRESH_SECRET
 */

import dotenv from 'dotenv';
dotenv.config();

if (!process.env.PORT) {
  throw new Error('PORT not found in environment variables');
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI not found in environment variables');
}

const config = {
  PORT:        process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV:    process.env.NODE_ENV || 'development',
};

export default config;