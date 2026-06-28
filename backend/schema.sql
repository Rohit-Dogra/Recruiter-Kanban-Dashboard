-- ============================================================
-- HirerMind Complete Database Schema
-- All tables in one file — run on a fresh database
-- Last updated: 2026-03-20
-- ============================================================

CREATE DATABASE IF NOT EXISTS hirermind_db;
USE hirermind_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. Users (base table — most other tables reference this)
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `teamSize` varchar(50) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpire` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `googleId` varchar(100) DEFAULT NULL,
  `profilePicture` varchar(255) DEFAULT NULL,
  `userType` varchar(50) DEFAULT 'user',
  `profile_completed` tinyint(1) DEFAULT '0',
  `invited_by_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleId` (`googleId`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `fk_users_invited_by` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Jobs
-- ============================================================
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyId` int DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `company` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `type` enum('full-time','part-time','contract','internship','temporary') NOT NULL,
  `salary` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `experience` enum('entry','mid','senior','lead','executive') DEFAULT 'entry',
  `description` text NOT NULL,
  `requirements` text NOT NULL,
  `benefits` text,
  `deadline` datetime DEFAULT NULL,
  `isRemote` tinyint(1) NOT NULL DEFAULT '0',
  `skills` json DEFAULT NULL,
  `status` enum('draft','active','paused','closed') NOT NULL DEFAULT 'active',
  `urgency` enum('low','medium','high') DEFAULT 'medium',
  `workType` enum('remote','onsite','hybrid') DEFAULT 'onsite',
  `expiresIn` enum('10days','15days','20days','30days') DEFAULT '30days',
  `applyFormConfig` json DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_title` (`title`),
  KEY `idx_jobs_company` (`company`),
  KEY `idx_jobs_type` (`type`),
  KEY `idx_jobs_status` (`status`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Candidates
-- ============================================================
DROP TABLE IF EXISTS `candidates`;
CREATE TABLE `candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_id` int DEFAULT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `currentTitle` varchar(100) DEFAULT NULL,
  `currentCompany` varchar(100) DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `education` text,
  `skills` json DEFAULT NULL,
  `resumeUrl` varchar(255) DEFAULT NULL,
  `profileUrl` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `notes` text,
  `source` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `atsScore` decimal(5,2) DEFAULT NULL,
  `skillsMatchPercentage` decimal(5,2) DEFAULT NULL,
  `aiAnalysis` json DEFAULT NULL COMMENT 'Detailed AI analysis including strengths, weaknesses, recommendations',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_candidates_email` (`email`),
  KEY `candidate_id` (`candidate_id`),
  CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Offer Letters (needed before applications due to FK)
