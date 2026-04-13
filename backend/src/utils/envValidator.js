/**
 * Environment variable validator for production.
 * Ensures all required env vars are set before the app starts.
 */

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_URL',
];

const validateEnv = () => {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  // Warning for weak JWT_SECRET
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ WARNING: JWT_SECRET is too short. Use at least 32 characters in production.');
  }

  console.log('✅ Environment variables validated');
};

module.exports = validateEnv;
