-- Seed data for Roadside Assistance System
-- This includes sample users, helpers, service requests, and ratings

-- Insert sample users (password is "password123" - should be hashed in production)
INSERT INTO users (email, phone, password, name, role) VALUES
  ('john.doe@email.com', '1234567890', 'password123', 'John Doe', 'user'),
  ('jane.smith@email.com', '1234567891', 'password123', 'Jane Smith', 'helper'),
  ('mike.wilson@email.com', '1234567892', 'password123', 'Mike Wilson', 'helper'),
  ('sarah.johnson@email.com', '1234567893', 'password123', 'Sarah Johnson', 'user'),
  ('admin@roadside.com', '1234567894', 'admin123', 'System Admin', 'admin'),
  ('tom.brown@email.com', '1234567895', 'password123', 'Tom Brown', 'helper'),
  ('lisa.davis@email.com', '1234567896', 'password123', 'Lisa Davis', 'user'),
  ('robert.lee@email.com', '1234567897', 'password123', 'Robert Lee', 'helper');

-- Insert sample helpers (linked to users with role 'helper')
INSERT INTO helpers (user_id, skills, address, latitude, longitude, is_available, rating_average, total_ratings) VALUES
  (2, 'Tire Change, Battery Jump, Towing', '123 Main St, City A', 40.7128, -74.0060, 1, 4.5, 10),
  (3, 'Fuel Delivery, Tire Change, Lockout Service', '456 Oak Ave, City B', 40.7580, -73.9855, 1, 4.2, 8),
  (6, 'Battery Jump, Engine Diagnostics, Towing', '789 Pine Rd, City C', 40.7489, -73.9680, 0, 4.8, 15),
  (8, 'Tire Change, Brake Inspection, Oil Change', '321 Elm St, City D', 40.7614, -73.9776, 1, 4.0, 5);

-- Insert sample service requests (some completed, some active)
INSERT INTO service_requests (user_id, helper_id, issue_description, latitude, longitude, status, completed_at) VALUES
  -- Note: `helper_id` references `helpers.id` (not `users.id`). Helpers were inserted in this order:
  -- helpers.id=1 -> users.id=2, helpers.id=2 -> users.id=3, helpers.id=3 -> users.id=6, helpers.id=4 -> users.id=8
  (1, 1, 'Flat tire on highway near exit 42. Need urgent help!', 40.7128, -74.0060, 'completed', datetime('now', '-2 days')),
  (4, 2, 'Car won''t start, battery seems dead. Location: parking lot', 40.7580, -73.9855, 'completed', datetime('now', '-1 day')),
  (7, 1, 'Ran out of gas on Route 9. Need fuel delivery.', 40.7489, -73.9680, 'completed', datetime('now', '-5 hours')),
  -- Removed an active 'requested' entry for user 1 to allow creating new requests in dev/testing
  (4, 3, 'Locked keys inside car. Need lockout service.', 40.7400, -73.9900, 'accepted', NULL);

-- Insert sample ratings (mutual ratings for completed services)
-- Service Request 1: User 1 rated Helper (User 2)
INSERT INTO ratings (service_request_id, rater_id, rated_id, stars, feedback) VALUES
  (1, 1, 2, 5, 'Very quick response! Changed my tire in 15 minutes. Highly recommended!'),
  (1, 2, 1, 5, 'Friendly customer, easy to work with.');

-- Service Request 2: User 4 rated Helper (User 3)
INSERT INTO ratings (service_request_id, rater_id, rated_id, stars, feedback) VALUES
  (2, 4, 3, 4, 'Good service but took a bit longer than expected.'),
  (2, 3, 4, 5, 'Patient customer, great communication.');

-- Service Request 3: User 7 rated Helper (User 2)
INSERT INTO ratings (service_request_id, rater_id, rated_id, stars, feedback) VALUES
  (3, 7, 2, 4, 'Delivered fuel quickly. Price was reasonable.'),
  (3, 2, 7, 4, 'Good customer, clear location directions.');
