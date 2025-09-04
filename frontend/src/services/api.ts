/**
 * API Service for Mini Project Management Tool (MPMT)
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

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  owner: User;
  teamMembers: Array<{
    user: User;
    role: string;
    joinedAt: string;
  }>;
  startDate: string;
  dueDate?: string;
  progress: number;
  tags: string[];
  taskStats?: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overallProgress: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done'; // As specified in requirements
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedTo: User; // Required field as per requirements
  project: Project;
  createdBy: User;
  dueDate: string; // Required field as per requirements
  startDate: string;
  completedAt?: string;
  progress: number;
  tags: string[];
  category: string;
  estimatedHours: number;
  actualHours: number;
  comments: Array<{
    _id: string;
    user: User;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Authentication API calls
export const authAPI = {
  // User signup
  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    department?: string;
  }): Promise<ApiResponse<{ user: User; token: string; tokenType: string }>> => {
    const response = await API.post('/auth/signup', userData);
    return response.data;
  },

  // User login
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string; tokenType: string }>> => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: {
    name?: string;
    department?: string;
    avatar?: string;
  }): Promise<ApiResponse<{ user: User }>> => {
    const response = await API.put('/auth/me', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> => {
    const response = await API.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response = await API.post('/auth/logout');
    return response.data;
  },

  // Get all users (for team member selection)
  getUsers: async (): Promise<ApiResponse<{ users: User[]; count: number }>> => {
    const response = await API.get('/auth/users');
    return response.data;
  },
};

// Project API calls
export const projectAPI = {
  // Get all projects
  getProjects: async (filters?: {
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    order?: string;
  }): Promise<ApiResponse<{ projects: Project[]; count: number }>> => {
    const response = await API.get('/projects', { params: filters });
    return response.data;
  },

  // Get single project
  getProject: async (id: string): Promise<ApiResponse<{ project: Project; tasks: Task[] }>> => {
    const response = await API.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    tags?: string[];
    teamMembers?: Array<{ user: string; role: string }>;
  }): Promise<ApiResponse<{ project: Project }>> => {
    const response = await API.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (id: string, projectData: Partial<Project>): Promise<ApiResponse<{ project: Project }>> => {
    const response = await API.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<ApiResponse> => {
    const response = await API.delete(`/projects/${id}`);
    return response.data;
  },

  // Add team member to project
  addTeamMember: async (id: string, memberData: {
    userId: string;
    role?: string;
  }): Promise<ApiResponse<{ project: Project }>> => {
    const response = await API.post(`/projects/${id}/team-members`, memberData);
    return response.data;
  },

  // Remove team member from project
  removeTeamMember: async (id: string, userId: string): Promise<ApiResponse> => {
    const response = await API.delete(`/projects/${id}/team-members/${userId}`);
    return response.data;
  },

  // Get project statistics
  getStats: async (): Promise<ApiResponse<{ stats: any }>> => {
    const response = await API.get('/projects/stats');
    return response.data;
  },
};

// Task API calls (as specified in requirements with title, description, status, assignedTo, dueDate)
export const taskAPI = {
  // Get all tasks
  getTasks: async (filters?: {
    status?: string;
    priority?: string;
    project?: string;
    assignedTo?: string;
    search?: string;
    sortBy?: string;
    order?: string;
    overdue?: boolean;
    category?: string;
  }): Promise<ApiResponse<{ tasks: Task[]; count: number }>> => {
    const response = await API.get('/tasks', { params: filters });
    return response.data;
  },

  // Get single task
  getTask: async (id: string): Promise<ApiResponse<{ task: Task }>> => {
    const response = await API.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task (with required fields as per requirements)
  createTask: async (taskData: {
    title: string; // Required
    description: string; // Required
    status?: 'Todo' | 'In Progress' | 'Done'; // Required (defaults to Todo)
    assignedTo: string; // Required
    project: string; // Required
    dueDate: string; // Required
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    tags?: string[];
    category?: string;
    estimatedHours?: number;
  }): Promise<ApiResponse<{ task: Task }>> => {
    const response = await API.post('/tasks', taskData);
    return response.data;
  },

  // Update task (supports updating title, description, status, assignedTo, dueDate as per requirements)
  updateTask: async (id: string, taskData: {
    title?: string;
    description?: string;
    status?: 'Todo' | 'In Progress' | 'Done';
    assignedTo?: string;
    dueDate?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  }): Promise<ApiResponse<{ task: Task }>> => {
    const response = await API.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<ApiResponse> => {
    const response = await API.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get tasks assigned to current user
  getMyTasks: async (status?: string): Promise<ApiResponse<{ tasks: Task[]; count: number }>> => {
    const response = await API.get('/tasks/my-tasks', { params: { status } });
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async (): Promise<ApiResponse<{ tasks: Task[]; count: number }>> => {
    const response = await API.get('/tasks/overdue');
    return response.data;
  },

  // Add comment to task
  addComment: async (id: string, content: string): Promise<ApiResponse<{ task: Task }>> => {
    const response = await API.post(`/tasks/${id}/comments`, { content });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<ApiResponse> => {
    const response = await API.get('/health');
    return response.data;
  },
};

export default API;
