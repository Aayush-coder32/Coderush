const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const productionConfig = require('./config/productionConfig');

const app = express();

// Security headers (production-ready)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS configuration
const corsOrigin = process.env.CLIENT_URL || 'http://localhost:3001';
const corsConfig = process.env.NODE_ENV === 'production'
  ? productionConfig.corsOptions
  : { origin: corsOrigin, credentials: true };

app.use(cors(corsConfig));

// Body parser with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting for auth routes (strict in production)
const authLimitConfig = process.env.NODE_ENV === 'production'
  ? productionConfig.authRateLimitOptions
  : { windowMs: 15 * 60 * 1000, max: 100 };

const authLimiter = rateLimit(authLimitConfig);
app.use('/api/auth', authLimiter);

app.use('/api', routes);

// Friendly 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Server error';
  res.status(status).json({ success: false, message });
});

module.exports = app;
