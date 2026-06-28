-- ============================================================
-- HirerMind Database Seeder
-- Run AFTER migration.sql to populate initial/default data
-- ============================================================

USE hirermind_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. Seed Admin User
-- Password: 'admin123' hashed with bcrypt (10 rounds)
-- IMPORTANT: Change this password after first login
-- ============================================================
INSERT INTO `users` (`id`, `userType`, `firstName`, `lastName`, `email`, `password`, `profile_completed`, `createdAt`, `updatedAt`)
VALUES (
  99999,
  'admin',
  'Admin',
  'User',
  'admin@hirermind.com',
  '$2b$10$8KzaNdKIMyOkASCakNL6/esXFhsjSAHDHnGPmXHBgKYGPAGFXoJCi',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE userType = 'admin';

-- ============================================================
-- 2. Seed Subscription Plans
-- ============================================================
INSERT INTO `subscription_plans` (`name`, `slug`, `phone_screenings_limit`, `technical_interviews_limit`, `price_monthly`, `price_yearly`, `features`, `sort_order`, `members_limit`, `createdAt`, `updatedAt`)
VALUES
  ('Free', 'free', 0, 0, 0, 0, '["2 Phone Screenings (Trial)", "1 Technical Interview (Trial)"]', 0, 1, NOW(), NOW()),
  ('Silver', 'silver', 10, 5, 999, 9990, '["10 Phone Screenings/month", "5 Technical Interviews/month", "Basic Analytics", "Email Support"]', 1, 3, NOW(), NOW()),
  ('Gold', 'gold', 30, 15, 2499, 24990, '["30 Phone Screenings/month", "15 Technical Interviews/month", "Advanced Analytics", "Priority Support", "AI Insights"]', 2, 5, NOW(), NOW()),
  ('Diamond', 'diamond', 100, 50, 4999, 49990, '["100 Phone Screenings/month", "50 Technical Interviews/month", "Full Analytics Dashboard", "24/7 Support", "Custom Integrations", "Dedicated Account Manager"]', 3, 10, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 3. Seed Demo Company User (optional - for testing)
-- Password: 'demo123' hashed with bcrypt
-- ============================================================
INSERT INTO `users` (`id`, `userType`, `firstName`, `lastName`, `email`, `password`, `company`, `role`, `profile_completed`, `createdAt`, `updatedAt`)
VALUES (
  10001,
  'company',
  'Demo',
  'Recruiter',
  'demo@hirermind.com',
  '$2b$10$8KzaNdKIMyOkASCakNL6/esXFhsjSAHDHnGPmXHBgKYGPAGFXoJCi',
  'HirerMind Demo',
  'founder',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE userType = 'company';

-- ============================================================
-- 4. Seed Default Pipeline Stages for Demo Company
-- ============================================================
INSERT INTO `pipeline_stages` (`companyId`, `name`, `systemStatus`, `stage_order`, `color`, `icon`, `actionType`)
VALUES
  (10001, 'Applied', 'new', 1, 'bg-blue-500', 'FileText', 'none'),
  (10001, 'Phone Screening', 'reviewed', 2, 'bg-yellow-500', 'Phone', 'call'),
  (10001, 'Technical Interview', 'shortlisted', 3, 'bg-purple-500', 'Video', 'interview'),
  (10001, 'Final Review', 'interview', 4, 'bg-orange-500', 'Users', 'email'),
  (10001, 'Offer Extended', 'offered', 5, 'bg-green-500', 'Award', 'email'),
  (10001, 'Hired', 'hired', 6, 'bg-emerald-600', 'CheckCircle', 'email')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================================
-- 5. Seed Demo Candidate User (optional - for testing)
-- Password: 'demo123' hashed with bcrypt
-- ============================================================
INSERT INTO `users` (`id`, `userType`, `firstName`, `lastName`, `email`, `password`, `profile_completed`, `createdAt`, `updatedAt`)
VALUES (
  10002,
  'candidate',
  'Demo',
  'Candidate',
  'candidate@hirermind.com',
  '$2b$10$8KzaNdKIMyOkASCakNL6/esXFhsjSAHDHnGPmXHBgKYGPAGFXoJCi',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE userType = 'candidate';

-- ============================================================
-- 6. Seed Free Trial for Demo Users
-- ============================================================
INSERT INTO `user_trials` (`userId`, `phone_screenings_used`, `technical_interviews_used`, `phone_screenings_limit`, `technical_interviews_limit`, `createdAt`, `updatedAt`)
VALUES
  (10001, 0, 0, 2, 1, NOW(), NOW()),
  (10002, 0, 0, 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `phone_screenings_used` = VALUES(`phone_screenings_used`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seeding complete
-- ============================================================
