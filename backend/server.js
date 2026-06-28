require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./models');
const authRoutes = require('./routes/auth');
const candidateAuthRoutes = require('./routes/candidate-auth');
const unifiedAuthRoutes = require('./routes/unified-auth');
const jobRoutes = require('./routes/job');
const candidateRoutes = require('./routes/candidate');
const applicationRoutes = require('./routes/application');
const interviewRoutes = require('./routes/interview');
const companyRoutes = require('./routes/company');
const dashboardRoutes = require('./routes/dashboard');
const emailRoutes = require('./routes/email');
const uploadRoutes = require('./routes/upload');
const callRoutes = require('./routes/calls');
const phoneScreeningRoutes = require('./routes/phone-screening');
const aiVideoInterviewRoutes = require('./routes/ai-video-interview');
const subscriptionRoutes = require('./routes/subscription');
const paymentRoutes = require('./routes/payment');
const teamRoutes = require('./routes/team');
const { errorHandler } = require('./middleware/error.middleware');
const legacyResumeMiddleware = require('./middleware/legacyResume.middleware');
const { authLimiter, aiLimiter, emailLimiter, uploadLimiter } = require('./middleware/rateLimit.middleware');
const { sanitizeInput } = require('./middleware/sanitize.middleware');
const pipelineRoutes = require('./routes/pipeline');
const screeningQuestionsRoutes = require('./routes/screening-questions');
const aiRoute = require("./routes/ai.route");
const offerLetterRoutes = require('./routes/offer-letters');
const notificationRoutes = require('./routes/notification');
const publicRoutes = require('./routes/public');
const searchRoutes = require('./routes/search');
const analyticsExportRoutes = require('./routes/analytics-export');
const messagesRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle legacy resume file paths
app.use(legacyResumeMiddleware);

// Serve static files for uploads
const uploadsDir = '/tmp/uploads';
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  console.log('Using uploads directory:', uploadsDir);
  app.use('/uploads', express.static(uploadsDir));
} catch (error) {
  console.error('Failed to create uploads directory:', error.message);
  console.log('File uploads will be disabled');
}

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/candidate-auth', authLimiter, candidateAuthRoutes);
app.use('/api/unified-auth', authLimiter, unifiedAuthRoutes);
app.use('/api/jobs', sanitizeInput, jobRoutes);
app.use('/api/candidates', sanitizeInput, candidateRoutes);
app.use('/api/applications', sanitizeInput, applicationRoutes);
app.use('/api/interviews', sanitizeInput, interviewRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailLimiter, sanitizeInput, emailRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/calls', aiLimiter, callRoutes);
app.use('/api/phone-screening', phoneScreeningRoutes);
app.use('/api/ai-video-interviews', aiLimiter, aiVideoInterviewRoutes);
app.use('/api/pipeline', sanitizeInput, pipelineRoutes);
app.use('/api/screening-questions', screeningQuestionsRoutes);
app.use("/api/ai", aiLimiter, aiRoute);
app.use('/api/offer-letters', sanitizeInput, offerLetterRoutes);
app.use('/api/candidate/offer-letters', offerLetterRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsExportRoutes);
app.use('/api', sanitizeInput, messagesRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HirerMind API' });
});

// Error handling middleware
app.use(errorHandler);

// Database sync and server start
const syncOptions = { 
  alter: process.env.NODE_ENV === 'development',
  force: process.env.FORCE_DB_SYNC === 'true',
  logging: false 
};

const shouldSync = process.env.NODE_ENV === 'development' && process.env.SKIP_DB_SYNC !== 'true';
logger.debug(`SKIP_DB_SYNC=${process.env.SKIP_DB_SYNC}, shouldSync=${shouldSync}`);

