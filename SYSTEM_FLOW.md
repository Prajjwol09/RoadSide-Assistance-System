# Roadside Assistance System - System Flow Explanation

## Overview
This document explains the complete workflow of the Roadside Assistance System for easy understanding during viva presentations.

## User Registration Flow

### 1. User Registration as Regular User
1. User navigates to `/register`
2. Fills in basic information (name, email, phone, password)
3. Selects role: "User" (Request roadside assistance)
4. System creates account in `users` table
5. User is automatically logged in with session cookie
6. Redirected to user dashboard

### 2. Helper Registration
1. User navigates to `/register`
2. Fills in basic information (name, email, phone, password)
3. Selects role: "Helper" (Provide roadside assistance)
4. Fills additional helper information:
   - Skills & services (e.g., "Tire Change, Battery Jump, Towing")
   - Service area address
   - Location coordinates (optional)
5. System creates account in `users` table with role='helper'
6. System creates helper profile in `helpers` table
7. Helper is automatically logged in
8. Redirected to helper dashboard

## Service Request Lifecycle

### Phase 1: Request Creation (User Action)
1. User logs in and navigates to dashboard
2. Clicks "New Request" button
3. Fills in request form:
   - Issue description (free-text)
   - Location (can use "Get My Location" button or enter manually)
4. System validates:
   - User doesn't have another active request
   - Location coordinates are valid
5. System creates new request with status='requested'
6. User redirected to request detail page

### Phase 2: Helper Selection (User Action)
1. User views request details
2. System displays list of available helpers:
   - Shows helper name, skills, address
   - Displays rating and number of reviews
   - Shows availability status
3. User manually selects a helper
4. System updates request:
   - Sets helper_id to selected helper
   - Changes status to 'pending'
5. Helper receives notification (visible in their dashboard)

### Phase 3: Request Acceptance (Helper Action)
1. Helper logs in to their dashboard
2. Sees pending request in "My Active Requests"
3. Clicks "View Details" to see request information
4. Reviews:
   - User details
   - Issue description
   - Location coordinates
5. Clicks "Accept Request" button
6. System updates:
   - Request status to 'accepted'
   - Helper's availability to 'unavailable' (automatic)
7. Helper can now proceed to assist the user

### Phase 4: Service Completion (User Action)
1. After helper completes the service
2. User clicks "Mark as Completed" button
3. System updates:
   - Request status to 'completed'
   - Sets completion timestamp
4. User is redirected to rating page

### Phase 5: Mutual Ratings (Both Parties)
1. **User Rating Helper:**
   - User navigates to rate page
   - Selects star rating (1-5)
   - Optionally adds text feedback
   - Submits rating
   - System calculates new average rating for helper
   - Updates helper's rating_average and total_ratings

2. **Helper Rating User:**
   - Helper can rate the user similarly
   - Ratings are stored separately
   - Both can only rate once per service request

## Helper Availability Management

### Manual Toggle
1. Helper navigates to dashboard
2. Sees "Availability Status" toggle
3. Can switch between Available/Unavailable
4. System updates `is_available` field in `helpers` table

### Automatic Change
- When helper accepts a request, availability automatically changes to "unavailable"
- Prevents helper from being overwhelmed with multiple requests
- Helper can manually change back to available after completing service

## Admin Panel Features

### Dashboard Overview
1. Admin logs in with admin credentials
2. Sees system statistics:
   - Total Users
   - Total Helpers
   - Total Requests
   - Completed Requests

### View Users
- Complete list of all registered users
- Shows: ID, Name, Email, Phone, Role, Join Date
- View-only access (no editing)

### View Helpers
- Complete list of all helpers
- Shows: ID, Name, Skills, Rating, Availability
- Sorted by rating for easy quality assessment

### View Requests
- Complete service request history
- Shows: Request ID, User, Helper, Issue, Status, Date
- All statuses visible: requested, pending, accepted, completed

## Matching Algorithm (Optional)