-- ============================================================
DROP TABLE IF EXISTS `offer_letters`;
CREATE TABLE `offer_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int DEFAULT NULL,
  `companyId` int NOT NULL,
  `candidateId` int NOT NULL,
  `jobId` int NOT NULL,
  `template` varchar(50) DEFAULT 'modern',
  `offerContent` longtext NOT NULL,
  `salary` decimal(12,2) NOT NULL,
  `joiningDate` date NOT NULL,
  `workLocation` varchar(50) DEFAULT NULL,
  `benefits` text,
  `status` enum('draft','sent','viewed','accepted','rejected','expired') DEFAULT 'draft',
  `sentAt` timestamp NULL DEFAULT NULL,
  `viewedAt` timestamp NULL DEFAULT NULL,
  `expiresAt` timestamp NULL DEFAULT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `rejectedAt` timestamp NULL DEFAULT NULL,
  `createdBy` int NOT NULL,
  `updatedBy` int DEFAULT NULL,
  `notes` text,
  `pdfUrl` varchar(255) DEFAULT NULL,
  `trackingToken` varchar(255) DEFAULT NULL,
  `expiresIn` int DEFAULT '7',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trackingToken` (`trackingToken`),
  KEY `candidateId` (`candidateId`),
  KEY `jobId` (`jobId`),
  KEY `createdBy` (`createdBy`),
  KEY `idx_application` (`applicationId`),
  KEY `idx_company_created` (`companyId`,`createdAt`),
  KEY `idx_status` (`status`),
  KEY `idx_expires` (`expiresAt`),
  CONSTRAINT `offer_letters_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offer_letters_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offer_letters_ibfk_3` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offer_letters_ibfk_4` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Applications
-- ============================================================
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidateId` int NOT NULL,
  `companyId` int DEFAULT NULL,
  `jobId` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'new',
  `stage` varchar(50) DEFAULT 'applied',
  `appliedDate` datetime DEFAULT NULL,
  `reviewedDate` datetime DEFAULT NULL,
  `aiScore` decimal(3,1) DEFAULT NULL,
  `aiNotes` text,
  `aiAnalysis` json DEFAULT NULL,
  `resumeMatch` decimal(5,2) DEFAULT NULL,
  `experienceRelevance` text,
  `technicalFit` decimal(5,2) DEFAULT NULL,
  `culturalFit` decimal(5,2) DEFAULT NULL,
  `overallRecommendation` text,
  `analysisTimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `skillsMatch` json DEFAULT NULL,
  `mismatchedSkills` json DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `resumeUrl` varchar(255) DEFAULT NULL,
  `coverLetter` text,
  `offerLetterId` int DEFAULT NULL,
  `offerStatus` varchar(50) DEFAULT NULL,
  `offerSentAt` timestamp NULL DEFAULT NULL,
  `atsStatus` enum('pending','processing','completed','failed') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_application` (`candidateId`,`jobId`),
  KEY `idx_applications_status` (`status`),
  KEY `idx_applications_stage` (`stage`),
  KEY `companyId` (`companyId`),
  KEY `jobId` (`jobId`),
  KEY `offerLetterId` (`offerLetterId`),
  KEY `idx_offer_status` (`offerStatus`),
  KEY `idx_applications_company_status` (`companyId`,`status`),
  KEY `idx_applications_applied_date` (`appliedDate`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`offerLetterId`) REFERENCES `offer_letters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_applications_candidate_id` FOREIGN KEY (`candidateId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. Application Answers
-- ============================================================
DROP TABLE IF EXISTS `application_answers`;
CREATE TABLE `application_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applicationId` (`applicationId`),
  CONSTRAINT `application_answers_ibfk_1` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. Interviews
-- ============================================================
DROP TABLE IF EXISTS `interviews`;
CREATE TABLE `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int NOT NULL,
  `scheduledDate` datetime NOT NULL,
  `duration` int DEFAULT '60',
  `type` enum('phone','video','in-person','technical','hr') NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `meetingUrl` varchar(255) DEFAULT NULL,
  `mapLink` varchar(255) DEFAULT NULL,
  `interviewerId` int DEFAULT NULL,
  `feedback` text,
  `rating` decimal(2,1) DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled','no-show') DEFAULT 'scheduled',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_interviews_date` (`scheduledDate`),
  KEY `applicationId` (`applicationId`),
  KEY `interviewerId` (`interviewerId`),
  CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `interviews_ibfk_2` FOREIGN KEY (`interviewerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. Companies
-- ============================================================
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `industry` varchar(255) NOT NULL,
  `size` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `founded` varchar(255) DEFAULT NULL,
  `mission` text,
  `values` text,
  `culture` text,
  `logo` longblob,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. Company Members
-- ============================================================
DROP TABLE IF EXISTS `company_members`;
CREATE TABLE `company_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_owner_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('HR','Recruiter') NOT NULL DEFAULT 'Recruiter',
  `status` enum('active','removed') DEFAULT 'active',
  `can_view_candidates` tinyint(1) DEFAULT '1',
  `can_edit_jobs` tinyint(1) DEFAULT '0',
  `can_manage_team` tinyint(1) DEFAULT '0',
  `can_access_reports` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_member_per_company` (`company_owner_id`,`user_id`),
  KEY `idx_company_owner` (`company_owner_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `company_members_ibfk_1` FOREIGN KEY (`company_owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `company_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. Phone Screenings
-- ============================================================
DROP TABLE IF EXISTS `phone_screenings`;
CREATE TABLE `phone_screenings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyId` int NOT NULL,
  `candidateId` int DEFAULT NULL,
  `candidatePhone` varchar(50) NOT NULL,
  `status` enum('initiated','in_progress','completed','failed','cancelled') DEFAULT 'initiated',
  `extractedData` json DEFAULT NULL,
  `bolnaExecutionId` varchar(255) DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`),
  KEY `candidateId` (`candidateId`),
  KEY `candidatePhone` (`candidatePhone`),
  CONSTRAINT `phone_screenings_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `phone_screenings_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. Phone Screening Details
-- ============================================================
DROP TABLE IF EXISTS `phone_screening_details`;
CREATE TABLE `phone_screening_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bolnaExecutionId` varchar(255) NOT NULL,
  `companyId` int NOT NULL,
  `duration` int DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT NULL,
  `summary` text,
  `candidateName` varchar(255) DEFAULT NULL,
  `technicalQualification` text DEFAULT NULL,
  `technicalQualificationRating` varchar(10) DEFAULT NULL,
  `clarity` text DEFAULT NULL,
  `clarityRating` varchar(10) DEFAULT NULL,
  `technicalUnderstanding` text DEFAULT NULL,
  `technicalUnderstandingRating` varchar(10) DEFAULT NULL,
  `consistencyWithCv` text DEFAULT NULL,
  `consistencyWithCvRating` varchar(10) DEFAULT NULL,
  `handlingEdgeCases` text DEFAULT NULL,
  `handlingEdgeCasesRating` varchar(10) DEFAULT NULL,
  `overallScore` decimal(2,1) DEFAULT NULL,
  `finalEvaluation` text DEFAULT NULL,
  `transcript` longtext DEFAULT NULL,
  `recordingUrl` varchar(500) DEFAULT NULL,
  `callStatus` varchar(50) DEFAULT NULL,
  `conversationDuration` decimal(5,2) DEFAULT NULL,
  `totalCost` decimal(8,2) DEFAULT NULL,
  `userNumber` varchar(20) DEFAULT NULL,
  `agentNumber` varchar(20) DEFAULT NULL,
  `bolnaApiResponse` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bolna_execution` (`bolnaExecutionId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `phone_screening_details_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. AI Video Interviews
-- ============================================================
DROP TABLE IF EXISTS `ai_video_interviews`;
CREATE TABLE `ai_video_interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `candidate_email` varchar(255) NOT NULL,
  `candidate_name` varchar(255) NOT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `status` enum('pending','completed','expired') DEFAULT 'pending',
  `expires_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(255) DEFAULT NULL,
  `skills` text,
  `experience_level` varchar(50) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `questions` json DEFAULT NULL,
  `avatar_id` varchar(255) DEFAULT NULL,
  `welcome_video_id` varchar(255) DEFAULT NULL,
  `conclusion_video_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_status` (`status`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `ai_video_interviews_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. AI Video Interview Results
-- ============================================================
DROP TABLE IF EXISTS `ai_video_interview_results`;
CREATE TABLE `ai_video_interview_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interview_id` int NOT NULL,
  `transcript` text,
  `ai_feedback` text,
  `technical_score` int DEFAULT NULL,
  `communication_score` int DEFAULT NULL,
  `overall_score` int DEFAULT NULL,
  `video_duration` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview` (`interview_id`),
  CONSTRAINT `ai_video_interview_results_ibfk_1` FOREIGN KEY (`interview_id`) REFERENCES `ai_video_interviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. AI Video Interview Responses
-- ============================================================
DROP TABLE IF EXISTS `ai_video_interview_responses`;
CREATE TABLE `ai_video_interview_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `interview_id` int NOT NULL,
  `question_number` int NOT NULL,
  `question` text NOT NULL,
  `response_text` text,
  `response_video_url` varchar(500) DEFAULT NULL,
  `skill_scores` json DEFAULT NULL,
  `evaluation` text,
  `score` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview` (`interview_id`),
  CONSTRAINT `ai_video_interview_responses_ibfk_1` FOREIGN KEY (`interview_id`) REFERENCES `ai_video_interviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. Pipeline Stages
-- ============================================================
DROP TABLE IF EXISTS `pipeline_stages`;
CREATE TABLE `pipeline_stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `systemStatus` varchar(50) NOT NULL,
  `stage_order` int NOT NULL,
  `color` varchar(20) DEFAULT 'bg-blue-500',
  `icon` varchar(50) DEFAULT 'FileText',
  `actionType` varchar(50) DEFAULT 'email',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_system_status` (`companyId`,`systemStatus`),
  KEY `idx_company_order` (`companyId`,`stage_order`),
  CONSTRAINT `pipeline_stages_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. Subscription Plans
-- ============================================================
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `phone_screenings_limit` int NOT NULL DEFAULT '0',
  `technical_interviews_limit` int NOT NULL DEFAULT '0',
  `price_monthly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_yearly` decimal(10,2) DEFAULT NULL,
  `features` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `members_limit` int NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. User Trials
-- ============================================================
DROP TABLE IF EXISTS `user_trials`;
CREATE TABLE `user_trials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `phone_screenings_used` int DEFAULT '0',
  `technical_interviews_used` int DEFAULT '0',
  `phone_screenings_limit` int DEFAULT '2',
  `technical_interviews_limit` int DEFAULT '1',
  `startedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_trial` (`userId`),
  CONSTRAINT `user_trials_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. User Subscriptions
-- ============================================================
DROP TABLE IF EXISTS `user_subscriptions`;
CREATE TABLE `user_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `planId` int NOT NULL,
  `status` enum('active','cancelled','expired','past_due') DEFAULT 'active',
  `phone_screenings_used` int DEFAULT '0',
  `technical_interviews_used` int DEFAULT '0',
  `current_period_start` datetime NOT NULL,
  `current_period_end` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`userId`,`status`),
  KEY `planId` (`planId`),
  CONSTRAINT `user_subscriptions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_subscriptions_ibfk_2` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. Payment Transactions
-- ============================================================
DROP TABLE IF EXISTS `payment_transactions`;
CREATE TABLE `payment_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `planId` int NOT NULL,
  `merchant_transaction_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'INITIATED',
  `payment_type` varchar(50) DEFAULT 'subscription',
  `metadata` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_transaction_id` (`merchant_transaction_id`),
  KEY `idx_user` (`userId`),
  KEY `idx_status` (`status`),
  KEY `idx_merchant_txn` (`merchant_transaction_id`),
  KEY `planId` (`planId`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`planId`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. Screening Questions
-- ============================================================
DROP TABLE IF EXISTS `screening_questions`;
CREATE TABLE `screening_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `companyId` int NOT NULL,
  `questions` json NOT NULL DEFAULT (JSON_ARRAY()),
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_job_company` (`jobId`,`companyId`),
  KEY `idx_company` (`companyId`),
  CONSTRAINT `screening_questions_ibfk_1` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `screening_questions_ibfk_2` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. Notifications
-- ============================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `type` enum('job','candidate','interview','offer','system','alert') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `tag` varchar(100) DEFAULT NULL,
  `read` tinyint(1) DEFAULT '0',
  `jobId` int DEFAULT NULL,
  `candidateId` int DEFAULT NULL,
  `applicationId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `jobId` (`jobId`),
  KEY `applicationId` (`applicationId`),
  KEY `idx_userId` (`userId`),
  KEY `idx_read` (`read`),
  KEY `idx_type` (`type`),
  KEY `idx_createdAt` (`createdAt`),
  KEY `idx_notifications_candidateId` (`candidateId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. Offer Letters Enhanced
-- ============================================================
DROP TABLE IF EXISTS `offer_letters_enhanced`;
CREATE TABLE `offer_letters_enhanced` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int DEFAULT NULL,
  `candidateId` int DEFAULT NULL,
  `jobId` int NOT NULL,
  `companyId` int NOT NULL,
  `candidateName` varchar(255) NOT NULL,
  `candidateEmail` varchar(255) NOT NULL,
  `candidatePhone` varchar(50) DEFAULT NULL,
  `jobTitle` varchar(255) NOT NULL,
  `template` varchar(50) NOT NULL DEFAULT 'modern',
  `salary` decimal(12,2) NOT NULL,
  `joiningDate` datetime NOT NULL,
  `workLocation` varchar(100) DEFAULT 'Remote',
  `benefits` text,
  `offerContent` longtext NOT NULL,
  `customizations` json DEFAULT NULL COMMENT 'Template customizations like colors, fonts, logos',
  `s3BucketName` varchar(255) DEFAULT NULL,
  `s3Key` varchar(500) DEFAULT NULL COMMENT 'S3 object key for the offer letter PDF',
  `s3Url` varchar(1000) DEFAULT NULL COMMENT 'S3 URL for accessing the offer letter PDF',
  `s3Uploaded` tinyint(1) DEFAULT '0' COMMENT 'Whether the PDF was successfully uploaded to S3',
  `pdfUrl` varchar(500) DEFAULT NULL COMMENT 'Legacy local file path or URL',
  `status` enum('draft','generated','sent','viewed','accepted','rejected','expired') DEFAULT 'draft',
  `trackingToken` varchar(255) DEFAULT NULL,
  `generatedAt` datetime DEFAULT NULL,
  `sentAt` datetime DEFAULT NULL,
  `viewedAt` datetime DEFAULT NULL,
  `acceptedAt` datetime DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `emailMessageId` varchar(255) DEFAULT NULL,
  `emailSent` tinyint(1) DEFAULT '0',
  `expiresIn` int DEFAULT '7' COMMENT 'Number of days until offer expires',
  `notes` text,
  `createdBy` int NOT NULL,
  `updatedBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trackingToken` (`trackingToken`),
  KEY `offer_letters_enhanced_application_id` (`applicationId`),
  KEY `offer_letters_enhanced_candidate_id` (`candidateId`),
  KEY `offer_letters_enhanced_job_id` (`jobId`),
  KEY `offer_letters_enhanced_company_id_created_at` (`companyId`,`createdAt`),
  KEY `offer_letters_enhanced_status` (`status`),
  KEY `offer_letters_enhanced_expires_at` (`expiresAt`),
  KEY `offer_letters_enhanced_s3_key` (`s3Key`),
  KEY `offer_letters_enhanced_candidate_email` (`candidateEmail`),
  KEY `offer_letters_enhanced_ibfk_5` (`createdBy`),
  KEY `offer_letters_enhanced_ibfk_6` (`updatedBy`),
  CONSTRAINT `offer_letters_enhanced_ibfk_1` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `offer_letters_enhanced_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `offer_letters_enhanced_ibfk_3` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `offer_letters_enhanced_ibfk_4` FOREIGN KEY (`companyId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `offer_letters_enhanced_ibfk_5` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `offer_letters_enhanced_ibfk_6` FOREIGN KEY (`updatedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. Conversations
-- ============================================================
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyUserId` int NOT NULL,
  `candidateUserId` int NOT NULL,
  `jobId` int DEFAULT NULL,
  `lastMessageAt` datetime DEFAULT NULL,
  `companyUnread` int DEFAULT '0',
  `candidateUnread` int DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_candidate_job` (`companyUserId`,`candidateUserId`,`jobId`),
  KEY `idx_company_user` (`companyUserId`),
  KEY `idx_candidate_user` (`candidateUserId`),
  KEY `idx_last_message` (`lastMessageAt`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`companyUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`candidateUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. Messages
-- ============================================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversationId` int NOT NULL,
  `senderId` int NOT NULL,
  `content` text NOT NULL,
  `messageType` enum('text','file','system') DEFAULT 'text',
  `fileUrl` varchar(500) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_created` (`conversationId`,`createdAt`),
  KEY `idx_sender` (`senderId`),
  KEY `idx_read_at` (`readAt`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. Demo Bookings
-- ============================================================
DROP TABLE IF EXISTS `demo_bookings`;
CREATE TABLE `demo_bookings` (
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
-- Composite indexes for analytics
-- ============================================================
CREATE INDEX idx_jobs_company_created ON jobs(companyId, createdAt);
CREATE INDEX idx_jobs_company_status ON jobs(companyId, status);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed: Admin user (password: admin123)
-- ============================================================
INSERT IGNORE INTO `users` (`id`, `firstName`, `lastName`, `email`, `password`, `userType`, `createdAt`, `updatedAt`)
VALUES (99999, 'Admin', 'HirerMind', 'admin@hirermind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', NOW(), NOW());

-- ============================================================
-- Schema complete — 25 tables
-- ============================================================