// Start the server function
const startServer = () => {
  // Start periodic cleanup for local offer letter files
  try {
    const { offerLetterCleanup } = require('./utils/offer-letter-cleanup');
    offerLetterCleanup.startPeriodicCleanup();
  } catch (cleanupError) {
    logger.warn('Failed to start offer letter cleanup service:', cleanupError.message);
  }

  // Start scheduled jobs (subscription reset, job expiration, etc.)
  try {
    const schedulerService = require('./services/scheduler.service');
    schedulerService.start();
  } catch (schedulerError) {
    logger.warn('Failed to start scheduler service:', schedulerError.message);
  }

  // Start Bolna webhook queue worker (checks Redis version first)
  try {
    const queueService = require('./services/queue.service');
    queueService.checkRedisVersion().then(() => {
      queueService.startWebhookWorker();
      queueService.startATSWorker();
    }).catch(err => {
      logger.warn('Redis check failed, queue workers disabled:', err.message);
    });
  } catch (queueError) {
    logger.warn('Failed to start queue workers:', queueError.message);
  }

  // Create HTTP server and attach Socket.IO
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Make io accessible to routes
  app.set('io', io);

  // Socket.IO JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.userType;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: user ${userId}`);

    // Join user-specific room for targeted messages
    socket.join(`user_${userId}`);

    // Handle send_message event
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', fileUrl, fileName } = data;
        const { Op } = require('sequelize');

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
          socket.emit('error_message', { error: 'Conversation not found' });
          return;
        }

        const message = await db.message.create({
          conversationId,
          senderId: userId,
          content: content.trim(),
          messageType,
          fileUrl: fileUrl || null,
          fileName: fileName || null
        });

        const isCompany = conversation.companyUserId === userId;
        const updateData = { lastMessageAt: new Date() };
        if (isCompany) {
          updateData.candidateUnread = db.sequelize.literal('candidateUnread + 1');
        } else {
          updateData.companyUnread = db.sequelize.literal('companyUnread + 1');
        }
        await conversation.update(updateData);

        const fullMessage = await db.message.findByPk(message.id, {
          include: [
            { model: db.user, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] }
          ]
        });

        const messageData = { message: fullMessage.toJSON(), conversationId };

        // Send to sender for confirmation
        socket.emit('new_message', messageData);

        // Send to recipient
        const recipientId = isCompany ? conversation.candidateUserId : conversation.companyUserId;
        socket.to(`user_${recipientId}`).emit('new_message', messageData);
      } catch (error) {
        logger.error('Socket send_message error:', error);
        socket.emit('error_message', { error: 'Failed to send message' });
      }
    });

    // Handle mark_read event
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;
        const { Op } = require('sequelize');

        const conversation = await db.conversation.findOne({
          where: {
            id: conversationId,
            [Op.or]: [
              { companyUserId: userId },
              { candidateUserId: userId }
            ]
          }
        });

        if (!conversation) return;

        // Mark all messages from the other user as read
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

        const isCompany = conversation.companyUserId === userId;
        if (isCompany) {
          await conversation.update({ companyUnread: 0 });
        } else {
          await conversation.update({ candidateUnread: 0 });
        }

        // Notify the other user that messages were read
        const recipientId = isCompany ? conversation.candidateUserId : conversation.companyUserId;
        socket.to(`user_${recipientId}`).emit('messages_read', { conversationId, readBy: userId });
      } catch (error) {
        logger.error('Socket mark_read error:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.broadcast.emit('user_typing', {
        conversationId,
        userId,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${userId}`);
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    logger.info(`Server is running on port ${PORT}`);
  });
  global.server = server;
};

// Test database connection with timeout
const testDatabaseConnection = async () => {
  try {
    await Promise.race([
      db.sequelize.authenticate(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ]);
    logger.info('Database connection established successfully');
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    return false;
  }
};

// Start server with or without database
if (shouldSync) {
  logger.info('Syncing database schema...');
  testDatabaseConnection()
    .then(connected => {
      if (connected) {
        return db.sequelize.sync(syncOptions);
      } else {
        logger.warn('Starting server without database sync due to connection failure');
        return Promise.resolve();
      }
    })
    .then(() => {
      logger.info('Database sync completed or skipped');
      startServer();
    })
    .catch(err => {
      logger.error('Database sync failed, starting server anyway:', err.message);
      startServer();
    });
} else {
  testDatabaseConnection()
    .then(connected => {
      if (connected) {
        logger.info('Database connection verified');
      } else {
        logger.warn('Starting server without database connection');
      }
      startServer();
    })
    .catch(() => {
      logger.warn('Starting server without database connection');
      startServer();
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  if (global.server) {
    global.server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Shut down queue service
  try {
    const queueService = require('./services/queue.service');
    queueService.shutdown();
  } catch (e) { /* ignore */ }
  if (global.server) {
    global.server.close(() => {
      logger.info('Process terminated');
    });
  } else {
    logger.info('Process terminated');
  }
});
