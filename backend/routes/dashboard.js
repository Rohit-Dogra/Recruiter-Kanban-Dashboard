const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth.middleware');
const pipelineService = require('../services/pipeline.service');

// Get dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
   const userId = req.user.companyId;
    
    // Get current date and week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Active Jobs Count
    const activeJobs = await db.job.count({
      where: { 
        companyId: userId,
        status: 'active'
      }
    });

    // Total Candidates Count
    const totalCandidates = await db.application.count({
      include: [{
        model: db.job,
        as: 'job',
        where: { companyId: userId }
      }]
    });

    // Interviews This Week
    const interviewsThisWeek = await db.interview.count({
      include: [{
        model: db.application,
        as: 'application',
        include: [{
          model: db.job,
          as: 'job',
          where: { companyId: userId }
        }]
      }],
      where: {
        scheduledDate: {
          [Op.between]: [startOfWeek, endOfWeek]
        }
      }
    });

    // Hiring Success Rate
    const totalApplications = await db.application.count({
      include: [{
        model: db.job,
        as: 'job',
        where: { companyId: userId }
      }]
    });

    const hiredCount = await db.application.count({
      include: [{
        model: db.job,
        as: 'job',
        where: { companyId: userId }
      }],
      where: { status: 'hired' }
    });

    const hiringSuccessRate = totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0;

    res.json({
      activeJobs,
      totalCandidates,
      interviewsThisWeek,
      hiringSuccessRate
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req, res) => {
  try {
   const userId = req.user.companyId;
    
    // Get recent applications
    const recentApplications = await db.application.findAll({
      include: [
        {
          model: db.user,
          as: 'candidate',
          attributes: ['firstName', 'lastName'],
          required: true
        },
        {
          model: db.job,
          as: 'job',
          where: { companyId: userId },
          attributes: ['title'],
          required: true
        }
      ],
      order: [['appliedDate', 'DESC']],
      limit: 10
    });

    // Get recent interviews
    const recentInterviews = await db.interview.findAll({
      include: [{
        model: db.application,
        as: 'application',
        required: true,
        include: [
          {
            model: db.user,
            as: 'candidate',
            attributes: ['firstName', 'lastName'],
            required: true
          },
          {
            model: db.job,
            as: 'job',
            where: { companyId: userId },
            attributes: ['title'],
            required: true
          }
        ]
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Format activities
    const activities = [];

    recentApplications.forEach(app => {
      const cand = app.candidate || {};
      const job = app.job || {};
      const first = cand.firstName || '';
      const last = cand.lastName || '';

      activities.push({
        type: 'application',
        message: `${first} ${last} applied for ${job.title || 'a job'}`.trim(),
        time: app.appliedDate,
        avatar: `${(first.charAt(0) || '')}${(last.charAt(0) || '')}`,
        score: app.aiScore || 0
      });
    });

    recentInterviews.forEach(interview => {
      const appObj = interview.application || {};
      const cand = appObj.candidate || {};
      const first = cand.firstName || '';
      const last = cand.lastName || '';

      activities.push({
        type: 'interview',
        message: `Interview scheduled with ${first} ${last}`.trim(),
        time: interview.createdAt,
        avatar: `${(first.charAt(0) || '')}${(last.charAt(0) || '')}`,
        score: appObj.aiScore || 0
      });
    });

    // Sort by time and limit to 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, 10);

    res.json(limitedActivities);

  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

// Get top performing jobs
router.get('/top-jobs', authenticate, async (req, res) => {
  try {
   const userId = req.user.companyId;
    
    const topJobs = await db.job.findAll({
      where: { 
        companyId: userId,
        status: 'active'
      },
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt'],
      include: [{
        model: db.application,
        as: 'applications',
        attributes: ['id', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });

    const jobsWithStats = topJobs.map(job => {
      const applications = job.applications || [];
      const totalApplications = applications.length;
      const qualifiedApplications = applications.filter(app => 
        ['shortlisted', 'interview', 'offered', 'hired'].includes(app.status)
      ).length;

      return {
        id: job.id,
        title: job.title,
        location: job.isRemote ? 'Remote' : job.location,
        applications: totalApplications,
        qualified: qualifiedApplications,
        urgency: job.urgency
      };
    });

    // Sort by applications count
    jobsWithStats.sort((a, b) => b.applications - a.applications);

    res.json(jobsWithStats.slice(0, 10));

  } catch (error) {
    console.error('Top performing jobs error:', error);
    res.status(500).json({ message: 'Error fetching top performing jobs' });
  }
});

// Get applications by job
router.get('/applications', authenticate, async (req, res) => {
  try {
   const userId = req.user.companyId;
    
    const jobs = await db.job.findAll({
      where: { 
        companyId: userId,
        status: 'active'
      },
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt'],
      include: [{
        model: db.application,
        as: 'applications',
        include: [{
          model: db.user,
          as: 'candidate',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const jobsWithApplications = jobs.map(job => ({
      id: job.id,
      title: job.title,
      applications: job.applications.map(app => {
        const cand = app.candidate || {};
        return {
          id: app.id,
          candidateName: `${cand.firstName || ''} ${cand.lastName || ''}`.trim(),
          email: cand.email || '',
          phone: cand.phone || '',
          status: app.status,
          appliedDate: app.appliedDate,
          aiScore: app.aiScore
        };
      })
    }));

    res.json(jobsWithApplications);

  } catch (error) {
    console.error('Applications by job error:', error);
    res.status(500).json({ message: 'Error fetching applications by job' });
  }
});

const getAnalyticsData = async (req, res) => {
  try {
   const userId = req.user.companyId;
    const cacheKey = `analytics:${userId}`;

    // Try cache first (5-minute TTL)
    const { cacheGet, cacheSet } = require('../utils/cache');
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const now = new Date();
    const jobInclude = { model: db.job, as: 'job', where: { companyId: userId }, required: true };

    // 1. Total candidates from candidates table (linked to company via applications)
    // candidates.candidate_id = applications.candidateId (both reference users)
    const [candidateCountResult] = await db.sequelize.query(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM candidates c
      INNER JOIN applications a ON c.candidate_id = a.candidateId
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ?
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });
    const totalCandidatesFromTable = parseInt(candidateCountResult?.total || 0, 10);

    // Total applications count (all candidates in pipeline)
    const totalApplications = await db.application.count({
      include: [jobInclude]
    });

    // Unique active candidates (excluding rejected, still in pipeline)
    const [activeResult] = await db.sequelize.query(`
      SELECT COUNT(DISTINCT a.candidateId) as cnt
      FROM applications a
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ? AND a.status NOT IN ('rejected', 'hired')
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });
    const activeCandidatesCount = parseInt(activeResult?.cnt || 0, 10);

    // Total hires
    const totalHires = await db.application.count({
      include: [jobInclude],
      where: { status: 'hired' }
    });

    // 2. Time-to-hire: avg days from appliedDate to updatedAt for hired applications
    const [timeToHireResult] = await db.sequelize.query(`
      SELECT AVG(DATEDIFF(a.updatedAt, a.appliedDate)) as avgDays
      FROM applications a
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ? AND a.status = 'hired' AND a.appliedDate IS NOT NULL
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });
    const avgDays = timeToHireResult?.avgDays;
    const timeToHireDays = avgDays != null ? Math.round(parseFloat(avgDays)) : 0;
    const timeToHireStr = timeToHireDays > 0 ? `${timeToHireDays} days` : 'N/A';

    // 3. Pipeline velocity: % of candidates moving from applied to hired in last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const appliedLast30 = await db.application.count({
      include: [jobInclude],
      where: { appliedDate: { [Op.gte]: thirtyDaysAgo } }
    });
    const hiredLast30 = await db.application.count({
      include: [jobInclude],
      where: {
        status: 'hired',
        updatedAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    const pipelineVelocity = appliedLast30 > 0
      ? `${Math.round((hiredLast30 / appliedLast30) * 100)}%`
      : '0%';

    const hireRate = totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(1) : '0.0';

    const kpiData = {
      timeToHire: timeToHireStr,
      hireRate: `${hireRate}%`,
      activeCandidates: activeCandidatesCount.toString(),
      pipelineVelocity,
      totalCandidates: totalCandidatesFromTable.toString(),
      totalApplications: totalApplications.toString()
    };

    // 4. Monthly hiring trends (last 12 months) — single aggregated query
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyRows = await db.sequelize.query(`
      SELECT 
        DATE_FORMAT(a.appliedDate, '%b %y') as month,
        DATE_FORMAT(a.appliedDate, '%Y-%m') as sortKey,
        COUNT(*) as applications,
        SUM(CASE WHEN a.status = 'hired' THEN 1 ELSE 0 END) as hires
      FROM applications a
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ? AND a.appliedDate >= ?
      GROUP BY sortKey, month
      ORDER BY sortKey ASC
    `, { replacements: [userId, twelveMonthsAgo], type: db.sequelize.QueryTypes.SELECT });

    // Fill in missing months with zeros
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const row = monthlyRows.find(r => r.sortKey === sortKey);
      monthlyData.push({
        month: label,
        applications: row ? parseInt(row.applications, 10) : 0,
        hires: row ? parseInt(row.hires, 10) : 0,
      });
    }

    // 5. Pipeline data — single aggregated query for status counts
    const pipelineStages = await pipelineService.getCompanyPipeline(userId);
    const pipelineData = [];

    // Get all status counts in one query
    const statusCountRows = await db.sequelize.query(`
      SELECT a.status, COUNT(*) as cnt
      FROM applications a
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ?
      GROUP BY a.status
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });

    const statusCountMap = {};
    statusCountRows.forEach(r => { statusCountMap[r.status] = parseInt(r.cnt, 10); });

    if (pipelineStages.length > 0) {
      for (const stage of pipelineStages) {
        const count = statusCountMap[stage.systemStatus] || 0;
        pipelineData.push({
          stage: stage.title,
          systemStatus: stage.systemStatus,
          count,
          color: stage.color,
          icon: stage.icon
        });
      }
    } else {
      const defaultStatuses = ['new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired'];
      const stageNames = { new: 'Applied', reviewed: 'Screening', shortlisted: 'Interview', interview: 'Final', offered: 'Offered', hired: 'Hired' };
      for (const status of defaultStatuses) {
        pipelineData.push({
          stage: stageNames[status],
          systemStatus: status,
          count: statusCountMap[status] || 0
        });
      }
    }

    // 6. Source data from candidates.source
    const sourceRows = await db.sequelize.query(`
      SELECT c.source, COUNT(DISTINCT c.id) as cnt
      FROM candidates c
      INNER JOIN applications a ON c.candidate_id = a.candidateId
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ? AND c.source IS NOT NULL AND c.source != ''
      GROUP BY c.source
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });

    const SOURCE_COLORS = {
      LinkedIn: '#0077B5',
      Indeed: '#003A9B',
      'Company Website': '#10B981',
      Referrals: '#F59E0B',
      Glassdoor: '#0CAA41',
      Other: '#6B7280'
    };
    const totalWithSource = sourceRows.reduce((s, r) => s + (r.cnt || 0), 0);
    const sourceData = sourceRows.length > 0
      ? sourceRows.map(r => {
          const name = (r.source || 'Other').trim();
          const value = totalWithSource > 0 ? Math.round((r.cnt / totalWithSource) * 100) : 0;
          return {
            name,
            value,
            count: r.cnt,
            color: SOURCE_COLORS[name] || SOURCE_COLORS.Other
          };
        })
      : [
          { name: 'LinkedIn', value: 35, color: '#0077B5' },
          { name: 'Indeed', value: 28, color: '#003A9B' },
          { name: 'Company Website', value: 20, color: '#10B981' },
          { name: 'Referrals', value: 12, color: '#F59E0B' },
          { name: 'Other', value: 5, color: '#6B7280' }
        ];

    // 7. Funnel metrics & conversion rates (aggregate from pipeline)
    const getStageCount = (statuses) => {
      return pipelineData
        .filter(p => statuses.includes(p.systemStatus))
        .reduce((s, p) => s + (p.count || 0), 0);
    };
    const funnelMetrics = {
      applied: totalApplications || pipelineData.reduce((sum, p) => sum + (p.count || 0), 0),
      screened: getStageCount(['reviewed', 'screening']),
      interviewed: getStageCount(['shortlisted', 'interview']),
      offered: getStageCount(['offered']),
      hired: totalHires
    };
    const appliedCount = funnelMetrics.applied || totalApplications || 1;
    const funnelConversion = appliedCount > 0
      ? {
          appliedToHired: ((funnelMetrics.hired / appliedCount) * 100).toFixed(1),
          screenedToHired: funnelMetrics.screened > 0 ? ((funnelMetrics.hired / funnelMetrics.screened) * 100).toFixed(1) : '0',
          interviewToHired: funnelMetrics.interviewed > 0 ? ((funnelMetrics.hired / funnelMetrics.interviewed) * 100).toFixed(1) : '0'
        }
      : { appliedToHired: '0', screenedToHired: '0', interviewToHired: '0' };

    // 8. Time-to-hire report (recent hires with days)
    const timeToHireReport = await db.sequelize.query(`
      SELECT 
        a.id, a.candidateId, a.appliedDate, a.updatedAt, a.status,
        DATEDIFF(a.updatedAt, a.appliedDate) as daysToHire,
        j.title as jobTitle
      FROM applications a
      INNER JOIN jobs j ON a.jobId = j.id
      WHERE j.companyId = ? AND a.status = 'hired' AND a.appliedDate IS NOT NULL
      ORDER BY a.updatedAt DESC
      LIMIT 10
    `, { replacements: [userId], type: db.sequelize.QueryTypes.SELECT });

    const analyticsResult = {
      kpiData,
      monthlyData,
      pipelineData,
      sourceData,
      funnelMetrics,
      funnelConversion,
      timeToHireReport,
      totalCandidatesFromTable
    };

    // Cache for 5 minutes
    await cacheSet(cacheKey, analyticsResult, 300);

    res.json(analyticsResult);
  } catch (error) {
    console.error('Analytics data error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};

router.get('/analytics', authenticate, getAnalyticsData);

module.exports = router;
