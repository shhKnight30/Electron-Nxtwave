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
app.use(express.json());
app.use('/api/chat', chatRoutes);


const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

//play
app.use("/audio", express.static(path.join(__dirname, "temp_audio")));


// Security middleware
app.use(helmet());
app.use(compression());

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/planner', plannerRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});