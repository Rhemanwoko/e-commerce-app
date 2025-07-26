const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    statusCode: 200
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

// Handle undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;