/**
 * Authentication Routes for Mini Project Management Tool (MPMT)
 * Defines API endpoints for user authentication and profile management
 */

const express = require('express');
const router = express.Router();

// Import authentication controllers
const {
    signup,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    getUsers
} = require('../controllers/authController');

// Import authentication middleware
const { protect } = require('../middleware/auth');

/**
 * Public Routes (No authentication required)
 */

// POST /api/auth/signup - Register a new user
router.post('/signup', signup);

// POST /api/auth/login - User login
router.post('/login', login);

/**
 * Protected Routes (Authentication required)
 * All routes below this middleware require a valid JWT token
 */
router.use(protect);

// GET /api/auth/me - Get current user profile
router.get('/me', getMe);

// PUT /api/auth/me - Update current user profile
router.put('/me', updateProfile);

// PUT /api/auth/change-password - Change user password
router.put('/change-password', changePassword);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/users - Get all users (for team member selection)
router.get('/users', getUsers);

module.exports = router;