### Basic Matching Logic
```typescript
// Simple algorithm to suggest best helper for a request
function suggestHelper(request, helpers) {
  // Filter available helpers
  const availableHelpers = helpers.filter(h => h.is_available)
  
  // Sort by rating (highest first)
  availableHelpers.sort((a, b) => b.rating_average - a.rating_average)
  
  // Optionally: Calculate distance if coordinates available
  // Optionally: Match skills with request keywords
  
  return availableHelpers[0] // Return best match
}
```

### Explanation for Viva:
- **Input:** Service request with location and issue description
- **Process:** 
  1. Filter only available helpers
  2. Sort by rating (best helpers first)
  3. Optional: Consider proximity using coordinates
  4. Optional: Match helper skills with issue keywords
- **Output:** Suggested helper for the request
- **User Choice:** System suggests but user makes final selection

## Key Database Relationships

### Users ↔ Helpers
- One-to-One: A user can have one helper profile
- Foreign Key: `helpers.user_id` → `users.id`
- A single account can be both user and helper

### Service Requests
- Many-to-One: User creates many requests
- Many-to-One: Helper handles many requests
- Foreign Keys:
  - `service_requests.user_id` → `users.id`
  - `service_requests.helper_id` → `helpers.id`

### Ratings
- Many-to-One: Linked to service request
- Constraints:
  - Can only rate completed requests
  - Each person can rate only once per request
  - Unique constraint on (service_request_id, rater_id, rated_id)

## Security Features

### Session Management
- Session stored in HTTP-only cookie
- Session contains: user ID, email, name, role
- Automatic session validation on protected routes

### Role-Based Access Control
- User: Can create requests, rate helpers
- Helper: Can view/accept requests, rate users
- Admin: View-only access to all system data

### Data Validation
- Email and phone uniqueness enforced
- Password validation (should use bcrypt in production)
- Status transition validation (can't skip steps)
- Rating range validation (1-5 stars only)

## CRUD Operations Demonstration

### Create
- User registration (INSERT into users)
- Helper profile creation (INSERT into helpers)
- Service request creation (INSERT into service_requests)
- Rating submission (INSERT into ratings)

### Read
- View dashboard (SELECT requests, helpers)
- View helper profiles (SELECT with JOIN)
- Admin statistics (SELECT with COUNT)
- Request history (SELECT with filters)

### Update
- Helper availability toggle (UPDATE helpers)
- Request status changes (UPDATE service_requests)
- Helper rating recalculation (UPDATE helpers)
- Session updates (UPDATE via cookies)

### Delete
- Account deletion (DELETE with CASCADE)
- Would remove user, helper profile, and related data
- Demonstrates foreign key relationships

## Viva Preparation Tips

### Questions You Might Be Asked

1. **"Explain the complete flow from user registration to service completion"**
   - Follow the Service Request Lifecycle section above
   - Emphasize status transitions and role-based actions

2. **"How does the rating system work?"**
   - Mutual rating (both can rate)
   - Prevents duplicates
   - Automatic average calculation
   - Updates helper's public rating

3. **"What happens when a helper accepts a request?"**
   - Status changes to 'accepted'
   - Helper availability automatically set to unavailable
   - Prevents overbooking

4. **"How is data integrity maintained?"**
   - Foreign key constraints
   - Unique constraints (email, phone)
   - Status validation
   - Transaction-like operations

5. **"What is the role of the admin?"**
   - View-only monitoring
   - System statistics
   - User/helper management visibility
   - Request history tracking

6. **"How would you improve this system?"**
   - Real-time notifications (WebSocket)
   - Payment integration
   - GPS tracking
   - Mobile app
   - Advanced matching algorithm with ML

### Demonstration Script

1. Show registration (both user and helper)
2. Create a service request as user
3. Select a helper from the list
4. Switch to helper account, accept request
5. Show availability changes automatically
6. Mark request as completed
7. Rate helper with feedback
8. Show updated rating on helper profile
9. Login as admin, show all data

### Technical Points to Emphasize

- **Simple Architecture:** Easy to understand and explain
- **Session-based Auth:** No complex JWT, easy to debug
- **SQLite Benefits:** Embedded, no separate server, portable
- **Foreign Keys:** Maintains data relationships
- **CRUD Visibility:** Every operation is traceable
- **Role Separation:** Clear user/helper/admin boundaries
- **Status Tracking:** Complete request lifecycle visible
