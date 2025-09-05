/**
 * Dashboard Page Component for Mini Project Management Tool (MPMT)
 * Main dashboard showing projects and tasks overview with TailwindCSS styling
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI, Project, Task } from '../services/api';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  Plus, 
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';

const Dashboard= () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load projects, my tasks, and overdue tasks in parallel
      const [projectsRes, myTasksRes, overdueRes] = await Promise.all([
        projectAPI.getProjects({ sortBy: 'updatedAt', order: 'desc' }),
        taskAPI.getMyTasks(),
        taskAPI.getOverdueTasks()
      ]);

      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data.projects.slice(0, 6)); // Show only recent 6 projects
      }

      if (myTasksRes.success && myTasksRes.data) {
        setMyTasks(myTasksRes.data.tasks.slice(0, 8)); // Show only recent 8 tasks
      }

      if (overdueRes.success && overdueRes.data) {
        setOverdueTasks(overdueRes.data.tasks);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Todo':
        return 'status-badge-todo';
      case 'In Progress':
        return 'status-badge-progress';
      case 'Done':
        return 'status-badge-done';
      default:
        return 'status-badge-todo';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'priority-badge-low';
      case 'Medium':
        return 'priority-badge-medium';
      case 'High':
        return 'priority-badge-high';
      case 'Urgent':
        return 'priority-badge-urgent';
      default:
        return 'priority-badge-medium';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'Done' && new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your projects and tasks
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{myTasks.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myTasks.filter(task => task.status === 'Done').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FolderOpen className="h-5 w-5 mr-2 text-primary-600" />
                Recent Projects
              </h2>
              <Link
                to="/projects"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                View All
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No projects found</p>
                <Link to="/projects" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project._id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={getPriorityBadgeClass(project.priority)}>{project.priority}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(project.updatedAt)}
                        </span>
                        {project.teamMembers && project.teamMembers.length > 0 && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {project.teamMembers.length} members
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link
                        to={`/projects/${project._id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-secondary-600" />
                My Tasks
              </h2>
              <Link
                to="/tasks"
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                View All
              </Link>
            </div>

            {myTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tasks assigned to you</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <div key={task._id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={getStatusBadgeClass(task.status)}>{task.status}</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due {formatDate(task.dueDate)}
                        </span>
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="text-xs text-red-600 font-medium">Overdue</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/projects/${task.project._id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium ml-3"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-900">
                Overdue Tasks ({overdueTasks.length})
              </h3>
            </div>
            <p className="text-red-700 mb-4">
              You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} that need immediate attention.
            </p>
            <Link
              to="/tasks?filter=overdue"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Clock className="h-4 w-4 mr-2" />
              View Overdue Tasks
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/projects"
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-4">
                <Plus className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create New Project</h3>
                <p className="text-gray-600 text-sm">Start a new project and invite team members</p>
              </div>
            </div>
          </Link>

          <Link
            to="/tasks"
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-4">
                <CheckSquare className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View All Tasks</h3>
                <p className="text-gray-600 text-sm">Manage and track all your tasks</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
