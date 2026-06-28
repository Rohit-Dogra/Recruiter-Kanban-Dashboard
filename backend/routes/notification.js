const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

// Get unread notification count for authenticated user
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId || req.user.id;
    const count = await db.notification.count({
      where: { userId: userId, read: false }
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Get all notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId || req.user.id;
    
    const notifications = await db.notification.findAll({
      where: { userId: userId },
      include: [
        {
          model: db.job,
          as: 'job',
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: db.candidate,
          as: 'candidate',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        },
        {
          model: db.application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// Get candidate notifications by email
router.get('/candidate/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const candidate = await db.candidate.findOne({ where: { email } });
    if (!candidate) {
      return res.json([]);
    }

    const notifications = await db.notification.findAll({
      where: { candidateId: candidate.id },
      include: [
        {
          model: db.job,
          as: 'job',
          attributes: ['id', 'title', 'company'],
          required: false
        },
        {
          model: db.application,
          as: 'application',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching candidate notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await db.notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Only decrement unread count if notification was previously unread
    if (notification.read) {
      return res.json(notification);
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark candidate notification as read
router.patch('/candidate/:id/read', async (req, res) => {
  try {
    const notification = await db.notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId || req.user.id;
    await db.notification.update(
      { read: true },
      { where: { userId: userId, read: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId || req.user.id;
    const deleted = await db.notification.destroy({
      where: { id: req.params.id, userId: userId }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Clear all notifications
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId || req.user.id;
    await db.notification.destroy({
      where: { userId: userId }
    });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

module.exports = router;
