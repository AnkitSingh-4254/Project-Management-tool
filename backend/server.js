/**
 * Main Server File for Mini Project Management Tool (MPMT)
 * This file sets up the Express server, connects to MongoDB, and configures middleware
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import route handlers
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Create Express application instance
const app = express();

// Define server port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Middleware Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Allow requests from React app
    credentials: true // Allow cookies and credentials
}));

app.use(express.json({ limit: '10mb' })); // Parse JSON requests with size limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// API Routes Configuration
app.use('/api/auth', authRoutes); // Authentication routes (login, signup)
app.use('/api/projects', projectRoutes); // Project management routes
app.use('/api/tasks', taskRoutes); // Task management routes

// Health check endpoint for testing server status
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'MPMT Server is running successfully!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Handle undefined routes - 404 Error
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

/**
 * Connect to MongoDB Database
 * Uses mongoose to establish connection with MongoDB
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1); // Exit with failure code
    }
};

/**
 * Start the server
 * Connects to database and starts listening on specified port
 */
const startServer = async () => {
    try {
        // First connect to database
        await connectDB();
        
        // Then start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Server URL: http://localhost:${PORT}`);
            console.log(`📋 Environment: ${process.env.NODE_ENV}`);
            console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    mongoose.connection.close(() => {
        console.log('📊 MongoDB connection closed.');
        process.exit(0);
    });
});

// Start the application
startServer();
