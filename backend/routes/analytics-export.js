const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = db.Sequelize;
const { authenticate } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// GET /api/analytics/export — download analytics data as CSV
router.get('/export', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { from, to } = req.query;

    // Build date filter
    const dateFilter = {};
    if (from) dateFilter[Op.gte] = new Date(from);
    if (to) dateFilter[Op.lte] = new Date(to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const applicationWhere = hasDateFilter ? { appliedDate: dateFilter } : {};

    // Fetch applications with job and candidate info
    const applications = await db.application.findAll({
      where: applicationWhere,
      include: [
        {
          model: db.job,
          as: 'job',
          where: { companyId },
          attributes: ['title', 'department', 'location', 'type'],
          required: true
        }
      ],
      attributes: [
        'id', 'status', 'stage', 'appliedDate', 'reviewedDate',
        'aiScore', 'atsStatus', 'resumeMatch', 'createdAt', 'updatedAt'
      ],
      order: [['appliedDate', 'DESC']]
    });

    // Fetch candidate details for each application
    const rows = await Promise.all(applications.map(async (app) => {
      const candidate = await db.candidate.findOne({
        where: { candidate_id: app.candidateId },
        attributes: ['firstName', 'lastName', 'email', 'source']
      });

      return {
        'Application ID': app.id,
        'Job Title': app.job ? app.job.title : '',
        'Department': app.job ? (app.job.department || '') : '',
        'Location': app.job ? (app.job.location || '') : '',
        'Job Type': app.job ? (app.job.type || '') : '',
        'Candidate Name': candidate ? `${candidate.firstName} ${candidate.lastName}` : '',
        'Candidate Email': candidate ? candidate.email : '',
        'Source': candidate ? (candidate.source || '') : '',
        'Status': app.status || '',
        'Stage': app.stage || '',
        'Applied Date': app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '',
        'Reviewed Date': app.reviewedDate ? new Date(app.reviewedDate).toISOString().split('T')[0] : '',
        'ATS Score': app.aiScore != null ? app.aiScore : '',
        'ATS Status': app.atsStatus || '',
        'Resume Match %': app.resumeMatch != null ? app.resumeMatch : ''
      };
    }));

    // Build CSV
    if (rows.length === 0) {
      const headers = [
        'Application ID', 'Job Title', 'Department', 'Location', 'Job Type',
        'Candidate Name', 'Candidate Email', 'Source', 'Status', 'Stage',
        'Applied Date', 'Reviewed Date', 'ATS Score', 'ATS Status', 'Resume Match %'
      ];
      const csv = headers.join(',') + '\n';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
      return res.send(csv);
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h] ?? '');
          // Escape values containing commas, quotes, or newlines
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ];

    const csv = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('Analytics export error:', error);
    res.status(500).json({ message: 'Failed to export analytics data' });
  }
});

module.exports = router;
