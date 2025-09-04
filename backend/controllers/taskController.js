/**
 * Task Controller for Mini Project Management Tool (MPMT)
 * Handles all task-related CRUD operations with the fields specified in requirements
 */

const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Get all tasks for the authenticated user
 * GET /api/tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTasks = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { 
            status, 
            priority, 
            project, 
            assignedTo, 
            search, 
            sortBy = 'dueDate', 
            order = 'asc',
            overdue,
            category
        } = req.query;

        // Build base filter - user can see tasks from projects they own or are members of
        const userProjects = await Project.find({
            $or: [
                { owner: userId },
                { 'teamMembers.user': userId }
            ],
            isArchived: false
        }).select('_id');

        const projectIds = userProjects.map(p => p._id);

        let filter = {
            project: { $in: projectIds },
            isArchived: false
        };

        // Add status filter (Todo, In Progress, Done as specified in requirements)
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Add priority filter
        if (priority && priority !== 'all') {
            filter.priority = priority;
        }

        // Add project filter
        if (project && project !== 'all') {
            filter.project = project;
        }

        // Add assignedTo filter (as specified in requirements)
        if (assignedTo && assignedTo !== 'all') {
            if (assignedTo === 'me') {
                filter.assignedTo = userId;
            } else {
                filter.assignedTo = assignedTo;
            }
        }

        // Add category filter
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Add overdue filter
        if (overdue === 'true') {
            filter.dueDate = { $lt: new Date() };
            filter.status = { $ne: 'Done' };
        }

        // Add search functionality
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$and = [
                { ...filter },
                {
                    $or: [
                        { title: searchRegex },
                        { description: searchRegex },
                        { tags: { $in: [searchRegex] } }
                    ]
                }
            ];
        }

        // Build sort object
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sortBy]: sortOrder };

        // Execute query with population
        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email avatar') // As specified in requirements
            .populate('createdBy', 'name email')
            .populate('project', 'title status')
            .sort(sortObj);

        res.status(200).json({
            success: true,
            message: 'Tasks retrieved successfully',
            data: {
                tasks,
                count: tasks.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTask = asyncHandler(async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;

        const task = await Task.findById(taskId)
            .populate('assignedTo', 'name email avatar department')
            .populate('createdBy', 'name email avatar')
            .populate('project', 'title owner teamMembers')
            .populate('comments.user', 'name email avatar');

        if (!task) {
            return next(createError('Task not found', 404, 'TASK_NOT_FOUND'));
        }

        // Check if user has access to this task (through project membership)
        const project = task.project;
        const hasAccess = project.owner.toString() === userId.toString() ||
            project.teamMembers.some(member => member.user.toString() === userId.toString());

        if (!hasAccess) {
            return next(createError('Access denied. You are not authorized to view this task.', 403, 'ACCESS_DENIED'));
        }

        res.status(200).json({
            success: true,
            message: 'Task retrieved successfully',
            data: {
                task
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Create a new task
 * POST /api/tasks
 * Required fields as per requirements: title, description, status, assignedTo, dueDate
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTask = asyncHandler(async (req, res, next) => {
    try {
        const {
            title,
            description,
            status = 'Todo', // Default as specified in requirements
            assignedTo, // Required field as per requirements
            project: projectId,
            dueDate, // Required field as per requirements
            priority,
            tags,
            category,
            estimatedHours
        } = req.body;

        // Validate required fields as specified in requirements
        if (!title) {
            return next(createError('Task title is required', 400, 'MISSING_TITLE'));
        }

        if (!assignedTo) {
            return next(createError('Task must be assigned to a user (assignedTo field is required)', 400, 'MISSING_ASSIGNED_TO'));
        }

        if (!projectId) {
            return next(createError('Task must belong to a project', 400, 'MISSING_PROJECT'));
        }

        if (!dueDate) {
            return next(createError('Task due date is required', 400, 'MISSING_DUE_DATE'));
        }

        // Validate project exists and user has access
        const project = await Project.findById(projectId);
        if (!project || project.isArchived) {
            return next(createError('Project not found or archived', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user has permission to create tasks in this project
        const userId = req.user._id;
        const hasAccess = project.owner.toString() === userId.toString() ||
            project.teamMembers.some(member => member.user.toString() === userId.toString());

        if (!hasAccess) {
            return next(createError('Access denied. You are not authorized to create tasks in this project.', 403, 'ACCESS_DENIED'));
        }

        // Validate assigned user exists and is active
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser || !assignedUser.isActive) {
            return next(createError('Assigned user not found or inactive', 400, 'INVALID_ASSIGNED_USER'));
        }

        // Validate due date
        const taskDueDate = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (taskDueDate < today) {
            return next(createError('Due date cannot be in the past', 400, 'INVALID_DUE_DATE'));
        }

        // Create task data
        const taskData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            status: status || 'Todo',
            assignedTo,
            project: projectId,
            createdBy: userId,
            dueDate: taskDueDate,
            priority: priority || 'Medium',
            tags: tags || [],
            category: category || 'Other',
            estimatedHours: estimatedHours || 0
        };

        const task = await Task.create(taskData);

        // Populate the created task
        await task.populate([
            { path: 'assignedTo', select: 'name email avatar' },
            { path: 'createdBy', select: 'name email avatar' },
            { path: 'project', select: 'title' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: {
                task
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
 * Update a task
 * PUT /api/tasks/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateTask = asyncHandler(async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;
        const updateData = req.body;

        const task = await Task.findById(taskId).populate('project');

        if (!task) {
            return next(createError('Task not found', 404, 'TASK_NOT_FOUND'));
        }

        // Check if user has permission to update this task (project owner, task creator, or assigned user)
        const project = task.project;
        const canUpdate = project.owner.toString() === userId.toString() ||
            task.createdBy.toString() === userId.toString() ||
            task.assignedTo.toString() === userId.toString();

        if (!canUpdate) {
            return next(createError('Access denied. You can only update tasks you created, are assigned to, or own the project.', 403, 'ACCESS_DENIED'));
        }

        // Validate due date if being updated
        if (updateData.dueDate) {
            const newDueDate = new Date(updateData.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (newDueDate < today) {
                return next(createError('Due date cannot be in the past', 400, 'INVALID_DUE_DATE'));
            }
        }

        // Validate assigned user if being updated
        if (updateData.assignedTo) {
            const assignedUser = await User.findById(updateData.assignedTo);
            if (!assignedUser || !assignedUser.isActive) {
                return next(createError('Assigned user not found or inactive', 400, 'INVALID_ASSIGNED_USER'));
            }
        }

        // Update task fields (allowing all the required fields as per requirements)
        const allowedFields = [
            'title', 'description', 'status', 'assignedTo', 'dueDate',
            'priority', 'tags', 'category', 'estimatedHours', 'actualHours',
            'progress', 'blockedReason'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'title' && updateData[field]) {
                    task[field] = updateData[field].trim();
                } else if (field === 'description') {
                    task[field] = updateData[field] ? updateData[field].trim() : '';
                } else {
                    task[field] = updateData[field];
                }
            }
        });

        const updatedTask = await task.save();

        // Populate the updated task
        await updatedTask.populate([
            { path: 'assignedTo', select: 'name email avatar' },
            { path: 'createdBy', select: 'name email avatar' },
            { path: 'project', select: 'title' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: {
                task: updatedTask
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
 * Delete a task (soft delete - archive)
 * DELETE /api/tasks/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteTask = asyncHandler(async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;

        const task = await Task.findById(taskId).populate('project');

        if (!task) {
            return next(createError('Task not found', 404, 'TASK_NOT_FOUND'));
        }

        // Check if user has permission to delete this task (project owner or task creator)
        const project = task.project;
        const canDelete = project.owner.toString() === userId.toString() ||
            task.createdBy.toString() === userId.toString();

        if (!canDelete) {
            return next(createError('Access denied. Only project owner or task creator can delete tasks.', 403, 'ACCESS_DENIED'));
        }

        // Soft delete - mark as archived
        task.isArchived = true;
        await task.save();

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Add comment to task
 * POST /api/tasks/:id/comments
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const addComment = asyncHandler(async (req, res, next) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return next(createError('Comment content is required', 400, 'MISSING_CONTENT'));
        }

        const task = await Task.findById(taskId).populate('project');

        if (!task) {
            return next(createError('Task not found', 404, 'TASK_NOT_FOUND'));
        }

        // Check if user has access to this task
        const project = task.project;
        const hasAccess = project.owner.toString() === userId.toString() ||
            project.teamMembers.some(member => member.user.toString() === userId.toString());

        if (!hasAccess) {
            return next(createError('Access denied. You are not authorized to comment on this task.', 403, 'ACCESS_DENIED'));
        }

        // Add comment using model method
        const updatedTask = await task.addComment(userId, content);

        // Populate the new comment
        await updatedTask.populate('comments.user', 'name email avatar');

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: {
                task: updatedTask
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get tasks assigned to current user
 * GET /api/tasks/my-tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMyTasks = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        let filter = {
            assignedTo: userId,
            isArchived: false
        };

        if (status && status !== 'all') {
            filter.status = status;
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email')
            .populate('project', 'title')
            .sort({ dueDate: 1, priority: -1 });

        res.status(200).json({
            success: true,
            message: 'My tasks retrieved successfully',
            data: {
                tasks,
                count: tasks.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get overdue tasks
 * GET /api/tasks/overdue
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getOverdueTasks = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get user's projects
        const userProjects = await Project.find({
            $or: [
                { owner: userId },
                { 'teamMembers.user': userId }
            ],
            isArchived: false
        }).select('_id');

        const projectIds = userProjects.map(p => p._id);

        const overdueTasks = await Task.find({
            project: { $in: projectIds },
            dueDate: { $lt: new Date() },
            status: { $ne: 'Done' },
            isArchived: false
        })
        .populate('assignedTo', 'name email avatar')
        .populate('project', 'title')
        .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            message: 'Overdue tasks retrieved successfully',
            data: {
                tasks: overdueTasks,
                count: overdueTasks.length
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getMyTasks,
    getOverdueTasks
};
