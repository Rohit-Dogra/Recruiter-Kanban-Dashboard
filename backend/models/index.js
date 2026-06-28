const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

// Initialize Sequelize with MySQL configuration
const sequelize = new Sequelize(
  dbConfig.development.database,
  dbConfig.development.username,
  dbConfig.development.password, 
  {
    host: dbConfig.development.host,
    dialect: dbConfig.development.dialect,
    operatorsAliases: 0,
    // SQL logging controlled by DEBUG_SQL env var (set to 'true' to enable)
    logging: process.env.DEBUG_SQL === 'true' ? (msg) => console.log(msg) : false,
    pool: {
      max: dbConfig.development.pool.max,
      min: dbConfig.development.pool.min,
      acquire: dbConfig.development.pool.acquire,
      idle: dbConfig.development.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.user = require('./user.model.js')(sequelize, Sequelize);
db.job = require('./job.model.js')(sequelize, Sequelize);
db.candidate = require('./candidate.model.js')(sequelize, Sequelize);
db.application = require('./application.model.js')(sequelize, Sequelize);
db.interview = require('./interview.model.js')(sequelize, Sequelize);
db.application_answer = require('./application_answer.model.js')(sequelize, Sequelize);
db.company = require('./company.model.js')(sequelize, Sequelize.DataTypes);
db.phone_screening = require('./phone_screening.model.js')(sequelize, Sequelize);
db.phone_screening_details = require('./phone_screening_details.model.js')(sequelize, Sequelize);
db.ai_video_interview = require('./ai_video_interview.model.js')(sequelize, Sequelize);
db.ai_video_interview_result = require('./ai_video_interview_result.model.js')(sequelize, Sequelize);
db.ai_video_interview_response = require('./ai_video_interview_response.model.js')(sequelize, Sequelize);
db.pipeline_stage = require('./pipeline_stage.model.js')(sequelize, Sequelize);
db.subscription_plan = require('./subscription_plan.model.js')(sequelize, Sequelize);
db.company_member = require('./company_member.model.js')(sequelize, Sequelize);
db.user_trial = require('./user_trial.model.js')(sequelize, Sequelize);
db.user_subscription = require('./user_subscription.model.js')(sequelize, Sequelize);
db.payment_transaction = require('./payment_transaction.model.js')(sequelize, Sequelize);
db.OfferLetter = require('./offer_letter.model.js')(sequelize, Sequelize);
db.OfferLetterEnhanced = require('./offer_letter_enhanced.model.js')(sequelize, Sequelize);
db.screening_question = require('./screening_question.model.js')(sequelize, Sequelize);
db.notification = require('./notification.model.js')(sequelize, Sequelize);
db.conversation = require('./conversation.model.js')(sequelize, Sequelize);
db.message = require('./message.model.js')(sequelize, Sequelize);
db.demo_booking = require('./demo_booking.model.js')(sequelize, Sequelize);


// Define relationships
db.user.hasMany(db.job, { 
  foreignKey: 'companyId',
  as: 'jobs' 
});
db.user.hasMany(db.application, {
  foreignKey: 'candidateId',
  as: 'applications'
});
db.job.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'companyUser'
});

// Candidate relationships - applications.candidateId stores users.id,
// and candidates.candidate_id also stores users.id, so join on candidate_id
db.candidate.hasMany(db.application, {
  foreignKey: 'candidateId',
  sourceKey: 'candidate_id',
  as: 'applications'
});
// Job relationships
db.job.hasMany(db.application, { 
  foreignKey: 'jobId',
  as: 'applications' 
});
db.job.hasMany(db.screening_question, { foreignKey: 'jobId', as: 'screeningQuestions' });

// Application relationships - applications.candidateId stores users.id,
// match with candidates.candidate_id (also users.id)
db.application.belongsTo(db.candidate, {
  foreignKey: 'candidateId',
  targetKey: 'candidate_id',
  as: 'candidateProfile'
});
// Alias for eager loading in application listing routes
db.application.belongsTo(db.candidate, {
  foreignKey: 'candidateId',
  targetKey: 'candidate_id',
  as: 'candidateRecord'
});
db.application.belongsTo(db.user, {
  foreignKey: 'candidateId',
  as: 'candidate'
});
db.application.belongsTo(db.job, {
  foreignKey: 'jobId',
  as: 'job'
});
db.application.hasMany(db.interview, {
  foreignKey: 'applicationId',
  as: 'interviews'
});
db.application.hasMany(db.application_answer, {
  foreignKey: 'applicationId',
  as: 'answers'
});

// Interview relationships
db.interview.belongsTo(db.application, {
  foreignKey: 'applicationId',
  as: 'application'
});
db.interview.belongsTo(db.user, {
  foreignKey: 'interviewerId',
  as: 'interviewer'
});

// Application answer relationships
db.application_answer.belongsTo(db.application, {
  foreignKey: 'applicationId',
  as: 'application'
});

// Screening questions (phone screening per job)
db.screening_question.belongsTo(db.job, { foreignKey: 'jobId', as: 'job' });
db.screening_question.belongsTo(db.user, { foreignKey: 'companyId', as: 'company' });
db.user.hasMany(db.screening_question, { foreignKey: 'companyId', as: 'screeningQuestions' });

// Phone screening relationships
db.phone_screening.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});
db.phone_screening.belongsTo(db.user, {
  foreignKey: 'candidateId',
  as: 'candidate'
});
db.user.hasMany(db.phone_screening, {
  foreignKey: 'companyId',
  as: 'phoneScreenings'
});

