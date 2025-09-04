/**
 * Project Model for Mini Project Management Tool (MPMT)
 * Defines the structure and schema for project data in MongoDB
 */

const mongoose = require('mongoose');

/**
 * Project Schema Definition
 * Contains all project-related fields and validation rules
 */
const projectSchema = new mongoose.Schema({
    // Project title (required field)
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        minlength: [3, 'Project title must be at least 3 characters long'],
        maxlength: [100, 'Project title cannot exceed 100 characters']
    },
    
    // Project description (optional but recommended)
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Project description cannot exceed 500 characters'],
        default: ''
    },
    
    // Project status tracking
    status: {
        type: String,
        enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
        default: 'Planning'
    },
    
    // Project priority level
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    
    // Project owner/creator (reference to User model)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Project owner is required']
    },
    
    // Team members assigned to this project
    teamMembers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['Member', 'Lead', 'Contributor'],
            default: 'Member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Project start date
    startDate: {
        type: Date,
        default: Date.now
    },
    
    // Project due/end date (optional)
    dueDate: {
        type: Date,
        validate: {
            validator: function(value) {
                // Due date should be after start date
                return !value || value > this.startDate;
            },
            message: 'Due date must be after start date'
        }
    },
    
    // Project budget information (optional)
    budget: {
        allocated: {
            type: Number,
            min: [0, 'Budget cannot be negative'],
            default: 0
        },
        spent: {
            type: Number,
            min: [0, 'Spent amount cannot be negative'],
            default: 0
        },
        currency: {
            type: String,
            default: 'USD',
            maxlength: [3, 'Currency code cannot exceed 3 characters']
        }
    },
    
    // Project tags for categorization
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    
    // Project completion percentage
    progress: {
        type: Number,
        min: [0, 'Progress cannot be less than 0%'],
        max: [100, 'Progress cannot exceed 100%'],
        default: 0
    },
    
    // Additional project metadata
    metadata: {
        client: {
            type: String,
            trim: true,
            maxlength: [50, 'Client name cannot exceed 50 characters']
        },
        department: {
            type: String,
            trim: true,
            maxlength: [30, 'Department name cannot exceed 30 characters']
        },
        projectType: {
            type: String,
            enum: ['Internal', 'Client', 'Personal', 'Research'],
            default: 'Internal'
        }
    },
    
    // Track when project was archived (soft delete)
    isArchived: {
        type: Boolean,
        default: false
    },
    
    archivedAt: {
        type: Date,
        default: null
    }
}, {
    // Add automatic timestamps (createdAt, updatedAt)
    timestamps: true,
    
    // Configure how the model appears when converted to JSON
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Virtual field to get project age in days
 */
projectSchema.virtual('projectAge').get(function() {
    const today = new Date();
    const startDate = this.startDate || this.createdAt;
    const timeDiff = today - startDate;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
});

/**
 * Virtual field to check if project is overdue
 */
projectSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== 'Completed';
});

/**
 * Virtual field to get days remaining until due date
 */
projectSchema.virtual('daysRemaining').get(function() {
    if (!this.dueDate) return null;
    const today = new Date();
    const timeDiff = this.dueDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
});

/**
 * Pre-save middleware to update progress based on status
 */
projectSchema.pre('save', function(next) {
    // Auto-set progress based on status
    if (this.status === 'Completed' && this.progress < 100) {
        this.progress = 100;
    } else if (this.status === 'Planning' && this.progress > 0) {
        this.progress = 0;
    }
    
    // Set archived date when archiving
    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    } else if (!this.isArchived && this.archivedAt) {
        this.archivedAt = null;
    }
    
    next();
});

/**
 * Static method to find projects by owner
 * @param {string} userId - Owner's user ID
 * @returns {Promise<Project[]>} - Array of projects owned by the user
 */
projectSchema.statics.findByOwner = function(userId) {
    return this.find({ owner: userId, isArchived: false })
        .populate('owner', 'name email')
        .populate('teamMembers.user', 'name email')
        .sort({ updatedAt: -1 });
};

/**
 * Static method to find projects by team member
 * @param {string} userId - Team member's user ID
 * @returns {Promise<Project[]>} - Array of projects where user is a team member
 */
projectSchema.statics.findByTeamMember = function(userId) {
    return this.find({ 
        'teamMembers.user': userId, 
        isArchived: false 
    })
    .populate('owner', 'name email')
    .populate('teamMembers.user', 'name email')
    .sort({ updatedAt: -1 });
};

/**
 * Instance method to add team member to project
 * @param {string} userId - User ID to add as team member
 * @param {string} role - Role of the team member
 * @returns {Promise<Project>} - Updated project
 */
projectSchema.methods.addTeamMember = async function(userId, role = 'Member') {
    // Check if user is already a team member
    const existingMember = this.teamMembers.find(
        member => member.user.toString() === userId.toString()
    );
    
    if (existingMember) {
        throw new Error('User is already a team member');
    }
    
    this.teamMembers.push({
        user: userId,
        role: role,
        joinedAt: new Date()
    });
    
    return await this.save();
};

/**
 * Instance method to remove team member from project
 * @param {string} userId - User ID to remove from team
 * @returns {Promise<Project>} - Updated project
 */
projectSchema.methods.removeTeamMember = async function(userId) {
    this.teamMembers = this.teamMembers.filter(
        member => member.user.toString() !== userId.toString()
    );
    
    return await this.save();
};

// Create indexes for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'teamMembers.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ tags: 1 });

// Create and export the Project model
module.exports = mongoose.model('Project', projectSchema);
