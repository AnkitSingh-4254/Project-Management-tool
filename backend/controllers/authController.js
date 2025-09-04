/**
 * Authentication Controller for Mini Project Management Tool (MPMT)
 * Handles user registration, login, and authentication-related operations
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Register a new user (Sign Up)
 * POST /api/auth/signup
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const signup = asyncHandler(async (req, res, next) => {
    const { name, email, password, department } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return next(createError('Please provide name, email, and password', 400, 'MISSING_FIELDS'));
    }

    // Check if user already exists with the same email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return next(createError('User with this email already exists', 400, 'EMAIL_EXISTS'));
    }

    // Validate password length
    if (password.length < 6) {
        return next(createError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD'));
    }

    try {
        // Create new user - password will be automatically hashed by the User model middleware
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            department: department ? department.trim() : undefined
        });

        // Generate JWT token for the new user
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = user.getPublicProfile();

        // Send successful registration response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token,
                tokenType: 'Bearer'
            }
        });
    } catch (error) {
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return next(createError(validationErrors.join(', '), 400, 'VALIDATION_ERROR'));
        }
        
        // Handle duplicate key errors (should be caught by the check above, but just in case)
        if (error.code === 11000) {
            return next(createError('Email address is already registered', 400, 'DUPLICATE_EMAIL'));
        }
        
        // Pass any other errors to the global error handler
        next(error);
    }
});

/**
 * Login user
 * POST /api/auth/login
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return next(createError('Please provide email and password', 400, 'MISSING_CREDENTIALS'));
    }

    try {
        // Find user by email and include password field for comparison
        // Note: password field has 'select: false' in the model, so we need to explicitly select it
        const user = await User.findOne({ 
            email: email.toLowerCase().trim() 
        }).select('+password');

        // Check if user exists
        if (!user) {
            return next(createError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
        }

        // Check if user account is active
        if (!user.isActive) {
            return next(createError('Your account has been deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED'));
        }

        // Compare provided password with hashed password in database
        const isPasswordCorrect = await user.matchPassword(password);

        if (!isPasswordCorrect) {
            return next(createError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
        }

        // Generate JWT token for successful login
        const token = generateToken(user._id);

        // Get user data without sensitive information
        const userResponse = user.getPublicProfile();

        // Send successful login response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token,
                tokenType: 'Bearer'
            }
        });
    } catch (error) {
        // Pass any errors to the global error handler
        next(error);
    }
});

/**
 * Get current user profile (protected route)
 * GET /api/auth/me
 * 
 * @param {Object} req - Express request object (contains user from auth middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMe = asyncHandler(async (req, res, next) => {
    try {
        // req.user is populated by the protect middleware
        const user = req.user;

        if (!user) {
            return next(createError('User not found', 404, 'USER_NOT_FOUND'));
        }

        // Send current user data
        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: user.getPublicProfile()
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Update user profile (protected route)
 * PUT /api/auth/me
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProfile = asyncHandler(async (req, res, next) => {
    try {
        const { name, department, avatar } = req.body;
        const user = req.user;

        if (!user) {
            return next(createError('User not found', 404, 'USER_NOT_FOUND'));
        }

        // Update only provided fields
        if (name) user.name = name.trim();
        if (department !== undefined) user.department = department ? department.trim() : null;
        if (avatar !== undefined) user.avatar = avatar;

        // Save updated user
        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser.getPublicProfile()
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return next(createError(validationErrors.join(', '), 400, 'VALIDATION_ERROR'));
        }
        next(error);
    }
});

/**
 * Change user password (protected route)
 * PUT /api/auth/change-password
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const changePassword = asyncHandler(async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(createError('Please provide current password and new password', 400, 'MISSING_PASSWORDS'));
        }

        if (newPassword.length < 6) {
            return next(createError('New password must be at least 6 characters long', 400, 'INVALID_NEW_PASSWORD'));
        }

        // Get user with password field
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return next(createError('User not found', 404, 'USER_NOT_FOUND'));
        }

        // Verify current password
        const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordCorrect) {
            return next(createError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD'));
        }

        // Update password (will be hashed automatically by pre-save middleware)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Logout user (optional - mainly for frontend token management)
 * POST /api/auth/logout
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = asyncHandler(async (req, res, next) => {
    // In JWT authentication, logout is primarily handled on the frontend
    // by removing the token from storage. However, we can provide a 
    // logout endpoint for consistency and potential future enhancements
    // (like token blacklisting)

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * Get all users (protected route - for team member selection in projects/tasks)
 * GET /api/auth/users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUsers = asyncHandler(async (req, res, next) => {
    try {
        // Get all active users (excluding passwords)
        const users = await User.find({ isActive: true })
            .select('name email department role avatar createdAt')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users,
                count: users.length
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    signup,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    getUsers
};
