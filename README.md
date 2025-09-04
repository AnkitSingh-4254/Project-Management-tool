# Mini Project Management Tool (MPMT) 🚀

A comprehensive MERN stack project management application built for B.Tech Computer Science internship project.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

MPMT (Mini Project Management Tool) is a full-stack web application that allows users to manage projects and tasks efficiently. Built with modern technologies, it provides a clean and intuitive interface for project collaboration and task management.

### Key Highlights:
- 🔐 **JWT Authentication** with secure login/signup
- 📊 **Project Management** with CRUD operations
- ✅ **Task Management** with status tracking (Todo/In Progress/Done)
- 👥 **Team Collaboration** with user assignment
- 📱 **Responsive Design** with TailwindCSS
- 🎨 **Professional UI** with light blue and green theme

## ✨ Features

### Backend Features
- **User Authentication**
  - Secure signup/login with JWT tokens
  - Password hashing with bcrypt
  - Protected routes with middleware
  
- **Project Management**
  - Create, read, update, delete projects
  - Project status tracking
  - Team member management
  
- **Task Management**
  - ✅ Complete CRUD operations on tasks (CREATE, READ, UPDATE, DELETE)
  - Task fields: title, description, status, assignedTo, project, dueDate, priority
  - Task status: Todo, In Progress, Done
  - Task filtering by status, priority, and search
  - Task assignment to team members
  - Modal-based task creation and editing
  
- **Middleware & Security**
  - Authentication middleware
  - Global error handler
  - Input validation

### Frontend Features
- **Authentication Pages**
  - Professional login page
  - Comprehensive signup form
  - Form validation and error handling
  
- **Dashboard**
  - Project and task overview
  - Statistics cards
  - Recent activity display
  
- **Tasks Management Page**
  - ✅ Complete task CRUD operations with professional UI
  - Grid-based task display with cards
  - Advanced filtering (status, priority, search)
  - Modal forms for creating and editing tasks
  - Task assignment to team members
  - Status and priority badges
  - Delete confirmation dialogs
  
- **Projects Management Page**
  - ✅ Complete project CRUD operations
  - Project status and priority management
  - Team member assignments
  - Professional card-based layout
  
- **Responsive Navigation**
  - TailwindCSS styled navbar
  - Mobile-responsive design
  - User profile dropdown

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** (with TypeScript) - Frontend library
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Context API** - State management

## 📁 Project Structure

```
mpmt-internship/
├── backend/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Server entry point
│
├── frontend/              # React frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   ├── package.json      # Frontend dependencies
│   └── tailwind.config.js # TailwindCSS config
│
└── README.md             # Project documentation
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env` file and update with your MongoDB connection string
   - Update JWT secret key for production

4. **Start the backend server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

   The backend server will start on `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend application**
   ```bash
   npm start
   ```

   The frontend application will start on `http://localhost:3001`

### Database Setup

1. **Local MongoDB**
   - Install MongoDB on your system
   - Start MongoDB service
   - Database will be created automatically

2. **MongoDB Atlas (Recommended)**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a cluster
   - Update connection string in `.env` file

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/logout` - User logout
- `GET /api/auth/users` - Get all users (for team member selection)

### Project Endpoints
- `GET /api/projects` - Get all projects (with filtering)
- `GET /api/projects/:id` - Get single project with tasks
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/team-members` - Add team member
- `DELETE /api/projects/:id/team-members/:userId` - Remove team member
- `GET /api/projects/stats` - Get project statistics

### Task Endpoints ✅
- `GET /api/tasks` - Get all tasks (with filtering by status, priority, project, etc.)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task (requires: title, description, assignedTo, project, dueDate)
- `PUT /api/tasks/:id` - Update task (title, description, status, assignedTo, dueDate, priority)
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/my-tasks` - Get current user's assigned tasks
- `GET /api/tasks/overdue` - Get overdue tasks
- `POST /api/tasks/:id/comments` - Add comment to task

## 🎨 Design Features

### Color Scheme
- **Primary**: Light blue (#3b82f6)
- **Secondary**: Light green (#10b981)
- **Background**: Soft gradients
- **Cards**: Rounded with subtle shadows

### Components
- Professional gradient buttons
- Responsive cards and layouts
- Status badges for tasks
- Priority indicators
- Mobile-friendly navigation

## 🤝 Contributing

This is an internship project for educational purposes. However, suggestions and improvements are welcome!

## 📝 License

This project is created for educational purposes as part of a B.Tech Computer Science internship project.

## 👨‍💻 Author

Created by a B.Tech Computer Science student as an internship project demonstrating full-stack development skills with the MERN stack.

---

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for MongoDB Atlas

2. **Port Already in Use**
   - Backend: Change PORT in `.env`
   - Frontend: React will suggest alternative port

3. **CORS Errors**
   - Verify frontend URL in backend CORS configuration
   - Check API base URL in frontend

4. **Authentication Issues**
   - Clear browser storage (localStorage)
   - Verify JWT secret consistency

### Development Tips

- Use MongoDB Compass for database visualization
- Use Postman for API testing
- Check browser console for frontend errors
- Monitor backend logs for debugging

---

**Happy Coding! 🚀**
