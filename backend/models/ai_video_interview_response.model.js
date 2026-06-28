module.exports = (sequelize, DataTypes) => {
  const AIVideoInterviewResponse = sequelize.define('ai_video_interview_response', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'interview_id'
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'question_number'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    responseText: {
      type: DataTypes.TEXT,
      field: 'response_text'
    },
    responseVideoUrl: {
      type: DataTypes.STRING(500),
      field: 'response_video_url'
    },
    skillScores: {
      type: DataTypes.JSON,
      field: 'skill_scores'
    },
    evaluation: {
      type: DataTypes.TEXT
    },
    score: {
      type: DataTypes.DECIMAL(3, 1)
    }
  }, {
    tableName: 'ai_video_interview_responses',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  AIVideoInterviewResponse.associate = (models) => {
    AIVideoInterviewResponse.belongsTo(models.ai_video_interview, { foreignKey: 'interviewId', as: 'interview' });
  };

  return AIVideoInterviewResponse;
};
