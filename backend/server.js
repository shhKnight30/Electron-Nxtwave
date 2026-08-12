require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const studyRoutes = require('./routes/study');
const voiceRoutes = require('./routes/voice');
const mentalHealthRoutes = require('./routes/mentalHealth');
const plannerRoutes = require('./routes/planner');
const chatRoutes = require('./routes/chat');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import database
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Starting AI Study Assistant Backend...');
console.log('📝 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);

// Initialize database
initDatabase();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false
}));
app.use(compression());

// CORS - Allow Electron and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'file://',
    'app://'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (disabled for localhost in dev)
if (isProduction) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use('/api/', limiter);
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));
app.use('/audio', express.static(path.join(__dirname, 'temp_audio')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ollama: process.env.OLLAMA_HOST || 'http://localhost:11434'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('✅ Server running successfully');
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`🤖 Ollama at ${process.env.OLLAMA_HOST || 'http://localhost:11434'}`);
  console.log('');
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⚠️  Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;