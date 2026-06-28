module.exports = (sequelize, DataTypes) => {
  const AIVideoInterview = sequelize.define('ai_video_interview', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id'
    },
    candidateEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'candidate_email'
    },
    candidateName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'candidate_name'
    },
    jobTitle: {
      type: DataTypes.STRING(255),
      field: 'job_title'
    },
    role: {
      type: DataTypes.STRING(255),
      field: 'role'
    },
    skills: {
      type: DataTypes.TEXT,
      field: 'skills'
    },
    experienceLevel: {
      type: DataTypes.STRING(100),
      field: 'experience_level'
    },
    difficulty: {
      type: DataTypes.STRING(100),
      field: 'difficulty'
    },
    questions: {
      type: DataTypes.TEXT,
      field: 'questions'
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'expired'),
      defaultValue: 'pending'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    }
  }, {
    tableName: 'ai_video_interviews',
    timestamps: true,
    underscored: true
  });

  AIVideoInterview.associate = (models) => {
    AIVideoInterview.belongsTo(models.user, { foreignKey: 'companyId', as: 'company' });
    AIVideoInterview.hasOne(models.ai_video_interview_result, { foreignKey: 'interviewId', as: 'result' });
    AIVideoInterview.hasMany(models.ai_video_interview_response, { foreignKey: 'interviewId', as: 'responses' });
  };

  return AIVideoInterview;
};
