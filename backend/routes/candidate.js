const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../models');
const Candidate = db.candidate;
const { Op } = db.Sequelize;
const { authenticate } = require('../middleware/auth.middleware');
const { validate, candidateValidationRules } = require('../middleware/validation.middleware');
const s3Service = require('../services/s3.service');
const resumeParser = require('../services/resumeParser.service');

// Multer config for resume upload (memory storage for S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ─── Parse Resume & Extract Candidate Info ──────────────────────────────────
router.post('/parse-resume', authenticate, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 1. Parse resume using regex/heuristic service (no AI API needed)
    let parsed = {};
    try {
      parsed = await resumeParser.parseResume(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: parseErr.message || 'Could not parse resume.' });
    }

    // 2. Upload to S3
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = uniqueSuffix + '-' + sanitizedName;
    let resumeUrl = '';
    try {
      const s3Result = await s3Service.uploadFile(req.file.buffer, fileName, req.file.mimetype);
      resumeUrl = s3Result.key;
    } catch (s3Err) {
      console.error('S3 upload failed during resume parse:', s3Err.message);
      return res.status(500).json({ success: false, message: 'Failed to upload resume to storage. Please try again.' });
    }

    res.json({
      success: true,
      resumeUrl,
      fileName,
      originalName: req.file.originalname,
      parsed
    });
  } catch (err) {
    console.error('Resume parse error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to parse resume' });
  }
});

// Create and Save a new Candidate (+ user + application if jobId provided)
router.post('/', authenticate, validate(candidateValidationRules.create), async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      return res.status(400).json({
        message: "Candidate first name, last name, and email are required!"
      });
    }

    const User = db.user;
    const Application = db.application;
    const jobId = req.body.jobId;
    const companyId = req.user.companyId || req.user.id;

    // 1. Find or create a user record for this candidate (needed for application link)
    let userRecord = await User.findOne({ where: { email: req.body.email } });
    if (!userRecord) {
      userRecord = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        userType: 'candidate',
        profile_completed: false,
      });
    }

    // 2. Create candidate record with candidate_id pointing to user
    let candidateRecord = await Candidate.findOne({ where: { email: req.body.email } });
    if (!candidateRecord) {
      candidateRecord = await Candidate.create({
        candidate_id: userRecord.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        location: req.body.location,
        currentTitle: req.body.currentTitle,
        currentCompany: req.body.currentCompany,
        experience: req.body.experience,
        education: req.body.education,
        skills: req.body.skills,
        resumeUrl: req.body.resumeUrl,
        profileUrl: req.body.profileUrl,
        avatarUrl: req.body.avatarUrl,
        notes: req.body.notes,
        source: req.body.source,
      });
    } else {
      // Update existing candidate record
      await candidateRecord.update({
        candidate_id: candidateRecord.candidate_id || userRecord.id,
        phone: req.body.phone || candidateRecord.phone,
        location: req.body.location || candidateRecord.location,
        currentTitle: req.body.currentTitle || candidateRecord.currentTitle,
        currentCompany: req.body.currentCompany || candidateRecord.currentCompany,
        experience: req.body.experience || candidateRecord.experience,
        education: req.body.education || candidateRecord.education,
        skills: req.body.skills || candidateRecord.skills,
        resumeUrl: req.body.resumeUrl || candidateRecord.resumeUrl,
        source: req.body.source || candidateRecord.source,
      });
    }

    // 3. Create application record if jobId is provided
    if (jobId) {
      const existingApp = await Application.findOne({
        where: { candidateId: userRecord.id, jobId: jobId }
      });
      if (!existingApp) {
        const newApp = await Application.create({
          candidateId: userRecord.id,
          companyId: companyId,
          jobId: jobId,
          resumeUrl: req.body.resumeUrl || null,
          status: 'new',
          stage: 'new',
          appliedDate: new Date(),
          atsStatus: req.body.resumeUrl ? 'pending' : null,
        });

        // Trigger ATS analysis if resume is available
        if (req.body.resumeUrl) {
          const Job = db.job;
          const job = await Job.findByPk(jobId);
          if (job) {
            const jobDescription = `${job.title}\n${job.description || ''}\nRequired Skills: ${job.requirements || ''}\n${job.skills ? `Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}` : ''}`;
            
            try {
              const { addATSJob } = require('../services/queue.service');
              const queueResult = await addATSJob({ applicationId: newApp.id, resumeUrl: req.body.resumeUrl, jobDescription });
              if (!queueResult) throw new Error('Queue unavailable');
            } catch (queueErr) {
              // Inline fallback
              try {
                await newApp.update({ atsStatus: 'processing' });
                const atsService = require('../services/ats.service');
                const atsResult = await atsService.processResume(req.body.resumeUrl, jobDescription);
                await newApp.update({
                  aiScore: atsResult.atsScore,
                  atsStatus: 'completed',
                  resumeMatch: atsResult.skillsMatchPercentage,
                  skillsMatch: { matched: atsResult.matchedSkills, missing: atsResult.missingSkills },
                  aiNotes: atsResult.recommendation,
                });
              } catch (atsErr) {
                console.error('ATS inline fallback failed:', atsErr.message);
                await newApp.update({ atsStatus: 'failed', aiNotes: `ATS analysis failed: ${atsErr.message}. Retry available.` });
              }
            }
          }
        }
      }
    }

    res.status(201).json(candidateRecord);
  } catch (err) {
    console.error('Create candidate error:', err);
    res.status(500).json({
      message: err.message || "Some error occurred while creating the Candidate."
    });
  }
});

