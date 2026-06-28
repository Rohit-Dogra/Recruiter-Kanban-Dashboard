-- ============================================================
-- HirerMind Production Migration
-- Run this on production database before deploying new code
-- ============================================================

USE hirermind_db;

-- ============================================================
-- 1. Demo Bookings table (new - for Book Demo feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS `demo_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `teamSize` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `time` varchar(255) NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Ensure admin user exists (id: 99999)
-- ============================================================
INSERT IGNORE INTO `users` (`id`, `firstName`, `lastName`, `email`, `password`, `userType`, `createdAt`, `updatedAt`)
VALUES (99999, 'Admin', 'HirerMind', 'admin@hirermind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', NOW(), NOW());
