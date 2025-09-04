/**
 * Authentication Middleware for Mini Project Management Tool (MPMT)
 * This middleware protects routes by verifying JWT tokens and extracting user information
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token from Authorization header and adds user to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if Authorization header exists and starts with 'Bearer'
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                // Extract token from "Bearer TOKEN_HERE" format
                token = req.headers.authorization.split(' ')[1];

                // Verify the JWT token using the secret from environment variables
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Find the user associated with the token (excluding password field)
                req.user = await User.findById(decoded.id).select('-password');

                // Check if user still exists in database
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User no longer exists. Please log in again.'
                    });
                }

                // Check if user account is still active
                if (!req.user.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: 'Your account has been deactivated. Please contact support.'
                    });
                }

                // User is authenticated, proceed to next middleware
                next();
            } catch (error) {
                console.error('Token verification error:', error.message);
                
                // Handle specific JWT errors
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired. Please log in again.',
                        code: 'TOKEN_EXPIRED'
                    });
                } else if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token. Please log in again.',
                        code: 'INVALID_TOKEN'
                    });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication failed. Please log in again.',
                        code: 'AUTH_FAILED'
                    });
                }
            }
        }

        // No token provided in the request
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please log in.',
                code: 'NO_TOKEN'
            });
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Authorization middleware to restrict access based on user roles
 * Must be used after the protect middleware
 * 
 * @param {...string} roles - List of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if user exists in request (should be set by protect middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Please authenticate first.'
            });
        }

        // Check if user's role is included in allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. ${req.user.role} role is not authorized to access this resource.`,
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        // User is authorized, proceed to next middleware
        next();
    };
};

/**
 * Middleware to check if user is the owner of a resource
 * Compares req.user._id with req.params.userId or resource owner
 * 
 * @param {string} ownerField - Field name that contains owner ID (default: 'owner')
 * @returns {Function} - Express middleware function
 */
const checkOwnership = (ownerField = 'owner') => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. Please authenticate first.'
                });
            }

            // If checking against URL parameter (like /users/:userId)
            if (req.params.userId) {
                if (req.user._id.toString() !== req.params.userId.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. You can only access your own resources.'
                    });
                }
            }

            // If checking against resource owner (for update/delete operations)
            // This would need the actual resource to be fetched first
            // The calling controller should handle this logic

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error during ownership verification'
            });
        }
    };
};

/**
 * Middleware to optionally authenticate user (doesn't fail if no token)
 * Useful for endpoints that work for both authenticated and non-authenticated users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        // Check if Authorization header exists and starts with 'Bearer'
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (error) {
                // Don't fail for invalid tokens in optional auth
                console.log('Optional auth failed:', error.message);
                req.user = null;
            }
        }

        // Continue regardless of authentication status
        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        // Don't fail, just continue without user
        req.user = null;
        next();
    }
};

/**
 * Helper function to generate JWT token
 * Used in authentication controllers
 * 
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d', // Default to 7 days
            issuer: 'MPMT-Backend',
            audience: 'MPMT-Frontend'
        }
    );
};

/**
 * Helper function to verify JWT token
 * Used for manual token verification
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    protect,
    authorize,
    checkOwnership,
    optionalAuth,
    generateToken,
    verifyToken
};