// Retrieve all Candidates from the database with AI scoring and date filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, skills, experience, dateFrom, dateTo } = req.query;
    const userId = req.user.companyId;
    
    const Application = db.application;
    const Job = db.job;
    const User = db.user;
    
    // Build date filter
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.appliedDate = {};
      if (dateFrom) dateFilter.appliedDate[Op.gte] = new Date(dateFrom);
      if (dateTo) dateFilter.appliedDate[Op.lte] = new Date(dateTo);
    }
    
    // Get applications for this company's jobs
    // Since applications.candidateId references users.id and candidates.candidate_id also references users.id,
    // we need to join through the users table
    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          as: 'job',
          where: { companyId: userId },
          attributes: ['id', 'title', 'skills'],
          required: true
        }
      ],
      where: dateFilter,
      attributes: ['id', 'candidateId', 'jobId', 'status', 'stage', 'appliedDate', 'aiScore', 'aiNotes', 'resumeMatch', 'skillsMatch', 'mismatchedSkills'],
      order: [['appliedDate', 'DESC']]
    });

    // Now fetch candidates by joining on users table
    // applications.candidateId = users.id, and candidates.candidate_id = users.id
    const applicationIds = applications.map(app => app.id);

    let candidateData = [];
    if (applicationIds.length > 0) {
      candidateData = await db.sequelize.query(`
        SELECT DISTINCT
          c.*,
          a.id as applicationId,
          a.candidateId,
          a.jobId,
          a.status,
          a.stage,
          a.appliedDate,
          a.aiScore,
          a.aiNotes,
          a.resumeMatch,
          a.skillsMatch,
          a.mismatchedSkills,
          a.resumeUrl as applicationResumeUrl,
          a.coverLetter,
          j.title as jobTitle
        FROM candidates c
        INNER JOIN applications a ON c.candidate_id = a.candidateId
        INNER JOIN jobs j ON a.jobId = j.id
        WHERE j.companyId = ? AND a.id IN (?)
        ORDER BY a.appliedDate DESC
      `, {
        replacements: [userId, applicationIds],
        type: db.sequelize.QueryTypes.SELECT
      });
    }

    // Get application answers for all applications
    const ApplicationAnswer = db.application_answer;
    const allAnswers = await ApplicationAnswer.findAll({
      where: {
        applicationId: applicationIds
      },
      attributes: ['applicationId', 'question', 'answer']
    });
    
    // Group answers by application ID
    const answersByApplication = {};
    allAnswers.forEach(answer => {
      if (!answersByApplication[answer.applicationId]) {
        answersByApplication[answer.applicationId] = [];
      }
      answersByApplication[answer.applicationId].push({
        question: answer.question,
        answer: answer.answer
      });
    });

    // Convert candidate data to the expected format without deduplication
    let candidates = candidateData.map(record => {
      // Parse skillsMatch from database
      let skillsMatch = record.skillsMatch;
      
      // Parse if it's a string
      if (typeof skillsMatch === 'string') {
        try {
          skillsMatch = JSON.parse(skillsMatch);
        } catch (e) {
          skillsMatch = null;
        }
      }
      
      // If still no skillsMatch, calculate from job and candidate skills
      if (!skillsMatch && record.jobTitle && record.skills) {
        const jobSkills = typeof record.skills === 'string' ? JSON.parse(record.skills) : record.skills;
        const candidateSkills = typeof record.skills === 'string' ? JSON.parse(record.skills) : record.skills;
        
        skillsMatch = {};
        if (Array.isArray(jobSkills)) {
          jobSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            const isMatched = Array.isArray(candidateSkills) && 
              candidateSkills.some(cs => cs.toLowerCase() === skillLower);
            skillsMatch[skill] = isMatched;
          });
        }
      }
      
      return {
        id: record.id,
        applicationId: record.applicationId,
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        phone: record.phone,
        location: record.location,
        currentTitle: record.currentTitle,
        currentCompany: record.currentCompany,
        experience: record.experience,
        education: record.education,
        skills: record.skills ? (typeof record.skills === 'string' ? JSON.parse(record.skills) : record.skills) : [],
        resumeUrl: record.applicationResumeUrl || record.resumeUrl,
        coverLetter: record.coverLetter,
        answers: answersByApplication[record.applicationId] || [],
        profileUrl: record.profileUrl,
        avatarUrl: record.avatarUrl,
        notes: record.notes,
        source: record.source,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        aiScore: record.aiScore,
        aiNotes: record.aiNotes,
        resumeMatch: record.resumeMatch,
        skillsMatch: skillsMatch,
        mismatchedSkills: record.mismatchedSkills,
        stage: record.stage,
        appliedDate: record.appliedDate,
        jobTitle: record.jobTitle,
        atsScore: record.aiScore,
        aiAnalysis: null
      };
    });
    
    // Apply search filters
    if (search) {
      const searchLower = search.toLowerCase();
      candidates = candidates.filter(candidate => {
        const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
        const position = candidate.currentTitle?.toLowerCase() || '';
        const company = candidate.currentCompany?.toLowerCase() || '';
        const email = candidate.email?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               position.includes(searchLower) ||
               company.includes(searchLower) ||
               email.includes(searchLower) ||
               (candidate.skills && candidate.skills.some(skill => 
                 skill.toLowerCase().includes(searchLower)
               ));
      });
    }
    
    if (experience) {
      const expNum = parseInt(experience, 10);
      candidates = candidates.filter(candidate => 
        candidate.experience && candidate.experience >= expNum
      );
    }
    
    res.json(candidates);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while retrieving candidates."
    });
  }
});

