const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const healthRoutes = require('./routes/health.routes');
const videoRoutes = require('./routes/video.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
