const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const axios = require('axios');
const { addWebhookJob } = require('../services/queue.service');

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';
const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;

// Webhook endpoint for Bolna to send call updates
router.post('/webhook', async (req, res) => {
  try {
    const { 
      execution_id, 
      phone_number, 
      status, 
      duration, 
      extracted_data,
      telephony_details 
    } = req.body;
    
    console.log('Bolna webhook received:', req.body);
    
    // Find existing screening by phone number
    const screening = await db.phone_screening.findOne({
      where: { 
        candidatePhone: phone_number || telephony_details?.to_number || telephony_details?.from_number 
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (screening) {
      // Update existing screening with call results
      const updates = {
        status: status === 'completed' ? 'completed' : 
                status === 'failed' ? 'failed' : 'in_progress',
        extractedData: extracted_data ? JSON.stringify(extracted_data) : null,
        bolnaExecutionId: execution_id,
        completedAt: status === 'completed' ? new Date() : null
      };
      
      await screening.update(updates);
      console.log('Updated screening:', screening.id);
      
      // Queue call details storage for reliable processing with retry
      if (execution_id) {
        await addWebhookJob({
          executionId: execution_id,
          companyId: screening.companyId,
          duration: duration || null,
          extractedData: extracted_data || null,
        });
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Function to fetch and store call details from Bolna API
async function storeCallDetails(executionId, companyId, duration, extractedData) {
  try {
    console.log('Storing call details for execution:', executionId);
    
    if (!BOLNA_API_KEY) {
      console.log('Bolna API configuration missing, skipping details storage');
      return;
    }

    // Check if details already exist
    const existingDetails = await db.phone_screening_details.findOne({
      where: { bolnaExecutionId: executionId }
    });
    
    if (existingDetails) {
      console.log('Call details already exist for execution:', executionId);
      return;
    }

    // Fetch full conversation and execution details from Bolna API
    const response = await axios.get(
      `${BOLNA_API_URL}/executions/${executionId}`,
      {
        headers: {
          'Authorization': `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const apiData = response.data;
    console.log('Bolna API response for execution:', executionId, JSON.stringify(apiData, null, 2));
    
    // Parse agent extraction data
    let agentExtraction = null;
    if (typeof apiData.agent_extraction === 'string') {
      try {
        agentExtraction = JSON.parse(apiData.agent_extraction);
      } catch (e) {
        console.error('Error parsing agent_extraction:', e);
        agentExtraction = apiData.agent_extraction;
      }
    } else {
      agentExtraction = apiData.agent_extraction;
    }

    // Extract structured data from agent extraction
    const finalEvaluationData = agentExtraction?.['asst_0DxYqjpXy2EObi8cKPs7fwRN'];
    const candidateOverview = finalEvaluationData?.candidate_overview;
    const questionAssessment = agentExtraction?.['asst_cH9BWd1hzMvil2jn25GkuE8u'];
    
    // Store required fields with structured data
    await db.phone_screening_details.create({
      bolnaExecutionId: executionId,
      companyId: companyId,
      duration: duration || apiData.conversation_duration || apiData.call_duration || null,
      rating: parseFloat(finalEvaluationData?.final_evaluation_rating) || null,
      summary: finalEvaluationData?.final_evaluation || questionAssessment?.summary?.final_score || null,
      candidateName: `Candidate ${apiData.user_number || 'Unknown'}`, // Use phone number as identifier
      technicalQualification: candidateOverview?.technical_qualification || null,
      technicalQualificationRating: candidateOverview?.technical_qualification_rating || null,
      clarity: candidateOverview?.clarity || null,
      clarityRating: candidateOverview?.clarity_rating || null,
      technicalUnderstanding: candidateOverview?.technical_understanding || null,
      technicalUnderstandingRating: candidateOverview?.technical_understanding_rating || null,
      consistencyWithCv: candidateOverview?.consistency_with_cv || null,
      consistencyWithCvRating: candidateOverview?.consistency_with_cv_rating || null,
      handlingEdgeCases: candidateOverview?.handling_edge_cases || null,
      handlingEdgeCasesRating: candidateOverview?.handling_edge_cases_rating || null,
      overallScore: parseFloat(finalEvaluationData?.final_evaluation_rating) || questionAssessment?.summary?.final_score || null,
      finalEvaluation: finalEvaluationData?.final_evaluation || null,
      transcript: apiData.transcript || null,
      recordingUrl: apiData.recording_url || apiData.audio_url || null,
      callStatus: apiData.status || apiData.smart_status || null,
      conversationDuration: apiData.conversation_duration || null,
      totalCost: apiData.total_cost || null,
      userNumber: apiData.user_number || null,
      agentNumber: apiData.agent_number || null,
      bolnaApiResponse: apiData
    });

    console.log('Successfully stored call details for execution:', executionId);
    
  } catch (error) {
    console.error('Error storing call details for execution:', executionId, error.message);
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
    }
  }
}

// Get phone screenings for company
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Phone screening route hit, user:', req.user?.id);
   const companyId = req.user.companyId;
    
    if (!db.phone_screening) {
      console.error('phone_screening model not found in db');
      console.log('Available models:', Object.keys(db));
      return res.json([]);
    }
    
    console.log('Fetching screenings for company:', companyId);
    const screenings = await db.phone_screening.findAll({
      where: { companyId },
      include: [{
        model: db.user,
        as: 'candidate',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    console.log('Found screenings:', screenings.length);

    // Get call details for completed screenings from the new details table
    const screeningDetails = {};
    const completedScreenings = screenings.filter(s => s.bolnaExecutionId);
    
    if (completedScreenings.length > 0) {
      const executionIds = completedScreenings.map(s => s.bolnaExecutionId);
      const details = await db.phone_screening_details.findAll({
        where: {
          bolnaExecutionId: { [db.Sequelize.Op.in]: executionIds }
        }
      });
      
      details.forEach(detail => {
        screeningDetails[detail.bolnaExecutionId] = detail;
      });
    }

    // Format for frontend
    const formattedScreenings = screenings.map(screening => {
      const candidate = screening.candidate || {};
      const details = screeningDetails[screening.bolnaExecutionId];
      const candidateName = details?.candidateName || 
                           `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 
                           'Unknown Candidate';
      
      return {
        id: screening.id,
        candidate: candidateName,
        initials: candidateName.split(' ').map(n => n[0]).join(''),
        position: 'Phone Screening',
        date: new Date(screening.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        time: new Date(screening.createdAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        duration: details?.conversationDuration ? `${Math.round(details.conversationDuration / 60)} min` : '-',
        status: screening.status === 'completed' ? 'Completed' : 
                screening.status === 'in_progress' ? 'In Progress' :
                screening.status === 'failed' ? 'Failed' : 
                screening.status === 'initiated' ? 'Initiated' : 'Scheduled',
        rating: details?.overallScore || null,
        summary: details?.finalEvaluation || null,
        bolnaExecutionId: screening.bolnaExecutionId
      };
    });

    console.log('Returning formatted screenings:', formattedScreenings.length);
    res.json(formattedScreenings);
  } catch (error) {
    console.error('Error fetching phone screenings:', error);
    res.status(500).json({ message: 'Error fetching phone screenings', error: error.message });
  }
});

// Get phone screening stats
router.get('/stats', authenticate, async (req, res) => {
  try {
   const companyId = req.user.companyId;
    
    // Check if phone_screening model exists
    if (!db.phone_screening) {
      console.error('phone_screening model not found in db');
      return res.json({
        totalScreenings: 0,
        thisWeekScreenings: 0,
        avgDuration: '0 min',
        avgRating: '0.0/5'
      });
    }
    
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const [totalScreenings, thisWeekScreenings] = await Promise.all([
      db.phone_screening.count({ where: { companyId } }),
      db.phone_screening.count({ 
        where: { 
          companyId,
          createdAt: { [db.Sequelize.Op.gte]: weekStart }
        }
      })
    ]);

    // Get completed screenings data from details table only
    let completedDetails = [];
    
    try {
      completedDetails = await db.phone_screening_details.findAll({ 
        where: { 
          companyId,
          duration: { [db.Sequelize.Op.not]: null },
          rating: { [db.Sequelize.Op.not]: null }
        }
      });
    } catch (error) {
      console.log('phone_screening_details table not available');
      completedDetails = [];
    }

    const avgDuration = completedDetails.length > 0 
      ? Math.round(completedDetails.reduce((sum, s) => sum + s.duration, 0) / completedDetails.length / 60)
      : 0;
    
    const avgRating = completedDetails.length > 0
      ? (completedDetails.reduce((sum, s) => sum + parseFloat(s.rating), 0) / completedDetails.length).toFixed(1)
      : '0.0';

    res.json({
      totalScreenings,
      thisWeekScreenings,
      avgDuration: `${avgDuration} min`,
      avgRating: `${avgRating}/5`
    });
  } catch (error) {
    console.error('Error fetching screening stats:', error);
    res.status(500).json({ message: 'Error fetching screening stats' });
  }
});

// Sync with Bolna API to update call statuses
router.post('/sync', authenticate, async (req, res) => {
  try {
   const companyId = req.user.companyId;
    
    if (!BOLNA_API_KEY) {
      return res.status(500).json({ message: 'Bolna API key not configured' });
    }

    // Get all non-completed screenings with execution IDs
    const pendingScreenings = await db.phone_screening.findAll({
      where: { 
        companyId,
        bolnaExecutionId: { [db.Sequelize.Op.not]: null }
      }
    });

    for (const screening of pendingScreenings) {
      if (!screening.bolnaExecutionId) {
        console.log('Skipping screening without bolnaExecutionId:', screening.id);
        continue;
      }
      
      try {
        // Fetch call details from Bolna API using execution ID
        const response = await axios.get(`${BOLNA_API_URL}/executions/${screening.bolnaExecutionId}`, {
          headers: {
            'Authorization': `Bearer ${BOLNA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const callData = response.data;
        
        // Update screening based on Bolna response
        const updates = {};
        
        if (callData.status === 'completed') {
          updates.status = 'completed';
          updates.completedAt = new Date();
        } else if (callData.status === 'failed') {
          updates.status = 'failed';
        } else if (callData.status === 'in_progress') {
          updates.status = 'in_progress';
        }

        if (Object.keys(updates).length > 0) {
          await screening.update(updates);
        }
        
        // Store call details if not already stored
        await storeCallDetails(screening.bolnaExecutionId, companyId, callData.duration, callData.agent_extraction);
        
      } catch (apiError) {
        console.error(`Error syncing call ${screening.bolnaExecutionId}:`, apiError.message);
      }
    }

    res.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Error syncing with Bolna:', error);
    res.status(500).json({ message: 'Error syncing with Bolna API' });
  }
});

// Get call transcript/recording from Bolna (on-demand)
router.get('/:id/details', authenticate, async (req, res) => {
  try {
    const screeningId = req.params.id;
   const companyId = req.user.companyId;
    
    const screening = await db.phone_screening.findOne({
      where: { id: screeningId, companyId }
    });

    if (!screening || !screening.bolnaExecutionId) {
      return res.status(404).json({ message: 'Screening or execution not found' });
    }

    // First try to get details from our stored data
    let details = await db.phone_screening_details.findOne({
      where: {
        bolnaExecutionId: screening.bolnaExecutionId
      }
    });

    if (details) {
      // Return structured details
      return res.json({
        candidateName: details.candidateName,
        overallScore: details.overallScore,
        finalEvaluation: details.finalEvaluation,
        technicalQualification: details.technicalQualification,
        technicalQualificationRating: details.technicalQualificationRating,
        clarity: details.clarity,
        clarityRating: details.clarityRating,
        technicalUnderstanding: details.technicalUnderstanding,
        technicalUnderstandingRating: details.technicalUnderstandingRating,
        consistencyWithCv: details.consistencyWithCv,
        consistencyWithCvRating: details.consistencyWithCvRating,
        handlingEdgeCases: details.handlingEdgeCases,
        handlingEdgeCasesRating: details.handlingEdgeCasesRating,
        transcript: details.transcript,
        recordingUrl: details.recordingUrl,
        callStatus: details.callStatus,
        conversationDuration: details.conversationDuration,
        totalCost: details.totalCost,
        userNumber: details.userNumber,
        agentNumber: details.agentNumber,
        duration: details.duration,
        rating: details.rating,
        summary: details.summary
      });
    }

    // If not stored, fetch from Bolna API and store
    if (!BOLNA_API_KEY || !BOLNA_AGENT_ID) {
      return res.status(500).json({ message: 'Bolna API configuration missing' });
    }

    const response = await axios.get(
      `${BOLNA_API_URL}/executions/${screening.bolnaExecutionId}`,
      {
        headers: {
          'Authorization': `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Store the details for future use
    await storeCallDetails(screening.bolnaExecutionId, companyId, response.data.duration, response.data.agent_extraction);

    res.json({
      transcript: response.data.transcript,
      recording_url: response.data.recording_url,
      full_details: response.data
    });
  } catch (error) {
    console.error('Error fetching call details:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ message: 'Call details not found' });
    } else {
      res.status(500).json({ message: 'Error fetching call details' });
    }
  }
});

// Force fetch and store call details from Bolna API
router.post('/fetch-bolna-data', authenticate, async (req, res) => {
  try {
   const companyId = req.user.companyId;
    console.log('Fetch Bolna data request for company:', companyId);
    
    if (!BOLNA_API_KEY || !BOLNA_AGENT_ID) {
      return res.status(500).json({ message: 'Bolna API configuration missing' });
    }

    // Fetch all executions from Bolna API using correct endpoint
    const response = await axios.get(
      `${BOLNA_API_URL}/v2/agent/${BOLNA_AGENT_ID}/executions`,
      {
        headers: {
          'Authorization': `Bearer ${BOLNA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Bolna API response:', response.data);
    
    // Handle different response structures
    let executions = [];
    if (Array.isArray(response.data)) {
      executions = response.data;
    } else if (response.data.executions) {
      executions = response.data.executions;
    } else if (response.data.data) {
      executions = response.data.data;
    }
    
    console.log(`Found ${executions.length} executions from Bolna API`);
    
    let processed = 0;
    let errors = 0;

    for (const execution of executions) {
      try {
        const executionId = execution.execution_id || execution.id;
        if (!executionId) {
          console.log('Skipping execution without ID:', execution);
          continue;
        }

        // Check if details already exist
        const existingDetails = await db.phone_screening_details.findOne({
          where: { bolnaExecutionId: executionId }
        });
        
        if (existingDetails) {
          console.log(`Details already exist for execution: ${executionId}`);
          continue;
        }

        // Parse agent extraction data
        let agentExtraction = null;
        if (typeof execution.agent_extraction === 'string') {
          try {
            agentExtraction = JSON.parse(execution.agent_extraction);
          } catch (e) {
            console.error('Error parsing agent_extraction:', e);
            agentExtraction = execution.agent_extraction;
          }
        } else {
          agentExtraction = execution.agent_extraction;
        }

        // Extract structured data from agent extraction
        const finalEvaluationData = agentExtraction?.['asst_0DxYqjpXy2EObi8cKPs7fwRN'];
        const candidateOverview = finalEvaluationData?.candidate_overview;
        const questionAssessment = agentExtraction?.['asst_cH9BWd1hzMvil2jn25GkuE8u'];

        // Store execution data with structured fields
        await db.phone_screening_details.create({
          bolnaExecutionId: executionId,
          companyId: companyId,
          duration: execution.conversation_duration || execution.call_duration || null,
          rating: parseFloat(finalEvaluationData?.final_evaluation_rating) || null,
          summary: finalEvaluationData?.final_evaluation || questionAssessment?.summary?.final_score || null,
          candidateName: `Candidate ${execution.user_number || 'Unknown'}`, // Use phone number as identifier
          technicalQualification: candidateOverview?.technical_qualification || null,
          technicalQualificationRating: candidateOverview?.technical_qualification_rating || null,
          clarity: candidateOverview?.clarity || null,
          clarityRating: candidateOverview?.clarity_rating || null,
          technicalUnderstanding: candidateOverview?.technical_understanding || null,
          technicalUnderstandingRating: candidateOverview?.technical_understanding_rating || null,
          consistencyWithCv: candidateOverview?.consistency_with_cv || null,
          consistencyWithCvRating: candidateOverview?.consistency_with_cv_rating || null,
          handlingEdgeCases: candidateOverview?.handling_edge_cases || null,
          handlingEdgeCasesRating: candidateOverview?.handling_edge_cases_rating || null,
          overallScore: parseFloat(finalEvaluationData?.final_evaluation_rating) || questionAssessment?.summary?.final_score || null,
          finalEvaluation: finalEvaluationData?.final_evaluation || null,
          transcript: execution.transcript || null,
          recordingUrl: execution.recording_url || execution.audio_url || null,
          callStatus: execution.status || execution.smart_status || null,
          conversationDuration: execution.conversation_duration || null,
          totalCost: execution.total_cost || null,
          userNumber: execution.user_number || null,
          agentNumber: execution.agent_number || null,
          bolnaApiResponse: execution
        });

        processed++;
        console.log(`Stored details for execution: ${executionId}`);
        
      } catch (error) {
        errors++;
        console.error(`Error processing execution:`, error.message);
      }
    }

    console.log(`Processed ${processed} executions, ${errors} errors`);
    res.json({ 
      message: `Processed ${processed} executions, ${errors} errors`,
      processed,
      errors,
      totalFound: executions.length
    });
    
  } catch (error) {
    console.error('Error in fetch-bolna-data endpoint:', error);
    console.error('Response data:', error.response?.data);
    res.status(500).json({ 
      message: 'Error fetching Bolna data', 
      error: error.message,
      statusCode: error.response?.status
    });
  }
});

// Debug endpoint to check stored data
router.get('/debug/:executionId', authenticate, async (req, res) => {
  try {
    const { executionId } = req.params;
   const companyId = req.user.companyId;
    
    const [screening, details] = await Promise.all([
      db.phone_screening.findOne({
        where: { bolnaExecutionId: executionId, companyId }
      }),
      db.phone_screening_details.findOne({
        where: { bolnaExecutionId: executionId, companyId }
      })
    ]);
    
    res.json({
      screening: screening ? {
        id: screening.id,
        status: screening.status,
        bolnaExecutionId: screening.bolnaExecutionId,
        extractedData: screening.extractedData
      } : null,
      details: details ? {
        id: details.id,
        duration: details.duration,
        rating: details.rating,
        summary: details.summary,
        hasApiResponse: !!details.bolnaApiResponse
      } : null
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger to store call details (for testing)
router.post('/store-details/:executionId', authenticate, async (req, res) => {
  try {
    const { executionId } = req.params;
   const companyId = req.user.companyId;
    
    console.log('Manual trigger to store details for execution:', executionId);
    
    // Find the screening record
    const screening = await db.phone_screening.findOne({
      where: { 
        bolnaExecutionId: executionId,
        companyId 
      }
    });
    
    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }
    
    // Force store call details
    await storeCallDetails(executionId, companyId, null, null);
    
    res.json({ message: 'Call details storage triggered successfully' });
  } catch (error) {
    console.error('Error triggering call details storage:', error);
    res.status(500).json({ message: 'Error triggering call details storage' });
  }
});

module.exports = router;
module.exports.storeCallDetails = storeCallDetails;