// Get candidates by date range
router.get('/by-date', authenticate, async (req, res) => {
  try {
    const { date, period = 'today' } = req.query;
    const userId = req.user.companyId;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        dateFilter.appliedDate = { [Op.between]: [startOfDay, endOfDay] };
        break;
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter.appliedDate = { [Op.gte]: startOfWeek };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter.appliedDate = { [Op.gte]: startOfMonth };
        break;
      case 'custom':
        if (date) {
          const targetDate = new Date(date);
          const startOfTargetDay = new Date(targetDate.setHours(0, 0, 0, 0));
          const endOfTargetDay = new Date(targetDate.setHours(23, 59, 59, 999));
          dateFilter.appliedDate = { [Op.between]: [startOfTargetDay, endOfTargetDay] };
        }
        break;
    }
    
    const applications = await db.application.findAll({
      include: [
        {
          model: Candidate,
          as: 'candidateProfile',
          required: true
        },
        {
          model: db.job,
          as: 'job',
          where: { companyId: userId },
          attributes: ['id', 'title']
        }
      ],
      where: dateFilter,
      order: [['appliedDate', 'DESC']]
    });
    
    const candidates = applications.map(app => ({
      ...app.candidateProfile.toJSON(),
      appliedDate: app.appliedDate,
      jobTitle: app.job.title,
      stage: app.stage,
      aiScore: app.aiScore
    }));
    
    res.json(candidates);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error retrieving candidates by date."
    });
  }
});

