import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const REQUIRED_VARS = [
  'PORT',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
];

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n❌ Missing required environment variables:\n` +
      missing.map((k) => `   • ${k}`).join('\n') +
      `\n\nAdd these to your .env file and restart the server.\n`
    );
  }

  // Validate JWT secret strength
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters for security');
  }
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters for security');
  }

  // Validate ENCRYPTION_KEY format
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).\n' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must contain only hex characters (0-9, a-f)');
  }
};

validateEnv();

export default validateEnv;