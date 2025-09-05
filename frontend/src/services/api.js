/**
 * API Service for Project Manager App
 * Handles all API communications with the backend server
 */

import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // User signup
  signup: async (userData) => {
    const response = await API.post('/auth/signup', userData);
    return response.data;
  },

  // User login
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await API.put('/auth/me', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await API.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await API.post('/auth/logout');
    return response.data;
  },

  // Get all users (for team member selection)
  getUsers: async () => {
    const response = await API.get('/auth/users');
    return response.data;
  },
};

// Project API calls
export const projectAPI = {
  // Get all projects
  getProjects: async (filters) => {
    const response = await API.get('/projects', { params: filters });
    return response.data;
  },

  // Get single project
  getProject: async (id) => {
    const response = await API.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await API.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (id, projectData) => {
    const response = await API.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await API.delete(`/projects/${id}`);
    return response.data;
  },

  // Add team member to project
  addTeamMember: async (id, memberData) => {
    const response = await API.post(`/projects/${id}/team-members`, memberData);
    return response.data;
  },

  // Remove team member from project
  removeTeamMember: async (id, userId) => {
    const response = await API.delete(`/projects/${id}/team-members/${userId}`);
    return response.data;
  },

  // Get project statistics
  getStats: async () => {
    const response = await API.get('/projects/stats');
    return response.data;
  },
};

// Task API calls
export const taskAPI = {
  // Get all tasks
  getTasks: async (filters) => {
    const response = await API.get('/tasks', { params: filters });
    return response.data;
  },

  // Get single task
  getTask: async (id) => {
    const response = await API.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await API.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (id, taskData) => {
    const response = await API.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await API.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get tasks assigned to current user
  getMyTasks: async (status) => {
    const response = await API.get('/tasks/my-tasks', { params: { status } });
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async () => {
    const response = await API.get('/tasks/overdue');
    return response.data;
  },

  // Add comment to task
  addComment: async (id, content) => {
    const response = await API.post(`/tasks/${id}/comments`, { content });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await API.get('/health');
    return response.data;
  },
};

export default API;