// Find a single Candidate by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Candidate.findByPk(id);
    
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({
        message: `Candidate with id=${id} was not found.`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error retrieving Candidate with id=${req.params.id}`
    });
  }
});

// Update a Candidate by id
router.put('/:id', authenticate, validate(candidateValidationRules.update), async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Candidate.update(req.body, {
      where: { id: id }
    });

    if (num == 1) {
      res.json({
        message: "Candidate was updated successfully."
      });
    } else {
      res.status(404).json({
        message: `Cannot update Candidate with id=${id}. Maybe Candidate was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error updating Candidate with id=${req.params.id}`
    });
  }
});


// Update AI Analysis for a Candidate
router.put('/:id/ai-analysis', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const { atsScore, aiAnalysis } = req.body;
    
    const updateData = {};
    if (atsScore !== undefined) updateData.atsScore = atsScore;
    if (aiAnalysis !== undefined) updateData.aiAnalysis = aiAnalysis;
    
    const num = await Candidate.update(updateData, {
      where: { id: id }
    });

    if (num == 1) {
      res.json({
        message: "Candidate AI analysis updated successfully."
      });
    } else {
      res.status(404).json({
        message: `Cannot update Candidate with id=${id}. Maybe Candidate was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error updating AI analysis for Candidate with id=${req.params.id}`
    });
  }
});

// Delete a Candidate by id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const num = await Candidate.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.json({
        message: "Candidate was deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete Candidate with id=${id}. Maybe Candidate was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Could not delete Candidate with id=${req.params.id}`
    });
  }
});

// GET /api/candidates/:id/notes — get notes for a candidate
router.get('/:id/notes', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Notes are stored as JSON array in the candidate's notes field
    let notes = [];
    if (candidate.notes) {
      try {
        notes = JSON.parse(candidate.notes);
        if (!Array.isArray(notes)) {
          // Legacy plain-text note — wrap it
          notes = [{ id: 1, text: candidate.notes, createdAt: candidate.updatedAt, author: 'System' }];
        }
      } catch {
        // Plain text note
        notes = [{ id: 1, text: candidate.notes, createdAt: candidate.updatedAt, author: 'System' }];
      }
    }

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error retrieving candidate notes' });
  }
});

// POST /api/candidates/:id/notes — add a note to a candidate
router.post('/:id/notes', authenticate, async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    // Parse existing notes
    let notes = [];
    if (candidate.notes) {
      try {
        notes = JSON.parse(candidate.notes);
        if (!Array.isArray(notes)) {
          notes = [{ id: 1, text: candidate.notes, createdAt: candidate.updatedAt, author: 'System' }];
        }
      } catch {
        notes = [{ id: 1, text: candidate.notes, createdAt: candidate.updatedAt, author: 'System' }];
      }
    }

    const newNote = {
      id: notes.length > 0 ? Math.max(...notes.map(n => n.id || 0)) + 1 : 1,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      author: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Unknown'
    };

    notes.push(newNote);
    await candidate.update({ notes: JSON.stringify(notes) });

    res.status(201).json({ success: true, note: newNote });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error adding candidate note' });
  }
});

module.exports = router;