/**
 * Project Routes for Mini Project Management Tool (MPMT)
 * Defines API endpoints for project management operations
 */

const express = require('express');
const router = express.Router();

// Import project controllers
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addTeamMember,
    removeTeamMember,
    getProjectStats
} = require('../controllers/projectController');

// Import authentication middleware
const { protect } = require('../middleware/auth');

/**
 * All project routes require authentication
 */
router.use(protect);

// GET /api/projects/stats - Get project statistics (must be before /:id route)
router.get('/stats', getProjectStats);

// GET /api/projects - Get all projects for authenticated user
router.get('/', getProjects);

// POST /api/projects - Create a new project
router.post('/', createProject);

// GET /api/projects/:id - Get a specific project by ID
router.get('/:id', getProject);

// PUT /api/projects/:id - Update a specific project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete (archive) a specific project
router.delete('/:id', deleteProject);

// POST /api/projects/:id/team-members - Add team member to project
router.post('/:id/team-members', addTeamMember);

// DELETE /api/projects/:id/team-members/:userId - Remove team member from project
router.delete('/:id/team-members/:userId', removeTeamMember);

module.exports = router;
