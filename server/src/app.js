const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const aiRouter = require('./routes/ai');
const healthRouter = require('./routes/health');
const feedbackRouter = require('./routes/feedback');

const app = express();

// Security & basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Request logging without sensitive data
morgan.token('body', (req) => {
  try {
    const clone = { ...req.body };
    if (clone && clone.apiKey) clone.apiKey = '[REDACTED]';
    return JSON.stringify(clone);
  } catch (_) {
    return '';
  }
});
app.use(morgan(':method :url :status - :response-time ms :body'));

// Basic rate limiting (bonus)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use(limiter);

// Routes
app.use('/api/ai', aiRouter);
app.use('/api/health', healthRouter);
app.use('/api/feedback', feedbackRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Avoid leaking internals
  const message = err && err.expose ? err.message : 'Internal server error';
  const status = err.status || 500;
  if (status >= 500) {
    // Log detailed error server-side
    // Note: API keys are already redacted in logs
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }
  res.status(status).json({ error: message });
});

module.exports = app;
