/**
 * Task Routes for Mini Project Management Tool (MPMT)
 * Defines API endpoints for task management operations
 * Includes all required CRUD operations for tasks as specified in requirements
 */

const express = require('express');
const router = express.Router();

// Import task controllers
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    getMyTasks,
    getOverdueTasks
} = require('../controllers/taskController');

// Import authentication middleware
const { protect } = require('../middleware/auth');

/**
 * All task routes require authentication
 */
router.use(protect);

// GET /api/tasks/my-tasks - Get tasks assigned to current user (must be before /:id route)
router.get('/my-tasks', getMyTasks);

// GET /api/tasks/overdue - Get overdue tasks (must be before /:id route)
router.get('/overdue', getOverdueTasks);

// GET /api/tasks - Get all tasks for authenticated user
router.get('/', getTasks);

// POST /api/tasks - Create a new task (with required fields: title, description, status, assignedTo, dueDate)
router.post('/', createTask);

// GET /api/tasks/:id - Get a specific task by ID
router.get('/:id', getTask);

// PUT /api/tasks/:id - Update a specific task (supports updating title, description, status, assignedTo, dueDate)
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - Delete (archive) a specific task
router.delete('/:id', deleteTask);

// POST /api/tasks/:id/comments - Add comment to a task
router.post('/:id/comments', addComment);

module.exports = router;
