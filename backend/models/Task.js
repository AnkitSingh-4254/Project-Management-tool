/**
 * Task Model for Mini Project Management Tool (MPMT)
 * Defines the structure and schema for task data in MongoDB
 */

const mongoose = require('mongoose');

/**
 * Task Schema Definition
 * Contains all task-related fields and validation rules
 */
const taskSchema = new mongoose.Schema({
    // Task title (required field)
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        minlength: [3, 'Task title must be at least 3 characters long'],
        maxlength: [100, 'Task title cannot exceed 100 characters']
    },
    
    // Task description (detailed explanation of the task)
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Task description cannot exceed 1000 characters'],
        default: ''
    },
    
    // Task status (as specified in requirements)
    status: {
        type: String,
        enum: ['Todo', 'In Progress', 'Done'],
        default: 'Todo',
        required: [true, 'Task status is required']
    },
    
    // Task priority level
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    
    // User assigned to this task (as specified in requirements)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must be assigned to a user']
    },
    
    // Project this task belongs to
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Task must belong to a project']
    },
    
    // User who created this task
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task creator is required']
    },
    
    // Task due date (as specified in requirements)
    dueDate: {
        type: Date,
        required: [true, 'Task due date is required'],
        validate: {
            validator: function(value) {
                // Due date should be in the future (allow same day)
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of day
                return value >= today;
            },
            message: 'Due date cannot be in the past'
        }
    },
    
    // Task start date (optional)
    startDate: {
        type: Date,
        default: Date.now
    },
    
    // Task completion date (set automatically when status changes to 'Done')
    completedAt: {
        type: Date,
        default: null
    },
    
    // Task estimated hours (for time tracking)
    estimatedHours: {
        type: Number,
        min: [0, 'Estimated hours cannot be negative'],
        max: [1000, 'Estimated hours seems too high'],
        default: 0
    },
    
    // Task actual hours spent (for time tracking)
    actualHours: {
        type: Number,
        min: [0, 'Actual hours cannot be negative'],
        default: 0
    },
    
    // Task completion percentage (0-100)
    progress: {
        type: Number,
        min: [0, 'Progress cannot be less than 0%'],
        max: [100, 'Progress cannot exceed 100%'],
        default: 0
    },
    
    // Task tags for categorization and filtering
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    
    // Task dependencies (other tasks that must be completed first)
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    
    // Task attachments/files (URLs or file paths)
    attachments: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        size: {
            type: Number,
            min: 0
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Task comments/notes
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Track if task is archived (soft delete)
    isArchived: {
        type: Boolean,
        default: false
    },
    
    // Task blocking reason (if task is blocked)
    blockedReason: {
        type: String,
        trim: true,
        maxlength: [200, 'Blocked reason cannot exceed 200 characters']
    },
    
    // Task category/type
    category: {
        type: String,
        enum: ['Development', 'Design', 'Testing', 'Documentation', 'Meeting', 'Research', 'Other'],
        default: 'Other'
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
 * Virtual field to check if task is overdue
 */
taskSchema.virtual('isOverdue').get(function() {
    if (this.status === 'Done') return false;
    return new Date() > this.dueDate;
});

/**
 * Virtual field to get days remaining until due date
 */
taskSchema.virtual('daysRemaining').get(function() {
    if (this.status === 'Done') return 0;
    const today = new Date();
    const timeDiff = this.dueDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
});

/**
 * Virtual field to check if task is blocked
 */
taskSchema.virtual('isBlocked').get(function() {
    return !!this.blockedReason;
});

/**
 * Pre-save middleware to handle status changes and automatic field updates
 */
taskSchema.pre('save', function(next) {
    // Set completion date when task is marked as done
    if (this.isModified('status')) {
        if (this.status === 'Done') {
            this.completedAt = new Date();
            this.progress = 100;
        } else if (this.status === 'Todo') {
            this.completedAt = null;
            if (this.progress === 100) {
                this.progress = 0;
            }
        }
    }
    
    // Update progress based on status if not manually set
    if (this.isModified('status') && !this.isModified('progress')) {
        if (this.status === 'Done') {
            this.progress = 100;
        } else if (this.status === 'In Progress' && this.progress === 0) {
            this.progress = 25; // Default progress for in-progress tasks
        } else if (this.status === 'Todo') {
            this.progress = 0;
        }
    }
    
    next();
});

/**
 * Static method to find tasks by project
 * @param {string} projectId - Project ID
 * @returns {Promise<Task[]>} - Array of tasks in the project
 */
taskSchema.statics.findByProject = function(projectId) {
    return this.find({ project: projectId, isArchived: false })
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .populate('project', 'title')
        .sort({ dueDate: 1, priority: -1 });
};

/**
 * Static method to find tasks assigned to a user
 * @param {string} userId - User ID
 * @returns {Promise<Task[]>} - Array of tasks assigned to the user
 */
taskSchema.statics.findByAssignee = function(userId) {
    return this.find({ assignedTo: userId, isArchived: false })
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .populate('project', 'title')
        .sort({ dueDate: 1, priority: -1 });
};

/**
 * Static method to find overdue tasks
 * @returns {Promise<Task[]>} - Array of overdue tasks
 */
taskSchema.statics.findOverdue = function() {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' },
        isArchived: false
    })
    .populate('assignedTo', 'name email')
    .populate('project', 'title')
    .sort({ dueDate: 1 });
};

/**
 * Static method to get task statistics for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Task statistics object
 */
taskSchema.statics.getProjectTaskStats = async function(projectId) {
    const stats = await this.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), isArchived: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProgress: { $avg: '$progress' }
            }
        }
    ]);
    
    const result = {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overallProgress: 0
    };
    
    stats.forEach(stat => {
        result.total += stat.count;
        if (stat._id === 'Todo') result.todo = stat.count;
        else if (stat._id === 'In Progress') result.inProgress = stat.count;
        else if (stat._id === 'Done') result.done = stat.count;
    });
    
    if (result.total > 0) {
        result.overallProgress = Math.round((result.done / result.total) * 100);
    }
    
    return result;
};

/**
 * Instance method to add a comment to the task
 * @param {string} userId - User ID who is adding the comment
 * @param {string} content - Comment content
 * @returns {Promise<Task>} - Updated task
 */
taskSchema.methods.addComment = async function(userId, content) {
    this.comments.push({
        user: userId,
        content: content.trim(),
        createdAt: new Date()
    });
    
    return await this.save();
};

/**
 * Instance method to add an attachment to the task
 * @param {string} name - File name
 * @param {string} url - File URL or path
 * @param {number} size - File size in bytes
 * @returns {Promise<Task>} - Updated task
 */
taskSchema.methods.addAttachment = async function(name, url, size) {
    this.attachments.push({
        name: name.trim(),
        url: url.trim(),
        size: size || 0,
        uploadedAt: new Date()
    });
    
    return await this.save();
};

// Create indexes for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ status: 1, priority: -1 });
taskSchema.index({ tags: 1 });

// Create and export the Task model
module.exports = mongoose.model('Task', taskSchema);
