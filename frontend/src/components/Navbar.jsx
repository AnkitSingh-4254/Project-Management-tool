/**
 * Navbar Component for Project Manager App
 * Simple navigation bar with NO dropdown functionality
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  FolderOpen, 
  CheckSquare, 
  LogOut, 
  User, 
  Menu, 
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavLink = ({ to, children, className = '' }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActiveRoute(to)
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      } ${className}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <nav className="nav-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">Project Manager</span>
                <span className="hidden sm:block text-xs text-gray-500 ml-2 font-medium">App</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </NavLink>
            <NavLink to="/projects">
              <FolderOpen className="h-4 w-4 mr-2" />
              Projects
            </NavLink>
            <NavLink to="/tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks
            </NavLink>
          </div>

          {/* Right side - User info and mobile menu */}
          <div className="flex items-center space-x-4">
            {/* Simple User Display - NO CLICKING */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-900">{user?.name}</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <NavLink to="/dashboard" className="flex items-center">
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </NavLink>
              <NavLink to="/projects" className="flex items-center">
                <FolderOpen className="h-4 w-4 mr-3" />
                Projects
              </NavLink>
              <NavLink to="/tasks" className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-3" />
                Tasks
              </NavLink>
              
              <hr className="my-2" />
              
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <User className="h-4 w-4 mr-3" />
                Profile
              </button>
              
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