// Phone screening details relationships
db.phone_screening_details.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});
db.user.hasMany(db.phone_screening_details, {
  foreignKey: 'companyId',
  as: 'phoneScreeningDetails'
});

// AI Video Interview relationships
db.ai_video_interview.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});
db.ai_video_interview.hasOne(db.ai_video_interview_result, {
  foreignKey: 'interviewId',
  as: 'result'
});
db.ai_video_interview.hasMany(db.ai_video_interview_response, {
  foreignKey: 'interviewId',
  as: 'responses'
});
db.ai_video_interview_result.belongsTo(db.ai_video_interview, {
  foreignKey: 'interviewId',
  as: 'interview'
});
db.ai_video_interview_response.belongsTo(db.ai_video_interview, {
  foreignKey: 'interviewId',
  as: 'interview'
});
db.user.hasMany(db.ai_video_interview, {
  foreignKey: 'companyId',
  as: 'aiVideoInterviews'
});
// Subscription relationships
db.subscription_plan.hasMany(db.user_subscription, {
  foreignKey: 'planId',
  as: 'subscriptions'
});
db.user_subscription.belongsTo(db.subscription_plan, {
  foreignKey: 'planId',
  as: 'plan'
});
db.user.hasOne(db.user_trial, {
  foreignKey: 'userId',
  as: 'trial'
});
db.user_trial.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user'
});
db.user.hasMany(db.user_subscription, {
  foreignKey: 'userId',
  as: 'subscriptions'
});
db.user_subscription.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user'
});

db.user.hasMany(db.company_member, { foreignKey: 'companyOwnerId', as: 'teamMembers' });
db.user.hasMany(db.company_member, { foreignKey: 'userId', as: 'memberships' });
db.company_member.belongsTo(db.user, { foreignKey: 'companyOwnerId', as: 'owner' });
db.company_member.belongsTo(db.user, { foreignKey: 'userId', as: 'member' });
db.user.hasMany(db.payment_transaction, { foreignKey: 'userId', as: 'payments' });
db.payment_transaction.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });
db.payment_transaction.belongsTo(db.subscription_plan, { foreignKey: 'planId', as: 'plan' });
db.subscription_plan.hasMany(db.payment_transaction, { foreignKey: 'planId', as: 'payments' });


// Pipeline stage relationships
db.user.hasMany(db.pipeline_stage, {
  foreignKey: 'companyId',
  as: 'pipelineStages'
});
db.pipeline_stage.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});

// Offer letter relationships
db.OfferLetter.belongsTo(db.application, {
  foreignKey: 'applicationId',
  as: 'application'
});
db.OfferLetter.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});
db.OfferLetter.belongsTo(db.user, {
  foreignKey: 'candidateId',
  as: 'candidate'
});
db.OfferLetter.belongsTo(db.job, {
  foreignKey: 'jobId',
  as: 'job'
});
db.application.hasOne(db.OfferLetter, {
  foreignKey: 'applicationId',
  as: 'offerLetter'
});

// Enhanced offer letter relationships
db.OfferLetterEnhanced.belongsTo(db.application, {
  foreignKey: 'applicationId',
  as: 'application'
});
db.OfferLetterEnhanced.belongsTo(db.user, {
  foreignKey: 'companyId',
  as: 'company'
});
db.OfferLetterEnhanced.belongsTo(db.user, {
  foreignKey: 'candidateId',
  as: 'candidate'
});
db.OfferLetterEnhanced.belongsTo(db.job, {
  foreignKey: 'jobId',
  as: 'job'
});
db.OfferLetterEnhanced.belongsTo(db.user, {
  foreignKey: 'createdBy',
  as: 'creator'
});
db.application.hasOne(db.OfferLetterEnhanced, {
  foreignKey: 'applicationId',
  as: 'offerLetterEnhanced'
});


// Notification relationships
db.user.hasMany(db.notification, {
  foreignKey: 'userId',
  as: 'notifications'
});
db.notification.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user'
});
db.notification.belongsTo(db.job, {
  foreignKey: 'jobId',
  as: 'job'
});
db.notification.belongsTo(db.candidate, {
  foreignKey: 'candidateId',
  as: 'candidate'
});
db.notification.belongsTo(db.application, {
  foreignKey: 'applicationId',
  as: 'application'
});

// Conversation relationships
db.conversation.belongsTo(db.user, { foreignKey: 'companyUserId', as: 'companyUser' });
db.conversation.belongsTo(db.user, { foreignKey: 'candidateUserId', as: 'candidateUser' });
db.conversation.belongsTo(db.job, { foreignKey: 'jobId', as: 'job' });
db.conversation.hasMany(db.message, { foreignKey: 'conversationId', as: 'messages' });

// Message relationships
db.message.belongsTo(db.conversation, { foreignKey: 'conversationId', as: 'conversation' });
db.message.belongsTo(db.user, { foreignKey: 'senderId', as: 'sender' });

module.exports = db;
