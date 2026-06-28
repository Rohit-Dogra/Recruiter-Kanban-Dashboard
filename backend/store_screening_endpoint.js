// Add this to phone-screening.js routes

// Create new phone screening when call is initiated
router.post('/', authenticate, async (req, res) => {
  try {
    const companyId = req.user.id;
    const { candidateName, candidatePhone, position, bolnaCallId, scheduledAt } = req.body;
    
    // Store minimal data when call is initiated
    const screening = await db.phone_screening.create({
      companyId,
      candidateName,
      candidatePhone,
      position,
      bolnaCallId,
      status: 'scheduled',
      scheduledAt: scheduledAt || new Date()
    });
    
    res.status(201).json({
      success: true,
      screening: {
        id: screening.id,
        bolnaCallId: screening.bolnaCallId,
        status: screening.status
      }
    });
  } catch (error) {
    console.error('Error creating phone screening:', error);
    res.status(500).json({ message: 'Error creating phone screening' });
  }
});