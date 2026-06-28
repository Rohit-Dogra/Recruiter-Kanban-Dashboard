const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const emailService = require('../services/emailService');
const openaiService = require('../services/openai.service');

// Generate questions for any job role
router.post('/generate-questions', async (req, res) => {
  try {
    const { role, skills, experienceLevel, difficulty, count } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Job role is required' });
    }

    const questions = await openaiService.generateInterviewQuestions({
      role,
      skills: skills,
      experienceLevel: experienceLevel,
      difficulty: difficulty,
      count: count
    });

    res.json({ success: true, questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send interview invitation with requirements
router.post('/send-invite', authenticate, async (req, res) => {
  try {
    const { candidateEmail, candidateName, jobTitle, role, skills, experienceLevel, difficulty } = req.body;
    const companyId = req.user.id;

    console.log('Received invite request:', { candidateEmail, candidateName, jobTitle, role, skills, experienceLevel, difficulty });

    // Generate interview questions using OpenAI for any domain
    const questions = await openaiService.generateInterviewQuestions({
      role: role || jobTitle,
      skills: skills || 'General skills relevant to the position',
      experienceLevel: experienceLevel || 'Mid-level',
      difficulty: difficulty || 'Medium',
      count: 5
    });

    console.log('Generated questions:', questions);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const interview = await db.ai_video_interview.create({
      companyId,
      candidateEmail,
      candidateName,
      jobTitle,
      role: role || jobTitle,
      skills,
      experienceLevel,
      difficulty,
      questions: typeof questions === 'string' ? questions : JSON.stringify(questions),
      token,
      expiresAt
    });

    console.log('Created interview:', interview.toJSON());

    const interviewLink = `${process.env.FRONTEND_URL}/ai-interview/${token}`;
    
    await emailService.sendEmail({
      to: candidateEmail,
      subject: `AI Video Interview Invitation - ${jobTitle}`,
      content: `Hello ${candidateName},\n\nYou have been invited to complete an AI-powered video interview for the position of ${jobTitle}.\n\nClick the link below to start your interview:\n${interviewLink}\n\nThis link will expire in 7 days.\n\nGood luck!`,
      candidateName
    });

    res.json({ success: true, interview, interviewLink, questions });
  } catch (error) {
    console.error('Error sending interview invite:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all interviews for company with responses
router.get('/', authenticate, async (req, res) => {
  try {
    const companyId = req.user.id;
    const interviews = await db.ai_video_interview.findAll({
      where: { companyId },
      include: [
        { model: db.ai_video_interview_result, as: 'result' },
        { model: db.ai_video_interview_response, as: 'responses' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, interviews });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get interview stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const companyId = req.user.id;
    
    const total = await db.ai_video_interview.count({ where: { companyId } });
    const completed = await db.ai_video_interview.count({ where: { companyId, status: 'completed' } });
    const pending = await db.ai_video_interview.count({ where: { companyId, status: 'pending' } });
    
    const [results] = await db.sequelize.query(
      `SELECT AVG(r.overall_score) as avgScore 
       FROM ai_video_interview_results r 
       INNER JOIN ai_video_interviews i ON r.interview_id = i.id 
       WHERE i.company_id = ?`,
      { replacements: [companyId], type: db.sequelize.QueryTypes.SELECT }
    );

    const avgScore = results?.avgScore || 0;

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        avgScore: Math.round(avgScore * 10) / 10
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get interview by token (public)
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const interview = await db.ai_video_interview.findOne({ where: { token } });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Interview already completed' });
    }

    if (new Date() > new Date(interview.expiresAt)) {
      await interview.update({ status: 'expired' });
      return res.status(400).json({ success: false, message: 'Interview link expired' });
    }

    // Parse questions from JSON
    let questions = [];
    try {
      if (interview.questions) {
        if (typeof interview.questions === 'string') {
          questions = JSON.parse(interview.questions);
        } else if (Array.isArray(interview.questions)) {
          questions = interview.questions;
        } else {
          console.log('Questions field type:', typeof interview.questions);
          questions = [];
        }
      }
    } catch (error) {
      console.error('Error parsing questions JSON:', error);
      console.log('Raw questions field:', interview.questions);
      questions = [];
    }

    res.json({ success: true, interview: { ...interview.toJSON(), questions } });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit response for a single question
router.post('/submit-response/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { questionNumber, question, responseText, skill } = req.body;

    const interview = await db.ai_video_interview.findOne({ where: { token } });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Evaluate response using OpenAI
    const evaluation = await openaiService.evaluateResponse({
      question,
      response: responseText,
      skill,
      role: interview.role
    });

    // Save response
    await db.ai_video_interview_response.create({
      interviewId: interview.id,
      questionNumber,
      question,
      responseText,
      skillScores: evaluation.skillScores,
      evaluation: evaluation.feedback,
      score: evaluation.score
    });

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit complete interview
router.post('/submit/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { videoDuration } = req.body;

    const interview = await db.ai_video_interview.findOne({ 
      where: { token },
      include: [{ model: db.ai_video_interview_response, as: 'responses' }]
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Generate overall feedback using OpenAI
    const overallFeedback = await openaiService.generateOverallFeedback({
      responses: interview.responses,
      role: interview.role,
      skills: interview.skills
    });

    // Save overall results
    await db.ai_video_interview_result.create({
      interviewId: interview.id,
      transcript: interview.responses.map(r => `Q: ${r.question}\nA: ${r.responseText}`).join('\n\n'),
      aiFeedback: overallFeedback.detailedFeedback,
      technicalScore: overallFeedback.technicalScore,
      communicationScore: overallFeedback.communicationScore,
      overallScore: overallFeedback.overallScore,
      videoDuration
    });

    await interview.update({
      status: 'completed',
      completedAt: new Date()
    });

    res.json({ success: true, message: 'Interview submitted successfully', feedback: overallFeedback });
  } catch (error) {
    console.error('Error submitting interview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get interview result with all responses
router.get('/:id/result', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.id;

    const interview = await db.ai_video_interview.findOne({
      where: { id, companyId },
      include: [
        { model: db.ai_video_interview_result, as: 'result' },
        { model: db.ai_video_interview_response, as: 'responses', order: [['questionNumber', 'ASC']] }
      ]
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
