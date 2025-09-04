# MPMT Frontend 🎨

React.js frontend application for Mini Project Management Tool with TailwindCSS styling and TypeScript.

## 🛠️ Tech Stack

- **React.js** (v18) with TypeScript
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Modern icon library
- **Context API** - State management

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html          # HTML template
│   └── favicon.ico         # App icon
├── src/
│   ├── components/
│   │   └── Navbar.tsx      # Navigation component
│   ├── context/
│   │   └── AuthContext.tsx # Authentication state
│   ├── pages/
│   │   ├── Login.tsx       # Login page
│   │   ├── Signup.tsx      # Registration page
│   │   └── Dashboard.tsx   # Main dashboard
│   ├── services/
│   │   └── api.ts          # API service layer
│   ├── App.tsx             # Main app component
│   ├── index.tsx           # App entry point
│   └── index.css           # Global styles
├── tailwind.config.js      # TailwindCSS configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## 🚀 Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

   Application will open at `http://localhost:3000`

3. **Build for production**
   ```bash
   npm run build
   ```

## 🎨 Design System

### Color Palette (Light Blue & Green Theme)
```css
Primary Blue:
- 50: #eff6ff (lightest)
- 500: #3b82f6 (main)
- 900: #1e3a8a (darkest)

Secondary Green:
- 50: #ecfdf5 (lightest)
- 500: #10b981 (main)
- 900: #064e3b (darkest)
```

### Custom TailwindCSS Components
- `.btn-primary` - Primary gradient button
- `.btn-secondary` - Secondary outlined button
- `.btn-success` - Success gradient button
- `.card` - Rounded card with shadow
- `.input-field` - Styled form input
- `.status-badge-*` - Task status badges
- `.priority-badge-*` - Priority indicators

### Gradients
- `bg-gradient-primary` - Blue to green gradient
- `bg-gradient-secondary` - Green gradient
- `bg-gradient-light` - Light background gradient

## 🔧 Configuration

### Environment Variables
Create `.env` file in frontend root:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### TailwindCSS Setup
Configuration includes:
- Custom color palette
- Extended typography
- Custom animations
- Responsive breakpoints

## 📱 Features

### Authentication System
- **Login Page**: Professional form with validation
- **Signup Page**: Comprehensive registration
- **Protected Routes**: JWT-based access control
- **User Context**: Global authentication state

### Dashboard
- **Statistics Cards**: Project and task overview
- **Recent Projects**: Latest project activities
- **My Tasks**: User-assigned tasks
- **Overdue Alerts**: Important notifications

### Navigation
- **Responsive Navbar**: Desktop and mobile views
- **User Menu**: Profile dropdown
- **Active States**: Visual route indicators
- **Mobile Menu**: Collapsible navigation

### Form Components
- **Input Fields**: Styled with icons
- **Validation**: Client-side form validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Button loading indicators

## 🎯 Component Architecture

### Authentication Flow
```typescript
AuthProvider → AuthContext → useAuth Hook → Components
```

### API Service Layer
```typescript
api.ts → authAPI, projectAPI, taskAPI → Components
```

### Routing Structure
```
/ → Dashboard (protected)
/login → Login (public)
/signup → Signup (public)
/projects → Projects (protected) *
/tasks → Tasks (protected) *

* Currently shows placeholder pages
```

## 🔐 Authentication

### JWT Token Management
- Stored in `localStorage`
- Automatic API header injection
- Token expiration handling
- Automatic logout on 401 errors

### Protected Routes
All authenticated routes are wrapped with `ProtectedRoute` component that:
- Checks authentication status
- Redirects to login if not authenticated
- Shows loading spinner during auth check

## 📊 State Management

### AuthContext
Provides global state for:
- User information
- Authentication status
- Login/logout functions
- Loading states

### Local Component State
Individual components manage:
- Form data
- Loading states
- Error messages
- UI interactions

## 🎨 Styling Guidelines

### TailwindCSS Conventions
- Use utility classes for spacing and layout
- Custom components for reusable elements
- Responsive design with breakpoint prefixes
- Dark mode ready (not implemented yet)

### Component Styling
```tsx
// Card component example
<div className="card p-6 hover:shadow-lg transition-all duration-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Card Title
  </h3>
  <p className="text-gray-600">Card content</p>
</div>
```

## 📱 Responsive Design

### Breakpoints
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Mobile-First Approach
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly interface elements

## 🧪 Testing

### Available Scripts
```bash
npm test          # Run tests
npm run test:coverage # Test with coverage
npm run build     # Production build
npm run eject     # Eject from CRA
```

## 🔍 Development Tools

### TypeScript
- Full type safety
- Interface definitions for API responses
- Component prop types
- Auto-completion and error checking

### ESLint & Prettier
- Code formatting
- Best practice enforcement
- Consistent code style

## 🚀 Deployment

### Build Production
```bash
npm run build
```

### Deployment Options
- **Netlify**: Drag & drop build folder
- **Vercel**: Connect GitHub repository
- **Firebase Hosting**: `firebase deploy`
- **Static Hosting**: Serve build folder

### Environment Setup
Update API URL for production:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## 🐛 Common Issues

### CORS Errors
- Verify backend CORS configuration
- Check API URL in environment variables

### Build Warnings
- Unused imports
- Missing alt attributes
- Console warnings

### Authentication Issues
- Clear localStorage if tokens corrupted
- Check backend JWT secret consistency

## 🔮 Future Enhancements

### Pages to Implement
- Full Projects page with CRUD operations
- Complete Tasks page with filtering
- User profile settings
- Project details with team management

### Features to Add
- Real-time notifications
- File upload for tasks
- Calendar integration
- Dark mode toggle
- Advanced filtering and search

---

**Frontend ready for your internship demonstration! ✨**
