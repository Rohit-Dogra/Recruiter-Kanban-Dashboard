const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/conversations - list conversations for the current user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await db.conversation.findAll({
      where: {
        [Op.or]: [
          { companyUserId: userId },
          { candidateUserId: userId }
        ]
      },
      include: [
        { model: db.user, as: 'companyUser', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: db.user, as: 'candidateUser', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: db.job, as: 'job', attributes: ['id', 'title'], required: false },
        {
          model: db.message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'content', 'messageType', 'senderId', 'createdAt', 'readAt']
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Compute unread count for the requesting user
    const result = conversations.map(conv => {
      const c = conv.toJSON();
      const isCompany = c.companyUserId === userId;
      const otherUser = isCompany ? c.candidateUser : c.companyUser;
      const unreadCount = isCompany ? c.companyUnread : c.candidateUnread;
      const lastMessage = c.messages && c.messages[0] ? c.messages[0] : null;
      return {
        id: c.id,
        otherUser,
        job: c.job,
        lastMessage,
        unreadCount,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt
      };
    });

    res.json({ conversations: result });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// GET /api/conversations/:id/messages - get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { before, limit = 50 } = req.query;

    // Verify user is part of this conversation
    const conversation = await db.conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { companyUserId: userId },
          { candidateUserId: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const whereClause = { conversationId };
    if (before) {
      whereClause.createdAt = { [Op.lt]: new Date(before) };
    }

    const messages = await db.message.findAll({
      where: whereClause,
      include: [
        { model: db.user, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit)
    });

    // Mark unread messages from the other user as read
    const isCompany = conversation.companyUserId === userId;
    await db.message.update(
      { readAt: new Date() },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          readAt: null
        }
      }
    );

    // Reset unread count for this user
    if (isCompany) {
      await conversation.update({ companyUnread: 0 });
    } else {
      await conversation.update({ candidateUnread: 0 });
    }

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST /api/conversations/:id/messages - send a message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { content, messageType = 'text', fileUrl, fileName } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify user is part of this conversation
    const conversation = await db.conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { companyUserId: userId },
          { candidateUserId: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create the message
    const message = await db.message.create({
      conversationId,
      senderId: userId,
      content: content.trim(),
      messageType,
      fileUrl: fileUrl || null,
      fileName: fileName || null
    });

    // Update conversation metadata
    const isCompany = conversation.companyUserId === userId;
    const updateData = { lastMessageAt: new Date() };
    if (isCompany) {
      updateData.candidateUnread = db.sequelize.literal('candidateUnread + 1');
    } else {
      updateData.companyUnread = db.sequelize.literal('companyUnread + 1');
    }
    await conversation.update(updateData);

    // Reload with sender info
    const fullMessage = await db.message.findByPk(message.id, {
      include: [
        { model: db.user, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }
      ]
    });

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      const recipientId = isCompany ? conversation.candidateUserId : conversation.companyUserId;
      io.to(`user_${recipientId}`).emit('new_message', {
        message: fullMessage.toJSON(),
        conversationId
      });
    }

    res.status(201).json({ message: fullMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// POST /api/conversations - create or get existing conversation
router.post('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { candidateUserId, companyUserId, jobId } = req.body;

    // Determine the other user based on who is creating
    const userType = req.user.userType;
    let finalCompanyUserId, finalCandidateUserId;

    if (userType === 'company') {
      finalCompanyUserId = userId;
      finalCandidateUserId = candidateUserId;
    } else {
      finalCandidateUserId = userId;
      finalCompanyUserId = companyUserId;
    }

    if (!finalCompanyUserId || !finalCandidateUserId) {
      return res.status(400).json({ message: 'Both company and candidate user IDs are required' });
    }

    // Find or create conversation (unique constraint on company+candidate+job)
    const [conversation, created] = await db.conversation.findOrCreate({
      where: {
        companyUserId: finalCompanyUserId,
        candidateUserId: finalCandidateUserId,
        jobId: jobId || null
      },
      defaults: {
        companyUserId: finalCompanyUserId,
        candidateUserId: finalCandidateUserId,
        jobId: jobId || null
      }
    });

    const fullConversation = await db.conversation.findByPk(conversation.id, {
      include: [
        { model: db.user, as: 'companyUser', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: db.user, as: 'candidateUser', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'userType'] },
        { model: db.job, as: 'job', attributes: ['id', 'title'], required: false }
      ]
    });

    res.status(created ? 201 : 200).json({ conversation: fullConversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id/messages/since - fetch messages since a timestamp (for reconnect)
router.get('/conversations/:id/messages/since', async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { since } = req.query;

    if (!since) {
      return res.status(400).json({ message: 'since timestamp is required' });
    }

    const conversation = await db.conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { companyUserId: userId },
          { candidateUserId: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await db.message.findAll({
      where: {
        conversationId,
        createdAt: { [Op.gt]: new Date(since) }
      },
      include: [
        { model: db.user, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching missed messages:', error);
    res.status(500).json({ message: 'Failed to fetch missed messages' });
  }
});

module.exports = router;
