# MPMT Backend API 🚀

Node.js backend server for Mini Project Management Tool with Express.js, MongoDB, and JWT authentication.

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── projectController.js # Project management
│   └── taskController.js    # Task management
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── errorHandler.js     # Global error handling
├── models/
│   ├── User.js             # User schema
│   ├── Project.js          # Project schema
│   └── Task.js             # Task schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── projects.js         # Project routes
│   └── tasks.js            # Task routes
├── .env                    # Environment variables
├── package.json            # Dependencies
└── server.js              # Server entry point
```

## 🚀 Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   - Update `.env` file with your MongoDB connection string
   - Set JWT_SECRET for token encryption

3. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Configuration

Create or update `.env` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mpmt_internship
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mpmt_internship

# JWT Secret (change in production!)
JWT_SECRET=your_super_secret_jwt_key_for_internship_project_2024

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user (protected)
- `PUT /me` - Update profile (protected)
- `PUT /change-password` - Change password (protected)
- `POST /logout` - Logout (protected)
- `GET /users` - Get all users (protected)

### Projects (`/api/projects`)
- `GET /` - Get all projects (protected)
- `GET /stats` - Get project statistics (protected)
- `GET /:id` - Get single project (protected)
- `POST /` - Create project (protected)
- `PUT /:id` - Update project (protected)
- `DELETE /:id` - Delete project (protected)
- `POST /:id/team-members` - Add team member (protected)
- `DELETE /:id/team-members/:userId` - Remove team member (protected)

### Tasks (`/api/tasks`)
- `GET /` - Get all tasks (protected)
- `GET /my-tasks` - Get user's tasks (protected)
- `GET /overdue` - Get overdue tasks (protected)
- `GET /:id` - Get single task (protected)
- `POST /` - Create task with required fields (protected)
- `PUT /:id` - Update task (protected)
- `DELETE /:id` - Delete task (protected)
- `POST /:id/comments` - Add comment (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in request headers:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Required Task Fields

When creating tasks via `POST /api/tasks`, include these required fields as specified in the project requirements:

```json
{
  "title": "Task title (required)",
  "description": "Task description",
  "status": "Todo", // Todo, In Progress, or Done (defaults to Todo)
  "assignedTo": "user_id_here (required)",
  "project": "project_id_here (required)",
  "dueDate": "2024-12-31 (required)",
  "priority": "Medium", // Low, Medium, High, Urgent (optional)
  "category": "Development" // Optional
}
```

## 🗃️ Database Models

### User Model
- name (required, 2-50 chars)
- email (required, unique, validated)
- password (required, min 6 chars, hashed)
- role (user/admin/manager, default: user)
- department (optional)
- isActive (boolean, default: true)

### Project Model
- title (required, 3-100 chars)
- description (optional, max 500 chars)
- status (Planning/In Progress/On Hold/Completed/Cancelled)
- priority (Low/Medium/High/Urgent)
- owner (required, User reference)
- teamMembers (array of User references with roles)
- startDate, dueDate (dates)
- progress (0-100%)
- tags (array of strings)

### Task Model
- title (required, 3-100 chars)
- description (optional, max 1000 chars)
- status (Todo/In Progress/Done) - as per requirements
- assignedTo (required, User reference) - as per requirements
- project (required, Project reference)
- createdBy (required, User reference)
- dueDate (required) - as per requirements
- priority (Low/Medium/High/Urgent)
- progress (0-100%)
- estimatedHours, actualHours (numbers)

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Protected Routes**: Middleware authentication
- **Input Validation**: Mongoose schema validation
- **Error Handling**: Comprehensive error management
- **CORS**: Configured for frontend communication

## 🔍 Health Check

Test server status:
```bash
GET http://localhost:5000/api/health
```

## 🐛 Debugging

### Enable Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error messages and stack traces.

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
2. **Port Conflicts**: Change PORT in `.env` if 5000 is occupied
3. **JWT Errors**: Verify JWT_SECRET consistency
4. **CORS Issues**: Check FRONTEND_URL in `.env`

### Logging
Server logs include:
- MongoDB connection status
- Server startup information
- Request/response details (in development)
- Error details and stack traces

## 📊 Database Indexing

Optimized database queries with indexes on:
- User: email (unique)
- Project: owner, status, dueDate, tags
- Task: project+status, assignedTo+dueDate, createdBy

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use secure MongoDB connection (MongoDB Atlas recommended)
3. Generate strong JWT_SECRET
4. Configure proper CORS origins
5. Enable MongoDB authentication
6. Use process managers (PM2, Forever)

---

**Backend API ready for your internship project! 🎯**
