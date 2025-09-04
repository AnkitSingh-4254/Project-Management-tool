/**
 * Tasks Page Component for Mini Project Management Tool (MPMT)
 * Provides full CRUD operations for tasks with all required fields
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, projectAPI, Task, Project, authAPI, User } from '../services/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  User as UserIcon,
  CheckSquare,
  Clock,
  Filter,
  Search,
  X
} from 'lucide-react';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Todo' as 'Todo' | 'In Progress' | 'Done',
    assignedTo: '',
    project: '',
    dueDate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskAPI.getTasks(),
        projectAPI.getProjects(),
        authAPI.getUsers()
      ]);

      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data.tasks);
      }

      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data.projects);
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users);
      }
    } catch (error: any) {
      setError('Failed to load data');
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.project || !taskForm.dueDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const response = await taskAPI.createTask({
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        assignedTo: taskForm.assignedTo,
        project: taskForm.project,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority
      });

      if (response.success) {
        setShowCreateModal(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const response = await taskAPI.updateTask(editingTask._id, {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        assignedTo: taskForm.assignedTo,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority
      });

      if (response.success) {
        setShowEditModal(false);
        setEditingTask(null);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await taskAPI.deleteTask(taskId);
      if (response.success) {
        loadData();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      assignedTo: task.assignedTo._id,
      project: task.project._id,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      priority: task.priority
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: 'Todo',
      assignedTo: '',
      project: '',
      dueDate: '',
      priority: 'Medium'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Todo': return 'badge-todo';
      case 'In Progress': return 'badge-progress';
      case 'Done': return 'badge-done';
      default: return 'badge-todo';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Low': return 'badge-low';
      case 'Medium': return 'badge-medium';
      case 'High': return 'badge-high';
      case 'Urgent': return 'badge-urgent';
      default: return 'badge-medium';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesSearch = !filters.search || 
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage your tasks with full CRUD operations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 float-right"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="filter-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="input-field"
                style={{width: '150px'}}
              >
                <option value="all">All Status</option>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="input-field"
                style={{width: '150px'}}
              >
                <option value="all">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search tasks..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(task)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {task.assignedTo.name}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>

                <div className="text-xs text-gray-400">
                  Project: {task.project.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-4">Create your first task to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                  <button
                    onClick={() => {setShowCreateModal(false); resetForm();}}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      className="input-field"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                      className="input-field"
                      required
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To *
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project *
                    </label>
                    <select
                      value={taskForm.project}
                      onChange={(e) => setTaskForm({...taskForm, project: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>{project.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                      className="input-field"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {setShowCreateModal(false); resetForm();}}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                  <button
                    onClick={() => {setShowEditModal(false); setEditingTask(null); resetForm();}}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      className="input-field"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({...taskForm, status: e.target.value as any})}
                      className="input-field"
                      required
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To *
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                      className="input-field"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {setShowEditModal(false); setEditingTask(null); resetForm();}}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
