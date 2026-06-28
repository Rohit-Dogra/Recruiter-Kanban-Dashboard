#!/usr/bin/env node
/**
 * Migration script: Transfer all records from offer_letters to offer_letters_enhanced
 * without data loss. Skips records that already exist in offer_letters_enhanced
 * (by applicationId or candidateId+jobId).
 *
 * Usage: node backend/scripts/migrate-offer-letters.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../models');
const logger = require('../utils/logger');

async function migrate() {
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    await db.sequelize.authenticate();
    console.log('Database connection established.');

    const legacyRecords = await db.OfferLetter.findAll({ raw: true });
    console.log(`Found ${legacyRecords.length} records in offer_letters table.`);

    for (const record of legacyRecords) {
      try {
        // Check if record already exists in enhanced table by applicationId
        let exists = false;
        if (record.applicationId) {
          const byApp = await db.OfferLetterEnhanced.findOne({
            where: { applicationId: record.applicationId }
          });
          if (byApp) exists = true;
        }

        // Also check by candidateId + jobId combination
        if (!exists && record.candidateId && record.jobId) {
          const byCandJob = await db.OfferLetterEnhanced.findOne({
            where: { candidateId: record.candidateId, jobId: record.jobId }
          });
          if (byCandJob) exists = true;
        }

        if (exists) {
          skipped++;
          console.log(`Skipped record id=${record.id} (already exists in enhanced table)`);
          continue;
        }

        // Resolve candidateName and candidateEmail from the users table
        let candidateName = 'Unknown Candidate';
        let candidateEmail = '';
        if (record.candidateId) {
          const user = await db.user.findByPk(record.candidateId, {
            attributes: ['firstName', 'lastName', 'email']
          });
          if (user) {
            candidateName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Candidate';
            candidateEmail = user.email || '';
          }
        }

        // Resolve jobTitle from the jobs table
        let jobTitle = 'Unknown Position';
        if (record.jobId) {
          const job = await db.job.findByPk(record.jobId, { attributes: ['title'] });
          if (job) jobTitle = job.title;
        }

        // Map fields from legacy to enhanced
        const enhancedData = {
          applicationId: record.applicationId || null,
          candidateId: record.candidateId || null,
          jobId: record.jobId,
          companyId: record.companyId,
          candidateName,
          candidateEmail,
          candidatePhone: null,
          jobTitle,
          template: record.template || 'modern',
          salary: record.salary,
          joiningDate: record.joiningDate,
          workLocation: record.workLocation || 'Remote',
          benefits: record.benefits || null,
          offerContent: record.offerContent,
          customizations: null,
          s3BucketName: null,
          s3Key: record.s3Key || null,
          s3Url: record.pdfUrl || null,
          s3Uploaded: record.s3Uploaded || false,
          pdfUrl: record.pdfUrl || null,
          status: record.status || 'draft',
          trackingToken: record.trackingToken || null,
          generatedAt: record.createdAt,
          sentAt: record.sentAt || null,
          viewedAt: record.viewedAt || null,
          acceptedAt: record.acceptedAt || null,
          rejectedAt: record.rejectedAt || null,
          expiresAt: record.expiresAt || null,
          emailMessageId: null,
          emailSent: record.sentAt ? true : false,
          expiresIn: record.expiresIn || 7,
          notes: record.notes || null,
          createdBy: record.createdBy,
          updatedBy: record.updatedBy || null,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        };

        await db.OfferLetterEnhanced.create(enhancedData);
        migrated++;
        console.log(`Migrated record id=${record.id} → offer_letters_enhanced`);
      } catch (err) {
        failed++;
        console.error(`Failed to migrate record id=${record.id}:`, err.message);
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total legacy records: ${legacyRecords.length}`);
    console.log(`Migrated:  ${migrated}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Failed:    ${failed}`);
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

migrate();
