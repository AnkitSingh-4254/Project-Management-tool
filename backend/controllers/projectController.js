/**
 * Project Controller for Mini Project Management Tool (MPMT)
 * Handles all project-related CRUD operations
 */

const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Get all projects for the authenticated user
 * GET /api/projects
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProjects = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status, priority, search, sortBy = 'updatedAt', order = 'desc' } = req.query;

        // Build query filter
        let filter = {
            $or: [
                { owner: userId }, // Projects owned by user
                { 'teamMembers.user': userId } // Projects where user is a team member
            ],
            isArchived: false
        };

        // Add status filter if provided
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Add priority filter if provided
        if (priority && priority !== 'all') {
            filter.priority = priority;
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
        const projects = await Project.find(filter)
            .populate('owner', 'name email avatar')
            .populate('teamMembers.user', 'name email avatar')
            .sort(sortObj)
            .lean(); // Use lean for better performance

        // Get task statistics for each project
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const taskStats = await Task.getProjectTaskStats(project._id);
                return {
                    ...project,
                    taskStats
                };
            })
        );

        res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: {
                projects: projectsWithStats,
                count: projectsWithStats.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get a single project by ID
 * GET /api/projects/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProject = asyncHandler(async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user._id;

        const project = await Project.findById(projectId)
            .populate('owner', 'name email avatar department')
            .populate('teamMembers.user', 'name email avatar department');

        if (!project) {
            return next(createError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user has access to this project (owner or team member)
        const hasAccess = project.owner._id.toString() === userId.toString() ||
            project.teamMembers.some(member => member.user._id.toString() === userId.toString());

        if (!hasAccess) {
            return next(createError('Access denied. You are not authorized to view this project.', 403, 'ACCESS_DENIED'));
        }

        // Get project tasks
        const tasks = await Task.findByProject(projectId);

        // Get task statistics
        const taskStats = await Task.getProjectTaskStats(projectId);

        res.status(200).json({
            success: true,
            message: 'Project retrieved successfully',
            data: {
                project: {
                    ...project.toObject(),
                    taskStats
                },
                tasks
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Create a new project
 * POST /api/projects
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createProject = asyncHandler(async (req, res, next) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            tags,
            budget,
            metadata,
            teamMembers
        } = req.body;

        // Validate required fields
        if (!title) {
            return next(createError('Project title is required', 400, 'MISSING_TITLE'));
        }

        // Validate due date if provided
        if (dueDate && new Date(dueDate) <= new Date()) {
            return next(createError('Due date must be in the future', 400, 'INVALID_DUE_DATE'));
        }

        // Validate team members if provided
        if (teamMembers && teamMembers.length > 0) {
            const userIds = teamMembers.map(member => member.user);
            const users = await User.find({ _id: { $in: userIds }, isActive: true });
            
            if (users.length !== userIds.length) {
                return next(createError('One or more team members not found or inactive', 400, 'INVALID_TEAM_MEMBERS'));
            }
        }

        // Create project data
        const projectData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            owner: req.user._id,
            status: status || 'Planning',
            priority: priority || 'Medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tags: tags || [],
            budget: budget || { allocated: 0, spent: 0, currency: 'USD' },
            metadata: metadata || {},
            teamMembers: teamMembers || []
        };

        const project = await Project.create(projectData);

        // Populate the created project
        await project.populate([
            { path: 'owner', select: 'name email avatar' },
            { path: 'teamMembers.user', select: 'name email avatar' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                project
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
 * Update a project
 * PUT /api/projects/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProject = asyncHandler(async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user._id;
        const updateData = req.body;

        const project = await Project.findById(projectId);

        if (!project) {
            return next(createError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user is the project owner (only owners can update projects)
        if (project.owner.toString() !== userId.toString()) {
            return next(createError('Access denied. Only project owner can update the project.', 403, 'ACCESS_DENIED'));
        }

        // Validate due date if being updated
        if (updateData.dueDate && new Date(updateData.dueDate) <= new Date()) {
            return next(createError('Due date must be in the future', 400, 'INVALID_DUE_DATE'));
        }

        // Validate team members if being updated
        if (updateData.teamMembers && updateData.teamMembers.length > 0) {
            const userIds = updateData.teamMembers.map(member => member.user);
            const users = await User.find({ _id: { $in: userIds }, isActive: true });
            
            if (users.length !== userIds.length) {
                return next(createError('One or more team members not found or inactive', 400, 'INVALID_TEAM_MEMBERS'));
            }
        }

        // Update project fields
        const allowedFields = [
            'title', 'description', 'status', 'priority', 'dueDate',
            'tags', 'budget', 'metadata', 'teamMembers', 'progress'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                if (field === 'title' && updateData[field]) {
                    project[field] = updateData[field].trim();
                } else if (field === 'description') {
                    project[field] = updateData[field] ? updateData[field].trim() : '';
                } else {
                    project[field] = updateData[field];
                }
            }
        });

        const updatedProject = await project.save();

        // Populate the updated project
        await updatedProject.populate([
            { path: 'owner', select: 'name email avatar' },
            { path: 'teamMembers.user', select: 'name email avatar' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: {
                project: updatedProject
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
 * Delete a project (soft delete - archive)
 * DELETE /api/projects/:id
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteProject = asyncHandler(async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user._id;

        const project = await Project.findById(projectId);

        if (!project) {
            return next(createError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user is the project owner (only owners can delete projects)
        if (project.owner.toString() !== userId.toString()) {
            return next(createError('Access denied. Only project owner can delete the project.', 403, 'ACCESS_DENIED'));
        }

        // Soft delete - mark as archived
        project.isArchived = true;
        project.archivedAt = new Date();
        await project.save();

        // Also archive all tasks in this project
        await Task.updateMany(
            { project: projectId },
            { isArchived: true }
        );

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Add team member to project
 * POST /api/projects/:id/team-members
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const addTeamMember = asyncHandler(async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const userId = req.user._id;
        const { userId: newMemberId, role } = req.body;

        if (!newMemberId) {
            return next(createError('User ID is required', 400, 'MISSING_USER_ID'));
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return next(createError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user is the project owner
        if (project.owner.toString() !== userId.toString()) {
            return next(createError('Access denied. Only project owner can add team members.', 403, 'ACCESS_DENIED'));
        }

        // Verify the user to be added exists and is active
        const userToAdd = await User.findById(newMemberId);
        if (!userToAdd || !userToAdd.isActive) {
            return next(createError('User not found or inactive', 400, 'INVALID_USER'));
        }

        // Add team member using the model method
        await project.addTeamMember(newMemberId, role || 'Member');

        // Populate and return updated project
        await project.populate([
            { path: 'owner', select: 'name email avatar' },
            { path: 'teamMembers.user', select: 'name email avatar' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Team member added successfully',
            data: {
                project
            }
        });
    } catch (error) {
        if (error.message === 'User is already a team member') {
            return next(createError(error.message, 400, 'DUPLICATE_TEAM_MEMBER'));
        }
        next(error);
    }
});

/**
 * Remove team member from project
 * DELETE /api/projects/:id/team-members/:userId
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const removeTeamMember = asyncHandler(async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const memberToRemove = req.params.userId;
        const userId = req.user._id;

        const project = await Project.findById(projectId);

        if (!project) {
            return next(createError('Project not found', 404, 'PROJECT_NOT_FOUND'));
        }

        // Check if user is the project owner
        if (project.owner.toString() !== userId.toString()) {
            return next(createError('Access denied. Only project owner can remove team members.', 403, 'ACCESS_DENIED'));
        }

        // Remove team member using the model method
        await project.removeTeamMember(memberToRemove);

        res.status(200).json({
            success: true,
            message: 'Team member removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get project statistics
 * GET /api/projects/stats
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProjectStats = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get total project counts by status
        const projectStats = await Project.aggregate([
            {
                $match: {
                    $or: [
                        { owner: userId },
                        { 'teamMembers.user': userId }
                    ],
                    isArchived: false
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get task statistics across all user projects
        const taskStats = await Task.aggregate([
            {
                $lookup: {
                    from: 'projects',
                    localField: 'project',
                    foreignField: '_id',
                    as: 'projectData'
                }
            },
            {
                $match: {
                    'projectData.0.owner': userId,
                    isArchived: false
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format the statistics
        const stats = {
            projects: {
                total: 0,
                planning: 0,
                inProgress: 0,
                onHold: 0,
                completed: 0,
                cancelled: 0
            },
            tasks: {
                total: 0,
                todo: 0,
                inProgress: 0,
                done: 0
            }
        };

        projectStats.forEach(stat => {
            stats.projects.total += stat.count;
            const status = stat._id.toLowerCase().replace(/\s+/g, '');
            if (stats.projects[status] !== undefined) {
                stats.projects[status] = stat.count;
            }
        });

        taskStats.forEach(stat => {
            stats.tasks.total += stat.count;
            const status = stat._id.toLowerCase().replace(/\s+/g, '');
            if (stats.tasks[status] !== undefined) {
                stats.tasks[status] = stat.count;
            }
        });

        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                stats
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addTeamMember,
    removeTeamMember,
    getProjectStats
};
