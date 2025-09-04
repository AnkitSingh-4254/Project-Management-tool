/**
 * User Model for Mini Project Management Tool (MPMT)
 * Defines the structure and schema for user data in MongoDB
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema Definition
 * Contains all user-related fields and validation rules
 */
const userSchema = new mongoose.Schema({
    // User's full name (required field)
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true, // Remove whitespace from beginning and end
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    
    // User's email address (required and unique)
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure no duplicate emails
        lowercase: true, // Convert to lowercase
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    
    // User's password (required, will be hashed)
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    
    // User's role in the system (default: user)
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'], // Allowed values
        default: 'user'
    },
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Profile avatar/image URL (optional)
    avatar: {
        type: String,
        default: null
    },
    
    // User's department or team (optional)
    department: {
        type: String,
        trim: true,
        maxlength: [30, 'Department name cannot exceed 30 characters']
    }
}, {
    // Add automatic timestamps (createdAt, updatedAt)
    timestamps: true,
    
    // Configure how the model appears when converted to JSON
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password; // Never send password in JSON response
            return ret;
        }
    }
});

/**
 * Pre-save middleware to hash password before saving to database
 * This runs automatically before every save operation
 */
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Generate salt for hashing (higher number = more secure but slower)
        const salt = await bcrypt.genSalt(12);
        
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password from user
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to get user data without sensitive information
 * @returns {Object} - User object without password and other sensitive fields
 */
userSchema.methods.getPublicProfile = function() {
    const userObj = this.toObject();
    delete userObj.password;
    return userObj;
};

/**
 * Static method to find user by email (case insensitive)
 * @param {string} email - Email address to search for
 * @returns {Promise<User>} - User document if found
 */
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ 
        email: { $regex: new RegExp('^' + email + '$', 'i') } 
    });
};

// Create and export the User model
module.exports = mongoose.model('User', userSchema);
