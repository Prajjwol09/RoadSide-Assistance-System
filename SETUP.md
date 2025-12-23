# Roadside Assistance System - Setup Instructions

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following variables:
- `SESSION_SECRET` - Generate a secure random string (run the command below)
- `DATABASE_PATH` - Path where SQLite database will be stored (default: ./data/roadside.db)
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - Admin login credentials

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Development Server
```bash
npm run dev
```

The application will automatically:
- Create the `data` directory if it doesn't exist
- Initialize the SQLite database
- Run the schema creation scripts
- Seed initial data

The application will be available at `http://localhost:3000`

## Default Login Credentials

### Users
- Email: `john.doe@email.com` | Password: `password123`
- Email: `sarah.johnson@email.com` | Password: `password123`
- Email: `lisa.davis@email.com` | Password: `password123`

### Helpers
- Email: `jane.smith@email.com` | Password: `password123`
- Email: `mike.wilson@email.com` | Password: `password123`
- Email: `tom.brown@email.com` | Password: `password123`
- Email: `robert.lee@email.com` | Password: `password123`

### Admin
- Email: `admin@roadside.com` | Password: `admin123`
- **Note**: These can be changed in the `.env` file

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_SECRET` | Secret key for session encryption | (required) |
| `DATABASE_PATH` | Path to SQLite database file | `./data/roadside.db` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `ADMIN_EMAIL` | Default admin email | `admin@roadside.com` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |
| `DEBUG` | Enable debug logging | `false` |

## Project Structure

```
roadside-assistance/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # User dashboard
│   ├── helper/            # Helper dashboard
│   └── admin/             # Admin panel
├── components/            # Reusable React components
├── lib/                   # Utility functions
│   ├── db.ts             # Database connection
│   └── auth.ts           # Authentication helpers
├── scripts/               # Database scripts
│   ├── 01-create-schema.sql
│   └── 02-seed-data.sql
└── data/                  # Directory for SQLite database file (created after setup)
    └── roadside.db       # SQLite database file (created after setup)
```

## Database Schema Overview

### Tables
1. **users** - Stores all user accounts (users, helpers, admin)
2. **helpers** - Additional profile for helpers (skills, availability, location)
3. **service_requests** - All service requests with status tracking
4. **ratings** - Mutual ratings between users and helpers

### Relationships
- A user can be both a regular user AND a helper (role-switchable)
- Service requests link users with helpers
- Ratings are tied to completed service requests
- Foreign keys ensure data integrity

## Features Implemented

✅ User registration and login
✅ Helper profile management
✅ Service request creation
✅ Helper selection by user
✅ Status tracking (requested → accepted → completed)
✅ Helper availability toggle
✅ Mutual rating system
✅ Search/filter helpers by skills
✅ Admin dashboard
✅ Session-based authentication

## Viva Explanation Tips

### System Flow
1. User registers/logs in
2. User creates a service request with issue description and location
3. User can browse available helpers and manually select one
4. Helper receives notification and can accept the request
5. Helper's availability automatically changes to "not available"
6. After service completion, both parties can rate each other
7. Ratings update the helper's average rating

### Key Points for Viva
- **CRUD Operations**: Demonstrated in all modules (Create requests, Read helper list, Update status, Delete accounts)
- **Session Management**: Simple cookie-based sessions for easy explanation
- **Database Design**: Normalized schema with proper foreign keys
- **Matching Algorithm**: Optional basic matching based on skills and availability (can be explained in code comments)
- **Security**: Role-based access control, session validation

### Technology Choices
- **SQLite**: Lightweight, no separate server needed, easy to demonstrate
- **Next.js**: Full-stack framework, combines frontend and backend
- **better-sqlite3**: Synchronous API, simpler than async for learning
- **Session Cookies**: Easy to understand and explain

## Troubleshooting

### Database not created
- Ensure you have write permissions in the project directory
- Check that better-sqlite3 is installed correctly

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
