module.exports = (sequelize, DataTypes) => {
  const AIVideoInterviewResult = sequelize.define('ai_video_interview_result', {
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
    transcript: {
      type: DataTypes.TEXT
    },
    aiFeedback: {
      type: DataTypes.TEXT,
      field: 'ai_feedback'
    },
    technicalScore: {
      type: DataTypes.DECIMAL(3, 1),
      field: 'technical_score'
    },
    communicationScore: {
      type: DataTypes.DECIMAL(3, 1),
      field: 'communication_score'
    },
    overallScore: {
      type: DataTypes.DECIMAL(3, 1),
      field: 'overall_score'
    },
    videoDuration: {
      type: DataTypes.INTEGER,
      field: 'video_duration'
    }
  }, {
    tableName: 'ai_video_interview_results',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  AIVideoInterviewResult.associate = (models) => {
    AIVideoInterviewResult.belongsTo(models.ai_video_interview, { foreignKey: 'interviewId', as: 'interview' });
  };

  return AIVideoInterviewResult;
};
