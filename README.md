# Roadside Assistance System

A complete full-stack roadside assistance platform built with Next.js, TypeScript, and SQLite.

## Features

- **User Management**: Registration, login, and role-based access control
- **Helper Profiles**: Helpers can manage their availability, skills, and service areas
- **Service Requests**: Users can create and track service requests with real-time status updates
- **Smart Matching**: Manual helper selection based on skills and availability
- **Mutual Rating System**: Both users and helpers can rate each other after service completion
- **Admin Dashboard**: Comprehensive overview of all users, helpers, and service requests

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Authentication**: Cookie-based session management

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env` with the generated secret and other configurations.

### 3. Initialize Database

```bash
npm run db:init
```

This will:
- Create the `data` directory
- Initialize the SQLite database
- Create all tables with proper relationships
- Seed sample data for testing

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Default Login Credentials

### Regular Users
- john.doe@email.com / password123
- sarah.johnson@email.com / password123
- lisa.davis@email.com / password123

### Helpers
- jane.smith@email.com / password123
- mike.wilson@email.com / password123
- tom.brown@email.com / password123

### Admin
- admin@roadside.com / admin123

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:init` | Initialize database with schema and seed data |
| `npm run db:reset` | Delete and recreate database (warning: data loss!) |

## Project Structure

```
roadside-assistance/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── requests/        # Service request endpoints
│   │   ├── helpers/         # Helper management endpoints
│   │   ├── ratings/         # Rating system endpoints
│   │   └── admin/           # Admin panel endpoints
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── dashboard/           # User dashboard
│   ├── helper/              # Helper dashboard
│   └── admin/               # Admin panel
├── components/              # Reusable React components
│   ├── ui/                  # shadcn/ui components
│   └── navbar.tsx           # Navigation component
├── lib/                     # Utility functions
│   ├── db.ts               # Database connection
│   ├── auth.ts             # Authentication helpers
│   ├── config.ts           # Environment configuration
│   └── utils.ts            # General utilities
├── scripts/                 # Database scripts
│   ├── 01-create-schema.sql # Database schema
│   ├── 02-seed-data.sql    # Seed data
│   └── init-db.ts          # Database initialization script
└── data/                    # SQLite database directory
    └── roadside.db         # Database file (created after init)
```

## Database Schema

### Tables

1. **users** - All user accounts (users, helpers, admin)
2. **helpers** - Helper-specific profile data
3. **service_requests** - Service request tracking
4. **ratings** - Mutual rating system

### Relationships

- Users → Helpers (one-to-one)
- Users → Service Requests (one-to-many)
- Helpers → Service Requests (one-to-many)
- Service Requests → Ratings (one-to-many)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Service Requests
- `GET /api/requests/my-requests` - Get user's requests
- `GET /api/requests/available` - Get available requests for helpers
- `POST /api/requests/create` - Create new request
- `GET /api/requests/[id]` - Get request details
- `POST /api/requests/[id]/select-helper` - User selects helper
- `POST /api/requests/[id]/accept` - Helper accepts request
- `POST /api/requests/[id]/complete` - Mark request as completed

### Helpers
- `GET /api/helpers/list` - List available helpers
- `GET /api/helpers/profile` - Get helper profile
- `PUT /api/helpers/availability` - Toggle availability

### Ratings
- `POST /api/ratings/create` - Create rating
- `GET /api/ratings/check` - Check if rating exists
- `GET /api/ratings/service-request/[id]` - Get ratings for request

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/helpers` - List all helpers
- `GET /api/admin/requests` - List all requests

## System Flow

1. **User Registration**: New users register with email, password, and role (user/helper)
2. **Helper Setup**: Helpers complete their profile with skills and location
3. **Request Creation**: Users create service requests with issue description
4. **Helper Selection**: Users browse and select available helpers
5. **Request Acceptance**: Selected helpers accept or reject requests
6. **Service Completion**: Helpers mark requests as completed
7. **Mutual Rating**: Both parties rate each other after completion
8. **Rating Updates**: Helper average ratings are automatically calculated

## Security Features

- Password hashing (bcrypt recommended for production)
- HTTP-only cookies for session management
- CSRF protection via same-site cookies
- Role-based access control
- Foreign key constraints for data integrity
- SQL injection prevention via parameterized queries

## Development Notes

- The database uses SQLite for simplicity and portability
- Sessions are stored in cookies (consider Redis for production)
- All API routes validate user authentication and authorization
- Frontend uses SWR for efficient data fetching and caching

## Production Deployment

Before deploying to production:

1. Generate a strong `SESSION_SECRET`
2. Implement proper password hashing (bcrypt)
3. Consider using PostgreSQL instead of SQLite
4. Add rate limiting to API routes
5. Enable HTTPS
6. Set up proper logging and monitoring
7. Configure CORS if needed
8. Add input validation on all endpoints

## License

MIT License - Feel free to use this project for your academic purposes.

## Support

For questions or issues, please refer to the setup documentation in `SETUP.md` or the system flow guide in `SYSTEM_FLOW.md`.
