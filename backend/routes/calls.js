const express = require('express');
const axios = require('axios');
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const { checkCanUse, recordUsage } = require('./subscription');

const router = express.Router();

router.post('/make-call', authenticate, async (req, res) => {
  try {
    const {
       agent_id = process.env.BOLNA_AGENT_ID,
      recipient_phone,
      user_data,
      jobId
    } = req.body;

    if (!recipient_phone) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }
 // Check subscription/trial before allowing phone screening (use owner id for invited users)
    const effectiveUserId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;
    const usageCheck = await checkCanUse(effectiveUserId, 'phone_screening');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: { message: usageCheck.message, code: 'SUBSCRIPTION_REQUIRED', hasTrial: usageCheck.hasTrial }
      });
    }

    if (!process.env.BOLNA_API_KEY) {
      console.error('BOLNA_API_KEY is not set on the server');
      return res.status(500).json({ success: false, error: 'Server misconfiguration: missing BOLNA_API_KEY' });
    }

    // Fetch job details and screening questions if jobId is provided
    let jobDetails = {};
    let screeningQuestions = [];
    if (jobId) {
      try {
        const job = await db.job.findByPk(jobId);
        if (job) {
          jobDetails = {
            job_role: job.title,
            company_name: job.company || 'Our Company',
            job_location: job.location,
            employment_type: job.type
          };
        }
        const sq = await db.screening_question.findOne({
          where: { jobId, companyId: req.user.companyId || req.user.id }
        });
        if (sq && Array.isArray(sq.questions) && sq.questions.length > 0) {
          screeningQuestions = sq.questions;
        }
      } catch (jobError) {
        console.error('Failed to fetch job/screening details:', jobError);
      }
    }

    const enrichedUserData = {
      ...user_data,
      ...jobDetails,
      name: user_data?.candidateName || user_data?.name,
      screening_questions: screeningQuestions
    };

    
    const response = await axios.post(
      'https://api.bolna.ai/call',
      {
        agent_id,
        recipient_phone_number: recipient_phone,
        user_data: enrichedUserData
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );


     // Record usage after successful call initiation (use owner id for invited users)
    if (response.data && usageCheck.source) {
      try {
        await recordUsage(effectiveUserId, 'phone_screening', usageCheck.source);
      } catch (usageErr) {
        console.error('Failed to record usage:', usageErr);
      }
    }


    // Create phone screening record if call initiated successfully
    if (response.data && user_data) {
      try {
        await db.phone_screening.create({
          companyId: req.user.id, // Use authenticated user ID
          candidateId: null, // Set to null since candidate may not exist in users table
          candidatePhone: recipient_phone,
          status: 'initiated',
          bolnaExecutionId: response.data.execution_id || response.data.call_id,
          extractedData: JSON.stringify({
            candidateName: user_data.candidateName,
            candidateRole: user_data.candidateRole,
            initiatedAt: new Date().toISOString()
          })
        });
      } catch (dbError) {
        console.error('Failed to create phone screening record:', dbError);
        // Don't fail the call if DB insert fails
      }
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('make-call error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    const status = error.response?.status || 500;
    const payload = error.response?.data || { message: error.message };

    res.status(status).json({
      success: false,
      error: payload
    });
  }
});

router.post('/schedule-call', authenticate, async (req, res) => {
  try {
    const {
     agent_id = process.env.BOLNA_AGENT_ID,
      recipient_phone,
      scheduled_at,
      user_data,
      jobId
    } = req.body;

    if (!recipient_phone) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }

    if (!scheduled_at) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

     // Check subscription/trial before allowing phone screening (use owner id for invited users)
    const effectiveUserId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;
    const usageCheck = await checkCanUse(effectiveUserId, 'phone_screening');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: { message: usageCheck.message, code: 'SUBSCRIPTION_REQUIRED', hasTrial: usageCheck.hasTrial }
      });
    }

    if (!process.env.BOLNA_API_KEY) {
      console.error('BOLNA_API_KEY is not set on the server');
      return res.status(500).json({ success: false, error: 'Server misconfiguration: missing BOLNA_API_KEY' });
    }

    // Fetch job details and screening questions if jobId is provided
    let jobDetails = {};
    let screeningQuestions = [];
    if (jobId) {
      try {
        const job = await db.job.findByPk(jobId);
        if (job) {
          jobDetails = {
            job_role: job.title,
            company_name: job.company || 'Our Company',
            job_location: job.location,
            employment_type: job.type
          };
        }
        const sq = await db.screening_question.findOne({
          where: { jobId, companyId: req.user.companyId || req.user.id }
        });
        if (sq && Array.isArray(sq.questions) && sq.questions.length > 0) {
          screeningQuestions = sq.questions;
        }
      } catch (jobError) {
        console.error('Failed to fetch job/screening details:', jobError);
      }
    }

    const enrichedUserData = {
      ...user_data,
      ...jobDetails,
      name: user_data?.candidateName || user_data?.name,
      screening_questions: screeningQuestions
    };

    
    const response = await axios.post(
      'https://api.bolna.ai/call',
      {
        agent_id,
        recipient_phone_number: recipient_phone,
        scheduled_at,
        user_data: enrichedUserData
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    // Record usage after successful schedule (use owner id for invited users)
    if (response.data && usageCheck.source) {
      try {
        await recordUsage(effectiveUserId, 'phone_screening', usageCheck.source);
      } catch (usageErr) {
        console.error('Failed to record usage:', usageErr);
      }
    }
    // Create phone screening record for scheduled call
    if (response.data && user_data) {
      try {
        await db.phone_screening.create({
          companyId: req.user.id, // Use authenticated user ID
          candidateId: null, // Set to null since candidate may not exist in users table
          candidatePhone: recipient_phone,
          status: 'initiated',
          bolnaExecutionId: response.data.execution_id || response.data.call_id,
          extractedData: JSON.stringify({
            candidateName: user_data.candidateName,
            candidateRole: user_data.candidateRole,
            scheduledAt: scheduled_at,
            initiatedAt: new Date().toISOString()
          })
        });
      } catch (dbError) {
        console.error('Failed to create phone screening record:', dbError);
        // Don't fail the call if DB insert fails
      }
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('schedule-call error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    const status = error.response?.status || 500;
    const payload = error.response?.data || { message: error.message };

    res.status(status).json({
      success: false,
      error: payload
    });
  }
});

module.exports = router;
