/**
 * Production configuration - security hardening
 */

const productionConfig = {
  // CORS settings
  corsOptions: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Rate limiting (production)
  rateLimitOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Strict rate limit for auth endpoints
  authRateLimitOptions: {
    windowMs: 15 * 60 * 1000,
    max: 5, // Very strict for auth
    skipSuccessfulRequests: true,
  },

  // MongoDB options
  mongooseOptions: {
    maxPoolSize: 10,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
  },
};

module.exports = productionConfig;
