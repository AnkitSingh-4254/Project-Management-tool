/**
 * Global Error Handler Middleware for Mini Project Management Tool (MPMT)
 * Provides consistent error responses and logging across the application
 */

/**
 * Global error handling middleware
 * Catches all errors from routes and middleware, formats them consistently
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    // Initialize error object with default values
    let error = { ...err };
    error.message = err.message;

    // Log error details for debugging (in development mode)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', err.stack);
        console.error('Error Details:', {
            name: err.name,
            message: err.message,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    } else {
        // In production, log only essential information
        console.error('Production Error:', {
            message: err.message,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }

    // Mongoose bad ObjectId error (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = {
            message,
            statusCode: 404,
            code: 'INVALID_ID'
        };
    }

    // Mongoose duplicate key error (E11000)
    if (err.code === 11000) {
        // Extract the field name from the error message
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
        error = {
            message,
            statusCode: 400,
            code: 'DUPLICATE_VALUE',
            field: field
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            errors: Object.keys(err.errors).reduce((acc, key) => {
                acc[key] = err.errors[key].message;
                return acc;
            }, {})
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Invalid token. Please log in again.',
            statusCode: 401,
            code: 'INVALID_TOKEN'
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            message: 'Token has expired. Please log in again.',
            statusCode: 401,
            code: 'TOKEN_EXPIRED'
        };
    }

    // MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        error = {
            message: 'Database connection error. Please try again later.',
            statusCode: 503,
            code: 'DATABASE_ERROR'
        };
    }

    // File upload errors (if using multer or similar)
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            message: 'File size too large. Please upload a smaller file.',
            statusCode: 400,
            code: 'FILE_TOO_LARGE'
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            message: 'Unexpected file field or too many files.',
            statusCode: 400,
            code: 'INVALID_FILE_UPLOAD'
        };
    }

    // Rate limiting errors
    if (err.statusCode === 429) {
        error = {
            message: 'Too many requests. Please try again later.',
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED'
        };
    }

    // CORS errors
    if (err.message && err.message.includes('CORS')) {
        error = {
            message: 'Cross-origin request blocked. Please check your request origin.',
            statusCode: 403,
            code: 'CORS_ERROR'
        };
    }

    // Custom application errors
    if (err.isOperational || err.statusCode) {
        error = {
            message: err.message || 'Something went wrong',
            statusCode: err.statusCode || 500,
            code: err.code || 'UNKNOWN_ERROR'
        };
    }

    // Default error response structure
    const response = {
        success: false,
        message: error.message || 'Internal Server Error',
        ...(error.code && { code: error.code }),
        ...(error.field && { field: error.field }),
        ...(error.errors && { errors: error.errors })
    };

    // Add stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.originalError = {
            name: err.name,
            message: err.message
        };
    }

    // Add request information for debugging
    if (process.env.NODE_ENV === 'development') {
        response.debug = {
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent')
        };
    }

    // Send error response
    res.status(error.statusCode || 500).json(response);
};

/**
 * Middleware to handle 404 errors (routes not found)
 * Should be placed after all route definitions
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

/**
 * Helper function to create custom error objects
 * Can be used throughout the application for consistent error creation
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Custom error code
 * @param {Object} extra - Additional error data
 * @returns {Error} - Custom error object
 */
const createError = (message, statusCode = 500, code = 'GENERIC_ERROR', extra = {}) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true; // Mark as operational error (not programming error)
    
    // Add any extra properties
    Object.keys(extra).forEach(key => {
        error[key] = extra[key];
    });
    
    return error;
};

/**
 * Async wrapper to catch errors in async route handlers
 * Eliminates the need for try-catch blocks in every async route
 * 
 * Usage: router.get('/route', asyncHandler(asyncController));
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware to validate request body against a schema
 * Can be used with Joi or similar validation libraries
 * 
 * @param {Object} schema - Validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware function
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { 
            abortEarly: false, // Show all validation errors
            allowUnknown: true, // Allow extra fields
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const validationError = createError(
                'Validation failed',
                400,
                'VALIDATION_ERROR',
                {
                    errors: error.details.reduce((acc, err) => {
                        acc[err.path.join('.')] = err.message;
                        return acc;
                    }, {})
                }
            );
            return next(validationError);
        }

        next();
    };
};

module.exports = {
    errorHandler,
    notFound,
    createError,
    asyncHandler,
    validate
};
