-- SQLite Database Schema for Roadside Assistance System
-- This script creates all necessary tables with proper relationships

-- Users table: Stores both regular users and helpers
-- Note: A single account can act as both User and Helper (role-switchable)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, this should be hashed
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- Can be 'user', 'helper', or 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Helpers table: Additional profile information for helpers
-- Links to users table via user_id foreign key
CREATE TABLE IF NOT EXISTS helpers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  skills TEXT NOT NULL, -- e.g., "tire change, towing, battery jump"
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  is_available INTEGER DEFAULT 1, -- 1 = available, 0 = not available
  rating_average REAL DEFAULT 0.0, -- Average rating from users
  total_ratings INTEGER DEFAULT 0, -- Number of ratings received
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service Requests table: Stores all service requests
-- Tracks the complete lifecycle of a request from creation to completion
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL, -- User who created the request
  helper_id INTEGER, -- Helper assigned to the request (NULL initially)
  issue_description TEXT NOT NULL, -- Free-text description of the problem
  latitude REAL NOT NULL, -- Location of the issue
  longitude REAL NOT NULL,
  status TEXT DEFAULT 'requested', -- Status: 'requested', 'pending', 'accepted', 'completed', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (helper_id) REFERENCES helpers(id) ON DELETE SET NULL
);

-- Service Request Images: store uploaded images for a request
CREATE TABLE IF NOT EXISTS service_request_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_request_id INTEGER NOT NULL,
  file_path TEXT NOT NULL, -- relative path under /public
  original_name TEXT,
  content_type TEXT,
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- Track helper responses (accept/decline) per service request
CREATE TABLE IF NOT EXISTS service_request_helper_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_request_id INTEGER NOT NULL,
  helper_id INTEGER NOT NULL,
  response TEXT NOT NULL, -- 'accepted' or 'declined'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (helper_id) REFERENCES helpers(id) ON DELETE CASCADE,
  UNIQUE(service_request_id, helper_id)
);

-- Ratings table: Stores mutual ratings between users and helpers
-- Each service request can have up to 2 ratings (user->helper and helper->user)
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_request_id INTEGER NOT NULL,
  rater_id INTEGER NOT NULL, -- User who is giving the rating
  rated_id INTEGER NOT NULL, -- User who is being rated
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5), -- Rating from 1 to 5
  feedback TEXT, -- Optional text feedback
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(service_request_id, rater_id, rated_id) -- Prevent duplicate ratings
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_helpers_available ON helpers(is_available);
CREATE INDEX IF NOT EXISTS idx_service_requests_user ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_helper ON service_requests(helper_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_ratings_service_request ON ratings(service_request_id);
