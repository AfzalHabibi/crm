# DepLLC CRM Application
https://docs.google.com/document/d/16KWSsYyHUjoJJYcHUoT6OaKQHdxKHjvtY3q7rqBYxyo/edit?usp=sharing
A modern, full-stack CRM application built with Next.js 15, MongoDB, and NextAuth.

## Features

- 🔐 **Authentication & Authorization** - Secure login/signup with role-based access
- 👥 **User Management** - Complete CRUD operations for user management
- 🎨 **Modern UI** - Built with Shadcn/UI and Tailwind CSS
- 🌙 **Dark/Light Theme** - Toggle between themes with persistent settings
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🔄 **State Management** - Redux Toolkit with persistence
- 🛡️ **Type Safety** - Full TypeScript implementation
- 📊 **Dashboard** - Professional dashboard with welcome message and stats

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: Shadcn/UI, Tailwind CSS
- **State Management**: Redux Toolkit with Redux Persist
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd professional-crm
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/professional-crm
   
   # NextAuth Configuration
   NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   
   # App Configuration
   NODE_ENV=development
   \`\`\`

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   \`\`\`bash
   # For local MongoDB
   mongod
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── users/             # User management pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   ├── ui/                # Shadcn/UI components
│   └── users/             # User management components
├── lib/                   # Utility functions
│   ├── validations/       # Zod schemas
│   ├── mongodb.ts         # Database connection
│   └── auth-config.ts     # NextAuth configuration
├── models/                # Mongoose models
├── store/                 # Redux store and slices
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
\`\`\`

## Usage

### Authentication

1. **Register a new account**
   - Navigate to `/auth/register`
   - Fill in your details and select a role
   - Create your account

2. **Login**
   - Go to `/auth/login`
   - Enter your credentials
   - Access the dashboard

### User Management

- **View Users**: Navigate to `/users` to see all system users
- **Create User**: Click "Add User" (Admin/Manager only)
- **Edit User**: Click the edit icon in the user table
- **Delete User**: Click the delete icon (Admin only)

### Dashboard

- View welcome message and system statistics
- Quick access to common actions
- Recent activity feed
- System status information

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Users
- `GET /api/users` - Get all users (with pagination and search)
- `POST /api/users` - Create new user (Admin/Manager)
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (Admin only)

## Roles & Permissions

- **Admin**: Full access to all features including user deletion
- **Manager**: Can create and edit users, cannot delete
- **User**: Can view and edit their own profile

## Theme Support

The application supports both light and dark themes:
- Toggle using the theme button in the header
- Preference is automatically saved
- Consistent styling across all components

## Development

### Adding New Features

1. Create API routes in `app/api/`
2. Add corresponding components in `components/`
3. Update Redux store if needed
4. Add proper TypeScript types
5. Implement proper validation with Zod

### Code Quality

- ESLint configuration for code quality
- TypeScript for type safety
- Consistent component structure
- Proper error handling

## Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Set up production environment variables**
   - Update `MONGODB_URI` for production database
   - Change `NEXTAUTH_SECRET` to a secure value
   - Update `NEXTAUTH_URL` to your domain

3. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS
   - Digital Ocean

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
